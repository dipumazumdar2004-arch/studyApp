import { db, auth, isFirebaseConfigured } from '../firebase/config.js';
import { doc, onSnapshot, collection, query, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { subscribeToVideos, subscribeToTasks, subscribeToSyllabus } from '../firebase/db.js';

// Motivational quotes array
const MOTIVATIONAL_QUOTES = [
  { text: "Consistency beats intensity. 2 hours daily is better than 10 hours once a week.", author: "StudySync Guide" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it is done.", author: "Nelson Mandela" },
  { text: "Your mock test score is a diagnosis, not a final judgment. Focus on the weak topics.", author: "Exam Coach" },
  { text: "Meghali & Dipu, support each other! Collaborative learning increases retention by 60%.", author: "StudySync System" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" }
];

export function renderDashboard() {
  const container = document.getElementById('page-dashboard');
  if (!container) return;

  // Onboarding screen if Firebase is not configured
  if (!isFirebaseConfigured()) {
    container.innerHTML = `
      <div style="max-width: 600px; margin: 50px auto; text-align: center;" class="glass-panel glass-card">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 48px; color: var(--color-warning); margin-bottom: 20px;"></i>
        <h2 style="font-family: var(--font-header); margin-bottom: 12px;">Database Configuration Required</h2>
        <p style="color: var(--text-secondary); margin-bottom: 24px; line-height: 1.5;">
          StudySync uses Firebase Firestore to sync your progress, videos, and comments in real-time. Please configure your Firebase Keys in Settings or click the button below.
        </p>
        <button class="btn btn-primary" onclick="document.querySelector('[data-target=settings]').click()">Configure Database</button>
      </div>
    `;
    return;
  }

  const currentUser = localStorage.getItem('studysync_user') || 'User';
  const partnerUser = currentUser === 'Dipu' ? 'Meghali' : 'Dipu';

  // Base Dashboard HTML structure with grid
  container.innerHTML = `
    <div class="greeting-section">
      <div>
        <h2 id="dashboard-greeting" style="font-family: var(--font-header); font-weight: 800; font-size: 28px; letter-spacing: -0.5px;">Good Morning, ${currentUser}!</h2>
        <p class="dash-header-subtitle">Let's dominate today's targets together.</p>
      </div>
      <div style="display: flex; gap: 12px;">
        <button id="dash-btn-timer" class="btn btn-glass"><i class="fa-solid fa-hourglass-half"></i>Start Timer</button>
        <button id="dash-btn-addvideo" class="btn btn-primary"><i class="fa-solid fa-plus"></i>Share Video</button>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- Cards Panel 1: Stats summary rings -->
      <div class="glass-panel glass-card dash-span-8" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
        <div class="stats-summary-card">
          <div class="progress-ring-container">
            <svg class="progress-ring-svg">
              <circle class="progress-ring-circle-bg" cx="45" cy="45" r="38" stroke-width="6"/>
              <circle class="progress-ring-circle" id="ring-hours" cx="45" cy="45" r="38" stroke-width="6" stroke="var(--color-primary)"/>
            </svg>
            <span class="progress-ring-text" id="lbl-hours">0%</span>
          </div>
          <div>
            <span class="stats-summary-label">Today's Hours</span>
            <div class="stats-summary-value" id="val-hours">0 / 6h</div>
          </div>
        </div>

        <div class="stats-summary-card">
          <div class="progress-ring-container">
            <svg class="progress-ring-svg">
              <circle class="progress-ring-circle-bg" cx="45" cy="45" r="38" stroke-width="6"/>
              <circle class="progress-ring-circle" id="ring-streak" cx="45" cy="45" r="38" stroke-width="6" stroke="var(--color-secondary)"/>
            </svg>
            <span class="progress-ring-text" id="lbl-streak">0d</span>
          </div>
          <div>
            <span class="stats-summary-label">Study Streak</span>
            <div class="stats-summary-value" id="val-streak">0 Days</div>
          </div>
        </div>

        <div class="stats-summary-card">
          <div class="progress-ring-container">
            <svg class="progress-ring-svg">
              <circle class="progress-ring-circle-bg" cx="45" cy="45" r="38" stroke-width="6"/>
              <circle class="progress-ring-circle" id="ring-syllabus" cx="45" cy="45" r="38" stroke-width="6" stroke="var(--color-success)"/>
            </svg>
            <span class="progress-ring-text" id="lbl-syllabus">0%</span>
          </div>
          <div>
            <span class="stats-summary-label">Syllabus Complete</span>
            <div class="stats-summary-value" id="val-syllabus">0%</div>
          </div>
        </div>
      </div>

      <!-- Partner Status Card -->
      <div class="glass-panel glass-card dash-span-4 partner-status-dashboard">
        <h3 style="font-family: var(--font-header); font-size: 16px;">Partner Status</h3>
        <div class="user-presence-row" style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: var(--radius-sm);">
          <div class="user-avatar-wrapper">
            <img class="user-avatar" src="https://api.dicebear.com/7.x/bottts/svg?seed=${partnerUser}" alt="${partnerUser}">
            <div class="status-dot" id="dash-partner-dot"></div>
          </div>
          <div class="user-presence-info">
            <span class="user-presence-name">${partnerUser}</span>
            <span class="user-presence-status" id="dash-partner-status-text">Offline</span>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-secondary);">Today's Hours:</span>
            <span id="partner-hours-today" style="font-weight: 600;">0.0h</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-secondary);">Active Streak:</span>
            <span id="partner-streak" style="font-weight: 600;">0 Days</span>
          </div>
        </div>
      </div>

      <!-- Countdown Widget -->
      <div class="glass-panel glass-card dash-span-4 countdown-widget">
        <h3 style="font-family: var(--font-header); font-size: 16px;">SSC CGL Exam Countdown</h3>
        <div class="countdown-numbers">
          <div class="countdown-unit">
            <span class="countdown-val" id="countdown-days">00</span>
            <span class="countdown-lbl">Days</span>
          </div>
          <div class="countdown-unit">
            <span class="countdown-val" id="countdown-hours">00</span>
            <span class="countdown-lbl">Hours</span>
          </div>
        </div>
        <p style="font-size: 12px; color: var(--text-secondary);" id="countdown-subtext">Exam target date: September 12, 2026</p>
      </div>

      <!-- Daily Motivation -->
      <div class="glass-panel glass-card dash-span-4" style="display: flex; flex-direction: column; justify-content: center; gap: 8px;">
        <i class="fa-solid fa-quote-left" style="font-size: 24px; color: var(--color-primary); opacity: 0.3;"></i>
        <p id="motivation-text" style="font-size: 14px; font-style: italic; line-height: 1.5; font-weight: 500;"></p>
        <span id="motivation-author" style="font-size: 11px; color: var(--text-muted); align-self: flex-end; font-weight: 600;"></span>
      </div>

      <!-- Quick Actions / Planner Target summary -->
      <div class="glass-panel glass-card dash-span-4" style="display: flex; flex-direction: column; gap: 12px;">
        <h3 style="font-family: var(--font-header); font-size: 16px;">Today's Focus Targets</h3>
        <div id="dash-targets-list" style="display: flex; flex-direction: column; gap: 8px; flex: 1; overflow-y: auto;">
          <!-- Populated dynamically -->
          <div class="skeleton skeleton-text" style="height: 30px;"></div>
          <div class="skeleton skeleton-text" style="height: 30px;"></div>
        </div>
      </div>

      <!-- Latest Shared Video -->
      <div class="glass-panel glass-card dash-span-6" style="display: flex; flex-direction: column; gap: 16px;">
        <h3 style="font-family: var(--font-header); font-size: 16px;"><i class="fa-brands fa-youtube" style="color: red; margin-right: 8px;"></i>Latest Shared Video</h3>
        <div id="dash-latest-video-container" style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
          <div class="skeleton skeleton-card" style="height: 120px;"></div>
        </div>
      </div>

      <!-- Revision Alert Grid -->
      <div class="glass-panel glass-card dash-span-6" style="display: flex; flex-direction: column; gap: 16px;">
        <h3 style="font-family: var(--font-header); font-size: 16px;"><i class="fa-solid fa-clock-rotate-left" style="color: var(--color-info); margin-right: 8px;"></i>Revision Reminders Due</h3>
        <div id="dash-revisions-list" style="display: flex; flex-direction: column; gap: 10px; overflow-y: auto; max-height: 180px;">
          <!-- Loaded dynamically -->
          <div class="skeleton skeleton-text" style="height: 30px;"></div>
          <div class="skeleton skeleton-text" style="height: 30px;"></div>
        </div>
      </div>
    </div>
  `;

  // Apply basic button handlers
  document.getElementById('dash-btn-timer').addEventListener('click', () => {
    document.querySelector('[data-target=timer]').click();
  });
  document.getElementById('dash-btn-addvideo').addEventListener('click', () => {
    document.getElementById('modal-add-video').classList.add('active');
  });

  // Load Interactive SVG progress ring dimensions
  setupProgressRings();

  // Bind Dynamic Data
  bindDashboardData(currentUser, partnerUser);
}

function setupProgressRings() {
  const circles = document.querySelectorAll('.progress-ring-circle');
  circles.forEach(circle => {
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;
  });
}

function setRingProgress(id, percent, circumference = 2 * Math.PI * 38) {
  const circle = document.getElementById(id);
  if (!circle) return;
  const offset = circumference - (percent / 100) * circumference;
  circle.style.strokeDashoffset = offset;
}

function bindDashboardData(currentUser, partnerUser) {
  // Set Random Motivation Quote
  const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
  document.getElementById('motivation-text').innerText = `"${randomQuote.text}"`;
  document.getElementById('motivation-author').innerText = `— ${randomQuote.author}`;

  // Time Greeting Calculation
  const hours = new Date().getHours();
  let greeting = "Good Morning";
  if (hours >= 12 && hours < 17) greeting = "Good Afternoon";
  else if (hours >= 17) greeting = "Good Evening";
  document.getElementById('dashboard-greeting').innerText = `${greeting}, ${currentUser}!`;

  // Start countdown calculations to September 12, 2026
  setInterval(updateCountdown, 1000);
  updateCountdown();

  // Listen to User Stats (Current User)
  onSnapshot(doc(db, 'users', currentUser), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const studyHrs = Number(data.studyHoursToday || 0);
      const hoursPercent = Math.min((studyHrs / 6) * 100, 100); // 6 hours target
      
      setRingProgress('ring-hours', hoursPercent);
      document.getElementById('lbl-hours').innerText = `${Math.round(hoursPercent)}%`;
      document.getElementById('val-hours').innerText = `${studyHrs} / 6h`;
      
      const streak = Number(data.streak || 0);
      setRingProgress('ring-streak', Math.min((streak / 30) * 100, 100)); // 30 day target visual representation
      document.getElementById('lbl-streak').innerText = `${streak}d`;
      document.getElementById('val-streak').innerText = `${streak} Day${streak === 1 ? '' : 's'}`;

      // Update global header stats
      const headerStreak = document.getElementById('header-streak-count');
      if (headerStreak) headerStreak.innerText = streak;
      const headerHours = document.getElementById('header-hours-count');
      if (headerHours) headerHours.innerText = `${studyHrs}h`;
    }
  });

  // Listen to Partner Stats
  onSnapshot(doc(db, 'users', partnerUser), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const isOnline = data.status === 'online';
      const dot = document.getElementById('dash-partner-dot');
      const text = document.getElementById('dash-partner-status-text');
      
      if (dot && text) {
        dot.className = `status-dot ${isOnline ? 'online' : ''}`;
        text.innerText = isOnline ? 'Online Now' : 'Offline';
      }
      
      const partnerHrs = document.getElementById('partner-hours-today');
      if (partnerHrs) partnerHrs.innerText = `${data.studyHoursToday || 0}h`;
      const partnerStr = document.getElementById('partner-streak');
      if (partnerStr) partnerStr.innerText = `${data.streak || 0} Days`;
    }
  });

  // Fetch Overall Syllabus Progress
  // We compute total chapters vs completed chapters for current user
  subscribeToSyllabus('SSC CGL', (chapters) => {
    if (!chapters || chapters.length === 0) return;
    const userCompleted = chapters.filter(c => c.status && c.status[currentUser] === 'completed').length;
    const progressPercent = Math.round((userCompleted / chapters.length) * 100);
    
    setRingProgress('ring-syllabus', progressPercent);
    const lblSyllabus = document.getElementById('lbl-syllabus');
    const valSyllabus = document.getElementById('val-syllabus');
    if (lblSyllabus) lblSyllabus.innerText = `${progressPercent}%`;
    if (valSyllabus) valSyllabus.innerText = `${progressPercent}% Complete`;
  });

  // Listen to Planner Targets
  subscribeToTasks((tasks) => {
    const targetList = document.getElementById('dash-targets-list');
    if (!targetList) return;
    
    // Filter tasks for today assigned to me or both and not completed
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => !t.completed && (t.assignee === currentUser || t.assignee === 'both'));
    
    if (todayTasks.length === 0) {
      targetList.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px 0;">
          <i class="fa-solid fa-circle-check" style="font-size: 20px; color: var(--color-success); margin-bottom: 6px; display: block;"></i>
          All goals completed for today!
        </div>
      `;
      return;
    }
    
    targetList.innerHTML = todayTasks.slice(0, 3).map(t => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border: 1px solid var(--panel-border);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="fa-regular fa-circle" style="color: var(--color-primary);"></i>
          <span style="font-size: 13px; font-weight: 500;">${t.title}</span>
        </div>
        <span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span>
      </div>
    `).join('');
  });

  // Fetch Latest Shared Video
  subscribeToVideos((videos) => {
    const videoContainer = document.getElementById('dash-latest-video-container');
    if (!videoContainer) return;
    
    if (videos.length === 0) {
      videoContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-secondary); font-size: 13px; padding: 20px;">
          No shared videos yet. Paste a link to start studying!
        </div>
      `;
      return;
    }
    
    const latest = videos[0];
    videoContainer.innerHTML = `
      <div class="video-card glass-panel" style="border: none; background: rgba(255,255,255,0.02);">
        <div class="video-thumbnail-wrapper" style="border-radius: var(--radius-sm); overflow: hidden;">
          <img class="video-thumbnail" src="${latest.thumbnail}" alt="${latest.title}">
          <span class="video-duration">${latest.duration}</span>
        </div>
        <div class="video-info-box" style="padding: 10px 0 0 0;">
          <span class="video-title" style="font-size: 13px; font-weight: 600;">${latest.title}</span>
          <div class="video-meta" style="flex-direction: row; gap: 12px; margin-top: 4px;">
            <span>${latest.channel}</span>
            <span>•</span>
            <span>By ${latest.addedBy}</span>
          </div>
        </div>
      </div>
    `;
    
    videoContainer.querySelector('.video-card').addEventListener('click', () => {
      window.open(`https://www.youtube.com/watch?v=${latest.youtubeId}`, '_blank');
    });
  });

  // Load Revision Reminders Due
  // Show list of syllabus topics which are completed and due for revision
  subscribeToSyllabus('SSC CGL', (chapters) => {
    const revList = document.getElementById('dash-revisions-list');
    if (!revList) return;
    
    // Topics requiring revision for current user
    const revisionDue = chapters.filter(c => c.status && c.status[currentUser] === 'revision');
    
    if (revisionDue.length === 0) {
      revList.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px 0;">
          No revision items scheduled. Clean slate!
        </div>
      `;
      return;
    }
    
    revList.innerHTML = revisionDue.slice(0, 3).map(c => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--color-primary-glow); border-radius: var(--radius-sm); border: 1px solid var(--panel-border);">
        <div>
          <span style="font-size: 13px; font-weight: 700; display: block;">${c.chapter}</span>
          <span style="font-size: 10px; color: var(--text-secondary);">${c.subject}</span>
        </div>
        <span class="badge badge-hard" style="background: var(--color-primary); color: white;">Revision Due</span>
      </div>
    `).join('');
  });
}

function updateCountdown() {
  const targetDate = new Date("September 12, 2026 09:00:00").getTime();
  const now = new Date().getTime();
  const diff = targetDate - now;

  const daysVal = document.getElementById('countdown-days');
  const hoursVal = document.getElementById('countdown-hours');

  if (diff <= 0) {
    if (daysVal) daysVal.innerText = "00";
    if (hoursVal) hoursVal.innerText = "00";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (daysVal) daysVal.innerText = String(days).padStart(2, '0');
  if (hoursVal) hoursVal.innerText = String(hours).padStart(2, '0');
}
