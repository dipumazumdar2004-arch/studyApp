import { db, auth } from '../firebase/config.js';
import { subscribeToMockTests, subscribeToStudySessions } from '../firebase/db.js';
import { createWeeklyHoursChart, createSubjectAccuracyChart } from '../components/Charts.js';
import { collection, getDocs, doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export function renderAnalyticsPage() {
  const container = document.getElementById('page-analytics');
  if (!container) return;

  const currentUser = localStorage.getItem('studysync_user') || 'User';

  container.innerHTML = `
    <!-- Top metrics comparison cards -->
    <div class="dashboard-grid" style="margin-bottom: 24px;">
      <!-- Leaderboard Header Card -->
      <div class="glass-panel glass-card dash-span-12" style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-family: var(--font-header); font-size: 18px;"><i class="fa-solid fa-trophy" style="color: var(--color-warning); margin-right: 8px;"></i>Weekly Leaderboard</h3>
          <span style="font-size: 12px; color: var(--text-secondary); font-weight: 500;">Who will wear the crown this week?</span>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 10px;">
          <!-- Competitor 1: Dipu -->
          <div class="glass-panel" id="leader-card-Dipu" style="padding: 16px; border: 1px solid var(--panel-border); display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div class="user-avatar-wrapper" style="width: 48px; height: 48px;">
                <img class="user-avatar" src="https://api.dicebear.com/7.x/bottts/svg?seed=Dipu" alt="Dipu" style="border-color: var(--color-primary);">
                <div id="crown-Dipu" style="display: none; position: absolute; top: -14px; left: calc(50% - 10px); color: #fbbf24; font-size: 16px;"><i class="fa-solid fa-crown"></i></div>
              </div>
              <div>
                <h4 style="font-family: var(--font-header); font-size: 16px;">Dipu</h4>
                <span style="font-size: 11px; color: var(--text-secondary);">Focus Warrior</span>
              </div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 10px; color: var(--text-muted); display: block; text-transform: uppercase;">Study Hours</span>
              <strong style="font-size: 20px; font-family: var(--font-header);" id="leader-hours-Dipu">0.0h</strong>
            </div>
          </div>

          <!-- Competitor 2: Meghali -->
          <div class="glass-panel" id="leader-card-Meghali" style="padding: 16px; border: 1px solid var(--panel-border); display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div class="user-avatar-wrapper" style="width: 48px; height: 48px;">
                <img class="user-avatar" src="https://api.dicebear.com/7.x/bottts/svg?seed=Meghali" alt="Meghali" style="border-color: var(--color-secondary);">
                <div id="crown-Meghali" style="display: none; position: absolute; top: -14px; left: calc(50% - 10px); color: #fbbf24; font-size: 16px;"><i class="fa-solid fa-crown"></i></div>
              </div>
              <div>
                <h4 style="font-family: var(--font-header); font-size: 16px;">Meghali</h4>
                <span style="font-size: 11px; color: var(--text-secondary);">Consistency Queen</span>
              </div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 10px; color: var(--text-muted); display: block; text-transform: uppercase;">Study Hours</span>
              <strong style="font-size: 20px; font-family: var(--font-header);" id="leader-hours-Meghali">0.0h</strong>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts panel Row -->
    <div class="dashboard-grid" style="margin-bottom: 24px;">
      <!-- Chart 1: Study hours -->
      <div class="glass-panel glass-card dash-span-6" style="height: 350px;">
        <h3 style="font-family: var(--font-header); font-size: 16px; margin-bottom: 16px;"><i class="fa-solid fa-chart-line" style="color: var(--color-primary); margin-right: 8px;"></i>Weekly Study Hours</h3>
        <div style="position: relative; height: calc(100% - 40px); width: 100%;">
          <canvas id="chart-weekly-hours"></canvas>
        </div>
      </div>

      <!-- Chart 2: Accuracy Radar -->
      <div class="glass-panel glass-card dash-span-6" style="height: 350px;">
        <h3 style="font-family: var(--font-header); font-size: 16px; margin-bottom: 16px;"><i class="fa-solid fa-chart-pie" style="color: var(--color-secondary); margin-right: 8px;"></i>Subject Accuracy Breakdown</h3>
        <div style="position: relative; height: calc(100% - 40px); width: 100%;">
          <canvas id="chart-subject-accuracy"></canvas>
        </div>
      </div>
    </div>

    <!-- Heatmaps rows -->
    <div class="dashboard-grid">
      <!-- Heatmap card -->
      <div class="glass-panel glass-card dash-span-12">
        <h3 style="font-family: var(--font-header); font-size: 16px; margin-bottom: 16px;"><i class="fa-solid fa-calendar-days" style="color: var(--color-success); margin-right: 8px;"></i>Consistency Grid (Last 30 Days)</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 10px;">
          <!-- Heatmap Dipu -->
          <div>
            <h4 style="font-family: var(--font-header); font-size: 14px; margin-bottom: 10px;">Dipu's Commitment</h4>
            <div id="heatmap-grid-Dipu" style="display: grid; grid-template-columns: repeat(10, 1fr); gap: 6px; width: 100%; max-width: 320px;">
              <!-- Loaded dynamically -->
            </div>
            <div style="display: flex; gap: 8px; font-size: 10px; color: var(--text-secondary); margin-top: 10px; align-items: center;">
              <span>Less</span>
              <div style="width: 10px; height: 10px; background: rgba(99,102,241,0.05); border: 1px solid var(--panel-border);"></div>
              <div style="width: 10px; height: 10px; background: rgba(99,102,241,0.3);"></div>
              <div style="width: 10px; height: 10px; background: rgba(99,102,241,0.6);"></div>
              <div style="width: 10px; height: 10px; background: rgba(99,102,241,0.95);"></div>
              <span>More (6h+)</span>
            </div>
          </div>

          <!-- Heatmap Meghali -->
          <div>
            <h4 style="font-family: var(--font-header); font-size: 14px; margin-bottom: 10px;">Meghali's Commitment</h4>
            <div id="heatmap-grid-Meghali" style="display: grid; grid-template-columns: repeat(10, 1fr); gap: 6px; width: 100%; max-width: 320px;">
              <!-- Loaded dynamically -->
            </div>
            <div style="display: flex; gap: 8px; font-size: 10px; color: var(--text-secondary); margin-top: 10px; align-items: center;">
              <span>Less</span>
              <div style="width: 10px; height: 10px; background: rgba(236,72,153,0.05); border: 1px solid var(--panel-border);"></div>
              <div style="width: 10px; height: 10px; background: rgba(236,72,153,0.3);"></div>
              <div style="width: 10px; height: 10px; background: rgba(236,72,153,0.6);"></div>
              <div style="width: 10px; height: 10px; background: rgba(236,72,153,0.95);"></div>
              <span>More (6h+)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind and build metrics
  bindAnalyticsData();
}

async function bindAnalyticsData() {
  // 1. Fetch Weekly Study hours statistics for both users
  // Generate labels for the last 7 dates
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  const dateLabels = dates.map(d => new Date(d).toLocaleDateString([], { weekday: 'short', day: 'numeric' }));

  // We read the study hours values from the user profiles and logs
  const studyData = {
    Dipu: Array(7).fill(0),
    Meghali: Array(7).fill(0)
  };

  // Pull records from firestore
  try {
    const { collection: fCollection, getDocs: fGetDocs, query: fQuery, where: fWhere } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Fetch study logs
    const logsQuery = fQuery(fCollection(db, 'study_sessions'), fWhere('timestamp', '>=', weekAgo));
    const logsSnap = await fGetDocs(logsQuery);
    
    logsSnap.forEach(docSnap => {
      const data = docSnap.data();
      if (!data.timestamp) return;
      const logDate = new Date(data.timestamp.seconds * 1000).toISOString().split('T')[0];
      const dateIndex = dates.indexOf(logDate);
      if (dateIndex !== -1 && studyData[data.uid]) {
        // Accumulate hours
        studyData[data.uid][dateIndex] += (data.durationMinutes / 60);
      }
    });
  } catch (err) {
    console.error("Failed to parse weekly logs:", err);
  }

  // Round values
  studyData.Dipu = studyData.Dipu.map(h => Math.round(h * 10) / 10);
  studyData.Meghali = studyData.Meghali.map(h => Math.round(h * 10) / 10);

  // Set total hours on cards
  const totalDipuHours = studyData.Dipu.reduce((a, b) => a + b, 0);
  const totalMeghaliHours = studyData.Meghali.reduce((a, b) => a + b, 0);

  document.getElementById('leader-hours-Dipu').innerText = `${totalDipuHours.toFixed(1)}h`;
  document.getElementById('leader-hours-Meghali').innerText = `${totalMeghaliHours.toFixed(1)}h`;

  // Render Crown decoration on the winner
  if (totalDipuHours > totalMeghaliHours) {
    document.getElementById('crown-Dipu').style.display = 'block';
    document.getElementById('crown-Meghali').style.display = 'none';
  } else if (totalMeghaliHours > totalDipuHours) {
    document.getElementById('crown-Meghali').style.display = 'block';
    document.getElementById('crown-Dipu').style.display = 'none';
  }

  // Create Hours comparison Line Chart
  createWeeklyHoursChart('chart-weekly-hours', dateLabels, studyData.Dipu, studyData.Meghali, 'Dipu', 'Meghali');

  // 2. Fetch subject accuracy breakdown from mock tests
  const subjectsList = ["Quantitative Aptitude", "Reasoning", "English Language", "General Awareness"];
  const accuracyData = {
    Dipu: Array(4).fill(0),
    Meghali: Array(4).fill(0)
  };

  subscribeToMockTests((tests) => {
    // Group accuracy per subject for each user
    subjectsList.forEach((sub, index) => {
      ['Dipu', 'Meghali'].forEach(user => {
        const userSubTests = tests.filter(t => t.uid === user && t.subject === sub);
        if (userSubTests.length > 0) {
          const sumAcc = userSubTests.reduce((a, b) => a + b.accuracy, 0);
          accuracyData[user][index] = Math.round(sumAcc / userSubTests.length);
        } else {
          accuracyData[user][index] = 50; // Fallback median value if no test logged
        }
      });
    });

    // Create Radar Chart
    createSubjectAccuracyChart('chart-subject-accuracy', subjectsList.map(s => s.split(' ')[0]), accuracyData.Dipu, accuracyData.Meghali, 'Dipu', 'Meghali');
  });

  // 3. Build study intensity heatmaps (last 30 days)
  const heatmapDates = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    heatmapDates.push(d.toISOString().split('T')[0]);
  }

  const heatmapLogs = { Dipu: {}, Meghali: {} };
  heatmapDates.forEach(date => {
    heatmapLogs.Dipu[date] = 0;
    heatmapLogs.Meghali[date] = 0;
  });

  try {
    const { collection: fCollection, getDocs: fGetDocs, query: fQuery, where: fWhere } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    const logsQuery = fQuery(fCollection(db, 'study_sessions'), fWhere('timestamp', '>=', monthAgo));
    const logsSnap = await fGetDocs(logsQuery);
    
    logsSnap.forEach(docSnap => {
      const data = docSnap.data();
      if (!data.timestamp) return;
      const logDate = new Date(data.timestamp.seconds * 1000).toISOString().split('T')[0];
      if (heatmapLogs[data.uid] && logDate in heatmapLogs[data.uid]) {
        heatmapLogs[data.uid][logDate] += (data.durationMinutes / 60);
      }
    });
  } catch (e) {
    console.error(e);
  }

  // Render Heatmaps Grid
  ['Dipu', 'Meghali'].forEach(user => {
    const grid = document.getElementById(`heatmap-grid-${user}`);
    if (!grid) return;
    
    const colorTheme = user === 'Dipu' ? '99,102,241' : '236,72,153';

    grid.innerHTML = heatmapDates.map(date => {
      const hours = heatmapLogs[user][date];
      
      // Calculate opacity color level
      let opacity = 0.05;
      if (hours > 0 && hours < 2) opacity = 0.3;
      else if (hours >= 2 && hours < 5) opacity = 0.6;
      else if (hours >= 5) opacity = 0.95;

      const dateLabel = new Date(date).toLocaleDateString([], {month: 'short', day: 'numeric'});

      return `
        <div style="aspect-ratio: 1; border-radius: 2px; background: rgba(${colorTheme}, ${opacity}); border: 1px solid var(--panel-border);" title="${dateLabel}: ${hours.toFixed(1)} hours study"></div>
      `;
    }).join('');
  });
}
