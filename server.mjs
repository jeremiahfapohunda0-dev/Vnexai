import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';

// Load simple KEY=value pairs without exposing secrets to the browser.
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && !Object.hasOwn(process.env, match[1])) process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
const PORT = Number(process.env.API_PORT || 8787);
const PROVIDER = (process.env.AI_PROVIDER || 'openai').toLowerCase();
const MAX_BODY = 15 * 1024 * 1024;
const SYSTEM_PROMPT = `You are Vnex AI, a thoughtful, accurate, helpful AI assistant. Be clear, warm, and direct. Use Markdown when it improves readability. If you are uncertain, say so. Never claim to have accessed files, websites, or tools that you did not actually access.`;

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(data));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''; let size = 0;
    req.on('data', chunk => { size += chunk.length; if (size > MAX_BODY) { reject(Object.assign(new Error('Request is too large. Keep attachments under 10 MB each.'), { status: 413 })); req.destroy(); return; } body += chunk; });
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { reject(Object.assign(new Error('Invalid JSON request.'), { status: 400 })); } });
    req.on('error', reject);
  });
}
function getProviderConfig(requestedModel) {
  const isAnthropic = PROVIDER === 'anthropic';
  const isNexus = PROVIDER === 'nexus';
  if (isNexus) {
    const model = process.env.NEXUS_MODEL || 'NEXUS 1 PRO';
    return { provider: 'nexus', key: process.env.NEXUS_API_KEY, model, models: [model] };
  }
  const defaultModel = isAnthropic ? (process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5') : (process.env.OPENAI_MODEL || 'gpt-4o-mini');
  const models = [...new Set([defaultModel, ...(process.env.AI_MODELS || '').split(',').map(x => x.trim()).filter(Boolean)])];
  const model = models.includes(requestedModel) ? requestedModel : defaultModel;
  return isAnthropic ? { provider: 'anthropic', key: process.env.ANTHROPIC_API_KEY, model, models } : { provider: 'openai', key: process.env.OPENAI_API_KEY, model, models, baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1' };
}
function validMessages(messages) {
  return Array.isArray(messages) && messages.length > 0 && messages.length <= 30 && messages.every(m => ['user', 'assistant'].includes(m?.role) && typeof m.content === 'string' && m.content.length <= 100000);
}
async function callNexus(config, messages, attachments, reasoning) {
  // NEXUS 1 PRO documents a single { message } request, so send the recent
  // conversation as readable text. Keep the API key on this server only.
  const conversation = messages.map(m => `${m.role === 'assistant' ? 'Vnex AI' : 'User'}: ${m.content}`).join('\\n\\n');
  const attachmentText = attachments.map(f => {
    if (f.textContent) return `\\n\\nAttached file (${f.name}):\\n${f.textContent.slice(0, 40000)}`;
    if (f.name) return `\\n\\nAttachment: ${f.name} (contents are not supported by the NEXUS text endpoint in this integration).`;
    return '';
  }).join('');
  const message = `${SYSTEM_PROMPT}${reasoning ? '\\nAnswer carefully and provide a useful conclusion.' : ''}\\n\\n${conversation}${attachmentText}`;
  const response = await fetch('https://nexus-labs.myng.net/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.key
    },
    body: JSON.stringify({ message })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.error || data.message || data.detail || `NEXUS API returned HTTP ${response.status}.`;
    const err = new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    err.status = response.status === 429 ? 429 : 502;
    throw err;
  }
  // Be tolerant of common JSON response shapes because the supplied API
  // reference describes the request format but not the exact response schema.
  const reply = typeof data === 'string' ? data :
    (data.reply ?? data.response ?? data.message ?? data.answer ?? data.output ??
     data.result?.reply ?? data.result?.response ?? data.result?.message);
  if (typeof reply !== 'string' || !reply.trim()) {
    throw new Error('NEXUS returned a response, but no text reply field was found. Check the API response format.');
  }
  return reply;
}

async function callOpenAI(config, messages, attachments, reasoning) {
  const finalMessages = messages.map((m, i) => {
    if (i !== messages.length - 1 || m.role !== 'user') return { role: m.role, content: m.content };
    const parts = [{ type: 'text', text: m.content || 'Please review the attached file(s).' }];
    for (const f of attachments) {
      if (f.textContent) parts.push({ type: 'text', text: `\n\nFile: ${f.name}\n${f.textContent.slice(0, 40000)}` });
      if (f.dataUrl && /^data:image\/(png|jpeg|webp|gif);base64,/i.test(f.dataUrl)) parts.push({ type: 'image_url', image_url: { url: f.dataUrl } });
    }
    return { role: m.role, content: parts };
  });
  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${config.key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: config.model, messages: [{ role: 'system', content: SYSTEM_PROMPT + (reasoning ? '\nThink carefully before answering, but provide only the useful conclusion and explanation.' : '') }, ...finalMessages], temperature: 0.7, stream: false }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const err = new Error(data.error?.message || `AI provider returned ${response.status}.`); err.status = response.status === 429 ? 429 : 502; throw err; }
  const reply = data.choices?.[0]?.message?.content;
  if (typeof reply !== 'string' || !reply.trim()) throw new Error('The AI provider returned an empty response.');
  return reply;
}
async function callAnthropic(config, messages, attachments, reasoning) {
  const finalMessages = messages.map((m, i) => {
    if (i !== messages.length - 1 || m.role !== 'user') return { role: m.role, content: m.content };
    const content = [{ type: 'text', text: m.content || 'Please review the attached file(s).' }];
    for (const f of attachments) {
      if (f.textContent) content.push({ type: 'text', text: `File: ${f.name}\n${f.textContent.slice(0, 40000)}` });
      const match = f.dataUrl?.match(/^data:image\/(jpeg|png|gif|webp);base64,([A-Za-z0-9+/=]+)$/i);
      if (match) content.push({ type: 'image', source: { type: 'base64', media_type: `image/${match[1].toLowerCase()}`, data: match[2] } });
    }
    return { role: m.role, content };
  });
  const response = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': config.key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: config.model, max_tokens: 4096, system: SYSTEM_PROMPT + (reasoning ? '\nReason carefully and answer with useful reasoning summaries, not private chain-of-thought.' : ''), messages: finalMessages }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const err = new Error(data.error?.message || `AI provider returned ${response.status}.`); err.status = response.status === 429 ? 429 : 502; throw err; }
  const reply = (data.content || []).filter(p => p.type === 'text').map(p => p.text).join('\n');
  if (!reply.trim()) throw new Error('The AI provider returned an empty response.');
  return reply;
}
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }); return res.end(); }
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/health' && req.method === 'GET') {
    const c = getProviderConfig(); return send(res, 200, { ok: true, provider: c.provider, model: c.model, models: c.models, configured: Boolean(c.key) });
  }
  if (url.pathname !== '/api/chat' || req.method !== 'POST') return send(res, 404, { error: 'Not found.' });
  try {
    const body = await readBody(req); if (!validMessages(body.messages)) return send(res, 400, { error: 'Send between 1 and 30 valid conversation messages.' });
    const config = getProviderConfig(typeof body.model === 'string' ? body.model : undefined);
    if (!config.key) {
      const keyName = config.provider === 'nexus' ? 'NEXUS_API_KEY' : config.provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY';
      return send(res, 503, { error: `AI is not configured. Add ${keyName} to the server .env file and restart Vnex AI.` });
    }
    const attachments = Array.isArray(body.attachments) ? body.attachments.slice(0, 5) : [];
    const reply = config.provider === 'nexus'
      ? await callNexus(config, body.messages, attachments, Boolean(body.reasoning))
      : config.provider === 'anthropic'
        ? await callAnthropic(config, body.messages, attachments, Boolean(body.reasoning))
        : await callOpenAI(config, body.messages, attachments, Boolean(body.reasoning));
    return send(res, 200, { reply, provider: config.provider, model: config.model });
  } catch (error) { if (res.headersSent || res.destroyed) return; return send(res, error.status || 500, { error: error.message || 'Unexpected server error.' }); }
});
server.listen(PORT, '127.0.0.1', () => console.log(`Vnex AI API listening on http://127.0.0.1:${PORT}`));
