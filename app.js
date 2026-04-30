const DB_NAME = 'lofi-db';
const DB_VERSION = 1;
const STORE_NAME = 'audio';
const AUDIO_KEY = 'lofi-track';

let db;
let audio = new Audio();
audio.loop = true;

function setupMediaSession() {
  if (!('mediaSession' in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: 'Lofi',
    artist: 'Lofi Girl',
    album: 'Study Mix',
  });

  navigator.mediaSession.setActionHandler('play', () => {
    audio.play();
    btnPlay.textContent = '⏸';
    setStatus('🎵 En cours...');
    navigator.mediaSession.playbackState = 'playing';
  });

  navigator.mediaSession.setActionHandler('pause', () => {
    audio.pause();
    btnPlay.textContent = '▶';
    setStatus('⏸ En pause');
    navigator.mediaSession.playbackState = 'paused';
  });

  navigator.mediaSession.setActionHandler('stop', () => {
    audio.pause();
    audio.currentTime = 0;
    btnPlay.textContent = '▶';
    setStatus('⏸ En pause');
    navigator.mediaSession.playbackState = 'paused';
  });
}

// --- IndexedDB ---

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

function saveAudio(file) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(file, AUDIO_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

function loadAudio() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(AUDIO_KEY);
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

// --- UI ---

const statusEl = document.getElementById('status');
const btnLoad = document.getElementById('btn-load');
const btnPlay = document.getElementById('btn-play');
const btnChange = document.getElementById('btn-change');
const playerEl = document.getElementById('player');

function setStatus(text) {
  statusEl.textContent = text;
}

function setupAudioSource(blob) {
  const url = URL.createObjectURL(blob);
  audio.src = url;
}

function pickAudioFile(onFilePicked) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'audio/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) onFilePicked(file);
  };
  input.click();
}

// --- Init ---

async function init() {
  db = await openDB();
  const stored = await loadAudio();

  if (stored) {
    setupAudioSource(stored);
    setupMediaSession();
    setStatus('🎵 Prêt');
    playerEl.classList.remove('hidden');
  } else {
    setStatus('📁 Aucun audio trouvé');
    btnLoad.classList.remove('hidden');
  }
}

// --- Events ---

btnLoad.addEventListener('click', () => {
  pickAudioFile(async (file) => {
    setStatus('💾 Sauvegarde en cours...');
    btnLoad.classList.add('hidden');
    await saveAudio(file);
    setupAudioSource(file);
    setupMediaSession();
    setStatus('🎵 Prêt');
    playerEl.classList.remove('hidden');
  });
});

btnPlay.addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
    btnPlay.textContent = '⏸';
    setStatus('🎵 En cours...');
  } else {
    audio.pause();
    btnPlay.textContent = '▶';
    setStatus('⏸ En pause');
  }
});

btnChange.addEventListener('click', () => {
  pickAudioFile(async (file) => {
    audio.pause();
    btnPlay.textContent = '▶';
    setStatus('💾 Sauvegarde en cours...');
    await saveAudio(file);
    setupAudioSource(file);
    setStatus('✅ Nouvel audio chargé !');
  });
});

init();