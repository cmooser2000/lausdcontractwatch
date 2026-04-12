/* LAUSD Contract Watch — Shared Layout, Utilities, Data Layer */

// ── Utilities ────────────────────────────────────────────────

function formatMoney(n) {
  if (n == null || n === '') return '—';
  const num = parseFloat(n);
  if (isNaN(num)) return '—';
  if (num >= 1_000_000_000) return '$' + (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (num >= 1_000_000)     return '$' + (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000)         return '$' + (num / 1_000).toFixed(0) + 'K';
  return '$' + num.toLocaleString();
}

function formatMoneyFull(n) {
  if (n == null || n === '') return '—';
  const num = parseFloat(n);
  if (isNaN(num)) return '—';
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(str) {
  if (!str) return '—';
  try {
    const d = new Date(str + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return str; }
}

function categoryColor(cat) {
  const map = {
    'Technology':            '#e74c3c',
    'Facilities':            '#3498db',
    'Transportation':        '#f39c12',
    'Food Services':         '#27ae60',
    'Professional Services': '#9b59b6',
    'Construction':          '#e67e22',
    'Consulting':            '#1abc9c',
    'Curriculum':            '#e91e63',
    'Special Education':     '#2196f3',
    'Security':              '#795548',
    'Maintenance':           '#607d8b',
    'Other':                 '#95a5a6',
  };
  return map[cat] || '#95a5a6';
}

function statusBadge(status) {
  const map = {
    'Active':    'badge-active',
    'Expired':   'badge-expired',
    'Pending':   'badge-pending',
    'Cancelled': 'badge-cancelled',
    'Amended':   'badge-amended',
  };
  const cls = map[status] || 'badge-pending';
  return `<span class="badge ${cls}">${escapeHtml(status || 'Unknown')}</span>`;
}

function verificationBadge(v) {
  const map = {
    'verified':   'badge-verified',
    'reported':   'badge-reported',
    'estimated':  'badge-estimated',
    'unverified': 'badge-unverified',
  };
  const cls = map[v] || 'badge-unverified';
  const label = v ? v.charAt(0).toUpperCase() + v.slice(1) : 'Unverified';
  return `<span class="badge ${cls}">${escapeHtml(label)}</span>`;
}

function categoryTag(cat) {
  if (!cat) return '';
  return `<span class="category-tag" style="background:${categoryColor(cat)}">${escapeHtml(cat)}</span>`;
}

// ── Data Layer ───────────────────────────────────────────────

let _data = null;
let _dataPromise = null;

function loadData() {
  if (_dataPromise) return _dataPromise;
  _dataPromise = fetch('/data/contracts.json')
    .then(r => { if (!r.ok) throw new Error('Failed to load data'); return r.json(); })
    .then(d => { _data = d; return d; });
  return _dataPromise;
}

function getData() { return _data; }

// ── Nav / Footer Injection ───────────────────────────────────

function injectNav() {
  const nav = document.createElement('nav');
  nav.className = 'main-nav';
  nav.setAttribute('role', 'navigation');
  nav.innerHTML = `
    <div class="nav-inner">
      <a href="/" class="nav-brand">
        <span class="nav-icon"><i data-lucide="school"></i></span>
        <span class="nav-title">LAUSD Contract Watch</span>
      </a>
      <div class="nav-links" id="navLinks">
        <div class="nav-dropdown" id="navDropdown">
          <button class="nav-dropdown-trigger" id="navDropdownBtn" aria-expanded="false">
            View Contracts
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left:4px"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="nav-dropdown-menu" id="navDropdownMenu">
            <a href="/search.html">All Contracts</a>
            <a href="/high-priority.html">High Priority</a>
            <a href="/vendors.html">Vendor Analysis</a>
            <a href="/tech-vendors.html">Tech Spending</a>
            <div class="nav-dropdown-divider"></div>
            <a href="/board.html">Board Members</a>
          </div>
        </div>
        <a href="/campaigns.html">Campaigns</a>
        <a href="/take-action.html">Take Action</a>
        <a href="/sources.html">Sources</a>
        <a href="/about.html">About</a>
      </div>
      <button class="nav-toggle" id="navToggle" aria-label="Open menu">
        <span></span><span></span><span></span>
      </button>
    </div>`;

  const existing = document.querySelector('.main-nav');
  if (existing) existing.replaceWith(nav);
  else document.body.prepend(nav);

  // Dropdown
  const btn = nav.querySelector('#navDropdownBtn');
  const dd  = nav.querySelector('#navDropdown');
  btn.addEventListener('click', e => {
    e.stopPropagation();
    dd.classList.toggle('open');
    btn.setAttribute('aria-expanded', dd.classList.contains('open'));
  });
  document.addEventListener('click', () => dd.classList.remove('open'));

  // Mobile toggle
  const toggle = nav.querySelector('#navToggle');
  const links  = nav.querySelector('#navLinks');
  toggle.addEventListener('click', () => links.classList.toggle('open'));

  // Highlight current page
  const path = location.pathname.replace(/\/$/, '') || '/';
  nav.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href').replace(/\/$/, '') || '/';
    if (href === path || (path !== '/' && href !== '/' && path.startsWith(href.replace('.html', '')))) {
      a.style.color = 'var(--gold-light)';
    }
  });
}

function injectFooter() {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-col">
        <h4>LAUSD Contract Watch</h4>
        <p>A parent-led transparency project tracking LAUSD contracts and vendor relationships. Follow the money.</p>
      </div>
      <div class="footer-col">
        <h4>Contracts</h4>
        <ul>
          <li><a href="/search.html">Search All Contracts</a></li>
          <li><a href="/high-priority.html">High Priority</a></li>
          <li><a href="/vendors.html">Vendor Analysis</a></li>
          <li><a href="/tech-vendors.html">Tech Spending</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Accountability</h4>
        <ul>
          <li><a href="/board.html">Board Members</a></li>
          <li><a href="/campaigns.html">Campaigns</a></li>
          <li><a href="/take-action.html">Take Action</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>About</h4>
        <ul>
          <li><a href="/about.html">Our Mission</a></li>
          <li><a href="/sources.html">Data Sources</a></li>
          <li><a href="/about.html#faq">FAQ</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>Data sourced from LAUSD Board Reports and public records &mdash; lausdcontractwatch.com &mdash; Not affiliated with LAUSD</p>
    </div>`;

  const existing = document.querySelector('.site-footer');
  if (existing) existing.replaceWith(footer);
  else document.body.appendChild(footer);
}

// ── News Alert Banner ─────────────────────────────────────────

function injectNewsAlert(newsItems) {
  if (!newsItems || !newsItems.length) return;
  const latest = newsItems.find(n => n.active);
  if (!latest) return;
  const banner = document.createElement('div');
  banner.className = 'news-alert';
  banner.innerHTML = `<div class="container"><strong>Breaking:</strong> ${escapeHtml(latest.title)}
    <a href="${escapeHtml(latest.url)}" target="_blank" rel="noopener">Read more &rarr;</a></div>`;
  const nav = document.querySelector('.main-nav');
  if (nav) nav.after(banner);
}

// ── Init ──────────────────────────────────────────────────────

function initLayout(options = {}) {
  injectNav();
  injectFooter();
  if (options.newsAlert) {
    loadData().then(d => injectNewsAlert(d.news_items));
  }
}
