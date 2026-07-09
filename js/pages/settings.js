import { db, auth, isFirebaseConfigured, saveFirebaseConfig, firebaseConfig } from '../firebase/config.js';
import { collection, getDocs, doc, writeBatch, setDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export function renderSettingsPage() {
  const container = document.getElementById('page-settings');
  if (!container) return;

  const currentUser = localStorage.getItem('studysync_user') || 'User';

  const ytKey = localStorage.getItem('studysync_yt_api_key') || '';
  const geminiKey = localStorage.getItem('studysync_gemini_api_key') || '';

  const fbConfigStr = firebaseConfig ? JSON.stringify(firebaseConfig, null, 2) : '';

  container.innerHTML = `
    <div class="dashboard-grid">
      <!-- Card 1: Theme Settings -->
      <div class="glass-panel glass-card dash-span-6" style="display: flex; flex-direction: column; gap: 16px;">
        <h3 style="font-family: var(--font-header); font-size: 16px;"><i class="fa-solid fa-palette" style="color: var(--color-primary); margin-right: 8px;"></i>Personalization</h3>
        
        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px;">Interface Theme</span>
            <button id="btn-theme-toggle-settings" class="btn btn-glass" style="font-size: 13px;">
              ${document.body.classList.contains('light-theme') ? '<i class="fa-solid fa-sun"></i> Light Mode' : '<i class="fa-solid fa-moon"></i> Dark Mode'}
            </button>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
            <span style="font-size: 13px;">Accent Color Palette</span>
            <div style="display: flex; gap: 8px;" id="accent-colors-row">
              <div style="width: 24px; height: 24px; border-radius: 50%; background: #6366f1; cursor: pointer; border: 2px solid white;" data-color="indigo"></div>
              <div style="width: 24px; height: 24px; border-radius: 50%; background: #ec4899; cursor: pointer;" data-color="pink"></div>
              <div style="width: 24px; height: 24px; border-radius: 50%; background: #10b981; cursor: pointer;" data-color="emerald"></div>
              <div style="width: 24px; height: 24px; border-radius: 50%; background: #f59e0b; cursor: pointer;" data-color="amber"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 2: PDF Progress Exporter -->
      <div class="glass-panel glass-card dash-span-6" style="display: flex; flex-direction: column; gap: 16px;">
        <h3 style="font-family: var(--font-header); font-size: 16px;"><i class="fa-solid fa-file-pdf" style="color: var(--color-error); margin-right: 8px;"></i>PDF Study Report</h3>
        
        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 8px; flex: 1; justify-content: center;">
          <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
            Generate a comprehensive, beautifully styled PDF progress report containing your profile stats, syllabus tracker completed items, mock test scores, and active goals.
          </p>
          <div style="display: flex; gap: 12px; margin-top: 8px;">
            <button id="btn-export-pdf-report" class="btn btn-glass" style="flex: 1; background: rgba(239, 68, 68, 0.1); color: #f87171;"><i class="fa-solid fa-print"></i> Generate PDF Report</button>
          </div>
        </div>
      </div>

      <!-- Card 3: Database & API keys -->
      <div class="glass-panel glass-card dash-span-12" style="display: flex; flex-direction: column; gap: 16px;">
        <h3 style="font-family: var(--font-header); font-size: 16px;"><i class="fa-solid fa-key" style="color: var(--color-warning); margin-right: 8px;"></i>API Keys & Firebase Configurations</h3>
        
        <form id="form-api-keys" style="display: flex; flex-direction: column; gap: 16px; margin-top: 10px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <div class="form-group" style="margin: 0;">
              <label class="form-label" for="key-youtube">YouTube Data API Key (Optional)</label>
              <input class="form-input" type="password" id="key-youtube" value="${ytKey}" placeholder="AIzaSy...">
              <span style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">Enables video duration & upload dates.</span>
            </div>
            <div class="form-group" style="margin: 0;">
              <label class="form-label" for="key-gemini">Gemini API Key</label>
              <input class="form-input" type="password" id="key-gemini" value="${geminiKey}" placeholder="AIzaSy...">
              <span style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">Powers the AI assistant, concept summaries, and practice quizzes.</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="config-firebase">Firebase Firestore Web App Configuration JSON</label>
            <textarea class="form-input" id="config-firebase" style="height: 140px; font-family: monospace; font-size: 12px; resize: none;" placeholder="{\n  &quot;apiKey&quot;: &quot;...&quot;,\n  &quot;authDomain&quot;: &quot;...&quot;,\n  &quot;projectId&quot;: &quot;...&quot;\n}">${fbConfigStr}</textarea>
            <span style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">Paste the config JSON from your Firebase Project Settings. Enabling this saves all progress online.</span>
          </div>

          <button type="submit" class="btn btn-primary" style="align-self: flex-start; padding: 12px 30px;">Save API Configurations</button>
        </form>
      </div>
    </div>
  `;

  // Themes switching
  const settingsThemeBtn = document.getElementById('btn-theme-toggle-settings');
  const globalThemeBtn = document.getElementById('theme-toggle-btn');

  const toggleAction = () => {
    const isLight = document.body.classList.contains('light-theme');
    if (isLight) {
      document.body.classList.remove('light-theme');
      localStorage.setItem('studysync_theme', 'dark');
      settingsThemeBtn.innerHTML = '<i class="fa-solid fa-moon"></i> Dark Mode';
      if (globalThemeBtn) globalThemeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
      document.body.classList.add('light-theme');
      localStorage.setItem('studysync_theme', 'light');
      settingsThemeBtn.innerHTML = '<i class="fa-solid fa-sun"></i> Light Mode';
      if (globalThemeBtn) globalThemeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
  };

  settingsThemeBtn.addEventListener('click', toggleAction);

  // Accent Colors selection
  document.getElementById('accent-colors-row').addEventListener('click', (e) => {
    const colorBlock = e.target.closest('[data-color]');
    if (!colorBlock) return;
    
    document.querySelectorAll('#accent-colors-row div').forEach(d => d.style.border = 'none');
    colorBlock.style.border = '2px solid white';
    
    const color = colorBlock.dataset.color;
    localStorage.setItem('studysync_accent', color);
    applyAccentColor(color);
  });

  // Forms API Submit
  const apiForm = document.getElementById('form-api-keys');
  apiForm.onsubmit = (e) => {
    e.preventDefault();
    const ytVal = document.getElementById('key-youtube').value.trim();
    const geminiVal = document.getElementById('key-gemini').value.trim();
    const fbVal = document.getElementById('config-firebase').value.trim();

    if (ytVal) localStorage.setItem('studysync_yt_api_key', ytVal);
    else localStorage.removeItem('studysync_yt_api_key');

    if (geminiVal) localStorage.setItem('studysync_gemini_api_key', geminiVal);
    else localStorage.removeItem('studysync_gemini_api_key');

    if (fbVal) {
      try {
        const parsed = JSON.parse(fbVal);
        saveFirebaseConfig(parsed);
      } catch (err) {
        showToast("Invalid Firebase Configuration JSON format.", "error");
        return;
      }
    } else {
      localStorage.removeItem('studysync_firebase_config');
      window.location.reload();
    }

    showToast("API keys saved. Reloading configurations...", "success");
  };

  // Export PDF Report Generator
  document.getElementById('btn-export-pdf-report').addEventListener('click', () => {
    const user = localStorage.getItem('studysync_user') || 'User';
    
    // Parse DB keys from localStorage
    const getStorageData = (key) => {
      try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : [];
      } catch (err) {
        return [];
      }
    };

    const syllabus = getStorageData('studysync_syllabus');
    const mocks = getStorageData('studysync_mocks');
    const planner = getStorageData('studysync_planner');
    const sessions = getStorageData('studysync_sessions');
    const notes = getStorageData('studysync_notes');

    // 1. Calculate syllabus progress
    const totalTopics = syllabus.length;
    const completedTopics = syllabus.filter(x => x.completed).length;
    const syllabusPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    // 2. Calculate study hours
    const totalMinutes = sessions.filter(s => s.uid === user).reduce((acc, curr) => acc + Number(curr.durationMinutes || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    // 3. Formulate mock test tables
    const mockRowsHtml = mocks.filter(m => m.uid === user).map(m => `
      <tr>
        <td>${m.subject}</td>
        <td>${m.testName}</td>
        <td>${m.score} / ${m.totalMarks}</td>
        <td>${m.accuracy}%</td>
        <td>${new Date(m.date).toLocaleDateString()}</td>
      </tr>
    `).join('');

    // 4. Formulate active tasks
    const plannerTasks = planner.map(t => `
      <div style="padding:8px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between;">
        <span><strong>${t.title}</strong> (${t.subject})</span>
        <span style="font-size:11px; padding:2px 6px; border-radius:4px; background:#f1f5f9; color:#475569;">${t.status.toUpperCase()}</span>
      </div>
    `).join('');

    // 5. Formulate notes list
    const notesListHtml = notes.map(n => `
      <li><strong>${n.title}</strong> <span style="font-size:11px; color:#64748b;">(Created by ${n.authorId})</span></li>
    `).join('');

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert("Please allow popups to generate reports.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>StudySync Progress Report - ${user}</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Inter', sans-serif;
              color: #0f172a;
              padding: 40px;
              background: #fff;
              line-height: 1.5;
            }
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 3px solid #6366f1;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title-main {
              font-family: 'Outfit', sans-serif;
              font-size: 32px;
              font-weight: 700;
              color: #1e1b4b;
              margin: 0;
            }
            .report-card {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .card-stat {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 20px;
              border-radius: 12px;
              text-align: center;
            }
            .card-stat-title {
              font-size: 11px;
              text-transform: uppercase;
              color: #64748b;
              font-weight: 600;
              letter-spacing: 0.5px;
            }
            .card-stat-val {
              font-family: 'Outfit', sans-serif;
              font-size: 28px;
              font-weight: 700;
              color: #6366f1;
              margin-top: 8px;
            }
            .section-title {
              font-family: 'Outfit', sans-serif;
              font-size: 18px;
              color: #1e1b4b;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 6px;
              margin-top: 30px;
              margin-bottom: 15px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 10px 12px;
              text-align: left;
              font-size: 13px;
            }
            th {
              background: #f1f5f9;
              font-weight: 600;
            }
            ul {
              padding-left: 20px;
              margin: 0;
            }
            li {
              margin-bottom: 6px;
              font-size: 13px;
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              <h1 class="title-main">StudySync</h1>
              <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Comprehensive Study Progress Report</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 600; color: #1e1b4b;">Student: ${user}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Date: ${new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div class="report-card">
            <div class="card-stat">
              <div class="card-stat-title">Total Study Logged</div>
              <div class="card-stat-val">${totalHours} hrs</div>
            </div>
            <div class="card-stat">
              <div class="card-stat-title">Syllabus Progress</div>
              <div class="card-stat-val">${syllabusPct}%</div>
              <div style="font-size:10px; color:#64748b; margin-top:4px;">${completedTopics} of ${totalTopics} Topics Completed</div>
            </div>
            <div class="card-stat">
              <div class="card-stat-title">Mock Tests Logged</div>
              <div class="card-stat-val">${mocks.filter(m => m.uid === user).length} Tests</div>
            </div>
          </div>

          <h3 class="section-title">Mock Test Performance Tracker</h3>
          \${mockRowsHtml.length > 0 ? \`
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Test Name</th>
                  <th>Score</th>
                  <th>Accuracy</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                \${mockRowsHtml}
              </tbody>
            </table>
          \` : \`<p style="font-size:13px; color:#64748b; font-style:italic;">No mock tests logged yet.</p>\`}

          <h3 class="section-title">Active Planner Syllabus Goals</h3>
          \${plannerTasks.length > 0 ? \`
            <div style="border:1px solid #cbd5e1; border-radius:8px; overflow:hidden;">
              \${plannerTasks}
            </div>
          \` : \`<p style="font-size:13px; color:#64748b; font-style:italic;">No active goals found.</p>\`}

          <h3 class="section-title">Created Study Notes catalog</h3>
          \${notesListHtml.length > 0 ? \`
            <ul>
              \${notesListHtml}
            </ul>
          \` : \`<p style="font-size:13px; color:#64748b; font-style:italic;">No study notes created yet.</p>\`}

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  });
}

function applyAccentColor(color) {
  const root = document.documentElement;
  
  if (color === 'indigo') {
    root.style.setProperty('--color-primary', '#6366f1');
    root.style.setProperty('--color-primary-glow', 'rgba(99, 102, 241, 0.15)');
  } else if (color === 'pink') {
    root.style.setProperty('--color-primary', '#ec4899');
    root.style.setProperty('--color-primary-glow', 'rgba(236, 72, 153, 0.15)');
  } else if (color === 'emerald') {
    root.style.setProperty('--color-primary', '#10b981');
    root.style.setProperty('--color-primary-glow', 'rgba(16, 185, 129, 0.15)');
  } else if (color === 'amber') {
    root.style.setProperty('--color-primary', '#f59e0b');
    root.style.setProperty('--color-primary-glow', 'rgba(245, 158, 11, 0.15)');
  }
}
