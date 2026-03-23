const labels=['12:00','12:05','12:10','12:15','12:20','12:25'];

const tempData=[26.2,27.1,27.8,28.4,29.0,28.7];
const humData=[72,74,76,78,80,79];

// CHARTS
new Chart(document.getElementById('tempChart'),{
  type:'line',
  data:{labels,datasets:[{data:tempData}]}
});

new Chart(document.getElementById('humChart'),{
  type:'line',
  data:{labels,datasets:[{data:humData}]}
});

// TABLE
const tbody=document.getElementById('readings-body');

labels.forEach((t,i)=>{
  const tr=document.createElement('tr');
  tr.innerHTML=`<td>${t}</td><td>${tempData[i]}</td><td>${humData[i]}</td>`;
  tbody.appendChild(tr);
});

// ALERT
function closeAlert(){
  document.getElementById('alertToast').style.display='none';
}

// SUGGESTIONS
const allSuggestions=[
  "👕 Wear light clothes",
  "💧 Stay hydrated",
  "❄️ Use fan or AC",
  "🏠 Stay indoors"
];

function renderSuggestions(){
  const grid=document.getElementById('suggestGrid');
  grid.innerHTML=allSuggestions.map(s=>`<div>${s}</div>`).join('');
}

renderSuggestions();
