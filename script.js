/* ============================================================
   RANSY WEATHER DASHBOARD v2 — script.js
   Fixed time-based sky | Music player | Charts | Suggestions
   ============================================================ */

/* ----------------------------------------------------------
   LOADING SCREEN
   ---------------------------------------------------------- */
const LOADING_TIPS = [
  "TIP: Ghasts can only be hurt by reflecting their own fireballs.",
  "TIP: Steve's favorite food is a golden apple. Very nutritious.",
  "TIP: Humidity above 80% feels like walking through a cloud.",
  "TIP: Alex was added in Minecraft 1.8. She is just as strong as Steve.",
  "TIP: Never dig straight down. Ever. Seriously.",
  "TIP: High temperature + high humidity = heat index danger.",
  "TIP: Ghasts make crying sounds because they are sad about the weather.",
  "TIP: Press F3 to see coordinates. Useful in caves AND in dashboards.",
  "TIP: ESP32 sensors work best when kept away from direct sunlight.",
];

function startLoadingScreen() {
  const bar    = document.getElementById('loadingBar');
  const pct    = document.getElementById('loadingPct');
  const tip    = document.getElementById('loadingTip');
  const screen = document.getElementById('loading-screen');

  tip.textContent = LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)];

  let progress = 0;
  const interval = setInterval(() => {
    const inc = Math.random() * 3.5 + 0.8;
    progress = Math.min(progress + inc, 100);
    bar.style.width = progress + '%';
    pct.textContent = Math.floor(progress) + '%';

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        screen.classList.add('fade-out');
        setTimeout(() => { screen.style.display = 'none'; }, 700);
      }, 350);
    }
  }, 55);
}

/* ----------------------------------------------------------
   TIME-BASED SKY (Philippines local time — uses browser clock)
   hour 0-5   → night
   hour 6-8   → morning
   hour 9-17  → day
   hour 18-20 → sunset
   hour 21-23 → evening/night
   ---------------------------------------------------------- */
const SKY_PERIODS = {
  night: {
    skyClass: 'sky-night',
    stars: 1.0, clouds: 0.25, horizon: 0.0,
    sunOpacity: 0, moonOpacity: 1,
    sunLeft: '75%', sunBottom: '58%',
    moonLeft: '72%', moonBottom: '55%',
    label: 'NIGHT', icon: '🌙',
  },
  morning: {
    skyClass: 'sky-morning',
    stars: 0.15, clouds: 0.75, horizon: 0.9,
    sunOpacity: 1, moonOpacity: 0,
    sunLeft: '16%', sunBottom: '32%',
    moonLeft: '16%', moonBottom: '32%',
    label: 'MORNING', icon: '🌅',
  },
  day: {
    skyClass: 'sky-day',
    stars: 0.0, clouds: 1.0, horizon: 0.0,
    sunOpacity: 1, moonOpacity: 0,
    sunLeft: '62%', sunBottom: '52%',
    moonLeft: '62%', moonBottom: '52%',
    label: 'DAYTIME', icon: '☀️',
  },
  sunset: {
    skyClass: 'sky-sunset',
    stars: 0.25, clouds: 0.7, horizon: 1.0,
    sunOpacity: 1, moonOpacity: 0,
    sunLeft: '50%', sunBottom: '22%',
    moonLeft: '50%', moonBottom: '22%',
    label: 'SUNSET', icon: '🌄',
  },
  evening: {
    skyClass: 'sky-evening',
    stars: 0.95, clouds: 0.2, horizon: 0.0,
    sunOpacity: 0, moonOpacity: 1,
    sunLeft: '70%', sunBottom: '50%',
    moonLeft: '68%', moonBottom: '50%',
    label: 'EVENING', icon: '🌙',
  },
};

function getPeriod(hour) {
  if (hour >= 0  && hour <= 5)  return SKY_PERIODS.night;
  if (hour >= 6  && hour <= 8)  return SKY_PERIODS.morning;
  if (hour >= 9  && hour <= 17) return SKY_PERIODS.day;
  if (hour >= 18 && hour <= 20) return SKY_PERIODS.sunset;
  return SKY_PERIODS.evening;  // 21–23
}

function updateSky() {
  const now  = new Date();
  const hour = now.getHours();
  const cfg  = getPeriod(hour);

  // Sky class
  const skyEl = document.getElementById('skyBg');
  skyEl.className = 'sky-bg ' + cfg.skyClass;

  // Stars
  document.getElementById('starsEl').style.opacity = cfg.stars;

  // Clouds
  document.querySelectorAll('.cloud').forEach(c => c.style.opacity = cfg.clouds);

  // Horizon glow
  document.getElementById('horizonGlow').style.opacity = cfg.horizon;

  // Sun
  const sun = document.getElementById('sunEl');
  sun.style.opacity = cfg.sunOpacity;
  sun.style.left    = cfg.sunLeft;
  sun.style.bottom  = cfg.sunBottom;

  // Moon
  const moon = document.getElementById('moonEl');
  moon.style.opacity = cfg.moonOpacity;
  moon.style.left    = cfg.moonLeft;
  moon.style.bottom  = cfg.moonBottom;

  // Horizon glow colour
  const hg = document.getElementById('horizonGlow');
  if (cfg === SKY_PERIODS.morning) {
    hg.style.background = 'linear-gradient(180deg,transparent 0%,rgba(255,190,80,0.3) 40%,rgba(255,130,30,0.5) 70%,rgba(200,60,0,0.6) 100%)';
  } else if (cfg === SKY_PERIODS.sunset) {
    hg.style.background = 'linear-gradient(180deg,transparent 0%,rgba(255,120,0,0.32) 40%,rgba(255,80,0,0.52) 70%,rgba(180,40,0,0.65) 100%)';
  }

  // Time badge
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('timeBadgeTime').textContent   = timeStr;
  document.getElementById('timeBadgePeriod').textContent = cfg.icon + ' ' + cfg.label;
}

function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const el = document.getElementById('timeBadgeTime');
  if (el) el.textContent = timeStr;
}

/* ----------------------------------------------------------
   MUSIC PLAYER
   Uses the Web Audio API to generate Minecraft-style
   chiptune notes (no external file needed).
   A real .ogg / .mp3 can be swapped in via the <audio> tag.
   ---------------------------------------------------------- */
let audioCtx    = null;
let musicPlaying = false;
let musicInterval = null;
let volumeLevel   = 0.35;

// Minecraft C418-inspired note sequences (frequencies in Hz)
const MC_MELODY = [
  261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 392.00, 349.23,
  329.63, 293.66, 261.63, 246.94, 220.00, 246.94, 261.63, 293.66,
  329.63, 392.00, 440.00, 493.88, 440.00, 392.00, 349.23, 329.63,
  293.66, 261.63, 220.00, 196.00, 220.00, 246.94, 261.63, 293.66,
];
let melodyIndex = 0;

const TRACK_NAMES = ['Pigstep — Lena Raine'];
let trackIndex = 0;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playNote(freq, duration, delay) {
  const ctx  = getAudioCtx();
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

  gain.gain.setValueAtTime(0, ctx.currentTime + delay);
  gain.gain.linearRampToValueAtTime(volumeLevel * 0.35, ctx.currentTime + delay + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration - 0.05);

  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

function startMelody() {
  musicInterval = setInterval(() => {
    const freq = MC_MELODY[melodyIndex % MC_MELODY.length];
    playNote(freq, 0.55, 0);
    // soft harmony
    playNote(freq * 1.5, 0.45, 0.06);
    melodyIndex++;
  }, 600);
}

function stopMelody() {
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
}

function toggleMusic() {
  const btn    = document.getElementById('musicToggle');
  const status = document.getElementById('musicStatus');
  const note   = document.getElementById('musicNote');

  musicPlaying = !musicPlaying;

  if (musicPlaying) {
    getAudioCtx().resume();
    startMelody();
    btn.textContent    = '[ ⏸ PAUSE ]';
    status.textContent = '♪ PLAYING';
    note.style.animationPlayState = 'running';
  } else {
    stopMelody();
    btn.textContent    = '[ ▶ PLAY ]';
    status.textContent = '⏸ PAUSED';
    note.style.animationPlayState = 'paused';
  }
}

function setVolume(val) {
  volumeLevel = parseFloat(val) / 100;
  document.getElementById('volDisplay').textContent = val + '%';
}

/* ----------------------------------------------------------
   CHARTS
   ---------------------------------------------------------- */
const LABELS    = ['12:00','12:05','12:10','12:15','12:20','12:25','12:30','12:35','12:40','12:45','12:50','12:55'];
const TEMP_DATA = [26.2, 27.1, 27.8, 28.4, 29.0, 28.7, 28.9, 29.2, 28.6, 28.1, 27.9, 28.4];
const HUM_DATA  = [72, 74, 76, 78, 80, 79, 77, 82, 84, 81, 78, 78];

function buildCharts() {
  const base = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1200, easing: 'easeInOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#000', borderWidth: 2,
        titleFont: { family: "'Press Start 2P'", size: 9 },
        bodyFont:  { family: "'Press Start 2P'", size: 9 },
        padding: 12,
      }
    },
    scales: {
      x: {
        ticks: { color: '#777', font: { family: "'Press Start 2P'", size: 6 } },
        grid:  { color: 'rgba(255,255,255,0.04)' },
      }
    }
  };

  tempChartRef = new Chart(document.getElementById('tempChart'), {
    type: 'line',
    data: {
      labels: LABELS,
      datasets: [{
        data: TEMP_DATA,
        borderColor: '#ff7043', backgroundColor: 'rgba(255,112,67,0.18)',
        borderWidth: 2.5, pointRadius: 5,
        pointBackgroundColor: '#ff7043', pointBorderColor: '#000', pointBorderWidth: 2,
        fill: true, tension: 0, stepped: true,
      }]
    },
    options: {
      ...base,
      plugins: { ...base.plugins, tooltip: { ...base.plugins.tooltip, borderColor: '#ff7043', titleColor: '#ff7043', bodyColor: '#ffee58' } },
      scales: { x: base.scales.x, y: { min: 22, max: 34, ticks: { color: '#ff7043', font: { family: "'Press Start 2P'", size: 6 }, stepSize: 2 }, grid: { color: 'rgba(255,112,67,0.08)' } } }
    }
  });

  humChartRef = new Chart(document.getElementById('humChart'), {
    type: 'line',
    data: {
      labels: LABELS,
      datasets: [{
        data: HUM_DATA,
        borderColor: '#29b6f6', backgroundColor: 'rgba(41,182,246,0.18)',
        borderWidth: 2.5, pointRadius: 5,
        pointBackgroundColor: '#29b6f6', pointBorderColor: '#000', pointBorderWidth: 2,
        fill: true, tension: 0, stepped: true,
      }]
    },
    options: {
      ...base,
      plugins: { ...base.plugins, tooltip: { ...base.plugins.tooltip, borderColor: '#29b6f6', titleColor: '#29b6f6', bodyColor: '#ffee58' } },
      scales: { x: base.scales.x, y: { min: 70, max: 88, ticks: { color: '#29b6f6', font: { family: "'Press Start 2P'", size: 6 }, stepSize: 2 }, grid: { color: 'rgba(41,182,246,0.08)' } } }
    }
  });
}

/* ----------------------------------------------------------
   READINGS TABLE
   ---------------------------------------------------------- */
function buildReadings() {
  const tbody    = document.getElementById('readings-body');
  const reversed = [...LABELS].reverse();
  const statuses = ['NORMAL','NORMAL','HIGH HUM','NORMAL','NORMAL','NORMAL'];

  reversed.slice(0, 6).forEach((t, i) => {
    const tr   = document.createElement('tr');
    const high = statuses[i] === 'HIGH HUM';
    tr.innerHTML = `
      <td>${t}</td>
      <td>${TEMP_DATA[LABELS.length - 1 - i].toFixed(1)}</td>
      <td>${HUM_DATA[LABELS.length - 1 - i]}</td>
      <td style="color:${high ? '#ff7043' : '#66bb6a'}">${statuses[i]}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ----------------------------------------------------------
   SUGGESTIONS
   ---------------------------------------------------------- */
const ALL_SUGGESTIONS = [
  { emoji:'👕', title:'WEAR LIGHT CLOTHES',  badge:'COMFORT',     accent:'#ffee58', desc:'Temp is 28.4°C — wear lightweight, breathable clothing. Cotton or linen works best.',       tip:'TIP: Light colors reflect heat. Avoid dark fabric outdoors.' },
  { emoji:'💧', title:'STAY HYDRATED',        badge:'HEALTH',      accent:'#29b6f6', desc:'High humidity (78%) slows sweat evaporation. Drink water every 20 mins.',                   tip:'TIP: Add a pinch of salt to water for better electrolyte balance.' },
  { emoji:'🪟', title:'OPEN YOUR WINDOWS',    badge:'VENTILATION', accent:'#66bb6a', desc:'Humidity is elevated indoors. Open windows to improve airflow and reduce stuffiness.',       tip:'TIP: Best ventilation time is early morning when air is cooler.' },
  { emoji:'🌂', title:'BRING AN UMBRELLA',    badge:'WEATHER PREP',accent:'#ce93d8', desc:'High humidity often precedes rain. Carry an umbrella just in case.',                        tip:'TIP: 78%+ humidity + rising temp = likely afternoon rain.' },
  { emoji:'❄️', title:'USE A FAN OR AC',      badge:'COOLING',     accent:'#80deea', desc:'Heat index is above comfortable range. A fan or AC will significantly reduce discomfort.', tip:'TIP: Set AC to 24–26°C to save power while staying cool.' },
  { emoji:'🏠', title:'STAY INDOORS 12–3PM', badge:'SAFETY',      accent:'#ffb74d', desc:'Peak heat hours are midday. Avoid outdoor activities between 12PM and 3PM.',               tip:'TIP: If outside, seek shade and wear a hat or cap.' },
  { emoji:'🌿', title:'WATER YOUR PLANTS',    badge:'GARDEN',      accent:'#aed581', desc:'Hot and humid weather increases plant transpiration. Water in the evening.',               tip:'TIP: Avoid watering under direct sun — leaves can burn.' },
  { emoji:'😴', title:'COOL DOWN FOR SLEEP',  badge:'SLEEP',       accent:'#9fa8da', desc:'High overnight humidity disrupts sleep. Cool your room to 22–24°C before bed.',            tip:'TIP: A damp cloth on forehead lowers body temp quickly.' },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderSuggestions() {
  const grid  = document.getElementById('suggestGrid');
  const picks = shuffle(ALL_SUGGESTIONS).slice(0, 4);
  grid.innerHTML = picks.map(s => `
    <div class="suggest-card" style="--accent:${s.accent}">
      <div class="suggest-card-top">
        <span class="suggest-emoji">${s.emoji}</span>
        <div class="suggest-card-title">${s.title}</div>
      </div>
      <div class="suggest-badge">${s.badge}</div>
      <div class="suggest-desc">${s.desc}</div>
      <div class="suggest-tip">${s.tip}</div>
    </div>
  `).join('');
}

function refreshSuggestions() {
  const grid = document.getElementById('suggestGrid');
  grid.style.transition = 'opacity 0.2s, transform 0.2s';
  grid.style.opacity    = '0';
  grid.style.transform  = 'translateY(8px)';
  setTimeout(() => {
    renderSuggestions();
    grid.style.opacity   = '1';
    grid.style.transform = 'translateY(0)';
  }, 220);
}

function dismissAlert() {
  const el = document.getElementById('alertToast');
  if (el) {
    el.style.transition = 'opacity 0.3s, transform 0.3s';
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(-8px)';
    setTimeout(() => el.remove(), 350);
  }
}

/* ----------------------------------------------------------
   INIT
   ---------------------------------------------------------- */
/* ----------------------------------------------------------
   SUPABASE CONFIG
   ---------------------------------------------------------- */
const SUPABASE_URL = 'https://tzspnjmksbfloelujzjc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6c3Buam1rc2JmbG9lbHVqempjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4ODExNDYsImV4cCI6MjA4ODQ1NzE0Nn0.6ymNLXSgyE50BlU1cgD4czM2R5S1jhpHN5ykfr2Q0rc';

let latestData = [];
let tempChartRef = null;
let humChartRef  = null;

/* ----------------------------------------------------------
   TIME HELPERS (PH UTC+8)
   ---------------------------------------------------------- */
function toPH(dateStr) {
  const fixed = dateStr.replace(' ','T').replace(/\.\d+$/, '') + 'Z';
  return new Date(new Date(fixed).getTime() + 8 * 3600000);
}
function fmtTime(dateStr) {
  const d = toPH(dateStr);
  let h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2,'0');
  const s = String(d.getUTCSeconds()).padStart(2,'0');
  const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return `${h}:${m}:${s} ${ap}`;
}
function fmtDateTime(dateStr) {
  const d = toPH(dateStr);
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2,'0');
  const s = String(d.getUTCSeconds()).padStart(2,'0');
  const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return `${mo[d.getUTCMonth()]} ${d.getUTCDate()} - ${h}:${m}:${s} ${ap}`;
}

/* ----------------------------------------------------------
   FETCH FROM SUPABASE
   ---------------------------------------------------------- */
async function fetchSensorData() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/sensor_data?select=*&order=created_at.desc&limit=20`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    if (!data.length) return;
    latestData = data;

    const latest = data[0];
    const temp = latest.temperature.toFixed(1);
    const hum  = latest.humidity.toFixed(1);

    // Update cards
    document.querySelector('.temp-card .card-value').textContent = temp + '°C';
    document.querySelector('.hum-card  .card-value').textContent = hum  + '%';
    document.querySelector('.temp-card .card-status').textContent = '● LIVE · ' + fmtTime(latest.created_at);
    document.querySelector('.hum-card  .card-status').textContent = '● LIVE · ' + fmtTime(latest.created_at);

    // Stats
    const temps = data.map(d => d.temperature);
    const hums  = data.map(d => d.humidity);
    const stats = document.querySelectorAll('.ms-value');
    if (stats[0]) stats[0].textContent = Math.max(...temps).toFixed(1) + '°C';
    if (stats[1]) stats[1].textContent = Math.min(...temps).toFixed(1) + '°C';
    if (stats[2]) stats[2].textContent = Math.max(...hums).toFixed(1) + '%';
    if (stats[3]) stats[3].textContent = Math.min(...hums).toFixed(1) + '%';

    // Charts
    const rev    = [...data].reverse();
    const labels = rev.map(d => fmtTime(d.created_at));
    if (tempChartRef) { tempChartRef.data.labels = labels; tempChartRef.data.datasets[0].data = rev.map(d => d.temperature); tempChartRef.update(); }
    if (humChartRef)  { humChartRef.data.labels  = labels; humChartRef.data.datasets[0].data  = rev.map(d => d.humidity);    humChartRef.update(); }

    // Table
    const tbody = document.getElementById('readings-body');
    tbody.innerHTML = data.slice(0, 8).map(d => {
      const highHum = d.humidity > 80;
      return `<tr>
        <td>${fmtTime(d.created_at)}</td>
        <td>${d.temperature.toFixed(1)}</td>
        <td>${d.humidity.toFixed(1)}</td>
        <td style="color:${highHum ? '#ff7043' : '#66bb6a'}">${highHum ? 'HIGH HUM' : 'NORMAL'}</td>
      </tr>`;
    }).join('');

    // Ticker live update
    const tickers = document.querySelectorAll('.ticker-item');
    tickers.forEach((t, i) => {
      if (i % 2 === 1) t.textContent = `🌡️ TEMP: ${temp}°C · 💧 HUMIDITY: ${hum}% · ☀️ SKY UPDATES WITH YOUR LOCAL TIME · ♪ PRESS PLAY FOR MINECRAFT MUSIC`;
    });

    // Comfort bar
    const comfort = Math.max(0, Math.min(100, 100 - Math.abs(parseFloat(temp) - 26) * 5 - Math.abs(parseFloat(hum) - 60) * 0.5));
    const bar = document.querySelector('.comfort-bar-fill');
    const score = document.querySelector('.comfort-score');
    if (bar)   bar.style.width = comfort.toFixed(0) + '%';
    if (score) score.textContent = comfort.toFixed(0) + ' / 100';

  } catch(e) {
    console.error('Supabase fetch error:', e);
  }
}

/* ----------------------------------------------------------
   CSV EXPORT
   ---------------------------------------------------------- */
function downloadCSV(type) {
  if (!latestData.length) return alert('No data yet!');
  let rows, filename;
  if (type === 'temperature') {
    rows = [['ID','Temperature (°C)','Date & Time (PH)']];
    latestData.forEach(d => rows.push([d.id, d.temperature.toFixed(1), fmtDateTime(d.created_at)]));
    filename = `temperature_${new Date().toISOString().slice(0,10)}.csv`;
  } else {
    rows = [['ID','Humidity (%)','Date & Time (PH)']];
    latestData.forEach(d => rows.push([d.id, d.humidity.toFixed(1), fmtDateTime(d.created_at)]));
    filename = `humidity_${new Date().toISOString().slice(0,10)}.csv`;
  }
  const csv = rows.map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename; a.click();
}

/* ----------------------------------------------------------
   INIT
   ---------------------------------------------------------- */
window.addEventListener('DOMContentLoaded', () => {
  startLoadingScreen();

  updateSky();
  setInterval(updateSky, 30 * 1000);
  setInterval(updateClock, 1000);

  buildCharts();
  buildReadings();
  renderSuggestions();

  document.getElementById('musicTitle').textContent = TRACK_NAMES[0];

  // Fetch real sensor data
  fetchSensorData();
  setInterval(fetchSensorData, 5000);
});
