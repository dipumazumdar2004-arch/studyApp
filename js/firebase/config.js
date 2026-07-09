import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

// Retrieve from localStorage
const savedConfig = localStorage.getItem('studysync_firebase_config');

let firebaseConfig = null;
if (savedConfig) {
  try {
    firebaseConfig = JSON.parse(savedConfig);
  } catch (e) {
    console.error("Failed to parse saved Firebase config:", e);
  }
}

let app = null;
let auth = null;
let db = null;
let storage = null;

export function isFirebaseConfigured() {
  return !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY");
}

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    // Enable Offline Persistence for Firestore
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore offline persistence failed: Multiple tabs open.');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore offline persistence is not supported by this browser.');
      }
    });
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
}

export function saveFirebaseConfig(config) {
  localStorage.setItem('studysync_firebase_config', JSON.stringify(config));
  window.location.reload();
}

export { app, auth, db, storage, firebaseConfig };
