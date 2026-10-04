/* LAUSD Contract Watch — Shared Layout, Utilities, Data Layer */

// ── Utilities ────────────────────────────────────────────────

function formatMoney(n) {
  if (n == null || n === '') return '<span class="amount-undisclosed">Amount not disclosed</span>';
  const num = parseFloat(n);
  if (isNaN(num) || num === 0) return '<span class="amount-undisclosed">Amount not disclosed</span>';
  if (num >= 1_000_000_000) return '$' + (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (num >= 1_000_000)     return '$' + (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000)         return '$' + (num / 1_000).toFixed(0) + 'K';
  return '$' + num.toLocaleString();
}

function formatMoneyFull(n) {
  if (n == null || n === '') return '<span class="amount-undisclosed">Amount not disclosed</span>';
  const num = parseFloat(n);
  if (isNaN(num) || num === 0) return '<span class="amount-undisclosed">Amount not disclosed</span>';
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

function findingLabel(level) {
  return { significant: 'Red Flag', medium: 'Questions Raised', minor: 'Monitor', none: 'Appears Legitimate' }[level] || '';
}

function findingBadgeHtml(level) {
  if (!level || level === 'none') return '';
  const colors = {
    significant: 'background:#c0392b;color:#fff',
    medium:      'background:#d4a843;color:#1a2332',
    minor:       'background:#607d8b;color:#fff'
  };
  const style = colors[level] || 'background:#dce1e8;color:#5a6478';
  return '<span class="badge" style="' + style + '">' + escapeHtml(findingLabel(level)) + '</span>';
}

function verificationBadge(v) {
  const map = {
    'verified':   'badge-verified',
    'needs_verification': 'badge-needs-verification',
    'reported':   'badge-reported',
    'estimated':  'badge-estimated',
    'unverified': 'badge-unverified',
  };
  const cls = map[v] || 'badge-unverified';
  const labels = { needs_verification: 'Needs Verification' };
  const label = labels[v] || (v ? v.charAt(0).toUpperCase() + v.slice(1) : 'Unverified');
  return `<span class="badge ${cls}">${escapeHtml(label)}</span>`;
}

function categoryTag(cat) {
  if (!cat) return '';
  return `<span class="category-tag" style="background:${categoryColor(cat)}">${escapeHtml(cat)}</span>`;
}

// ── Data Layer ───────────────────────────────────────────────

// If the icon library fails to load, keep pages working without icons
if (!window.lucide) window.lucide = { createIcons() {} };

let _data = null;
let _dataPromise = null;

// Normalized vendor key so spelling variants ("Apple Inc." / "Apple, Inc.") group together
function vendorKey(name) {
  let n = (name || '').toLowerCase().trim();
  if (!n.startsWith('various vendors')) n = n.replace(/\(.*?\)/g, ' ');
  n = n.replace(/[^a-z0-9 ]/g, ' ')
       .replace(/\b(inc|llc|ltd|corp|corporation|co|company|the|dist|lp)\b/g, ' ');
  return n.replace(/\s+/g, '');
}

function vendorUrl(name) {
  return '/vendor.html?v=' + encodeURIComponent(vendorKey(name));
}

// Clickable web sources attached to a contract (news articles, reports, vendor pages)
function sourceLinksHtml(c) {
  if (!c.source_links || !c.source_links.length) return '';
  return `<ul class="source-link-list">${c.source_links.map(l =>
    `<li><a href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.label)} &rarr;</a></li>`).join('')}</ul>`;
}

// ── Vendor profiles ──────────────────────────────────────────

function findProfile(profiles, vendorName) {
  const key = vendorKey(vendorName);
  if (!key) return null;
  return (profiles || []).find(p => {
    const pk = vendorKey(p.vendor_name);
    return pk && (pk === key || (pk.length >= 6 && key.startsWith(pk)) || (key.length >= 6 && pk.startsWith(key)));
  }) || null;
}

function linkList(items, cls) {
  if (!items || !items.length) return '';
  return `<ul class="${cls || 'source-link-list'}">${items.map(i => {
    const meta = [i.outlet, i.date].filter(Boolean).map(escapeHtml).join(', ');
    const label = escapeHtml(i.title || i.label || i.summary || i.url);
    return `<li>${i.url ? `<a href="${escapeHtml(i.url)}" target="_blank" rel="noopener">${label}</a>` : label}${meta ? ` <span class="link-meta">(${meta})</span>` : ''}</li>`;
  }).join('')}</ul>`;
}

// Main-column card: plain-English explanation of the company and the service
function companyAboutHtml(p) {
  if (!p || (!p.what_they_do && !p.service_explained)) return '';
  return `<div class="detail-card company-about">
    <h3>What is this?</h3>
    ${p.service_explained ? `<h4>What LAUSD buys from this company</h4><p>${escapeHtml(p.service_explained)}</p>` : ''}
    ${p.what_they_do ? `<h4>About ${escapeHtml(p.display_name || p.vendor_name)}</h4><p>${escapeHtml(p.what_they_do)}</p>` : ''}
  </div>`;
}

// Sidebar card: company facts, issues, news and sources
function companyFactsHtml(p, heading) {
  if (!p) return '';
  const field = (label, val) => val ? `<div class="cf-row"><span class="cf-label">${label}</span><div class="cf-value">${escapeHtml(val)}</div></div>` : '';
  const issues = (p.issues || []).map(i => ({ title: i.summary, date: i.date, url: i.url }));
  return `<div class="sidebar-card company-facts">
    <h4>${escapeHtml(heading || 'Company Profile')}</h4>
    ${field('Type', p.company_type)}
    ${field('Ownership', p.ownership || p.parent_company)}
    ${field('Founded', p.founded)}
    ${field('Headquarters', p.headquarters)}
    ${field('Leadership', p.leadership || p.key_executives || (p.ceo_name ? 'CEO: ' + p.ceo_name : null))}
    ${field('Size', p.scale || p.employee_count)}
    ${field('Spending', p.cost_analysis)}
    ${field('Concerns', p.controversies)}
    ${field('Notes', p.notes)}
    ${issues.length ? `<div class="cf-row"><span class="cf-label">Lawsuits, breaches &amp; investigations</span>${linkList(issues)}</div>` : ''}
    ${p.news && p.news.length ? `<div class="cf-row"><span class="cf-label">In the news</span>${linkList(p.news)}</div>` : ''}
    ${p.source_links && p.source_links.length ? `<details class="cf-sources"><summary>Sources (${p.source_links.length})</summary>${linkList(p.source_links)}</details>` : ''}
    ${p.sources ? `<div class="cf-legacy-sources">Sources: ${escapeHtml(p.sources)}</div>` : ''}
    ${p.researched_at ? `<div class="cf-legacy-sources">Researched ${escapeHtml(p.researched_at)}. Found an error? <a href="mailto:lausdcontractwatch@gmail.com">Tell us</a>.</div>` : ''}
  </div>`;
}

// Findings from audits and oversight reports attached to a contract
function oversightNotesHtml(notes) {
  if (!notes || !notes.length) return '';
  return `<div class="oversight-card">
    <strong><i data-lucide="search-check"></i> From audits &amp; oversight reports</strong>
    ${notes.map(n => `<p>${escapeHtml(n.text)}</p>
      ${(n.links || []).map(l => `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.label)} &rarr;</a>`).join(' ')}`).join('')}
    <div class="oversight-more"><a href="/oversight.html">More on LAUSD audits &rarr;</a></div>
  </div>`;
}

// One-line description of a local source document
function docNote(c) {
  if (c.report_table) return `From LAUSD\u2019s Comprehensive Report of Classroom Technology Contracts (Sept. 29, 2026), ${escapeHtml(c.report_table)}.`;
  if (/OIG|Inspector/i.test(c.source_url || '')) return 'From the LAUSD Office of the Inspector General\u2019s FY2025 Annual Report to the Board.';
  return 'This contract was extracted from official LAUSD board records.';
}

// Button label for a local source document, by file type
function docLabel(path, isReport) {
  if (isReport) return 'View LAUSD Report (PDF)';
  if (/OIG|Inspector/i.test(path)) return 'View Inspector General Report (PDF)';
  if (/\.docx?$/i.test(path)) return 'View Board Report (Word)';
  if (/\.(jpe?g|png|webp)$/i.test(path)) return 'View Board Report (Image)';
  return 'View Board Report (PDF)';
}

function loadData() {
  if (_dataPromise) return _dataPromise;
  _dataPromise = fetch('/data/contracts.json', { cache: 'no-cache' })
    .then(r => { if (!r.ok) throw new Error('Failed to load data'); return r.json(); })
    .then(d => {
      if (d.contracts) d.contracts = d.contracts.filter(c => c.category !== 'Facilities');
      _data = d;
      return d;
    });
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
        <div class="nav-dropdown" id="navDropdownWhy">
          <button class="nav-dropdown-trigger" id="navDropdownWhyBtn" aria-expanded="false">
            Why It Matters
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left:4px"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="nav-dropdown-menu" id="navDropdownWhyMenu">
            <a href="/private-companies.html">Private Companies</a>
            <a href="/edtech.html">EdTech</a>
            <a href="/ai-apps.html">AI in Classrooms</a>
            <a href="/oversight.html">Audits &amp; Oversight</a>
            <a href="/teachers.html">Teachers</a>
            <a href="/students.html">Students</a>
            <a href="/transparency.html">Transparency</a>
          </div>
        </div>
        <a href="/board-members.html">Board Profiles</a>
        <a href="/take-action.html">Take Action</a>
        <div class="nav-dropdown" id="navDropdownAbout">
          <button class="nav-dropdown-trigger" id="navDropdownAboutBtn" aria-expanded="false">
            About
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left:4px"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="nav-dropdown-menu" id="navDropdownAboutMenu">
            <a href="/about.html">Our Mission</a>
            <a href="/sources.html">Sources</a>
          </div>
        </div>
      </div>
      <button class="nav-toggle" id="navToggle" aria-label="Open menu">
        <span></span><span></span><span></span>
      </button>
    </div>`;

  const existing = document.querySelector('.main-nav');
  if (existing) existing.replaceWith(nav);
  else document.body.prepend(nav);

  // Dropdowns
  nav.querySelectorAll('.nav-dropdown').forEach(dd => {
    const btn = dd.querySelector('.nav-dropdown-trigger');
    btn.addEventListener('click', e => {
      e.stopPropagation();
      // Close other dropdowns
      nav.querySelectorAll('.nav-dropdown').forEach(other => {
        if (other !== dd) {
          other.classList.remove('open');
          other.querySelector('.nav-dropdown-trigger').setAttribute('aria-expanded', 'false');
        }
      });
      dd.classList.toggle('open');
      btn.setAttribute('aria-expanded', dd.classList.contains('open'));
    });
  });
  document.addEventListener('click', () => {
    nav.querySelectorAll('.nav-dropdown').forEach(dd => dd.classList.remove('open'));
  });

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
        <h4>Accountability</h4>
        <ul>
          <li><a href="/board-members.html">Board Profiles</a></li>
          <li><a href="/take-action.html">Take Action</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>About</h4>
        <ul>
          <li><a href="/about.html">Our Mission</a></li>
          <li><a href="https://lausd.clodhost.com/documents/" target="_blank" rel="noopener">Data Sources</a></li>
          <li><a href="mailto:lausdcontractwatch@gmail.com">Contact</a></li>
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

function injectNewsAlert() {
  const banner = document.createElement('div');
  banner.className = 'news-alert';
  banner.innerHTML = `<div class="container"><strong>Update:</strong> LAUSD reached a tentative agreement with unions hours before the April 14 strike deadline &mdash; agreeing to raises it said for months it couldn&rsquo;t afford. The contracts below show where the money was going instead.
    <a href="https://edsource.org/2026/utla-reaches-tentative-agreement-with-lausd-following-months-of-negotiations/755728" target="_blank" rel="noopener">Read more &rarr;</a></div>`;
  const nav = document.querySelector('.main-nav');
  if (nav) nav.after(banner);
}

// ── Init ──────────────────────────────────────────────────────

function initLayout(options = {}) {
  injectNav();
  injectFooter();
  if (options.newsAlert) {
    injectNewsAlert();
  }
}
