// ─── localStorage-backed Data Layer ───────────────────────────────────────────
// Mimics Firestore API. Replace with real Firestore calls when ready.

import { DEMO_QUESTIONS, DEMO_USERS } from './config.js';

const QUESTIONS_KEY = 'eduquery_questions';
const INITIALIZED_KEY = 'eduquery_initialized';

// ─── Initialize with Demo Data ─────────────────────────────────────────────────
export function initDatabase() {
  if (!localStorage.getItem(INITIALIZED_KEY)) {
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(DEMO_QUESTIONS));
    localStorage.setItem('eduquery_demo_users', JSON.stringify(DEMO_USERS));
    localStorage.setItem(INITIALIZED_KEY, 'true');
  }
}

// ─── Questions CRUD ────────────────────────────────────────────────────────────
export function getQuestions(categoryId = null, searchTerm = '') {
  let questions = readQuestions();

  if (categoryId && categoryId !== 'all') {
    questions = questions.filter(q => q.category === categoryId);
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    questions = questions.filter(q =>
      q.title.toLowerCase().includes(term) ||
      q.body.toLowerCase().includes(term) ||
      (q.tags || []).some(t => t.toLowerCase().includes(term))
    );
  }

  // Sort by newest first
  return questions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getQuestionById(id) {
  return readQuestions().find(q => q.id === id) || null;
}

export function addQuestion(userId, categoryId, title, body, tags) {
  const questions = readQuestions();
  const newQuestion = {
    id: generateId(),
    userId,
    category: categoryId,
    title,
    body,
    tags,
    upvotes: 0,
    bookmarks: 0,
    answers: 0,
    createdAt: new Date().toISOString(),
    answered: false,
    aiAnswer: null,
  };
  questions.unshift(newQuestion);
  saveQuestions(questions);
  return newQuestion;
}

export function updateQuestion(id, updates) {
  const questions = readQuestions();
  const idx = questions.findIndex(q => q.id === id);
  if (idx !== -1) {
    questions[idx] = { ...questions[idx], ...updates };
    saveQuestions(questions);
    return questions[idx];
  }
  return null;
}

export function upvoteQuestion(questionId, userId) {
  const questions = readQuestions();
  const q = questions.find(q => q.id === questionId);
  if (!q) return;

  const userVotes = getUserVotes(userId);
  if (userVotes.includes(questionId)) {
    // Un-upvote
    q.upvotes = Math.max(0, q.upvotes - 1);
    saveUserVotes(userId, userVotes.filter(id => id !== questionId));
  } else {
    // Upvote
    q.upvotes += 1;
    saveUserVotes(userId, [...userVotes, questionId]);
  }
  saveQuestions(questions);
  return { upvotes: q.upvotes, isUpvoted: !userVotes.includes(questionId) };
}

export function bookmarkQuestion(questionId, userId) {
  const questions = readQuestions();
  const q = questions.find(q => q.id === questionId);
  if (!q) return;

  const userBookmarks = getUserBookmarks(userId);
  if (userBookmarks.includes(questionId)) {
    q.bookmarks = Math.max(0, q.bookmarks - 1);
    saveUserBookmarks(userId, userBookmarks.filter(id => id !== questionId));
  } else {
    q.bookmarks += 1;
    saveUserBookmarks(userId, [...userBookmarks, questionId]);
  }
  saveQuestions(questions);
  return { bookmarks: q.bookmarks, isBookmarked: !userBookmarks.includes(questionId) };
}

// ─── User Questions ────────────────────────────────────────────────────────────
export function getUserQuestions(userId) {
  return readQuestions().filter(q => q.userId === userId);
}

export function getUserBookmarkedQuestions(userId) {
  const bookmarks = getUserBookmarks(userId);
  return readQuestions().filter(q => bookmarks.includes(q.id));
}

// ─── Stats ─────────────────────────────────────────────────────────────────────
export function getStats() {
  const questions = readQuestions();
  const categories = [...new Set(questions.map(q => q.category))];
  return {
    totalQuestions: questions.length,
    answeredQuestions: questions.filter(q => q.answered).length,
    categories: categories.length,
    totalUsers: (JSON.parse(localStorage.getItem('eduquery_all_users')) || []).length + 6, // +6 demo users
  };
}

// ─── Leaderboard ───────────────────────────────────────────────────────────────
export function getLeaderboard(categoryId = null) {
  const demoUsers = JSON.parse(localStorage.getItem('eduquery_demo_users')) || [];
  const realUsers = JSON.parse(localStorage.getItem('eduquery_all_users')) || [];

  const allUsers = [...demoUsers, ...realUsers.map(u => ({
    id: u.id,
    name: u.name,
    avatar: u.avatar,
    category: u.category,
    points: u.points || 0,
  }))];

  let filtered = categoryId && categoryId !== 'all'
    ? allUsers.filter(u => u.category === categoryId)
    : allUsers;

  return filtered.sort((a, b) => b.points - a.points).slice(0, 10);
}

// ─── Private Helpers ───────────────────────────────────────────────────────────
function readQuestions() {
  try {
    return JSON.parse(localStorage.getItem(QUESTIONS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveQuestions(questions) {
  localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
}

function getUserVotes(userId) {
  try {
    return JSON.parse(localStorage.getItem(`eduquery_votes_${userId}`)) || [];
  } catch {
    return [];
  }
}

function saveUserVotes(userId, votes) {
  localStorage.setItem(`eduquery_votes_${userId}`, JSON.stringify(votes));
}

function getUserBookmarks(userId) {
  try {
    return JSON.parse(localStorage.getItem(`eduquery_bookmarks_${userId}`)) || [];
  } catch {
    return [];
  }
}

function saveUserBookmarks(userId, bookmarks) {
  localStorage.setItem(`eduquery_bookmarks_${userId}`, JSON.stringify(bookmarks));
}

function generateId() {
  return 'q_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}
