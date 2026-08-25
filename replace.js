const fs = require('fs');
let text = fs.readFileSync('e:/hi suvai/index.html', 'utf8');

const search = "      const shortDesc = p.shortDescription || (p.description ? p.description.slice(0, 45) + '...' : '');";
const replace = search + "\n      const sku = p.sku || `Product ID: HS-${String(idKey).slice(-5).toUpperCase()}`;";
text = text.replace(search, replace);

const search2 = "          <h4 onclick=\"openProductDetailModal('${idKey}')\" style=\"cursor:pointer;\">${p.name}</h4>";
const replace2 = search2 + "\n          <div style=\"font-size: 0.75rem; color: var(--text-muted); font-weight: 500; margin-top: -6px; margin-bottom: 8px;\">${sku.startsWith('Product ID:') || sku.startsWith('SKU:') ? sku.replace('SKU:', 'Product ID:') : 'Product ID: ' + sku}</div>";
text = text.replace(search2, replace2);

fs.writeFileSync('e:/hi suvai/index.html', text);
