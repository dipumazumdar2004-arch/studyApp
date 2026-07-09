import { db, auth } from '../firebase/config.js';
import { 
  subscribeToSyllabus, 
  updateChapterProgress, 
  addSyllabusChapter, 
  triggerNotification 
} from '../firebase/db.js';
import { writeBatch, doc, collection } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const EXAMS = ["SSC CGL", "NABARD", "Banking", "Railway", "State Exams"];

const DEFAULT_SYLLABUS_SEEDS = [
  // SSC CGL
  { exam: "SSC CGL", subject: "Quantitative Aptitude", chapter: "Percentage", priority: "High", difficulty: "Medium" },
  { exam: "SSC CGL", subject: "Quantitative Aptitude", chapter: "Profit & Loss", priority: "High", difficulty: "Medium" },
  { exam: "SSC CGL", subject: "Quantitative Aptitude", chapter: "Ratio & Proportion", priority: "Medium", difficulty: "Easy" },
  { exam: "SSC CGL", subject: "Quantitative Aptitude", chapter: "Geometry", priority: "High", difficulty: "Hard" },
  { exam: "SSC CGL", subject: "Quantitative Aptitude", chapter: "Trigonometry", priority: "High", difficulty: "Hard" },
  { exam: "SSC CGL", subject: "Reasoning", chapter: "Syllogism", priority: "High", difficulty: "Medium" },
  { exam: "SSC CGL", subject: "Reasoning", chapter: "Puzzles & Seating", priority: "High", difficulty: "Hard" },
  { exam: "SSC CGL", subject: "English Language", chapter: "Reading Comprehension", priority: "Medium", difficulty: "Medium" },
  { exam: "SSC CGL", subject: "English Language", chapter: "Spotting Errors", priority: "High", difficulty: "Medium" },
  { exam: "SSC CGL", subject: "General Awareness", chapter: "Indian Polity", priority: "Medium", difficulty: "Medium" },
  { exam: "SSC CGL", subject: "General Awareness", chapter: "Indian History", priority: "Low", difficulty: "Medium" },
  
  // NABARD
  { exam: "NABARD", subject: "ARD (Agriculture & Rural Development)", chapter: "Agronomy & Crops", priority: "High", difficulty: "Hard" },
  { exam: "NABARD", subject: "ARD (Agriculture & Rural Development)", chapter: "Soil & Water Conservation", priority: "High", difficulty: "Medium" },
  { exam: "NABARD", subject: "ESI (Economic & Social Issues)", chapter: "Inflation & Monetary Policy", priority: "High", difficulty: "Medium" },
  { exam: "NABARD", subject: "ESI (Economic & Social Issues)", chapter: "Poverty Alleviation & Schemes", priority: "High", difficulty: "Hard" },

  // Banking
  { exam: "Banking", subject: "Quantitative Aptitude", chapter: "Data Interpretation", priority: "High", difficulty: "Hard" },
  { exam: "Banking", subject: "Quantitative Aptitude", chapter: "Number Series & Quadratic", priority: "High", difficulty: "Easy" },
  { exam: "Banking", subject: "Reasoning", chapter: "Logical Reasoning", priority: "Medium", difficulty: "Medium" },
  { exam: "Banking", subject: "English Language", chapter: "Cloze Test & Re-arrangement", priority: "High", difficulty: "Medium" }
];

export function renderSyllabusTracker() {
  const container = document.getElementById('page-syllabus');
  if (!container) return;

  const currentUser = localStorage.getItem('studysync_user') || 'User';

  container.innerHTML = `
    <div class="syllabus-tabs" id="syllabus-tabs-row">
      ${EXAMS.map((exam, i) => `<button class="syllabus-tab-btn ${i === 0 ? 'active' : ''}" data-exam="${exam}">${exam}</button>`).join('')}
    </div>

    <!-- Active progress Summary card -->
    <div class="glass-panel glass-card" style="display: flex; gap: 24px; align-items: center; margin-bottom: 24px; justify-content: space-between;">
      <div style="flex: 1;">
        <h3 style="font-family: var(--font-header); font-size: 16px;">Syllabus Completion</h3>
        <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Compare your prep state directly with your partner.</p>
        
        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 14px;">
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 4px;">
              <span>Your Progress (${currentUser})</span>
              <span id="syllabus-summary-me">0%</span>
            </div>
            <div class="progress-bar-container"><div class="progress-bar-fill" id="progress-bar-me" style="width: 0%;"></div></div>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 4px;">
              <span>Partner Progress (${currentUser === 'Dipu' ? 'Meghali' : 'Dipu'})</span>
              <span id="syllabus-summary-partner">0%</span>
            </div>
            <div class="progress-bar-container"><div class="progress-bar-fill" id="progress-bar-partner" style="width: 0%; background: var(--grad-accent);"></div></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Syllabus chapters list table -->
    <div class="syllabus-table-wrapper">
      <table class="syllabus-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Chapter</th>
            <th>Priority</th>
            <th>Difficulty</th>
            <th>Your Progress</th>
            <th>Status (D | M)</th>
          </tr>
        </thead>
        <tbody id="syllabus-chapters-body">
          <!-- Loaded dynamically -->
          <tr>
            <td colspan="6" style="text-align: center; padding: 40px 0;">
              <div class="skeleton skeleton-text" style="width: 80%; margin: 10px auto;"></div>
              <div class="skeleton skeleton-text" style="width: 70%; margin: 10px auto;"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Seed fallback trigger shown when empty -->
    <div id="syllabus-seed-prompt" class="glass-panel glass-card" style="display: none; text-align: center; margin-top: 24px; padding: 30px;">
      <i class="fa-solid fa-seedling" style="font-size: 32px; color: var(--color-success); margin-bottom: 12px;"></i>
      <h4 style="font-family: var(--font-header);">No Chapters Found</h4>
      <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px; margin-bottom: 16px;">
        This syllabus track is currently empty. Populate default chapters for SSC CGL, NABARD & Banking to start tracking immediately.
      </p>
      <button class="btn btn-primary" id="btn-seed-syllabus">Seed Default Syllabus Docs</button>
    </div>
  `;

  let activeExam = "SSC CGL";
  let syllabusUnsubscribe = null;

  const loadSyllabusData = (examName) => {
    if (syllabusUnsubscribe) syllabusUnsubscribe();

    syllabusUnsubscribe = subscribeToSyllabus(examName, (chapters) => {
      renderChaptersTable(chapters, currentUser, examName);
    });
  };

  // Tab switcher
  document.getElementById('syllabus-tabs-row').addEventListener('click', (e) => {
    const tab = e.target.closest('.syllabus-tab-btn');
    if (!tab) return;
    
    document.querySelectorAll('.syllabus-tab-btn').forEach(btn => btn.classList.remove('active'));
    tab.classList.add('active');
    
    activeExam = tab.dataset.exam;
    loadSyllabusData(activeExam);
  });

  // Seed Button handler
  document.addEventListener('click', async (e) => {
    if (e.target && e.target.id === 'btn-seed-syllabus') {
      const btn = e.target;
      btn.innerText = "Seeding database...";
      btn.disabled = true;
      try {
        const batch = writeBatch(db);
        DEFAULT_SYLLABUS_SEEDS.forEach(item => {
          const docRef = doc(collection(db, 'syllabus'));
          batch.set(docRef, {
            ...item,
            status: { Dipu: 'pending', Meghali: 'pending' },
            progress: { Dipu: 0, Meghali: 0 },
            lastUpdated: serverTimestamp()
          });
        });
        await batch.commit();
        showToast('Syllabus initialized successfully!', 'success');
        document.getElementById('syllabus-seed-prompt').style.display = 'none';
      } catch (err) {
        console.error(err);
        showToast('Failed to seed syllabus.', 'error');
      } finally {
        btn.innerText = "Seed Default Syllabus Docs";
        btn.disabled = false;
      }
    }
  });

  // Initial load
  loadSyllabusData(activeExam);
}

function renderChaptersTable(chapters, currentUser, examName) {
  const tableBody = document.getElementById('syllabus-chapters-body');
  const seedPrompt = document.getElementById('syllabus-seed-prompt');
  
  if (!tableBody) return;

  if (!chapters || chapters.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 30px 0;">
          No chapters added for ${examName}.
        </td>
      </tr>
    `;
    if (seedPrompt) seedPrompt.style.display = 'block';
    return;
  }

  if (seedPrompt) seedPrompt.style.display = 'none';

  const partnerName = currentUser === 'Dipu' ? 'Meghali' : 'Dipu';

  // Compute total statistics
  const myCompleted = chapters.filter(c => c.status && c.status[currentUser] === 'completed').length;
  const partnerCompleted = chapters.filter(c => c.status && c.status[partnerName] === 'completed').length;
  
  const myPercent = Math.round((myCompleted / chapters.length) * 100);
  const partnerPercent = Math.round((partnerCompleted / chapters.length) * 100);

  // Update visual summaries
  const mySum = document.getElementById('syllabus-summary-me');
  const partSum = document.getElementById('syllabus-summary-partner');
  const myBar = document.getElementById('progress-bar-me');
  const partBar = document.getElementById('progress-bar-partner');

  if (mySum) mySum.innerText = `${myPercent}% (${myCompleted}/${chapters.length})`;
  if (partSum) partSum.innerText = `${partnerPercent}% (${partnerCompleted}/${chapters.length})`;
  if (myBar) myBar.style.width = `${myPercent}%`;
  if (partBar) partBar.style.width = `${partnerPercent}%`;

  tableBody.innerHTML = chapters.map(c => {
    const myStat = c.status?.[currentUser] || 'pending';
    const partnerStat = c.status?.[partnerName] || 'pending';
    const myProgress = c.progress?.[currentUser] || 0;

    return `
      <tr id="chapter-row-${c.id}">
        <td><strong style="color: var(--text-primary);">${c.subject}</strong></td>
        <td>${c.chapter}</td>
        <td><span class="badge badge-${c.priority.toLowerCase()}">${c.priority}</span></td>
        <td><span class="badge badge-${c.difficulty.toLowerCase()}">${c.difficulty}</span></td>
        
        <!-- Editable Progress Slider Cell -->
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="range" class="progress-slider" min="0" max="100" step="5" value="${myProgress}" style="width: 70px; accent-color: var(--color-primary);">
            <span style="font-size: 11px; font-weight: 700; min-width: 30px;">${myProgress}%</span>
          </div>
        </td>

        <!-- Collaboration Avatar Status Cells -->
        <td>
          <div class="collab-status-display">
            <!-- Me Status circle -->
            <div class="user-status-avatar-circle status-${myStat} btn-cycle-status" data-uid="${currentUser}" data-chapter-id="${c.id}" title="${currentUser} (You): ${myStat.replace('_', ' ')}">
              ${currentUser[0]}
            </div>
            
            <!-- Partner Status circle (view only) -->
            <div class="user-status-avatar-circle status-${partnerStat}" data-uid="${partnerName}" title="${partnerName}: ${partnerStat.replace('_', ' ')}">
              ${partnerName[0]}
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Attach sliders and cyclic buttons handlers
  chapters.forEach(c => {
    const row = document.getElementById(`chapter-row-${c.id}`);
    if (!row) return;

    // Slider value changed
    const slider = row.querySelector('.progress-slider');
    slider.addEventListener('change', async (e) => {
      const progressVal = Number(e.target.value);
      let status = c.status?.[currentUser] || 'pending';
      
      // Auto upgrade status based on slider
      if (progressVal === 100) {
        status = 'completed';
      } else if (progressVal > 0 && status === 'pending') {
        status = 'in_progress';
      } else if (progressVal === 0) {
        status = 'pending';
      }

      await updateChapterProgress(c.id, currentUser, status, progressVal);
    });

    // Cyclic status clicker
    row.querySelector('.btn-cycle-status').addEventListener('click', async (e) => {
      const myStat = c.status?.[currentUser] || 'pending';
      const myProgress = c.progress?.[currentUser] || 0;
      
      let nextStatus = 'pending';
      let nextProgress = myProgress;

      if (myStat === 'pending') {
        nextStatus = 'in_progress';
        nextProgress = Math.max(nextProgress, 25);
      } else if (myStat === 'in_progress') {
        nextStatus = 'completed';
        nextProgress = 100;
      } else if (myStat === 'completed') {
        nextStatus = 'revision';
        nextProgress = 100;
      } else if (myStat === 'revision') {
        nextStatus = 'pending';
        nextProgress = 0;
      }

      await updateChapterProgress(c.id, currentUser, nextStatus, nextProgress);
      showToast(`Chapter marked as: ${nextStatus.replace('_', ' ')}`, 'info');

      // Trigger notification if chapter completes
      if (nextStatus === 'completed') {
        await triggerNotification(
          'chapter_complete',
          currentUser,
          'Syllabus Completed',
          `${currentUser} completed the chapter "${c.chapter}" under ${c.subject}!`
        );
      }
    });
  });
}
