import { db, auth } from '../firebase/config.js';
import { subscribeToTasks, addTask, updateTaskStatus, deleteTask } from '../firebase/db.js';
import { collection, getDocs, query, where, addDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export function renderPlannerPage() {
  const container = document.getElementById('page-planner');
  if (!container) return;

  const currentUser = localStorage.getItem('studysync_user') || 'User';

  container.innerHTML = `
    <!-- Mode toggler -->
    <div class="syllabus-tabs" id="planner-tabs">
      <button class="syllabus-tab-btn active" data-mode="boards">Goal Boards</button>
      <button class="syllabus-tab-btn" data-mode="revisions">Revision Calendar</button>
    </div>

    <!-- VIEW 1: GOAL BOARDS -->
    <div id="planner-view-boards" style="display: block;">
      <div style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
        <button id="btn-open-task-modal" class="btn btn-primary"><i class="fa-solid fa-plus"></i>Create New Goal</button>
      </div>

      <div class="planner-boards">
        <!-- BOARD 1: Daily Goals -->
        <div class="planner-board glass-panel glass-card">
          <div class="planner-board-header">
            <h3 class="planner-board-title"><i class="fa-solid fa-sun" style="color: var(--color-warning); margin-right: 8px;"></i>Daily Goals</h3>
            <span class="badge" style="background: rgba(255,255,255,0.05);" id="count-daily">0</span>
          </div>
          <div class="planner-tasks-list" id="list-daily">
            <!-- Loaded dynamically -->
          </div>
        </div>

        <!-- BOARD 2: Weekly Goals -->
        <div class="planner-board glass-panel glass-card">
          <div class="planner-board-header">
            <h3 class="planner-board-title"><i class="fa-solid fa-calendar-week" style="color: var(--color-primary); margin-right: 8px;"></i>Weekly Goals</h3>
            <span class="badge" style="background: rgba(255,255,255,0.05);" id="count-weekly">0</span>
          </div>
          <div class="planner-tasks-list" id="list-weekly">
            <!-- Loaded dynamically -->
          </div>
        </div>

        <!-- BOARD 3: Monthly Goals -->
        <div class="planner-board glass-panel glass-card">
          <div class="planner-board-header">
            <h3 class="planner-board-title"><i class="fa-solid fa-calendar-days" style="color: var(--color-secondary); margin-right: 8px;"></i>Monthly Goals</h3>
            <span class="badge" style="background: rgba(255,255,255,0.05);" id="count-monthly">0</span>
          </div>
          <div class="planner-tasks-list" id="list-monthly">
            <!-- Loaded dynamically -->
          </div>
        </div>
      </div>
    </div>

    <!-- VIEW 2: REVISION CALENDAR -->
    <div id="planner-view-revisions" style="display: none;">
      <div class="glass-panel glass-card" style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="font-family: var(--font-header); font-size: 18px;" id="calendar-month-year">Calendar</h3>
          <div style="display: flex; gap: 8px;">
            <button id="calendar-prev" class="btn btn-glass" style="padding: 6px 12px;"><i class="fa-solid fa-chevron-left"></i></button>
            <button id="calendar-next" class="btn btn-glass" style="padding: 6px 12px;"><i class="fa-solid fa-chevron-right"></i></button>
          </div>
        </div>

        <!-- Calendar Month grid -->
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; text-align: center; font-size: 13px;">
          <!-- Weekday Headers -->
          <div style="font-weight: 700; color: var(--text-muted);">Sun</div>
          <div style="font-weight: 700; color: var(--text-muted);">Mon</div>
          <div style="font-weight: 700; color: var(--text-muted);">Tue</div>
          <div style="font-weight: 700; color: var(--text-muted);">Wed</div>
          <div style="font-weight: 700; color: var(--text-muted);">Thu</div>
          <div style="font-weight: 700; color: var(--text-muted);">Fri</div>
          <div style="font-weight: 700; color: var(--text-muted);">Sat</div>
        </div>

        <div id="calendar-days-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-top: 10px; min-height: 300px;">
          <!-- Loaded dynamically -->
        </div>
      </div>

      <!-- Selected Day details panel -->
      <div class="glass-panel glass-card" style="margin-top: 24px; padding: 24px;" id="selected-day-details">
        <h4 style="font-family: var(--font-header); font-size: 15px; margin-bottom: 12px;" id="details-day-title">Select a day to view scheduled revisions</h4>
        <div id="details-revisions-list" style="display: flex; flex-direction: column; gap: 8px;">
          <!-- Loaded dynamically -->
        </div>
      </div>
    </div>

    <!-- Task Creation Modal -->
    <div id="modal-add-task" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Create Goal Task</h3>
          <button class="modal-close" id="modal-task-close"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="form-add-task">
          <div class="form-group">
            <label class="form-label" for="task-title-input">Goal Title</label>
            <input class="form-input" type="text" id="task-title-input" required placeholder="e.g. Solve 50 Quant Geometry Questions">
          </div>
          <div class="form-group">
            <label class="form-label" for="task-type-select">Target Period</label>
            <select class="form-input" id="task-type-select" required>
              <option value="daily">Daily Target</option>
              <option value="weekly">Weekly Target</option>
              <option value="monthly">Monthly Target</option>
            </select>
          </div>
          <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label" for="task-priority-select">Priority Level</label>
              <select class="form-input" id="task-priority-select" required>
                <option value="High">High</option>
                <option value="Medium" selected>Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="task-assignee-select">Assignee</label>
              <select class="form-input" id="task-assignee-select" required>
                <option value="${currentUser}">You (${currentUser})</option>
                <option value="${currentUser === 'Dipu' ? 'Meghali' : 'Dipu'}">${currentUser === 'Dipu' ? 'Meghali' : 'Dipu'}</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="task-date-input">Target Deadline Date</label>
            <input class="form-input" type="date" id="task-date-input" required>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">Add Goal Task</button>
        </form>
      </div>
    </div>
  `;

  // Views switcher
  const tabRow = document.getElementById('planner-tabs');
  const viewBoards = document.getElementById('planner-view-boards');
  const viewRevisions = document.getElementById('planner-view-revisions');

  tabRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.syllabus-tab-btn');
    if (!btn) return;
    tabRow.querySelectorAll('.syllabus-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (btn.dataset.mode === 'boards') {
      viewBoards.style.display = 'block';
      viewRevisions.style.display = 'none';
    } else {
      viewBoards.style.display = 'none';
      viewRevisions.style.display = 'block';
      initRevisionCalendar(currentUser);
    }
  });

  // Modal handlers
  const taskModal = document.getElementById('modal-add-task');
  document.getElementById('btn-open-task-modal').addEventListener('click', () => {
    taskModal.classList.add('active');
    // Pre-fill date to today
    document.getElementById('task-date-input').value = new Date().toISOString().split('T')[0];
  });
  document.getElementById('modal-task-close').addEventListener('click', () => {
    taskModal.classList.remove('active');
  });

  // Subscribe to Tasks in real-time
  subscribeToTasks((tasks) => {
    renderTaskBoards(tasks, currentUser);
  });

  // Task creation handler
  const taskForm = document.getElementById('form-add-task');
  taskForm.onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title-input').value;
    const type = document.getElementById('task-type-select').value;
    const priority = document.getElementById('task-priority-select').value;
    const assignee = document.getElementById('task-assignee-select').value;
    const date = document.getElementById('task-date-input').value;

    try {
      await addTask({
        title,
        type,
        priority,
        assignee,
        dueDate: date
      });
      taskForm.reset();
      taskModal.classList.remove('active');
      showToast('Task added successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to add goal task.', 'error');
    }
  };
}

function renderTaskBoards(tasks, currentUser) {
  const lists = {
    daily: document.getElementById('list-daily'),
    weekly: document.getElementById('list-weekly'),
    monthly: document.getElementById('list-monthly')
  };

  const counts = {
    daily: document.getElementById('count-daily'),
    weekly: document.getElementById('count-weekly'),
    monthly: document.getElementById('count-monthly')
  };

  if (!lists.daily) return;

  // Group tasks
  const grouped = { daily: [], weekly: [], monthly: [] };
  
  tasks.forEach(t => {
    if (t.type && grouped[t.type]) {
      // Show all tasks, but color highlight based on assignee
      grouped[t.type].push(t);
    }
  });

  // Render boards
  Object.keys(lists).forEach(board => {
    const items = grouped[board];
    counts[board].innerText = items.length;

    if (items.length === 0) {
      lists[board].innerHTML = `
        <div style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 40px 0;">
          <i class="fa-solid fa-list-check" style="font-size: 24px; opacity: 0.2; margin-bottom: 8px;"></i>
          No goals set for this period.
        </div>
      `;
      return;
    }

    lists[board].innerHTML = items.map(t => {
      const isMine = t.assignee === currentUser || t.assignee === 'both';
      const indicatorColor = t.assignee === 'both' ? 'var(--color-info)' : (t.assignee === 'Dipu' ? 'var(--color-primary)' : 'var(--color-secondary)');
      
      return `
        <div class="task-card" id="task-card-${t.id}" style="border-left: 3px solid ${indicatorColor}; opacity: ${t.completed ? 0.6 : 1};">
          <div class="task-card-header">
            <label style="display: flex; gap: 10px; cursor: pointer; align-items: flex-start; flex: 1;">
              <input type="checkbox" class="task-check" ${t.completed ? 'checked' : ''} style="margin-top: 3px; accent-color: var(--color-primary);">
              <span class="task-title" style="text-decoration: ${t.completed ? 'line-through' : 'none'};">${t.title}</span>
            </label>
            <button class="video-action-icon-btn btn-delete-task" style="padding: 2px;" title="Delete Task"><i class="fa-solid fa-trash-can" style="color: var(--color-error); font-size: 12px;"></i></button>
          </div>
          <div class="task-card-meta">
            <span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span>
            <span style="font-size: 10px;">${t.assignee === 'both' ? 'Both' : t.assignee} • ${new Date(t.dueDate).toLocaleDateString([], {month: 'short', day: 'numeric'})}</span>
          </div>
        </div>
      `;
    }).join('');

    // Attach checkbox & delete handles
    items.forEach(t => {
      const card = document.getElementById(`task-card-${t.id}`);
      if (!card) return;

      // Checkbox changed
      card.querySelector('.task-check').addEventListener('change', async (e) => {
        const checked = e.target.checked;
        await updateTaskStatus(t.id, checked);
        showToast(checked ? 'Task completed!' : 'Task active.', 'success');
      });

      // Delete button
      card.querySelector('.btn-delete-task').addEventListener('click', async () => {
        if (confirm("Delete this goal?")) {
          await deleteTask(t.id);
          showToast('Task removed.', 'info');
        }
      });
    });
  });
}

/* ==========================================
   REVISION CALENDAR SUB-MODULE
   ========================================== */
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth(); // 0-indexed
let revisionSchedule = [];

async function initRevisionCalendar(currentUser) {
  const monthYearLabel = document.getElementById('calendar-month-year');
  const prevBtn = document.getElementById('calendar-prev');
  const nextBtn = document.getElementById('calendar-next');

  // Load revisions from DB
  await fetchRevisionRecords();

  const renderMonth = () => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    
    // Set Label
    const monthName = new Date(calendarYear, calendarMonth, 1).toLocaleString('default', { month: 'long' });
    monthYearLabel.innerText = `${monthName} ${calendarYear}`;

    const daysGrid = document.getElementById('calendar-days-grid');
    daysGrid.innerHTML = '';

    // Insert Blank offsets
    for (let i = 0; i < firstDay; i++) {
      daysGrid.innerHTML += `<div style="opacity: 0.2;"></div>`;
    }

    // Insert Month Days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Check if revisions exist for this date
      const daysRevs = revisionSchedule.filter(r => r.scheduledDates.includes(dateStr));
      const hasRevs = daysRevs.length > 0;
      
      let badgeHtml = '';
      if (hasRevs) {
        // Red dot or number
        badgeHtml = `<span style="width: 6px; height: 6px; border-radius: 50%; background: var(--color-secondary); display: block; margin-top: 4px;"></span>`;
      }

      daysGrid.innerHTML += `
        <div class="calendar-day-cell glass-panel" style="padding: 10px; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50px; background: ${hasRevs ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.01)'};" data-date="${dateStr}">
          <span style="font-weight: 700;">${day}</span>
          ${badgeHtml}
        </div>
      `;
    }

    // Attach click events on day cells
    daysGrid.querySelectorAll('.calendar-day-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const dStr = cell.dataset.date;
        showDayRevisions(dStr, currentUser);
      });
    });
  };

  prevBtn.onclick = () => {
    calendarMonth--;
    if (calendarMonth < 0) {
      calendarMonth = 11;
      calendarYear--;
    }
    renderMonth();
  };

  nextBtn.onclick = () => {
    calendarMonth++;
    if (calendarMonth > 11) {
      calendarMonth = 0;
      calendarYear++;
    }
    renderMonth();
  };

  renderMonth();
  
  // Auto-select today
  const todayStr = new Date().toISOString().split('T')[0];
  showDayRevisions(todayStr, currentUser);
}

async function fetchRevisionRecords() {
  // We query all syllabus completions that generate spacing dates
  // Or query the revisions collection
  revisionSchedule = [];
  try {
    const qSnap = await getDocs(collection(db, 'revisions'));
    qSnap.forEach(docSnap => {
      revisionSchedule.push({ id: docSnap.id, ...docSnap.data() });
    });
  } catch (e) {
    console.error("Failed to load revisions:", e);
  }
}

function showDayRevisions(dateStr, currentUser) {
  const title = document.getElementById('details-day-title');
  const list = document.getElementById('details-revisions-list');
  
  const displayDate = new Date(dateStr).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  title.innerText = `Revisions due on: ${displayDate}`;

  const daysRevs = revisionSchedule.filter(r => r.scheduledDates.includes(dateStr));

  if (daysRevs.length === 0) {
    list.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 12px 0;">
        <i class="fa-solid fa-champagne-glasses" style="font-size: 20px; color: var(--color-success); margin-bottom: 6px; display: block;"></i>
        Zero revisions scheduled for this date. Good job!
      </div>
    `;
    return;
  }

  list.innerHTML = daysRevs.map(r => {
    const isCompleted = r.completedDates && r.completedDates.includes(dateStr);
    
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border: 1px solid var(--panel-border); opacity: ${isCompleted ? 0.6 : 1};">
        <div>
          <span style="font-weight: 700; font-size: 13px; text-decoration: ${isCompleted ? 'line-through' : 'none'};">${r.title}</span>
          <span style="display: block; font-size: 10px; color: var(--text-secondary); margin-top: 2px;">Type: ${r.type.toUpperCase()}</span>
        </div>
        <button class="btn ${isCompleted ? 'btn-glass' : 'btn-primary'} btn-check-rev" data-id="${r.id}" data-date="${dateStr}" style="font-size: 11px; padding: 6px 12px;">
          ${isCompleted ? '<i class="fa-solid fa-circle-check"></i> Revised' : 'Mark Revised'}
        </button>
      </div>
    `;
  }).join('');

  // Attach button triggers
  list.querySelectorAll('.btn-check-rev').forEach(btn => {
    btn.addEventListener('click', async () => {
      const revId = btn.dataset.id;
      const targetDate = btn.dataset.date;
      
      const record = revisionSchedule.find(r => r.id === revId);
      if (!record) return;

      const completed = record.completedDates || [];
      
      let nextCompleted = [...completed];
      if (completed.includes(targetDate)) {
        nextCompleted = nextCompleted.filter(d => d !== targetDate);
      } else {
        nextCompleted.push(targetDate);
      }

      // Update in Firestore
      const docRef = doc(db, 'revisions', revId);
      await addDoc(collection(db, 'dummy'), {}); // Trigger state write if needed, or updateDoc
      // Wait, we can import updateDoc from firestore config!
      // Let's write updateDoc logic:
      const { updateDoc: fUpdateDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
      await fUpdateDoc(doc(db, 'revisions', revId), { completedDates: nextCompleted });

      showToast('Revision log updated successfully!', 'success');
      
      // Reload calendar view
      initRevisionCalendar(currentUser);
    });
  });
}
