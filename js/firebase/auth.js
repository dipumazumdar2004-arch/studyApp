import { auth, db, isFirebaseConfigured } from './config.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Auto-creates default profiles on your Firebase instance
export async function initializeDefaultUsers() {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured yet. Please configure it in Settings first.");
  }
  
  const defaultPassword = "StudySync2026!";
  const usersToCreate = [
    { email: "dipu@studysync.private", name: "Dipu" },
    { email: "meghali@studysync.private", name: "Meghali" }
  ];

  let successCount = 0;
  let errors = [];

  for (const user of usersToCreate) {
    try {
      const credential = await createUserWithEmailAndPassword(auth, user.email, defaultPassword);
      
      const userDocRef = doc(db, 'users', user.name);
      await setDoc(userDocRef, {
        uid: credential.user.uid,
        email: user.email,
        displayName: user.name,
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`,
        status: 'offline',
        lastSeen: serverTimestamp(),
        streak: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        studyHoursToday: 0
      });
      successCount++;
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        successCount++; // User already registered
      } else {
        errors.push(`${user.name}: ${err.message}`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Init errors: ${errors.join(', ')}`);
  }

  return { successCount, defaultPassword };
}

let partnerListener = null;

// Update User Presence in Firestore
export async function updateUserPresence(status) {
  if (!isFirebaseConfigured() || !auth.currentUser) return;
  const uid = auth.currentUser.uid;
  const userDocRef = doc(db, 'users', uid);
  try {
    await updateDoc(userDocRef, {
      status: status,
      lastSeen: serverTimestamp()
    });
  } catch (error) {
    // If the doc doesn't exist yet, we create it in login flow, so we catch errors here silently
    console.warn("Could not update user presence:", error);
  }
}

// Presence Listeners (Window events)
function initPresenceTracker() {
  window.addEventListener('focus', () => updateUserPresence('online'));
  window.addEventListener('blur', () => updateUserPresence('offline'));
  window.addEventListener('beforeunload', () => {
    // Attempting a quick update. Firestore doesn't support sendBeacon natively, but this works in most browsers before unload
    updateUserPresence('offline');
  });
  
  // Set initial online status
  updateUserPresence('online');
}

// Listen to Partner Status Changes
export function listenToPartner(currentUserUid, onUpdate) {
  if (!isFirebaseConfigured()) return;
  
  // Determine partner username based on our identity
  const partnerUid = currentUserUid === 'dipu-uid-placeholder' ? 'meghali-uid-placeholder' : ''; // Dynamic based on users collection
  
  // We list all users and listen to the one that is NOT us
  // Since we only have two users, this is very easy!
  return onSnapshot(doc(db, 'users', currentUserUid === 'Dipu' ? 'Meghali' : 'Dipu'), (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data());
    }
  }, (err) => {
    console.warn("Partner status read error: ", err);
  });
}

// Authentication Functions
export async function loginUser(email, password) {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured yet. Please configure it using the gear icon.");
  }
  const credential = await signInWithEmailAndPassword(auth, email, password);
  
  // Identify user name based on login profile selected (Dipu or Meghali)
  const userEmail = email.toLowerCase();
  const displayName = userEmail.includes('dipu') ? 'Dipu' : 'Meghali';
  
  // Ensure user document exists in Firestore
  const userDocRef = doc(db, 'users', displayName);
  const docSnap = await getDoc(userDocRef);
  
  const userData = {
    uid: credential.user.uid,
    email: credential.user.email,
    displayName: displayName,
    photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${displayName}`,
    status: 'online',
    lastSeen: serverTimestamp()
  };

  if (!docSnap.exists()) {
    await setDoc(userDocRef, {
      ...userData,
      streak: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      studyHoursToday: 0
    });
  } else {
    // Update streak logic
    const currentActive = docSnap.data();
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    let newStreak = currentActive.streak || 1;
    if (currentActive.lastActiveDate === yesterdayStr) {
      newStreak += 1;
    } else if (currentActive.lastActiveDate !== todayStr) {
      newStreak = 1; // Streak broken
    }
    
    await updateDoc(userDocRef, {
      uid: credential.user.uid,
      status: 'online',
      streak: newStreak,
      lastActiveDate: todayStr,
      lastSeen: serverTimestamp()
    });
  }
  
  initPresenceTracker();
  return displayName;
}

export async function logoutUser() {
  if (!isFirebaseConfigured()) return;
  try {
    await updateUserPresence('offline');
  } catch (e) {}
  if (partnerListener) {
    partnerListener();
    partnerListener = null;
  }
  await signOut(auth);
  localStorage.removeItem('studysync_user');
}

export async function resetPassword(email) {
  if (!isFirebaseConfigured()) throw new Error("Firebase not configured");
  await sendPasswordResetEmail(auth, email);
}

// Watch Auth State Changes
export function watchAuthState(onUserIn, onUserOut) {
  if (!isFirebaseConfigured()) {
    onUserOut();
    return;
  }
  
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Determine displayName from user email
      const displayName = user.email.includes('dipu') ? 'Dipu' : 'Meghali';
      localStorage.setItem('studysync_user', displayName);
      
      // Update status to online
      await updateUserPresence('online');
      initPresenceTracker();
      
      onUserIn(displayName);
    } else {
      localStorage.removeItem('studysync_user');
      onUserOut();
    }
  });
}
