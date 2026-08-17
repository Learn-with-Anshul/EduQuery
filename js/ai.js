// ─── AI Response Engine (Demo Mode) ───────────────────────────────────────────
// Generates realistic, formatted AI responses based on category.
// Replace with real Gemini API calls when API key is available.

import { AI_RESPONSES, APP_CONFIG } from './config.js';

// ─── Call server-side LLM proxy (if available) ─────────────────────────────────
async function callLlmProxy(prompt, model) {
  try {
    const url = '/api/llm-proxy';
    const token = localStorage.getItem('eduquery_proxy_token') || '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt, model }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Proxy error ${resp.status}: ${text}`);
    }

    const data = await resp.json();
    // Expect { model, reply }
    return data.reply || null;
  } catch (err) {
    console.warn('LLM proxy call failed:', err.message || err);
    return null;
  }
}

// ─── Generate AI Answer (tries server proxy first, then falls back to local templates)
export async function generateAnswer(question, categoryId) {
  // Try server-side proxy
  const prompt = `${question.title}\n\n${question.body || ''}`.trim();
  const proxyReply = await callLlmProxy(prompt, categoryId);
  if (proxyReply) return proxyReply;

  // Fallback: simulated local template (demo mode)
  await delay(500 + Math.random() * 800);
  const templates = AI_RESPONSES[categoryId] || AI_RESPONSES['science'];
  const template = templates[Math.floor(Math.random() * templates.length)];
  const rawAnswer = template(question.title + ' ' + question.body);
  return rawAnswer;
}

// ─── Stream Answer (Typing Effect). Uses server response if available, else local template
export async function streamAnswer(question, categoryId, onChunk, onComplete) {
  // Try proxy first
  const prompt = `${question.title}\n\n${question.body || ''}`.trim();
  const proxyReply = await callLlmProxy(prompt, categoryId);
  const fullAnswer = proxyReply || await generateAnswer(question, categoryId);

  const chars = fullAnswer.split('');
  let accumulated = '';

  // Stream character by character with variable speed for realism
  for (let i = 0; i < chars.length; i++) {
    accumulated += chars[i];

    // Emit at reasonable chunk sizes
    const chunkSize = chars[i] === '\n' ? 1 : 3;
    if (i % chunkSize === 0 || i === chars.length - 1) {
      onChunk(accumulated);
      const isPunctuation = ['.', '!', '?', '\n'].includes(chars[i]);
      const speed = isPunctuation ? APP_CONFIG.aiTypingSpeed * 8 : APP_CONFIG.aiTypingSpeed;
      await delay(speed);
    }
  }

  onComplete(fullAnswer);
}

// ─── Generate Follow-up Suggestions ───────────────────────────────────────────
export function generateFollowUpSuggestions(categoryId) {
  const suggestions = {
    cse: [
      'How does Big O notation work?',
      'Explain memory management in C++',
      'What is the difference between TCP and UDP?',
      'How does garbage collection work in Java?',
    ],
    jee: [
      'Explain Newton\'s laws with examples',
      'How to solve integration problems quickly?',
      'What is Faraday\'s law of electromagnetic induction?',
      'Explain Le Chatelier\'s principle',
    ],
    neet: [
      'How does the immune system work?',
      'Explain the stages of mitosis',
      'What are the parts of a neuron?',
      'How does photosynthesis occur in plants?',
    ],
    ds: [
      'What is the difference between supervised and unsupervised learning?',
      'How does backpropagation work?',
      'Explain the bias-variance tradeoff',
      'What is gradient descent?',
    ],
    math: [
      'How to find eigenvalues of a matrix?',
      'Explain integration by parts',
      'What is Bayes\' theorem?',
      'How to solve differential equations?',
    ],
    science: [
      'How does nuclear fission work?',
      'What causes lightning?',
      'How does the greenhouse effect work?',
      'Explain the Doppler effect',
    ],
    history: [
      'What caused World War I?',
      'Explain the Indian independence movement',
      'What was the significance of the Renaissance?',
      'How did the Industrial Revolution change society?',
    ],
    english: [
      'Explain the structure of a sonnet',
      'What is stream of consciousness in literature?',
      'How to write a strong thesis statement?',
      'What are the differences between simile and metaphor?',
    ],
  };

  const list = suggestions[categoryId] || suggestions['science'];
  // Return 3 random suggestions
  return list.sort(() => Math.random() - 0.5).slice(0, 3);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
