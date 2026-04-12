/* LAUSD Contract Watch — Home Page */

initLayout({ newsAlert: true });

const SPOTLIGHT_IDS = [77, 85, 57]; // AllHere, Yondr, IT Infrastructure — high-profile contracts

loadData().then(data => {
  const contracts = data.contracts;
  renderSpotlight(contracts, data.cost_equivalents);
  renderEdtechChart();
  lucide.createIcons();
});

// ── Spotlight Cards ───────────────────────────────────────────

function renderSpotlight(contracts, costEquivs) {
  let picks = SPOTLIGHT_IDS.map(id => contracts.find(c => c.id === id)).filter(Boolean);
  if (picks.length < 3) {
    const sig = contracts.filter(c => c.finding_level === 'significant' && !picks.includes(c));
    picks = [...picks, ...sig].slice(0, 3);
  }
  if (picks.length < 3) {
    const byAmt = [...contracts].sort((a, b) => (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0));
    picks = [...picks, ...byAmt.filter(c => !picks.includes(c))].slice(0, 3);
  }

  const grid = document.getElementById('spotlightGrid');
  const more = grid.querySelector('.spotlight-more');

  picks.forEach(c => {
    const card = document.createElement('div');
    card.className = 'spotlight-card';
    const comparisons = buildComparisons(parseFloat(c.amount) || 0, costEquivs);
    card.innerHTML = `
      <div class="spotlight-icon">${categoryIcon(c.category)}</div>
      <div class="spotlight-title-row">
        <h3><a href="/contract.html?id=${c.id}">${escapeHtml(c.title)}</a></h3>
        <span class="spotlight-amount">${formatMoney(c.amount)}</span>
        <a class="spotlight-vendor" href="/vendors.html">${escapeHtml(c.vendor_name || '')}</a>
      </div>
      <p>${escapeHtml(truncate(c.plain_english || c.description || 'No description available.', 160))}</p>
      ${comparisons ? `<div class="spotlight-comparison">${comparisons}</div>` : ''}
      <a class="spotlight-cta" href="/contract.html?id=${c.id}">View full details &rarr;</a>`;
    grid.insertBefore(card, more);
  });
}

function buildComparisons(amount, equivs) {
  if (!amount || !equivs) return '';
  const picks = equivs.slice(0, 3);
  return picks.map(e => {
    const n = Math.floor(amount / parseFloat(e.unit_cost));
    if (!n) return '';
    return `<div class="spotlight-pays">This contract = <strong>${n.toLocaleString()} ${e.unit_label}</strong></div>`;
  }).filter(Boolean).join('');
}

// ── Ed-Tech Chart ────────────────────────────────────────────

function renderEdtechChart() {
  const ctx = document.getElementById('edtechChart');
  if (!ctx) return;

  const years = ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];
  const spending = [12, 15, 18, 45, 52, 61, 89, 380, 290, 245, 210];
  const math = [30.2, 31.1, 32.3, 33.5, 33.5, null, null, 28.5, 32.8, 32.8, 36.8];
  const reading = [42.0, 42.8, 43.5, 44.1, 44.1, null, null, 41.7, 43.1, 43.1, 46.5];
  const covidIndices = [5, 6]; // 2020, 2021

  // COVID bars get muted color
  const barColors = spending.map((_, i) =>
    covidIndices.includes(i) ? 'rgba(150, 150, 150, 0.4)' : 'rgba(212, 168, 67, 0.6)'
  );
  const barBorders = spending.map((_, i) =>
    covidIndices.includes(i) ? 'rgba(150, 150, 150, 0.6)' : 'rgba(212, 168, 67, 0.9)'
  );

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Ed-Tech Spending ($M)',
          data: spending,
          backgroundColor: barColors,
          borderColor: barBorders,
          borderWidth: 1,
          yAxisID: 'y',
          order: 2
        },
        {
          label: 'Math Proficiency (%)',
          data: math,
          type: 'line',
          borderColor: '#ffffff',
          backgroundColor: '#ffffff',
          pointBackgroundColor: '#ffffff',
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2.5,
          tension: 0.3,
          spanGaps: false,
          yAxisID: 'y1',
          order: 1
        },
        {
          label: 'Reading Proficiency (%)',
          data: reading,
          type: 'line',
          borderColor: '#7ec8e3',
          backgroundColor: '#7ec8e3',
          pointBackgroundColor: '#7ec8e3',
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2.5,
          tension: 0.3,
          spanGaps: false,
          yAxisID: 'y1',
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          labels: {
            color: 'rgba(255,255,255,0.8)',
            font: { family: "'Inter', sans-serif", size: 13 },
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(26, 35, 50, 0.95)',
          titleFont: { family: "'Inter', sans-serif", size: 14 },
          bodyFont: { family: "'Inter', sans-serif", size: 13 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              if (context.dataset.label === 'Ed-Tech Spending ($M)') {
                if (context.dataIndex === 5 || context.dataIndex === 6) {
                  return 'Ed-Tech Spending: $' + context.raw + 'M (No Testing \u2014 COVID)';
                }
                return 'Ed-Tech Spending: $' + context.raw + 'M';
              }
              if (context.raw === null) return context.dataset.label + ': No data (COVID)';
              return context.dataset.label + ': ' + context.raw + '%';
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: 'rgba(255,255,255,0.7)',
            font: { family: "'Inter', sans-serif", size: 13 }
          },
          grid: { color: 'rgba(255,255,255,0.06)' }
        },
        y: {
          position: 'left',
          title: {
            display: true,
            text: 'Spending ($M)',
            color: 'rgba(255,255,255,0.6)',
            font: { family: "'Inter', sans-serif", size: 12 }
          },
          ticks: {
            color: 'rgba(255,255,255,0.6)',
            font: { family: "'Inter', sans-serif" },
            callback: v => '$' + v + 'M'
          },
          grid: { color: 'rgba(255,255,255,0.06)' },
          beginAtZero: true
        },
        y1: {
          position: 'right',
          title: {
            display: true,
            text: '% Meeting Standards',
            color: 'rgba(255,255,255,0.6)',
            font: { family: "'Inter', sans-serif", size: 12 }
          },
          ticks: {
            color: 'rgba(255,255,255,0.6)',
            font: { family: "'Inter', sans-serif" },
            callback: v => v + '%'
          },
          grid: { drawOnChartArea: false },
          min: 0,
          max: 100
        }
      }
    },
    plugins: [{
      afterDraw: function(chart) {
        const meta = chart.getDatasetMeta(0);
        const ctx = chart.ctx;

        // COVID labels on 2020, 2021 bars
        [5, 6].forEach(i => {
          const bar = meta.data[i];
          if (!bar) return;
          ctx.save();
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.font = "11px 'Inter', sans-serif";
          ctx.textAlign = 'center';
          ctx.fillText('No Testing', bar.x, bar.y - 8);
          ctx.fillText('(COVID)', bar.x, bar.y + 4);
          ctx.restore();
        });

        // Vertical marker at 2022 (index 7)
        const bar2022 = meta.data[7];
        if (!bar2022) return;
        const xScale = chart.scales.x;
        const yScale = chart.scales.y;
        const x = xScale.getPixelForValue(7);
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1.5;
        ctx.moveTo(x, yScale.top);
        ctx.lineTo(x, yScale.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = "10px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText('Carvalho era / ed-tech', x, yScale.top - 16);
        ctx.fillText('spending jumps 84%', x, yScale.top - 4);
        ctx.restore();
      }
    }]
  });
}

// ── Helpers ───────────────────────────────────────────────────

function categoryIcon(cat) {
  const map = {
    'Technology':            'monitor',
    'Facilities':            'hard-hat',
    'Transportation':        'bus',
    'Food Services':         'apple',
    'Professional Services': 'briefcase',
    'Construction':          'hammer',
    'Consulting':            'bar-chart-2',
    'Curriculum':            'book-open',
    'Special Education':     'graduation-cap',
    'Security':              'lock',
    'Maintenance':           'wrench',
    'Other':                 'file-text',
  };
  const icon = map[cat] || 'file-text';
  return `<i data-lucide="${icon}"></i>`;
}

function truncate(str, len) {
  if (!str || str.length <= len) return str || '';
  return str.slice(0, len).replace(/\s+\S*$/, '') + '\u2026';
}

// ── Share ────────────────────────────────────────────────────

function shareThisPage() {
  if (navigator.share) {
    navigator.share({ title: document.title, url: window.location.href });
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      const btn = document.querySelector('.action-bar-share');
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = 'Link copied!';
        setTimeout(() => { btn.textContent = orig; }, 2000);
      }
    });
  }
}
