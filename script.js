const labels = ['12:00','12:05','12:10','12:15','12:20','12:25'];

const tempData = [26,27,28,29,28,28];
const humData  = [72,74,76,78,80,79];

// TEMP CHART
new Chart(document.getElementById('tempChart'), {
  type: 'line',
  data: {
    labels,
    datasets: [{
      data: tempData,
      borderWidth: 2
    }]
  }
});

// HUM CHART
new Chart(document.getElementById('humChart'), {
  type: 'line',
  data: {
    labels,
    datasets: [{
      data: humData,
      borderWidth: 2
    }]
  }
});

// TABLE
const tbody = document.getElementById('readings-body');

labels.forEach((t, i) => {
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${t}</td><td>${tempData[i]}</td><td>${humData[i]}</td>`;
  tbody.appendChild(tr);
});
