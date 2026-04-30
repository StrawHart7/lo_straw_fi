const DB_NAME = 'lofi-db';
const DB_VERSION = 1;
const STORE_NAME = 'audio';
const AUDIO_KEY = 'lofi-track';

let db;
let audio = new Audio();
audio.loop = true;

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

function setStatus(text) {
  statusEl.textContent = text;
}

function setupAudioSource(blob) {
  const url = URL.createObjectURL(blob);
  audio.src = url;
}

// --- Logique principale ---

async function init() {
  db = await openDB();
  const stored = await loadAudio();

  if (stored) {
    // Audio déjà sauvegardé
    setupAudioSource(stored);
    setStatus('🎵 Prêt');
    btnPlay.classList.remove('hidden');
  } else {
    // Première visite, demander le fichier
    setStatus('📁 Aucun audio trouvé');
    btnLoad.classList.remove('hidden');
  }
}

// Charger depuis le PC et sauvegarder
btnLoad.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'audio/*';

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus('💾 Sauvegarde en cours...');
    btnLoad.classList.add('hidden');

    await saveAudio(file);

    setupAudioSource(file);
    setStatus('✅ Audio sauvegardé !');
    btnPlay.classList.remove('hidden');
  };

  input.click();
});

// Play / Pause
btnPlay.addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
    btnPlay.textContent = '⏸ Pause';
    setStatus('🎵 En cours...');
  } else {
    audio.pause();
    btnPlay.textContent = '▶ Play';
    setStatus('⏸ En pause');
  }
});

// Démarrer
init();