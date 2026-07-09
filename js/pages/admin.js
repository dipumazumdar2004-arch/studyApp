import { db } from '../firebase/config.js';
import { addSyllabusChapter, deleteSyllabusChapter, deleteVideo } from '../firebase/db.js';
import { collection, getDocs, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export function renderOwnerPanel() {
  const container = document.getElementById('page-admin');
  if (!container) return;

  container.innerHTML = `
    <div class="dashboard-grid">
      <!-- Syllabus Manager -->
      <div class="glass-panel glass-card dash-span-6" style="display: flex; flex-direction: column; gap: 16px;">
        <h3 style="font-family: var(--font-header); font-size: 16px;"><i class="fa-solid fa-list-check" style="color: var(--color-primary); margin-right: 8px;"></i>Add Syllabus Topic</h3>
        
        <form id="admin-form-add-syllabus" style="display: flex; flex-direction: column; gap: 12px;">
          <div class="form-group" style="margin: 0;">
            <label class="form-label" for="admin-exam-select">Exam Target</label>
            <select class="form-input" id="admin-exam-select" required>
              <option value="SSC CGL">SSC CGL</option>
              <option value="NABARD">NABARD</option>
              <option value="Banking">Banking</option>
              <option value="Railway">Railway</option>
              <option value="State Exams">State Exams</option>
            </select>
          </div>
          <div class="form-group" style="margin: 0;">
            <label class="form-label" for="admin-subject-input">Subject Name</label>
            <input class="form-input" type="text" id="admin-subject-input" required placeholder="e.g. Quantitative Aptitude">
          </div>
          <div class="form-group" style="margin: 0;">
            <label class="form-label" for="admin-chapter-input">Chapter Name</label>
            <input class="form-input" type="text" id="admin-chapter-input" required placeholder="e.g. Compound Interest">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group" style="margin: 0;">
              <label class="form-label" for="admin-priority">Priority</label>
              <select class="form-input" id="admin-priority">
                <option value="High">High</option>
                <option value="Medium" selected>Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div class="form-group" style="margin: 0;">
              <label class="form-label" for="admin-difficulty">Difficulty</label>
              <select class="form-input" id="admin-difficulty">
                <option value="Easy">Easy</option>
                <option value="Medium" selected>Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" style="margin-top: 8px;">Insert Chapter Document</button>
        </form>
      </div>

      <!-- Master Database Clean utilities -->
      <div class="glass-panel glass-card dash-span-6" style="display: flex; flex-direction: column; gap: 16px;">
        <h3 style="font-family: var(--font-header); font-size: 16px;"><i class="fa-solid fa-triangle-exclamation" style="color: var(--color-error); margin-right: 8px;"></i>System Cleanup Utilities</h3>
        <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
          Warning: These utilities will wipe out records from online Firestore tables completely. Be sure to download a backup from Settings first.
        </p>

        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
          <button class="btn btn-glass btn-wipe" data-col="planner" style="color: var(--color-error); justify-content: flex-start;">
            <i class="fa-solid fa-trash-can"></i> Wipe Planner Targets
          </button>
          <button class="btn btn-glass btn-wipe" data-col="study_sessions" style="color: var(--color-error); justify-content: flex-start;">
            <i class="fa-solid fa-trash-can"></i> Wipe Study Logs & Streaks
          </button>
          <button class="btn btn-glass btn-wipe" data-col="notifications" style="color: var(--color-error); justify-content: flex-start;">
            <i class="fa-solid fa-trash-can"></i> Clear Notifications Logs
          </button>
        </div>
      </div>
    </div>
  `;

  // Syllabus addition Form handler
  const form = document.getElementById('admin-form-add-syllabus');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const exam = document.getElementById('admin-exam-select').value;
    const subject = document.getElementById('admin-subject-input').value;
    const chapter = document.getElementById('admin-chapter-input').value;
    const priority = document.getElementById('admin-priority').value;
    const difficulty = document.getElementById('admin-difficulty').value;

    try {
      await addSyllabusChapter({ exam, subject, chapter, priority, difficulty });
      form.reset();
      showToast('Syllabus chapter added online!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to add syllabus document.', 'error');
    }
  };

  // Wipe databases hooks
  container.querySelectorAll('.btn-wipe').forEach(btn => {
    btn.addEventListener('click', async () => {
      const colName = btn.dataset.col;
      if (confirm(`CRITICAL WARNING: Are you sure you want to delete ALL documents inside "${colName}" collection? This cannot be undone.`)) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Deleting...`;
        
        try {
          const snap = await getDocs(collection(db, colName));
          let count = 0;
          for (const docSnap of snap.docs) {
            await deleteDoc(doc(db, colName, docSnap.id));
            count++;
          }
          showToast(`Wiped ${count} documents from ${colName}.`, 'success');
        } catch (err) {
          console.error(err);
          showToast(`Cleanup utility failed.`, 'error');
        } finally {
          btn.disabled = false;
          btn.innerHTML = `<i class="fa-solid fa-trash-can"></i> Wipe ${colName.replace('_', ' ')}`;
        }
      }
    });
  });
}
