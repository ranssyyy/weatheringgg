/* ============================================================
   RANSY WEATHER DASHBOARD — script.js
   Minecraft-themed | Time-based sky | Loading screen | Charts
   ============================================================ */

/* ----------------------------------------------------------
   LOADING SCREEN
   ---------------------------------------------------------- */
const LOADING_TIPS = [
  "TIP: Creepers will destroy your sensor if you leave it outside.",
  "TIP: Always carry a water bucket when near the Nether.",
  "TIP: Ender Dragons drop 12,000 XP on first kill.",
  "TIP: Humidity above 80% means rain is incoming. Stay inside.",
  "TIP: Steve uses an iron sword — it deals 6 damage.",
  "TIP: Never dig straight down. Or up. Especially not up.",
  "TIP: High temperature + high humidity = heat index danger.",
  "TIP: Press F3 to see coordinates. And maybe the weather.",
];

function startLoadingScreen() {
  const bar = document.getElementById('loadingBar');
  const pct = document.getElementById('loadingPct');
  const tip = document.getElementById('loadingTip');
  const screen = document.getElementById('loading-screen');

  tip.textContent = LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)];

  let progress = 0;
  const interval = setInterval(() => {
    // Randomize speed for realism
    const increment = Math.random() * 4 + 1;
    progress = Math.min(progress + increment, 100);
    bar.style.width = progress + '%';
    pct.textContent = Math.floor(progress) + '%';

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        screen.classList.add('fade-out');
        setTimeout(() => { screen.style.display = 'none'; }, 650);
      }, 400);
    }
  }, 60);
}

/* ----------------------------------------------------------
   TIME-BASED SKY SYSTEM
   ---------------------------------------------------------- */
const SKY_CONFIG = {
  //         hour range   class          sunLeft  sunBottom  showStars  cloudOpacity  horizonOpacity  description
  night:   { hours: [0,5],   cls: 'sky-night',  left:'72%', bottom:'55%', stars:1.0, clouds:0.3, horizon:0.0, label:'NIGHT',      icon:'🌙' },
  morning: { hours: [6,8],   cls: 'sky-morning', left:'18%', bottom:'35%', stars:0.2, clouds:0.7, horizon:0.8, label:'MORNING',    icon:'🌅' },
  day:     { hours: [9,17],  cls: 'sky-day',     left:'60%', bottom:'55%', stars:0.0, clouds:1.0, horizon:0.0, label:'DAYTIME',    icon:'☀️' },
  sunset:  { hours: [18,20], cls: 'sky-sunset',  left:'50%', bottom:'24%', stars:0.3, clouds:0.8, horizon:1.0, label:'SUNSET',     icon:'🌄' },
  evening: { hours: [21,23], cls: 'sky-night',   left:'68%', bottom:'48%', stars:0.9, clouds:0.2, horizon:0.0, label:'EVENING',    icon:'🌙' },
};

function getSkyPeriod(hour) {
  if (hour >= 0  && hour <= 5)  return SKY_CONFIG.night;
  if (hour >= 6  && hour <= 8)  return SKY_CONFIG.morning;
  if (hour >= 9  && hour <= 17) return SKY_CONFIG.day;
  if (hour >= 18 && hour <= 20) return SKY_CONFIG.sunset;
  return SKY_CONFIG.evening;
}

function updateSky() {
  const now = new Date();
  const hour = now.getHours();
  const min  = now.getMinutes();
  const sec  = now.getSeconds();

  const cfg = getSkyPeriod(hour);

  // Sky background
  const skyEl = document.getElementById('skyBg');
  skyEl.className = 'sky-bg ' + cfg.cls;

  // Stars visibility
  document.getElementById('starsEl').style.opacity = cfg.stars;

  // Clouds
  document.querySelectorAll('.cloud').forEach(c => c.style.opacity = cfg.clouds);

  // Horizon glow
  document.getElementById('horizonGlow').style.opacity = cfg.horizon;

  // Celestial body
  const sun  = document.getElementById('sunBody');
  const moon = document.getElementById('moonBody');

  if (cfg.cls === 'sky-night' || cfg === SKY_CONFIG.evening) {
    sun.style.opacity  = '0';
    moon.style.opacity = '1';
    moon.style.left = cfg.left;
    moon.style.bottom = cfg.bottom;
  } else {
    moon.style.opacity = '0';
    sun.style.opacity  = '1';
    sun.style.left  = cfg.left;
    sun.style.bottom = cfg.bottom;
  }

  // Update time badge
  const timeStr = now.toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit' });
  document.getElementById('timeBadgeTime').textContent = timeStr;
  document.getElementById('timeBadgePeriod').textContent = cfg.icon + ' ' + cfg.label;

  // Horizon glow color by period
  const hg = document.getElementById('horizonGlow');
  if (cfg === SKY_CONFIG.morning) {
    hg.style.background = 'linear-gradient(180deg,transparent 0%,rgba(255,180,80,0.3) 40%,rgba(255,120,30,0.5) 70%,rgba(180,60,0,0.6) 100%)';
  } else if (cfg === SKY_CONFIG.sunset) {
    hg.style.background = 'linear-gradient(180deg,transparent 0%,rgba(255,120,0,0.3) 40%,rgba(255,80,0,0.5) 70%,rgba(180,40,0,0.6) 100%)';
  }
}

/* ----------------------------------------------------------
   CHART.JS SETUP
   ---------------------------------------------------------- */
const LABELS   = ['12:00','12:05','12:10','12:15','12:20','12:25','12:30','12:35','12:40','12:45','12:50','12:55'];
const TEMP_DATA = [26.2, 27.1, 27.8, 28.4, 29.0, 28.7, 28.9, 29.2, 28.6, 28.1, 27.9, 28.4];
const HUM_DATA  = [72, 74, 76, 78, 80, 79, 77, 82, 84, 81, 78, 78];

function buildCharts() {
  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1200, easing: 'easeInOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#000',
        borderWidth: 2,
        titleFont: { family: "'Press Start 2P'", size: 9 },
        bodyFont:  { family: "'Press Start 2P'", size: 9 },
        padding: 10,
      }
    },
    scales: {
      x: {
        ticks: { color: '#888', font: { family: "'Press Start 2P'", size: 6 } },
        grid:  { color: 'rgba(255,255,255,0.05)' },
      }
    }
  };

  // Temperature chart
  new Chart(document.getElementById('tempChart'), {
    type: 'line',
    data: {
      labels: LABELS,
      datasets: [{
        data: TEMP_DATA,
        borderColor: '#ff7043',
        backgroundColor: 'rgba(255,112,67,0.2)',
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: '#ff7043',
        pointBorderColor: '#000',
        pointBorderWidth: 2,
        fill: true, tension: 0, stepped: true,
      }]
    },
    options: {
      ...chartDefaults,
      plugins: {
        ...chartDefaults.plugins,
        tooltip: { ...chartDefaults.plugins.tooltip, borderColor: '#ff7043', titleColor: '#ff7043', bodyColor: '#ffee58' }
      },
      scales: {
        x: chartDefaults.scales.x,
        y: {
          min: 22, max: 34,
          ticks: { color: '#ff7043', font: { family: "'Press Start 2P'", size: 6 }, stepSize: 2 },
          grid: { color: 'rgba(255,112,67,0.1)' }
        }
      }
    }
  });

  // Humidity chart
  new Chart(document.getElementById('humChart'), {
    type: 'line',
    data: {
      labels: LABELS,
      datasets: [{
        data: HUM_DATA,
        borderColor: '#29b6f6',
        backgroundColor: 'rgba(41,182,246,0.2)',
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: '#29b6f6',
        pointBorderColor: '#000',
        pointBorderWidth: 2,
        fill: true, tension: 0, stepped: true,
      }]
    },
    options: {
      ...chartDefaults,
      plugins: {
        ...chartDefaults.plugins,
        tooltip: { ...chartDefaults.plugins.tooltip, borderColor: '#29b6f6', titleColor: '#29b6f6', bodyColor: '#ffee58' }
      },
      scales: {
        x: chartDefaults.scales.x,
        y: {
          min: 70, max: 88,
          ticks: { color: '#29b6f6', font: { family: "'Press Start 2P'", size: 6 }, stepSize: 2 },
          grid: { color: 'rgba(41,182,246,0.1)' }
        }
      }
    }
  });
}

/* ----------------------------------------------------------
   READINGS TABLE
   ---------------------------------------------------------- */
function buildReadings() {
  const tbody   = document.getElementById('readings-body');
  const times   = [...LABELS].reverse();
  const statuses = ['NORMAL','NORMAL','HIGH HUM','NORMAL','NORMAL','NORMAL'];

  times.slice(0, 6).forEach((t, i) => {
    const tr = document.createElement('tr');
    const isHigh = statuses[i] === 'HIGH HUM';
    tr.innerHTML = `
      <td>${t}</td>
      <td>${TEMP_DATA[LABELS.length - 1 - i].toFixed(1)}</td>
      <td>${HUM_DATA[LABELS.length - 1 - i]}</td>
      <td style="color:${isHigh ? '#ff7043' : '#66bb6a'}">${statuses[i]}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ----------------------------------------------------------
   SUGGESTIONS SYSTEM
   ---------------------------------------------------------- */
const ALL_SUGGESTIONS = [
  { emoji:'👕', title:'WEAR LIGHT CLOTHES', badge:'COMFORT',      accent:'#ffee58', desc:'Temp is 28.4°C — wear lightweight, breathable clothing. Cotton or linen works best.',       tip:'TIP: Light colors reflect heat. Avoid dark fabric outdoors.' },
  { emoji:'💧', title:'STAY HYDRATED',      badge:'HEALTH',       accent:'#29b6f6', desc:'High humidity (78%) slows sweat evaporation. Drink water every 20 mins.',                   tip:'TIP: Add a pinch of salt to water for better electrolyte balance.' },
  { emoji:'🪟', title:'OPEN YOUR WINDOWS',  badge:'VENTILATION',  accent:'#66bb6a', desc:'Humidity is elevated indoors. Open windows to improve airflow and reduce stuffiness.',       tip:'TIP: Best ventilation time is early morning when air is cooler.' },
  { emoji:'🌂', title:'BRING AN UMBRELLA',  badge:'WEATHER PREP', accent:'#ce93d8', desc:'High humidity often precedes rain. Carry an umbrella just in case.',                        tip:'TIP: 78%+ humidity + rising temp = likely afternoon rain.' },
  { emoji:'❄️', title:'USE A FAN OR AC',    badge:'COOLING',      accent:'#80deea', desc:'Heat index is above comfortable range. A fan or AC will significantly reduce discomfort.', tip:'TIP: Set AC to 24–26°C to save power while staying cool.' },
  { emoji:'🏠', title:'STAY INDOORS 12–3PM',badge:'SAFETY',       accent:'#ffb74d', desc:'Peak heat hours are midday. Avoid outdoor activities between 12PM and 3PM.',               tip:'TIP: If outside, seek shade and wear a hat or cap.' },
  { emoji:'🌿', title:'WATER YOUR PLANTS',  badge:'GARDEN',       accent:'#aed581', desc:'Hot and humid weather increases plant transpiration. Water in the evening.',               tip:'TIP: Avoid watering under direct sun — leaves can burn.' },
  { emoji:'😴', title:'COOL DOWN BEFORE SLEEP', badge:'SLEEP',   accent:'#9fa8da', desc:'High overnight humidity disrupts sleep. Cool your room to 22–24°C before bed.',            tip:'TIP: A damp cloth on forehead lowers body temp quickly.' },
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

/* ----------------------------------------------------------
   DISMISS ALERT
   ---------------------------------------------------------- */
function dismissAlert() {
  const el = document.getElementById('alertToast');
  if (el) el.style.display = 'none';
}

/* ----------------------------------------------------------
   CLOCK UPDATE (live time display)
   ---------------------------------------------------------- */
function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  const el = document.getElementById('timeBadgeTime');
  if (el) el.textContent = timeStr;
}

/* ----------------------------------------------------------
   INIT
   ---------------------------------------------------------- */
window.addEventListener('DOMContentLoaded', () => {
  // 1. Loading screen
  startLoadingScreen();

  // 2. Sky on load + every minute
  updateSky();
  setInterval(updateSky, 60 * 1000);

  // 3. Clock every second
  setInterval(updateClock, 1000);

  // 4. Charts
  buildCharts();

  // 5. Readings table
  buildReadings();

  // 6. Suggestions
  renderSuggestions();
});
