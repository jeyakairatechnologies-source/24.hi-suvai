/**
 * HI SUVAI ADMIN PANEL CONTROLLER
 * Inspired by VDG Fashion Admin Dashboard
 */

// Set your deployed backend URL here (e.g. 'https://hisuvai-backend.onrender.com') if you deploy your backend
const BACKEND_URL = '';

function getAdminApiUrl(path) {
  if (BACKEND_URL) {
    return BACKEND_URL + '/api' + path;
  }
  if (window.location.protocol === 'file:' || window.location.hostname === '') {
    return 'http://localhost:5000/api' + path;
  }
  if (window.location.origin.includes(':5000') || window.location.port === '5000') {
    return '/api' + path;
  }
  return `http://${window.location.hostname}:5000/api` + path;
}

const API_BASE = getAdminApiUrl('');

let authToken = localStorage.getItem('hisuvai_admin_token') || null;
let currentAdmin = null;

// State caches
let allProducts = [];
let allOrders = [];
let allBanners = [];
let currentSettings = {};
let deleteTargetId = null;

// ============================================================
// INITIALIZATION & AUTHENTICATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  if (authToken) {
    validateSessionAndBootstrap();
  } else {
    showAuthScreen();
  }
});

function showAuthScreen() {
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('admin-app').style.display = 'none';
}

function showAdminApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('admin-app').style.display = 'flex';
  bootstrapAdminDashboard();
}

async function validateSessionAndBootstrap() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (res.ok && data.success && data.admin) {
      currentAdmin = data.admin;
      localStorage.setItem('hisuvai_admin_user', JSON.stringify(currentAdmin));
      updateAdminUserUI();
      showAdminApp();
    } else {
      handleAdminLogout();
      showToast('Your session has expired. Please log in again.', 'error');
    }
  } catch (e) {
    handleAdminLogout();
  }
}

function updateAdminUserUI() {
  if (!currentAdmin) return;
  const name = currentAdmin.name || 'Admin';
  const initial = name.charAt(0).toUpperCase();

  const sbInitial = document.getElementById('sidebar-avatar-initial');
  if (sbInitial) sbInitial.textContent = initial;
  const sbName = document.getElementById('sidebar-user-name');
  if (sbName) sbName.textContent = name;

  const topInitial = document.getElementById('top-avatar-initial');
  if (topInitial) topInitial.textContent = initial;
  const topName = document.getElementById('top-user-name');
  if (topName) topName.textContent = name;
}

function showForgotPassword(e) {
  e.preventDefault();
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('forgot-password-link').parentElement.style.display = 'none';
  document.getElementById('forgot-password-panel').style.display = 'block';
  document.getElementById('forgot-email').value = '';
  document.getElementById('forgot-msg').textContent = '';
}

function hideForgotPassword(e) {
  e.preventDefault();
  document.getElementById('forgot-password-panel').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
  const link = document.getElementById('forgot-password-link');
  if (link && link.parentElement) link.parentElement.style.display = 'block';
}

async function handleForgotPassword() {
  const emailEl = document.getElementById('forgot-email');
  const msgEl = document.getElementById('forgot-msg');
  const email = emailEl ? emailEl.value.trim() : '';

  if (!email) {
    msgEl.innerHTML = '<span style="color:#e53e3e;">⚠️ Please enter your email address.</span>';
    return;
  }

  msgEl.innerHTML = '<span style="color:#7c3aed;">⏳ Sending reset link...</span>';

  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (res.ok) {
      msgEl.innerHTML = '<span style="color:#16a34a;">✅ ' + (data.message || 'Reset link sent! Check your email.') + '</span>';
    } else {
      msgEl.innerHTML = '<span style="color:#e53e3e;">❌ ' + (data.message || 'Email not found or error occurred.') + '</span>';
    }
  } catch (err) {
    msgEl.innerHTML = '<span style="color:#e53e3e;">❌ Network error. Please try again.</span>';
  }
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-submit-btn');

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Authenticating...';
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.success && data.token) {
      authToken = data.token;
      currentAdmin = data.admin;
      localStorage.setItem('hisuvai_admin_token', authToken);
      localStorage.setItem('hisuvai_admin_user', JSON.stringify(currentAdmin));
      showToast('✦ Login successful! Welcome to Hi Suvai Admin.');
      updateAdminUserUI();
      showAdminApp();
    } else {
      showToast(data.message || 'Invalid email or password', 'error');
    }
  } catch (error) {
    showToast('Failed to connect to backend server: ' + error.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Log In to Dashboard';
    }
  }
}

function handleAdminLogout() {
  authToken = null;
  currentAdmin = null;
  localStorage.removeItem('hisuvai_admin_token');
  localStorage.removeItem('hisuvai_admin_user');
  showToast('Logged out successfully');
  showAuthScreen();
}

// ============================================================
// NAVIGATION & VIEW SWITCHING
// ============================================================
function switchView(viewName) {
  // Update sidebar active buttons
  document.querySelectorAll('.sidebar-item').forEach(btn => btn.classList.remove('active'));
  const activeNav = document.getElementById(`nav-${viewName}`);
  if (activeNav) activeNav.classList.add('active');

  // Hide all sections
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  const targetSec = document.getElementById(`view-${viewName}`);
  if (targetSec) targetSec.classList.add('active');

  // Load specific data on view enter
  if (viewName === 'dashboard') {
    loadDashboardStats();
    loadAdminOrders();
  } else if (viewName === 'products') {
    loadAdminProducts();
  } else if (viewName === 'inventory') {
    loadAdminInventory();
  } else if (viewName === 'orders') {
    loadAdminOrders();
  } else if (viewName === 'banners') {
    loadAdminBanners();
  } else if (viewName === 'settings') {
    loadAdminSettings();
  }
}

function switchSettingsTab(tabName) {
  document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
}

// ============================================================
// BOOTSTRAP DATA
// ============================================================
let adminPollInterval = null;

async function bootstrapAdminDashboard() {
  await Promise.all([
    loadDashboardStats(),
    loadAdminProducts(),
    loadAdminOrders(),
    loadAdminBanners(),
    loadAdminSettings()
  ]);

  if (adminPollInterval) clearInterval(adminPollInterval);
  adminPollInterval = setInterval(() => {
    loadAdminOrders();
    const activeSec = document.querySelector('.view-section.active');
    if (activeSec && activeSec.id === 'view-inventory') {
      loadAdminInventory();
    }
  }, 8000);
}

// ============================================================
// DASHBOARD STATS
// ============================================================
async function loadDashboardStats() {
  try {
    const res = await fetch(`${API_BASE}/products/admin/stats`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();

    if (data.success && data.stats) {
      const s = data.stats;
      const kpiTotal = document.getElementById('kpi-total-products');
      if (kpiTotal) kpiTotal.textContent = s.totalProducts || 0;

      const sideProd = document.getElementById('sidebar-product-count');
      if (sideProd) sideProd.textContent = s.totalProducts || 0;

      // Category breakdown
      const catList = document.getElementById('category-distribution-list');
      if (catList && s.categoryBreakdown) {
        catList.innerHTML = '';
        s.categoryBreakdown.forEach(cat => {
          const row = document.createElement('div');
          row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--bg-surface-2); border-radius:6px;';
          row.innerHTML = `
            <span style="text-transform:capitalize; font-weight:600; color:var(--text-primary);">${cat._id}</span>
            <span class="badge cat">${cat.count} Items</span>
          `;
          catList.appendChild(row);
        });
      }
    }
  } catch (error) {
    console.warn('Dashboard stats error:', error);
  }
}

// ============================================================
// PRODUCTS MANAGEMENT
// ============================================================
async function loadAdminProducts() {
  const tbody = document.getElementById('admin-products-tbody');
  const loading = document.getElementById('table-loading-msg');
  const empty = document.getElementById('table-empty-msg');

  if (loading) loading.style.display = 'block';
  if (empty) empty.style.display = 'none';
  if (tbody) tbody.innerHTML = '';

  try {
    const res = await fetch(`${API_BASE}/products?limit=100`);
    const data = await res.json();

    if (loading) loading.style.display = 'none';

    if (data.success && data.products) {
      allProducts = data.products;
      const sideProd = document.getElementById('sidebar-product-count');
      if (sideProd) sideProd.textContent = allProducts.length;

      renderProductsTable(allProducts);
    }
  } catch (error) {
    if (loading) loading.style.display = 'none';
    showToast('Error loading products: ' + error.message, 'error');
  }
}

function renderProductsTable(products) {
  const tbody = document.getElementById('admin-products-tbody');
  const empty = document.getElementById('table-empty-msg');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (products.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  products.forEach(p => {
    const tr = document.createElement('tr');
    const imgSrc = resolveImageUrl(p.image);

    tr.innerHTML = `
      <td>
        <div class="prod-thumb-cell">
          <img src="${imgSrc}" alt="${p.name}" />
        </div>
      </td>
      <td class="prod-title-cell">
        <strong>${p.name}</strong>
        <span>${p.tag || 'Traditional Choice'} — ${p.unit || '250g'}</span>
      </td>
      <td>
        <span class="badge cat">${p.category}</span>
      </td>
      <td>
        <strong style="color:var(--crimson);">₹${p.price}</strong>
        ${p.originalPrice > p.price ? `<span style="font-size:0.75rem; text-decoration:line-through; color:var(--text-dim); margin-left:4px;">₹${p.originalPrice}</span>` : ''}
      </td>
      <td>
        <strong style="color:${p.stock <= 10 ? 'var(--danger)' : 'var(--text-primary)'};">${p.stock}</strong>
        <span style="font-size:0.75rem; color:var(--text-muted);">(${p.unit || '250g'})</span>
      </td>
      <td>
        ${p.isAvailable && p.stock > 0 
          ? '<span class="badge available">In Stock</span>' 
          : '<span class="badge outofstock">Out of Stock</span>'}
      </td>
      <td>
        ${p.isFeatured ? '<span class="badge featured">★ Featured</span>' : '<span style="color:var(--text-dim); font-size:0.75rem;">Standard</span>'}
      </td>
      <td>
        <div class="action-btns">
          <button class="btn-icon" title="Edit Product" onclick="openEditProductModal('${p._id}')">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon danger" title="Delete Product" onclick="promptDeleteProduct('${p._id}', '${p.name.replace(/'/g, "\\'")}')">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function handleProductFilterChange() {
  const searchVal = (document.getElementById('admin-search-input')?.value || '').toLowerCase().trim();
  const catVal = document.getElementById('admin-filter-category')?.value || 'all';
  const statusVal = document.getElementById('admin-filter-status')?.value || 'all';
  const sortVal = document.getElementById('admin-filter-sort')?.value || 'newest';

  let filtered = allProducts.filter(p => {
    const matchSearch = !searchVal || 
      p.name.toLowerCase().includes(searchVal) || 
      (p.tag && p.tag.toLowerCase().includes(searchVal)) ||
      (p.description && p.description.toLowerCase().includes(searchVal));

    const matchCat = catVal === 'all' || p.category === catVal;
    
    let matchStatus = true;
    if (statusVal === 'available') matchStatus = p.isAvailable && p.stock > 0;
    if (statusVal === 'outofstock') matchStatus = !p.isAvailable || p.stock <= 0;

    return matchSearch && matchCat && matchStatus;
  });

  if (sortVal === 'low-high') {
    filtered.sort((a,b) => a.price - b.price);
  } else if (sortVal === 'high-low') {
    filtered.sort((a,b) => b.price - a.price);
  }

  renderProductsTable(filtered);
}

// Product Modal Add/Edit
function openAddProductModal() {
  const form = document.getElementById('product-form');
  if (form) form.reset();
  document.getElementById('form-product-id').value = '';
  document.getElementById('product-modal-title').textContent = 'Add New Product';
  document.getElementById('main-image-preview-wrap').style.display = 'none';

  const modal = document.getElementById('product-modal-overlay');
  if (modal) modal.classList.add('open');
}

function openEditProductModal(id) {
  const p = allProducts.find(item => item._id === id);
  if (!p) return;

  document.getElementById('form-product-id').value = p._id;
  document.getElementById('product-modal-title').textContent = `Edit Product: ${p.name}`;
  document.getElementById('form-name').value = p.name;
  document.getElementById('form-tag').value = p.tag || '';
  document.getElementById('form-category').value = p.category;
  document.getElementById('form-price').value = p.price;
  document.getElementById('form-original-price').value = p.originalPrice || '';
  document.getElementById('form-stock').value = p.stock;
  document.getElementById('form-unit').value = p.unit || '250g';
  document.getElementById('form-short-desc').value = p.shortDescription || '';
  document.getElementById('form-desc').value = p.description;

  const previewWrap = document.getElementById('main-image-preview-wrap');
  const previewImg = document.getElementById('main-preview-img');
  if (p.image && previewImg) {
    previewImg.src = resolveImageUrl(p.image);
    if (previewWrap) previewWrap.style.display = 'block';
  }

  const modal = document.getElementById('product-modal-overlay');
  if (modal) modal.classList.add('open');
}

function closeProductModal() {
  const modal = document.getElementById('product-modal-overlay');
  if (modal) modal.classList.remove('open');
}

function previewMainImage(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.getElementById('main-preview-img');
      if (img) img.src = e.target.result;
      const wrap = document.getElementById('main-image-preview-wrap');
      if (wrap) wrap.style.display = 'block';
    };
    reader.readAsDataURL(input.files[0]);
  }
}

async function handleProductFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('form-product-id').value;
  const isEditing = !!id;

  const formData = new FormData();
  formData.append('name', document.getElementById('form-name').value.trim());
  formData.append('tag', document.getElementById('form-tag').value.trim());
  formData.append('category', document.getElementById('form-category').value);
  formData.append('price', document.getElementById('form-price').value);
  formData.append('originalPrice', document.getElementById('form-original-price').value || 0);
  formData.append('stock', document.getElementById('form-stock').value);
  formData.append('unit', document.getElementById('form-unit').value.trim() || '250g');
  formData.append('shortDescription', document.getElementById('form-short-desc').value.trim());
  formData.append('description', document.getElementById('form-desc').value.trim());

  const fileInput = document.getElementById('form-file-main');
  if (fileInput && fileInput.files[0]) {
    formData.append('image', fileInput.files[0]);
  }

  const submitBtn = document.getElementById('form-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
  }

  try {
    const url = isEditing ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: formData
    });

    const data = await res.json();

    if (data.success) {
      showToast(`Product ${isEditing ? 'updated' : 'created'} successfully!`);
      closeProductModal();
      loadAdminProducts();
      loadDashboardStats();
    } else {
      showToast(data.message || 'Failed to save product', 'error');
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Product';
    }
  }
}

function promptDeleteProduct(id, name) {
  deleteTargetId = id;
  const nameEl = document.getElementById('delete-prod-name');
  if (nameEl) nameEl.textContent = name;
  const modal = document.getElementById('delete-modal-overlay');
  if (modal) modal.classList.add('open');
}

function closeDeleteModal() {
  deleteTargetId = null;
  const modal = document.getElementById('delete-modal-overlay');
  if (modal) modal.classList.remove('open');
}

async function executeDeleteProduct() {
  if (!deleteTargetId) return;

  try {
    const res = await fetch(`${API_BASE}/products/${deleteTargetId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Product deleted successfully');
      closeDeleteModal();
      loadAdminProducts();
      loadDashboardStats();
    } else {
      showToast(data.message || 'Failed to delete product', 'error');
    }
  } catch (err) {
    showToast('Error deleting product: ' + err.message, 'error');
  }
}

// ============================================================
// ORDERS MANAGEMENT (NEW!)
// ============================================================
async function loadAdminOrders() {
  const tbody = document.getElementById('admin-orders-tbody');
  const dashTbody = document.getElementById('dashboard-recent-orders-tbody');
  const loading = document.getElementById('orders-loading-msg');
  const empty = document.getElementById('orders-empty-msg');

  if (loading) loading.style.display = 'block';
  if (empty) empty.style.display = 'none';

  let apiOrders = [];
  try {
    const headers = {};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    const res = await fetch(getAdminApiUrl('/orders?limit=100'), { headers });
    const data = await res.json();
    if (data.success && data.orders) {
      apiOrders = data.orders;
    }
  } catch (error) {
    console.warn('Orders API fetch notice:', error.message);
  }

  // Read local storage orders
  let localOrders = [];
  try {
    localOrders = JSON.parse(localStorage.getItem('hisuvai_orders') || '[]');
  } catch(e) {}

  // Merge API orders & local orders (deduplicate by orderId)
  const orderMap = new Map();
  apiOrders.forEach(o => { if (o && o.orderId) orderMap.set(o.orderId, o); });
  localOrders.forEach(o => {
    if (o && o.orderId && !orderMap.has(o.orderId)) {
      orderMap.set(o.orderId, o);
    }
  });

  allOrders = Array.from(orderMap.values());
  allOrders.sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));

  if (loading) loading.style.display = 'none';

  // Calculate KPIs
  const totalCount = allOrders.length;
  const pendingCount = allOrders.filter(o => (o.orderStatus || 'Pending') === 'Pending').length;
  const deliveredCount = allOrders.filter(o => (o.orderStatus === 'Shipped' || o.orderStatus === 'Delivered')).length;
  const totalRev = allOrders.reduce((sum, o) => {
    if (o.orderStatus === 'Cancelled') return sum;
    return sum + (o.pricing?.grandTotal || o.total || 0);
  }, 0);

  // Sidebar badge
  const sideOrder = document.getElementById('sidebar-order-count');
  if (sideOrder) sideOrder.textContent = totalCount;

  // Orders Tab KPIs
  const kpiTot = document.getElementById('orders-kpi-total'); if (kpiTot) kpiTot.textContent = totalCount;
  const kpiPend = document.getElementById('orders-kpi-pending'); if (kpiPend) kpiPend.textContent = pendingCount;
  const kpiDel = document.getElementById('orders-kpi-delivered'); if (kpiDel) kpiDel.textContent = deliveredCount;
  const kpiRev = document.getElementById('orders-kpi-revenue'); if (kpiRev) kpiRev.textContent = '₹' + totalRev;

  // Dashboard Tab KPIs
  const dTot = document.getElementById('kpi-total-orders'); if (dTot) dTot.textContent = totalCount;
  const dPend = document.getElementById('kpi-pending-orders'); if (dPend) dPend.textContent = pendingCount;
  const dRev = document.getElementById('kpi-total-revenue'); if (dRev) dRev.textContent = '₹' + totalRev;

  renderOrdersTable(allOrders);
  renderDashboardRecentOrders(allOrders.slice(0, 5));
}

function renderOrdersTable(orders) {
  const tbody = document.getElementById('admin-orders-tbody');
  const empty = document.getElementById('orders-empty-msg');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (orders.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  orders.forEach(ord => {
    const tr = document.createElement('tr');
    const targetId = ord._id || ord.orderId;
    const dateStr = new Date(ord.createdAt || Date.now()).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const itemsSummary = (ord.items || []).map(i => `${i.name} (${i.quantity})`).join(', ');

    tr.innerHTML = `
      <td>
        <strong style="color:var(--purple-accent); cursor:pointer;" onclick="openOrderDetailModal('${targetId}')">${ord.orderId}</strong>
        <span style="display:block; font-size:0.72rem; color:var(--text-muted);">${dateStr}</span>
      </td>
      <td>
        <strong>${ord.customer?.name || 'Customer'}</strong>
        <span style="display:block; font-size:0.75rem; color:var(--text-muted);">${ord.customer?.phone || ''}</span>
      </td>
      <td>
        <span style="font-size:0.82rem; color:var(--text-secondary);">${ord.customer?.city || ''}, ${ord.customer?.pincode || ''}</span>
      </td>
      <td>
        <span style="font-size:0.8rem; color:var(--text-muted);">${itemsSummary || 'Items'}</span>
      </td>
      <td>
        <strong style="color:var(--crimson); font-size:0.95rem;">₹${ord.pricing?.grandTotal || 0}</strong>
      </td>
      <td>
        <span style="font-size:0.75rem; font-weight:600; text-transform:uppercase; background:var(--bg-surface-2); padding:3px 8px; border-radius:4px;">
          ${ord.payment?.method || 'UPI'}
        </span>
      </td>
      <td>
        <select class="select-ctrl" style="padding:4px 8px; font-size:0.78rem;" onchange="updateOrderStatus('${targetId}', this.value)">
          <option value="Pending" ${ord.orderStatus === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Processing" ${ord.orderStatus === 'Processing' ? 'selected' : ''}>Processing</option>
          <option value="Shipped" ${ord.orderStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
          <option value="Delivered" ${ord.orderStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
          <option value="Cancelled" ${ord.orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
      <td>
        <button class="btn btn-outline" style="padding:4px 10px; font-size:0.75rem;" onclick="openOrderDetailModal('${targetId}')">
          View Details
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderDashboardRecentOrders(orders) {
  const tbody = document.getElementById('dashboard-recent-orders-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:var(--text-muted);">No customer orders placed yet.</td></tr>';
    return;
  }

  orders.forEach(ord => {
    const tr = document.createElement('tr');
    const dateStr = new Date(ord.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const itemsCount = (ord.items || []).reduce((s, i) => s + (i.quantity || 1), 0);

    tr.innerHTML = `
      <td><strong style="color:var(--purple-accent);">${ord.orderId}</strong></td>
      <td><strong>${ord.customer?.name || 'Customer'}</strong><br><span style="font-size:0.72rem; color:var(--text-muted);">${ord.customer?.phone || ''}</span></td>
      <td>${itemsCount} items</td>
      <td><strong style="color:var(--crimson);">₹${ord.pricing?.grandTotal || 0}</strong></td>
      <td><span style="font-size:0.72rem; text-transform:uppercase;">${ord.payment?.method || 'UPI'}</span></td>
      <td><span class="badge status-${(ord.orderStatus || 'Pending').toLowerCase()}">${ord.orderStatus || 'Pending'}</span></td>
      <td><span style="font-size:0.75rem; color:var(--text-muted);">${dateStr}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function handleOrderFilterChange() {
  const searchVal = (document.getElementById('order-search-input')?.value || '').toLowerCase().trim();
  const statusVal = document.getElementById('order-filter-status')?.value || 'all';

  const filtered = allOrders.filter(o => {
    const matchStatus = statusVal === 'all' || o.orderStatus === statusVal;
    const matchSearch = !searchVal ||
      (o.orderId && o.orderId.toLowerCase().includes(searchVal)) ||
      (o.customer?.name && o.customer.name.toLowerCase().includes(searchVal)) ||
      (o.customer?.phone && o.customer.phone.toLowerCase().includes(searchVal)) ||
      (o.customer?.city && o.customer.city.toLowerCase().includes(searchVal));

    return matchStatus && matchSearch;
  });

  renderOrdersTable(filtered);
}

async function updateOrderStatus(orderId, newStatus) {
  // Also update local storage if order exists there
  try {
    let localOrders = JSON.parse(localStorage.getItem('hisuvai_orders') || '[]');
    let updatedLocal = false;
    localOrders = localOrders.map(o => {
      if (o._id === orderId || o.orderId === orderId) {
        o.orderStatus = newStatus;
        updatedLocal = true;
      }
      return o;
    });
    if (updatedLocal) {
      localStorage.setItem('hisuvai_orders', JSON.stringify(localOrders));
    }
  } catch(e) {}

  try {
    const res = await fetch(getAdminApiUrl(`/orders/${orderId}/status`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Order status updated to ${newStatus}`);
    }
  } catch (err) {
    console.warn('Backend status update warning:', err.message);
  }
  showToast(`Order status set to ${newStatus}`);
  loadAdminOrders();
}

function openOrderDetailModal(orderId) {
  const ord = allOrders.find(o => o._id === orderId || o.orderId === orderId);
  if (!ord) return;

  const dateStr = new Date(ord.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const idEl = document.getElementById('od-modal-order-id'); if (idEl) idEl.textContent = `Order ${ord.orderId}`;
  const dtEl = document.getElementById('od-modal-date'); if (dtEl) dtEl.textContent = `Placed on ${dateStr}`;

  // Customer info
  const cName = document.getElementById('od-cust-name'); if (cName) cName.textContent = ord.customer?.name || '-';
  const cPhone = document.getElementById('od-cust-phone'); if (cPhone) cPhone.textContent = ord.customer?.phone || '-';
  const cEmail = document.getElementById('od-cust-email'); if (cEmail) cEmail.textContent = ord.customer?.email || 'N/A';
  const cCity = document.getElementById('od-cust-city'); if (cCity) cCity.textContent = `${ord.customer?.city || ''}, ${ord.customer?.state || ''} - ${ord.customer?.pincode || ''}`;
  const cAddr = document.getElementById('od-cust-address'); if (cAddr) cAddr.textContent = `${ord.customer?.address || ''} ${ord.customer?.apartment || ''}`;

  // Line items
  const itemsContainer = document.getElementById('od-items-container');
  if (itemsContainer) {
    itemsContainer.innerHTML = '';
    (ord.items || []).forEach(item => {
      const row = document.createElement('div');
      row.className = 'order-detail-row';
      row.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="${resolveImageUrl(item.image)}" style="width:36px; height:36px; object-fit:contain; border-radius:4px; border:1px solid var(--border-color);" />
          <div>
            <strong>${item.name}</strong>
            <span style="font-size:0.75rem; color:var(--text-muted); display:block;">Qty: ${item.quantity} × ₹${item.price} (${item.unit || '250g'})</span>
          </div>
        </div>
        <strong>₹${item.price * item.quantity}</strong>
      `;
      itemsContainer.appendChild(row);
    });
  }

  // Totals
  const payEl = document.getElementById('od-pay-method'); if (payEl) payEl.textContent = ord.payment?.method || 'UPI';
  const statEl = document.getElementById('od-order-status'); if (statEl) statEl.textContent = ord.orderStatus || 'Pending';
  const totEl = document.getElementById('od-grand-total'); if (totEl) totEl.textContent = '₹' + (ord.pricing?.grandTotal || 0);

  const modal = document.getElementById('order-detail-modal-overlay');
  if (modal) modal.classList.add('open');
}

function closeOrderDetailModal() {
  const modal = document.getElementById('order-detail-modal-overlay');
  if (modal) modal.classList.remove('open');
}

// ============================================================
// INDEX BANNERS MANAGEMENT (VDG FASHION STYLE)
// ============================================================
async function loadAdminBanners() {
  try {
    const res = await fetch(`${API_BASE}/banners`);
    const data = await res.json();
    if (data.success && data.banners) {
      allBanners = data.banners;
      data.banners.forEach(b => {
        const slot = b.slot;
        const imgEl = document.getElementById(`banner-img-${slot}`);
        if (imgEl && b.image) imgEl.src = resolveImageUrl(b.image);

        const thumbEl = document.getElementById(`slot-thumb-${slot}`);
        if (thumbEl && b.image) thumbEl.src = resolveImageUrl(b.image);

        const titleEl = document.getElementById(`banner-title-${slot}`);
        if (titleEl && b.title) titleEl.value = b.title;
      });
    }
  } catch (err) {
    console.warn('Banners load error:', err);
  }
}

function previewSlotImage(slot, input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.getElementById(`banner-img-${slot}`);
      if (img) img.src = e.target.result;
      const thumb = document.getElementById(`slot-thumb-${slot}`);
      if (thumb) thumb.src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

async function handleBannerUpload(e, slot) {
  e.preventDefault();
  const fileInput = document.getElementById(`banner-file-${slot}`);
  const titleInput = document.getElementById(`banner-title-${slot}`);

  const formData = new FormData();
  if (titleInput && titleInput.value) {
    formData.append('title', titleInput.value.trim());
  }
  if (fileInput && fileInput.files[0]) {
    formData.append('bannerImage', fileInput.files[0]);
  }

  try {
    const res = await fetch(`${API_BASE}/banners/slot/${slot}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Slot ${slot} banner updated successfully!`);
      loadAdminBanners();
    } else {
      showToast(data.message || 'Failed to update banner', 'error');
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

// ============================================================
// SETTINGS & SOCIAL LINKS MANAGEMENT
// ============================================================
async function loadAdminSettings() {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    const data = await res.json();
    if (data.success && data.settings) {
      currentSettings = data.settings;
      const s = data.settings;

      const phone = document.getElementById('setting-phone'); if (phone) phone.value = s.supportPhone || '';
      const email = document.getElementById('setting-email'); if (email) email.value = s.contactEmail || '';
      const addr = document.getElementById('setting-address'); if (addr) addr.value = s.storeAddress || '';
      const about = document.getElementById('setting-about'); if (about) about.value = s.aboutText || '';

      const fb = document.getElementById('setting-facebook'); if (fb) fb.value = s.facebookUrl || '';
      const ig = document.getElementById('setting-instagram'); if (ig) ig.value = s.instagramUrl || '';
      const yt = document.getElementById('setting-youtube'); if (yt) yt.value = s.youtubeUrl || '';
      const wa = document.getElementById('setting-whatsapp'); if (wa) wa.value = s.whatsappNumber || '';

      const logoImg = document.getElementById('settings-logo-preview');
      if (logoImg && s.storeLogo) logoImg.src = resolveImageUrl(s.storeLogo);
    }
  } catch (err) {
    console.warn('Settings load error:', err);
  }
}

function previewLogoFile(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.getElementById('settings-logo-preview');
      if (img) img.src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

async function saveStoreSettings() {
  const formData = new FormData();
  formData.append('supportPhone', document.getElementById('setting-phone')?.value.trim() || '');
  formData.append('contactEmail', document.getElementById('setting-email')?.value.trim() || '');
  formData.append('storeAddress', document.getElementById('setting-address')?.value.trim() || '');
  formData.append('aboutText', document.getElementById('setting-about')?.value.trim() || '');

  formData.append('facebookUrl', document.getElementById('setting-facebook')?.value.trim() || '');
  formData.append('instagramUrl', document.getElementById('setting-instagram')?.value.trim() || '');
  formData.append('youtubeUrl', document.getElementById('setting-youtube')?.value.trim() || '');
  formData.append('whatsappNumber', document.getElementById('setting-whatsapp')?.value.trim() || '');

  const logoFile = document.getElementById('settings-logo-file');
  if (logoFile && logoFile.files[0]) {
    formData.append('storeLogo', logoFile.files[0]);
  }

  try {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: formData
    });
    const data = await res.json();
    if (res.status === 401) {
      showToast('Session expired. Please log in again.', 'error');
      setTimeout(() => handleAdminLogout(), 1500);
      return;
    }
    if (data.success) {
      showToast('✦ Configuration saved successfully! Public storefront updated.');
      loadAdminSettings();
    } else {
      showToast(data.message || 'Failed to save configuration', 'error');
    }
  } catch (err) {
    showToast('Error saving settings: ' + err.message, 'error');
  }
}

// Global search bar
function handleGlobalSearch(query) {
  const q = query.toLowerCase().trim();
  if (!q) return;

  // Search products
  const matchedProd = allProducts.filter(p => p.name.toLowerCase().includes(q));
  if (matchedProd.length > 0) {
    switchView('products');
    const pInput = document.getElementById('admin-search-input');
    if (pInput) { pInput.value = query; handleProductFilterChange(); }
  }
}

// ============================================================
// HELPERS
// ============================================================
function resolveImageUrl(img) {
  if (!img) return 'suvai1.png';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  if (img.startsWith('/uploads/')) return img;
  if (img.startsWith('assets/')) return '/' + img;
  return '/' + img;
}

function closeModalOnBackdrop(e) {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : '⚠️'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ============================================================
// INVENTORY CONTROL CENTRE MANAGEMENT (VDG FASHION MATCH)
// ============================================================
async function loadAdminInventory() {
  const tbody = document.getElementById('admin-inventory-tbody');
  const loadingMsg = document.getElementById('inv-loading-msg');
  const emptyMsg = document.getElementById('inv-empty-msg');

  if (loadingMsg) loadingMsg.style.display = 'block';
  if (emptyMsg) emptyMsg.style.display = 'none';
  if (tbody) tbody.innerHTML = '';

  try {
    const res = await fetch(getAdminApiUrl('/products?limit=100'));
    const data = await res.json();

    if (data.success && data.products) {
      allProducts = data.products;
      renderInventoryKPIs(allProducts);
      renderInventoryTable(allProducts);
    } else {
      if (emptyMsg) emptyMsg.style.display = 'block';
    }
  } catch (error) {
    console.error('Error loading inventory:', error);
    showToast('Failed to connect to server for inventory data.', 'error');
  } finally {
    if (loadingMsg) loadingMsg.style.display = 'none';
  }
}

function renderInventoryKPIs(products) {
  const totalEl = document.getElementById('inv-kpi-total');
  const valEl = document.getElementById('inv-kpi-valuation');
  const outEl = document.getElementById('inv-kpi-outofstock');
  const lowEl = document.getElementById('inv-kpi-lowstock');
  const badgeEl = document.getElementById('sidebar-lowstock-count');

  if (!products) return;

  const totalItems = products.length;
  let totalValuation = 0;
  let outOfStockCount = 0;
  let lowStockCount = 0;

  products.forEach(p => {
    const qty = p.stock !== undefined ? Number(p.stock) : 0;
    const price = Number(p.price || 0);
    totalValuation += qty * price;

    if (qty === 0) {
      outOfStockCount++;
    } else if (qty <= 15) {
      lowStockCount++;
    }
  });

  if (totalEl) totalEl.textContent = totalItems;
  if (valEl) valEl.textContent = '₹' + totalValuation.toLocaleString('en-IN');
  if (outEl) outEl.textContent = outOfStockCount;
  if (lowEl) lowEl.textContent = lowStockCount;

  if (badgeEl) {
    const totalAlerts = outOfStockCount + lowStockCount;
    if (totalAlerts > 0) {
      badgeEl.textContent = totalAlerts;
      badgeEl.style.display = 'inline-flex';
    } else {
      badgeEl.style.display = 'none';
    }
  }
}

function renderInventoryTable(products) {
  const tbody = document.getElementById('admin-inventory-tbody');
  const emptyMsg = document.getElementById('inv-empty-msg');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!products || products.length === 0) {
    if (emptyMsg) emptyMsg.style.display = 'block';
    return;
  }
  if (emptyMsg) emptyMsg.style.display = 'none';

  products.forEach(p => {
    const idKey = p._id || p.id;
    const stockQty = p.stock !== undefined ? Number(p.stock) : 0;
    const price = Number(p.price || 0);
    const sku = p.sku || `Product ID: HS-${String(idKey).slice(-5).toUpperCase()}`;

    let statusBadgeHtml = '';
    if (stockQty === 0) {
      statusBadgeHtml = `<span class="stock-badge stock-badge-out">OUT OF STOCK</span>`;
    } else if (stockQty <= 15) {
      statusBadgeHtml = `<span class="stock-badge stock-badge-low">LOW STOCK</span>`;
    } else {
      statusBadgeHtml = `<span class="stock-badge stock-badge-in">IN STOCK</span>`;
    }

    const tr = document.createElement('tr');
    tr.id = `inv-row-${idKey}`;
    tr.innerHTML = `
      <td>
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="${resolveImageUrl(p.image)}" alt="${p.name}" style="width:42px; height:42px; object-fit:cover; border-radius:8px; border:1px solid #E5E7EB;" />
          <div>
            <div style="font-weight:700; color:var(--text-primary); font-size:0.9rem; max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${p.name}</div>
            <div style="font-size:0.75rem; color:var(--text-dim); margin-top:2px;">${sku}</div>
          </div>
        </div>
      </td>
      <td>
        <span style="font-size:0.82rem; font-weight:600; color:var(--text-muted); text-transform:capitalize;">${p.category || 'general'} ${p.unit ? '> ' + p.unit : ''}</span>
      </td>
      <td>
        <span style="font-weight:700; color:var(--text-primary); font-size:0.9rem;">₹${price}</span>
      </td>
      <td>
        <div class="stock-level-cell">
          <span class="stock-units-num">${stockQty} <span style="font-size:0.75rem; font-weight:500; color:var(--text-dim);">units</span></span>
          ${statusBadgeHtml}
        </div>
      </td>
      <td style="text-align:center;">
        <div class="quick-adjust-group">
          <button class="btn-adjust" onclick="quickAdjustStock('${idKey}', -5)" title="Subtract 5">-5</button>
          <button class="btn-adjust" onclick="quickAdjustStock('${idKey}', -1)" title="Subtract 1">-1</button>
          <button class="btn-adjust-edit" onclick="promptEditStock('${idKey}', ${stockQty})" title="Set exact stock level">Edit</button>
          <button class="btn-adjust" onclick="quickAdjustStock('${idKey}', 1)" title="Add 1">+1</button>
          <button class="btn-adjust" onclick="quickAdjustStock('${idKey}', 5)" title="Add 5">+5</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function handleInventoryFilterChange() {
  const search = document.getElementById('inv-search-input')?.value.toLowerCase().trim() || '';
  const category = document.getElementById('inv-filter-category')?.value || 'all';
  const status = document.getElementById('inv-filter-status')?.value || 'all';

  let filtered = allProducts.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search) ||
      (p.sku && p.sku.toLowerCase().includes(search)) ||
      (p.tag && p.tag.toLowerCase().includes(search));

    const matchCategory = category === 'all' || p.category === category;

    const qty = p.stock !== undefined ? Number(p.stock) : 0;
    let matchStatus = true;
    if (status === 'instock') matchStatus = qty > 15;
    else if (status === 'lowstock') matchStatus = qty > 0 && qty <= 15;
    else if (status === 'outofstock') matchStatus = qty === 0;

    return matchSearch && matchCategory && matchStatus;
  });

  renderInventoryTable(filtered);
}

async function quickAdjustStock(productId, delta) {
  const prodIndex = allProducts.findIndex(p => (p._id || p.id) == productId);
  if (prodIndex === -1) return;

  const product = allProducts[prodIndex];
  const currentStock = product.stock !== undefined ? Number(product.stock) : 0;
  const newStock = Math.max(0, currentStock + delta);

  // Optimistic UI update
  product.stock = newStock;
  product.isAvailable = newStock > 0;
  renderInventoryKPIs(allProducts);
  handleInventoryFilterChange();

  try {
    const res = await fetch(getAdminApiUrl(`/products/${productId}/stock`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ stock: newStock })
    });
    const data = await res.json();

    if (data.success) {
      showToast(`Stock updated to ${newStock} units for "${product.name}"`, 'success');
    } else {
      product.stock = currentStock;
      product.isAvailable = currentStock > 0;
      renderInventoryKPIs(allProducts);
      handleInventoryFilterChange();
      showToast(data.message || 'Failed to update stock', 'error');
    }
  } catch (error) {
    product.stock = currentStock;
    product.isAvailable = currentStock > 0;
    renderInventoryKPIs(allProducts);
    handleInventoryFilterChange();
    showToast('Network error updating stock', 'error');
  }
}

async function setExactStock(productId, newStock) {
  const prodIndex = allProducts.findIndex(p => (p._id || p.id) == productId);
  if (prodIndex === -1) return;

  const product = allProducts[prodIndex];
  const currentStock = product.stock !== undefined ? Number(product.stock) : 0;
  const targetStock = Math.max(0, Number(newStock));

  // Optimistic UI update
  product.stock = targetStock;
  product.isAvailable = targetStock > 0;
  renderInventoryKPIs(allProducts);
  handleInventoryFilterChange();

  try {
    const res = await fetch(getAdminApiUrl(`/products/${productId}/stock`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ stock: targetStock })
    });
    const data = await res.json();

    if (data.success) {
      showToast(`Stock set to ${targetStock} units for "${product.name}"`, 'success');
    } else {
      product.stock = currentStock;
      product.isAvailable = currentStock > 0;
      renderInventoryKPIs(allProducts);
      handleInventoryFilterChange();
      showToast(data.message || 'Failed to update stock', 'error');
    }
  } catch (error) {
    product.stock = currentStock;
    product.isAvailable = currentStock > 0;
    renderInventoryKPIs(allProducts);
    handleInventoryFilterChange();
    showToast('Network error updating stock', 'error');
  }
}

function promptEditStock(productId, currentStock) {
  const prod = allProducts.find(p => (p._id || p.id) == productId);
  if (!prod) return;

  const val = prompt(`Enter exact stock count for "${prod.name}":`, currentStock);
  if (val === null || val.trim() === '') return;

  const num = parseInt(val, 10);
  if (isNaN(num) || num < 0) {
    showToast('Please enter a valid number (0 or higher) for stock.', 'error');
    return;
  }

  setExactStock(productId, num);
}
