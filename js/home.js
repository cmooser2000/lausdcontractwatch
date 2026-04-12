/* LAUSD Contract Watch — Home Page */

initLayout({ newsAlert: true });

const SPOTLIGHT_IDS = [77, 85, 57]; // AllHere, Yondr, IT Infrastructure — high-profile contracts

loadData().then(data => {
  const contracts = data.contracts;
  renderStats(contracts, data.conflicts_of_interest);
  renderSpotlight(contracts, data.cost_equivalents);
  renderCategoryBars(contracts);
  renderNews(data.news_items);
  initHeroSearch(contracts);
  lucide.createIcons(); // initialise all icons injected by the render functions above
});

// ── Stats ─────────────────────────────────────────────────────

function renderStats(contracts, conflicts) {
  const active = contracts.filter(c => c.status === 'Active').length;
  document.getElementById('statActive').textContent = active;

  const total = contracts.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  document.getElementById('statTotal').textContent = formatMoney(total);
  document.getElementById('statContracts').textContent = contracts.length;
  document.getElementById('statConflicts').textContent = conflicts.length;
}

// ── Spotlight Cards ───────────────────────────────────────────

function renderSpotlight(contracts, costEquivs) {
  // Try IDs first; fall back to top significant-finding contracts
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

// ── Category Bars ─────────────────────────────────────────────

function renderCategoryBars(contracts) {
  const totals = {};
  const counts = {};
  contracts.forEach(c => {
    const cat = c.category || 'Other';
    totals[cat] = (totals[cat] || 0) + (parseFloat(c.amount) || 0);
    counts[cat] = (counts[cat] || 0) + 1;
  });

  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const max = sorted[0][1];
  const container = document.getElementById('categoryBars');

  sorted.forEach(([cat, total]) => {
    const pct = Math.max(2, Math.round((total / max) * 100));
    const row = document.createElement('div');
    row.className = 'category-bar-row';
    row.innerHTML = `
      <div class="category-bar-label">
        ${categoryTag(cat)}
        <span class="category-bar-count">${counts[cat]} contract${counts[cat] !== 1 ? 's' : ''}</span>
      </div>
      <div class="category-bar-track">
        <a href="/search.html?category=${encodeURIComponent(cat)}" style="width:0;background:${categoryColor(cat)}" class="category-bar-fill" data-pct="${pct}">
          <span class="category-bar-amount">${formatMoney(total)}</span>
        </a>
      </div>`;
    container.appendChild(row);
  });

  // Animate bars on scroll
  const bars = container.querySelectorAll('.category-bar-fill');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.style.width = el.dataset.pct + '%';
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.1 });
  bars.forEach(b => observer.observe(b));
}

// ── News ──────────────────────────────────────────────────────

function renderNews(news) {
  const grid = document.getElementById('newsGrid');
  const active = (news || []).filter(n => n.active);
  if (!active.length) { grid.innerHTML = '<p style="color:var(--text-light)">No news items available.</p>'; return; }
  active.forEach(n => {
    const card = document.createElement('div');
    card.className = 'cta-card';
    card.innerHTML = `
      <h3 style="font-size:1rem;margin-bottom:0.5rem">${escapeHtml(n.title)}</h3>
      <p style="font-size:0.85rem">${escapeHtml(n.summary || '')}</p>
      <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.75rem">${escapeHtml(n.source)} &mdash; ${formatDate(n.published_date)}</div>
      <a href="${escapeHtml(n.url)}" target="_blank" rel="noopener" class="btn btn-outline" style="font-size:0.85rem;padding:0.5rem 1rem">Read Article &rarr;</a>`;
    grid.appendChild(card);
  });
}

// ── Hero Search Autocomplete ──────────────────────────────────

function initHeroSearch(contracts) {
  const input = document.getElementById('heroSearchInput');
  const dropdown = document.getElementById('heroDropdown');
  let debounce;

  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const q = input.value.trim().toLowerCase();
      if (q.length < 2) { dropdown.style.display = 'none'; return; }
      const results = contracts.filter(c =>
        (c.title || '').toLowerCase().includes(q) ||
        (c.vendor_name || '').toLowerCase().includes(q) ||
        (c.keywords || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q)
      ).slice(0, 6);

      if (!results.length) { dropdown.style.display = 'none'; return; }
      dropdown.innerHTML = results.map(c => `
        <a class="search-dropdown-item" href="/contract.html?id=${c.id}">
          <span class="sdi-title">${escapeHtml(c.title)}</span>
          <span class="sdi-meta">${escapeHtml(c.vendor_name || '')} &mdash; ${formatMoney(c.amount)}</span>
        </a>`).join('') +
        `<a class="search-dropdown-item search-dropdown-all" href="/search.html?q=${encodeURIComponent(input.value.trim())}">
          See all results &rarr;
        </a>`;
      dropdown.style.display = 'block';
    }, 150);
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.search-form-hero')) dropdown.style.display = 'none';
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
  return str.slice(0, len).replace(/\s+\S*$/, '') + '…';
}
