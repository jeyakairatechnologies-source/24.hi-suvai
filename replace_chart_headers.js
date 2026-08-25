const fs = require('fs');
let text = fs.readFileSync('e:/hi suvai/kkadmin/index.html', 'utf8');

const search = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">';
const replace = '<div class="chart-title-wrap" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap: wrap; gap: 10px;">';
text = text.replaceAll(search, replace);

fs.writeFileSync('e:/hi suvai/kkadmin/index.html', text);
