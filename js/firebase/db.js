import { db, isFirebaseConfigured } from './config.js';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  getDocs,
  getDoc,
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Generic helper to get snapshot listeners
function listenToCollection(colName, queryConstraint, callback) {
  if (!isFirebaseConfigured()) return () => {};
  const colRef = collection(db, colName);
  const q = queryConstraint ? query(colRef, ...queryConstraint) : colRef;
  return onSnapshot(q, (snapshot) => {
    const items = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    callback(items);
  }, (err) => {
    console.error(`Error listening to ${colName}:`, err);
  });
}

/* ==========================================
   YOUTUBE VIDEOS DATA MANAGEMENT
   ========================================== */
export function subscribeToVideos(callback) {
  return listenToCollection('youtube_videos', [orderBy('addedAt', 'desc')], callback);
}

export async function addVideo(video) {
  if (!isFirebaseConfigured()) throw new Error("Firebase not configured");
  return await addDoc(collection(db, 'youtube_videos'), {
    ...video,
    addedAt: serverTimestamp(),
    userStatus: {
      Dipu: { status: 'pending', isFavorite: false, isImportant: false },
      Meghali: { status: 'pending', isFavorite: false, isImportant: false }
    },
    comments: []
  });
}

export async function updateVideoStatus(videoId, user, field, value) {
  if (!isFirebaseConfigured()) return;
  const docRef = doc(db, 'youtube_videos', videoId);
  await updateDoc(docRef, {
    [`userStatus.${user}.${field}`]: value
  });
}

export async function addCommentToVideo(videoId, comment) {
  if (!isFirebaseConfigured()) return;
  const docRef = doc(db, 'youtube_videos', videoId);
  await updateDoc(docRef, {
    comments: arrayUnion({
      ...comment,
      timestamp: new Date().toISOString()
    })
  });
}

export async function deleteVideo(videoId) {
  if (!isFirebaseConfigured()) return;
  await deleteDoc(doc(db, 'youtube_videos', videoId));
}

/* ==========================================
   SYLLABUS MANAGEMENT
   ========================================== */
export function subscribeToSyllabus(examName, callback) {
  return listenToCollection('syllabus', [where('exam', '==', examName), orderBy('chapter', 'asc')], callback);
}

export async function updateChapterProgress(chapterId, user, status, progressVal) {
  if (!isFirebaseConfigured()) return;
  const docRef = doc(db, 'syllabus', chapterId);
  await updateDoc(docRef, {
    [`status.${user}`]: status,
    [`progress.${user}`]: progressVal,
    lastUpdated: serverTimestamp()
  });
}

// Admin / Owner Actions
export async function addSyllabusChapter(chapterData) {
  if (!isFirebaseConfigured()) return;
  return await addDoc(collection(db, 'syllabus'), {
    ...chapterData,
    status: { Dipu: 'pending', Meghali: 'pending' },
    progress: { Dipu: 0, Meghali: 0 },
    lastUpdated: serverTimestamp()
  });
}

export async function deleteSyllabusChapter(chapterId) {
  if (!isFirebaseConfigured()) return;
  await deleteDoc(doc(db, 'syllabus', chapterId));
}

/* ==========================================
   STUDY NOTES MANAGEMENT
   ========================================== */
export function subscribeToNotes(callback) {
  return listenToCollection('notes', [orderBy('updatedAt', 'desc')], callback);
}

export async function createNote(title, content, author) {
  if (!isFirebaseConfigured()) return;
  return await addDoc(collection(db, 'notes'), {
    title,
    content,
    authorId: author,
    lastEditedBy: author,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    tags: [],
    versionHistory: []
  });
}

export async function updateNote(noteId, title, content, editorName, currentContent) {
  if (!isFirebaseConfigured()) return;
  const docRef = doc(db, 'notes', noteId);
  
  // Cache version history (keep last 5)
  const historyItem = {
    content: currentContent,
    editedBy: editorName,
    updatedAt: new Date().toISOString()
  };
  
  const docSnap = await getDoc(docRef);
  let history = [];
  if (docSnap.exists() && docSnap.data().versionHistory) {
    history = docSnap.data().versionHistory;
  }
  history.unshift(historyItem);
  if (history.length > 5) history.pop();

  await updateDoc(docRef, {
    title,
    content,
    lastEditedBy: editorName,
    updatedAt: serverTimestamp(),
    versionHistory: history
  });
}

/* ==========================================
   DAILY PLANNER (TASKS)
   ========================================== */
export function subscribeToTasks(callback) {
  return listenToCollection('planner', [orderBy('dueDate', 'asc')], callback);
}

export async function addTask(task) {
  if (!isFirebaseConfigured()) return;
  return await addDoc(collection(db, 'planner'), {
    ...task,
    completed: false,
    createdAt: serverTimestamp()
  });
}

export async function updateTaskStatus(taskId, completed) {
  if (!isFirebaseConfigured()) return;
  const docRef = doc(db, 'planner', taskId);
  await updateDoc(docRef, { completed });
}

export async function deleteTask(taskId) {
  if (!isFirebaseConfigured()) return;
  await deleteDoc(doc(db, 'planner', taskId));
}

/* ==========================================
   POMODORO & STUDY SESSIONS
   ========================================== */
export async function logStudySession(uid, minutes, type, subject, chapter = '') {
  if (!isFirebaseConfigured()) return;
  await addDoc(collection(db, 'study_sessions'), {
    uid,
    durationMinutes: Number(minutes),
    type,
    subject,
    chapter,
    timestamp: serverTimestamp()
  });
  
  // Also update user's daily study hours total in their user doc
  const todayStr = new Date().toISOString().split('T')[0];
  const userDocRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userDocRef);
  
  if (userSnap.exists()) {
    const data = userSnap.data();
    let dailyHours = Number(data.studyHoursToday || 0);
    // Add logged minutes converted to hours
    dailyHours += (minutes / 60);
    
    await updateDoc(userDocRef, {
      studyHoursToday: Number(dailyHours.toFixed(2)),
      lastActiveDate: todayStr,
      lastSeen: serverTimestamp()
    });
  }
}

export function subscribeToStudySessions(uid, callback) {
  return listenToCollection('study_sessions', [where('uid', '==', uid), orderBy('timestamp', 'desc')], callback);
}

/* ==========================================
   MOCK TESTS
   ========================================== */
export function subscribeToMockTests(callback) {
  return listenToCollection('mock_tests', [orderBy('date', 'desc')], callback);
}

export async function addMockTest(mockData) {
  if (!isFirebaseConfigured()) return;
  return await addDoc(collection(db, 'mock_tests'), {
    ...mockData,
    date: serverTimestamp()
  });
}

/* ==========================================
   PREVIOUS YEAR QUESTIONS (PYQ)
   ========================================== */
export function subscribeToPYQs(callback) {
  return listenToCollection('pyqs', [orderBy('subject', 'asc')], callback);
}

export async function addPYQ(pyqData) {
  if (!isFirebaseConfigured()) return;
  return await addDoc(collection(db, 'pyqs'), {
    ...pyqData,
    userStatus: {
      Dipu: { solved: false, revisionRequired: false, bookmarked: false },
      Meghali: { solved: false, revisionRequired: false, bookmarked: false }
    }
  });
}

export async function updatePYQStatus(pyqId, user, field, value) {
  if (!isFirebaseConfigured()) return;
  const docRef = doc(db, 'pyqs', pyqId);
  await updateDoc(docRef, {
    [`userStatus.${user}.${field}`]: value
  });
}

/* ==========================================
   NOTIFICATIONS
   ========================================== */
export function subscribeToNotifications(userDisplayName, callback) {
  // Listen to notifications directed to "all" or specific user
  return listenToCollection('notifications', [
    where('recipientId', 'in', ['all', userDisplayName]),
    orderBy('timestamp', 'desc'),
    limit(20)
  ], callback);
}

export async function triggerNotification(type, senderName, title, body) {
  if (!isFirebaseConfigured()) return;
  const recipient = senderName === 'Dipu' ? 'Meghali' : 'Dipu';
  await addDoc(collection(db, 'notifications'), {
    type,
    senderId: senderName,
    senderName,
    recipientId: recipient,
    title,
    body,
    read: { Dipu: false, Meghali: false },
    timestamp: serverTimestamp()
  });
}

export async function markNotificationAsRead(notifId, user) {
  if (!isFirebaseConfigured()) return;
  const docRef = doc(db, 'notifications', notifId);
  await updateDoc(docRef, {
    [`read.${user}`]: true
  });
}
