import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowUp, Check, ChevronDown, ChevronLeft, ChevronRight, Code2, Copy, FileText, Globe, ImagePlus, Menu, MessageCircle, Moon, MoreHorizontal, Paperclip, Plus, Search, Settings2, Sparkles, Sun, ThumbsDown, ThumbsUp, Trash2, WandSparkles, X, CalendarClock, Puzzle, Compass, Images } from 'lucide-react';

const starterPrompts = [
  { icon: Code2, title: 'Build something', desc: 'Write code, debug an issue, or plan an app.', prompt: 'Help me plan and build a polished web app from scratch.' },
  { icon: FileText, title: 'Write anything', desc: 'Turn a rough idea into a clear first draft.', prompt: 'Help me write a clear, professional first draft for an idea I have.' },
  { icon: Globe, title: 'Explore a topic', desc: 'Understand something new, step by step.', prompt: 'Teach me an interesting topic step by step, starting with the basics.' },
  { icon: ImagePlus, title: 'Work with files', desc: 'Bring documents and ideas into the conversation.', prompt: 'Help me review a document and pull out the most important points.' },
];
const initialChats = [
  { id: 'welcome', title: 'Welcome to Vnex AI', updated: Date.now(), messages: [] },
];
function makeTitle(text) { const clean = text.trim().replace(/\s+/g, ' '); return clean.length > 38 ? clean.slice(0, 38) + '…' : clean || 'New conversation'; }
function readSaved() { try { const v = JSON.parse(localStorage.getItem('chatapp-conversations') || 'null'); return Array.isArray(v) && v.length ? v : initialChats; } catch { return initialChats; } }

export default function App() {
  const [chats, setChats] = useState(readSaved);
  const [activeId, setActiveId] = useState(() => readSaved()[0]?.id || 'welcome');
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('chatapp-theme') || 'dark');
  const [model, setModel] = useState('gpt-4o-mini');
  const [availableModels, setAvailableModels] = useState(['gpt-4o-mini']);
  const [modelOpen, setModelOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [reasoningMode, setReasoningMode] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [pinnedIds, setPinnedIds] = useState(() => { try { return JSON.parse(localStorage.getItem('chatapp-pinned') || '[]'); } catch { return []; } });
  const requestRef = useRef(null);
  const [notice, setNotice] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountMode, setAccountMode] = useState('signup');
  const [accountName, setAccountName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [currentUser, setCurrentUser] = useState(() => { try { return JSON.parse(localStorage.getItem('vnex-local-user') || 'null'); } catch { return null; } });
  const [fontScale, setFontScale] = useState(() => localStorage.getItem('vnex-font-scale') || 'normal');
  const [enterToSend, setEnterToSend] = useState(() => localStorage.getItem('vnex-enter-send') !== 'false');
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('vnex-compact') === 'true');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [providerStatus, setProviderStatus] = useState('Checking backend…');
  const inputRef = useRef(null); const fileRef = useRef(null); const endRef = useRef(null);
  const activeChat = chats.find(c => c.id === activeId) || chats[0];
  const messages = activeChat?.messages || [];
  const filteredChats = useMemo(() => chats.filter(c => c.title.toLowerCase().includes(query.toLowerCase()) || c.messages.some(m => m.content.toLowerCase().includes(query.toLowerCase()))), [chats, query]);
  useEffect(() => { localStorage.setItem('chatapp-conversations', JSON.stringify(chats)); }, [chats]);
  useEffect(() => { localStorage.setItem('chatapp-theme', theme); document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => { localStorage.setItem('chatapp-pinned', JSON.stringify(pinnedIds)); }, [pinnedIds]);
  useEffect(() => { localStorage.setItem('vnex-font-scale', fontScale); document.documentElement.dataset.fontScale = fontScale; }, [fontScale]);
  useEffect(() => { localStorage.setItem('vnex-enter-send', String(enterToSend)); }, [enterToSend]);
  useEffect(() => { localStorage.setItem('vnex-compact', String(compactMode)); document.documentElement.dataset.compact = String(compactMode); }, [compactMode]);
  useEffect(() => { fetch('/api/health').then(r => r.json()).then(d => { setProviderStatus(d.configured ? `Configured · ${d.provider}` : 'Backend ready · AI not configured'); const models = Array.isArray(d.models) && d.models.length ? d.models : ['gpt-4o-mini']; setAvailableModels(models); setModel(d.model || models[0]); }).catch(() => setProviderStatus('Backend unavailable')); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages.length, thinking]);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 2600); return () => clearTimeout(t); }, [notice]);
  function newChat() { const c = { id: crypto.randomUUID(), title: 'New conversation', updated: Date.now(), messages: [] }; setChats(old => [c, ...old]); setActiveId(c.id); setDraft(''); setAttachments([]); setSidebarOpen(window.innerWidth > 760); inputRef.current?.focus(); }
  function updateChat(id, fn) { setChats(old => old.map(c => c.id === id ? fn(c) : c)); }
  async function sendMessage(text = draft) {
    const content = text.trim(); if ((!content && !attachments.length) || thinking) return;
    if (editingMessageId && activeChat) {
      const originalIndex = activeChat.messages.findIndex(m => m.id === editingMessageId);
      if (originalIndex >= 0) {
        const revised = { ...activeChat.messages[originalIndex], content, time: Date.now() };
        const revisedHistory = [...activeChat.messages.slice(0, originalIndex), revised];
        const chatId = activeChat.id;
        updateChat(chatId, c => ({ ...c, title: originalIndex === 0 ? makeTitle(content) : c.title, updated: Date.now(), messages: revisedHistory }));
        setDraft(''); setEditingMessageId(null); setThinking(true);
        const controller = new AbortController(); requestRef.current = controller;
        try {
          const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ messages: revisedHistory.map(m => ({ role: m.role, content: m.content })).slice(-24), model, reasoning: reasoningMode, attachments: [] }) });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || `AI request failed (${response.status})`);
          updateChat(chatId, c => ({ ...c, updated: Date.now(), messages: [...c.messages, { id: crypto.randomUUID(), role: 'assistant', content: data.reply, time: Date.now() }] }));
        } catch (error) {
          if (error.name !== 'AbortError') updateChat(chatId, c => ({ ...c, messages: [...c.messages, { id: crypto.randomUUID(), role: 'assistant', content: `**I couldn’t get a response.**\\n\\n${error.message}`, error: true, time: Date.now() }] }));
        } finally { setThinking(false); requestRef.current = null; }
        return;
      }
      setEditingMessageId(null);
    }
    const oversized = attachments.find(f => f.size > 10 * 1024 * 1024);
    if (oversized) { setNotice(`${oversized.name} exceeds the 10 MB limit.`); return; }
    const userMessage = { id: crypto.randomUUID(), role: 'user', content, files: attachments.map(f => ({ name: f.name, type: f.type, url: f.url })), time: Date.now() };
    const chatId = activeId || crypto.randomUUID();
    if (!activeChat) { setChats(old => [{ id: chatId, title: makeTitle(content || attachments[0]?.name), updated: Date.now(), messages: [userMessage] }, ...old]); setActiveId(chatId); }
    else updateChat(chatId, c => ({ ...c, title: c.messages.length ? c.title : makeTitle(content || attachments[0]?.name), updated: Date.now(), messages: [...c.messages, userMessage] }));
    const submittedAttachments = attachments;
    setDraft(''); setAttachments([]); setThinking(true);
    const controller = new AbortController(); requestRef.current = controller;
    try {
      const history = [...(activeChat?.messages || []), userMessage].slice(-24).map(m => ({ role: m.role, content: m.content }));
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ messages: history, model, reasoning: reasoningMode, attachments: submittedAttachments.map(f => ({ name: f.name, type: f.type, size: f.size, textContent: f.textContent || '', dataUrl: f.dataUrl || '' })) }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `AI request failed (${response.status})`);
      const answer = { id: crypto.randomUUID(), role: 'assistant', content: data.reply, time: Date.now() };
      updateChat(chatId, c => ({ ...c, updated: Date.now(), messages: [...c.messages, answer] }));
    } catch (error) {
      if (error.name !== 'AbortError') {
        const message = error.message || 'Could not reach the AI service.';
        updateChat(chatId, c => ({ ...c, updated: Date.now(), messages: [...c.messages, { id: crypto.randomUUID(), role: 'assistant', content: `**I couldn’t get a response.**\n\n${message}\n\nCheck your server environment settings and try again. Vnex AI will not generate a fake answer when the AI service is unavailable.`, error: true, time: Date.now() }] }));
      }
    } finally { setThinking(false); requestRef.current = null; }
  }
  function stopGeneration() { requestRef.current?.abort(); setThinking(false); }
  async function attachFiles(files) {
    const list = Array.from(files || []); const accepted = list.filter(file => /^(image\/(png|jpeg|webp|gif)|text\/plain|text\/markdown|application\/pdf|application\/json)$/i.test(file.type) || /\.(txt|md|json|csv|pdf)$/i.test(file.name));
    if (accepted.length !== list.length) setNotice('Some files were skipped. Use images, PDF, TXT, MD, JSON, or CSV files.');
    if (accepted.some(f => f.size > 10 * 1024 * 1024)) setNotice('Files must be 10 MB or smaller.');
    const safeFiles = []; let totalBytes = attachments.reduce((sum, file) => sum + file.size, 0);
    for (const file of accepted) {
      if (attachments.length + safeFiles.length >= 5) break;
      if (file.size > 10 * 1024 * 1024 || totalBytes + file.size > 8 * 1024 * 1024) { setNotice('Keep each file under 10 MB and total attachments under 8 MB per message.'); continue; }
      safeFiles.push(file); totalBytes += file.size;
    }
    const incoming = await Promise.all(safeFiles.map(async file => {
      const item = { name: file.name, type: file.type || 'application/octet-stream', size: file.size, url: URL.createObjectURL(file), textContent: '', dataUrl: '' };
      if (/\.(txt|md|json|csv)$/i.test(file.name) || /^text\//i.test(file.type)) item.textContent = (await file.text()).slice(0, 40000);
      else if (/^image\/(png|jpeg|webp|gif)$/i.test(file.type)) item.dataUrl = await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || '')); reader.onerror = () => resolve(''); reader.readAsDataURL(file); });
      else if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') setNotice('PDF attached. PDF text extraction is not enabled yet; use TXT or Markdown for readable document content.');
      return item;
    }));
    setAttachments(old => [...old, ...incoming].slice(0, 5));
  }
  async function regenerateResponse(chatId, messageIndex) {
    const chat = chats.find(c => c.id === chatId); if (!chat || thinking) return;
    const prior = chat.messages.slice(0, messageIndex); const lastUser = [...prior].reverse().find(m => m.role === 'user'); if (!lastUser) return;
    updateChat(chatId, c => ({ ...c, messages: prior })); setThinking(true);
    const controller = new AbortController(); requestRef.current = controller;
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ messages: prior.map(m => ({ role: m.role, content: m.content })).slice(-24), model, reasoning: reasoningMode, attachments: [] }) });
      const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || `AI request failed (${response.status})`);
      updateChat(chatId, c => ({ ...c, updated: Date.now(), messages: [...c.messages, { id: crypto.randomUUID(), role: 'assistant', content: data.reply, time: Date.now() }] }));
    } catch (error) { if (error.name !== 'AbortError') updateChat(chatId, c => ({ ...c, messages: [...c.messages, { id: crypto.randomUUID(), role: 'assistant', content: `**Could not regenerate the response.**\n\n${error.message}`, error: true, time: Date.now() }] })); }
    finally { setThinking(false); requestRef.current = null; }
  }
  function renameChat(id) { const title = renameDraft.trim(); if (title) updateChat(id, c => ({ ...c, title })); setRenamingId(null); }
  function exportChat(chat) { const blob = new Blob([`# ${chat.title}\n\n` + chat.messages.map(m => `## ${m.role === 'user' ? 'You' : 'Vnex AI'}\n\n${m.content}`).join('\n\n---\n\n')], { type: 'text/markdown' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${chat.title.replace(/[^a-z0-9-_ ]/gi, '').slice(0,50) || 'chat'}.md`; a.click(); URL.revokeObjectURL(url); }
  function removeChat(id, event) { event?.stopPropagation(); if (!window.confirm('Delete this conversation? This cannot be undone.')) return; setChats(old => { const next = old.filter(c => c.id !== id); if (!next.length) next.push({ id: crypto.randomUUID(), title: 'New conversation', updated: Date.now(), messages: [] }); if (id === activeId) setActiveId(next[0].id); return next; }); }
  function copyText(text) { if (!navigator.clipboard?.writeText) { setNotice('Clipboard access is unavailable in this browser.'); return; } navigator.clipboard.writeText(text).then(() => setNotice('Copied to clipboard')).catch(() => setNotice('Unable to copy automatically')); }
  return <div className={`app-shell ${theme}`}>
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="brand-row"><div className="brand-mark"><img src="/vnex-logo.png" alt="Vnex AI" /></div><span className="brand-name">Vnex <span>AI</span></span><button className="icon-btn sidebar-collapse" aria-label="Collapse sidebar" onClick={() => setSidebarOpen(false)}><ChevronLeft size={17}/></button></div>
      <button className="new-chat-btn" onClick={newChat}><Plus size={17}/><span>New chat</span><span className="shortcut">⌘ K</span></button>
      <div className="sidebar-tools"><button className={`nav-action ${searchOpen ? 'selected' : ''}`} onClick={() => { setSearchOpen(v => !v); setTimeout(() => document.getElementById('chat-search')?.focus(), 20); }}><Search size={17}/><span>Search chats</span></button>{searchOpen && <input id="chat-search" className="search-input" placeholder="Search conversations…" value={query} onChange={e => setQuery(e.target.value)}/>}<button className="nav-action" onClick={() => fileRef.current?.click()}><Images size={17}/><span>Images</span></button><button className="nav-action" onClick={() => setNotice('Scheduled tasks require a scheduler service and are not enabled in this local build.')}><CalendarClock size={17}/><span>Scheduled tasks</span></button><button className="nav-action" onClick={() => { if (activeChat) exportChat(activeChat); else setNotice('Open a conversation first to export it.'); }}><FileText size={17}/><span>Library / export</span></button><button className="nav-action" onClick={() => setSettingsOpen(true)}><Puzzle size={17}/><span>Integrations</span></button><button className="nav-action" onClick={() => { const c = { id: crypto.randomUUID(), title: 'Explore with Vnex AI', updated: Date.now(), messages: [] }; setChats(old => [c, ...old]); setActiveId(c.id); setDraft('Teach me something interesting that I might not know.'); setSidebarOpen(window.innerWidth > 760); setNotice('Explore mode ready — send your first question.'); }}><Compass size={17}/><span>Explore</span></button></div>
      <div className="history-label">YOUR CHATS <span>{filteredChats.length}</span></div>
      <div className="chat-history">{[...filteredChats].sort((a,b) => Number(pinnedIds.includes(b.id))-Number(pinnedIds.includes(a.id)) || b.updated-a.updated).map(chat => <div key={chat.id} className={`history-item-wrap ${chat.id === activeId ? 'active' : ''}`}><button className={`history-item ${chat.id === activeId ? 'active' : ''}`} onClick={() => { setActiveId(chat.id); setSidebarOpen(window.innerWidth > 760); }}><MessageCircle size={15}/><span className="history-title">{chat.title}</span></button><button className="history-delete" onClick={() => { setRenameDraft(chat.title); setRenamingId(chat.id); }} title="Rename conversation"><Settings2 size={13}/></button><button className="history-delete" onClick={() => setPinnedIds(old => old.includes(chat.id) ? old.filter(id => id !== chat.id) : [...old, chat.id])} title={pinnedIds.includes(chat.id) ? 'Unpin chat' : 'Pin chat'}><span>{pinnedIds.includes(chat.id) ? '◆' : '◇'}</span></button><button className="history-delete" onClick={e => removeChat(chat.id,e)} aria-label="Delete chat"><Trash2 size={13}/></button></div>)}{!filteredChats.length && <div className="empty-search">No chats found</div>}</div>
      <div className="sidebar-bottom"><div className="upgrade-card"><div className="upgrade-icon"><WandSparkles size={16}/></div><div><strong>Make it yours</strong><p>Connect an AI provider for live answers.</p></div><button onClick={() => setSettingsOpen(true)} aria-label="Configure AI"><ChevronRight size={16}/></button></div><button className="profile-row" onClick={() => setAccountOpen(true)}><div className="avatar">{(currentUser?.name || "Guest").slice(0,1).toUpperCase()}</div><div className="profile-text"><strong>{currentUser?.name || "Guest"}</strong><span>{currentUser ? "Personal workspace · Account" : "Not signed in"}</span></div><MoreHorizontal size={18}/></button></div>
    </aside>
    <main className="main-panel">
      <header className="topbar"> <div className="top-left">{!sidebarOpen && <button className="icon-btn" aria-label="Open sidebar" onClick={() => setSidebarOpen(true)}><Menu size={19}/></button>}<button className="model-picker" onClick={() => setModelOpen(v => !v)}><span className="model-gem"><Sparkles size={14}/></span>{model}<ChevronDown size={15}/></button>{modelOpen && <div className="model-menu">{availableModels.map(m=><button key={m} onClick={() => {setModel(m);setModelOpen(false);setNotice(`${m} selected.`);}}><span className="model-menu-icon"><Sparkles size={15}/></span><span><strong>{m}</strong><small>Allowed by your server configuration</small></span>{model===m && <Check size={15}/>}</button>)}</div>}</div><div className="top-right">{!currentUser && <button className="login-label" onClick={() => { setAccountMode('login'); setAccountOpen(true); }}>Log in</button>}<span className={`demo-pill ${providerStatus.startsWith('Configured') ? 'connected' : ''}`} title={providerStatus}><span/> {providerStatus}</span><button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">{theme === 'dark' ? <Sun size={17}/> : <Moon size={17}/>}</button><button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="Settings"><Settings2 size={17}/></button></div></header>
      <section className={`conversation ${messages.length ? 'has-messages' : ''}`}>
        {!messages.length ? <div className="welcome-screen"><div className="welcome-orb"><div className="orb-inner"><Sparkles size={28}/></div><span className="orb-dot dot-a"/><span className="orb-dot dot-b"/><span className="orb-dot dot-c"/></div><p className="eyebrow">YOUR THINKING PARTNER</p><h1>What's on your mind<br/><em>today?</em></h1><p className="welcome-subtitle">A little clarity can take you a long way.<br className="desktop-break"/> Start with a question, an idea, or a problem to solve.</p><div className="prompt-grid">{starterPrompts.map(({icon:Icon,title,desc,prompt})=><button className="prompt-card" key={title} onClick={() => {setDraft(prompt);inputRef.current?.focus();}}><span className="prompt-icon"><Icon size={17}/></span><span className="prompt-copy"><strong>{title}</strong><small>{desc}</small></span><ArrowUp size={15} className="prompt-arrow"/></button>)}</div></div> : <div className="message-thread">{messages.map((msg,i)=><article className={`message ${msg.role}`} key={msg.id}><div className="message-avatar">{msg.role === 'assistant' ? null : <div className="user-mini">{(currentUser?.name || 'Y').slice(0,1).toUpperCase()}</div>}</div><div className="message-content"><div className="message-author">{msg.role === 'assistant' ? 'Vnex AI' : (currentUser?.name || 'You')}{msg.role === 'assistant' && <span className="message-model">{model}</span>}</div>{msg.files?.length > 0 && <div className="attached-files">{msg.files.map(f=><div className="attached-file" key={f.name}><FileText size={16}/><span>{f.name}</span></div>)}</div>}<div className="message-text">{msg.content.split('\n').map((line,idx)=><React.Fragment key={idx}>{line.startsWith('### ') ? <h3>{line.slice(4)}</h3> : line.startsWith('## ') ? <h2>{line.slice(3)}</h2> : line.startsWith('- ') ? <div className="md-list">• {line.slice(2)}</div> : line.match(/^\d+\. /) ? <div className="md-list">{line}</div> : line.startsWith('**') && line.endsWith('**') ? <p><strong>{line.slice(2,-2)}</strong></p> : line === '---' ? <hr/> : line ? <p>{line.split(/(\*[^*]+\*)/g).map((part,j)=>part.startsWith('*')&&part.endsWith('*')?<em key={j}>{part.slice(1,-1)}</em>:part)}</p> : <div className="line-spacer"/>}</React.Fragment>)}</div>{msg.role === 'user' && <div className="message-actions user-message-actions"><button title="Edit message" aria-label="Edit message" onClick={() => { setDraft(msg.content); setEditingMessageId(msg.id); inputRef.current?.focus(); setNotice('Editing this message. Send to replace it and regenerate the reply.'); }}><WandSparkles size={14}/></button><button title="Copy message" aria-label="Copy message" onClick={() => copyText(msg.content)}><Copy size={14}/></button><button title="Share message" aria-label="Share message" onClick={async () => { try { if (navigator.share) await navigator.share({ title: 'Vnex AI message', text: msg.content }); else { await navigator.clipboard.writeText(msg.content); setNotice('Sharing is unavailable here; message copied instead.'); } } catch {} }}><Globe size={14}/></button></div>}{msg.role === 'assistant' && <div className="message-actions"><button title="Copy response" onClick={() => copyText(msg.content)}><Copy size={14}/></button><button title="Helpful" onClick={() => setNotice('Thanks for your feedback')}><ThumbsUp size={14}/></button><button title="Not helpful" onClick={() => setNotice('Feedback noted')}><ThumbsDown size={14}/></button><button title="Regenerate response" onClick={() => regenerateResponse(activeId, i)}><Activity size={14}/></button></div>}</div></article>)}{thinking && <article className="message assistant"><div className="message-avatar"><div className="mini-mark"><Sparkles size={14}/></div></div><div className="thinking-indicator"><span/><span/><span/> <small>Thinking through this…</small></div></article>}<div ref={endRef}/></div>}
      </section>
      <footer className="composer-area"><div className="composer-box"><textarea ref={inputRef} value={draft} onChange={e => {setDraft(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,160)+'px';}} onKeyDown={e => {if(e.key==='Enter'&&!e.shiftKey&&enterToSend){e.preventDefault();sendMessage();}}} placeholder="Ask anything, or share what you're thinking…" rows={1}/>{attachments.length>0 && <div className="attachment-strip">{attachments.map((f,i)=><div className="attachment-chip" key={i}><FileText size={13}/><span>{f.name}</span><button onClick={() => setAttachments(a=>a.filter((_,j)=>j!==i))}><X size={12}/></button></div>)}</div>}<div className="composer-bottom"><div className="composer-tools"><button className="tool-btn" onClick={() => fileRef.current?.click()}><Paperclip size={16}/><span>Attach</span></button><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,.pdf,.txt,.md,.json,.csv" multiple hidden onChange={e => { attachFiles(e.target.files); e.target.value = ''; }}/><button className={`tool-btn ${reasoningMode ? 'selected' : ''}`} onClick={() => setReasoningMode(v => !v)} title="Ask the configured model to spend more effort on reasoning"><Activity size={15}/><span>Think</span></button></div><div className="send-group"><span className="enter-hint">↵ to send</span>{thinking ? <button className="send-btn stop-btn" onClick={stopGeneration} aria-label="Stop generating"><span className="stop-square"/></button> : <button className="send-btn" disabled={(!draft.trim()&&!attachments.length)} onClick={() => sendMessage()} aria-label="Send message"><ArrowUp size={18}/></button>}</div></div></div><div className="composer-disclaimer">Vnex AI can make mistakes. Check important information. <button onClick={() => exportChat(activeChat)}>Export chat</button> · <button onClick={() => setSettingsOpen(true)}>AI connection</button>.</div></footer>
    </main>
    {renamingId && <div className="modal-backdrop" onClick={() => setRenamingId(null)}><section className="settings-modal" onClick={e => e.stopPropagation()}><div className="modal-heading"><h2>Rename conversation</h2><button className="icon-btn" onClick={() => setRenamingId(null)}><X size={18}/></button></div><label className="field-label">Conversation title</label><input className="settings-select" value={renameDraft} autoFocus onChange={e => setRenameDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && renameChat(renamingId)} /><button className="primary-wide" style={{marginTop:12}} onClick={() => renameChat(renamingId)}>Save title</button></section></div>}
    {settingsOpen && <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}><section className="settings-modal" onClick={e => e.stopPropagation()}><div className="modal-heading"><div><span className="eyebrow">WORKSPACE</span><h2>Settings</h2></div><button className="icon-btn" onClick={() => setSettingsOpen(false)}><X size={18}/></button></div><div className="settings-section"><h3>AI connection</h3><p>API credentials stay on your server in environment variables. This browser never asks for or stores secret keys.</p><div className="security-note"><Check size={15}/>{providerStatus}</div><p style={{marginTop:12}}>Provider and model access are controlled by <code>AI_PROVIDER</code> and model settings in your server’s <code>.env</code> file. Restart the server after changing them.</p><button className="primary-wide" onClick={async () => { try { const r = await fetch('/api/health'); const d = await r.json(); setProviderStatus(d.configured ? `Configured · ${d.provider}` : 'Backend ready · AI not configured'); if (Array.isArray(d.models) && d.models.length) { setAvailableModels(d.models); setModel(current => d.models.includes(current) ? current : d.model || d.models[0]); } setNotice(d.configured ? 'Provider credentials are configured; a real request verifies access.' : 'Add provider credentials to .env on the server.'); } catch { setProviderStatus('Backend unavailable'); setNotice('Start the Vnex AI backend and try again.'); } }}>Check connection</button></div><div className="settings-section settings-last"><h3>Appearance</h3><div className="theme-choices"><button className={theme==='dark'?'chosen':''} onClick={()=>setTheme('dark')}><Moon size={16}/> Dark {theme==='dark'&&<Check size={14}/>}</button><button className={theme==='light'?'chosen':''} onClick={()=>setTheme('light')}><Sun size={16}/> Light {theme==='light'&&<Check size={14}/>}</button></div></div><div className="settings-section"><h3>Chat preferences</h3><label className="setting-toggle"><span><strong>Enter to send</strong><small>Press Enter to send; Shift + Enter adds a new line.</small></span><input type="checkbox" checked={enterToSend} onChange={e => setEnterToSend(e.target.checked)}/></label><label className="setting-toggle"><span><strong>Compact messages</strong><small>Reduce spacing between messages.</small></span><input type="checkbox" checked={compactMode} onChange={e => setCompactMode(e.target.checked)}/></label><label className="field-label" style={{marginTop:14}}>Message text size</label><select className="settings-select" value={fontScale} onChange={e => setFontScale(e.target.value)}><option value="small">Small</option><option value="normal">Default</option><option value="large">Large</option></select><button className="primary-wide" style={{marginTop:12}} onClick={() => { setTheme('dark'); setFontScale('normal'); setEnterToSend(true); setCompactMode(false); setNotice('Preferences reset to defaults.'); }}>Reset preferences</button></div></section></div>}
    {accountOpen && <div className="modal-backdrop" onClick={() => setAccountOpen(false)}><section className="settings-modal account-modal" onClick={e => e.stopPropagation()}><div className="modal-heading"><div><span className="eyebrow">YOUR WORKSPACE</span><h2>{accountMode === 'signup' ? 'Create your Vnex AI account' : 'Welcome back'}</h2></div><button className="icon-btn" onClick={() => setAccountOpen(false)} aria-label="Close account dialog"><X size={18}/></button></div><p className="account-subtitle">{accountMode === 'signup' ? 'Create an account to personalize your Vnex AI experience.' : 'Sign in to your Vnex AI workspace.'}</p><form onSubmit={e => { e.preventDefault(); const profile = { name: (accountMode === 'signup' ? accountName.trim() : (currentUser?.name || accountEmail.split('@')[0])) || 'Vnex user', email: accountEmail.trim() }; setCurrentUser(profile); localStorage.setItem('vnex-local-user', JSON.stringify(profile)); setAccountOpen(false); setAccountPassword(''); setNotice('Signed in on this browser. This local demo profile is not secure cloud authentication.'); }}><div className="account-fields">{accountMode === 'signup' && <input className="settings-select" autoComplete="name" placeholder="Full name" value={accountName} onChange={e => setAccountName(e.target.value)} required/>}<input className="settings-select" type="email" autoComplete="email" placeholder="Email address" value={accountEmail} onChange={e => setAccountEmail(e.target.value)} required/><input className="settings-select" type="password" autoComplete={accountMode === 'signup' ? 'new-password' : 'current-password'} placeholder="Password" value={accountPassword} onChange={e => setAccountPassword(e.target.value)} minLength={8} required/></div><button className="account-primary" type="submit">{accountMode === 'signup' ? 'Sign Up' : 'Log In'}</button></form><div className="account-divider"><span>or</span></div><button className="account-google" onClick={() => setNotice('Google sign-in needs Google OAuth credentials and a server callback to enable real accounts.')}><span className="google-g">G</span>Continue with Google</button><p className="account-switch">{accountMode === 'signup' ? 'Already have an account?' : 'New to Vnex AI?'} <button onClick={() => setAccountMode(v => v === 'signup' ? 'login' : 'signup')}>{accountMode === 'signup' ? 'Log In' : 'Sign Up'}</button></p>{currentUser && <button className="account-signout" onClick={() => { setCurrentUser(null); localStorage.removeItem('vnex-local-user'); setAccountOpen(false); setNotice('Signed out on this browser.'); }}>Sign out</button>}<p className="account-note">Local demo profile only. Real accounts and Google sign-in require a secure authentication provider.</p></section></div>}
    {notice && <div className="toast-note"><Check size={15}/>{notice}</div>}
  </div>;
}
