// ─── UI Helpers & Animations ───────────────────────────────────────────────────

// ─── Toast Notifications ───────────────────────────────────────────────────────
let toastQueue = [];
let toastActive = false;

export function showToast(message, type = 'info', duration = 3500) {
  toastQueue.push({ message, type, duration });
  if (!toastActive) processToastQueue();
}

function processToastQueue() {
  if (toastQueue.length === 0) { toastActive = false; return; }
  toastActive = true;
  const { message, type, duration } = toastQueue.shift();

  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-msg">${message}</span>`;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-show'));

  setTimeout(() => {
    toast.classList.remove('toast-show');
    toast.addEventListener('transitionend', () => {
      toast.remove();
      setTimeout(processToastQueue, 200);
    }, { once: true });
  }, duration);
}

// ─── Loading Spinner ───────────────────────────────────────────────────────────
export function showLoader(elementId, text = 'Loading...') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = `
    <div class="loader-wrapper">
      <div class="spinner"></div>
      <p class="loader-text">${text}</p>
    </div>`;
}

// ─── Render Markdown (Simple) ──────────────────────────────────────────────────
export function renderMarkdown(text) {
  let html = text
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="code-block"><code class="lang-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`)
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Tables
    .replace(/\|(.+)\|\n\|[-| ]+\|\n([\s\S]+?)(?=\n\n|$)/g, renderTable)
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>')
    // Unordered lists
    .replace(/^[*-] (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="md-p">')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="md-hr">');

  // Wrap li items
  html = html.replace(/(<li>.*<\/li>\n?)+/g, match => `<ul class="md-list">${match}</ul>`);

  return `<p class="md-p">${html}</p>`;
}

function renderTable(match, headers, rows) {
  const headerCells = headers.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
  const rowLines = rows.trim().split('\n');
  const rowsHtml = rowLines.map(row => {
    const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  return `<div class="table-wrapper"><table class="md-table"><thead><tr>${headerCells}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Format Time ───────────────────────────────────────────────────────────────
export function timeAgo(isoString) {
  const now = new Date();
  const past = new Date(isoString);
  const diff = Math.floor((now - past) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return past.toLocaleDateString();
}

// ─── Avatar Generator ──────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#3b82f6',
  '#10b981', '#f59e0b', '#ef4444', '#14b8a6',
];

export function getAvatarColor(initials) {
  const index = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function createAvatarEl(initials, size = 36) {
  const color = getAvatarColor(initials);
  const div = document.createElement('div');
  div.className = 'avatar';
  div.style.cssText = `
    width: ${size}px; height: ${size}px;
    background: ${color};
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: ${size * 0.38}px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
    letter-spacing: 0.5px;
  `;
  div.textContent = initials;
  return div;
}

// ─── Animate Counter ───────────────────────────────────────────────────────────
export function animateCounter(el, from, to, duration = 800) {
  const start = performance.now();
  const update = (time) => {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
    el.textContent = Math.round(from + (to - from) * eased);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

// ─── Intersection Observer for Fade-in ────────────────────────────────────────
export function observeFadeIn(selector = '.fade-in-on-scroll') {
  const observer = new IntersectionObserver(
    (entries) => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    }),
    { threshold: 0.1 }
  );
  document.querySelectorAll(selector).forEach(el => observer.observe(el));
}

// ─── Particle Background ───────────────────────────────────────────────────────
export function initParticles(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: 50 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 0.5,
    dx: (Math.random() - 0.5) * 0.4,
    dy: (Math.random() - 0.5) * 0.4,
    alpha: Math.random() * 0.5 + 0.1,
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(99, 102, 241, ${p.alpha})`;
      ctx.fill();
      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    });
    requestAnimationFrame(draw);
  }

  draw();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// ─── Dark Mode ─────────────────────────────────────────────────────────────────
export function initTheme() {
  const saved = localStorage.getItem('eduquery_theme') || 'dark';
  setTheme(saved);
}

export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('eduquery_theme', theme);
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

// ─── Truncate text ─────────────────────────────────────────────────────────────
export function truncate(text, maxLen = 120) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trim() + '…';
}

// ─── Debounce ─────────────────────────────────────────────────────────────────
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
