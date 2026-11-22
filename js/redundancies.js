/* LAUSD Contract Watch — Possible Redundancies Page */

initLayout();

loadData().then(data => {
  const groups = data.service_overlaps || [];
  document.getElementById('redundancyToc').innerHTML = groups
    .map(g => `<a href="#overlap-${escapeHtml(g.id)}">${escapeHtml(g.title.replace(/^Overlapping |^Multiple |^Two /, ''))}</a>`)
    .join('');
  document.getElementById('redundancyGroups').innerHTML = groups
    .map(g => overlapGroupHtml(g, { contracts: data.contracts }))
    .join('');
  lucide.createIcons();
});
