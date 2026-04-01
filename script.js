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
/* ----------------------------------------------------------
   TIME-BASED SKY — smooth sun/moon arc across the sky
   Sun rises at 6am (left horizon) → peaks noon (center top) → sets 6pm (right horizon)
   Moon rises 6pm → peaks midnight → sets 6am
   ---------------------------------------------------------- */

function getSkyPeriodName(hour) {
  if (hour >= 0  && hour <= 5)  return { label:'NIGHTTIME', icon:'🌙', skyClass:'sky-night',   stars:1.0,  clouds:0.25, horizon:0.0, sunVis:0, moonVis:1 };
  if (hour >= 6  && hour <= 8)  return { label:'MORNING',   icon:'🌅', skyClass:'sky-morning',  stars:0.15, clouds:0.75, horizon:0.9, sunVis:1, moonVis:0 };
  if (hour >= 9  && hour <= 17) return { label:'DAYTIME',   icon:'☀️', skyClass:'sky-day',      stars:0.0,  clouds:1.0,  horizon:0.0, sunVis:1, moonVis:0 };
  if (hour >= 18 && hour <= 20) return { label:'SUNSET',    icon:'🌄', skyClass:'sky-sunset',   stars:0.25, clouds:0.7,  horizon:1.0, sunVis:1, moonVis:0 };
  return                               { label:'NIGHTTIME', icon:'🌙', skyClass:'sky-evening',  stars:0.95, clouds:0.2,  horizon:0.0, sunVis:0, moonVis:1 };
}

/* Compute sun/moon position from time
   Sun arc: 6am=left(8%) → noon=center-top(50%,75%) → 6pm=right(92%)
   Moon arc: 6pm=left(8%) → midnight=center-top(50%,72%) → 6am=right(92%) */
function getCelestialPos(now) {
  const h = now.getHours();
  const m = now.getMinutes();
  const totalMins = h * 60 + m;

  // Sun: active 6am(360) to 6pm(1080), arc across sky
  const sunStart = 6 * 60, sunEnd = 18 * 60;
  let sunLeft = '50%', sunBottom = '-10%';
  if (totalMins >= sunStart && totalMins <= sunEnd) {
    const t = (totalMins - sunStart) / (sunEnd - sunStart); // 0→1
    const angle = Math.PI * t; // 0 → PI (left to right arc)
    const lx = 8 + t * 84; // 8% to 92%
    const by = 20 + Math.sin(angle) * 55; // bottom: rises to 75% at noon
    sunLeft   = lx.toFixed(1) + '%';
    sunBottom = by.toFixed(1) + '%';
  }

  // Moon: active 6pm(1080) to 6am next day(360+1440=1800), arc across sky
  // Normalise: 6pm=0, midnight=360, 6am=720
  let moonMins = totalMins >= 18 * 60 ? totalMins - 18 * 60 : totalMins + 6 * 60;
  const moonDuration = 12 * 60;
  const mt = Math.min(moonMins / moonDuration, 1);
  const moonAngle = Math.PI * mt;
  const mlx = 8 + mt * 84;
  const mby = 18 + Math.sin(moonAngle) * 50;
  const moonLeft   = mlx.toFixed(1) + '%';
  const moonBottom = mby.toFixed(1) + '%';

  return { sunLeft, sunBottom, moonLeft, moonBottom };
}

function updateSky() {
  const now  = new Date();
  const hour = now.getHours();
  const cfg  = getSkyPeriodName(hour);
  const pos  = getCelestialPos(now);

  // Sky class
  const skyEl = document.getElementById('skyBg');
  skyEl.className = 'sky-bg ' + cfg.skyClass;

  // Stars
  document.getElementById('starsEl').style.opacity = cfg.stars;

  // Clouds
  document.querySelectorAll('.cloud').forEach(c => c.style.opacity = cfg.clouds);

  // Horizon glow
  const hg = document.getElementById('horizonGlow');
  hg.style.opacity = cfg.horizon;
  if (cfg.skyClass === 'sky-morning') {
    hg.style.background = 'linear-gradient(180deg,transparent 0%,rgba(255,190,80,0.3) 40%,rgba(255,130,30,0.5) 70%,rgba(200,60,0,0.6) 100%)';
  } else if (cfg.skyClass === 'sky-sunset') {
    hg.style.background = 'linear-gradient(180deg,transparent 0%,rgba(255,120,0,0.32) 40%,rgba(255,80,0,0.52) 70%,rgba(180,40,0,0.65) 100%)';
  }

  // Sun — smooth position
  const sun = document.getElementById('sunEl');
  sun.style.opacity = cfg.sunVis;
  sun.style.left    = pos.sunLeft;
  sun.style.bottom  = pos.sunBottom;

  // Moon — smooth position
  const moon = document.getElementById('moonEl');
  moon.style.opacity = cfg.moonVis;
  moon.style.left    = pos.moonLeft;
  moon.style.bottom  = pos.moonBottom;

  // Time badge
  updateClock();
  const periodEl = document.getElementById('timeBadgePeriod2');
  if (periodEl) periodEl.textContent = cfg.icon + ' ' + cfg.label;
}

function updateClock() {
  const now = new Date();
  let h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const timeStr = `${h}:${m}:${s} ${ap}`;
  const el = document.getElementById('timeBadgeTime2');
  if (el) el.textContent = timeStr;
}

/* ----------------------------------------------------------
   MUSIC PLAYER — Real MP3 (Pigstep Stereo Mix)
   Uses HTML5 Audio element for actual MP3 playback
   ---------------------------------------------------------- */
let pigstepAudio = null;
let musicPlaying = false;

function initAudio() {
  if (!pigstepAudio) {
    pigstepAudio = new Audio('951722_Pigstep-Remix.mp3');
    pigstepAudio.loop   = true;
    pigstepAudio.volume = 0.35;
  }
}

function toggleMusic() {
  initAudio();
  const btn    = document.getElementById('musicToggle');
  const status = document.getElementById('musicStatus');
  const note   = document.getElementById('musicNote');
  musicPlaying = !musicPlaying;
  if (musicPlaying) {
    pigstepAudio.play().catch(e => console.warn('Audio play blocked:', e));
    btn.textContent    = '[ ⏸ PAUSE ]';
    status.textContent = '♪ PLAYING';
    note.style.animationPlayState = 'running';
  } else {
    pigstepAudio.pause();
    btn.textContent    = '[ ▶ PLAY ]';
    status.textContent = '⏸ PAUSED';
    note.style.animationPlayState = 'paused';
  }
}

function setVolume(val) {
  initAudio();
  pigstepAudio.volume = parseFloat(val) / 100;
  document.getElementById('volDisplay').textContent = val + '%';
}

/* ----------------------------------------------------------
   SUPABASE CONFIG
   ---------------------------------------------------------- */
const SB_URL = 'https://tzspnjmksbfloelujzjc.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6c3Buam1rc2JmbG9lbHVqempjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4ODExNDYsImV4cCI6MjA4ODQ1NzE0Nn0.6ymNLXSgyE50BlU1cgD4czM2R5S1jhpHN5ykfr2Q0rc';
const SB_HEADERS = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

let latestData  = [];
let tempChartRef = null;
let humChartRef  = null;

/* ----------------------------------------------------------
   TIME HELPERS — Philippine Time UTC+8
   ---------------------------------------------------------- */
function toPH(str) {
  // Strip microseconds AND any timezone offset (+00, +00:00, -xx:xx, Z), add Z for UTC parse
  const clean = str
    .replace(' ', 'T')
    .replace(/\.\d+/, '')
    .replace(/[+-]\d{2}:?\d{2}$/, '')
    .replace(/Z$/, '');
  return new Date(new Date(clean + 'Z').getTime() + 8 * 3600000);
}
function fmtTime(str) {
  const d = toPH(str);
  let h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2,'0');
  const s = String(d.getUTCSeconds()).padStart(2,'0');
  const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return `${h}:${m}:${s} ${ap}`;
}
function fmtDateTime(str) {
  const d = toPH(str);
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2,'0');
  const s = String(d.getUTCSeconds()).padStart(2,'0');
  const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return `${mo[d.getUTCMonth()]} ${d.getUTCDate()} - ${h}:${m}:${s} ${ap}`;
}

/* ----------------------------------------------------------
   CHARTS — built empty, filled by Supabase data
   ---------------------------------------------------------- */
function buildCharts() {
  const baseOpts = (color, borderColor) => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: 'easeInOutCubic' },
    layout: { padding: { left: 8, right: 4, top: 4, bottom: 4 } },
    transitions: {
      active: { animation: { duration: 400 } }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#000', borderWidth: 2,
        borderColor: color, titleColor: color, bodyColor: '#ffee58',
        titleFont: { family: "'Press Start 2P'", size: 9 },
        bodyFont:  { family: "'Press Start 2P'", size: 9 },
        padding: 12,
        callbacks: { title: items => items[0].label }
      }
    },
    scales: {
      x: { ticks: { color: '#777', font: { family: "'Press Start 2P'", size: 6 }, maxTicksLimit: 8 }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color, font: { family: "'Press Start 2P'", size: 6 }, stepSize: 2 }, grid: { color: `rgba(${borderColor},0.08)` } }
    }
  });

  const tempOpts = baseOpts('#ff7043', '255,112,67');
  tempOpts.scales.y.min = 24;
  tempOpts.scales.y.max = 40;
  tempOpts.scales.y.ticks.stepSize = 2;
  tempChartRef = new Chart(document.getElementById('tempChart'), {
    type: 'line',
    data: { labels: [], datasets: [{ data: [], borderColor: '#ff7043', backgroundColor: 'rgba(255,112,67,0.18)', borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#ff7043', pointBorderColor: '#000', pointBorderWidth: 2, fill: true, tension: 0.35 }] },
    options: tempOpts
  });

  const humOpts = baseOpts('#29b6f6', '41,182,246');
  humOpts.scales.y.min = 40;
  humOpts.scales.y.max = 90;
  humOpts.scales.y.ticks.stepSize = 5;
  humChartRef = new Chart(document.getElementById('humChart'), {
    type: 'line',
    data: { labels: [], datasets: [{ data: [], borderColor: '#29b6f6', backgroundColor: 'rgba(41,182,246,0.18)', borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#29b6f6', pointBorderColor: '#000', pointBorderWidth: 2, fill: true, tension: 0.35 }] },
    options: humOpts
  });
}

/* ----------------------------------------------------------
   SUPABASE FETCH — main data pipeline
   ---------------------------------------------------------- */
async function fetchSensorData() {
  try {
    // Fetch latest 20 readings
    const res = await fetch(
      `${SB_URL}/rest/v1/sensor_data?select=*&order=created_at.desc&limit=20`,
      { headers: SB_HEADERS }
    );
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!data.length) return;

    latestData = data;

    // Fetch total count
    const countRes = await fetch(
      `${SB_URL}/rest/v1/sensor_data?select=id`,
      { headers: { ...SB_HEADERS, 'Prefer': 'count=exact', 'Range': '0-0' } }
    );
    const countRange = countRes.headers.get('content-range') || '';
    const totalCount = countRange.split('/')[1] || data.length;
    const totalEl = document.getElementById('totalReadings');
    if (totalEl) totalEl.textContent = Number(totalCount).toLocaleString();

    // Update LIVE badge
    const dot    = document.getElementById('liveDot');
    const status = document.getElementById('liveStatus');
    if (dot)    { dot.className = 'live-dot'; }
    if (status) { status.textContent = '● LIVE · ESP32 CONNECTED'; }

    // Last update time box
    const lu    = document.getElementById('lastUpdate');
    const luSub = document.getElementById('lastUpdateSub');
    if (lu)    lu.textContent    = fmtTime(data[0].created_at);
    if (luSub) luSub.textContent = 'ESP32 CONNECTED';

    // ── Latest reading → cards ────────────────────────────
    const latest = data[0];
    const temp   = parseFloat(latest.temperature);
    const hum    = parseFloat(latest.humidity);

    const tempCard  = document.querySelector('.temp-card .card-value');
    const humCard   = document.querySelector('.hum-card  .card-value');
    const tempStat  = document.querySelector('.temp-card .card-status');
    const humStat   = document.querySelector('.hum-card  .card-status');

    if (tempCard) tempCard.textContent = temp.toFixed(1) + '°C';
    if (humCard)  humCard.textContent  = hum.toFixed(1)  + '%';
    if (tempStat) tempStat.textContent = '● LIVE · ' + fmtTime(latest.created_at);
    if (humStat)  humStat.textContent  = '● LIVE · ' + fmtTime(latest.created_at);

    // ── Mini stats ────────────────────────────────────────
    const temps  = data.map(d => d.temperature);
    const hums   = data.map(d => d.humidity);
    const stats  = document.querySelectorAll('.ms-value');
    if (stats[0]) stats[0].textContent = Math.max(...temps).toFixed(1) + '°C';
    if (stats[1]) stats[1].textContent = Math.min(...temps).toFixed(1) + '°C';
    if (stats[2]) stats[2].textContent = Math.max(...hums).toFixed(1)  + '%';
    if (stats[3]) stats[3].textContent = Math.min(...hums).toFixed(1)  + '%';

    // ── Charts — smooth animated update ──────────────────
    const rev    = [...data].reverse();
    const labels = rev.map(d => fmtTime(d.created_at));

    if (tempChartRef) {
      tempChartRef.data.labels              = labels;
      tempChartRef.data.datasets[0].data   = rev.map(d => d.temperature);
      tempChartRef.update('active');
    }
    if (humChartRef) {
      humChartRef.data.labels              = labels;
      humChartRef.data.datasets[0].data   = rev.map(d => d.humidity);
      humChartRef.update('active');
    }

    // ── Ticker live values ────────────────────────────────
    document.querySelectorAll('.ticker-item').forEach((t, i) => {
      if (i % 2 === 1)
        t.textContent = `🌡️ TEMP: ${temp.toFixed(1)}°C · 💧 HUMIDITY: ${hum.toFixed(1)}% · ☀️ SKY UPDATES WITH YOUR LOCAL TIME · ♪ PRESS PLAY FOR MINECRAFT MUSIC`;
    });

    // ── Comfort index ─────────────────────────────────────
    const comfort = Math.max(0, Math.min(100,
      100 - Math.abs(temp - 26) * 5 - Math.abs(hum - 60) * 0.4
    ));
    const bar   = document.querySelector('.comfort-bar-fill');
    const score = document.querySelector('.comfort-score');
    if (bar)   bar.style.width = comfort.toFixed(0) + '%';
    if (score) score.textContent = comfort.toFixed(0) + ' / 100';

    // ── Alert toast ───────────────────────────────────────
    const alertMsg = document.querySelector('.alert-msg');
    if (alertMsg) alertMsg.textContent =
      `Current humidity ${hum.toFixed(0)}% — ${hum > 80 ? 'above comfort zone. Consider ventilating the area or using a dehumidifier.' : 'within normal range.'}`;

    // ── Readings table ────────────────────────────────────
    buildReadings(data);

  } catch (err) {
    console.error('Supabase fetch error:', err);
    const dot    = document.getElementById('liveDot');
    const status = document.getElementById('liveStatus');
    if (dot)    { dot.className = 'live-dot offline'; }
    if (status) { status.textContent = '● DISCONNECTED · CHECK ESP32'; }
    // Box 2: update sub-label to show ESP32 is offline (time stays as last known)
    const luSub = document.getElementById('lastUpdateSub');
    if (luSub) luSub.textContent = 'ESP32 OFFLINE';
  }
}

/* ----------------------------------------------------------
   READINGS TABLE — populated by real data
   ---------------------------------------------------------- */
function buildReadings(data) {
  if (!data) return;
  const tbody = document.getElementById('readings-body');
  tbody.innerHTML = data.slice(0, 8).map(d => {
    const highHum  = d.humidity > 80;
    const highTemp = d.temperature > 30;
    const status   = highHum ? 'HIGH HUM' : highTemp ? 'HIGH TEMP' : 'NORMAL';
    const color    = (highHum || highTemp) ? '#ff7043' : '#66bb6a';
    return `<tr>
      <td>${fmtTime(d.created_at)}</td>
      <td>${parseFloat(d.temperature).toFixed(1)}</td>
      <td>${parseFloat(d.humidity).toFixed(1)}</td>
      <td style="color:${color}">${status}</td>
    </tr>`;
  }).join('');
}

/* ----------------------------------------------------------
   CSV EXPORT
   ---------------------------------------------------------- */
function downloadCSV(type) {
  if (!latestData.length) return alert('No data to export yet!');
  let rows, filename;
  if (type === 'temperature') {
    rows = [['ID','Temperature (°C)','Date & Time (PH)']];
    latestData.forEach(d => rows.push([d.id, parseFloat(d.temperature).toFixed(1), fmtDateTime(d.created_at)]));
    filename = `temperature_${new Date().toISOString().slice(0,10)}.csv`;
  } else {
    rows = [['ID','Humidity (%)','Date & Time (PH)']];
    latestData.forEach(d => rows.push([d.id, parseFloat(d.humidity).toFixed(1), fmtDateTime(d.created_at)]));
    filename = `humidity_${new Date().toISOString().slice(0,10)}.csv`;
  }
  const csv = rows.map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename; a.click();
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
window.addEventListener('DOMContentLoaded', () => {
  startLoadingScreen();

  // Sky + clock — sky updates every 60s (sun moves per-minute), clock every 1s
  updateSky();
  setInterval(updateSky,   60 * 1000);
  setInterval(updateClock, 1000);

  // Build empty charts (data loaded by Supabase)
  buildCharts();
  renderSuggestions();

  // Music track label
  document.getElementById('musicTitle').textContent = 'Pigstep — Lena Raine';

  // Initial fetch then poll every 5 seconds
  fetchSensorData();
  setInterval(fetchSensorData, 5000);
});