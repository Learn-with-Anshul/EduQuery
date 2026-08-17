// ─── Main App Controller ───────────────────────────────────────────────────────
import { CATEGORIES, DEMO_USERS } from './config.js';
import {
  initAuth, registerWithEmail, signInWithEmail, signInWithGoogle,
  signOut, onAuthStateChange, getCurrentUser, updateUserProfile, isLoggedIn,
} from './auth.js';
import { initDatabase, getQuestions, addQuestion, upvoteQuestion, bookmarkQuestion, updateQuestion, getUserQuestions, getUserBookmarkedQuestions, getStats, getLeaderboard } from './firestore.js';
import { streamAnswer, generateFollowUpSuggestions } from './ai.js';
import { showToast, renderMarkdown, timeAgo, createAvatarEl, observeFadeIn, initParticles, initTheme, toggleTheme, truncate, debounce, animateCounter } from './ui.js';

// ─── App State ─────────────────────────────────────────────────────────────────
let state = {
  currentView: 'landing',
  activeCategory: 'all',
  searchTerm: '',
  selectedQuestion: null,
  isAiLoading: false,
  profileTab: 'questions',
};

// ─── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  initTheme();
  initAuth();
  initDatabase();
  bindStaticEvents();
  initParticles('particles-canvas');

  onAuthStateChange((user) => {
    updateNavUser(user);
    if (user && !user.category && state.currentView !== 'onboarding') {
      showView('onboarding');
    } else if (user && user.category && state.currentView === 'landing') {
      showView('dashboard');
    } else if (!user && ['dashboard', 'profile', 'onboarding'].includes(state.currentView)) {
      showView('landing');
    }
  });

  // Render landing stats
  renderLandingStats();
  renderLandingFeed();
}

// ─── View Router ───────────────────────────────────────────────────────────────
function showView(view, data = {}) {
  state.currentView = view;

  // Hide all views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  const el = document.getElementById(`view-${view}`);
  if (el) {
    el.classList.add('active');
    el.scrollTop = 0;
  }

  // Update nav highlight
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.view === view);
  });

  // View-specific init
  switch (view) {
    case 'landing': renderLandingStats(); renderLandingFeed(); break;
    case 'dashboard': renderDashboard(); break;
    case 'onboarding': renderOnboarding(); break;
    case 'ask': renderAskView(data); break;
    case 'question': renderQuestionDetail(data.questionId); break;
    case 'profile': renderProfile(); break;
    case 'leaderboard': renderLeaderboard(); break;
  }
}

// ─── Nav Update ────────────────────────────────────────────────────────────────
function updateNavUser(user) {
  const navUser = document.getElementById('nav-user');
  const navAuth = document.getElementById('nav-auth');
  const navLinks = document.getElementById('nav-links');

  if (user) {
    navAuth.style.display = 'none';
    navUser.style.display = 'flex';
    navLinks.style.display = 'flex';

    const avatar = document.getElementById('nav-avatar-btn');
    if (avatar) {
      const color = ['#6366f1', '#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'][
        (user.avatar.charCodeAt(0) || 0) % 6
      ];
      avatar.style.background = color;
      avatar.textContent = user.avatar;
    }
    const nameEl = document.getElementById('nav-username-display');
    if (nameEl) nameEl.textContent = user.name.split(' ')[0];
  } else {
    navAuth.style.display = 'flex';
    navUser.style.display = 'none';
    navLinks.style.display = 'none';
  }
}

// ─── Landing View ──────────────────────────────────────────────────────────────
function renderLandingStats() {
  const stats = getStats();
  const els = {
    'stat-questions': stats.totalQuestions,
    'stat-answered': stats.answeredQuestions,
    'stat-students': stats.totalUsers + 1200,
    'stat-subjects': CATEGORIES.length,
  };
  Object.entries(els).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) animateCounter(el, 0, val, 1200);
  });
}

function renderLandingFeed() {
  const feed = document.getElementById('landing-feed');
  if (!feed) return;
  const questions = getQuestions().slice(0, 4);
  feed.innerHTML = questions.map(q => renderQuestionCard(q, false)).join('');
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
function renderDashboard() {
  const user = getCurrentUser();
  if (!user) return;

  // Update greeting
  const greeting = document.getElementById('dashboard-greeting');
  if (greeting) {
    const hour = new Date().getHours();
    const timeGreet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    greeting.innerHTML = `${timeGreet}, <span class="highlight">${user.name.split(' ')[0]}</span>! 👋`;
  }

  // Category badge
  const catBadge = document.getElementById('dashboard-category');
  if (catBadge) {
    const cat = CATEGORIES.find(c => c.id === user.category);
    catBadge.textContent = cat ? `${cat.icon} ${cat.name}` : '📚 All Subjects';
    if (cat) catBadge.style.background = cat.gradient;
  }

  // Render category filters
  renderCategoryFilters();

  // Render question feed
  renderQuestionFeed();
}

function renderCategoryFilters() {
  const container = document.getElementById('category-filters');
  if (!container) return;

  const allBtn = `<button class="cat-filter ${state.activeCategory === 'all' ? 'active' : ''}" data-cat="all">🌐 All</button>`;
  const catBtns = CATEGORIES.map(c =>
    `<button class="cat-filter ${state.activeCategory === c.id ? 'active' : ''}" data-cat="${c.id}" style="--cat-color:${c.color}">${c.icon} ${c.name}</button>`
  ).join('');

  container.innerHTML = allBtn + catBtns;
  container.querySelectorAll('.cat-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeCategory = btn.dataset.cat;
      renderCategoryFilters();
      renderQuestionFeed();
    });
  });
}

function renderQuestionFeed() {
  const feed = document.getElementById('question-feed');
  if (!feed) return;

  const questions = getQuestions(
    state.activeCategory === 'all' ? null : state.activeCategory,
    state.searchTerm
  );

  if (questions.length === 0) {
    feed.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No questions found</h3>
        <p>${state.searchTerm ? 'Try a different search term' : 'Be the first to ask in this category!'}</p>
        <button class="btn btn-primary" onclick="window.askQuestion()">Ask a Question</button>
      </div>`;
    return;
  }

  const user = getCurrentUser();
  feed.innerHTML = questions.map(q => renderQuestionCard(q, true, user)).join('');

  // Bind card events
  feed.querySelectorAll('.q-card').forEach(card => {
    const qId = card.dataset.qid;
    card.querySelector('.q-card-body')?.addEventListener('click', () => {
      showView('question', { questionId: qId });
    });

    const upvoteBtn = card.querySelector('.btn-upvote');
    if (upvoteBtn && user) {
      upvoteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const result = upvoteQuestion(qId, user.id);
        const countEl = upvoteBtn.querySelector('.vote-count');
        if (countEl) countEl.textContent = result.upvotes;
        upvoteBtn.classList.toggle('active', result.isUpvoted);
      });
    }

    const bookmarkBtn = card.querySelector('.btn-bookmark');
    if (bookmarkBtn && user) {
      bookmarkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        bookmarkQuestion(qId, user.id);
        bookmarkBtn.classList.toggle('active');
        showToast(bookmarkBtn.classList.contains('active') ? 'Question bookmarked!' : 'Bookmark removed', 'success');
      });
    }
  });
}

function renderQuestionCard(q, interactive = true, currentUser = null) {
  const cat = CATEGORIES.find(c => c.id === q.category);
  const author = DEMO_USERS.find(u => u.id === q.userId) ||
    { name: 'Anonymous', avatar: 'AN' };

  const tags = (q.tags || []).slice(0, 3).map(t =>
    `<span class="tag">${t}</span>`).join('');

  const actionButtons = interactive ? `
    <div class="q-actions">
      <button class="q-action-btn btn-upvote" title="Upvote">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 4l8 8H4z"/></svg>
        <span class="vote-count">${q.upvotes}</span>
      </button>
      <button class="q-action-btn btn-bookmark" title="Bookmark">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
      </button>
      <span class="q-stat">💬 ${q.answers} answers</span>
    </div>` : '';

  return `
    <div class="q-card fade-in-on-scroll" data-qid="${q.id}">
      <div class="q-card-header">
        <div class="q-cat-badge" style="background: ${cat?.gradient || '#6366f1'}">
          ${cat?.icon || '📚'} ${cat?.name || 'General'}
        </div>
        ${q.answered ? '<div class="q-answered-badge">✓ Answered</div>' : ''}
      </div>
      <div class="q-card-body">
        <h3 class="q-title">${q.title}</h3>
        <p class="q-body">${truncate(q.body, 100)}</p>
        <div class="q-tags">${tags}</div>
      </div>
      <div class="q-card-footer">
        <div class="q-author">
          <div class="avatar-xs" style="background: ${ ['#6366f1','#8b5cf6','#ec4899','#3b82f6','#10b981','#f59e0b'][(author.avatar.charCodeAt(0)||0)%6]}">
            ${author.avatar}
          </div>
          <span class="author-name">${author.name}</span>
          <span class="q-time">${timeAgo(q.createdAt)}</span>
        </div>
        ${actionButtons}
      </div>
    </div>`;
}

// ─── Onboarding ────────────────────────────────────────────────────────────────
function renderOnboarding() {
  const grid = document.getElementById('onboarding-grid');
  if (!grid) return;

  grid.innerHTML = CATEGORIES.map(cat => `
    <div class="onboarding-card" data-cat="${cat.id}" style="--cat-gradient: ${cat.gradient}; --cat-color: ${cat.color}">
      <div class="ob-icon">${cat.icon}</div>
      <h3 class="ob-name">${cat.name}</h3>
      <p class="ob-desc">${cat.description}</p>
      <div class="ob-tags">
        ${cat.tags.slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
      <div class="ob-check">✓</div>
    </div>`).join('');

  let selected = null;
  grid.querySelectorAll('.onboarding-card').forEach(card => {
    card.addEventListener('click', () => {
      grid.querySelectorAll('.onboarding-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selected = card.dataset.cat;
      document.getElementById('onboarding-confirm')?.removeAttribute('disabled');
    });
  });

  document.getElementById('onboarding-confirm')?.addEventListener('click', async () => {
    if (!selected) return;
    updateUserProfile({ category: selected });
    showToast(`Welcome! You're now set up for ${CATEGORIES.find(c => c.id === selected)?.name}`, 'success');
    showView('dashboard');
  });
}

// ─── Math Symbol Toolbar ───────────────────────────────────────────────────────
const MATH_SYMBOLS = {
  greek: [
    { label: 'α', latex: '\\alpha' }, { label: 'β', latex: '\\beta' },
    { label: 'γ', latex: '\\gamma' }, { label: 'δ', latex: '\\delta' },
    { label: 'ε', latex: '\\epsilon' }, { label: 'θ', latex: '\\theta' },
    { label: 'λ', latex: '\\lambda' }, { label: 'μ', latex: '\\mu' },
    { label: 'π', latex: '\\pi' }, { label: 'σ', latex: '\\sigma' },
    { label: 'φ', latex: '\\phi' }, { label: 'ω', latex: '\\omega' },
    { label: 'Σ', latex: '\\Sigma' }, { label: 'Δ', latex: '\\Delta' },
    { label: 'Γ', latex: '\\Gamma' }, { label: 'Ω', latex: '\\Omega' },
    { label: 'Λ', latex: '\\Lambda' }, { label: 'Π', latex: '\\Pi' },
  ],
  operators: [
    { label: '±', latex: '\\pm' }, { label: '∓', latex: '\\mp' },
    { label: '×', latex: '\\times' }, { label: '÷', latex: '\\div' },
    { label: '·', latex: '\\cdot' }, { label: '√', latex: '\\sqrt{}' },
    { label: 'xⁿ', latex: '^{}' }, { label: 'xₙ', latex: '_{}' },
    { label: '∞', latex: '\\infty' }, { label: '|x|', latex: '|{}|' },
    { label: '%', latex: '\\%' }, { label: '‰', latex: '\\permil' },
  ],
  relations: [
    { label: '≠', latex: '\\neq' }, { label: '≈', latex: '\\approx' },
    { label: '≡', latex: '\\equiv' }, { label: '≤', latex: '\\leq' },
    { label: '≥', latex: '\\geq' }, { label: '≪', latex: '\\ll' },
    { label: '≫', latex: '\\gg' }, { label: '∝', latex: '\\propto' },
    { label: '~', latex: '\\sim' }, { label: '≅', latex: '\\cong' },
  ],
  calculus: [
    { label: '∫', latex: '\\int' }, { label: '∬', latex: '\\iint' },
    { label: '∮', latex: '\\oint' }, { label: 'd/dx', latex: '\\frac{d}{dx}' },
    { label: '∂', latex: '\\partial' }, { label: 'lim', latex: '\\lim_{x \\to }' },
    { label: '∑', latex: '\\sum_{i=1}^{n}' }, { label: '∏', latex: '\\prod_{i=1}^{n}' },
    { label: '→∞', latex: '\\to \\infty' }, { label: 'f\'', latex: "f'(x)" },
    { label: '∇', latex: '\\nabla' }, { label: '△', latex: '\\triangle' },
  ],
  geometry: [
    { label: '∠', latex: '\\angle' }, { label: '△', latex: '\\triangle' },
    { label: '⊥', latex: '\\perp' }, { label: '∥', latex: '\\parallel' },
    { label: '°', latex: '^{\\circ}' }, { label: 'π', latex: '\\pi' },
    { label: '≅', latex: '\\cong' }, { label: '~', latex: '\\sim' },
    { label: '→', latex: '\\overrightarrow{}' }, { label: 'AB̄', latex: '\\overline{AB}' },
  ],
  sets: [
    { label: '∈', latex: '\\in' }, { label: '∉', latex: '\\notin' },
    { label: '⊂', latex: '\\subset' }, { label: '⊆', latex: '\\subseteq' },
    { label: '∪', latex: '\\cup' }, { label: '∩', latex: '\\cap' },
    { label: '∅', latex: '\\emptyset' }, { label: 'ℕ', latex: '\\mathbb{N}' },
    { label: 'ℤ', latex: '\\mathbb{Z}' }, { label: 'ℝ', latex: '\\mathbb{R}' },
    { label: '∀', latex: '\\forall' }, { label: '∃', latex: '\\exists' },
  ],
  fractions: [
    { label: '½', latex: '\\frac{1}{2}' }, { label: '⅓', latex: '\\frac{1}{3}' },
    { label: '¼', latex: '\\frac{1}{4}' }, { label: 'a/b', latex: '\\frac{a}{b}' },
    { label: '√x', latex: '\\sqrt{x}' }, { label: '∛x', latex: '\\sqrt[3]{x}' },
    { label: 'xⁿ', latex: 'x^{n}' }, { label: 'eˣ', latex: 'e^{x}' },
    { label: 'log', latex: '\\log_{b}(x)' }, { label: 'ln', latex: '\\ln(x)' },
    { label: 'sin', latex: '\\sin(\\theta)' }, { label: 'cos', latex: '\\cos(\\theta)' },
    { label: 'tan', latex: '\\tan(\\theta)' },
  ],
};

function initMathToolbar() {
  const toolbar   = document.getElementById('math-symbol-toolbar');
  const tabBtns   = document.querySelectorAll('.math-tab-btn');
  const textarea  = document.getElementById('ask-body');
  const preview   = document.getElementById('ask-math-preview');
  const prevToggle = document.getElementById('ask-preview-toggle');

  if (!toolbar || !textarea) return;

  let activeCat = 'greek';

  function renderSymbols(cat) {
    activeCat = cat;
    const symbols = MATH_SYMBOLS[cat] || [];
    toolbar.innerHTML = symbols.map(s =>
      `<button class="math-btn" type="button" title="${s.latex}" data-latex="${s.latex}">${s.label}</button>`
    ).join('');

    toolbar.querySelectorAll('.math-btn').forEach(btn => {
      btn.addEventListener('click', () => insertLatex(btn.dataset.latex));
    });
  }

  function insertLatex(latex) {
    const start = textarea.selectionStart;
    const end   = textarea.selectionEnd;
    const val   = textarea.value;
    // Wrap in $ if not already a command
    const insert = latex.startsWith('\\') || latex.includes('{') ? `$${latex}$` : latex;
    textarea.value = val.slice(0, start) + insert + val.slice(end);
    // Move cursor inside braces if present
    const cursorPos = start + insert.length - (insert.endsWith('$}$') ? 2 : 0);
    textarea.setSelectionRange(cursorPos, cursorPos);
    textarea.focus();
    updateMathPreview();
  }

  // Tab switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderSymbols(btn.dataset.cat);
    });
  });

  // Live preview toggle
  let previewOn = false;
  prevToggle?.addEventListener('click', () => {
    previewOn = !previewOn;
    prevToggle.textContent = previewOn ? '✕ Hide preview' : '👁 Preview math';
    preview.style.display = previewOn ? 'block' : 'none';
    if (previewOn) updateMathPreview();
  });

  function updateMathPreview() {
    if (!previewOn || !preview) return;
    const text = textarea.value || '';
    if (!text.trim()) {
      preview.innerHTML = '<em style="color:var(--text-muted); font-size:13px;">Start typing to see math preview…</em>';
      return;
    }
    // Simple text → HTML with $ delimiters preserved for KaTeX
    preview.textContent = text;
    if (window.renderMathInElement) {
      try {
        preview.textContent = text;
        window.renderMathInElement(preview, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true },
          ],
          throwOnError: false,
        });
      } catch(e) { /* ignore parse errors */ }
    }
  }

  textarea.addEventListener('input', () => { if (previewOn) updateMathPreview(); });

  // Render default category
  renderSymbols('greek');
}

// ─── Ask Question View ─────────────────────────────────────────────────────────
function renderAskView(data = {}) {
  const user = getCurrentUser();
  if (!user) { showAuthModal(); return; }

  // Pre-select category
  const catSelect = document.getElementById('ask-category');
  if (catSelect) {
    catSelect.innerHTML = CATEGORIES.map(c =>
      `<option value="${c.id}" ${(data.categoryId || user.category) === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`
    ).join('');
  }

  // Pre-fill tag suggestions
  updateTagSuggestions(data.categoryId || user.category);
  catSelect?.addEventListener('change', () => updateTagSuggestions(catSelect.value));

  // If a question title was passed in (from quick-ask), pre-fill
  if (data.prefillTitle) {
    const titleInput = document.getElementById('ask-title');
    if (titleInput) titleInput.value = data.prefillTitle;
  }

  // Initialise math toolbar (re-init each time view opens)
  // Small delay so DOM is fully settled
  setTimeout(initMathToolbar, 50);
}

function updateTagSuggestions(categoryId) {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  const container = document.getElementById('tag-suggestions');
  if (!container || !cat) return;

  container.innerHTML = cat.tags.map(t =>
    `<button class="tag-btn" data-tag="${t}">${t}</button>`).join('');

  container.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
      updateSelectedTags();
    });
  });
}

function updateSelectedTags() {
  const selected = [...document.querySelectorAll('.tag-btn.selected')].map(b => b.dataset.tag);
  const input = document.getElementById('ask-tags-hidden');
  if (input) input.value = JSON.stringify(selected);
}

// ─── Question Detail ───────────────────────────────────────────────────────────
function renderQuestionDetail(questionId) {
  const q = questionId ? require_q(questionId) : null;
  if (!q) { showView('dashboard'); return; }

  state.selectedQuestion = q;

  document.getElementById('qd-title').textContent = q.title;
  document.getElementById('qd-body').textContent = q.body;
  document.getElementById('qd-time').textContent = timeAgo(q.createdAt);

  const cat = CATEGORIES.find(c => c.id === q.category);
  const catBadge = document.getElementById('qd-category');
  if (catBadge) {
    catBadge.textContent = `${cat?.icon} ${cat?.name}`;
    catBadge.style.background = cat?.gradient || '#6366f1';
  }

  const tagsEl = document.getElementById('qd-tags');
  if (tagsEl) tagsEl.innerHTML = (q.tags || []).map(t => `<span class="tag">${t}</span>`).join('');

  // Show AI answer if already answered
  const answerSection = document.getElementById('qd-answer-section');
  if (q.aiAnswer) {
    answerSection.innerHTML = `
      <div class="ai-answer-box">
        <div class="ai-header">
          <div class="ai-badge">🤖 AI Answer</div>
          <span class="ai-model">EduQuery AI • Powered by Demo Mode</span>
        </div>
        <div class="ai-content" id="ai-rendered-content">${renderMarkdown(q.aiAnswer)}</div>
      </div>`;
    // Render any math in the AI answer
    requestAnimationFrame(() => {
      const el = document.getElementById('ai-rendered-content');
      if (el && window.renderMathInElement) {
        window.renderMathInElement(el, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true },
          ],
          throwOnError: false,
        });
      }
    });
  } else {
    answerSection.innerHTML = `
      <div class="ai-answer-box ai-pending">
        <div class="ai-header">
          <div class="ai-badge">🤖 AI Answer</div>
        </div>
        <div id="ai-loading-area" class="ai-loading-area">
          <button class="btn btn-primary btn-get-answer" id="btn-get-answer">
            ✨ Get AI Answer
          </button>
        </div>
      </div>`;

    document.getElementById('btn-get-answer')?.addEventListener('click', () => getAiAnswer(q));
  }

  // Suggestions
  const suggestions = generateFollowUpSuggestions(q.category);
  const sugEl = document.getElementById('qd-suggestions');
  if (sugEl) {
    sugEl.innerHTML = suggestions.map(s =>
      `<button class="suggestion-btn" onclick="window.askFollowUp('${s.replace(/'/g, "\\'")}', '${q.category}')">${s}</button>`
    ).join('');
  }
}

function require_q(id) {
  const { getQuestionById } = window._db || {};
  // Fallback: search from getQuestions
  return getQuestions().find(q => q.id === id) || null;
}

async function getAiAnswer(q) {
  if (state.isAiLoading) return;
  state.isAiLoading = true;

  const loadingArea = document.getElementById('ai-loading-area');
  if (!loadingArea) return;

  loadingArea.innerHTML = `
    <div class="ai-streaming">
      <div class="ai-thinking">
        <div class="thinking-dots"><span></span><span></span><span></span></div>
        <span>AI is analyzing your question...</span>
      </div>
      <div id="ai-stream-content" class="ai-stream-content"></div>
    </div>`;

  const streamEl = document.getElementById('ai-stream-content');

  try {
    await streamAnswer(
      q,
      q.category,
      (chunk) => {
        if (streamEl) {
          streamEl.innerHTML = renderMarkdown(chunk);
          streamEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        // Hide thinking dots once content starts
        const thinking = document.querySelector('.ai-thinking');
        if (thinking && chunk.length > 50) thinking.style.opacity = '0';
      },
      (fullAnswer) => {
        // Save answer to "database"
        updateQuestion(q.id, { aiAnswer: fullAnswer, answered: true });
        state.isAiLoading = false;

        // Award points to question asker
        const user = getCurrentUser();
        if (user) updateUserProfile({ points: (user.points || 0) + 10 });

        showToast('Answer generated! +10 points earned 🎉', 'success');

        // Remove thinking dots
        document.querySelector('.ai-thinking')?.remove();
      }
    );
  } catch (err) {
    loadingArea.innerHTML = `<div class="error-state">Failed to generate answer. Please try again.</div>`;
    state.isAiLoading = false;
  }
}

// ─── Profile View ──────────────────────────────────────────────────────────────
function renderProfile() {
  const user = getCurrentUser();
  if (!user) return;

  const cat = CATEGORIES.find(c => c.id === user.category);

  document.getElementById('profile-name').textContent = user.name;
  document.getElementById('profile-email').textContent = user.email;
  document.getElementById('profile-points').textContent = user.points || 0;

  const profileAvatar = document.getElementById('profile-avatar');
  if (profileAvatar) {
    const color = ['#6366f1','#8b5cf6','#ec4899','#3b82f6','#10b981','#f59e0b'][
      (user.avatar.charCodeAt(0)||0)%6];
    profileAvatar.style.background = color;
    profileAvatar.textContent = user.avatar;
  }

  const profileCat = document.getElementById('profile-category');
  if (profileCat && cat) {
    profileCat.textContent = `${cat.icon} ${cat.name}`;
    profileCat.style.background = cat.gradient;
  }

  // My questions
  const myQs = getUserQuestions(user.id);
  document.getElementById('profile-q-count').textContent = myQs.length;

  renderProfileTab();
}

function renderProfileTab() {
  const user = getCurrentUser();
  if (!user) return;

  const tabContent = document.getElementById('profile-tab-content');
  if (!tabContent) return;

  const myQs = state.profileTab === 'questions' ? getUserQuestions(user.id) : getUserBookmarkedQuestions(user.id);

  if (myQs.length === 0) {
    tabContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${state.profileTab === 'questions' ? '✏️' : '🔖'}</div>
        <p>${state.profileTab === 'questions' ? 'You haven\'t asked any questions yet.' : 'No bookmarked questions yet.'}</p>
      </div>`;
    return;
  }

  tabContent.innerHTML = myQs.map(q => renderQuestionCard(q, true, user)).join('');
  tabContent.querySelectorAll('.q-card-body').forEach((body, i) => {
    body.addEventListener('click', () => showView('question', { questionId: myQs[i].id }));
  });
}

// ─── Leaderboard ───────────────────────────────────────────────────────────────
function renderLeaderboard() {
  const board = getLeaderboard(state.activeCategory === 'all' ? null : state.activeCategory);
  const container = document.getElementById('leaderboard-list');
  if (!container) return;

  const medals = ['🥇', '🥈', '🥉'];
  container.innerHTML = board.map((user, i) => {
    const cat = CATEGORIES.find(c => c.id === user.category);
    return `
      <div class="lb-row ${i < 3 ? 'lb-top' : ''}">
        <div class="lb-rank">${medals[i] || `#${i + 1}`}</div>
        <div class="avatar-sm" style="background: ${ ['#6366f1','#8b5cf6','#ec4899','#3b82f6','#10b981','#f59e0b'][(user.avatar?.charCodeAt(0)||0)%6]}">
          ${user.avatar}
        </div>
        <div class="lb-info">
          <div class="lb-name">${user.name}</div>
          <div class="lb-cat">${cat ? `${cat.icon} ${cat.name}` : 'General'}</div>
        </div>
        <div class="lb-points">${user.points} pts</div>
      </div>`;
  }).join('');
}

// ─── Auth Modal ────────────────────────────────────────────────────────────────
function showAuthModal(tab = 'login') {
  const modal = document.getElementById('auth-modal');
  modal?.classList.add('open');
  switchAuthTab(tab);
}

function hideAuthModal() {
  document.getElementById('auth-modal')?.classList.remove('open');
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('auth-login-form').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('auth-register-form').style.display = tab === 'register' ? 'block' : 'none';
}

// ─── Static Event Bindings ────────────────────────────────────────────────────
function bindStaticEvents() {
  // Theme toggle
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const theme = toggleTheme();
    document.getElementById('theme-toggle').textContent = theme === 'dark' ? '☀️' : '🌙';
  });

  // Nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const view = link.dataset.view;
      if (view) showView(view);
    });
  });

  // Auth buttons
  document.getElementById('btn-nav-login')?.addEventListener('click', () => showAuthModal('login'));
  document.getElementById('btn-nav-register')?.addEventListener('click', () => showAuthModal('register'));
  document.getElementById('btn-hero-start')?.addEventListener('click', () => {
    isLoggedIn() ? showView('dashboard') : showAuthModal('register');
  });
  document.getElementById('btn-hero-explore')?.addEventListener('click', () => {
    document.getElementById('landing-feed-section')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Auth modal
  document.getElementById('auth-modal-close')?.addEventListener('click', hideAuthModal);
  document.getElementById('auth-modal')?.addEventListener('click', e => {
    if (e.target.id === 'auth-modal') hideAuthModal();
  });

  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
  });

  // Login form
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('btn-login-submit');
    btn.textContent = 'Signing in...';
    btn.disabled = true;
    try {
      await signInWithEmail(email, password);
      hideAuthModal();
      showToast('Welcome back! 👋', 'success');
      showView('dashboard');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.textContent = 'Sign In';
      btn.disabled = false;
    }
  });

  // Register form
  document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const btn = document.getElementById('btn-register-submit');
    btn.textContent = 'Creating account...';
    btn.disabled = true;
    try {
      await registerWithEmail(name, email, password);
      hideAuthModal();
      showToast(`Account created! Welcome, ${name.split(' ')[0]}! 🎉`, 'success');
      showView('onboarding');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.textContent = 'Create Account';
      btn.disabled = false;
    }
  });

  // Google sign-in
  document.querySelectorAll('.btn-google').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.textContent = 'Connecting...';
      btn.disabled = true;
      try {
        await signInWithGoogle();
        hideAuthModal();
        showToast('Signed in with Google! 🎉', 'success');
        showView('onboarding');
      } catch (err) {
        showToast('Google sign-in failed', 'error');
      } finally {
        btn.textContent = '🔵 Continue with Google';
        btn.disabled = false;
      }
    });
  });

  // Sign out
  document.getElementById('btn-signout')?.addEventListener('click', async () => {
    await signOut();
    showToast('Signed out successfully', 'info');
    showView('landing');
  });

  // Ask question form
  document.getElementById('ask-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user) { showAuthModal(); return; }

    const title = document.getElementById('ask-title').value.trim();
    const body = document.getElementById('ask-body').value.trim();
    const category = document.getElementById('ask-category').value;
    const tagsRaw = document.getElementById('ask-tags-hidden').value;
    const tags = tagsRaw ? JSON.parse(tagsRaw) : [];

    if (!title || title.length < 10) {
      showToast('Please enter a more descriptive title (min 10 chars)', 'warning');
      return;
    }

    const btn = document.getElementById('btn-ask-submit');
    btn.textContent = 'Posting...';
    btn.disabled = true;

    try {
      const q = addQuestion(user.id, category, title, body, tags);
      updateUserProfile({ questionsAsked: (user.questionsAsked || 0) + 1, points: (user.points || 0) + 5 });
      showToast('Question posted! +5 points 🎉', 'success');
      // Reset form
      document.getElementById('ask-form').reset();
      document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('selected'));
      // Go to question detail to get AI answer
      showView('question', { questionId: q.id });
    } catch (err) {
      showToast('Failed to post question', 'error');
    } finally {
      btn.textContent = 'Post Question';
      btn.disabled = false;
    }
  });

  // Search
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    const debouncedSearch = debounce((val) => {
      state.searchTerm = val;
      if (state.currentView === 'dashboard') renderQuestionFeed();
    }, 300);
    searchInput.addEventListener('input', e => debouncedSearch(e.target.value));
  }

  // Profile tabs
  document.querySelectorAll('.profile-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.profile-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.profileTab = btn.dataset.tab;
      renderProfileTab();
    });
  });

  // Change category in profile
  document.getElementById('btn-change-category')?.addEventListener('click', () => showView('onboarding'));

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideAuthModal();
      hideQuickAskModal();
    }
    // Slash to focus hero ask
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      const heroInput = document.getElementById('hero-ask-input');
      if (heroInput && state.currentView === 'landing') heroInput.focus();
    }
  });

  // ── Hero quick-ask box ──────────────────────────────────────────────────────
  const heroAskInput = document.getElementById('hero-ask-input');
  const heroAskBtn   = document.getElementById('btn-hero-ask');

  function triggerHeroAsk() {
    const title = heroAskInput?.value.trim();
    const category = document.getElementById('hero-ask-category')?.value || 'cse';
    if (!title) { heroAskInput?.focus(); return; }
    openQuickAskModal({ title, category });
  }

  heroAskBtn?.addEventListener('click', triggerHeroAsk);
  heroAskInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') triggerHeroAsk();
  });

  // ── Dashboard ask banner ───────────────────────────────────────────────────
  const dashQuickAskInput = document.getElementById('dashboard-quick-ask');
  const dashQuickAskBtn   = document.getElementById('btn-dashboard-quick-ask');

  function triggerDashAsk() {
    const title = dashQuickAskInput?.value.trim();
    if (!title) {
      // Open full ask view if empty
      window.askQuestion();
      return;
    }
    const user = getCurrentUser();
    const category = user?.category || 'cse';
    openQuickAskModal({ title, category });
  }

  dashQuickAskBtn?.addEventListener('click', triggerDashAsk);
  dashQuickAskInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') triggerDashAsk();
  });

  // ── Quick Ask Modal ────────────────────────────────────────────────────────
  document.getElementById('qam-close')?.addEventListener('click', hideQuickAskModal);
  document.getElementById('qam-cancel')?.addEventListener('click', hideQuickAskModal);
  document.getElementById('quick-ask-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'quick-ask-modal') hideQuickAskModal();
  });

  document.getElementById('qam-submit')?.addEventListener('click', async () => {
    const title    = document.getElementById('qam-title-input')?.value.trim();
    const body     = document.getElementById('qam-body-input')?.value.trim();
    const category = document.getElementById('qam-category')?.value || 'cse';

    if (!title || title.length < 10) {
      showToast('Please enter a more descriptive question (min 10 chars)', 'warning');
      document.getElementById('qam-title-input')?.focus();
      return;
    }

    const submitBtn = document.getElementById('qam-submit');
    submitBtn.textContent = 'Posting…';
    submitBtn.disabled = true;

    // Show AI preview panel
    const previewPanel = document.getElementById('qam-ai-preview');
    const contentEl    = document.getElementById('qam-ai-content');
    if (previewPanel) {
      previewPanel.style.display = 'block';
      contentEl.innerHTML = `
        <div class="ai-thinking" style="margin:0;">
          <div class="thinking-dots"><span></span><span></span><span></span></div>
          <span>AI is thinking…</span>
        </div>`;
    }

    try {
      // Save question (or temp save if not logged in)
      const user = getCurrentUser();
      let savedQ;
      if (user) {
        savedQ = addQuestion(user.id, category, title, body || '', []);
        updateUserProfile({ questionsAsked: (user.questionsAsked || 0) + 1, points: (user.points || 0) + 5 });
      } else {
        // Guest temp question (not persisted)
        savedQ = { id: 'temp_' + Date.now(), category, title, body: body || '', tags: [] };
      }

      // Stream AI answer in preview
      const { streamAnswer: _stream } = await import('./ai.js');
      await _stream(
        savedQ,
        category,
        (chunk) => {
          if (contentEl) {
            const { renderMarkdown: _md } = window._ui || {};
            contentEl.innerHTML = `<div style="font-size:13px; line-height:1.7; color:var(--text-secondary);">${chunk.slice(0, 500)}…</div>`;
            // Remove thinking dots
            contentEl.querySelector('.ai-thinking')?.remove();
          }
        },
        (fullAnswer) => {
          // Update in DB if saved
          if (user && savedQ.id && !savedQ.id.startsWith('temp_')) {
            updateQuestion(savedQ.id, { aiAnswer: fullAnswer, answered: true });
          }
          submitBtn.textContent = 'View Full Answer →';
          submitBtn.disabled = false;
          submitBtn.onclick = () => {
            hideQuickAskModal();
            if (user && savedQ.id && !savedQ.id.startsWith('temp_')) {
              showView('question', { questionId: savedQ.id });
            } else {
              showAuthModal('register');
            }
          };
          showToast('AI answer ready! 🎉' + (user ? ' +5 points' : ''), 'success');
        }
      );
    } catch (err) {
      showToast('Failed to get answer. Please try again.', 'error');
      submitBtn.textContent = '🚀 Post & Get AI Answer';
      submitBtn.disabled = false;
    }
  });
}

// ─── Quick Ask Modal Helpers ───────────────────────────────────────────────────
function openQuickAskModal({ title = '', category = 'cse' } = {}) {
  const modal = document.getElementById('quick-ask-modal');
  if (!modal) return;

  // Pre-fill fields
  const titleInput = document.getElementById('qam-title-input');
  const catSelect  = document.getElementById('qam-category');
  const bodyInput  = document.getElementById('qam-body-input');
  const preview    = document.getElementById('qam-ai-preview');
  const submitBtn  = document.getElementById('qam-submit');

  if (titleInput) titleInput.value = title;
  if (catSelect)  catSelect.value  = category;
  if (bodyInput)  bodyInput.value  = '';
  if (preview)    preview.style.display = 'none';
  if (submitBtn)  { submitBtn.textContent = '🚀 Post & Get AI Answer'; submitBtn.disabled = false; submitBtn.onclick = null; }

  modal.classList.add('open');
  setTimeout(() => titleInput?.focus(), 150);
}

function hideQuickAskModal() {
  document.getElementById('quick-ask-modal')?.classList.remove('open');
}

// ─── Global Helpers (for inline handlers) ─────────────────────────────────────
window.askQuestion = () => {
  if (!isLoggedIn()) {
    // Show quick-ask modal even for guests
    openQuickAskModal({ category: 'cse' });
    return;
  }
  showView('ask');
};

window.askFollowUp = (question, categoryId) => {
  openQuickAskModal({ title: question, category: categoryId });
};

window.quickAskCategory = (categoryId) => {
  openQuickAskModal({ category: categoryId });
  // Pre-focus the title input
  setTimeout(() => document.getElementById('qam-title-input')?.focus(), 160);
};

window.showView = showView;

// Store ui helpers on window for cross-module access
import('./ui.js').then(m => { window._ui = m; });

// ─── Start ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

