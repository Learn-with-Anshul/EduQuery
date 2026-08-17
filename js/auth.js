// ─── Mock Auth Layer ───────────────────────────────────────────────────────────
// In demo mode, auth is simulated using localStorage.
// Swap this module for a real Firebase Auth implementation when ready.

const AUTH_KEY = 'eduquery_user';

let _currentUser = null;
let _authListeners = [];

// ─── Initialize ────────────────────────────────────────────────────────────────
export function initAuth() {
  const stored = localStorage.getItem(AUTH_KEY);
  if (stored) {
    try {
      _currentUser = JSON.parse(stored);
    } catch {
      _currentUser = null;
    }
  }
}

// ─── Register ──────────────────────────────────────────────────────────────────
export async function registerWithEmail(name, email, password) {
  // Simulate network delay
  await delay(800);

  // Check if email already exists
  const allUsers = getAllUsers();
  if (allUsers.find(u => u.email === email)) {
    throw new Error('Email already registered. Please sign in.');
  }

  const user = {
    id: generateId(),
    name,
    email,
    avatar: getInitials(name),
    category: null,
    points: 0,
    questionsAsked: 0,
    bookmarks: [],
    upvotedQuestions: [],
    joinedAt: new Date().toISOString(),
    isDemo: false,
  };

  // Save to "database"
  allUsers.push({ ...user, password: btoa(password) });
  localStorage.setItem('eduquery_all_users', JSON.stringify(allUsers));

  // Log in
  _currentUser = user;
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  notifyListeners();
  return user;
}

// ─── Sign In ───────────────────────────────────────────────────────────────────
export async function signInWithEmail(email, password) {
  await delay(700);

  const allUsers = getAllUsers();
  const record = allUsers.find(u => u.email === email);

  if (!record) throw new Error('No account found with this email.');
  if (atob(record.password) !== password) throw new Error('Incorrect password.');

  const { password: _, ...user } = record;
  _currentUser = user;
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  notifyListeners();
  return user;
}

// ─── Google Sign-In (Mock) ─────────────────────────────────────────────────────
export async function signInWithGoogle() {
  await delay(1000);

  const mockGoogleUser = {
    id: 'google_' + generateId(),
    name: 'Demo Student',
    email: 'demo.student@gmail.com',
    avatar: 'DS',
    category: null,
    points: 50,
    questionsAsked: 0,
    bookmarks: [],
    upvotedQuestions: [],
    joinedAt: new Date().toISOString(),
    isDemo: true,
  };

  _currentUser = mockGoogleUser;
  localStorage.setItem(AUTH_KEY, JSON.stringify(mockGoogleUser));
  notifyListeners();
  return mockGoogleUser;
}

// ─── Sign Out ──────────────────────────────────────────────────────────────────
export async function signOut() {
  await delay(300);
  _currentUser = null;
  localStorage.removeItem(AUTH_KEY);
  notifyListeners();
}

// ─── Update Profile ────────────────────────────────────────────────────────────
export function updateUserProfile(updates) {
  if (!_currentUser) return;
  _currentUser = { ..._currentUser, ...updates };
  localStorage.setItem(AUTH_KEY, JSON.stringify(_currentUser));

  // Update in all_users store too
  const allUsers = getAllUsers();
  const idx = allUsers.findIndex(u => u.id === _currentUser.id);
  if (idx !== -1) {
    allUsers[idx] = { ...allUsers[idx], ...updates };
    localStorage.setItem('eduquery_all_users', JSON.stringify(allUsers));
  }
  notifyListeners();
}

// ─── Getters ───────────────────────────────────────────────────────────────────
export function getCurrentUser() {
  return _currentUser;
}

export function isLoggedIn() {
  return _currentUser !== null;
}

// ─── Auth State Listener ───────────────────────────────────────────────────────
export function onAuthStateChange(callback) {
  _authListeners.push(callback);
  // Immediately call with current state
  callback(_currentUser);
  return () => {
    _authListeners = _authListeners.filter(l => l !== callback);
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function notifyListeners() {
  _authListeners.forEach(cb => cb(_currentUser));
}

function getAllUsers() {
  try {
    return JSON.parse(localStorage.getItem('eduquery_all_users')) || [];
  } catch {
    return [];
  }
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function generateId() {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
