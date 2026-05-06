// ============================================================
//  MoodSync – Full Chat UI (React)
//  Team: Synclub | JECRC University
//  Connected to backend API — no keys needed here!
// ============================================================

import { useState, useRef, useEffect } from "react";

// ─── Backend URL ─────────────────────────────────────────────
// Change to your Render URL when deployed e.g. https://moodsync-api.onrender.com
const API_BASE = "https://moodsync-backend-qj8s.onrender.com";
// ─── Device ID (stored in localStorage for session tracking) ─
function getDeviceId() {
  let id = localStorage.getItem("moodsync_device_id");
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem("moodsync_device_id", id);
  }
  return id;
}
const DEVICE_ID = getDeviceId();

// ─── API helper ──────────────────────────────────────────────
async function apiCall(endpoint, body) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      "x-device-id":  DEVICE_ID,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function apiGet(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "x-device-id": DEVICE_ID },
  });
  return res.json();
}

// ─── EMOTION → LABEL MAPPING ────────────────────────────────
const EMOTION_MAP = {
  joy:      { label: "Joyful 😄" },
  sadness:  { label: "Sad 🌧️"   },
  anger:    { label: "Angry 🔥"  },
  fear:     { label: "Anxious 😰"},
  surprise: { label: "Surprised 🤯" },
  disgust:  { label: "Uneasy 😤" },
  neutral:  { label: "Neutral 😐"},
};

const EMOJI_OPTIONS = ["😄","😢","😡","😰","😮","😤","😐","😌","🥰","😴","🤩","😔"];

const EMOTION_WORDS = [
  "Melancholic","Energetic","Nostalgic","Anxious","Euphoric",
  "Serene","Restless","Hopeful","Lonely","Excited","Calm","Frustrated",
];

const MOOD_QUESTIONS = [
  "How has your day been so far? Did anything stand out?",
  "When you think about how you're feeling right now, what's the first word that comes to mind?",
  "Is there something on your mind that you'd like to escape from, or something you want to celebrate?",
];

// ─── STYLES ─────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #0d0f14;
    --surface:   #13161e;
    --surface2:  #1a1e2a;
    --surface3:  #222638;
    --border:    rgba(255,255,255,0.07);
    --accent:    #7c6cfc;
    --accent2:   #fc6cb4;
    --accent3:   #6cfcca;
    --text:      #eef0f7;
    --muted:     #8890aa;
    --bot-msg:   #1a1e2a;
    --user-msg:  linear-gradient(135deg, #7c6cfc, #fc6cb4);
    --radius:    18px;
    --radius-sm: 10px;
    --shadow:    0 8px 32px rgba(0,0,0,0.45);
  }

  body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); }

  /* ── App shell ── */
  .ms-app {
    display: flex; flex-direction: column; height: 100vh;
    background: var(--bg);
    background-image:
      radial-gradient(ellipse 60% 50% at 20% 10%, rgba(124,108,252,0.12) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 80% 90%, rgba(252,108,180,0.10) 0%, transparent 60%);
  }

  /* ── Header ── */
  .ms-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 24px; border-bottom: 1px solid var(--border);
    background: rgba(13,15,20,0.85); backdrop-filter: blur(12px);
    position: sticky; top: 0; z-index: 50;
  }
  .ms-logo { display: flex; align-items: center; gap: 10px; }
  .ms-logo-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    display: flex; align-items: center; justify-content: center; font-size: 18px;
  }
  .ms-logo-name { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.25rem; letter-spacing: -0.5px; }
  .ms-logo-name span { color: var(--accent); }
  .ms-tagline { font-size: 0.72rem; color: var(--muted); margin-top: 1px; }
  .ms-header-right { display: flex; align-items: center; gap: 10px; }
  .ms-badge {
    font-size: 0.7rem; padding: 3px 10px; border-radius: 20px;
    background: rgba(124,108,252,0.15); border: 1px solid rgba(124,108,252,0.3);
    color: var(--accent); font-family: 'Syne', sans-serif; font-weight: 600;
  }
  .ms-reset-btn {
    background: none; border: 1px solid var(--border); color: var(--muted);
    padding: 5px 14px; border-radius: 20px; font-size: 0.75rem; cursor: pointer;
    transition: all 0.2s;
  }
  .ms-reset-btn:hover { border-color: var(--accent); color: var(--accent); }

  /* ── Chat area ── */
  .ms-chat-area {
    flex: 1; overflow-y: auto; padding: 24px 0;
    scroll-behavior: smooth;
  }
  .ms-chat-area::-webkit-scrollbar { width: 4px; }
  .ms-chat-area::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 4px; }

  .ms-messages { max-width: 760px; margin: 0 auto; padding: 0 16px; display: flex; flex-direction: column; gap: 18px; }

  /* ── Message bubbles ── */
  .ms-msg { display: flex; gap: 10px; align-items: flex-end; animation: msgIn 0.35s cubic-bezier(0.22,1,0.36,1); }
  .ms-msg.user { flex-direction: row-reverse; }

  @keyframes msgIn {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .ms-avatar {
    width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 15px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
  }
  .ms-avatar.user-av { background: var(--surface3); }

  .ms-bubble {
    max-width: 72%; padding: 13px 17px; border-radius: var(--radius);
    font-size: 0.92rem; line-height: 1.6; position: relative;
  }
  .ms-msg.bot .ms-bubble {
    background: var(--bot-msg); border: 1px solid var(--border);
    border-bottom-left-radius: 4px; color: var(--text);
  }
  .ms-msg.user .ms-bubble {
    background: var(--user-msg); color: #fff;
    border-bottom-right-radius: 4px;
  }
  .ms-time { font-size: 0.65rem; color: var(--muted); margin-top: 4px; text-align: right; }

  /* ── Typing indicator ── */
  .ms-typing { display: flex; gap: 5px; align-items: center; padding: 14px 17px; }
  .ms-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--accent); opacity: 0.5;
    animation: bounce 1.2s infinite;
  }
  .ms-dot:nth-child(2) { animation-delay: 0.2s; }
  .ms-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); opacity: 1; } }

  /* ── Quick-pick cards (Movie / Song) ── */
  .ms-pick-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 10px; }
  .ms-pick-card {
    flex: 1; min-width: 130px; padding: 14px 18px;
    border-radius: var(--radius-sm); border: 1px solid var(--border);
    background: var(--surface2); cursor: pointer; transition: all 0.22s;
    text-align: center;
  }
  .ms-pick-card:hover, .ms-pick-card.selected {
    border-color: var(--accent); background: rgba(124,108,252,0.12);
    transform: translateY(-2px); box-shadow: 0 4px 20px rgba(124,108,252,0.2);
  }
  .ms-pick-icon { font-size: 2rem; margin-bottom: 6px; }
  .ms-pick-label { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.9rem; }
  .ms-pick-sub { font-size: 0.74rem; color: var(--muted); margin-top: 3px; }

  /* ── Emoji selector ── */
  .ms-emoji-section { margin-top: 12px; }
  .ms-section-label {
    font-size: 0.72rem; color: var(--muted); text-transform: uppercase;
    letter-spacing: 1px; margin-bottom: 8px; font-family: 'Syne', sans-serif;
  }
  .ms-emoji-grid { display: flex; flex-wrap: wrap; gap: 8px; }
  .ms-emoji-btn {
    width: 42px; height: 42px; border-radius: var(--radius-sm);
    background: var(--surface2); border: 1px solid var(--border);
    font-size: 1.35rem; cursor: pointer; transition: all 0.18s;
    display: flex; align-items: center; justify-content: center;
  }
  .ms-emoji-btn:hover, .ms-emoji-btn.selected {
    border-color: var(--accent2); background: rgba(252,108,180,0.12);
    transform: scale(1.1);
  }

  /* ── Word chips ── */
  .ms-word-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
  .ms-word-chip {
    padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border);
    background: var(--surface2); font-size: 0.8rem; cursor: pointer;
    transition: all 0.18s; color: var(--text);
  }
  .ms-word-chip:hover, .ms-word-chip.selected {
    border-color: var(--accent3); background: rgba(108,252,202,0.1);
    color: var(--accent3);
  }

  /* ── Confirm mood btn ── */
  .ms-confirm-btn {
    margin-top: 14px; padding: 10px 24px; border-radius: 24px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border: none; color: #fff; font-family: 'Syne', sans-serif;
    font-weight: 700; font-size: 0.88rem; cursor: pointer;
    transition: all 0.22s; letter-spacing: 0.3px;
  }
  .ms-confirm-btn:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,108,252,0.35); }
  .ms-confirm-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  /* ── Recommendation cards ── */
  .ms-rec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
  .ms-rec-card {
    border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--border);
    background: var(--surface2); transition: all 0.22s; cursor: pointer;
  }
  .ms-rec-card:hover { border-color: var(--accent); transform: translateY(-3px); box-shadow: var(--shadow); }
  .ms-rec-poster {
    width: 100%; height: 110px; object-fit: cover;
    background: linear-gradient(135deg, var(--surface3), var(--surface2));
    display: flex; align-items: center; justify-content: center; font-size: 2.5rem;
  }
  .ms-rec-poster img { width: 100%; height: 100%; object-fit: cover; }
  .ms-rec-info { padding: 10px 12px; }
  .ms-rec-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.82rem; line-height: 1.3; }
  .ms-rec-meta { font-size: 0.7rem; color: var(--muted); margin-top: 4px; }
  .ms-rec-rating { display: inline-flex; align-items: center; gap: 3px; font-size: 0.7rem; color: #fbbf24; margin-top: 4px; }
  .ms-rec-link {
    display: inline-block; margin-top: 8px; font-size: 0.72rem; color: var(--accent);
    text-decoration: none; border: 1px solid rgba(124,108,252,0.3);
    padding: 3px 10px; border-radius: 12px; transition: all 0.18s;
  }
  .ms-rec-link:hover { background: rgba(124,108,252,0.12); }

  /* ── Emotion result pill ── */
  .ms-emotion-pill {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-radius: 24px; margin-top: 10px;
    background: rgba(108,252,202,0.1); border: 1px solid rgba(108,252,202,0.3);
    font-size: 0.82rem; color: var(--accent3); font-family: 'Syne', sans-serif; font-weight: 600;
  }

  /* ── Input bar ── */
  .ms-input-area {
    padding: 14px 16px; border-top: 1px solid var(--border);
    background: rgba(13,15,20,0.9); backdrop-filter: blur(12px);
  }
  .ms-input-wrap {
    max-width: 760px; margin: 0 auto;
    display: flex; gap: 10px; align-items: flex-end;
  }
  .ms-input {
    flex: 1; background: var(--surface2); border: 1px solid var(--border);
    color: var(--text); border-radius: 24px; padding: 11px 18px;
    font-family: 'DM Sans', sans-serif; font-size: 0.92rem; resize: none;
    outline: none; transition: border-color 0.2s; max-height: 120px;
    line-height: 1.5;
  }
  .ms-input:focus { border-color: var(--accent); }
  .ms-input::placeholder { color: var(--muted); }
  .ms-send-btn {
    width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border: none; cursor: pointer; display: flex; align-items: center;
    justify-content: center; transition: all 0.2s;
  }
  .ms-send-btn:hover { opacity: 0.85; transform: scale(1.08); }
  .ms-send-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
  .ms-input-hint { text-align: center; font-size: 0.68rem; color: var(--muted); margin-top: 8px; }

  /* ── Welcome screen ── */
  .ms-welcome {
    max-width: 560px; margin: 0 auto; padding: 40px 20px;
    display: flex; flex-direction: column; align-items: center; gap: 20px;
    animation: fadeUp 0.5s ease;
  }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  .ms-welcome-icon { font-size: 4rem; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
  .ms-welcome-title {
    font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800;
    text-align: center; background: linear-gradient(135deg, var(--accent), var(--accent2));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .ms-welcome-sub { color: var(--muted); text-align: center; font-size: 0.92rem; line-height: 1.7; max-width: 400px; }
  .ms-start-btn {
    padding: 13px 36px; border-radius: 28px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border: none; color: #fff; font-family: 'Syne', sans-serif;
    font-weight: 800; font-size: 1rem; cursor: pointer; transition: all 0.22s;
    letter-spacing: 0.3px; box-shadow: 0 8px 30px rgba(124,108,252,0.3);
  }
  .ms-start-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(124,108,252,0.4); }

  /* ── History panel ── */
  .ms-history-btn {
    background: none; border: 1px solid var(--border); color: var(--muted);
    padding: 5px 14px; border-radius: 20px; font-size: 0.75rem; cursor: pointer;
    transition: all 0.2s;
  }
  .ms-history-btn:hover { border-color: var(--accent3); color: var(--accent3); }
  .ms-history-panel {
    position: fixed; top: 0; right: 0; width: 340px; height: 100vh;
    background: var(--surface); border-left: 1px solid var(--border);
    z-index: 100; overflow-y: auto; padding: 20px;
    animation: slideIn 0.25s ease;
  }
  @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  .ms-history-title {
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1rem;
    margin-bottom: 16px; color: var(--accent3);
  }
  .ms-history-item {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 14px; margin-bottom: 12px;
  }
  .ms-history-meta {
    font-size: 0.72rem; color: var(--muted); margin-bottom: 8px;
    display: flex; justify-content: space-between;
  }
  .ms-history-emotion {
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.85rem;
    color: var(--accent); margin-bottom: 8px;
  }
  .ms-history-recs { display: flex; flex-direction: column; gap: 6px; }
  .ms-history-rec {
    font-size: 0.78rem; color: var(--text); padding: 6px 10px;
    background: var(--surface3); border-radius: 6px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .ms-history-rec a { font-size: 0.7rem; color: var(--accent); text-decoration: none; }
  .ms-history-close {
    width: 100%; padding: 10px; background: none; border: 1px solid var(--border);
    color: var(--muted); border-radius: var(--radius-sm); cursor: pointer;
    font-size: 0.8rem; margin-bottom: 16px; transition: all 0.2s;
  }
  .ms-history-close:hover { border-color: var(--accent2); color: var(--accent2); }
  .ms-history-empty { color: var(--muted); font-size: 0.85rem; text-align: center; margin-top: 40px; }
  .ms-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99; cursor: pointer;
  }
`;

// ─── HELPERS ────────────────────────────────────────────────
function getTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── API CALLS → Backend ─────────────────────────────────────

async function callGemini(userTexts, systemPrompt, sessionId, userMessage, recommendationType) {
  try {
    const data = await apiCall("/api/chat", {
      sessionId,
      userMessage,
      userTexts,
      systemPrompt,
      recommendationType,
    });
    if (data.error) {
      console.error("Chat API error:", data.message);
      return { reply: "That's interesting! Can you tell me more about how you feel?", sessionId };
    }
    return { reply: data.reply, sessionId: data.sessionId };
  } catch (err) {
    console.error("Chat API failed:", err);
    return { reply: "That's interesting! Can you tell me more about how you feel?", sessionId };
  }
}

async function callHuggingFace(userTexts, selectedEmojis, selectedWords, skipped, sessionId) {
  try {
    const data = await apiCall("/api/emotion", {
      sessionId,
      userTexts,
      selectedEmojis,
      selectedWords,
      skipped,
    });
    return data.emotion || "neutral";
  } catch (err) {
    console.error("Emotion API failed:", err);
    return "neutral";
  }
}

// ─── Movies via Backend ──────────────────────────────────────
async function fetchMovies(emotion, sessionId) {
  try {
    const data = await apiCall("/api/movies", { emotion, sessionId });
    return data.movies || [];
  } catch (err) {
    console.error("Movies API failed:", err);
    return [];
  }
}

// ─── Songs via Backend (with song bank fallback) ────────────
const SONG_BANK = {
  joy: [
    { id:"1", title:"Blinding Lights",      artist:"The Weeknd",       year:"2019", emoji:"🎵", link:"https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b" },
    { id:"2", title:"Happy",                artist:"Pharrell Williams", year:"2013", emoji:"🎵", link:"https://open.spotify.com/track/60nZcImufyMA1MKQY3dcCO" },
    { id:"3", title:"Can't Stop the Feeling",artist:"Justin Timberlake",year:"2016", emoji:"🎵", link:"https://open.spotify.com/track/6KuHuqH9bGANSmT78OQTJZ" },
    { id:"4", title:"Uptown Funk",          artist:"Mark Ronson ft. Bruno Mars", year:"2014", emoji:"🎵", link:"https://open.spotify.com/track/32OlwWuMpZ6b0aN2RZOeMS" },
    { id:"5", title:"Good as Hell",         artist:"Lizzo",            year:"2016", emoji:"🎵", link:"https://open.spotify.com/track/5UqC9BGKV3mFBQyaIf98pk" },
    { id:"6", title:"Shake It Off",         artist:"Taylor Swift",     year:"2014", emoji:"🎵", link:"https://open.spotify.com/track/0cqRj7pUJDkTCEsJkx8snD" },
    { id:"7", title:"Levitating",           artist:"Dua Lipa",         year:"2020", emoji:"🎵", link:"https://open.spotify.com/track/463CkQjx2Zk1yXoBuierM9" },
    { id:"8", title:"Dynamite",             artist:"BTS",              year:"2020", emoji:"🎵", link:"https://open.spotify.com/track/5QDLhrAOJJdNAmCTJ8xMyW" },
  ],
  sadness: [
    { id:"1", title:"Someone Like You",     artist:"Adele",            year:"2011", emoji:"🎵", link:"https://open.spotify.com/track/4kflIqB4zdN74HgBnWxVuF" },
    { id:"2", title:"Fix You",              artist:"Coldplay",         year:"2005", emoji:"🎵", link:"https://open.spotify.com/track/7LVHVU3tWfcxj5aiPFEW4Q" },
    { id:"3", title:"The Night We Met",     artist:"Lord Huron",       year:"2015", emoji:"🎵", link:"https://open.spotify.com/track/3hRV0jL3vUpRrcy398teAU" },
    { id:"4", title:"All I Want",           artist:"Kodaline",         year:"2012", emoji:"🎵", link:"https://open.spotify.com/track/5qbJjNLULMiInFAXBSmGem" },
    { id:"5", title:"Let Her Go",           artist:"Passenger",        year:"2012", emoji:"🎵", link:"https://open.spotify.com/track/2nmoNgcBzHoLSHy1QKQP3m" },
    { id:"6", title:"Skinny Love",          artist:"Bon Iver",         year:"2008", emoji:"🎵", link:"https://open.spotify.com/track/3GpNBMcE9m5hJSGvHF1fPq" },
    { id:"7", title:"Liability",            artist:"Lorde",            year:"2017", emoji:"🎵", link:"https://open.spotify.com/track/6nxHMB8MIcEBMCFagfQpVJ" },
    { id:"8", title:"Shiver",              artist:"Lucy Dacus",        year:"2021", emoji:"🎵", link:"https://open.spotify.com/track/6nxHMB8MIcEBMCFagfQpVJ" },
  ],
  anger: [
    { id:"1", title:"HUMBLE.",             artist:"Kendrick Lamar",    year:"2017", emoji:"🎵", link:"https://open.spotify.com/track/7KXjTSCq5nL1LoYztd9oa" },
    { id:"2", title:"Break Stuff",         artist:"Limp Bizkit",       year:"1999", emoji:"🎵", link:"https://open.spotify.com/track/1KuBMxMQNXBSqKaBkrBOVQ" },
    { id:"3", title:"In The End",          artist:"Linkin Park",       year:"2000", emoji:"🎵", link:"https://open.spotify.com/track/60a0Rd6pjrkxjPbaKzXjfq" },
    { id:"4", title:"Killing In The Name", artist:"Rage Against The Machine", year:"1992", emoji:"🎵", link:"https://open.spotify.com/track/59WN2psjkt1tyaxjspN8fp" },
    { id:"5", title:"Stronger",            artist:"Kanye West",        year:"2007", emoji:"🎵", link:"https://open.spotify.com/track/0gplL1WMoJ6iYaPgMCL0gX" },
    { id:"6", title:"Numb",               artist:"Linkin Park",        year:"2003", emoji:"🎵", link:"https://open.spotify.com/track/3kxfsdsCpFgN412fpnW85Y" },
    { id:"7", title:"Lose Yourself",      artist:"Eminem",             year:"2002", emoji:"🎵", link:"https://open.spotify.com/track/7MJQ9Nfxzh8LPZ9e9u68Fq" },
    { id:"8", title:"Power",              artist:"Kanye West",         year:"2010", emoji:"🎵", link:"https://open.spotify.com/track/2gZUPNdnz5Y45eiGxpHGSc" },
  ],
  fear: [
    { id:"1", title:"Breathe (2 AM)",      artist:"Anna Nalick",       year:"2005", emoji:"🎵", link:"https://open.spotify.com/track/6tNQ70jh4wnmOXSIoSKGXF" },
    { id:"2", title:"The Sound of Silence",artist:"Simon & Garfunkel", year:"1964", emoji:"🎵", link:"https://open.spotify.com/track/2qYA7NNVChfACnCEBFDs8E" },
    { id:"3", title:"Mad World",           artist:"Gary Jules",        year:"2001", emoji:"🎵", link:"https://open.spotify.com/track/3JOVTQ5h8HyvI8VIO9pMyB" },
    { id:"4", title:"Everybody Hurts",     artist:"R.E.M.",            year:"1992", emoji:"🎵", link:"https://open.spotify.com/track/6PypGyiu0Y2lCDBN1XZEnP" },
    { id:"5", title:"Creep",              artist:"Radiohead",           year:"1992", emoji:"🎵", link:"https://open.spotify.com/track/70LcF31zb1H0PyJoS1Sx1r" },
    { id:"6", title:"Anxiety",            artist:"Julia Michaels",      year:"2019", emoji:"🎵", link:"https://open.spotify.com/track/2qYA7NNVChfACnCEBFDs8E" },
    { id:"7", title:"Dark Side",           artist:"Kelly Clarkson",    year:"2011", emoji:"🎵", link:"https://open.spotify.com/track/0gplL1WMoJ6iYaPgMCL0gX" },
    { id:"8", title:"Heavy",              artist:"Birdtalker",          year:"2018", emoji:"🎵", link:"https://open.spotify.com/track/6PypGyiu0Y2lCDBN1XZEnP" },
  ],
  surprise: [
    { id:"1", title:"As It Was",           artist:"Harry Styles",      year:"2022", emoji:"🎵", link:"https://open.spotify.com/track/4Dvkj6JhhA12EX05fT7y2e" },
    { id:"2", title:"Anti-Hero",           artist:"Taylor Swift",      year:"2022", emoji:"🎵", link:"https://open.spotify.com/track/0V3wPSX9ygBnCm8psDIegu" },
    { id:"3", title:"Montero",             artist:"Lil Nas X",         year:"2021", emoji:"🎵", link:"https://open.spotify.com/track/7AUveknMOOMDSRPEVPNSaO" },
    { id:"4", title:"Electric Feel",       artist:"MGMT",              year:"2007", emoji:"🎵", link:"https://open.spotify.com/track/3FtYbEfBqAlGO46NUDQSAt" },
    { id:"5", title:"Feels",               artist:"Calvin Harris",     year:"2017", emoji:"🎵", link:"https://open.spotify.com/track/5P4LMDDt5O8F0sFGBRsRRJ" },
    { id:"6", title:"Industry Baby",       artist:"Lil Nas X",         year:"2021", emoji:"🎵", link:"https://open.spotify.com/track/27NovPIUIRrOZoCHxABJwK" },
    { id:"7", title:"Blinding Lights",     artist:"The Weeknd",        year:"2019", emoji:"🎵", link:"https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b" },
    { id:"8", title:"Roses",              artist:"SAINt JHN",          year:"2016", emoji:"🎵", link:"https://open.spotify.com/track/7GX5flRQZVHvXDxcho3BqK" },
  ],
  disgust: [
    { id:"1", title:"Royals",              artist:"Lorde",             year:"2013", emoji:"🎵", link:"https://open.spotify.com/track/5XeFesFbtLpXzIVDNQP22n" },
    { id:"2", title:"Bad Guy",            artist:"Billie Eilish",       year:"2019", emoji:"🎵", link:"https://open.spotify.com/track/2Fxmhks0live0BKB3XTZ6p" },
    { id:"3", title:"Mr. Brightside",     artist:"The Killers",        year:"2003", emoji:"🎵", link:"https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUIOKE" },
    { id:"4", title:"Traitor",            artist:"Olivia Rodrigo",      year:"2021", emoji:"🎵", link:"https://open.spotify.com/track/5CZ40GBx1sQ9agT62ZVKS8" },
    { id:"5", title:"drivers license",    artist:"Olivia Rodrigo",      year:"2021", emoji:"🎵", link:"https://open.spotify.com/track/6ai0IGOGFwfQCLRVqSp3fp" },
    { id:"6", title:"Somebody That I Used to Know", artist:"Gotye",    year:"2011", emoji:"🎵", link:"https://open.spotify.com/track/1GDCmFLIf2kXRyBYMtHMyf" },
    { id:"7", title:"Since U Been Gone",   artist:"Kelly Clarkson",    year:"2004", emoji:"🎵", link:"https://open.spotify.com/track/5C0YLr4OoRGFDaqdMQmKeK" },
    { id:"8", title:"You Oughta Know",     artist:"Alanis Morissette", year:"1995", emoji:"🎵", link:"https://open.spotify.com/track/0gplL1WMoJ6iYaPgMCL0gX" },
  ],
  neutral: [
    { id:"1", title:"Here Comes the Sun",  artist:"The Beatles",       year:"1969", emoji:"🎵", link:"https://open.spotify.com/track/6dGnYIeXmHdcikdzNNDMm2" },
    { id:"2", title:"Holocene",            artist:"Bon Iver",          year:"2011", emoji:"🎵", link:"https://open.spotify.com/track/4MwDCqLo375bASaFCBQHRR" },
    { id:"3", title:"Vienna",              artist:"Billy Joel",        year:"1977", emoji:"🎵", link:"https://open.spotify.com/track/0uDMGnMGRFTRBcIbwOHIKU" },
    { id:"4", title:"Yellow",            artist:"Coldplay",            year:"2000", emoji:"🎵", link:"https://open.spotify.com/track/3AJwUDP919kvQ9QcozQPxg" },
    { id:"5", title:"Better Together",    artist:"Jack Johnson",       year:"2005", emoji:"🎵", link:"https://open.spotify.com/track/5q59PBJMkuHOMvNcFPNPjW" },
    { id:"6", title:"Weightless",          artist:"Marconi Union",     year:"2011", emoji:"🎵", link:"https://open.spotify.com/track/3riymODFBBWBvRfOf7NRBf" },
    { id:"7", title:"Breathe",            artist:"Pink Floyd",         year:"1973", emoji:"🎵", link:"https://open.spotify.com/track/4xqrdfXkTW4T0RqqjgoOI7" },
    { id:"8", title:"The Night Will Always Win", artist:"Manchester Orchestra", year:"2014", emoji:"🎵", link:"https://open.spotify.com/track/6PypGyiu0Y2lCDBN1XZEnP" },
  ],
};

async function fetchSongs(emotion, sessionId) {
  try {
    // Try backend first (has live Spotify via server-side call)
    const data = await apiCall("/api/songs", { emotion, sessionId });
    if (data.songs && data.songs.length >= 2) return data.songs;
    throw new Error("Not enough songs from backend");
  } catch (err) {
    // Fall back to song bank if backend Spotify fails
    console.log("Using song bank fallback:", err.message);
    const bank = SONG_BANK[emotion] || SONG_BANK.neutral;
    return [...bank].sort(() => Math.random() - 0.5).slice(0, 4);
  }
}

// ─── COMPONENTS ─────────────────────────────────────────────

function Avatar({ isBot }) {
  return (
    <div className={`ms-avatar ${isBot ? "" : "user-av"}`}>
      {isBot ? "🎭" : "👤"}
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="ms-msg bot">
      <Avatar isBot />
      <div className="ms-bubble ms-typing">
        <div className="ms-dot" /><div className="ms-dot" /><div className="ms-dot" />
      </div>
    </div>
  );
}

function RecCard({ item, type }) {
  return (
    <div className="ms-rec-card">
      <div className="ms-rec-poster">
        {item.poster ? <img src={item.poster} alt={item.title} /> : <span>{item.emoji}</span>}
      </div>
      <div className="ms-rec-info">
        <div className="ms-rec-title">{item.title}</div>
        <div className="ms-rec-meta">
          {item.artist ? item.artist : item.genre} · {item.year}
        </div>
        {item.rating && (
          <div className="ms-rec-rating">⭐ {item.rating?.toFixed(1)}</div>
        )}
        {item.link && <a className="ms-rec-link" href={item.link} target="_blank" rel="noreferrer">View →</a>}
      </div>
    </div>
  );
}

function SelfExpressionPanel({ onConfirm }) {
  const [emojis, setEmojis] = useState([]);
  const [words, setWords] = useState([]);

  function toggleEmoji(e) {
    setEmojis(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  }
  function toggleWord(w) {
    setWords(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]);
  }

  const hasSelections = emojis.length > 0 || words.length > 0;

  return (
    <div>
      <div className="ms-emoji-section">
        <div className="ms-section-label">Pick emojis that match your vibe</div>
        <div className="ms-emoji-grid">
          {EMOJI_OPTIONS.map(e => (
            <button key={e} className={`ms-emoji-btn ${emojis.includes(e) ? "selected" : ""}`} onClick={() => toggleEmoji(e)}>{e}</button>
          ))}
        </div>
      </div>
      <div className="ms-emoji-section" style={{ marginTop: 14 }}>
        <div className="ms-section-label">Words that describe how you feel</div>
        <div className="ms-word-grid">
          {EMOTION_WORDS.map(w => (
            <button key={w} className={`ms-word-chip ${words.includes(w) ? "selected" : ""}`} onClick={() => toggleWord(w)}>{w}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <button
          className="ms-confirm-btn"
          disabled={!hasSelections}
          onClick={() => onConfirm({ emojis, words })}
        >
          ✨ Get My Recommendations
        </button>
        <button
          className="ms-confirm-btn"
          onClick={() => onConfirm({ emojis: [], words: [], skipped: true })}
          style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "var(--muted)" }}
        >
          Skip → Just use my answers
        </button>
      </div>
    </div>
  );
}

// ─── History Panel Component ─────────────────────────────────
function HistoryPanel({ history, onClose }) {
  const EMOTION_MAP_LOCAL = {
    joy: "Joyful 😄", sadness: "Sad 🌧️", anger: "Angry 🔥",
    fear: "Anxious 😰", surprise: "Surprised 🤯", disgust: "Uneasy 😤", neutral: "Neutral 😐",
  };
  return (
    <>
      <div className="ms-overlay" onClick={onClose} />
      <div className="ms-history-panel">
        <div className="ms-history-title">🕓 Recent Sessions</div>
        <button className="ms-history-close" onClick={onClose}>✕ Close</button>
        {history.length === 0 ? (
          <div className="ms-history-empty">No sessions yet.<br/>Complete a chat to see your history!</div>
        ) : (
          history.map((session, i) => (
            <div key={i} className="ms-history-item">
              <div className="ms-history-meta">
                <span>{session.recommendationType === "movie" ? "🎬 Movies" : "🎵 Songs"}</span>
                <span>{new Date(session.startedAt).toLocaleDateString()}</span>
              </div>
              <div className="ms-history-emotion">
                {EMOTION_MAP_LOCAL[session.detectedEmotion] || session.detectedEmotion}
              </div>
              <div className="ms-history-recs">
                {(session.recommendations || []).slice(0, 3).map((rec, j) => (
                  <div key={j} className="ms-history-rec">
                    <span>{rec.title} · {rec.year}</span>
                    {rec.link && <a href={rec.link} target="_blank" rel="noreferrer">View</a>}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────
export default function MoodSync() {
  const [started, setStarted]           = useState(false);
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [phase, setPhase]               = useState("welcome");
  const [recType, setRecType]           = useState(null);
  const [questionIdx, setQuestionIdx]   = useState(0);
  const [userTexts, setUserTexts]       = useState([]);
  const [detectedEmotion, setDetectedEmotion] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [sessionId, setSessionId]       = useState(null);  // MongoDB session ID
  const [history, setHistory]           = useState([]);    // last 3 sessions
  const [showHistory, setShowHistory]   = useState(false); // toggle history panel
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  // Load history on mount
  useEffect(() => {
    apiGet("/api/history").then(data => {
      if (data.sessions) setHistory(data.sessions);
    }).catch(() => {});
  }, []);

  function addMsg(role, content, extra = {}) {
    setMessages(prev => [...prev, { role, content, time: getTime(), ...extra }]);
  }

  async function startChat() {
    setStarted(true);
    setPhase("pick-type");
    addMsg("bot", "Hey there! 👋 I'm MoodSync. I'll find the perfect entertainment to match exactly how you're feeling right now.\n\nFirst up — what are you in the mood for?", { isPickType: true });
  }

  async function selectType(type) {
    setRecType(type);
    setPhase("questioning");
    addMsg("user", type === "movie" ? "🎬 I want movie recommendations" : "🎵 I want song recommendations");
    setLoading(true);
    // Create session on backend with first question
    const { reply, sessionId: newSessionId } = await callGemini(
      [],
      "You are MoodSync, a warm and empathetic mood-detection chatbot. Greet the user warmly and ask your first mood-detection question in 1-2 sentences. Be friendly and conversational.",
      null,
      type === "movie" ? "I want movie recommendations" : "I want song recommendations",
      type
    );
    setSessionId(newSessionId);
    setLoading(false);
    addMsg("bot", `Great choice! Let me get to know your mood a little better. 🎯

${reply}`);
    setQuestionIdx(1);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    addMsg("user", text);
    setUserTexts(prev => [...prev, text]);

    if (phase === "questioning") {
      setLoading(true);
      const allUserText = [...userTexts, text].join(" ");

      if (questionIdx < MOOD_QUESTIONS.length) {
        // Ask next question via backend
        const { reply } = await callGemini(
          [...userTexts, text],
          "You are MoodSync, a warm and empathetic mood-detection chatbot. The user is sharing how they feel. Ask ONE short follow-up question (max 2 sentences) to better understand their emotional state. Be conversational, friendly, and varied — do not repeat previous questions.",
          sessionId,
          text,
          recType
        );
        setLoading(false);
        addMsg("bot", reply);
        setQuestionIdx(i => i + 1);
      } else {
        // Enough data collected — move to self-expression
        setLoading(false);
        setPhase("self-expression");
        addMsg("bot", "Thanks for sharing that with me 💙 I have a good sense of how you're feeling. Let me do a little analysis...", { isBridge: true });
        setTimeout(() => {
          addMsg("bot", "Now, to make sure I nail it — pick any emojis and words that really capture your vibe right now:", { isSelfExpression: true });
        }, 800);
      }
    }
  }

  async function handleSelfExpression({ emojis, words, skipped }) {
    const userInput = skipped ? "Skipped self-expression" : `${emojis.join(" ")}  ${words.join(", ")}`;
    addMsg("user", userInput);
    setPhase("loading-results");
    setLoading(true);

    // Detect emotion via backend
    const emotion = await callHuggingFace(userTexts, emojis, words, skipped, sessionId);
    setDetectedEmotion(emotion);

    const emotionInfo = EMOTION_MAP[emotion] || EMOTION_MAP.neutral;

    // Fetch recommendations via backend
    const recs = recType === "movie"
      ? await fetchMovies(emotion, sessionId)
      : await fetchSongs(emotion, sessionId);

    setRecommendations(recs);
    setLoading(false);
    setPhase("results");

    addMsg("bot", `I detected your mood as: **${emotionInfo.label}**`, { isEmotionResult: true, emotion, emotionInfo });
    setTimeout(() => {
      addMsg("bot",
        `Here are your personalised ${recType === "movie" ? "🎬 movie" : "🎵 song"} picks just for you:`,
        { isRecommendations: true, recs, recType }
      );
      // Refresh history after session completes
      apiGet("/api/history").then(data => {
        if (data.sessions) setHistory(data.sessions);
      }).catch(() => {});
    }, 600);
  }

  function reset() {
    setStarted(false); setMessages([]); setInput(""); setLoading(false);
    setPhase("welcome"); setRecType(null); setQuestionIdx(0);
    setUserTexts([]); setDetectedEmotion(null); setRecommendations([]);
    setSessionId(null); setShowHistory(false);
    // Reload history
    apiGet("/api/history").then(data => {
      if (data.sessions) setHistory(data.sessions);
    }).catch(() => {});
  }

  function renderMsgContent(msg) {
    if (msg.isPickType) {
      return (
        <>
          <div style={{ whiteSpace: "pre-line", marginBottom: 12 }}>{msg.content}</div>
          <div className="ms-pick-row">
            <div className={`ms-pick-card ${recType === "movie" ? "selected" : ""}`} onClick={() => phase === "pick-type" && selectType("movie")}>
              <div className="ms-pick-icon">🎬</div>
              <div className="ms-pick-label">Movies</div>
              <div className="ms-pick-sub">Find a film for your mood</div>
            </div>
            <div className={`ms-pick-card ${recType === "song" ? "selected" : ""}`} onClick={() => phase === "pick-type" && selectType("song")}>
              <div className="ms-pick-icon">🎵</div>
              <div className="ms-pick-label">Songs</div>
              <div className="ms-pick-sub">Find tracks that get you</div>
            </div>
          </div>
        </>
      );
    }

    if (msg.isSelfExpression) {
      return (
        <>
          <div style={{ marginBottom: 12 }}>{msg.content}</div>
          <SelfExpressionPanel onConfirm={handleSelfExpression} />
        </>
      );
    }

    if (msg.isEmotionResult) {
      return (
        <>
          <div>{msg.content.replace("**", "").replace("**", "")}</div>
          <div className="ms-emotion-pill">
            🧠 Detected Emotion: {msg.emotionInfo?.label}
          </div>
        </>
      );
    }

    if (msg.isRecommendations) {
      return (
        <>
          <div style={{ marginBottom: 10 }}>{msg.content}</div>
          <div className="ms-rec-grid">
            {msg.recs.map(r => <RecCard key={r.id} item={r} type={msg.recType} />)}
          </div>
          <button className="ms-confirm-btn" onClick={reset} style={{ marginTop: 16 }}>
            🔄 Start Over
          </button>
        </>
      );
    }

    return <div style={{ whiteSpace: "pre-line" }}>{msg.content}</div>;
  }

  const canType = phase === "questioning" && !loading;

  return (
    <>
      <style>{styles}</style>
      <div className="ms-app">
        {/* History Panel */}
        {showHistory && <HistoryPanel history={history} onClose={() => setShowHistory(false)} />}

        {/* Header */}
        <header className="ms-header">
          <div className="ms-logo">
            <div className="ms-logo-icon">🎭</div>
            <div>
              <div className="ms-logo-name">Mood<span>Sync</span></div>
              <div className="ms-tagline">AI-Powered Mood Recommendations</div>
            </div>
          </div>
          <div className="ms-header-right">
            <span className="ms-badge">Synclub · JECRC</span>
            <button className="ms-history-btn" onClick={() => setShowHistory(h => !h)}>
              🕓 History {history.length > 0 ? `(${history.length})` : ""}
            </button>
            {started && <button className="ms-reset-btn" onClick={reset}>↺ Reset</button>}
          </div>
        </header>

        {/* Chat / Welcome Area */}
        <div className="ms-chat-area">
          {!started ? (
            <div className="ms-welcome">
              <div className="ms-welcome-icon">🎭</div>
              <div className="ms-welcome-title">How are you feeling today?</div>
              <div className="ms-welcome-sub">
                MoodSync listens to how you're feeling and recommends the perfect movies or songs — no searching, just vibes.
              </div>
              <button className="ms-start-btn" onClick={startChat}>Let's Find Your Vibe →</button>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}>
                Powered by Gemini AI · Hugging Face · Spotify · OMDb
              </div>
            </div>
          ) : (
            <div className="ms-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`ms-msg ${msg.role}`}>
                  {msg.role === "bot" && <Avatar isBot />}
                  <div>
                    <div className="ms-bubble">{renderMsgContent(msg)}</div>
                    <div className="ms-time">{msg.time}</div>
                  </div>
                  {msg.role === "user" && <Avatar isBot={false} />}
                </div>
              ))}
              {loading && <TypingBubble />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        {started && (
          <div className="ms-input-area">
            <div className="ms-input-wrap">
              <textarea
                className="ms-input"
                rows={1}
                placeholder={canType ? "Share how you're feeling..." : "Waiting for MoodSync..."}
                value={input}
                disabled={!canType}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              />
              <button className="ms-send-btn" disabled={!canType || !input.trim()} onClick={sendMessage}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="ms-input-hint">Press Enter to send · Shift+Enter for new line</div>
          </div>
        )}
      </div>
    </>
  );
}
