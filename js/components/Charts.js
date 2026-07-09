// Premium Visual Configuration wrapper for Chart.js

export function getChartThemeOptions() {
  const isLight = document.body.classList.contains('light-theme');
  const textColor = isLight ? '#4b5563' : '#9ca3af';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: textColor,
          font: { family: 'Outfit', weight: '600', size: 12 }
        }
      },
      tooltip: {
        backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(18,22,40,0.95)',
        titleColor: isLight ? '#1f2937' : '#f3f4f6',
        bodyColor: isLight ? '#4b5563' : '#9ca3af',
        borderColor: isLight ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: { family: 'Outfit', weight: '700' },
        bodyFont: { family: 'Inter' }
      }
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: 'Outfit', size: 11 } }
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: 'Outfit', size: 11 } }
      }
    }
  };
}

export function createWeeklyHoursChart(canvasId, labels, dataMe, dataPartner, nameMe, namePartner) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  const options = getChartThemeOptions();

  // Create neon gradients
  const gradMe = ctx.createLinearGradient(0, 0, 0, 300);
  gradMe.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
  gradMe.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

  const gradPartner = ctx.createLinearGradient(0, 0, 0, 300);
  gradPartner.addColorStop(0, 'rgba(236, 72, 153, 0.4)');
  gradPartner.addColorStop(1, 'rgba(236, 72, 153, 0.0)');

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: nameMe,
          data: dataMe,
          borderColor: '#6366f1',
          backgroundColor: gradMe,
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: '#6366f1'
        },
        {
          label: namePartner,
          data: dataPartner,
          borderColor: '#ec4899',
          backgroundColor: gradPartner,
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: '#ec4899'
        }
      ]
    },
    options: options
  });
}

export function createSubjectAccuracyChart(canvasId, labels, dataMe, dataPartner, nameMe, namePartner) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  const options = getChartThemeOptions();
  
  // Custom configurations for Radar scales
  options.scales = {
    r: {
      angleLines: { color: document.body.classList.contains('light-theme') ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' },
      grid: { color: document.body.classList.contains('light-theme') ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' },
      pointLabels: {
        color: document.body.classList.contains('light-theme') ? '#1f2937' : '#f3f4f6',
        font: { family: 'Outfit', weight: '600' }
      },
      ticks: { display: false }
    }
  };

  return new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [
        {
          label: nameMe,
          data: dataMe,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderWidth: 2,
          pointBackgroundColor: '#6366f1'
        },
        {
          label: namePartner,
          data: dataPartner,
          borderColor: '#ec4899',
          backgroundColor: 'rgba(236, 72, 153, 0.2)',
          borderWidth: 2,
          pointBackgroundColor: '#ec4899'
        }
      ]
    },
    options: options
  });
}
