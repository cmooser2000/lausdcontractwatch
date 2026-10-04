/* LAUSD Contract Watch — AI in Classrooms Page */

initLayout();

loadData().then(data => {
  const apps = data.ai_student_apps || [];
  const related = data.ai_related_contracts || [];

  document.getElementById('aiSummary').innerHTML =
    `LAUSD lists <strong>${apps.length}</strong> PoDS-approved, student-facing apps or programs whose vendors say they include a generative AI component.`;

  document.getElementById('aiGrid').innerHTML = apps.map(a => `
    <div class="ai-card">
      <h3>${escapeHtml(a.application)}</h3>
      <div class="ai-vendor">${escapeHtml(a.vendor_name)}</div>
      <p>${escapeHtml(a.description)}</p>
      ${a.note ? `<div class="ai-note">${escapeHtml(a.note)}
        ${a.related_record_id ? ` <a href="/contract.html?id=${a.related_record_id}">View contract &rarr;</a>` : ''}</div>` : ''}
    </div>`).join('');

  document.getElementById('aiRelated').innerHTML = related.map(r => `
    <li><a href="/contract.html?id=${r.record_id}">${escapeHtml(r.vendor_name)}</a>
      (${escapeHtml(r.contract_number)}): ${escapeHtml(r.note)}</li>`).join('');

  lucide.createIcons();
});
