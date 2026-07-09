// StudySync - Unified LocalStorage Application Controller & SPA Router

// ==========================================
// HYBRID DATABASE ENGINE (Apps Script Properties / LocalStorage)
// ==========================================
const LocalSettings = {
  get(key, defaultValue = null) {
    try { return localStorage.getItem(key) || defaultValue; } catch(e) { return defaultValue; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch(e) {}
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch(e) {}
  }
};

let appCache = {};
let useCloudStorage = false;

const DB = {
  get(key, defaultValue = []) {
    const val = appCache[key];
    return val ? JSON.parse(val) : defaultValue;
  },
  set(key, val) {
    const stringified = JSON.stringify(val);
    appCache[key] = stringified;
    
    if (useCloudStorage) {
      try {
        google.script.run.setProperty(key, stringified);
      } catch(e) {}
    } else {
      LocalSettings.set(key, stringified);
    }
  }
};

// Seed Default Data if empty
function initializeLocalStorageDB() {
  // 1. Syllabus Seeds
  if (!appCache['studysync_syllabus']) {
    const defaultSyllabus = [
      { id: "s1", exam: "SSC CGL", subject: "Quantitative Aptitude", chapter: "Percentage", priority: "High", difficulty: "Medium", status: { Dipu: "completed", Meghali: "in_progress" }, progress: { Dipu: 100, Meghali: 40 } },
      { id: "s2", exam: "SSC CGL", subject: "Quantitative Aptitude", chapter: "Profit & Loss", priority: "High", difficulty: "Hard", status: { Dipu: "in_progress", Meghali: "pending" }, progress: { Dipu: 60, Meghali: 0 } },
      { id: "s3", exam: "SSC CGL", subject: "Quantitative Aptitude", chapter: "Geometry", priority: "High", difficulty: "Hard", status: { Dipu: "pending", Meghali: "pending" }, progress: { Dipu: 0, Meghali: 0 } },
      { id: "s4", exam: "SSC CGL", subject: "Reasoning", chapter: "Syllogism", priority: "Medium", difficulty: "Medium", status: { Dipu: "completed", Meghali: "completed" }, progress: { Dipu: 100, Meghali: 100 } },
      { id: "s5", exam: "NABARD", subject: "ARD", chapter: "Soil Science", priority: "High", difficulty: "Hard", status: { Dipu: "pending", Meghali: "in_progress" }, progress: { Dipu: 0, Meghali: 50 } },
      { id: "s6", exam: "Banking", subject: "Quantitative Aptitude", chapter: "Data Interpretation", priority: "High", difficulty: "Hard", status: { Dipu: "in_progress", Meghali: "completed" }, progress: { Dipu: 50, Meghali: 100 } }
    ];
    DB.set('studysync_syllabus', defaultSyllabus);
  }

  // 2. PYQ Seeds
  if (!appCache['studysync_pyqs']) {
    const defaultPyqs = [
      { id: "p1", subject: "Quantitative Aptitude", chapter: "Geometry - Circles Tangent", year: 2023, difficulty: "Hard", userStatus: { Dipu: { solved: true, revisionRequired: false }, Meghali: { solved: false, revisionRequired: true } } },
      { id: "p2", subject: "Quantitative Aptitude", chapter: "Percentage Ratio Rules", year: 2024, difficulty: "Medium", userStatus: { Dipu: { solved: true, revisionRequired: false }, Meghali: { solved: true, revisionRequired: false } } },
      { id: "p3", subject: "Reasoning", chapter: "Syllogism Possibility", year: 2023, difficulty: "Medium", userStatus: { Dipu: { solved: false, revisionRequired: false }, Meghali: { solved: true, revisionRequired: false } } }
    ];
    DB.set('studysync_pyqs', defaultPyqs);
  }

  // 3. Mock Test Seeds
  if (!appCache['studysync_mocks']) {
    const defaultMocks = [
      { id: "m1", examName: "SSC CGL Tier 1 - Test 1", subject: "Quantitative Aptitude", marks: 145, maxMarks: 200, accuracy: 84, timeTakenMinutes: 55, uid: "Dipu", date: new Date().toLocaleDateString() },
      { id: "m2", examName: "SSC CGL Tier 1 - Test 1", subject: "Quantitative Aptitude", marks: 152, maxMarks: 200, accuracy: 88, timeTakenMinutes: 52, uid: "Meghali", date: new Date().toLocaleDateString() }
    ];
    DB.set('studysync_mocks', defaultMocks);
  }

  // 4. Default Profiles Seeds
  if (!appCache['studysync_profiles']) {
    const defaultProfiles = {
      Dipu: { streak: 6, studyHoursToday: 3.4, lastActiveDate: new Date().toISOString().split('T')[0] },
      Meghali: { streak: 9, studyHoursToday: 4.8, lastActiveDate: new Date().toISOString().split('T')[0] }
    };
    DB.set('studysync_profiles', defaultProfiles);
  }

  // 5. Default Shared Videos Seeds
  if (!appCache['studysync_videos']) {
    const defaultVideos = [
      {
        id: "v1",
        youtubeId: "v8qK4L-vF2Q",
        title: "Complete Geometry for SSC CGL Exam",
        channel: "Abhinay Maths",
        thumbnail: "https://img.youtube.com/vi/v8qK4L-vF2Q/hqdefault.jpg",
        duration: "1:24:12",
        uploadedAt: "2025-10-12",
        addedBy: "Dipu",
        subject: "Quantitative Aptitude",
        userStatus: {
          Dipu: { status: 'watched' },
          Meghali: { status: 'pending' }
        }
      }
    ];
    DB.set('studysync_videos', defaultVideos);
  }

  // 6. Default Govt Exams Seeds
  if (!appCache['studysync_exams']) {
    const defaultExams = ["SSC CGL", "NABARD", "Banking", "Railway", "State Exams"];
    DB.set('studysync_exams', defaultExams);
  }

  // 7. Default Timer Subjects Seeds
  if (!appCache['studysync_timer_subjects']) {
    const defaultSubjects = ["Quantitative Aptitude", "Reasoning", "English Language", "General Awareness"];
    DB.set('studysync_timer_subjects', defaultSubjects);
  }
}

// Dynamic DB Initialization
function initDb(onReady) {
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    useCloudStorage = true;
    google.script.run.withSuccessHandler(properties => {
      appCache = properties || {};
      initializeLocalStorageDB();
      onReady();
    }).getAllProperties();
  } else {
    // Load from local storage keys
    const keys = ["studysync_syllabus", "studysync_pyqs", "studysync_mocks", "studysync_profiles", "studysync_videos", "studysync_notes", "studysync_planner", "studysync_sessions", "studysync_exams", "studysync_timer_subjects"];
    keys.forEach(k => {
      appCache[k] = LocalSettings.get(k);
    });
    initializeLocalStorageDB();
    onReady();
  }
}

// ==========================================
// CORE HELPERS & TOASTS
// ==========================================
function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
}

window.showToast = function(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'fa-circle-info';
  if (type === 'success') icon = 'fa-circle-check';
  else if (type === 'error') icon = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${icon} toast-icon"></i>
    <div class="toast-content">
      <div class="toast-title">${type.toUpperCase()}</div>
      <div class="toast-desc">${message}</div>
    </div>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 50);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
};

// ==========================================
// YOUTUBE METADATA EXTRACTOR (Serverless oEmbed)
// ==========================================
function extractYoutubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

async function fetchYoutubeMetadata(videoUrl) {
  const videoId = extractYoutubeId(videoUrl);
  if (!videoId) throw new Error("Invalid YouTube link format.");

  const response = await fetch("https://noembed.com/embed?url=https://www.youtube.com/watch?v=" + videoId);
  const data = await response.json();
  if (data.error) throw new Error("Video not found.");

  return {
    youtubeId: videoId,
    title: data.title,
    channel: data.author_name,
    thumbnail: "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg",
    duration: "N/A",
    uploadedAt: "Recently"
  };
}

// ==========================================
// CUSTOM NOTE EDITOR COMPONENT
// ==========================================
class NoteEditor {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onSave = options.onSave || (() => {});
    this.placeholder = options.placeholder || "Write study notes here...";
    this.init();
  }

  init() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="note-editor-wrapper glass-panel" style="background: rgba(255,255,255,0.01); border: none;">
        <div class="note-editor-toolbar" style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 8px;">
          <button class="note-toolbar-btn btn-format" data-cmd="formatBlock" data-val="H1">H1</button>
          <button class="note-toolbar-btn btn-format" data-cmd="formatBlock" data-val="H2">H2</button>
          <button class="note-toolbar-btn btn-format" data-cmd="bold"><i class="fa-solid fa-bold"></i></button>
          <button class="note-toolbar-btn btn-format" data-cmd="italic"><i class="fa-solid fa-italic"></i></button>
          <button class="note-toolbar-btn btn-format" data-cmd="hiliteColor" data-val="#4f46e5"><i class="fa-solid fa-highlighter"></i></button>
          <button class="note-toolbar-btn btn-insert-todo"><i class="fa-regular fa-square-check"></i> Todo</button>
          <button class="note-toolbar-btn btn-insert-table"><i class="fa-solid fa-table"></i> Table</button>
          <button class="note-toolbar-btn btn-upload-photo" style="background: rgba(99, 102, 241, 0.1); color: #818cf8;"><i class="fa-solid fa-camera"></i> Photo</button>
          <button class="note-toolbar-btn btn-export-pdf" style="background: rgba(239, 68, 68, 0.1); color: #f87171;"><i class="fa-solid fa-file-pdf"></i> PDF</button>
          <button class="note-toolbar-btn btn-save-note-doc" style="margin-left: auto; background: var(--color-success-glow);"><i class="fa-solid fa-floppy-disk"></i> Save</button>
        </div>
        <div class="note-editor-body" contenteditable="true" spellcheck="false" style="min-height: 250px;"></div>
      </div>
    `;
    this.editorBody = this.container.querySelector('.note-editor-body');
    this.setupEvents();
  }

  setupEvents() {
    this.container.querySelectorAll('.btn-format').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const cmd = btn.dataset.cmd;
        const val = btn.dataset.val || null;
        document.execCommand(cmd, false, val);
        this.editorBody.focus();
      });
    });

    this.container.querySelector('.btn-insert-todo').addEventListener('click', (e) => {
      e.preventDefault();
      document.execCommand('insertHTML', false, `<div style="display:flex;gap:8px;margin-bottom:6px;"><input type="checkbox" style="margin-top:4px;"><span contenteditable="true" style="outline:none;">New target</span></div>`);
      this.editorBody.focus();
    });

    this.container.querySelector('.btn-insert-table').addEventListener('click', (e) => {
      e.preventDefault();
      document.execCommand('insertHTML', false, `<table style="width:100%;border-collapse:collapse;margin:10px 0;"><tr><td style="border:1px solid var(--panel-border);padding:6px;">Cell</td><td style="border:1px solid var(--panel-border);padding:6px;">Cell</td></tr></table>`);
      this.editorBody.focus();
    });

    this.container.querySelector('.btn-upload-photo').addEventListener('click', (e) => {
      e.preventDefault();
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      
      fileInput.onchange = (evt) => {
        const file = evt.target.files[0];
        if (!file) return;
        
        showToast("Compressing image...", "info");
        
        this.compressImage(file, (compressedBase64) => {
          this.editorBody.focus();
          document.execCommand('insertHTML', false, `<img src="${compressedBase64}" style="max-width: 100%; border-radius: 8px; margin: 12px 0; display: block; box-shadow: 0 4px 15px rgba(0,0,0,0.25);">`);
          showToast("Image inserted successfully!", "success");
        });
      };
      fileInput.click();
    });

    this.container.querySelector('.btn-export-pdf').addEventListener('click', (e) => {
      e.preventDefault();
      this.exportPdf();
    });

    this.container.querySelector('.btn-save-note-doc').addEventListener('click', () => {
      this.onSave(this.getContent());
    });
  }

  compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        callback(compressedBase64);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  exportPdf() {
    const noteTitle = document.getElementById('active-note-title').value.trim() || 'Untitled Note';
    const content = this.getContent();
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      showToast("Please allow popups to export PDFs.", "error");
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>${noteTitle}</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Inter', sans-serif;
              color: #0f172a;
              padding: 40px;
              background: #fff;
              line-height: 1.6;
            }
            h1, h2, h3 {
              font-family: 'Outfit', sans-serif;
              color: #1e1b4b;
            }
            h1 {
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 12px;
              font-size: 28px;
              margin-bottom: 24px;
            }
            img {
              max-width: 100%;
              border-radius: 8px;
              margin: 15px 0;
              box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            td, th {
              border: 1px solid #cbd5e1;
              padding: 8px 12px;
            }
            th {
              background-color: #f1f5f9;
            }
            .meta {
              font-size: 12px;
              color: #64748b;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <h1>${noteTitle}</h1>
          <div class="meta">Exported from StudySync on ${new Date().toLocaleDateString()}</div>
          <div>${content}</div>
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
  }

  getContent() { return this.editorBody.innerHTML; }
  setContent(html) { this.editorBody.innerHTML = html || ''; }
}

// ==========================================
// STUDY TIMER (POMODORO) COMPONENT
// ==========================================
class StudyTimer {
  constructor() {
    this.minutes = 25;
    this.seconds = 0;
    this.initialMinutes = 25;
    this.timerId = null;
    this.isRunning = false;
    this.isPaused = false;
    this.audioCtx = null;
  }

  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const subjects = DB.get('studysync_timer_subjects', ["Quantitative Aptitude", "Reasoning", "English Language", "General Awareness"]);
    
    container.innerHTML = `
      <div class="timer-page-layout glass-panel glass-card">
        <h2 style="font-family:var(--font-header);">Pomodoro Clock</h2>
        <div class="timer-ring-wrapper">
          <svg class="timer-ring-svg">
            <circle class="timer-circle-bg" cx="140" cy="140" r="125" stroke-width="10"/>
            <circle class="timer-circle-fill" id="timer-ring-circle" cx="140" cy="140" r="125" stroke-width="10" stroke-dasharray="785.4" stroke-dashoffset="0"/>
          </svg>
          <div class="timer-time-display">
            <span class="timer-minutes-seconds" id="timer-clock-text">25:00</span>
            <span class="timer-state-lbl" id="timer-status-subtext">Focusing</span>
          </div>
        </div>
        <div style="display:flex;gap:12px;width:100%;align-items:center;margin-bottom:12px;">
          <div style="display:flex;gap:8px;flex:1;align-items:center;">
            <select class="form-input" id="timer-select-subject" style="flex:1;">
              ${subjects.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
            <button id="btn-timer-add-subject" class="btn btn-glass" style="padding:12px 14px;border-radius:var(--radius-sm);"><i class="fa-solid fa-plus"></i></button>
          </div>
          <select class="form-input" id="timer-select-session" style="width:120px;">
            <option value="25" selected>25 Mins</option>
            <option value="50">50 Mins</option>
            <option value="5">5 Mins (Break)</option>
          </select>
        </div>
        <div class="timer-controls">
          <button id="btn-timer-start" class="btn btn-primary">Start</button>
          <button id="btn-timer-pause" class="btn btn-glass" style="display:none;">Pause</button>
          <button id="btn-timer-reset" class="btn btn-glass" style="display:none;color:var(--color-error);">Reset</button>
        </div>
      </div>
    `;

    this.circle = document.getElementById('timer-ring-circle');
    this.clockText = document.getElementById('timer-clock-text');
    this.statusText = document.getElementById('timer-status-subtext');
    this.subjectSelect = document.getElementById('timer-select-subject');
    this.durationSelect = document.getElementById('timer-select-session');
    this.startBtn = document.getElementById('btn-timer-start');
    this.pauseBtn = document.getElementById('btn-timer-pause');
    this.resetBtn = document.getElementById('btn-timer-reset');

    this.setupEvents();
  }

  setupEvents() {
    // Add custom subject trigger
    const addSubBtn = document.getElementById('btn-timer-add-subject');
    if (addSubBtn) {
      addSubBtn.addEventListener('click', () => {
        const newSub = prompt("Enter new subject name:");
        if (newSub && newSub.trim()) {
          const trimmed = newSub.trim();
          const list = DB.get('studysync_timer_subjects', ["Quantitative Aptitude", "Reasoning", "English Language", "General Awareness"]);
          if (!list.includes(trimmed)) {
            list.push(trimmed);
            DB.set('studysync_timer_subjects', list);
            showToast(`Subject "${trimmed}" added!`, "success");
            this.subjectSelect.innerHTML = list.map(s => `<option value="${s}">${s}</option>`).join('');
            this.subjectSelect.value = trimmed;
          } else {
            showToast("Subject already exists!", "error");
          }
        }
      });
    }

    this.durationSelect.addEventListener('change', () => {
      if (this.isRunning) return;
      const mins = Number(this.durationSelect.value);
      this.minutes = mins;
      this.seconds = 0;
      this.initialMinutes = mins;
      this.clockText.innerText = `${String(mins).padStart(2,'0')}:00`;
    });

    this.startBtn.addEventListener('click', () => {
      this.isRunning = true;
      this.startBtn.style.display = 'none';
      this.pauseBtn.style.display = 'inline-flex';
      this.resetBtn.style.display = 'inline-flex';
      
      const totalSec = this.initialMinutes * 60;
      this.timerId = setInterval(() => {
        if (this.seconds === 0) {
          if (this.minutes === 0) {
            this.complete();
            return;
          }
          this.minutes--;
          this.seconds = 59;
        } else {
          this.seconds--;
        }
        this.clockText.innerText = `${String(this.minutes).padStart(2,'0')}:${String(this.seconds).padStart(2,'0')}`;
        const offset = 785.4 - (((this.minutes * 60) + this.seconds) / totalSec * 785.4);
        this.circle.style.strokeDashoffset = offset;
      }, 1000);
    });

    this.pauseBtn.addEventListener('click', () => {
      if (this.isPaused) {
        this.isPaused = false;
        this.pauseBtn.innerText = "Pause";
        this.startBtn.click();
      } else {
        this.isPaused = true;
        clearInterval(this.timerId);
        this.pauseBtn.innerText = "Resume";
      }
    });

    this.resetBtn.addEventListener('click', () => {
      clearInterval(this.timerId);
      this.isRunning = false;
      this.isPaused = false;
      this.startBtn.style.display = 'inline-flex';
      this.pauseBtn.style.display = 'none';
      this.resetBtn.style.display = 'none';
      this.minutes = this.initialMinutes;
      this.seconds = 0;
      this.clockText.innerText = `${String(this.minutes).padStart(2,'0')}:00`;
      this.circle.style.strokeDashoffset = 0;
    });
  }

  complete() {
    clearInterval(this.timerId);
    this.playTone();
    const sub = this.subjectSelect.value;
    const user = LocalSettings.get('studysync_user') || 'User';

    // Log study session locally
    const sessions = DB.get('studysync_sessions');
    sessions.push({
      uid: user,
      durationMinutes: this.initialMinutes,
      subject: sub,
      timestamp: new Date().toISOString()
    });
    DB.set('studysync_sessions', sessions);

    // Update study profiles stats
    const profiles = DB.get('studysync_profiles');
    if (profiles[user]) {
      profiles[user].studyHoursToday += (this.initialMinutes / 60);
      profiles[user].studyHoursToday = Math.round(profiles[user].studyHoursToday * 10) / 10;
      DB.set('studysync_profiles', profiles);
    }

    showToast(`Focus session logged: +${this.initialMinutes} mins!`, "success");
    this.resetBtn.click();
  }

  playTone() {
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
      osc.start(this.audioCtx.currentTime);
      osc.stop(this.audioCtx.currentTime + 0.5);
    } catch(e) {}
  }
}

const pomodoroTimer = new StudyTimer();

// ==========================================
// PAGE RENDERERS
// ==========================================

// 1. Dashboard Page
function renderDashboard() {
  const container = document.getElementById('page-dashboard');
  if (!container) return;

  const currentUser = LocalSettings.get('studysync_user') || 'User';
  const partnerUser = currentUser === 'Dipu' ? 'Meghali' : 'Dipu';

  const profiles = DB.get('studysync_profiles');
  const myProfile = profiles[currentUser] || { streak: 1, studyHoursToday: 0 };
  const partProfile = profiles[partnerUser] || { streak: 1, studyHoursToday: 0 };

  const syllabus = DB.get('studysync_syllabus');
  const completedChapters = syllabus.filter(c => c.status && c.status[currentUser] === 'completed').length;
  const syllabusPercent = syllabus.length ? Math.round((completedChapters / syllabus.length) * 100) : 0;

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <h2 style="font-family:var(--font-header);font-size:26px;">Good Day, ${currentUser}!</h2>
        <p style="font-size:12px;color:var(--text-secondary);">Manage syllabus, streaks, and focus targets local-first.</p>
      </div>
      <div style="display:flex;gap:12px;">
        <button class="btn btn-glass" onclick="document.querySelector('[data-target=timer]').click()">Start Timer</button>
        <button class="btn btn-primary" onclick="document.getElementById('modal-add-video').classList.add('active')">Share Video</button>
      </div>
    </div>

    <div class="dashboard-grid" style="margin-top:20px;">
      <!-- Stats summary rings -->
      <div class="glass-panel glass-card dash-span-8" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
        <div>
          <span style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">Today's Study Hours</span>
          <h4 style="font-size:24px;font-family:var(--font-header);color:var(--color-primary);">${myProfile.studyHoursToday} / 6h</h4>
        </div>
        <div>
          <span style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">Study Streak</span>
          <h4 style="font-size:24px;font-family:var(--font-header);color:var(--color-secondary);">${myProfile.streak} Days</h4>
        </div>
        <div>
          <span style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">Syllabus Completed</span>
          <h4 style="font-size:24px;font-family:var(--font-header);color:var(--color-success);">${syllabusPercent}%</h4>
        </div>
      </div>

      <!-- Partner presence -->
      <div class="glass-panel glass-card dash-span-4" style="display:flex;flex-direction:column;gap:10px;">
        <span style="font-size:13px;font-weight:700;">Partner Status (${partnerUser})</span>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:10px;height:10px;border-radius:50%;background:var(--color-success);"></div>
          <span style="font-size:12px;">Streak: <strong>${partProfile.streak} Days</strong></span>
        </div>
        <div style="font-size:11px;color:var(--text-secondary);">
          Today's Hours: ${partProfile.studyHoursToday}h
        </div>
      </div>

      <!-- Countdown -->
      <div class="glass-panel glass-card dash-span-6" style="text-align:center;">
        <span style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;">SSC CGL Tier 1 Countdown</span>
        <h3 style="font-size:28px;font-family:var(--font-header);margin-top:8px;background:var(--grad-mixed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">68 Days Left</h3>
        <p style="font-size:11px;color:var(--text-muted);margin-top:4px;">Exam date target: September 12, 2026</p>
      </div>

      <!-- Quote -->
      <div class="glass-panel glass-card dash-span-6" style="display:flex;flex-direction:column;justify-content:center;background:var(--panel-bg);">
        <i class="fa-solid fa-quote-left" style="font-size:18px;color:var(--color-primary);opacity:0.3;margin-bottom:4px;"></i>
        <p style="font-size:13px;font-style:italic;line-height:1.5;">"Success is not final, failure is not fatal: it is the courage to continue that counts."</p>
      </div>
    </div>
  `;

  // Bind streak to main header
  const headerStreak = document.getElementById('header-streak-count');
  if (headerStreak) headerStreak.innerText = myProfile.streak;
  const headerHours = document.getElementById('header-hours-count');
  if (headerHours) headerHours.innerText = `${myProfile.studyHoursToday}h`;
}

// 2. YouTube Library Page
function renderYoutubeLibrary() {
  const container = document.getElementById('page-youtube');
  if (!container) return;

  const user = LocalSettings.get('studysync_user') || 'User';
  const partner = user === 'Dipu' ? 'Meghali' : 'Dipu';

  container.innerHTML = `
    <div class="youtube-actions">
      <input type="text" id="youtube-search" class="form-input" style="max-width:300px;" placeholder="Search shared library...">
      <button class="btn btn-primary" onclick="document.getElementById('modal-add-video').classList.add('active')">Add Video</button>
    </div>
    <div class="video-grid" id="youtube-video-grid" style="margin-top:20px;"></div>
  `;

  const grid = document.getElementById('youtube-video-grid');
  const searchInput = document.getElementById('youtube-search');

  const loadGrid = () => {
    const videos = DB.get('studysync_videos');
    const query = searchInput.value.toLowerCase();
    
    const filtered = videos.filter(v => v.title.toLowerCase().includes(query) || v.channel.toLowerCase().includes(query));

    if (filtered.length === 0) {
      grid.innerHTML = `<p style="grid-column:1/-1;color:var(--text-secondary);">No matching study videos found.</p>`;
      return;
    }

    grid.innerHTML = filtered.map(v => {
      const myStatus = v.userStatus?.[user] || { status: 'pending' };
      const partStatus = v.userStatus?.[partner] || { status: 'pending' };

      return `
        <div class="video-card glass-panel" style="padding:12px;" id="video-card-${v.id}">
          <img src="${v.thumbnail}" style="width:100%;border-radius:var(--radius-sm);" alt="thumbnail">
          <div style="margin-top:8px;">
            <h4 style="font-size:13px;line-height:1.3;font-family:var(--font-header);">${v.title}</h4>
            <span style="font-size:11px;color:var(--text-muted);">${v.channel}</span>
            <div style="margin-top:8px;font-size:11px;color:var(--text-secondary);">
              Partner solved status: <strong>${partStatus.status.toUpperCase()}</strong>
            </div>
            
            <div style="display:flex;gap:8px;margin-top:12px;border-top:1px solid var(--panel-border);padding-top:8px;justify-content:space-between;">
              <button class="btn btn-glass btn-watch" style="padding:4px 8px;font-size:11px;" data-url="https://youtube.com/watch?v=${v.youtubeId}">Play</button>
              <button class="btn btn-glass btn-toggle-status" style="padding:4px 8px;font-size:11px;" data-id="${v.id}" data-current="${myStatus.status}">
                ${myStatus.status === 'watched' ? 'Watched' : 'Mark Watched'}
              </button>
              <button class="btn btn-glass btn-del-video" style="padding:4px;color:var(--color-error);" data-id="${v.id}"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click events
    filtered.forEach(v => {
      const card = document.getElementById(`video-card-${v.id}`);
      card.querySelector('.btn-watch').addEventListener('click', () => {
        window.open("https://youtube.com/watch?v=" + v.youtubeId, '_blank');
      });

      card.querySelector('.btn-toggle-status').addEventListener('click', () => {
        const videosList = DB.get('studysync_videos');
        const match = videosList.find(x => x.id === v.id);
        if (match) {
          if (!match.userStatus) match.userStatus = {};
          if (!match.userStatus[user]) match.userStatus[user] = {};
          
          const current = match.userStatus[user].status;
          match.userStatus[user].status = current === 'watched' ? 'pending' : 'watched';
          DB.set('studysync_videos', videosList);
          showToast("Video status updated locally!", "success");
          loadGrid();
        }
      });

      card.querySelector('.btn-del-video').addEventListener('click', () => {
        if (confirm("Delete this video card?")) {
          const videosList = DB.get('studysync_videos').filter(x => x.id !== v.id);
          DB.set('studysync_videos', videosList);
          showToast("Video deleted.", "info");
          loadGrid();
        }
      });
    });
  };

  searchInput.addEventListener('input', loadGrid);
  loadGrid();

  // Add video handle
  const form = document.getElementById('form-add-video');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const url = document.getElementById('video-url').value;
    const subject = document.getElementById('video-subject').value;

    try {
      const meta = await fetchYoutubeMetadata(url);
      const videos = DB.get('studysync_videos');
      videos.push({
        id: `v_${Date.now()}`,
        ...meta,
        subject,
        addedBy: user,
        userStatus: {
          Dipu: { status: 'pending' },
          Meghali: { status: 'pending' }
        }
      });
      DB.set('studysync_videos', videos);
      form.reset();
      document.getElementById('modal-add-video').classList.remove('active');
      showToast("Video added locally!", "success");
      loadGrid();
    } catch(err) {
      showToast(err.message, "error");
    }
  };
}

// 3. Syllabus Page
function renderSyllabusTracker() {
  const container = document.getElementById('page-syllabus');
  if (!container) return;

  const user = LocalSettings.get('studysync_user') || 'User';
  const partner = user === 'Dipu' ? 'Meghali' : 'Dipu';
  const exams = DB.get('studysync_exams', ["SSC CGL", "NABARD", "Banking", "Railway", "State Exams"]);

  container.innerHTML = `
    <div class="syllabus-tabs" id="syllabus-tabs-bar">
      ${exams.map((ex, idx) => `
        <button class="syllabus-tab-btn ${idx === 0 ? 'active' : ''}" data-exam="${ex}">${ex}</button>
      `).join('')}
    </div>

    <div class="syllabus-table-wrapper" style="margin-top:16px;">
      <table class="syllabus-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Chapter</th>
            <th>Your Progress</th>
            <th>Status (You | Partner)</th>
          </tr>
        </thead>
        <tbody id="syllabus-body-rows"></tbody>
      </table>
    </div>
  `;

  let activeExam = exams.length ? exams[0] : "";
  const tbody = document.getElementById('syllabus-body-rows');

  const loadSyllabusRows = () => {
    const list = DB.get('studysync_syllabus');
    const examChapters = list.filter(c => c.exam === activeExam);

    if (examChapters.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No chapters set. Create them in Data Manager page.</td></tr>`;
      return;
    }

    tbody.innerHTML = examChapters.map(c => {
      const myStat = c.status?.[user] || 'pending';
      const partStat = c.status?.[partner] || 'pending';
      const myProg = c.progress?.[user] || 0;

      return `
        <tr id="ch-row-${c.id}">
          <td><strong>${c.subject}</strong></td>
          <td>${c.chapter}</td>
          <td>
            <input type="range" class="prog-slider" min="0" max="100" step="10" value="${myProg}" style="width:70px; accent-color:var(--color-primary);">
            <span style="font-size:11px;font-weight:700;">${myProg}%</span>
          </td>
          <td>
            <div style="display:flex;gap:8px;">
              <div class="user-status-avatar-circle status-${myStat} cycle-status-btn" data-id="${c.id}" data-current="${myStat}">${user[0]}</div>
              <div class="user-status-avatar-circle status-${partStat}">${partner[0]}</div>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach events
    examChapters.forEach(c => {
      const row = document.getElementById(`ch-row-${c.id}`);
      if (!row) return;

      row.querySelector('.prog-slider').addEventListener('change', (e) => {
        const val = Number(e.target.value);
        const listAll = DB.get('studysync_syllabus');
        const match = listAll.find(x => x.id === c.id);
        if (match) {
          if (!match.progress) match.progress = {};
          if (!match.status) match.status = {};
          match.progress[user] = val;
          
          if (val === 100) match.status[user] = 'completed';
          else if (val > 0 && match.status[user] === 'pending') match.status[user] = 'in_progress';
          else if (val === 0) match.status[user] = 'pending';

          DB.set('studysync_syllabus', listAll);
          loadSyllabusRows();
        }
      });

      row.querySelector('.cycle-status-btn').addEventListener('click', () => {
        const listAll = DB.get('studysync_syllabus');
        const match = listAll.find(x => x.id === c.id);
        if (match) {
          if (!match.status) match.status = {};
          if (!match.progress) match.progress = {};

          const current = match.status[user] || 'pending';
          let next = 'pending';
          let prog = 0;

          if (current === 'pending') { next = 'in_progress'; prog = 30; }
          else if (current === 'in_progress') { next = 'completed'; prog = 100; }
          else if (current === 'completed') { next = 'revision'; prog = 100; }
          
          match.status[user] = next;
          match.progress[user] = prog;
          DB.set('studysync_syllabus', listAll);
          showToast(`Syllabus updated: ${next}`, "success");
          loadSyllabusRows();
        }
      });
    });
  };

  document.getElementById('syllabus-tabs-bar').addEventListener('click', (e) => {
    const btn = e.target.closest('.syllabus-tab-btn');
    if (!btn) return;
    document.querySelectorAll('.syllabus-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeExam = btn.dataset.exam;
    loadSyllabusRows();
  });

  loadSyllabusRows();
}

// 4. Study Notes Page
function renderNotesPage() {
  const container = document.getElementById('page-notes');
  if (!container) return;

  const user = LocalSettings.get('studysync_user') || 'User';

  container.innerHTML = `
    <div class="notes-container" id="notes-main-wrapper">
      <div class="notes-sidebar">
        <button id="btn-create-note" class="btn btn-primary" style="width:100%;">New Note</button>
        <div class="notes-list" id="notes-catalog-list" style="margin-top:16px;"></div>
      </div>
      <div class="glass-panel" style="padding:16px;display:flex;flex-direction:column;">
        <div style="display:flex;align-items:center;margin-bottom:12px;gap:8px;">
          <button id="btn-notes-back" class="btn btn-glass btn-notes-back-mobile" style="padding:10px 14px;border-radius:var(--radius-sm);"><i class="fa-solid fa-arrow-left"></i> Back</button>
          <input type="text" id="active-note-title" class="form-input" style="font-size:18px;font-family:var(--font-header);flex:1;margin:0;" value="Select a Note" disabled>
        </div>
        <div id="notes-editor-frame" style="flex:1;"></div>
      </div>
    </div>
  `;

  const catalog = document.getElementById('notes-catalog-list');
  const editorFrame = 'notes-editor-frame';
  const titleInput = document.getElementById('active-note-title');
  let activeId = null;
  let editorInstance = null;

  const loadCatalog = () => {
    const notes = DB.get('studysync_notes');
    if (notes.length === 0) {
      catalog.innerHTML = `<span style="font-size:12px;color:var(--text-muted);">No notes created yet.</span>`;
      return;
    }

    catalog.innerHTML = notes.map(n => `
      <div class="note-item" id="note-item-${n.id}" style="padding:8px;border-radius:4px;cursor:pointer;margin-bottom:8px;background:rgba(255,255,255,0.01);">
        <strong>${n.title}</strong>
        <span style="font-size:10px;display:block;color:var(--text-muted);">By ${n.authorId}</span>
      </div>
    `).join('');

    notes.forEach(n => {
      document.getElementById(`note-item-${n.id}`).addEventListener('click', () => {
        activeId = n.id;
        document.getElementById('notes-main-wrapper').classList.add('editing');
        titleInput.disabled = false;
        titleInput.value = n.title;

        if (!editorInstance) {
          editorInstance = new NoteEditor(editorFrame, {
            onSave: (html) => {
              if (!activeId) return;
              const notesList = DB.get('studysync_notes');
              const match = notesList.find(x => x.id === activeId);
              if (match) {
                match.title = titleInput.value.trim() || "Untitled Note";
                match.content = html;
                match.updatedAt = new Date().toISOString();
                DB.set('studysync_notes', notesList);
                showToast("Note saved locally!", "success");
                loadCatalog();
              }
            }
          });
        }
        editorInstance.setContent(n.content);
      });
    });
  };

  document.getElementById('btn-create-note').addEventListener('click', () => {
    const notes = DB.get('studysync_notes');
    const newNote = {
      id: `n_${Date.now()}`,
      title: "Untitled Note",
      content: "",
      authorId: user,
      updatedAt: new Date().toISOString()
    };
    notes.push(newNote);
    DB.set('studysync_notes', notes);
    showToast("Notes created locally!", "success");
    loadCatalog();
  });

  document.getElementById('btn-notes-back').addEventListener('click', () => {
    activeId = null;
    document.getElementById('notes-main-wrapper').classList.remove('editing');
    titleInput.disabled = true;
    titleInput.value = "Select a Note";
    if (editorInstance) {
      editorInstance.setContent('');
    }
  });

  // Real-time synchronization storage event listener
  if (window._notesSyncListener) {
    window.removeEventListener('storage', window._notesSyncListener);
  }
  window._notesSyncListener = (e) => {
    if (e.key === 'studysync_notes') {
      loadCatalog();
      if (activeId) {
        const notesList = DB.get('studysync_notes');
        const match = notesList.find(x => x.id === activeId);
        if (match) {
          titleInput.value = match.title;
          if (editorInstance) {
            editorInstance.setContent(match.content);
          }
        }
      }
    }
  };
  window.addEventListener('storage', window._notesSyncListener);

  loadCatalog();
}

// 5. Daily Planner Page
function renderPlannerPage() {
  const container = document.getElementById('page-planner');
  if (!container) return;

  const user = LocalSettings.get('studysync_user') || 'User';

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h3 style="font-family:var(--font-header);">Local Goal Planner</h3>
      <button class="btn btn-primary" onclick="document.getElementById('modal-add-task').classList.add('active')">Add Goal</button>
    </div>
    
    <div class="planner-boards" style="margin-top:20px;">
      <div class="planner-board glass-panel glass-card">
        <h4>Daily Goals</h4>
        <div class="planner-tasks-list" id="list-daily" style="margin-top:12px;"></div>
      </div>
      <div class="planner-board glass-panel glass-card">
        <h4>Weekly Goals</h4>
        <div class="planner-tasks-list" id="list-weekly" style="margin-top:12px;"></div>
      </div>
      <div class="planner-board glass-panel glass-card">
        <h4>Monthly Goals</h4>
        <div class="planner-tasks-list" id="list-monthly" style="margin-top:12px;"></div>
      </div>
    </div>
  `;

  const lists = {
    daily: document.getElementById('list-daily'),
    weekly: document.getElementById('list-weekly'),
    monthly: document.getElementById('list-monthly')
  };

  const loadPlanner = () => {
    const tasks = DB.get('studysync_planner');
    
    Object.keys(lists).forEach(type => {
      const typeTasks = tasks.filter(t => t.type === type);
      if (typeTasks.length === 0) {
        lists[type].innerHTML = `<span style="font-size:11px;color:var(--text-secondary);">No goals set</span>`;
        return;
      }

      lists[type].innerHTML = typeTasks.map(t => `
        <div class="task-card" id="task-card-${t.id}" style="padding:10px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;opacity: ${t.completed ? 0.6 : 1};">
          <label style="display:flex;gap:8px;align-items:center;cursor:pointer;">
            <input type="checkbox" class="task-check" ${t.completed ? 'checked' : ''}>
            <span style="text-decoration: ${t.completed ? 'line-through' : 'none'}; font-size:12px;">${t.title}</span>
          </label>
          <button class="video-action-icon-btn btn-del" style="color:var(--color-error);" data-id="${t.id}"><i class="fa-solid fa-trash"></i></button>
        </div>
      `).join('');

      typeTasks.forEach(t => {
        const card = document.getElementById(`task-card-${t.id}`);
        card.querySelector('.task-check').addEventListener('change', (e) => {
          const listAll = DB.get('studysync_planner');
          const match = listAll.find(x => x.id === t.id);
          if (match) {
            match.completed = e.target.checked;
            DB.set('studysync_planner', listAll);
            loadPlanner();
          }
        });

        card.querySelector('.btn-del').addEventListener('click', () => {
          if (confirm("Delete goal?")) {
            const listAll = DB.get('studysync_planner').filter(x => x.id !== t.id);
            DB.set('studysync_planner', listAll);
            showToast("Goal deleted.", "info");
            loadPlanner();
          }
        });
      });
    });
  };

  const form = document.getElementById('form-add-task');
  form.onsubmit = (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title-input').value;
    const type = document.getElementById('task-type-select').value;
    const priority = document.getElementById('task-priority-select').value;
    const assignee = document.getElementById('task-assignee-select').value;
    const date = document.getElementById('task-date-input').value;

    const tasks = DB.get('studysync_planner');
    tasks.push({
      id: `t_${Date.now()}`,
      title,
      type,
      priority,
      assignee,
      dueDate: date,
      completed: false
    });
    DB.set('studysync_planner', tasks);
    form.reset();
    document.getElementById('modal-add-task').classList.remove('active');
    showToast("Goal created locally!", "success");
    loadPlanner();
  };

  loadPlanner();
}

// 6. Mock Test Marks Page
function renderMockTestsPage() {
  const container = document.getElementById('page-mocktests');
  if (!container) return;

  const user = LocalSettings.get('studysync_user') || 'User';

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h3 style="font-family:var(--font-header);">Mock Test Performance</h3>
      <button class="btn btn-primary" onclick="document.getElementById('modal-add-mock').classList.add('active')">Log Score</button>
    </div>
    
    <div class="syllabus-table-wrapper" style="margin-top:20px;">
      <table class="syllabus-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Exam Name</th>
            <th>Marks</th>
            <th>Accuracy</th>
            <th>Duration</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="mocks-list-body"></tbody>
      </table>
    </div>
  `;

  const tbody = document.getElementById('mocks-list-body');

  const loadMocks = () => {
    const list = DB.get('studysync_mocks');
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No score logged.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(t => `
      <tr>
        <td><strong>${t.uid}</strong></td>
        <td>${t.examName}</td>
        <td>${t.marks} / ${t.maxMarks}</td>
        <td style="color:var(--color-success);font-weight:700;">${t.accuracy}%</td>
        <td>${t.timeTakenMinutes} mins</td>
        <td>
          <button class="btn btn-glass btn-del-mock" style="color:var(--color-error);padding:4px 8px;" data-id="${t.id}">Delete</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.btn-del-mock').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm("Delete this test score?")) {
          const listAll = DB.get('studysync_mocks').filter(x => x.id !== btn.dataset.id);
          DB.set('studysync_mocks', listAll);
          showToast("Score record deleted.", "info");
          loadMocks();
        }
      });
    });
  };

  const form = document.getElementById('form-add-mock');
  form.onsubmit = (e) => {
    e.preventDefault();
    const examName = document.getElementById('mock-name').value;
    const subject = document.getElementById('mock-subject').value;
    const marks = Number(document.getElementById('mock-marks-obt').value);
    const maxMarks = Number(document.getElementById('mock-marks-max').value);
    const accuracy = Number(document.getElementById('mock-accuracy').value);
    const wrongAnswers = Number(document.getElementById('mock-wrongs').value);
    const timeTakenMinutes = Number(document.getElementById('mock-time').value);

    const list = DB.get('studysync_mocks');
    list.push({
      id: `m_${Date.now()}`,
      examName,
      subject,
      marks,
      maxMarks,
      accuracy,
      wrongAnswers,
      timeTakenMinutes,
      uid: user
    });
    DB.set('studysync_mocks', list);
    form.reset();
    document.getElementById('modal-add-mock').classList.remove('active');
    showToast("Score logged!", "success");
    loadMocks();
  };

  loadMocks();
}

// 7. PYQ Tracker Page
function renderPYQTracker() {
  const container = document.getElementById('page-pyqs');
  if (!container) return;

  const user = LocalSettings.get('studysync_user') || 'User';

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h3 style="font-family:var(--font-header);">Previous Year Questions</h3>
      <button class="btn btn-primary" onclick="document.getElementById('modal-add-pyq').classList.add('active')">Add Topic</button>
    </div>
    
    <div class="syllabus-table-wrapper" style="margin-top:20px;">
      <table class="syllabus-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Topic</th>
            <th>Year</th>
            <th>Solved</th>
            <th>Revision</th>
          </tr>
        </thead>
        <tbody id="pyq-tbody-rows"></tbody>
      </table>
    </div>
  `;

  const tbody = document.getElementById('pyq-tbody-rows');

  const loadPYQs = () => {
    const list = DB.get('studysync_pyqs');
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No PYQs set yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(p => {
      const stats = p.userStatus?.[user] || { solved: false, revisionRequired: false };
      return `
        <tr id="pyq-row-${p.id}">
          <td><strong>${p.subject}</strong></td>
          <td>${p.chapter}</td>
          <td>${p.year}</td>
          <td>
            <button class="video-action-icon-btn btn-toggle-pyq" data-id="${p.id}" data-field="solved">
              <i class="${stats.solved ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'}" style="${stats.solved ? 'color:var(--color-success);' : ''}"></i>
            </button>
          </td>
          <td>
            <button class="video-action-icon-btn btn-toggle-pyq" data-id="${p.id}" data-field="revisionRequired">
              <i class="${stats.revisionRequired ? 'fa-solid fa-clock' : 'fa-regular fa-clock'}" style="${stats.revisionRequired ? 'color:var(--color-warning);' : ''}"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-toggle-pyq').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const field = btn.dataset.field;
        const listAll = DB.get('studysync_pyqs');
        const match = listAll.find(x => x.id === id);
        if (match) {
          if (!match.userStatus) match.userStatus = {};
          if (!match.userStatus[user]) match.userStatus[user] = {};
          
          const current = match.userStatus[user][field] || false;
          match.userStatus[user][field] = !current;
          DB.set('studysync_pyqs', listAll);
          loadPYQs();
        }
      });
    });
  };

  const form = document.getElementById('form-add-pyq');
  form.onsubmit = (e) => {
    e.preventDefault();
    const subject = document.getElementById('pyq-in-subject').value;
    const chapter = document.getElementById('pyq-in-chapter').value;
    const year = Number(document.getElementById('pyq-in-year').value);
    const difficulty = document.getElementById('pyq-in-difficulty').value;

    const list = DB.get('studysync_pyqs');
    list.push({
      id: `p_${Date.now()}`,
      subject,
      chapter,
      year,
      difficulty,
      userStatus: {
        Dipu: { solved: false, revisionRequired: false },
        Meghali: { solved: false, revisionRequired: false }
      }
    });
    DB.set('studysync_pyqs', list);
    form.reset();
    document.getElementById('modal-add-pyq').classList.remove('active');
    showToast("Topic added locally!", "success");
    loadPYQs();
  };

  loadPYQs();
}

// 8. Analytics & Heatmap Page
function renderAnalyticsPage() {
  const container = document.getElementById('page-analytics');
  if (!container) return;

  const user = LocalSettings.get('studysync_user') || 'User';
  const subjects = DB.get('studysync_timer_subjects', ["Quantitative Aptitude", "Reasoning", "English Language", "General Awareness"]);

  container.innerHTML = `
    <div class="dashboard-grid">
      <!-- Comparative Graphs -->
      <div class="glass-panel glass-card dash-span-12">
        <h3 style="font-family:var(--font-header);">Performance Charting</h3>
        <p style="font-size:12px;color:var(--text-secondary);margin-top:8px;">Compare subject distribution and weekly study totals.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px;height:240px;">
          <div><canvas id="chart-weekly-hours"></canvas></div>
          <div><canvas id="chart-subject-accuracy"></canvas></div>
        </div>
      </div>

      <!-- Time Stats Summary Cards -->
      <div class="glass-panel glass-card dash-span-4">
        <span style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;">Today's Study</span>
        <h3 style="font-size:24px;font-family:var(--font-header);margin-top:8px;color:var(--color-primary);" id="total-time-today">0 hrs</h3>
      </div>
      <div class="glass-panel glass-card dash-span-4">
        <span style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;">This Week's Study</span>
        <h3 style="font-size:24px;font-family:var(--font-header);margin-top:8px;color:var(--color-secondary);" id="total-time-week">0 hrs</h3>
      </div>
      <div class="glass-panel glass-card dash-span-4">
        <span style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;">This Month's Study</span>
        <h3 style="font-size:24px;font-family:var(--font-header);margin-top:8px;color:var(--color-success);" id="total-time-month">0 hrs</h3>
      </div>

      <!-- Manual Study Logger Form -->
      <div class="glass-panel glass-card dash-span-5">
        <h3 style="font-family:var(--font-header);">Log Study Session</h3>
        <form id="form-manual-study-log" style="display:flex;flex-direction:column;gap:12px;margin-top:12px;">
          <div class="form-group">
            <label class="form-label">Subject</label>
            <select class="form-input" id="manual-log-subject" required>
              ${subjects.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Duration (Minutes)</label>
            <input type="number" class="form-input" id="manual-log-minutes" required placeholder="e.g. 60" min="1">
          </div>
          <div class="form-group">
            <label class="form-label">Study Date</label>
            <input type="date" class="form-input" id="manual-log-date" required>
          </div>
          <button type="submit" class="btn btn-primary" style="align-self:flex-start;">Log Session</button>
        </form>
      </div>

      <!-- Scrollable History Timeline Ledger -->
      <div class="glass-panel glass-card dash-span-7">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h3 style="font-family:var(--font-header);">Study Timeline Ledger</h3>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-glass filter-timeline-btn active" data-range="today" style="padding:4px 8px;font-size:11px;">Today</button>
            <button class="btn btn-glass filter-timeline-btn" data-range="week" style="padding:4px 8px;font-size:11px;">Week</button>
            <button class="btn btn-glass filter-timeline-btn" data-range="month" style="padding:4px 8px;font-size:11px;">Month</button>
          </div>
        </div>
        <div id="timeline-list-container" style="max-height:240px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;"></div>
      </div>
    </div>
  `;

  // Draw Charts
  setTimeout(() => {
    const hCtx = document.getElementById('chart-weekly-hours').getContext('2d');
    const aCtx = document.getElementById('chart-subject-accuracy').getContext('2d');
    const profiles = DB.get('studysync_profiles');

    new Chart(hCtx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          { label: 'Dipu', data: [3.2, 4, 5.5, 2, 6, 4.5, profiles.Dipu.studyHoursToday], borderColor: '#6366f1', fill: false },
          { label: 'Meghali', data: [4, 3.5, 4.8, 5, 3, 5.2, profiles.Meghali.studyHoursToday], borderColor: '#ec4899', fill: false }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    new Chart(aCtx, {
      type: 'radar',
      data: {
        labels: ['Quant', 'Reasoning', 'English', 'GS'],
        datasets: [
          { label: 'Dipu', data: [85, 78, 90, 60], borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.15)' },
          { label: 'Meghali', data: [75, 85, 82, 70], borderColor: '#ec4899', backgroundColor: 'rgba(236,72,153,0.15)' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }, 100);

  // Time calculations
  const loadTimeStats = () => {
    const sessions = DB.get('studysync_sessions');
    const mySessions = sessions.filter(s => s.uid === user);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const startOfWeek = new Date();
    startOfWeek.setDate(now.getDate() - 7);

    const startOfMonth = new Date();
    startOfMonth.setDate(now.getDate() - 30);

    const minToday = mySessions.filter(s => s.timestamp.startsWith(todayStr)).reduce((acc, s) => acc + Number(s.durationMinutes), 0);
    const minWeek = mySessions.filter(s => new Date(s.timestamp) >= startOfWeek).reduce((acc, s) => acc + Number(s.durationMinutes), 0);
    const minMonth = mySessions.filter(s => new Date(s.timestamp) >= startOfMonth).reduce((acc, s) => acc + Number(s.durationMinutes), 0);

    document.getElementById('total-time-today').innerText = `${(minToday / 60).toFixed(1)} hrs`;
    document.getElementById('total-time-week').innerText = `${(minWeek / 60).toFixed(1)} hrs`;
    document.getElementById('total-time-month').innerText = `${(minMonth / 60).toFixed(1)} hrs`;
  };

  loadTimeStats();

  // Timeline render
  let activeRange = "today";
  const loadTimeline = () => {
    const timelineList = document.getElementById('timeline-list-container');
    if (!timelineList) return;

    const sessions = DB.get('studysync_sessions');
    const sorted = sessions.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const startOfWeek = new Date();
    startOfWeek.setDate(now.getDate() - 7);

    const startOfMonth = new Date();
    startOfMonth.setDate(now.getDate() - 30);

    let filtered = [];
    if (activeRange === "today") {
      filtered = sorted.filter(s => s.timestamp.startsWith(todayStr));
    } else if (activeRange === "week") {
      filtered = sorted.filter(s => new Date(s.timestamp) >= startOfWeek);
    } else if (activeRange === "month") {
      filtered = sorted.filter(s => new Date(s.timestamp) >= startOfMonth);
    }

    if (filtered.length === 0) {
      timelineList.innerHTML = `<span style="font-size:11px;color:var(--text-secondary);text-align:center;padding:12px;display:block;">No sessions logged for this range.</span>`;
      return;
    }

    timelineList.innerHTML = filtered.map(s => {
      const timeStr = new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = new Date(s.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
      
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:rgba(255,255,255,0.01);border:1px solid var(--panel-border);border-radius:var(--radius-sm);">
          <div>
            <div style="font-size:13px;font-weight:600;">${s.subject}</div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">
              ${s.uid} • ${dateStr} at ${timeStr}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <span class="badge badge-primary" style="font-size:11px;padding:4px 8px;">${s.durationMinutes} mins</span>
            <button class="btn-del-session" data-id="${s.timestamp}" style="background:none;border:none;color:var(--color-error);cursor:pointer;padding:4px;"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      `;
    }).join('');

    timelineList.querySelectorAll('.btn-del-session').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (confirm("Delete this logged study session?")) {
          const sessionsList = DB.get('studysync_sessions');
          const updated = sessionsList.filter(x => x.timestamp !== id);
          DB.set('studysync_sessions', updated);
          showToast("Session log deleted.", "info");
          loadTimeStats();
          loadTimeline();
        }
      });
    });
  };

  loadTimeline();

  // Timeline ranges listeners
  document.querySelectorAll('.filter-timeline-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-timeline-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeRange = btn.dataset.range;
      loadTimeline();
    });
  });

  // Manual Log Submission
  const logForm = document.getElementById('form-manual-study-log');
  const dateInput = document.getElementById('manual-log-date');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  logForm.onsubmit = (e) => {
    e.preventDefault();
    const subject = document.getElementById('manual-log-subject').value;
    const minutes = Number(document.getElementById('manual-log-minutes').value);
    const dateStr = dateInput.value;

    const sessionsList = DB.get('studysync_sessions');
    const newSession = {
      uid: user,
      durationMinutes: minutes,
      subject,
      timestamp: new Date(dateStr + "T" + new Date().toTimeString().split(' ')[0]).toISOString()
    };
    sessionsList.push(newSession);
    DB.set('studysync_sessions', sessionsList);

    // Update study profiles stats if logged today
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr === todayStr) {
      const profiles = DB.get('studysync_profiles');
      if (profiles[user]) {
        profiles[user].studyHoursToday += (minutes / 60);
        profiles[user].studyHoursToday = Math.round(profiles[user].studyHoursToday * 10) / 10;
        DB.set('studysync_profiles', profiles);
      }
    }

    logForm.reset();
    if (dateInput) dateInput.value = todayStr;
    showToast("Session logged manually!", "success");
    loadTimeStats();
    loadTimeline();
  };
}

// 9. Settings Page (Themes & JSON backups manager)
function renderSettingsPage() {
  const container = document.getElementById('page-settings');
  if (!container) return;



  container.innerHTML = `
    <div class="dashboard-grid">
      <!-- Theme Selection -->
      <div class="glass-panel glass-card dash-span-6" style="display:flex;flex-direction:column;gap:12px;">
        <h3 style="font-family:var(--font-header);font-size:16px;">Personalization</h3>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
          <span>Toggle Light/Dark Theme</span>
          <button id="btn-theme-toggle-settings" class="btn btn-glass" style="font-size:12px;">
            ${document.body.classList.contains('light-theme') ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </div>

      <!-- PDF Progress Exporter -->
      <div class="glass-panel glass-card dash-span-6" style="display:flex;flex-direction:column;gap:12px;">
        <h3 style="font-family:var(--font-header);font-size:16px;"><i class="fa-solid fa-file-pdf" style="color:var(--color-error);margin-right:8px;"></i>PDF Study Report</h3>
        <p style="font-size:11px;color:var(--text-secondary);line-height:1.4;">Generate a comprehensive, beautifully styled PDF progress report containing your profile stats, syllabus tracker completed items, mock test scores, and active goals.</p>
        <div style="display:flex;gap:12px;margin-top:8px;">
          <button id="btn-export-pdf-report" class="btn btn-glass" style="flex:1; background: rgba(239, 68, 68, 0.1); color: #f87171;"><i class="fa-solid fa-print"></i> Generate PDF Report</button>
        </div>
      </div>


    </div>
  `;

  // Toggle Theme
  const settingsThemeBtn = document.getElementById('btn-theme-toggle-settings');
  const globalThemeBtn = document.getElementById('theme-toggle-btn');
  
  settingsThemeBtn.addEventListener('click', () => {
    const isLight = document.body.classList.contains('light-theme');
    if (isLight) {
      document.body.classList.remove('light-theme');
      LocalSettings.set('studysync_theme', 'dark');
      settingsThemeBtn.innerText = 'Dark Mode';
      if (globalThemeBtn) globalThemeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
      document.body.classList.add('light-theme');
      LocalSettings.set('studysync_theme', 'light');
      settingsThemeBtn.innerText = 'Light Mode';
      if (globalThemeBtn) globalThemeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
  });



  // Export PDF Report Generator
  document.getElementById('btn-export-pdf-report').addEventListener('click', () => {
    const user = LocalSettings.get('studysync_user') || 'User';
    const syllabus = DB.get('studysync_syllabus');
    const mocks = DB.get('studysync_mocks');
    const planner = DB.get('studysync_planner');
    const sessions = DB.get('studysync_sessions');
    const notes = DB.get('studysync_notes');

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
      showToast("Please allow popups to generate reports.", "error");
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

// 10. Data Manager Page (Admin controls)
function renderOwnerPanel() {
  const container = document.getElementById('page-admin');
  if (!container) return;

  const exams = DB.get('studysync_exams', ["SSC CGL", "NABARD", "Banking", "Railway", "State Exams"]);

  container.innerHTML = `
    <div class="dashboard-grid">
      <!-- Syllabus Form manager -->
      <div class="glass-panel glass-card dash-span-6">
        <h3 style="font-family:var(--font-header);">Add Syllabus Chapter</h3>
        <form id="admin-form-add-syllabus" style="display:flex;flex-direction:column;gap:12px;margin-top:12px;">
          <div class="form-group">
            <label class="form-label">Exam target</label>
            <select class="form-input" id="adm-exam">
              ${exams.map(ex => `<option value="${ex}">${ex}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Subject</label>
            <input type="text" class="form-input" id="adm-subject" required placeholder="e.g. Reasoning">
          </div>
          <div class="form-group">
            <label class="form-label">Chapter</label>
            <input type="text" class="form-input" id="adm-chapter" required placeholder="e.g. Coding-Decoding">
          </div>
          <button type="submit" class="btn btn-primary" style="align-self:flex-start;">Add Chapter</button>
        </form>
      </div>

      <!-- Govt Exam manager -->
      <div class="glass-panel glass-card dash-span-6">
        <h3 style="font-family:var(--font-header);">Manage Government Exams</h3>
        <form id="admin-form-add-exam" style="display:flex;gap:8px;margin-top:12px;margin-bottom:16px;">
          <input type="text" class="form-input" id="adm-new-exam-name" required placeholder="e.g. UPSC CSE" style="flex:1;">
          <button type="submit" class="btn btn-primary" style="padding:12px 16px;">Add</button>
        </form>
        <div id="admin-exams-list" style="max-height:160px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;"></div>
      </div>

      <!-- Cleanup utilities -->
      <div class="glass-panel glass-card dash-span-12" style="display:flex;flex-direction:column;gap:12px;margin-top:16px;">
        <h3 style="font-family:var(--font-header);color:var(--color-error);">Reset Databases</h3>
        <p style="font-size:11px;color:var(--text-secondary);line-height:1.4;">Clear stored LocalStorage values to reset files completely.</p>
        <button class="btn btn-glass" id="btn-wipe-data" style="color:var(--color-error);align-self:flex-start;margin-top:8px;">Wipe Local Storage Tables</button>
      </div>
    </div>
  `;

  // Dynamic Exams renderer
  const loadExamsList = () => {
    const listDiv = document.getElementById('admin-exams-list');
    const currentExams = DB.get('studysync_exams', ["SSC CGL", "NABARD", "Banking", "Railway", "State Exams"]);
    
    listDiv.innerHTML = currentExams.map(ex => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(255,255,255,0.01);border:1px solid var(--panel-border);border-radius:var(--radius-sm);">
        <span style="font-size:13px;font-weight:600;">${ex}</span>
        <button class="btn-del-exam-item" data-exam="${ex}" style="background:none;border:none;color:var(--color-error);cursor:pointer;padding:4px;"><i class="fa-solid fa-trash"></i></button>
      </div>
    `).join('');

    listDiv.querySelectorAll('.btn-del-exam-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const exName = btn.dataset.exam;
        if (confirm(`Are you sure you want to delete "${exName}" and all associated syllabus chapters?`)) {
          const updatedExams = DB.get('studysync_exams', ["SSC CGL", "NABARD", "Banking", "Railway", "State Exams"]).filter(x => x !== exName);
          DB.set('studysync_exams', updatedExams);

          // Clean up syllabus
          const syllabus = DB.get('studysync_syllabus');
          const updatedSyllabus = syllabus.filter(x => x.exam !== exName);
          DB.set('studysync_syllabus', updatedSyllabus);

          showToast(`Exam "${exName}" and its chapters deleted.`, "info");
          loadExamsList();

          // Update Add Chapter form select
          const select = document.getElementById('adm-exam');
          if (select) select.innerHTML = updatedExams.map(x => `<option value="${x}">${x}</option>`).join('');
        }
      });
    });
  };

  loadExamsList();

  // Add Exam form
  const examForm = document.getElementById('admin-form-add-exam');
  examForm.onsubmit = (e) => {
    e.preventDefault();
    const input = document.getElementById('adm-new-exam-name');
    const name = input.value.trim();
    if (!name) return;

    const currentExams = DB.get('studysync_exams', ["SSC CGL", "NABARD", "Banking", "Railway", "State Exams"]);
    if (currentExams.includes(name)) {
      showToast("Exam name already exists!", "error");
      return;
    }

    currentExams.push(name);
    DB.set('studysync_exams', currentExams);
    input.value = '';
    showToast(`Exam "${name}" added!`, "success");
    loadExamsList();

    // Update Add Chapter form select
    const select = document.getElementById('adm-exam');
    if (select) select.innerHTML = currentExams.map(x => `<option value="${x}">${x}</option>`).join('');
  };

  // Syllabus add form
  const form = document.getElementById('admin-form-add-syllabus');
  form.onsubmit = (e) => {
    e.preventDefault();
    const exam = document.getElementById('adm-exam').value;
    const subject = document.getElementById('adm-subject').value;
    const chapter = document.getElementById('adm-chapter').value;

    const list = DB.get('studysync_syllabus');
    list.push({
      id: `s_${Date.now()}`,
      exam,
      subject,
      chapter,
      priority: "Medium",
      difficulty: "Medium",
      status: { Dipu: "pending", Meghali: "pending" },
      progress: { Dipu: 0, Meghali: 0 }
    });
    DB.set('studysync_syllabus', list);
    form.reset();
    showToast("Chapter added locally!", "success");
  };

  // Wipe data helper
  document.getElementById('btn-wipe-data').addEventListener('click', () => {
    if (confirm("This will delete all custom notes, mocks, goals, and reset values. Continue?")) {
      const keys = ["studysync_syllabus", "studysync_pyqs", "studysync_mocks", "studysync_profiles", "studysync_videos", "studysync_notes", "studysync_planner", "studysync_sessions", "studysync_exams", "studysync_timer_subjects"];
      keys.forEach(k => LocalSettings.remove(k));
      showToast("Data tables wiped. Reloading...", "success");
      setTimeout(() => window.location.reload(), 1000);
    }
  });
}

// ==========================================
// SPA ROUTER ENGINE & EVENT LOOPS
// ==========================================
let activeView = 'dashboard';

function navigateToView(viewId) {
  const prev = document.querySelector('.page-view.active-page');
  const target = document.getElementById(`page-${viewId}`);
  if (!target) return;

  activeView = viewId;

  // Title update
  const titleDisplay = document.getElementById('page-title-display');
  if (titleDisplay) titleDisplay.innerText = viewId.toUpperCase();

  // Sidebar highlight
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.target === viewId) link.classList.add('active');
  });

  if (prev) prev.classList.remove('active-page');
  target.classList.add('active-page');

  // GSAP animated transition
  gsap.fromTo(target, 
    { opacity: 0, y: 15 },
    { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
  );

  // Router triggers
  if (viewId === 'dashboard') renderDashboard();
  else if (viewId === 'youtube') renderYoutubeLibrary();
  else if (viewId === 'syllabus') renderSyllabusTracker();
  else if (viewId === 'notes') renderNotesPage();
  else if (viewId === 'planner') renderPlannerPage();
  else if (viewId === 'timer') pomodoroTimer.render('page-timer');
  else if (viewId === 'mocktests') renderMockTestsPage();
  else if (viewId === 'pyqs') renderPYQTracker();
  else if (viewId === 'analytics') renderAnalyticsPage();

  else if (viewId === 'settings') renderSettingsPage();
  else if (viewId === 'admin') renderOwnerPanel();
}

function applyLocalSettings() {
  const theme = LocalSettings.get('studysync_theme') || 'dark';
  if (theme === 'light') {
    document.body.classList.add('light-theme');
    document.getElementById('theme-toggle-btn').innerHTML = '<i class="fa-solid fa-sun"></i>';
  } else {
    document.body.classList.remove('light-theme');
    document.getElementById('theme-toggle-btn').innerHTML = '<i class="fa-solid fa-moon"></i>';
  }


}

function initLoginBindings() {
  const profileDipu = document.getElementById('select-profile-dipu');
  const profileMeghali = document.getElementById('select-profile-meghali');
  const loginScreen = document.getElementById('login-screen');
  const appShell = document.getElementById('app-shell');
  let selectedUser = null;

  profileDipu.addEventListener('click', () => {
    profileDipu.classList.add('selected');
    profileMeghali.classList.remove('selected');
    selectedUser = "Dipu";
  });

  profileMeghali.addEventListener('click', () => {
    profileMeghali.classList.add('selected');
    profileDipu.classList.remove('selected');
    selectedUser = "Meghali";
  });

  // Local login action
  document.getElementById('btn-login-local').addEventListener('click', () => {
    if (!selectedUser) {
      showToast("Please select a profile to enter the portal.", "error");
      return;
    }
    
    LocalSettings.set('studysync_user', selectedUser);
    showToast(`Access granted! Welcome, ${selectedUser}!`, "success");

    // Show Shell & load UI
    loginScreen.style.display = 'none';
    appShell.style.display = 'grid';

    document.getElementById('avatar-me').src = "https://api.dicebear.com/7.x/bottts/svg?seed=" + selectedUser;
    document.getElementById('name-me').innerText = selectedUser;

    navigateToView('dashboard');
  });
}

// Bind Navigation & mobile sidebar closing
document.querySelectorAll('.sidebar-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    navigateToView(link.dataset.target);
    const panel = document.getElementById('sidebar-panel');
    if (panel) panel.classList.remove('active');
  });
});

// Mobile Hamburger Toggle
const sidebarToggle = document.getElementById('sidebar-toggle');
if (sidebarToggle) {
  sidebarToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const panel = document.getElementById('sidebar-panel');
    if (panel) panel.classList.toggle('active');
  });
}

// Click outside drawer to close
document.addEventListener('click', (e) => {
  const panel = document.getElementById('sidebar-panel');
  if (panel && panel.classList.contains('active')) {
    const isToggle = e.target.closest('#sidebar-toggle');
    const isPanel = e.target.closest('#sidebar-panel');
    if (!isToggle && !isPanel) {
      panel.classList.remove('active');
    }
  }
});

document.getElementById('btn-signout').addEventListener('click', () => {
  if (confirm("Sign out of profile?")) {
    LocalSettings.remove('studysync_user');
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app-shell').style.display = 'none';
  }
});

// Check for file protocol warning overlay
function checkFileProtocol() {
  if (window.location.protocol === 'file:') {
    const warningDiv = document.createElement('div');
    warningDiv.id = 'file-protocol-warning-overlay';
    warningDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(8, 9, 13, 0.95);
      backdrop-filter: blur(10px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-family: 'Outfit', sans-serif;
      padding: 20px;
      text-align: center;
    `;
    
    warningDiv.innerHTML = `
      <div class="glass-panel glass-card" style="max-width: 550px; padding: 40px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.02); box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 56px; color: #f59e0b; margin-bottom: 24px;"></i>
        <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 16px; letter-spacing: -0.5px;">Local File Mode Detected</h2>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 28px;">
          Browser security models block API requests (such as the Gemini AI and YouTube integrations) when files are opened directly via the <code>file://</code> protocol.
        </p>
        <div style="background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.15); padding: 18px; border-radius: 8px; margin-bottom: 28px;">
          <span style="font-size: 12px; text-transform: uppercase; color: #818cf8; font-weight: 700; display: block; margin-bottom: 6px; letter-spacing: 1px;">Please access the app via Local Server</span>
          <a href="http://localhost:8080/" style="font-size: 18px; font-weight: 700; color: #6366f1; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
            http://localhost:8080 <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
        <p style="font-size: 11px; color: #64748b; line-height: 1.5;">
          Make sure the local server is running by keeping the command prompt open. If you closed it, run the <code>start_server.bat</code> launcher again.
        </p>
      </div>
    `;
    
    document.body.appendChild(warningDiv);
  }
}

// Bootstrapper initialization
initDb(() => {
  applyLocalSettings();
  initLoginBindings();
  checkFileProtocol();

  // Check logged user presence
  const loggedUser = LocalSettings.get('studysync_user');
  if (loggedUser) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-shell').style.display = 'grid';
    document.getElementById('avatar-me').src = "https://api.dicebear.com/7.x/bottts/svg?seed=" + loggedUser;
    document.getElementById('name-me').innerText = loggedUser;
    navigateToView('dashboard');
  } else {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app-shell').style.display = 'none';
  }
});
