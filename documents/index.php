<?php
function e($str) {
    return htmlspecialchars($str ?? '', ENT_QUOTES, 'UTF-8');
}
$files = glob('*.pdf');
$docx = glob('*.docx');
$all = array_merge($files, $docx);
usort($all, function($a, $b) { return strcmp($a, $b); });
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Source Documents — LAUSD Contract Watch</title>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'DM Sans', sans-serif; background: #f4f4f4; color: #1b2a4a; margin: 0; padding: 2rem; }
        h1 { text-align: center; color: #1b2a4a; margin-bottom: 0.25rem; }
        p.sub { text-align: center; color: #666; margin-bottom: 2rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem; max-width: 1200px; margin: 0 auto; }
        .card { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 0.75rem 1rem; display: flex; align-items: center; gap: 0.75rem; }
        .card .icon { font-size: 1.5rem; flex-shrink: 0; }
        .card .name { font-size: 0.85rem; color: #333; word-break: break-all; }
        a.card { text-decoration: none; color: inherit; transition: box-shadow 0.15s; }
        a.card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-color: #ccc; }
        .pdf .icon { color: #e74c3c; }
        .docx .icon { color: #2980b9; }
        .back { text-align: center; margin-top: 2rem; }
        .back a { color: #f07e6e; text-decoration: none; font-weight: 500; }
        .back a:hover { text-decoration: underline; }
        .count { text-align: center; color: #888; font-size: 0.85rem; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <h1>Source Documents</h1>
    <p class="sub">Board-approved contract documents from LAUSD. <?= count($all) ?> files.</p>
    <div class="grid">
        <?php foreach ($all as $f):
            $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
            $label = pathinfo($f, PATHINFO_FILENAME);
            // Pretty print the name
            $label = preg_replace('/_[a-z]$/', ' $1', $label);
            $label = str_replace('_', ' ', $label);
        ?>
        <a class="card <?= $ext ?>" href="<?= e($f) ?>">
            <span class="icon"><?= $ext === 'pdf' ? '📄' : '📝' ?></span>
            <span class="name"><?= e($label) ?><?= $ext === 'pdf' ? '' : '' ?></span>
        </a>
        <?php endforeach; ?>
    </div>
    <div class="back">
        <a href="/">← Back to LAUSD Contract Watch</a>
    </div>
</body>
</html>
