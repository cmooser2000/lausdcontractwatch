/* LAUSD Contract Watch — Vendor Page */

initLayout();

loadData().then(data => {
  const key = new URLSearchParams(location.search).get('v') || '';
  const contracts = data.contracts.filter(c => vendorKey(c.vendor_name) === key);
  const delegated = (data.delegated_purchases || []).filter(p => vendorKey(p.vendor_name) === key);
  const name = contracts[0]?.vendor_name || delegated[0]?.vendor_name;

  if (!name) {
    document.getElementById('vendorHeader').innerHTML =
      `<a href="/vendors.html" style="color:rgba(255,255,255,0.6);font-size:0.85rem">&larr; Who LAUSD is paying</a><h1>Vendor not found</h1>`;
    return;
  }
  document.title = `${name} — LAUSD Contract Watch`;

  // Direct profile, or a parent-company profile that lists this vendor in its portfolio
  const profiles = data.vendor_profiles || [];
  const direct = profiles.find(p => key.startsWith(vendorKey(p.vendor_name)) || vendorKey(p.vendor_name).startsWith(key));
  const parents = profiles.filter(p => (p.portfolio_vendors || []).some(v => key.startsWith(vendorKey(v))));

  const total = contracts.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  const expended = contracts.reduce((s, c) => s + (parseFloat(c.expended_amount) || 0), 0);
  const delegatedTotal = delegated.reduce((s, p) => s + (p.amount || 0), 0);
  const active = contracts.filter(c => c.status === 'Active').length;
  const hasReport = contracts.some(c => c.report_table) || delegated.length;

  document.getElementById('vendorHeader').innerHTML = `
    <a href="/vendors.html" style="color:rgba(255,255,255,0.6);font-size:0.85rem">&larr; Who LAUSD is paying</a>
    <h1>${escapeHtml(name)}</h1>
    <p>${contracts.length} contract${contracts.length !== 1 ? 's' : ''} on this site &middot; ${active} active</p>`;

  const overlapIds = new Set(contracts.map(c => c.overlap_group).filter(Boolean));
  const overlaps = (data.service_overlaps || []).filter(g => overlapIds.has(g.id) ||
    g.members.some(m => !m.record_id && vendorKey(m.vendor_name) === key));
  const aiApps = (data.ai_student_apps || []).filter(a => key.startsWith(vendorKey(a.vendor_name)));
  const discrepancies = contracts.filter(c => c.data_discrepancy);

  document.getElementById('vendorBody').innerHTML = `
    <div class="vendor-stats">
      ${statTile(formatMoneyFull(total), 'Total contract value on this site')}
      ${hasReport ? statTile(formatMoneyFull(expended), 'Expended through 6/30/26 (LAUSD report)') : ''}
      ${delegated.length ? statTile(formatMoneyFull(delegatedTotal), 'Delegated school/office purchases, 6/23&ndash;6/26') : ''}
      ${statTile(String(contracts.length), 'Contracts')}
    </div>

    ${overlaps.map(g => overlapBlock(g, key, data.contracts)).join('')}

    ${discrepancies.length ? `<div class="data-discrepancy"><strong>Data discrepancies</strong>
      ${discrepancies.map(c => `<p style="margin:0.35rem 0"><a href="/contract.html?id=${c.id}">${escapeHtml(c.contract_number || c.title)}</a>: ${escapeHtml(c.data_discrepancy)}</p>`).join('')}
    </div>` : ''}

    <div class="contract-detail-grid">
      <div class="contract-main">
        <div class="detail-card">
          <h3>Contracts</h3>
          ${contracts.length ? `<div class="contracts-table-wrap"><table class="contracts-table">
            <thead><tr><th>Contract</th><th class="col-right">Amount</th><th>Status</th><th>Verification</th></tr></thead>
            <tbody>${contracts.sort((a, b) => (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0)).map(contractRow).join('')}</tbody>
          </table></div>` : '<p style="color:var(--text-muted)">No contract listed. Spending below is through delegated school/office purchases only.</p>'}
        </div>

        ${delegated.length ? `<div class="detail-card">
          <h3>Delegated purchases</h3>
          <p style="font-size:0.85rem;color:var(--text-light)">Purchases made directly by schools and offices with this vendor (6/1/23&ndash;6/30/26), outside the Board-approved contract amounts. Source: LAUSD report, Table 5.</p>
          <ul class="sidebar-list">${delegated.map(p => `<li>${escapeHtml(p.description)} <span class="sidebar-amount">${formatMoneyFull(p.amount)}</span></li>`).join('')}</ul>
        </div>` : ''}

        ${aiApps.length ? `<div class="detail-card">
          <h3>Generative AI in student-facing apps</h3>
          ${aiApps.map(a => `<p><strong>${escapeHtml(a.application)}</strong>: ${escapeHtml(a.description)}</p>`).join('')}
          <p style="font-size:0.82rem"><a href="/ai-apps.html">See all AI-enabled apps LAUSD has approved &rarr;</a></p>
        </div>` : ''}
      </div>

      <aside class="contract-sidebar">
        ${direct ? profileCard(direct, 'Vendor Profile') : ''}
        ${parents.map(p => profileCard(p, `Parent Company: ${p.vendor_name}`)).join('')}
        ${!direct && !parents.length ? `<div class="sidebar-card"><h4>Vendor Profile</h4>
          <p style="font-size:0.85rem;color:var(--text-muted)">No profile yet for this vendor. Know something? <a href="mailto:lausdcontractwatch@gmail.com">Tell us &rarr;</a></p></div>` : ''}
      </aside>
    </div>`;

  lucide.createIcons();
});

function statTile(value, label) {
  return `<div class="vendor-stat"><div class="vendor-stat-value">${value}</div><div class="vendor-stat-label">${label}</div></div>`;
}

function contractRow(c) {
  const sub = [c.contract_number, c.amount_basis].filter(Boolean).map(escapeHtml).join(' &middot; ');
  return `<tr class="clickable-row" onclick="location.href='/contract.html?id=${c.id}'">
    <td><a class="contract-link" href="/contract.html?id=${c.id}">${escapeHtml(c.short_name || c.title)}</a>
      <div class="contract-num">${sub}</div></td>
    <td class="col-right amount-cell">${formatMoneyFull(c.amount)}</td>
    <td>${statusBadge(c.status)}</td>
    <td>${verificationBadge(c.verification_status)}</td>
  </tr>`;
}

function overlapBlock(g, key, allContracts) {
  const rows = g.members.map(m => {
    // Link by the contract record's vendor name so it matches that vendor's page key
    const rec = m.record_id && allContracts.find(c => c.id === m.record_id);
    const linkName = rec ? rec.vendor_name : m.vendor_name;
    const self = vendorKey(linkName) === key;
    const spent = (m.expended || 0) + (m.delegated || 0);
    return `<tr${self ? ' class="overlap-self"' : ''}>
      <td><a href="${vendorUrl(linkName)}">${escapeHtml(m.vendor_name)}</a></td>
      <td>${escapeHtml(m.function)}</td>
      <td class="col-right">${spent ? formatMoneyFull(spent) : '$0'}</td>
    </tr>`;
  }).join('');
  return `<div class="overlap-card">
    <strong><i data-lucide="layers"></i> ${escapeHtml(g.title)}</strong>
    <p>${escapeHtml(g.summary)}</p>
    <div class="table-wrap"><table class="overlap-table">
      <thead><tr><th>Vendor</th><th>What LAUSD says it’s used for</th><th class="col-right">Bench + delegated spend</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <div class="overlap-source">Source: ${escapeHtml(g.source)}</div>
  </div>`;
}

function profileCard(p, heading) {
  const field = (label, val) => val ? `<div style="margin-bottom:0.6rem"><span style="font-size:0.75rem;color:var(--text-muted)">${label}</span><div style="font-size:0.85rem;line-height:1.5">${escapeHtml(val)}</div></div>` : '';
  return `<div class="sidebar-card">
    <h4>${escapeHtml(heading)}</h4>
    ${field('Parent company', p.parent_company)}
    ${field('Type', p.company_type)}
    ${field('Key executives', p.key_executives)}
    ${field('Spending', p.cost_analysis)}
    ${field('Concerns', p.controversies)}
    ${field('Notes', p.notes)}
    ${p.sources ? `<div style="font-size:0.72rem;color:var(--text-muted);margin-top:0.5rem">Sources: ${escapeHtml(p.sources)}</div>` : ''}
  </div>`;
}
