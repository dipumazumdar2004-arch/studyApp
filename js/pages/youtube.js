import { db, auth } from '../firebase/config.js';
import { 
  subscribeToVideos, 
  addVideo, 
  updateVideoStatus, 
  addCommentToVideo, 
  deleteVideo, 
  triggerNotification 
} from '../firebase/db.js';
import { fetchYoutubeMetadata } from '../utils/youtube-api.js';

export function renderYoutubeLibrary() {
  const container = document.getElementById('page-youtube');
  if (!container) return;

  const currentUser = localStorage.getItem('studysync_user') || 'User';

  container.innerHTML = `
    <div class="youtube-actions">
      <div class="search-filters-row">
        <input type="text" id="youtube-search" class="form-input" placeholder="Search by video, channel, tags...">
        <select id="youtube-filter-subject" class="form-input" style="max-width: 180px;">
          <option value="all">All Subjects</option>
          <option value="Quantitative Aptitude">Quantitative Aptitude</option>
          <option value="Reasoning">Reasoning</option>
          <option value="English Language">English Language</option>
          <option value="General Awareness">General Awareness</option>
          <option value="Other">Other</option>
        </select>
        <select id="youtube-filter-status" class="form-input" style="max-width: 140px;">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="watched">Watched</option>
          <option value="favorite">Favorites</option>
          <option value="important">Important</option>
        </select>
      </div>
      <button id="btn-open-addvideo" class="btn btn-primary"><i class="fa-solid fa-plus"></i>Add Study Video</button>
    </div>

    <!-- Active tags selected row -->
    <div id="youtube-active-tags-row" style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;"></div>

    <div class="video-grid" id="youtube-video-grid">
      <!-- Loaded dynamically -->
      <div class="skeleton skeleton-card"></div>
      <div class="skeleton skeleton-card"></div>
      <div class="skeleton skeleton-card"></div>
    </div>
  `;

  // Attach modal triggers
  document.getElementById('btn-open-addvideo').addEventListener('click', () => {
    document.getElementById('modal-add-video').classList.add('active');
  });

  // Attach filters triggers
  const searchInput = document.getElementById('youtube-search');
  const subjectFilter = document.getElementById('youtube-filter-subject');
  const statusFilter = document.getElementById('youtube-filter-status');

  let rawVideos = [];

  const applyFilters = () => {
    const query = searchInput.value.toLowerCase();
    const sub = subjectFilter.value;
    const stat = statusFilter.value;

    const filtered = rawVideos.filter(v => {
      // Search match
      const titleMatch = v.title.toLowerCase().includes(query);
      const chanMatch = v.channel.toLowerCase().includes(query);
      const tagsMatch = v.tags ? v.tags.some(t => t.toLowerCase().includes(query)) : false;
      const matchesSearch = titleMatch || chanMatch || tagsMatch;

      // Subject match
      const matchesSubject = sub === 'all' || v.subject === sub;

      // Status match
      let matchesStatus = true;
      const myStatus = v.userStatus && v.userStatus[currentUser];
      if (stat === 'pending') {
        matchesStatus = !myStatus || myStatus.status === 'pending';
      } else if (stat === 'watched') {
        matchesStatus = myStatus && myStatus.status === 'watched';
      } else if (stat === 'favorite') {
        matchesStatus = myStatus && myStatus.isFavorite;
      } else if (stat === 'important') {
        matchesStatus = myStatus && myStatus.isImportant;
      }

      return matchesSearch && matchesSubject && matchesStatus;
    });

    renderVideoGrid(filtered, currentUser);
  };

  searchInput.addEventListener('input', applyFilters);
  subjectFilter.addEventListener('change', applyFilters);
  statusFilter.addEventListener('change', applyFilters);

  // Real-time listener
  subscribeToVideos((videos) => {
    rawVideos = videos;
    applyFilters();
  });

  // Attach Form Submit
  const addVideoForm = document.getElementById('form-add-video');
  const addVideoModal = document.getElementById('modal-add-video');

  addVideoForm.onsubmit = async (e) => {
    e.preventDefault();
    const url = document.getElementById('video-url').value;
    const subject = document.getElementById('video-subject').value;
    const tagsString = document.getElementById('video-tags').value;
    
    const submitBtn = addVideoForm.querySelector('button[type=submit]');
    submitBtn.innerText = "Fetching details...";
    submitBtn.disabled = true;

    try {
      const apiKey = localStorage.getItem('studysync_yt_api_key');
      const meta = await fetchYoutubeMetadata(url, apiKey);
      
      const tags = tagsString
        ? tagsString.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0)
        : [];

      await addVideo({
        ...meta,
        subject,
        tags,
        addedBy: currentUser
      });

      // Send trigger notification
      await triggerNotification(
        'video_upload',
        currentUser,
        'New Shared Video',
        `${currentUser} added "${meta.title.slice(0, 40)}..." under ${subject}.`
      );

      // Reset
      addVideoForm.reset();
      addVideoModal.classList.remove('active');
      showToast('Video added successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to add video.', 'error');
    } finally {
      submitBtn.innerText = "Fetch & Import Video";
      submitBtn.disabled = false;
    }
  };
}

function renderVideoGrid(videos, currentUser) {
  const grid = document.getElementById('youtube-video-grid');
  if (!grid) return;

  if (videos.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 50px 0;">
        <i class="fa-brands fa-youtube" style="font-size: 48px; color: var(--text-muted); margin-bottom: 16px;"></i>
        <h3 style="font-family: var(--font-header);">No study videos match your filters</h3>
        <p style="margin-top: 8px;">Try adjusting search terms or add a new link to study together.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = videos.map(v => {
    const myStatus = v.userStatus?.[currentUser] || { status: 'pending', isFavorite: false, isImportant: false };
    const partnerName = currentUser === 'Dipu' ? 'Meghali' : 'Dipu';
    const partnerStatus = v.userStatus?.[partnerName] || { status: 'pending', isFavorite: false, isImportant: false };

    const tagsHtml = v.tags ? v.tags.map(t => `<span class="badge" style="background: rgba(255,255,255,0.05); color: var(--text-secondary); font-size: 9px; padding: 2px 6px;">#${t}</span>`).join('') : '';

    return `
      <div class="video-card glass-panel" id="video-${v.id}">
        <div class="video-thumbnail-wrapper">
          <img class="video-thumbnail" src="${v.thumbnail}" alt="${v.title}">
          <span class="video-duration">${v.duration}</span>
        </div>
        <div class="video-info-box">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
            <span class="badge badge-${v.subject.toLowerCase().replace(/ /g, '')}">${v.subject}</span>
            <span style="font-size: 10px; color: var(--text-muted); font-weight: 500;">Added ${v.uploadedAt || 'recently'}</span>
          </div>
          <h4 class="video-title">${v.title}</h4>
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${v.channel}</span>

          <!-- Partner Status Tracker Indicator -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px; font-size: 11px; background: rgba(255,255,255,0.02); padding: 8px; border-radius: var(--radius-sm);">
            <span style="color: var(--text-secondary);">Partner Status (${partnerName}):</span>
            <span style="font-weight: 700; color: ${partnerStatus.status === 'watched' ? 'var(--color-success)' : 'var(--color-warning)'}">
              ${partnerStatus.status === 'watched' ? 'Watched' : 'Pending'}
            </span>
          </div>

          <div class="video-tags-row">
            ${tagsHtml}
          </div>
        </div>

        <!-- Inline Notes/Comments Drawer Toggle buttons -->
        <div style="display: flex; border-top: 1px solid var(--panel-border); padding: 8px 16px; gap: 12px; background: rgba(0,0,0,0.1); justify-content: space-around;">
          <button class="video-action-icon-btn btn-toggle-notes" title="Study Notes" style="font-size: 13px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-file-pen"></i> Notes
          </button>
          <button class="video-action-icon-btn btn-toggle-comments" title="Comments thread" style="font-size: 13px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-comments"></i> Chat (${v.comments ? v.comments.length : 0})
          </button>
        </div>

        <!-- Video Card Options -->
        <div class="video-card-actions">
          <button class="video-action-icon-btn btn-watch" title="Watch on YouTube"><i class="fa-solid fa-play" style="color: var(--color-success);"></i></button>
          
          <button class="video-action-icon-btn btn-favorite ${myStatus.isFavorite ? 'active' : ''}" title="Favorite"><i class="fa-solid fa-heart"></i></button>
          
          <button class="video-action-icon-btn btn-important ${myStatus.isImportant ? 'active' : ''}" title="Flag Important"><i class="fa-solid fa-bookmark"></i></button>
          
          <button class="video-action-icon-btn btn-watched" title="${myStatus.status === 'watched' ? 'Mark Pending' : 'Mark Watched'}">
            <i class="${myStatus.status === 'watched' ? 'fa-solid' : 'fa-regular'} fa-circle-check" style="${myStatus.status === 'watched' ? 'color: var(--color-success);' : ''}"></i>
          </button>

          <button class="video-action-icon-btn btn-delete" style="color: var(--color-error); opacity: 0.7;" title="Delete Video"><i class="fa-solid fa-trash"></i></button>
        </div>

        <!-- Notes Drawer (Collapsible) -->
        <div class="video-drawer-notes" style="display: none; padding: 16px; border-top: 1px solid var(--panel-border); background: rgba(0,0,0,0.15);">
          <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">PRIVATE STUDY NOTES</label>
          <textarea class="form-input textarea-notes" style="height: 100px; resize: none; font-size: 12px;" placeholder="Write equations, formulas, timestamps or concepts from this video...">${v.notes || ''}</textarea>
          <button class="btn btn-glass btn-save-notes" style="width: 100%; font-size: 11px; padding: 6px; margin-top: 8px;">Save Notes</button>
        </div>

        <!-- Comments Drawer (Collapsible) -->
        <div class="video-drawer-comments" style="display: none; padding: 16px; border-top: 1px solid var(--panel-border); background: rgba(0,0,0,0.15); max-height: 250px; overflow-y: auto;">
          <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 8px;">DISCUSSION THREAD</label>
          <div class="comments-thread-box" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
            ${v.comments && v.comments.length > 0 ? v.comments.map(c => `
              <div style="font-size: 12px; background: rgba(255,255,255,0.02); padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04);">
                <div style="display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 2px;">
                  <span>${c.displayName}</span>
                  <span style="font-size: 10px; color: var(--text-muted);">${new Date(c.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div style="color: var(--text-secondary);">${c.text}</div>
              </div>
            `).join('') : '<span style="font-size: 11px; color: var(--text-muted); font-style: italic;">No discussion yet. Start the conversation!</span>'}
          </div>
          <form class="form-add-comment" style="display: flex; gap: 8px;">
            <input type="text" class="form-input input-comment-text" style="font-size: 12px; padding: 8px 12px;" placeholder="Discuss video content..." required>
            <button type="submit" class="btn btn-primary" style="padding: 8px 12px;"><i class="fa-solid fa-paper-plane"></i></button>
          </form>
        </div>
      </div>
    `;
  }).join('');

  // Attach card event listeners
  videos.forEach(v => {
    const card = document.getElementById(`video-${v.id}`);
    if (!card) return;

    const myStatus = v.userStatus?.[currentUser] || { status: 'pending', isFavorite: false, isImportant: false };

    // Watch button
    card.querySelector('.btn-watch').addEventListener('click', () => {
      window.open(`https://www.youtube.com/watch?v=${v.youtubeId}`, '_blank');
    });

    // Favorite toggle
    card.querySelector('.btn-favorite').addEventListener('click', async () => {
      await updateVideoStatus(v.id, currentUser, 'isFavorite', !myStatus.isFavorite);
      showToast('Favorites updated!', 'info');
    });

    // Important toggle
    card.querySelector('.btn-important').addEventListener('click', async () => {
      await updateVideoStatus(v.id, currentUser, 'isImportant', !myStatus.isImportant);
      showToast('Video bookmark status updated.', 'info');
    });

    // Watched status toggle
    card.querySelector('.btn-watched').addEventListener('click', async () => {
      const nextStatus = myStatus.status === 'watched' ? 'pending' : 'watched';
      await updateVideoStatus(v.id, currentUser, 'status', nextStatus);
      showToast(nextStatus === 'watched' ? 'Marked as Watched.' : 'Marked as Pending.', 'success');
    });

    // Delete video
    card.querySelector('.btn-delete').addEventListener('click', async () => {
      if (confirm("Are you sure you want to delete this video? It will be removed for both of you.")) {
        await deleteVideo(v.id);
        showToast('Video removed from library.', 'info');
      }
    });

    // Notes drawer toggle
    const notesDrawer = card.querySelector('.video-drawer-notes');
    card.querySelector('.btn-toggle-notes').addEventListener('click', () => {
      const visible = notesDrawer.style.display !== 'none';
      card.querySelectorAll('.video-drawer-notes, .video-drawer-comments').forEach(d => d.style.display = 'none');
      notesDrawer.style.display = visible ? 'none' : 'block';
    });

    // Save notes handler
    card.querySelector('.btn-save-notes').addEventListener('click', async () => {
      const notesVal = card.querySelector('.textarea-notes').value;
      const ref = doc(db, 'youtube_videos', v.id);
      await updateDoc(ref, { notes: notesVal });
      showToast('Notes saved successfully!', 'success');
      notesDrawer.style.display = 'none';
    });

    // Comments drawer toggle
    const commentsDrawer = card.querySelector('.video-drawer-comments');
    card.querySelector('.btn-toggle-comments').addEventListener('click', () => {
      const visible = commentsDrawer.style.display !== 'none';
      card.querySelectorAll('.video-drawer-notes, .video-drawer-comments').forEach(d => d.style.display = 'none');
      commentsDrawer.style.display = visible ? 'none' : 'block';
    });

    // Add comment handler
    card.querySelector('.form-add-comment').addEventListener('submit', async (e) => {
      e.preventDefault();
      const commentInput = card.querySelector('.input-comment-text');
      const text = commentInput.value.trim();
      if (!text) return;

      await addCommentToVideo(v.id, {
        displayName: currentUser,
        text
      });

      commentInput.value = '';
      showToast('Comment posted.', 'success');
    });
  });
}
