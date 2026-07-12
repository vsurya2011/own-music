// Room code can come from the URL (?room=CODE, useful for shared links / a fresh
// browser with no localStorage yet) or fall back to what was saved when the user
// created/joined a room via index.html or owner-login.html.
const urlParams = new URLSearchParams(window.location.search);
const roomCode = urlParams.get("room") || localStorage.getItem("roomId");
const username = urlParams.get("name") || localStorage.getItem("username") || "Guest";
const password = localStorage.getItem("ownerPassword") || "";

if (!roomCode) {
  // No room to join at all — bail out immediately instead of letting the rest
  // of this script keep running against a room that doesn't exist.
  window.location.href = "index.html";
} else {
  localStorage.setItem("roomId", roomCode);
  localStorage.setItem("username", username);
  initRoom();
}

function initRoom() {

const socket = io();
document.getElementById("roomCodeDisplay").innerText = roomCode;

let isOwner = false;
let publicControl = false;
let ytPlayer;
let ytReady = false;

const player = document.getElementById("player");
const statusMsg = document.getElementById("statusMsg");
const ownerControlBlock = document.getElementById("ownerControlBlock");
const ownerOnlyInterface = document.getElementById("ownerOnlyInterface");
const toggleControlBtn = document.getElementById("toggleControlBtn");

const trackTitle = document.getElementById("trackTitle");
const progressBar = document.getElementById("progressBar");
const progressFill = document.getElementById("progressFill");
const curTimeEl = document.getElementById("curTime");
const durTimeEl = document.getElementById("durTime");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const playPauseBtn = document.getElementById("playPauseBtn");
const playIcon = document.getElementById("playIcon");
const pauseIcon = document.getElementById("pauseIcon");

// ---------- Playback / queue state ----------
let activeSource = null;     // 'audio' | 'yt' | null
let isPlayingState = false;
let currentYtId = null;
let tamilList = [];
let englishList = [];
let currentQueue = null;     // { list, index }

function canControl() {
  return isOwner || publicControl;
}

function refreshControlUI() {
  ownerControlBlock.style.display = canControl() ? "block" : "none";
  ownerOnlyInterface.style.display = isOwner ? "block" : "none";
  if (isOwner) {
    toggleControlBtn.textContent = publicControl
      ? "🔒 Restrict Control to Me"
      : "🔓 Allow Friends to Control";
  }
  if (isOwner) {
    statusMsg.innerText = "✅ Room Owner Control Unlocked";
  } else if (publicControl) {
    statusMsg.innerText = "🎧 Friends Control Enabled";
  } else {
    statusMsg.innerText = "🎧 Listening Mode (Guest)";
  }

  [prevBtn, nextBtn, playPauseBtn].forEach(b => b.classList.toggle("locked", !canControl()));
  progressBar.classList.toggle("disabled", !canControl());
}

// Join room on connection
socket.emit("joinRoom", { roomId: roomCode, username, password });

// Give real feedback instead of leaving "Connecting..." on screen forever if
// something goes wrong (this also covers free-hosting cold starts, where the
// server can take up to ~50s to wake up on the first request).
let slowConnectHint = setTimeout(() => {
  statusMsg.innerText = "⚠️ Still connecting — server may be waking up, hang tight...";
}, 8000);

socket.on("connect_error", (err) => {
  console.error("Socket connection error:", err.message);
  statusMsg.innerText = "⚠️ Connection error — retrying...";
});

socket.on("disconnect", () => {
  statusMsg.innerText = "⚠️ Disconnected — reconnecting...";
});

socket.on("permissions", (data) => {
  clearTimeout(slowConnectHint);
  isOwner = data.isOwner;
  publicControl = data.publicControl;
  refreshControlUI();
  if (canControl()) loadSongLibrary();
});

socket.on("publicControlUpdated", (data) => {
  publicControl = data.publicControl;
  refreshControlUI();
  if (canControl()) loadSongLibrary();
});

socket.on("updateUsers", (users) => {
  const userSelect = document.getElementById("userSelect");
  if (userSelect) {
    userSelect.innerHTML = "";
    users.forEach(u => {
      const opt = document.createElement("option");
      opt.textContent = u;
      userSelect.appendChild(opt);
    });
  }
});

// ---------- Song library (pulled live from the GitHub repo by the server) ----------
let librariesLoaded = false;
async function populateSelect(category, selectId) {
  const select = document.getElementById(selectId);
  try {
    const res = await fetch(`/api/songs/${category}`);
    const songs = await res.json();
    select.innerHTML = "";
    if (!Array.isArray(songs) || songs.length === 0) {
      select.innerHTML = "<option>No songs found</option>";
      return [];
    }
    songs.forEach(song => {
      const opt = document.createElement("option");
      opt.value = song.url; // raw.githubusercontent.com link
      opt.textContent = song.name;
      select.appendChild(opt);
    });
    return songs;
  } catch (e) {
    select.innerHTML = "<option>Failed to load</option>";
    console.error(`Could not load ${category} songs:`, e);
    return [];
  }
}

function loadSongLibrary() {
  if (librariesLoaded) return;
  librariesLoaded = true;
  populateSelect("tamil", "tamilSongs").then(songs => { tamilList = songs; });
  populateSelect("english", "englishSongs").then(songs => { englishList = songs; });
}

function locateInLibrary(url) {
  let idx = tamilList.findIndex(s => s.url === url);
  if (idx !== -1) return { list: tamilList, index: idx };
  idx = englishList.findIndex(s => s.url === url);
  if (idx !== -1) return { list: englishList, index: idx };
  return null;
}

function playQueueIndex(list, index) {
  if (!list || list.length === 0) return;
  const wrapped = ((index % list.length) + list.length) % list.length;
  const song = list[wrapped];
  socket.emit("playSong", { roomId: roomCode, song: song.url, songName: song.name, time: 0 });
}

// YouTube API Load
const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);
window.onYouTubeIframeAPIReady = function() {
  ytPlayer = new YT.Player("ytPlayer", {
    height: "1", width: "1", videoId: "",
    playerVars: { autoplay: 1, controls: 0 },
    events: {
      onReady: () => { ytReady = true; },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.ENDED) {
          // No auto-playlist for one-off YouTube videos — just reset to idle
          isPlayingState = false;
          setPlayPauseIcon(false);
        }
      }
    }
  });
};

// ---------- UI helpers ----------
function formatTime(s) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function updateProgressUI(current, duration) {
  curTimeEl.textContent = formatTime(current);
  durTimeEl.textContent = formatTime(duration);
  const pct = duration > 0 ? (current / duration) * 100 : 0;
  progressFill.style.width = `${Math.min(pct, 100)}%`;
}

function setPlayPauseIcon(playing) {
  playIcon.style.display = playing ? "none" : "block";
  pauseIcon.style.display = playing ? "block" : "none";
}

setInterval(() => {
  if (activeSource === "audio" && !player.paused) {
    updateProgressUI(player.currentTime, player.duration || 0);
  } else if (activeSource === "yt" && ytReady && ytPlayer.getCurrentTime) {
    updateProgressUI(ytPlayer.getCurrentTime(), ytPlayer.getDuration());
  }
}, 500);

// ---------- Incoming playback events ----------
socket.on("playSong", (data) => {
  activeSource = "audio";
  isPlayingState = !!data.playing;
  trackTitle.textContent = data.songName || "Audio";
  setPlayPauseIcon(isPlayingState);

  if (player.src !== data.song) {
    player.src = data.song;
  }
  player.currentTime = data.time || 0;
  if (isPlayingState) {
    player.play().catch(e => console.log(e));
  } else {
    player.pause();
  }

  currentQueue = locateInLibrary(data.song);
});

socket.on("playYT", (data) => {
  activeSource = "yt";
  isPlayingState = !!data.playing;
  currentYtId = data.videoId;
  trackTitle.textContent = "YouTube Video";
  setPlayPauseIcon(isPlayingState);
  currentQueue = null; // no auto-playlist for one-off YouTube videos

  if (ytReady && ytPlayer.loadVideoById) {
    ytPlayer.loadVideoById({ videoId: data.videoId, startSeconds: data.time || 0 });
    if (!isPlayingState) setTimeout(() => ytPlayer.pauseVideo && ytPlayer.pauseVideo(), 400);
    setTimeout(() => {
      const info = ytPlayer.getVideoData && ytPlayer.getVideoData();
      if (info && info.title) trackTitle.textContent = info.title;
    }, 1000);
  }
});

socket.on("pauseSong", () => {
  isPlayingState = false;
  setPlayPauseIcon(false);
  player.pause();
  if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
});

socket.on("syncTime", (data) => {
  // Correct drift on non-controller clients only
  if (canControl()) return;
  if (activeSource === "audio" && player.src === data.song && Math.abs(player.currentTime - data.time) > 2) {
    player.currentTime = data.time;
  } else if (activeSource === "yt" && ytReady && ytPlayer.getCurrentTime) {
    if (Math.abs(ytPlayer.getCurrentTime() - data.time) > 2) ytPlayer.seekTo(data.time, true);
  }
});

// Periodically broadcast playback position so late joiners / drift get corrected
setInterval(() => {
  if (!canControl() || !isPlayingState) return;
  if (activeSource === "audio" && player.src) {
    socket.emit("syncTime", { roomId: roomCode, song: player.src, time: player.currentTime });
  } else if (activeSource === "yt" && ytReady && ytPlayer.getCurrentTime) {
    socket.emit("syncTime", { roomId: roomCode, song: currentYtId, time: ytPlayer.getCurrentTime() });
  }
}, 5000);

// Auto-delete uploaded files once they finish playing + auto-advance the queue
player.addEventListener("ended", () => {
  if (player.src && player.src.includes("/uploads/")) {
    const url = new URL(player.src);
    socket.emit("deleteFinishedSong", { songUrl: url.pathname });
  }
  if (canControl() && currentQueue) {
    playQueueIndex(currentQueue.list, currentQueue.index + 1);
  } else {
    isPlayingState = false;
    setPlayPauseIcon(false);
  }
});

// ---------- Controls ----------
document.addEventListener("DOMContentLoaded", () => {
  const tamilSelect = document.getElementById("tamilSongs");
  const englishSelect = document.getElementById("englishSongs");

  toggleControlBtn?.addEventListener("click", () => {
    if (!isOwner) return;
    socket.emit("togglePublicControl", { roomId: roomCode });
  });

  document.getElementById("playTamilBtn")?.addEventListener("click", () => {
    if (!canControl() || !tamilSelect.value) return;
    const song = tamilSelect.value;
    const name = tamilSelect.options[tamilSelect.selectedIndex].text;
    socket.emit("playSong", { roomId: roomCode, song, songName: name, time: 0 });
  });

  document.getElementById("playEnglishBtn")?.addEventListener("click", () => {
    if (!canControl() || !englishSelect.value) return;
    const song = englishSelect.value;
    const name = englishSelect.options[englishSelect.selectedIndex].text;
    socket.emit("playSong", { roomId: roomCode, song, songName: name, time: 0 });
  });

  document.getElementById("playLocalBtn")?.addEventListener("click", async () => {
    if (!canControl()) return;
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    if (!file) return alert("Choose a local song first!");

    const formData = new FormData();
    formData.append("song", file);
    try {
      const res = await fetch("/upload", { method: "POST", body: formData });
      const data = await res.json();
      socket.emit("playSong", { roomId: roomCode, song: data.url, songName: data.name, time: 0 });
    } catch (e) {
      alert("❌ Upload failed");
    }
  });

  document.getElementById("playYTBtn")?.addEventListener("click", () => {
    if (!canControl()) return;
    const link = document.getElementById("ytLink").value.trim();
    const videoId = link.includes("v=") ? link.split("v=")[1].substring(0, 11) : link;
    if (videoId) {
      socket.emit("playYT", { roomId: roomCode, videoId, time: 0 });
    }
  });

  // ---- Unified player controls ----
  playPauseBtn.addEventListener("click", () => {
    if (!canControl() || !activeSource) return;
    if (isPlayingState) {
      socket.emit("pauseSong", { roomId: roomCode });
    } else {
      socket.emit("resumeSong", { roomId: roomCode });
    }
  });

  prevBtn.addEventListener("click", () => {
    if (!canControl() || !currentQueue) return;
    playQueueIndex(currentQueue.list, currentQueue.index - 1);
  });

  nextBtn.addEventListener("click", () => {
    if (!canControl() || !currentQueue) return;
    playQueueIndex(currentQueue.list, currentQueue.index + 1);
  });

  progressBar.addEventListener("click", (e) => {
    if (!canControl() || !activeSource) return;
    const rect = progressBar.getBoundingClientRect();
    const pct = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);

    if (activeSource === "audio" && player.duration) {
      const t = pct * player.duration;
      socket.emit("playSong", { roomId: roomCode, song: player.src, songName: trackTitle.textContent, time: t });
    } else if (activeSource === "yt" && ytReady && ytPlayer.getDuration) {
      const t = pct * ytPlayer.getDuration();
      socket.emit("playYT", { roomId: roomCode, videoId: currentYtId, time: t });
    }
  });
});

} // end initRoom()
