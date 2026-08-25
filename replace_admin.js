const fs = require('fs');
let text = fs.readFileSync('e:/hi suvai/kkadmin/admin.js', 'utf8');

// 1. In openEditProductModal
let search = "    document.getElementById('form-name').value = p.name;";
let replace = "    document.getElementById('form-sku').value = p.sku || p.productId || (p._id ? 'HS-' + String(p._id).slice(-5).toUpperCase() : '');\n" + search;
text = text.replace(search, replace);

// 2. In handleProductFormSubmit
search = "    formData.append('name', document.getElementById('form-name').value.trim());";
replace = "    formData.append('sku', document.getElementById('form-sku').value.trim());\n" + search;
text = text.replace(search, replace);

// 3. In openAddProductModal
search = "  document.getElementById('form-name').value = '';";
replace = "  document.getElementById('form-sku').value = '';\n" + search;
text = text.replace(search, replace);

// 4. In renderProducts (table)
search = "      <td class=\"prod-title-cell\">\n        <strong>${p.name}</strong>\n        <span>${p.tag || 'Traditional Choice'} — ${productId}</span>\n      </td>";
replace = "      <td class=\"prod-title-cell\">\n        <div style=\"font-size:0.75rem; color:var(--text-muted); font-weight:600; margin-bottom:2px;\">${productId.startsWith('Product ID') || productId.startsWith('HS') ? (productId.startsWith('HS') ? 'Product ID: ' + productId : productId) : 'Product ID: ' + productId}</div>\n        <strong>${p.name}</strong>\n        <span>${p.tag || 'Traditional Choice'} — ${p.unit || '250g'}</span>\n      </td>";
text = text.replace(search, replace);

fs.writeFileSync('e:/hi suvai/kkadmin/admin.js', text);
