import { db, auth } from '../firebase/config.js';
import { logStudySession } from '../firebase/db.js';

export class StudyTimer {
  constructor() {
    this.minutes = 25;
    this.seconds = 0;
    this.initialMinutes = 25;
    this.timerId = null;
    this.isRunning = false;
    this.isPaused = false;
    
    // Audio Context for offline sound generation
    this.audioCtx = null;
  }

  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="timer-page-layout glass-panel glass-card">
        <h2 style="font-family: var(--font-header); font-size: 20px; font-weight: 800;">Pomodoro Study Session</h2>
        
        <!-- Timer circle progress ring -->
        <div class="timer-ring-wrapper">
          <svg class="timer-ring-svg">
            <circle class="timer-circle-bg" cx="140" cy="140" r="125" stroke-width="10"/>
            <circle class="timer-circle-fill" id="timer-ring-circle" cx="140" cy="140" r="125" stroke-width="10" stroke-dasharray="785.4" stroke-dashoffset="0"/>
          </svg>
          <div class="timer-time-display">
            <span class="timer-minutes-seconds" id="timer-clock-text">25:00</span>
            <span class="timer-state-lbl" id="timer-status-subtext">Focus Period</span>
          </div>
        </div>

        <!-- Session settings selection form -->
        <div style="display: flex; gap: 16px; width: 100%; max-width: 400px;">
          <div class="form-group" style="flex: 1; margin: 0;">
            <label class="form-label" for="timer-select-subject">Subject</label>
            <select class="form-input" id="timer-select-subject" style="padding: 8px 12px; font-size: 13px;">
              <option value="Quantitative Aptitude">Quantitative Aptitude</option>
              <option value="Reasoning">Reasoning</option>
              <option value="English Language">English Language</option>
              <option value="General Awareness">General Awareness</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group" style="flex: 1; margin: 0;">
            <label class="form-label" for="timer-select-session">Duration</label>
            <select class="form-input" id="timer-select-session" style="padding: 8px 12px; font-size: 13px;">
              <option value="25" selected>25 Minutes (Focus)</option>
              <option value="50">50 Minutes (Deep Work)</option>
              <option value="5">5 Minutes (Short Break)</option>
              <option value="15">15 Minutes (Long Break)</option>
            </select>
          </div>
        </div>

        <!-- Timer control action buttons -->
        <div class="timer-controls">
          <button id="btn-timer-start" class="btn btn-primary" style="padding: 12px 30px;"><i class="fa-solid fa-play"></i> Start Session</button>
          <button id="btn-timer-pause" class="btn btn-glass" style="padding: 12px 20px; display: none;"><i class="fa-solid fa-pause"></i> Pause</button>
          <button id="btn-timer-reset" class="btn btn-glass" style="padding: 12px 20px; display: none; color: var(--color-error);"><i class="fa-solid fa-rotate-left"></i> Reset</button>
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
    this.durationSelect.addEventListener('change', () => {
      if (this.isRunning) return;
      const mins = Number(this.durationSelect.value);
      this.minutes = mins;
      this.seconds = 0;
      this.initialMinutes = mins;
      this.updateClockDisplay();
    });

    this.startBtn.addEventListener('click', () => {
      this.start();
    });

    this.pauseBtn.addEventListener('click', () => {
      this.pause();
    });

    this.resetBtn.addEventListener('click', () => {
      this.reset();
    });
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isPaused = false;

    this.subjectSelect.disabled = true;
    this.durationSelect.disabled = true;

    this.startBtn.style.display = 'none';
    this.pauseBtn.style.display = 'inline-flex';
    this.resetBtn.style.display = 'inline-flex';
    
    this.statusText.innerText = this.initialMinutes <= 5 ? "Break Period" : "Focusing...";

    const totalSeconds = this.initialMinutes * 60;

    this.timerId = setInterval(() => {
      if (this.seconds === 0) {
        if (this.minutes === 0) {
          this.sessionComplete();
          return;
        }
        this.minutes--;
        this.seconds = 59;
      } else {
        this.seconds--;
      }

      this.updateClockDisplay();

      // Update circular visual ring
      const currentSeconds = (this.minutes * 60) + this.seconds;
      const progressPercent = currentSeconds / totalSeconds;
      const dashOffset = 785.4 - (progressPercent * 785.4);
      this.circle.style.strokeDashoffset = dashOffset;

    }, 1000);
  }

  pause() {
    if (!this.isRunning) return;

    if (this.isPaused) {
      // Resume
      this.isPaused = false;
      this.pauseBtn.innerHTML = `<i class="fa-solid fa-pause"></i> Pause`;
      this.start();
    } else {
      // Pause
      this.isPaused = true;
      clearInterval(this.timerId);
      this.pauseBtn.innerHTML = `<i class="fa-solid fa-play"></i> Resume`;
      this.statusText.innerText = "Paused";
    }
  }

  reset() {
    clearInterval(this.timerId);
    this.isRunning = false;
    this.isPaused = false;

    this.subjectSelect.disabled = false;
    this.durationSelect.disabled = false;

    this.startBtn.style.display = 'inline-flex';
    this.pauseBtn.style.display = 'none';
    this.resetBtn.style.display = 'none';

    this.pauseBtn.innerHTML = `<i class="fa-solid fa-pause"></i> Pause`;
    this.statusText.innerText = "Focus Period";

    this.minutes = this.initialMinutes;
    this.seconds = 0;
    this.updateClockDisplay();
    this.circle.style.strokeDashoffset = 0;
  }

  updateClockDisplay() {
    this.clockText.innerText = `${String(this.minutes).padStart(2, '0')}:${String(this.seconds).padStart(2, '0')}`;
  }

  async sessionComplete() {
    clearInterval(this.timerId);
    this.isRunning = false;

    this.playBeepSound();
    
    const subject = this.subjectSelect.value;
    const currentUser = localStorage.getItem('studysync_user') || 'User';

    // Log study time in DB if it was not a break
    if (this.initialMinutes > 5) {
      try {
        await logStudySession(currentUser, this.initialMinutes, 'pomodoro', subject);
        showToast(`Focus session logged: +${this.initialMinutes} mins to ${subject}!`, 'success');
      } catch (err) {
        console.error(err);
        showToast('Error syncing study minutes.', 'error');
      }
    } else {
      showToast('Break session completed. Ready to focus again?', 'info');
    }

    this.reset();
  }

  // Pure Web Audio beep sound generation for local alerts (offline)
  playBeepSound() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // Pitch (A5)
      
      gainNode.gain.setValueAtTime(1, this.audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.8); // Fade out

      osc.start(this.audioCtx.currentTime);
      osc.stop(this.audioCtx.currentTime + 0.8);
    } catch (e) {
      console.warn("Audio sound failed:", e);
    }
  }
}
