import { db, auth } from '../firebase/config.js';
import { subscribeToMockTests, addMockTest } from '../firebase/db.js';
import { collection, deleteDoc, doc, writeBatch } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const MOCK_SEEDS = [
  { examName: "SSC CGL Tier 1 - Test 1", subject: "Full Mock", marks: 145, maxMarks: 200, accuracy: 82.5, wrongAnswers: 12, timeTakenMinutes: 58, uid: "Dipu" },
  { examName: "SSC CGL Tier 1 - Test 2", subject: "Full Mock", marks: 156, maxMarks: 200, accuracy: 88, wrongAnswers: 8, timeTakenMinutes: 55, uid: "Dipu" },
  { examName: "SSC CGL Tier 1 - Test 1", subject: "Full Mock", marks: 138, maxMarks: 200, accuracy: 78, wrongAnswers: 16, timeTakenMinutes: 60, uid: "Meghali" },
  { examName: "SSC CGL Tier 1 - Test 2", subject: "Full Mock", marks: 148, maxMarks: 200, accuracy: 84.2, wrongAnswers: 10, timeTakenMinutes: 57, uid: "Meghali" }
];

export function renderMockTestsPage() {
  const container = document.getElementById('page-mocktests');
  if (!container) return;

  const currentUser = localStorage.getItem('studysync_user') || 'User';

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2 style="font-family: var(--font-header); font-size: 22px;">Performance Metrics</h2>
      <button id="btn-open-mock-modal" class="btn btn-primary"><i class="fa-solid fa-plus"></i>Log Mock Score</button>
    </div>

    <!-- Summary metrics widgets -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 24px;" class="dashboard-grid">
      <div class="glass-panel glass-card dash-span-4" style="text-align: center;">
        <span class="stats-summary-label">Total Tests Taken</span>
        <div class="stats-summary-value" id="mock-summary-count" style="font-size: 32px; margin-top: 8px;">0</div>
      </div>
      <div class="glass-panel glass-card dash-span-4" style="text-align: center;">
        <span class="stats-summary-label">Average Score (Your)</span>
        <div class="stats-summary-value" id="mock-summary-avg" style="font-size: 32px; margin-top: 8px; color: var(--color-primary);">0 / 200</div>
      </div>
      <div class="glass-panel glass-card dash-span-4" style="text-align: center;">
        <span class="stats-summary-label">Average Accuracy (Your)</span>
        <div class="stats-summary-value" id="mock-summary-acc" style="font-size: 32px; margin-top: 8px; color: var(--color-success);">0%</div>
      </div>
    </div>

    <!-- Scores log list -->
    <div class="syllabus-table-wrapper">
      <table class="syllabus-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Exam Name</th>
            <th>Subject</th>
            <th>Marks (Obt/Max)</th>
            <th>Accuracy</th>
            <th>Wrong Ans</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="mock-scores-body">
          <!-- Loaded dynamically -->
          <tr>
            <td colspan="8" style="text-align: center; padding: 40px 0;">
              <div class="skeleton skeleton-text" style="width: 80%; margin: 0 auto;"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Seed fallback prompts -->
    <div id="mock-seed-prompt" class="glass-panel glass-card" style="display: none; text-align: center; margin-top: 24px; padding: 30px;">
      <i class="fa-solid fa-graduation-cap" style="font-size: 32px; color: var(--color-primary); margin-bottom: 12px;"></i>
      <h4 style="font-family: var(--font-header);">No Mock Test Logs Found</h4>
      <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px; margin-bottom: 16px;">
        Track Mock scores and compare statistics. Seed dummy scores to populate visual analytics.
      </p>
      <button class="btn btn-primary" id="btn-seed-mocks">Seed Mock Test Logs</button>
    </div>

    <!-- Log Mock Modal -->
    <div id="modal-add-mock" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Log Mock Test Score</h3>
          <button class="modal-close" id="modal-mock-close"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="form-add-mock">
          <div class="form-group">
            <label class="form-label" for="mock-name">Exam Name / Mock Number</label>
            <input class="form-input" type="text" id="mock-name" required placeholder="e.g. SSC CGL Tier 1 - Mock 4">
          </div>
          <div class="form-group">
            <label class="form-label" for="mock-subject">Subject Type</label>
            <select class="form-input" id="mock-subject" required>
              <option value="Full Mock">Full Length Mock</option>
              <option value="Quantitative Aptitude">Quantitative Aptitude Sectional</option>
              <option value="Reasoning">Reasoning Sectional</option>
              <option value="English Language">English Sectional</option>
              <option value="General Awareness">General Awareness Sectional</option>
            </select>
          </div>
          
          <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label" for="mock-marks-obt">Marks Obtained</label>
              <input class="form-input" type="number" id="mock-marks-obt" step="0.25" required placeholder="e.g. 142.5">
            </div>
            <div class="form-group">
              <label class="form-label" for="mock-marks-max">Max Marks</label>
              <input class="form-input" type="number" id="mock-marks-max" value="200" required placeholder="200">
            </div>
          </div>

          <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label" for="mock-accuracy">Accuracy (%)</label>
              <input class="form-input" type="number" id="mock-accuracy" min="0" max="100" step="0.1" required placeholder="85.5">
            </div>
            <div class="form-group">
              <label class="form-label" for="mock-wrongs">Wrong Answers Count</label>
              <input class="form-input" type="number" id="mock-wrongs" required placeholder="12">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="mock-time">Time Taken (Minutes)</label>
            <input class="form-input" type="number" id="mock-time" required placeholder="60">
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">Save Score Record</button>
        </form>
      </div>
    </div>
  `;

  // Trigger Modal handlers
  const mockModal = document.getElementById('modal-add-mock');
  document.getElementById('btn-open-mock-modal').addEventListener('click', () => {
    mockModal.classList.add('active');
  });
  document.getElementById('modal-mock-close').addEventListener('click', () => {
    mockModal.classList.remove('active');
  });

  // Subscribe to real-time scores
  subscribeToMockTests((tests) => {
    renderScoresLogs(tests, currentUser);
  });

  // Form Submit handler
  const mockForm = document.getElementById('form-add-mock');
  mockForm.onsubmit = async (e) => {
    e.preventDefault();
    const examName = document.getElementById('mock-name').value;
    const subject = document.getElementById('mock-subject').value;
    const marks = Number(document.getElementById('mock-marks-obt').value);
    const maxMarks = Number(document.getElementById('mock-marks-max').value);
    const accuracy = Number(document.getElementById('mock-accuracy').value);
    const wrongAnswers = Number(document.getElementById('mock-wrongs').value);
    const timeTakenMinutes = Number(document.getElementById('mock-time').value);

    try {
      await addMockTest({
        examName,
        subject,
        marks,
        maxMarks,
        accuracy,
        wrongAnswers,
        timeTakenMinutes,
        uid: currentUser
      });
      mockForm.reset();
      mockModal.classList.remove('active');
      showToast('Mock Test score logged!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save score.', 'error');
    }
  };

  // Seed handler
  document.addEventListener('click', async (e) => {
    if (e.target && e.target.id === 'btn-seed-mocks') {
      const btn = e.target;
      btn.innerText = "Seeding data...";
      btn.disabled = true;
      try {
        const batch = writeBatch(db);
        MOCK_SEEDS.forEach(item => {
          const docRef = doc(collection(db, 'mock_tests'));
          batch.set(docRef, {
            ...item,
            date: new Date()
          });
        });
        await batch.commit();
        showToast('Mocks initialized!', 'success');
        document.getElementById('mock-seed-prompt').style.display = 'none';
      } catch (err) {
        console.error(err);
        showToast('Failed to seed.', 'error');
      } finally {
        btn.innerText = "Seed Mock Test Logs";
        btn.disabled = false;
      }
    }
  });
}

function renderScoresLogs(tests, currentUser) {
  const tbody = document.getElementById('mock-scores-body');
  const seedPrompt = document.getElementById('mock-seed-prompt');
  
  if (!tbody) return;

  if (tests.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 30px 0;">No mock scores registered.</td>
      </tr>
    `;
    if (seedPrompt) seedPrompt.style.display = 'block';
    return;
  }

  if (seedPrompt) seedPrompt.style.display = 'none';

  // Compute metrics for current user
  const myTests = tests.filter(t => t.uid === currentUser);
  const totalMyTests = myTests.length;
  
  let avgScore = 0;
  let avgAcc = 0;
  
  if (totalMyTests > 0) {
    const sumScore = myTests.reduce((acc, curr) => acc + curr.marks, 0);
    const sumAcc = myTests.reduce((acc, curr) => acc + curr.accuracy, 0);
    avgScore = Math.round((sumScore / totalMyTests) * 10) / 10;
    avgAcc = Math.round((sumAcc / totalMyTests) * 10) / 10;
  }

  document.getElementById('mock-summary-count').innerText = tests.length;
  document.getElementById('mock-summary-avg').innerText = totalMyTests > 0 ? `${avgScore} / 200` : '-';
  document.getElementById('mock-summary-acc').innerText = totalMyTests > 0 ? `${avgAcc}%` : '-';

  tbody.innerHTML = tests.map(t => {
    return `
      <tr id="mock-row-${t.id}">
        <td><strong style="color: ${t.uid === 'Dipu' ? 'var(--color-primary)' : 'var(--color-secondary)'};">${t.uid}</strong></td>
        <td>${t.examName}</td>
        <td><span class="badge" style="background: rgba(255,255,255,0.05);">${t.subject}</span></td>
        <td><strong style="font-family: var(--font-header);">${t.marks}</strong> / ${t.maxMarks}</td>
        <td><span style="color: var(--color-success); font-weight: 700;">${t.accuracy}%</span></td>
        <td style="color: var(--color-error); font-weight: 600;">${t.wrongAnswers}</td>
        <td>${t.timeTakenMinutes} mins</td>
        <td>
          <button class="video-action-icon-btn btn-delete-mock" data-id="${t.id}" title="Delete Record" style="color: var(--color-error);"><i class="fa-solid fa-trash-can"></i></button>
        </td>
      </tr>
    `;
  }).join('');

  // Attach delete buttons
  tests.forEach(t => {
    const row = document.getElementById(`mock-row-${t.id}`);
    if (!row) return;

    row.querySelector('.btn-delete-mock').addEventListener('click', async () => {
      if (confirm("Delete this test score?")) {
        try {
          await deleteDoc(doc(db, 'mock_tests', t.id));
          showToast('Mock score deleted.', 'info');
        } catch (err) {
          console.error(err);
          showToast('Could not delete.', 'error');
        }
      }
    });
  });
}
