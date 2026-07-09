import { db, auth } from '../firebase/config.js';
import { subscribeToPYQs, updatePYQStatus, addPYQ } from '../firebase/db.js';
import { writeBatch, doc, collection } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const PYQ_SEEDS = [
  { subject: "Quantitative Aptitude", chapter: "Geometry - Tangents & Circles", year: 2023, difficulty: "Hard" },
  { subject: "Quantitative Aptitude", chapter: "Trigonometry - Heights & Distances", year: 2022, difficulty: "Hard" },
  { subject: "Quantitative Aptitude", chapter: "Percentage & Fractions", year: 2024, difficulty: "Medium" },
  { subject: "Quantitative Aptitude", chapter: "Profit & Loss - Discount sheets", year: 2023, difficulty: "Medium" },
  { subject: "Reasoning", chapter: "Syllogism - Possibility Cases", year: 2024, difficulty: "Medium" },
  { subject: "Reasoning", chapter: "Puzzles - Linear Arrangement", year: 2023, difficulty: "Hard" },
  { subject: "English Language", chapter: "Reading Comprehension - Economy passage", year: 2023, difficulty: "Hard" },
  { subject: "English Language", chapter: "Spotting Errors - Subject Verb agreement", year: 2024, difficulty: "Easy" },
  { subject: "General Awareness", chapter: "Indian Polity - Fundamental Rights", year: 2022, difficulty: "Easy" },
  { subject: "General Awareness", chapter: "Indian History - Modern India movements", year: 2023, difficulty: "Medium" }
];

export function renderPYQTracker() {
  const container = document.getElementById('page-pyqs');
  if (!container) return;

  const currentUser = localStorage.getItem('studysync_user') || 'User';

  container.innerHTML = `
    <div class="youtube-actions">
      <div class="search-filters-row">
        <input type="text" id="pyq-search" class="form-input" placeholder="Search PYQs by chapter or year...">
        <select id="pyq-filter-subject" class="form-input" style="max-width: 200px;">
          <option value="all">All Subjects</option>
          <option value="Quantitative Aptitude">Quantitative Aptitude</option>
          <option value="Reasoning">Reasoning</option>
          <option value="English Language">English Language</option>
          <option value="General Awareness">General Awareness</option>
        </select>
        <select id="pyq-filter-difficulty" class="form-input" style="max-width: 140px;">
          <option value="all">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>
      <button id="btn-add-pyq-manual" class="btn btn-primary"><i class="fa-solid fa-plus"></i>Add PYQ Topic</button>
    </div>

    <!-- Syllabus chapters list table -->
    <div class="syllabus-table-wrapper" style="margin-top: 20px;">
      <table class="syllabus-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Chapter / Topic</th>
            <th>Exam Year</th>
            <th>Difficulty</th>
            <th>Solved</th>
            <th>Revision</th>
            <th>Bookmark</th>
          </tr>
        </thead>
        <tbody id="pyq-chapters-body">
          <!-- Loaded dynamically -->
          <tr>
            <td colspan="7" style="text-align: center; padding: 40px 0;">
              <div class="skeleton skeleton-text" style="width: 80%; margin: 10px auto;"></div>
              <div class="skeleton skeleton-text" style="width: 70%; margin: 10px auto;"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Seed button shown when empty -->
    <div id="pyq-seed-prompt" class="glass-panel glass-card" style="display: none; text-align: center; margin-top: 24px; padding: 30px;">
      <i class="fa-solid fa-book-open" style="font-size: 32px; color: var(--color-primary); margin-bottom: 12px;"></i>
      <h4 style="font-family: var(--font-header);">No PYQ Records Found</h4>
      <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px; margin-bottom: 16px;">
        Track historical question categories solved. Initialize standard PYQ cards to get started.
      </p>
      <button class="btn btn-primary" id="btn-seed-pyqs">Seed Default PYQ Set</button>
    </div>

    <!-- Add PYQ Modal overlay -->
    <div id="modal-add-pyq" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Add PYQ Tracker Item</h3>
          <button class="modal-close" id="modal-pyq-close"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="form-add-pyq">
          <div class="form-group">
            <label class="form-label" for="pyq-in-subject">Subject</label>
            <select class="form-input" id="pyq-in-subject" required>
              <option value="Quantitative Aptitude">Quantitative Aptitude</option>
              <option value="Reasoning">Reasoning</option>
              <option value="English Language">English Language</option>
              <option value="General Awareness">General Awareness</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="pyq-in-chapter">Chapter / Specific Topic Name</label>
            <input class="form-input" type="text" id="pyq-in-chapter" required placeholder="e.g. Geometry - Tangents">
          </div>
          <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label" for="pyq-in-year">Exam Year</label>
              <input class="form-input" type="number" id="pyq-in-year" min="2010" max="2026" value="2024" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="pyq-in-difficulty">Difficulty</label>
              <select class="form-input" id="pyq-in-difficulty" required>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">Create PYQ Item</button>
        </form>
      </div>
    </div>
  `;

  // Attach Add PYQ triggers
  const modal = document.getElementById('modal-add-pyq');
  document.getElementById('btn-add-pyq-manual').addEventListener('click', () => {
    modal.classList.add('active');
  });
  document.getElementById('modal-pyq-close').addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Dynamic filter elements
  const searchInput = document.getElementById('pyq-search');
  const subjectFilter = document.getElementById('pyq-filter-subject');
  const difficultyFilter = document.getElementById('pyq-filter-difficulty');

  let rawPYQs = [];

  const applyFilters = () => {
    const queryStr = searchInput.value.toLowerCase();
    const sub = subjectFilter.value;
    const diff = difficultyFilter.value;

    const filtered = rawPYQs.filter(item => {
      const matchSearch = item.chapter.toLowerCase().includes(queryStr) || String(item.year).includes(queryStr);
      const matchSubject = sub === 'all' || item.subject === sub;
      const matchDiff = diff === 'all' || item.difficulty === diff;

      return matchSearch && matchSubject && matchDiff;
    });

    renderPYQTable(filtered, currentUser);
  };

  searchInput.addEventListener('input', applyFilters);
  subjectFilter.addEventListener('change', applyFilters);
  difficultyFilter.addEventListener('change', applyFilters);

  // Subscribe to updates
  subscribeToPYQs((items) => {
    rawPYQs = items;
    applyFilters();
  });

  // Attach Form Submit
  const pyqForm = document.getElementById('form-add-pyq');
  pyqForm.onsubmit = async (e) => {
    e.preventDefault();
    const subject = document.getElementById('pyq-in-subject').value;
    const chapter = document.getElementById('pyq-in-chapter').value;
    const year = Number(document.getElementById('pyq-in-year').value);
    const difficulty = document.getElementById('pyq-in-difficulty').value;

    try {
      await addPYQ({ subject, chapter, year, difficulty });
      pyqForm.reset();
      modal.classList.remove('active');
      showToast('PYQ item added!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to add item.', 'error');
    }
  };

  // Seed handler
  document.addEventListener('click', async (e) => {
    if (e.target && e.target.id === 'btn-seed-pyqs') {
      const btn = e.target;
      btn.innerText = "Seeding data...";
      btn.disabled = true;
      try {
        const batch = writeBatch(db);
        PYQ_SEEDS.forEach(item => {
          const docRef = doc(collection(db, 'pyqs'));
          batch.set(docRef, {
            ...item,
            userStatus: {
              Dipu: { solved: false, revisionRequired: false, bookmarked: false },
              Meghali: { solved: false, revisionRequired: false, bookmarked: false }
            }
          });
        });
        await batch.commit();
        showToast('PYQs initialized!', 'success');
        document.getElementById('pyq-seed-prompt').style.display = 'none';
      } catch (err) {
        console.error(err);
        showToast('Failed to seed.', 'error');
      } finally {
        btn.innerText = "Seed Default PYQ Set";
        btn.disabled = false;
      }
    }
  });
}

function renderPYQTable(items, currentUser) {
  const tbody = document.getElementById('pyq-chapters-body');
  const seedPrompt = document.getElementById('pyq-seed-prompt');

  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 30px 0;">
          No PYQ trackers found.
        </td>
      </tr>
    `;
    if (seedPrompt && tbody.innerText.includes('No PYQ')) seedPrompt.style.display = 'block';
    return;
  }

  if (seedPrompt) seedPrompt.style.display = 'none';

  tbody.innerHTML = items.map(item => {
    const myStats = item.userStatus?.[currentUser] || { solved: false, revisionRequired: false, bookmarked: false };
    
    return `
      <tr id="pyq-row-${item.id}">
        <td><strong style="color: var(--text-primary);">${item.subject}</strong></td>
        <td>${item.chapter}</td>
        <td><span style="font-family: var(--font-header); font-weight: 700;">${item.year}</span></td>
        <td><span class="badge badge-${item.difficulty.toLowerCase()}">${item.difficulty}</span></td>
        
        <!-- Toggle Solved -->
        <td style="text-align: center;">
          <button class="video-action-icon-btn btn-pyq-toggle" data-field="solved" style="font-size: 16px;">
            <i class="${myStats.solved ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'}" style="${myStats.solved ? 'color: var(--color-success);' : ''}"></i>
          </button>
        </td>

        <!-- Toggle Revision required -->
        <td style="text-align: center;">
          <button class="video-action-icon-btn btn-pyq-toggle" data-field="revisionRequired" style="font-size: 16px;">
            <i class="${myStats.revisionRequired ? 'fa-solid fa-clock-rotate-left' : 'fa-regular fa-clock'}" style="${myStats.revisionRequired ? 'color: var(--color-warning);' : ''}"></i>
          </button>
        </td>

        <!-- Toggle Bookmark -->
        <td style="text-align: center;">
          <button class="video-action-icon-btn btn-pyq-toggle" data-field="bookmarked" style="font-size: 16px;">
            <i class="${myStats.bookmarked ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'}" style="${myStats.bookmarked ? 'color: var(--color-secondary);' : ''}"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Attach button toggle handlers
  items.forEach(item => {
    const row = document.getElementById(`pyq-row-${item.id}`);
    if (!row) return;

    row.querySelectorAll('.btn-pyq-toggle').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const field = btn.dataset.field;
        const myStats = item.userStatus?.[currentUser] || { solved: false, revisionRequired: false, bookmarked: false };
        const nextVal = !myStats[field];

        await updatePYQStatus(item.id, currentUser, field, nextVal);
        showToast('Updated question card status.', 'success');
      });
    });
  });
}
