/* LAUSD Contract Watch — Board Members Page */

initLayout();

loadData().then(data => {
  renderBoard(data.board_members, data.vendor_connections, data.conflicts_of_interest);
  renderConnections(data.vendor_connections, data.board_members, data.contracts);
});

function renderBoard(members, connections, conflicts) {
  const grid = document.getElementById('boardGrid');
  const active = members.filter(m => m.active);
  const inactive = members.filter(m => !m.active);
  const all = [...active, ...inactive];

  grid.innerHTML = all.map(m => {
    const memberConns = connections.filter(vc => vc.board_member_id === m.id);
    const memberConflicts = conflicts.filter(cf => cf.filer_name && cf.filer_name.toLowerCase().includes(m.name.split(' ').pop().toLowerCase()));
    const initials = m.name.split(' ').map(w => w[0]).filter((_, i, a) => i === 0 || i === a.length - 1).join('');
    return `
      <div class="board-card${m.active ? '' : ' board-card-inactive'}">
        <div class="board-avatar">${escapeHtml(initials)}</div>
        <h3>${escapeHtml(m.name)}</h3>
        <div class="board-info board-district">District ${escapeHtml(m.district || 'N/A')}</div>
        <div class="board-info">${escapeHtml(m.position || 'Board Member')}</div>
        <div class="board-term">${formatDate(m.term_start)} &ndash; ${m.term_end ? formatDate(m.term_end) : 'Present'}</div>
        ${m.email ? `<div style="font-size:0.82rem;margin-bottom:0.5rem"><a href="mailto:${escapeHtml(m.email)}">${escapeHtml(m.email)}</a></div>` : ''}
        ${m.phone ? `<div style="font-size:0.82rem;color:var(--text-muted)">${escapeHtml(m.phone)}</div>` : ''}
        ${memberConns.length || memberConflicts.length ? `
          <div class="board-connections-summary">
            ${memberConns.length ? `<span class="connection-badge">${memberConns.length} vendor connection${memberConns.length !== 1 ? 's' : ''}</span>` : ''}
            ${memberConflicts.length ? `<div class="conn-total">${memberConflicts.length} Form 700 flag${memberConflicts.length !== 1 ? 's' : ''}</div>` : ''}
          </div>` : ''}
        ${!m.active ? `<div style="margin-top:0.5rem"><span class="badge badge-expired">Former Member</span></div>` : ''}
      </div>`;
  }).join('');
}

function renderConnections(connections, members, contracts) {
  const list = document.getElementById('connectionsList');
  if (!connections.length) {
    list.innerHTML = `<p style="color:var(--text-muted)">No vendor connections on record.</p>`;
    return;
  }

  list.innerHTML = `<div class="connections-list">${connections.map(vc => {
    const member = members.find(m => m.id === vc.board_member_id);
    const relatedContracts = contracts.filter(c =>
      (c.vendor_name || '').toLowerCase().includes((vc.vendor_name || '').toLowerCase().split(/\s/)[0])
    ).slice(0, 3);

    return `
      <div class="connection-card">
        <div class="conn-header">
          <span class="conn-type-badge">${escapeHtml(vc.connection_type || 'Connection')}</span>
        </div>
        <div class="conn-body">
          <div class="conn-parties">
            <div class="conn-party">
              <span class="conn-role">Board Member</span>
              <strong>${escapeHtml(member ? member.name : 'Unknown')}</strong>
              <span>${escapeHtml(member ? member.position || `District ${member.district}` : '')}</span>
            </div>
            <span class="conn-arrow">⟷</span>
            <div class="conn-party">
              <span class="conn-role">Vendor</span>
              <strong>${escapeHtml(vc.vendor_name)}</strong>
            </div>
          </div>
          <p class="conn-desc">${escapeHtml(vc.description || '')}</p>
          ${relatedContracts.length ? `
            <div class="conn-contracts">
              <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.25rem">Related contracts:</div>
              ${relatedContracts.map(c =>
                `<a class="conn-contract-link" href="/contract.html?id=${c.id}">${escapeHtml(c.title)} &mdash; ${formatMoney(c.amount)}</a>`
              ).join('')}
            </div>` : ''}
        </div>
      </div>`;
  }).join('')}</div>`;
}
