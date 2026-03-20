// Generate pixel stars
const starsEl = document.getElementById('stars');
for(let i=0;i<60;i++){
  const s=document.createElement('div');
  s.className='star';
  const sz=Math.random()<0.5?4:2;
  s.style.cssText=`width:${sz}px;height:${sz}px;top:${Math.random()*100}%;left:${Math.random()*100}%;--dur:${(Math.random()*3+2).toFixed(1)}s;animation-delay:${(Math.random()*4).toFixed(1)}s;`;
  starsEl.appendChild(s);
}

// Generate pixel clouds
const cloudsEl = document.getElementById('clouds');
const cloudShapes = [
  [[0,1],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2],[3,1]],
  [[0,1],[1,0],[1,1],[1,2],[2,1],[2,2],[3,0],[3,1],[3,2],[4,1]],
];
for(let c=0;c<4;c++){
  const cloud=document.createElement('div');
  cloud.className='cloud';
  const shape=cloudShapes[c%2];
  const cellSize=16;
  const dur=30+Math.random()*40;
  const top=Math.random()*60;
  const delay=-Math.random()*dur;
  cloud.style.cssText=`top:${top}px;animation-duration:${dur}s;animation-delay:${delay}s;`;
  const maxX=Math.max(...shape.map(p=>p[0]));
  const maxY=Math.max(...shape.map(p=>p[1]));
  const grid=document.createElement('div');
  grid.style.cssText=`position:relative;width:${(maxX+1)*cellSize}px;height:${(maxY+1)*cellSize}px;`;
  shape.forEach(([x,y])=>{
    const b=document.createElement('div');
    b.className='cloud-block';
    b.style.cssText=`position:absolute;left:${x*cellSize}px;top:${y*cellSize}px;width:${cellSize}px;height:${cellSize}px;`;
    grid.appendChild(b);
  });
  cloud.appendChild(grid);
  cloudsEl.appendChild(cloud);
}

// Supabase config
const SUPABASE_URL = 'https://tzspnjmksbfloelujzjc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6c3Buam1rc2JmbG9lbHVqempjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4ODExNDYsImV4cCI6MjA4ODQ1NzE0Nn0.6ymNLXSgyE50BlU1cgD4czM2R5S1jhpHN5ykfr2Q0rc';

// Time helpers (PH UTC+8)
function formatTime(dateStr){
  const fixed=dateStr.replace(' ','T').replace(/\.\d+$/,'')+'Z';
  const ph=new Date(new Date(fixed).getTime()+8*3600000);
  let h=ph.getUTCHours();
  const m=String(ph.getUTCMinutes()).padStart(2,'0');
  const s=String(ph.getUTCSeconds()).padStart(2,'0');
  const ap=h>=12?'PM':'AM'; h=h%12||12;
  return `${h}:${m}:${s} ${ap}`;
}
function formatDateTime(dateStr){
  const fixed=dateStr.replace(' ','T').replace(/\.\d+$/,'')+'Z';
  const ph=new Date(new Date(fixed).getTime()+8*3600000);
  const mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let h=ph.getUTCHours();
  const m=String(ph.getUTCMinutes()).padStart(2,'0');
  const s=String(ph.getUTCSeconds()).padStart(2,'0');
  const ap=h>=12?'PM':'AM'; h=h%12||12;
  return `${mo[ph.getUTCMonth()]} ${ph.getUTCDate()} - ${h}:${m}:${s} ${ap}`;
}

// Charts
const sharedOpts = (color, min, max, step) => ({
  responsive:true,
  interaction:{mode:'index',intersect:false},
  plugins:{
    legend:{display:false},
    tooltip:{
      backgroundColor:'rgba(10,5,30,0.95)',
      titleColor:color,bodyColor:'rgba(254,246,208,0.8)',
      borderColor:color,borderWidth:1,padding:10,
      titleFont:{family:'Press Start 2P',size:9},
      bodyFont:{family:'VT323',size:16}
    }
  },
  scales:{
    x:{ticks:{color:'rgba(254,246,208,0.4)',font:{family:'VT323',size:12},maxTicksLimit:8},grid:{color:'rgba(245,200,66,0.05)'},border:{color:'rgba(245,200,66,0.15)'}},
    y:{min,max,ticks:{color,font:{family:'VT323',size:13},stepSize:step,callback:v=>Number.isFinite(v)?v.toFixed(step<1?1:0):''},grid:{color:'rgba(245,200,66,0.05)'},border:{color:'rgba(245,200,66,0.15)'}}
  }
});

const chartTemp = new Chart(document.getElementById('chartTemp').getContext('2d'),{
  type:'line',
  data:{labels:[],datasets:[{label:'Temp °C',data:[],borderColor:'#f5a030',backgroundColor:'rgba(245,160,48,0.08)',borderWidth:2,pointRadius:4,pointBackgroundColor:'#f5a030',pointBorderColor:'rgba(10,5,30,0.8)',pointBorderWidth:2,tension:0.4,fill:true}]},
  options:sharedOpts('#f5a030',25.0,29.0,0.5)
});

const chartHum = new Chart(document.getElementById('chartHum').getContext('2d'),{
  type:'line',
  data:{labels:[],datasets:[{label:'Humidity %',data:[],borderColor:'#5bc8f5',backgroundColor:'rgba(91,200,245,0.08)',borderWidth:2,pointRadius:4,pointBackgroundColor:'#5bc8f5',pointBorderColor:'rgba(10,5,30,0.8)',pointBorderWidth:2,tension:0.4,fill:true}]},
  options:sharedOpts('#5bc8f5',76,85,1)
});

// CSV export
let latestData = [];
function downloadCSV(type){
  if(!latestData.length) return alert('No data yet!');
  let rows, filename;
  if(type==='temperature'){
    rows=[['ID','Temperature (°C)','Date & Time (PH)']];
    latestData.forEach(d=>rows.push([d.id,d.temperature.toFixed(1),formatDateTime(d.created_at)]));
    filename=`temperature_${new Date().toISOString().slice(0,10)}.csv`;
  } else {
    rows=[['ID','Humidity (%)','Date & Time (PH)']];
    latestData.forEach(d=>rows.push([d.id,d.humidity.toFixed(1),formatDateTime(d.created_at)]));
    filename=`humidity_${new Date().toISOString().slice(0,10)}.csv`;
  }
  const csv=rows.map(r=>r.join(',')).join('\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download=filename; a.click();
}

// Fetch data
async function fetchData(){
  try{
    const res=await fetch(
      `${SUPABASE_URL}/rest/v1/sensor_data?select=*&order=created_at.desc&limit=20`,
      {headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}}
    );
    if(!res.ok) throw new Error('failed');
    const data=await res.json();
    if(!data.length) return;
    latestData=data;

    document.getElementById('statusDot').className='status-dot';
    document.getElementById('statusText').textContent='LIVE ▸ ONLINE';

    const latest=data[0];
    document.getElementById('tempVal').innerHTML=`${latest.temperature.toFixed(1)}<span class="metric-unit">°C</span>`;
    document.getElementById('humVal').innerHTML=`${latest.humidity.toFixed(1)}<span class="metric-unit">%</span>`;
    document.getElementById('tempTime').textContent=`Last: ${formatTime(latest.created_at)}`;
    document.getElementById('humTime').textContent=`Last: ${formatTime(latest.created_at)}`;

    const temps=data.map(d=>d.temperature);
    const hums=data.map(d=>d.humidity);
    document.getElementById('tempMax').textContent=Math.max(...temps).toFixed(1)+'°';
    document.getElementById('tempMin').textContent=Math.min(...temps).toFixed(1)+'°';
    document.getElementById('humMax').textContent=Math.max(...hums).toFixed(1)+'%';
    document.getElementById('humMin').textContent=Math.min(...hums).toFixed(1)+'%';

    const rev=[...data].reverse();
    const labels=rev.map(d=>formatDateTime(d.created_at));
    chartTemp.data.labels=labels;
    chartTemp.data.datasets[0].data=rev.map(d=>d.temperature);
    chartTemp.update();
    chartHum.data.labels=labels;
    chartHum.data.datasets[0].data=rev.map(d=>d.humidity);
    chartHum.update();

    const rows=data.slice(0,10).map(d=>`
      <tr>
        <td>${formatDateTime(d.created_at)}</td>
        <td class="temp-val">${d.temperature.toFixed(1)} °C</td>
        <td class="hum-val">${d.humidity.toFixed(1)} %</td>
      </tr>`).join('');
    document.getElementById('tableContainer').innerHTML=`
      <table>
        <thead><tr><th>TIMESTAMP</th><th>TEMPERATURE</th><th>HUMIDITY</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;

  } catch(e){
    document.getElementById('statusDot').className='status-dot offline';
    document.getElementById('statusText').textContent='OFFLINE';
  }
}

fetchData();
setInterval(fetchData, 5000);