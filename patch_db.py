import os

js_path = r"e:\web development\study antigravity\js\app.js"

with open(js_path, "r", encoding="utf-8") as f:
    code = f.read()

# Replace direct localStorage calls with LocalSettings wrapper
code = code.replace("localStorage.getItem", "LocalSettings.get")
code = code.replace("localStorage.setItem", "LocalSettings.set")
code = code.replace("localStorage.removeItem", "LocalSettings.remove")

# Overwrite database engines block at the start of app.js
old_engine_block = """// ==========================================
// LOCAL STORAGE DATABASE ENGINE
// ==========================================
const DB = {
  get(key, defaultValue = []) {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  },
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }
};"""

# Sometimes spaces/tabs are slightly different, so let's match another way if needed.
# Let's search and replace specifically using a direct substring replace
if old_engine_block not in code:
    # Try with LocalSettings instead if already modified
    old_engine_block = """// ==========================================
// LOCAL STORAGE DATABASE ENGINE
// ==========================================
const DB = {
  get(key, defaultValue = []) {
    const val = LocalSettings.get(key);
    return val ? JSON.parse(val) : defaultValue;
  },
  set(key, val) {
    LocalSettings.set(key, JSON.stringify(val));
  }
};"""

new_engine_block = """// ==========================================
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
};"""

code = code.replace(old_engine_block, new_engine_block)

# Replace localStorage checks inside initializeLocalStorageDB
code = code.replace("if (!LocalSettings.get('studysync_syllabus')) {", "if (!appCache['studysync_syllabus']) {")
code = code.replace("if (!LocalSettings.get('studysync_pyqs')) {", "if (!appCache['studysync_pyqs']) {")
code = code.replace("if (!LocalSettings.get('studysync_mocks')) {", "if (!appCache['studysync_mocks']) {")
code = code.replace("if (!LocalSettings.get('studysync_profiles')) {", "if (!appCache['studysync_profiles']) {")
code = code.replace("if (!LocalSettings.get('studysync_videos')) {", "if (!appCache['studysync_videos']) {")
code = code.replace("if (!LocalSettings.get('studysync_exams')) {", "if (!appCache['studysync_exams']) {")
code = code.replace("if (!LocalSettings.get('studysync_timer_subjects')) {", "if (!appCache['studysync_timer_subjects']) {")

# Replace call to initializeLocalStorageDB and create initDb
old_init_call = """// Call on startup
initializeLocalStorageDB();"""

new_init_call = """// Dynamic DB Initialization
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
}"""

code = code.replace(old_init_call, new_init_call)

# Wrap bootstrapper block in initDb call
old_bootstrapper = """// Bootstrapper initialization
applyLocalSettings();
initLoginBindings();

// Check logged user presence
const loggedUser = LocalSettings.get('studysync_user');
if (loggedUser) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-shell').style.display = 'grid';
  document.getElementById('avatar-me').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${loggedUser}`;
  document.getElementById('name-me').innerText = loggedUser;
  navigateToView('dashboard');
} else {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-shell').style.display = 'none';
}"""

new_bootstrapper = """// Bootstrapper initialization
initDb(() => {
  applyLocalSettings();
  initLoginBindings();

  // Check logged user presence
  const loggedUser = LocalSettings.get('studysync_user');
  if (loggedUser) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-shell').style.display = 'grid';
    document.getElementById('avatar-me').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${loggedUser}`;
    document.getElementById('name-me').innerText = loggedUser;
    navigateToView('dashboard');
  } else {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app-shell').style.display = 'none';
  }
});"""

code = code.replace(old_bootstrapper, new_bootstrapper)

with open(js_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Patched js/app.js successfully!")
