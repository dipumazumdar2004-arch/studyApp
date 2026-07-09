import { db, auth } from '../firebase/config.js';
import { subscribeToNotes, createNote, updateNote } from '../firebase/db.js';
import { NoteEditor } from '../components/NoteEditor.js';

export function renderNotesPage() {
  const container = document.getElementById('page-notes');
  if (!container) return;

  const currentUser = localStorage.getItem('studysync_user') || 'User';

  container.innerHTML = `
    <div class="notes-container" id="notes-main-wrapper">
      <!-- Notes Sidebar (File manager catalog) -->
      <div class="notes-sidebar">
        <button id="btn-create-note" class="btn btn-primary" style="width: 100%;"><i class="fa-solid fa-plus"></i>Create New Note</button>
        <input type="text" id="notes-search" class="form-input" placeholder="Search notes title...">
        
        <div class="notes-list" id="notes-catalog-list">
          <!-- Loaded dynamically -->
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
        </div>
      </div>

      <!-- Editor workspace -->
      <div class="glass-panel" style="display: flex; flex-direction: column; overflow: hidden; position: relative;">
        <!-- Dynamic header for selected note details -->
        <div id="notes-editor-header" style="padding: 16px 24px; border-bottom: 1px solid var(--panel-border); display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <button id="btn-notes-back" class="btn btn-glass btn-notes-back-mobile" style="padding: 8px 12px;"><i class="fa-solid fa-arrow-left"></i> Back</button>
            <div>
              <input type="text" id="active-note-title" class="form-input" style="font-family: var(--font-header); font-weight: 700; font-size: 18px; padding: 4px 8px; border: none; background: transparent; width: 300px;" value="Select a Note" disabled>
              <span id="active-note-meta" style="font-size: 11px; color: var(--text-muted); display: block; margin-left: 8px;">No note selected.</span>
            </div>
          </div>

          <div style="display: flex; gap: 10px;">
            <button id="btn-toggle-history" class="btn btn-glass" style="display: none;"><i class="fa-solid fa-clock-rotate-left"></i> History</button>
            <span id="save-status-indicator" style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;"></span>
          </div>
        </div>

        <!-- Editor body area -->
        <div id="notes-wysiwyg-container" style="flex: 1; overflow-y: auto;">
          <div style="text-align: center; color: var(--text-muted); padding: 50px 20px;">
            <i class="fa-solid fa-file-signature" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
            <h3>No Active Note</h3>
            <p style="margin-top: 8px; font-size: 13px;">Select a note from the left bar or click 'Create New Note' to start writing.</p>
          </div>
        </div>

        <!-- Version History Drawer (Right slide-in) -->
        <div id="notes-history-drawer" style="position: absolute; right: 0; top: 0; bottom: 0; width: 280px; background: var(--panel-bg-solid); border-left: 1px solid var(--panel-border); z-index: 10; display: none; flex-direction: column; padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h4 style="font-family: var(--font-header); font-size: 14px;">Version History</h4>
            <button class="modal-close" id="btn-close-history"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div id="notes-history-list" style="display: flex; flex-direction: column; gap: 8px; flex: 1; overflow-y: auto;">
            <!-- Render history points -->
          </div>
        </div>
      </div>
    </div>
  `;

  let activeNoteId = null;
  let activeNoteData = null;
  let rawNotes = [];
  let noteEditor = null;
  let saveTimeout = null;

  const wysiwygContainerId = 'notes-wysiwyg-container';

  // Toggle History Drawer
  const historyDrawer = document.getElementById('notes-history-drawer');
  document.getElementById('btn-toggle-history').addEventListener('click', () => {
    historyDrawer.style.display = historyDrawer.style.display === 'none' ? 'flex' : 'none';
    if (historyDrawer.style.display === 'flex') {
      renderVersionHistory(activeNoteData, noteEditor);
    }
  });
  document.getElementById('btn-close-history').addEventListener('click', () => {
    historyDrawer.style.display = 'none';
  });

  const titleInput = document.getElementById('active-note-title');
  const metaDisplay = document.getElementById('active-note-meta');
  const saveIndicator = document.getElementById('save-status-indicator');

  // Load notes list dynamically
  const catalogList = document.getElementById('notes-catalog-list');
  const searchInput = document.getElementById('notes-search');

  const renderCatalogList = (notes) => {
    if (notes.length === 0) {
      catalogList.innerHTML = `
        <span style="font-size: 12px; color: var(--text-muted); font-style: italic; text-align: center; display: block; padding: 20px 0;">No notes found.</span>
      `;
      return;
    }

    catalogList.innerHTML = notes.map(n => `
      <div class="note-item ${n.id === activeNoteId ? 'active' : ''}" id="note-item-${n.id}">
        <span class="note-item-title">${n.title}</span>
        <div class="note-item-meta">By ${n.authorId} • ${n.updatedAt ? new Date(n.updatedAt.seconds * 1000).toLocaleDateString() : 'Saving...'}</div>
      </div>
    `).join('');

    // Attach click listeners to list items
    notes.forEach(n => {
      document.getElementById(`note-item-${n.id}`).addEventListener('click', () => {
        selectNote(n);
      });
    });
  };

  const selectNote = (note) => {
    activeNoteId = note.id;
    activeNoteData = note;
    document.getElementById('notes-main-wrapper').classList.add('editing');

    // Apply active class to catalog item
    document.querySelectorAll('.note-item').forEach(item => item.classList.remove('active'));
    const activeItem = document.getElementById(`note-item-${note.id}`);
    if (activeItem) activeItem.classList.add('active');

    // Enable Editor
    titleInput.disabled = false;
    titleInput.value = note.title;
    metaDisplay.innerText = `Created by ${note.authorId} • Last edited by ${note.lastEditedBy || 'N/A'}`;
    document.getElementById('btn-toggle-history').style.display = 'inline-flex';

    // Initialize WYSIWYG note editor if not already done
    if (!noteEditor) {
      noteEditor = new NoteEditor(wysiwygContainerId, {
        placeholder: "Write formulas, summaries, and exam key points here...",
        onSave: (html) => saveActiveNote(html)
      });
      
      // Auto-save typing listeners
      noteEditor.editorBody.addEventListener('input', () => {
        saveIndicator.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Auto-saving...`;
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          saveActiveNote(noteEditor.getContent());
        }, 2000); // Wait 2s before auto-save
      });
    }

    // Set Editor content
    noteEditor.setContent(note.content);
    historyDrawer.style.display = 'none'; // Close history on change
  };

  const saveActiveNote = async (htmlContent) => {
    if (!activeNoteId) return;
    const titleVal = titleInput.value.trim() || "Untitled Note";
    saveIndicator.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...`;
    
    try {
      await updateNote(activeNoteId, titleVal, htmlContent, currentUser, activeNoteData.content);
      saveIndicator.innerHTML = `<i class="fa-solid fa-cloud-arrow-up" style="color: var(--color-success);"></i> Synced`;
    } catch (e) {
      console.error(e);
      saveIndicator.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: var(--color-error);"></i> Error`;
    }
  };

  // Title change listener
  titleInput.addEventListener('change', () => {
    if (noteEditor) saveActiveNote(noteEditor.getContent());
  });

  // Back button listener for mobile view
  document.getElementById('btn-notes-back').addEventListener('click', () => {
    activeNoteId = null;
    activeNoteData = null;
    document.getElementById('notes-main-wrapper').classList.remove('editing');
    titleInput.disabled = true;
    titleInput.value = "Select a Note";
    metaDisplay.innerText = "No note selected.";
    document.getElementById('btn-toggle-history').style.display = 'none';
    if (noteEditor) noteEditor.setContent('');
  });

  // Create Note button
  document.getElementById('btn-create-note').addEventListener('click', async () => {
    try {
      const docRef = await createNote("Untitled Note", "", currentUser);
      showToast('New note created!', 'success');
      
      // Auto select the new note on subscription load
      activeNoteId = docRef.id;
    } catch (err) {
      console.error(err);
      showToast('Failed to create note.', 'error');
    }
  });

  // Filter query
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const filtered = rawNotes.filter(n => n.title.toLowerCase().includes(query));
    renderCatalogList(filtered);
  });

  // Subscribe to Notes in real-time
  subscribeToNotes((notes) => {
    rawNotes = notes;
    renderCatalogList(notes);

    // If active note was updated in backend by partner, merge changes gracefully
    if (activeNoteId) {
      const updatedNote = notes.find(n => n.id === activeNoteId);
      if (updatedNote) {
        activeNoteData = updatedNote;
        metaDisplay.innerText = `Created by ${updatedNote.authorId} • Last edited by ${updatedNote.lastEditedBy || 'N/A'}`;
        
        // Only update editor if the last editor was the partner (avoid overwriting our cursor/input)
        if (updatedNote.lastEditedBy !== currentUser && noteEditor) {
          noteEditor.setContent(updatedNote.content);
        }
      }
    }
  });
}

function renderVersionHistory(noteData, editor) {
  const list = document.getElementById('notes-history-list');
  if (!list || !noteData) return;

  const history = noteData.versionHistory || [];
  if (history.length === 0) {
    list.innerHTML = `
      <span style="font-size: 12px; color: var(--text-muted); font-style: italic;">No older versions saved yet. Versions are created on modification.</span>
    `;
    return;
  }

  list.innerHTML = history.map((item, index) => `
    <div class="note-item" id="history-item-${index}" style="border: 1px solid var(--panel-border); background: rgba(255,255,255,0.01);">
      <span style="font-size: 11px; font-weight: 700; color: var(--color-primary); display: block;">Version ${history.length - index}</span>
      <span style="font-size: 10px; color: var(--text-secondary); margin-top: 2px; display: block;">Edited by ${item.editedBy}</span>
      <span style="font-size: 9px; color: var(--text-muted);">${new Date(item.updatedAt).toLocaleString()}</span>
      <button class="btn btn-glass btn-restore-history" style="font-size: 10px; padding: 4px 8px; margin-top: 6px; width: 100%;" data-index="${index}">Restore Content</button>
    </div>
  `).join('');

  // Attach restore buttons
  list.querySelectorAll('.btn-restore-history').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = Number(btn.dataset.index);
      const version = history[idx];
      
      if (confirm(`Do you want to restore the note content to Version ${history.length - idx}? This will overwrite the current content.`)) {
        editor.setContent(version.content);
        showToast('Version content restored to editor. Save to apply.', 'info');
        document.getElementById('notes-history-drawer').style.display = 'none';
      }
    });
  });
}
