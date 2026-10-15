/**
 * LOSTLINK Web Platform - Client Script
 * Handles authentication, item listing, filtering, pagination, and reporting.
 */

// Application State
const state = {
  token: localStorage.getItem('lostlink_token') || null,
  user: JSON.parse(localStorage.getItem('lostlink_user') || 'null'),
  currentTab: 'feed',
  page: 0,
  size: 9,
  totalPages: 1,
  filters: {
    itemType: '',
    status: 'OPEN',
    category: '',
    location: '',
    keyword: ''
  },
  authMode: 'login', // 'login' or 'register'
  unreadMessagesCount: 0,
  activeChat: {
    itemId: null,
    receiverId: null,
    itemTitle: '',
    receiverName: '',
    pollTimer: null,
    renderedIds: new Set()
  }
};

// Category icon map for visual badges & placeholder graphics
const categoryIcons = {
  'Electronics': 'fa-laptop',
  'Documents': 'fa-file-lines',
  'Accessories': 'fa-ring',
  'Wallets & Bags': 'fa-wallet',
  'Keys & Cards': 'fa-key',
  'Books & Stationery': 'fa-book',
  'Others': 'fa-box'
};

// Initial document setup
document.addEventListener('DOMContentLoaded', () => {
  initAuthState();
  fetchItems();
  initChatbot();

  // 1. Poll unread messages every 15 seconds dynamically
  setInterval(fetchUnreadCount, 15000);

  // Close notification dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const bellBtn = document.getElementById('notificationBellBtn');
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown && !dropdown.classList.contains('hidden') && bellBtn && !bellBtn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });

  // Search input debounce / enter key support
  const keywordInput = document.getElementById('filterKeyword');
  if (keywordInput) {
    keywordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') applyFilters();
    });
  }

  const locationInput = document.getElementById('filterLocation');
  if (locationInput) {
    locationInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') applyFilters();
    });
  }
});

/* ================= AUTHENTICATION LOGIC ================= */

function initAuthState() {
  const unauthButtons = document.getElementById('unauthButtons');
  const authUserMenu = document.getElementById('authUserMenu');
  const userNameLabel = document.getElementById('userNameLabel');
  const userEmailLabel = document.getElementById('userEmailLabel');
  const userAvatarText = document.getElementById('userAvatarText');

  if (state.token && state.user) {
    unauthButtons.classList.add('hidden');
    authUserMenu.classList.remove('hidden');
    userNameLabel.textContent = state.user.name || 'User';
    userEmailLabel.textContent = state.user.email || '';
    userAvatarText.textContent = (state.user.name || 'U').charAt(0).toUpperCase();

    // Fetch initial unread count on login/load
    fetchUnreadCount();
  } else {
    unauthButtons.classList.remove('hidden');
    authUserMenu.classList.add('hidden');
    const badge = document.getElementById('unreadBadge');
    if (badge) badge.classList.add('hidden');
  }
}

function openAuthModal(mode = 'login') {
  state.authMode = mode;
  switchAuthTab(mode);
  document.getElementById('authErrorMsg').classList.add('hidden');
  document.getElementById('authModal').classList.remove('hidden');
}

function closeAuthModal() {
  document.getElementById('authModal').classList.add('hidden');
}

function switchAuthTab(mode) {
  state.authMode = mode;
  const tabSignIn = document.getElementById('tabSignIn');
  const tabRegister = document.getElementById('tabRegister');
  const authTitle = document.getElementById('authTitle');
  const authSubtitle = document.getElementById('authSubtitle');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const authNameGroup = document.getElementById('authNameGroup');
  const authPhoneGroup = document.getElementById('authPhoneGroup');
  const authErrorMsg = document.getElementById('authErrorMsg');

  authErrorMsg.classList.add('hidden');

  if (mode === 'login') {
    tabSignIn.className = 'flex-1 py-2 rounded-xl text-sm font-bold bg-white text-slate-800 shadow-sm transition';
    tabRegister.className = 'flex-1 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 transition';
    authTitle.textContent = 'Welcome Back';
    authSubtitle.textContent = 'Enter your credentials to manage lost & found items.';
    authSubmitBtn.textContent = 'Sign In';
    authNameGroup.classList.add('hidden');
    authPhoneGroup.classList.add('hidden');
    document.getElementById('authName').removeAttribute('required');
  } else {
    tabRegister.className = 'flex-1 py-2 rounded-xl text-sm font-bold bg-white text-slate-800 shadow-sm transition';
    tabSignIn.className = 'flex-1 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 transition';
    authTitle.textContent = 'Join LOSTLINK';
    authSubtitle.textContent = 'Create an account to report, track, and recover belongings.';
    authSubmitBtn.textContent = 'Create Account';
    authNameGroup.classList.remove('hidden');
    authPhoneGroup.classList.remove('hidden');
    document.getElementById('authName').setAttribute('required', 'true');
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const errorBanner = document.getElementById('authErrorMsg');
  const submitBtn = document.getElementById('authSubmitBtn');

  errorBanner.classList.add('hidden');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Processing...';

  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;

  try {
    let response;
    if (state.authMode === 'login') {
      response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
    } else {
      const name = document.getElementById('authName').value.trim();
      const phone = document.getElementById('authPhone').value.trim();
      response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone })
      });
    }

    const data = await response.json();

    if (!response.ok) {
      const errorText = data.message || (data.errors ? Object.values(data.errors).join(', ') : 'Authentication failed');
      throw new Error(errorText);
    }

    // Save token and user info
    state.token = data.token;
    state.user = { id: data.userId, name: data.name, email: data.email };
    localStorage.setItem('lostlink_token', state.token);
    localStorage.setItem('lostlink_user', JSON.stringify(state.user));

    initAuthState();
    closeAuthModal();
    showToast(state.authMode === 'login' ? `Welcome back, ${data.name}!` : `Account created! Welcome, ${data.name}!`, 'success');

    // Refresh feed with user context
    fetchItems();
  } catch (err) {
    errorBanner.textContent = err.message;
    errorBanner.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = state.authMode === 'login' ? 'Sign In' : 'Create Account';
  }
}

function handleLogout() {
  closeChat();
  state.token = null;
  state.user = null;
  state.unreadMessagesCount = 0;
  localStorage.removeItem('lostlink_token');
  localStorage.removeItem('lostlink_user');
  initAuthState();
  showToast('You have been logged out.', 'info');
  if (state.currentTab === 'my-items') {
    switchTab('feed');
  } else {
    fetchItems();
  }
}

/* ================= ITEM FEED & FILTERING LOGIC ================= */

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }
  return headers;
}

async function fetchItems() {
  const itemsGrid = document.getElementById('itemsGrid');
  const emptyState = document.getElementById('emptyState');
  const loadingState = document.getElementById('loadingState');
  const paginationBar = document.getElementById('paginationBar');
  const resultsCount = document.getElementById('resultsCount');

  itemsGrid.innerHTML = '';
  emptyState.classList.add('hidden');
  loadingState.classList.remove('hidden');

  try {
    const params = new URLSearchParams();
    if (state.filters.itemType) params.append('itemType', state.filters.itemType);
    if (state.filters.status) params.append('status', state.filters.status);
    if (state.filters.category) params.append('category', state.filters.category);
    if (state.filters.location) params.append('location', state.filters.location);
    params.append('page', state.page);
    params.append('size', state.size);
    params.append('sortBy', 'createdAt');
    params.append('sortDir', 'desc');

    const res = await fetch(`/api/items?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Please sign in to view items.');
      }
      throw new Error('Failed to load items.');
    }

    const data = await res.json();
    loadingState.classList.add('hidden');

    let items = data.content || [];

    // Filter by keyword locally if search keyword present
    if (state.filters.keyword) {
      const kw = state.filters.keyword.toLowerCase();
      items = items.filter(i => 
        i.title.toLowerCase().includes(kw) || 
        i.description.toLowerCase().includes(kw) ||
        (i.location && i.location.toLowerCase().includes(kw))
      );
    }

    // If My Posts tab active, filter by current user
    if (state.currentTab === 'my-items' && state.user) {
      items = items.filter(i => i.userId === state.user.id);
    }

    state.totalPages = data.totalPages || 1;
    resultsCount.textContent = `Showing ${items.length} listing(s) • Page ${data.number + 1} of ${Math.max(data.totalPages, 1)}`;

    if (items.length === 0) {
      emptyState.classList.remove('hidden');
      paginationBar.classList.add('hidden');
      return;
    }

    items.forEach(item => {
      itemsGrid.appendChild(createItemCard(item));
    });

    updatePaginationControls(data);
  } catch (err) {
    loadingState.classList.add('hidden');
    emptyState.classList.remove('hidden');
    resultsCount.textContent = 'Error loading items';
    showToast(err.message, 'error');
  }
}

function createItemCard(item) {
  const card = document.createElement('div');
  card.className = 'bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col overflow-hidden group';

  const isLost = item.itemType === 'LOST';
  const typeBadgeClass = isLost ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-teal-600 text-white shadow-teal-600/20';
  const typeIcon = isLost ? 'fa-magnifying-glass' : 'fa-hand-holding-hand';
  const statusBadge = item.status === 'RESOLVED' 
    ? '<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">RESOLVED</span>'
    : '<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">OPEN</span>';

  const categoryIcon = categoryIcons[item.category] || 'fa-tag';
  const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  const imageBlock = item.imageUrl 
    ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500">`
    : `<div class="w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center text-slate-400 group-hover:from-slate-200 group-hover:to-slate-300 transition-colors">
         <i class="fa-solid ${categoryIcon} text-4xl mb-2 text-slate-400"></i>
         <span class="text-xs font-semibold">${escapeHtml(item.category)}</span>
       </div>`;

  card.innerHTML = `
    <!-- Top Card Image & Overlay Badges -->
    <div class="relative overflow-hidden bg-slate-100">
      ${imageBlock}
      <div class="absolute top-3 left-3 flex gap-1.5 items-center">
        <span class="px-3 py-1 rounded-lg text-xs font-extrabold shadow-md flex items-center gap-1.5 ${typeBadgeClass}">
          <i class="fa-solid ${typeIcon}"></i> ${item.itemType}
        </span>
      </div>
      <div class="absolute top-3 right-3">
        ${statusBadge}
      </div>
    </div>

    <!-- Card Body -->
    <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
      <div>
        <!-- Category & Date Header -->
        <div class="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span class="font-semibold text-slate-600 inline-flex items-center gap-1">
            <i class="fa-solid ${categoryIcon} text-teal-600"></i> ${escapeHtml(item.category)}
          </span>
          <span>${formattedDate}</span>
        </div>

        <!-- Title -->
        <h3 class="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition line-clamp-1">
          ${escapeHtml(item.title)}
        </h3>

        <!-- Description -->
        <p class="text-slate-600 text-xs mt-1.5 line-clamp-2 leading-relaxed">
          ${escapeHtml(item.description)}
        </p>
      </div>

      <div class="pt-2 border-t border-slate-100">
        <!-- Location Indicator -->
        <div class="flex items-center text-xs text-slate-500 mb-4">
          <i class="fa-solid fa-location-dot mr-1.5 text-rose-500"></i>
          <span class="truncate">${escapeHtml(item.location)}</span>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2">
          <button onclick="viewItemDetails(${item.id})" class="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 transition text-center">
            View Details
          </button>
          <button onclick="handleContactFinder(${item.id}, ${item.userId}, '${escapeJsString(item.title)}', '${escapeJsString(item.userName || 'Poster')}')" class="py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-teal-600 transition flex items-center justify-center gap-1.5 shadow-sm">
            <i class="fa-regular fa-comment-dots"></i> Chat
          </button>
        </div>
      </div>
    </div>
  `;

  return card;
}

function updatePaginationControls(data) {
  const paginationBar = document.getElementById('paginationBar');
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  const indicator = document.getElementById('pageIndicator');

  if (data.totalPages <= 1) {
    paginationBar.classList.add('hidden');
    return;
  }

  paginationBar.classList.remove('hidden');
  prevBtn.disabled = data.first;
  nextBtn.disabled = data.last;
  indicator.textContent = `Page ${data.number + 1} of ${data.totalPages}`;
}

function changePage(direction) {
  state.page += direction;
  fetchItems();
  window.scrollTo({ top: 380, behavior: 'smooth' });
}

function applyFilters() {
  state.filters.keyword = document.getElementById('filterKeyword').value.trim();
  state.filters.location = document.getElementById('filterLocation').value.trim();
  state.filters.category = document.getElementById('filterCategory').value;
  state.filters.status = document.getElementById('filterStatus').value;
  state.page = 0;
  fetchItems();
}

function setTypeFilter(type) {
  state.filters.itemType = type;
  state.page = 0;

  const btnAll = document.getElementById('typeFilterAll');
  const btnLost = document.getElementById('typeFilterLost');
  const btnFound = document.getElementById('typeFilterFound');

  const activeClass = 'px-3.5 py-1.5 rounded-lg font-bold bg-white text-slate-800 shadow-sm transition';
  const inactiveClass = 'px-3.5 py-1.5 rounded-lg font-semibold text-slate-600 hover:text-slate-900 transition';

  btnAll.className = type === '' ? activeClass : inactiveClass;
  btnLost.className = type === 'LOST' ? activeClass : inactiveClass;
  btnFound.className = type === 'FOUND' ? activeClass : inactiveClass;

  fetchItems();
}

function resetFilters() {
  document.getElementById('filterKeyword').value = '';
  document.getElementById('filterLocation').value = '';
  document.getElementById('filterCategory').value = '';
  document.getElementById('filterStatus').value = 'OPEN';
  state.filters = { itemType: '', status: 'OPEN', category: '', location: '', keyword: '' };
  setTypeFilter('');
}

function resetFiltersAndRefresh(e) {
  e.preventDefault();
  resetFilters();
  switchTab('feed');
}

function switchTab(tab) {
  state.currentTab = tab;
  const feedBtn = document.getElementById('navFeedBtn');
  const myItemsBtn = document.getElementById('navMyItemsBtn');
  const feedTitle = document.getElementById('feedTitle');

  if (tab === 'feed') {
    feedBtn.className = 'px-4 py-2 rounded-xl text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors';
    myItemsBtn.className = 'px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-teal-700 hover:bg-slate-100 transition-colors';
    feedTitle.textContent = 'Latest Reports';
  } else if (tab === 'my-items') {
    if (!state.token) {
      openAuthModal('login');
      return;
    }
    myItemsBtn.className = 'px-4 py-2 rounded-xl text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors';
    feedBtn.className = 'px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-teal-700 hover:bg-slate-100 transition-colors';
    feedTitle.textContent = 'My Reported Items';
  }

  state.page = 0;
  fetchItems();
}

/* ================= POSTING ITEMS LOGIC ================= */

let currentPostImageBase64 = null;

function handleImageFileSelect(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  // Validate image type
  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file (PNG, JPG, WebP, etc.).', 'error');
    clearSelectedImage();
    return;
  }

  // Max 5MB limit check
  if (file.size > 5 * 1024 * 1024) {
    showToast('Image file size must be less than 5 MB.', 'error');
    clearSelectedImage();
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    currentPostImageBase64 = e.target.result;

    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewThumb = document.getElementById('imagePreviewThumb');
    const previewName = document.getElementById('imagePreviewName');
    const previewSize = document.getElementById('imagePreviewSize');

    if (previewThumb) previewThumb.src = currentPostImageBase64;
    if (previewName) previewName.textContent = file.name;
    if (previewSize) {
      const sizeKb = (file.size / 1024).toFixed(1);
      previewSize.textContent = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(2)} MB` : `${sizeKb} KB`;
    }
    if (previewContainer) previewContainer.classList.remove('hidden');
  };

  reader.onerror = function() {
    showToast('Failed to read selected image file.', 'error');
    clearSelectedImage();
  };

  reader.readAsDataURL(file);
}

function clearSelectedImage() {
  currentPostImageBase64 = null;
  const fileInput = document.getElementById('itemImageFile');
  if (fileInput) fileInput.value = '';

  const previewContainer = document.getElementById('imagePreviewContainer');
  const previewThumb = document.getElementById('imagePreviewThumb');
  if (previewThumb) previewThumb.src = '';
  if (previewContainer) previewContainer.classList.add('hidden');
}

function handleOpenPostModal() {
  if (!state.token) {
    showToast('Please sign in to report an item.', 'info');
    openAuthModal('login');
    return;
  }
  document.getElementById('postErrorMsg').classList.add('hidden');
  document.getElementById('postItemForm').reset();
  clearSelectedImage();
  document.getElementById('postModal').classList.remove('hidden');
}

function closePostModal() {
  document.getElementById('postModal').classList.add('hidden');
  clearSelectedImage();
}

function handleQuickReport(type) {
  if (!state.token) {
    showToast('Please sign in to create a report.', 'info');
    openAuthModal('login');
    return;
  }
  handleOpenPostModal();
  const radios = document.getElementsByName('itemType');
  for (let r of radios) {
    if (r.value === type) r.checked = true;
  }
}

async function handlePostItemSubmit(event) {
  event.preventDefault();

  if (!state.token) {
    openAuthModal('login');
    return;
  }

  const errorBanner = document.getElementById('postErrorMsg');
  const submitBtn = document.getElementById('postSubmitBtn');

  errorBanner.classList.add('hidden');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Publishing...';

  const itemType = document.querySelector('input[name="itemType"]:checked').value;
  const title = document.getElementById('postTitle').value.trim();
  const category = document.getElementById('postCategory').value;
  const location = document.getElementById('postLocation').value.trim();
  const description = document.getElementById('postDescription').value.trim();

  const payload = {
    title,
    description,
    category,
    itemType,
    location,
    imageUrl: currentPostImageBase64 || null
  };

  try {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      const errText = data.message || (data.errors ? Object.values(data.errors).join(', ') : 'Failed to publish item.');
      throw new Error(errText);
    }

    closePostModal();
    showToast('Item successfully reported with photo!', 'success');
    state.page = 0;
    fetchItems();
  } catch (err) {
    errorBanner.textContent = err.message;
    errorBanner.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Publish Listing';
  }
}

/* ================= ITEM DETAIL & CONTACT LOGIC ================= */

async function viewItemDetails(id) {
  const modal = document.getElementById('detailModal');
  const content = document.getElementById('detailContent');
  modal.classList.remove('hidden');
  content.innerHTML = '<div class="py-16 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-3xl mb-2"></i><p>Loading item details...</p></div>';

  try {
    const res = await fetch(`/api/items/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!res.ok) throw new Error('Unable to fetch item details.');

    const item = await res.json();
    const isLost = item.itemType === 'LOST';
    const typeBadgeClass = isLost ? 'bg-rose-500 text-white' : 'bg-teal-600 text-white';
    const isOwner = state.user && state.user.id === item.userId;

    content.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center gap-2">
          <span class="px-3 py-1 rounded-lg text-xs font-extrabold ${typeBadgeClass}">
            ${item.itemType}
          </span>
          <span class="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
            ${escapeHtml(item.category)}
          </span>
          <span class="px-2.5 py-0.5 rounded-lg text-xs font-semibold ${item.status === 'RESOLVED' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'}">
            ${item.status}
          </span>
        </div>

        <h2 class="text-2xl font-extrabold text-slate-900">${escapeHtml(item.title)}</h2>

        ${item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" class="w-full max-h-72 object-cover rounded-2xl border border-slate-200">` : ''}

        <!-- Information Matrix -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span class="text-slate-400 block font-semibold">Location Reported</span>
            <span class="text-slate-800 font-bold flex items-center gap-1 mt-0.5">
              <i class="fa-solid fa-location-dot text-rose-500"></i> ${escapeHtml(item.location)}
            </span>
          </div>
          <div>
            <span class="text-slate-400 block font-semibold">Reported By</span>
            <span class="text-slate-800 font-bold flex items-center gap-1 mt-0.5">
              <i class="fa-regular fa-user text-teal-600"></i> ${escapeHtml(item.userName || 'Community Member')}
            </span>
          </div>
        </div>

        <div>
          <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Description</h4>
          <p class="text-sm text-slate-600 leading-relaxed">${escapeHtml(item.description)}</p>
        </div>

        <!-- Secure In-App Chat Action Box (Phone & Email Shielded) -->
        <div class="p-5 rounded-2xl bg-gradient-to-br from-teal-50 via-emerald-50/30 to-indigo-50 border border-teal-200/80 shadow-sm">
          <div class="flex items-center justify-between mb-3.5">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center text-sm shadow-md shadow-teal-600/20">
                <i class="fa-solid fa-shield-halved"></i>
              </div>
              <div>
                <span class="text-xs font-extrabold text-slate-900 block">End-to-End In-App Chat</span>
                <span class="text-[11px] text-slate-500">Contact details are shielded to protect your privacy and safety</span>
              </div>
            </div>
            <span class="text-[10px] font-bold text-teal-700 bg-teal-100 px-2.5 py-1 rounded-full flex items-center gap-1">
              <i class="fa-solid fa-lock text-[9px]"></i> Private
            </span>
          </div>

          ${!isOwner ? `
            <button onclick="closeDetailModal(); openChat(${item.id}, ${item.userId}, '${escapeJsString(item.title)}', '${escapeJsString(item.userName || (isLost ? 'Owner' : 'Finder'))}')" 
                    class="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 shadow-md shadow-teal-600/20 hover:shadow-lg transition flex items-center justify-center gap-2 group">
              <i class="fa-solid fa-comments text-base group-hover:scale-110 transition-transform"></i> Secure Chat with ${isLost ? 'Owner' : 'Finder'}
            </button>
          ` : `
            <div class="p-3 bg-white/90 rounded-xl border border-teal-100 text-xs font-semibold text-slate-600 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-circle-check text-teal-600"></i> You posted this item. Interested members will message you securely through in-app chat.
              </div>
              <button onclick="closeDetailModal(); toggleNotificationDropdown();" class="mt-1 py-2 px-3 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 transition flex items-center justify-center gap-1.5">
                <i class="fa-solid fa-comments text-teal-600"></i> View Incoming Messages &amp; Inquiries
              </button>
            </div>
          `}
        </div>

        <!-- Actions -->
        <div class="pt-4 border-t border-slate-100 flex flex-wrap gap-3">
          ${isOwner && item.status === 'OPEN' ? `
            <button onclick="markItemResolved(${item.id})" class="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition">
              <i class="fa-solid fa-check mr-1"></i> Mark as Resolved
            </button>
          ` : ''}

          ${!isOwner ? `
            <button onclick="closeDetailModal(); openChat(${item.id}, ${item.userId}, '${escapeJsString(item.title)}', '${escapeJsString(item.userName || (isLost ? 'Owner' : 'Finder'))}')" class="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-teal-600 text-white transition flex items-center gap-1.5 shadow-sm">
              <i class="fa-regular fa-comment-dots"></i> Secure Chat
            </button>
          ` : ''}
        </div>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<div class="p-8 text-center text-rose-600">${err.message}</div>`;
  }
}

function closeDetailModal() {
  document.getElementById('detailModal').classList.add('hidden');
}

async function markItemResolved(itemId) {
  if (!confirm('Are you sure you want to mark this listing as RESOLVED?')) return;

  try {
    const res = await fetch(`/api/items/${itemId}/status?status=RESOLVED`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });

    if (!res.ok) throw new Error('Failed to update status.');

    showToast('Item marked as RESOLVED.', 'success');
    closeDetailModal();
    fetchItems();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function handleContactFinder(itemId, receiverId, itemTitle, receiverName) {
  if (!state.token) {
    showToast('Please sign in to start a secure chat.', 'info');
    openAuthModal('login');
    return;
  }

  if (state.user && Number(state.user.id) === Number(receiverId)) {
    showToast('You posted this item yourself! Check your notifications for inquiries.', 'info');
    return;
  }

  openChat(itemId, receiverId, itemTitle, receiverName);
}

/* ================= IN-APP MESSAGING & NOTIFICATIONS MODULE ================= */

function escapeJsString(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '&quot;')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '');
}

function handleAuthExpiry() {
  if (!state.token) return;
  state.token = null;
  state.user = null;
  state.unreadMessagesCount = 0;
  localStorage.removeItem('lostlink_token');
  localStorage.removeItem('lostlink_user');
  initAuthState();
  closeChat();
  showToast('Your session has expired. Please sign in again.', 'info');
  openAuthModal('login');
}

/**
 * Polls GET /api/messages/unread every 15 seconds to update the red navbar badge.
 */
async function fetchUnreadCount() {
  if (!state.token) {
    const badge = document.getElementById('unreadBadge');
    if (badge) badge.classList.add('hidden');
    return;
  }

  try {
    const res = await fetch('/api/messages/unread', {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      if (res.status === 401) {
        handleAuthExpiry();
      }
      return;
    }

    const count = await res.json();
    state.unreadMessagesCount = Number(count) || 0;

    const badge = document.getElementById('unreadBadge');
    const pill = document.getElementById('dropdownUnreadPill');
    const title = document.getElementById('notificationDropdownTitle');
    const subtitle = document.getElementById('notificationDropdownSubtitle');

    if (badge) {
      if (state.unreadMessagesCount > 0) {
        badge.textContent = state.unreadMessagesCount > 99 ? '99+' : state.unreadMessagesCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    if (pill) {
      pill.textContent = `${state.unreadMessagesCount} unread`;
      pill.className = state.unreadMessagesCount > 0
        ? 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200'
        : 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600';
    }

    if (title && subtitle && (!state.conversations || state.conversations.length === 0)) {
      if (state.unreadMessagesCount > 0) {
        title.textContent = `You have ${state.unreadMessagesCount} unread message${state.unreadMessagesCount > 1 ? 's' : ''}!`;
        subtitle.textContent = 'Click to open your conversations below.';
      } else {
        title.textContent = 'No unread messages';
        subtitle.textContent = 'You are all caught up!';
      }
    }
  } catch (err) {
    console.debug('Failed to poll unread count:', err);
  }
}

function toggleNotificationDropdown() {
  const dropdown = document.getElementById('notificationDropdown');
  if (!dropdown) return;
  dropdown.classList.toggle('hidden');
  if (!dropdown.classList.contains('hidden')) {
    fetchUnreadCount();
    fetchUserConversations();
  }
}

/**
 * Fetches the user's active conversations / message list from GET /api/messages/conversations
 * and dynamically renders the Message List UI with explicit sender names and click-to-chat redirection.
 */
async function fetchUserConversations(isManualRefresh = false) {
  if (!state.token) return;

  const refreshIcon = document.getElementById('dropdownRefreshIcon');
  if (isManualRefresh && refreshIcon) {
    refreshIcon.classList.add('fa-spin');
  }

  const listContainer = document.getElementById('notificationList');
  if (!listContainer) return;

  try {
    const res = await fetch('/api/messages/conversations', {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      if (res.status === 401) {
        handleAuthExpiry();
        return;
      }
      throw new Error('Failed to load message list');
    }

    const conversations = await res.json();
    state.conversations = conversations || [];

    if (!conversations || conversations.length === 0) {
      listContainer.innerHTML = `
        <div class="py-8 flex flex-col items-center justify-center text-slate-400 text-center">
          <div class="w-12 h-12 rounded-2xl bg-slate-100 text-teal-500 flex items-center justify-center text-xl mb-2">
            <i class="fa-regular fa-comments"></i>
          </div>
          <p class="font-bold text-slate-700">No conversations yet</p>
          <p class="text-[11px] text-slate-400 max-w-[200px] mt-1">Start a conversation by contacting an item reporter on the feed.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = conversations.map(conv => {
      const isMeSender = state.user && Number(conv.senderId) === Number(state.user.id);
      const peerUserId = isMeSender ? conv.receiverId : conv.senderId;
      const peerUserName = isMeSender ? (conv.receiverName || 'Community Member') : (conv.senderName || 'Community Member');
      const avatarInitial = (peerUserName || 'U').charAt(0).toUpperCase();
      const isUnread = !conv.isRead && !isMeSender;
      const timeStr = formatChatTime(conv.timestamp);
      const itemTitle = conv.itemTitle || 'Item Inquiry';
      const itemId = conv.itemId || 0;

      return `
        <div class="conversation-item group p-2.5 rounded-2xl border transition-all cursor-pointer ${
          isUnread
            ? 'bg-teal-50/70 border-teal-200 hover:bg-teal-50 hover:border-teal-300 shadow-sm'
            : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'
        }" onclick="openChatBySender(${peerUserId}, ${itemId}, '${escapeJsString(itemTitle)}', '${escapeJsString(peerUserName)}')">
          <div class="flex items-start gap-2.5">
            <!-- Avatar -->
            <div class="relative flex-shrink-0">
              <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm">
                ${escapeHtml(avatarInitial)}
              </div>
              ${isUnread ? '<span class="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-500 border-2 border-white rounded-full"></span>' : ''}
            </div>

            <!-- Message Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1">
                <!-- SENDER NAME (explicitly displayed and interactive) -->
                <button type="button" 
                        class="sender-name-btn font-extrabold text-xs text-slate-900 hover:text-teal-600 transition flex items-center gap-1 group/name truncate text-left focus:outline-none" 
                        title="Click to chat directly with ${escapeHtml(peerUserName)}"
                        onclick="openChatBySender(${peerUserId}, ${itemId}, '${escapeJsString(itemTitle)}', '${escapeJsString(peerUserName)}'); event.stopPropagation();">
                  <i class="fa-solid fa-user text-[10px] text-teal-600"></i>
                  <span class="truncate underline decoration-teal-300 underline-offset-2">${escapeHtml(peerUserName)}</span>
                  <i class="fa-solid fa-arrow-up-right-from-square text-[9px] text-teal-500 opacity-60 group-hover/name:opacity-100 transition-opacity"></i>
                </button>
                <span class="text-[10px] text-slate-400 whitespace-nowrap">${timeStr}</span>
              </div>

              <!-- Item Context Badge -->
              <div class="flex items-center gap-1 mt-0.5">
                <span class="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
                  <i class="fa-solid fa-tag text-[9px] text-teal-600"></i>
                  <span class="truncate max-w-[150px]">${escapeHtml(itemTitle)}</span>
                </span>
                ${isUnread ? '<span class="ml-auto text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-rose-500 text-white">NEW</span>' : ''}
              </div>

              <!-- Message Preview -->
              <p class="text-[11px] text-slate-600 line-clamp-1 mt-1 break-words">
                ${isMeSender ? '<span class="text-teal-600 font-semibold">You: </span>' : ''}${escapeHtml(conv.content)}
              </p>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load message list:', err);
    listContainer.innerHTML = `
      <div class="p-4 text-center text-xs text-rose-500">
        <i class="fa-solid fa-triangle-exclamation mb-1 text-sm block"></i>
        <span>Unable to load messages. Please try again.</span>
      </div>
    `;
  } finally {
    if (isManualRefresh && refreshIcon) {
      setTimeout(() => refreshIcon.classList.remove('fa-spin'), 600);
    }
  }
}

async function markAllNotificationsRead() {
  if (!state.token) return;
  try {
    if (state.conversations && state.conversations.length > 0) {
      for (const conv of state.conversations) {
        const peerUserId = state.user && Number(conv.senderId) === Number(state.user.id) ? conv.receiverId : conv.senderId;
        await fetch(`/api/messages/mark-read/${conv.itemId || 0}/${peerUserId}`, {
          method: 'PUT',
          headers: getAuthHeaders()
        }).catch(() => {});
      }
    }
    fetchUnreadCount();
    fetchUserConversations();
    showToast('All messages marked as read.', 'success');
  } catch (e) {
    // ignore
  }
}

/**
 * CLICK-TO-CHAT REDIRECTION FOR SENDER NAMES:
 * Instantly routes the user directly to that specific conversation thread or message box
 * using their unique sender/conversation ID.
 */
function openChatBySender(senderId, itemId = 0, itemTitle = '', senderName = '') {
  // 1. Close dropdown panel if open
  const dropdown = document.getElementById('notificationDropdown');
  if (dropdown && !dropdown.classList.contains('hidden')) {
    dropdown.classList.add('hidden');
  }

  // 2. Close detail modal if open
  closeDetailModal();

  if (!state.token) {
    showToast('Please sign in to view and send messages.', 'info');
    openAuthModal('login');
    return;
  }

  const targetSenderId = Number(senderId);
  if (!targetSenderId) {
    showToast('Invalid sender or conversation ID.', 'error');
    return;
  }

  if (state.user && Number(state.user.id) === targetSenderId) {
    showToast('You cannot send messages to yourself.', 'info');
    return;
  }

  // Open the chat box directly for this sender ID
  openChat(
    Number(itemId) || 0,
    targetSenderId,
    itemTitle || 'Conversation Inquiry',
    senderName || ('User #' + targetSenderId)
  );
}

/**
 * Opens the WhatsApp-style in-app chat window for the given item and receiver.
 */
function openChat(itemId, receiverId, itemTitle = 'Item Inquiry', receiverName = 'Community Member') {
  if (!state.token) {
    showToast('Please sign in to start a secure chat.', 'info');
    openAuthModal('login');
    return;
  }

  const targetReceiverId = Number(receiverId);
  if (state.user && Number(state.user.id) === targetReceiverId) {
    showToast('You cannot message yourself!', 'info');
    return;
  }

  state.activeChat = {
    itemId: Number(itemId) || 0,
    receiverId: targetReceiverId,
    itemTitle: itemTitle || 'Item Inquiry',
    receiverName: receiverName || 'Poster',
    pollTimer: null,
    renderedIds: new Set()
  };

  const container = document.getElementById('inAppChatContainer');
  const userTitle = document.getElementById('inAppChatUserTitle');
  const itemTitleEl = document.getElementById('inAppChatItemTitle');
  const avatarEl = document.getElementById('inAppChatAvatar');
  const inputEl = document.getElementById('inAppChatInput');
  const messagesContainer = document.getElementById('inAppChatMessages');

  if (userTitle) userTitle.textContent = state.activeChat.receiverName;
  if (itemTitleEl) itemTitleEl.textContent = state.activeChat.itemTitle;
  if (avatarEl) avatarEl.textContent = (state.activeChat.receiverName || 'U').charAt(0).toUpperCase();

  if (messagesContainer) {
    messagesContainer.innerHTML = `
      <div class="py-16 text-center text-slate-500 text-xs">
        <i class="fa-solid fa-spinner fa-spin text-lg mb-2 text-teal-400"></i>
        <p>Loading secure conversation...</p>
      </div>
    `;
  }

  if (container) {
    container.classList.remove('hidden');
  }

  if (inputEl) {
    inputEl.value = '';
    setTimeout(() => inputEl.focus(), 150);
  }

  // Fetch thread history
  fetchChatThread(state.activeChat.itemId, state.activeChat.receiverId, false);

  // Set up polling every 3 seconds while chat window is open
  if (state.activeChat.pollTimer) {
    clearInterval(state.activeChat.pollTimer);
  }
  state.activeChat.pollTimer = setInterval(pollActiveChat, 3000);
}

function closeChat() {
  if (state.activeChat && state.activeChat.pollTimer) {
    clearInterval(state.activeChat.pollTimer);
    state.activeChat.pollTimer = null;
  }

  const container = document.getElementById('inAppChatContainer');
  if (container) {
    container.classList.add('hidden');
  }

  state.activeChat = {
    itemId: null,
    receiverId: null,
    itemTitle: '',
    receiverName: '',
    pollTimer: null,
    renderedIds: new Set()
  };

  fetchUnreadCount();
  fetchUserConversations();
}

function refreshChatThread() {
  if (!state.activeChat || !state.activeChat.receiverId) return;
  const icon = document.getElementById('inAppChatRefreshIcon');
  if (icon) icon.classList.add('fa-spin');
  fetchChatThread(state.activeChat.itemId, state.activeChat.receiverId, false)
    .finally(() => {
      if (icon) setTimeout(() => icon.classList.remove('fa-spin'), 600);
    });
}

async function pollActiveChat() {
  const container = document.getElementById('inAppChatContainer');
  if (!container || container.classList.contains('hidden') || !state.activeChat || !state.activeChat.receiverId) {
    return;
  }
  await fetchChatThread(state.activeChat.itemId, state.activeChat.receiverId, true);
}

/**
 * Fetches thread history between logged-in user and receiver.
 */
async function fetchChatThread(itemId, receiverId, isBackgroundPoll = false) {
  if (!state.token || !receiverId) return;

  try {
    const threadUrl = (itemId && itemId > 0)
      ? `/api/messages/thread/${itemId}/${receiverId}`
      : `/api/messages/thread/${receiverId}`;

    const res = await fetch(threadUrl, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      if (res.status === 401) {
        handleAuthExpiry();
        return;
      }
      return;
    }

    const messages = await res.json();
    const messagesContainer = document.getElementById('inAppChatMessages');
    if (!messagesContainer) return;

    // Detect if new messages arrived
    const newIds = new Set(messages.map(m => m.id));
    let hasChanges = false;
    if (!state.activeChat.renderedIds || state.activeChat.renderedIds.size !== newIds.size) {
      hasChanges = true;
    } else {
      for (let id of newIds) {
        if (!state.activeChat.renderedIds.has(id)) {
          hasChanges = true;
          break;
        }
      }
    }

    if (hasChanges || !isBackgroundPoll) {
      state.activeChat.renderedIds = newIds;

      // If activeChat itemId was 0, resolve from returned messages
      if ((!state.activeChat.itemId || state.activeChat.itemId === 0) && messages.length > 0) {
        const lastWithItem = messages.find(m => m.itemId && m.itemId > 0);
        if (lastWithItem) {
          state.activeChat.itemId = lastWithItem.itemId;
          if (lastWithItem.itemTitle) {
            state.activeChat.itemTitle = lastWithItem.itemTitle;
            const itemTitleEl = document.getElementById('inAppChatItemTitle');
            if (itemTitleEl) itemTitleEl.textContent = lastWithItem.itemTitle;
          }
        }
      }

      if (!messages || messages.length === 0) {
        messagesContainer.innerHTML = `
          <div class="my-auto py-12 text-center text-slate-400 text-xs">
            <div class="w-12 h-12 mx-auto rounded-2xl bg-slate-800 text-teal-400 flex items-center justify-center text-xl mb-3 shadow-inner">
              <i class="fa-regular fa-comment-dots"></i>
            </div>
            <p class="font-bold text-slate-200">No messages yet</p>
            <p class="text-[11px] text-slate-400 mt-1 max-w-[240px] mx-auto">Send a message below to coordinate details and arrangement safely.</p>
          </div>
        `;
      } else {
        const isNearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 120;

        messagesContainer.innerHTML = messages.map(msg => renderChatMessageBubble(msg)).join('');

        if (!isBackgroundPoll || isNearBottom) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }

      // Mark unread messages in this thread as read on the backend
      markThreadRead(state.activeChat.itemId, receiverId);
    }
  } catch (err) {
    if (!isBackgroundPoll) {
      const messagesContainer = document.getElementById('inAppChatMessages');
      if (messagesContainer) {
        messagesContainer.innerHTML = `
          <div class="p-4 text-center text-xs text-rose-400">
            <i class="fa-solid fa-triangle-exclamation mb-1"></i> Failed to load messages. Please try again.
          </div>
        `;
      }
    }
  }
}

/**
 * Renders a single message bubble:
 * - Outgoing messages: Green/teal bubble aligned to the right.
 * - Incoming messages: Gray/slate bubble aligned to the left with EXPLICIT CLICKABLE SENDER NAME.
 */
function renderChatMessageBubble(msg) {
  const isMe = state.user && Number(msg.senderId) === Number(state.user.id);
  const timeStr = formatChatTime(msg.timestamp);

  if (isMe) {
    // Outgoing bubble (green/teal aligned right)
    return `
      <div class="flex flex-col items-end">
        <div class="bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-2xl rounded-tr-xs px-3.5 py-2.5 max-w-[82%] shadow-md text-xs leading-relaxed break-words">
          ${escapeHtml(msg.content)}
          <div class="flex items-center justify-end gap-1 mt-1 text-[9px] text-teal-200">
            <span>${timeStr}</span>
            <i class="fa-solid fa-check-double text-[9px] text-teal-200"></i>
          </div>
        </div>
      </div>
    `;
  } else {
    // Incoming bubble (gray bubble aligned left)
    const senderDisplayName = msg.senderName || state.activeChat.receiverName || ('User #' + msg.senderId);
    const itemTitle = msg.itemTitle || state.activeChat.itemTitle || '';
    const itemId = msg.itemId || state.activeChat.itemId || 0;

    return `
      <div class="flex flex-col items-start">
        <!-- Interactive sender name header -->
        <div class="text-[10px] font-bold text-teal-400 mb-1 ml-1 flex items-center gap-1.5">
          <i class="fa-regular fa-user text-[9px]"></i>
          <button type="button" 
                  class="sender-chat-link hover:underline text-teal-300 font-bold focus:outline-none cursor-pointer flex items-center gap-1"
                  title="Click to view conversation thread with ${escapeHtml(senderDisplayName)}"
                  onclick="openChatBySender(${msg.senderId}, ${itemId}, '${escapeJsString(itemTitle)}', '${escapeJsString(senderDisplayName)}')">
            <span>${escapeHtml(senderDisplayName)}</span>
          </button>
        </div>
        <div class="bg-slate-800 border border-slate-700/80 text-slate-100 rounded-2xl rounded-tl-xs px-3.5 py-2.5 max-w-[82%] shadow-md text-xs leading-relaxed break-words">
          ${escapeHtml(msg.content)}
          <div class="flex items-center justify-start gap-1 mt-1 text-[9px] text-slate-400">
            <span>${timeStr}</span>
          </div>
        </div>
      </div>
    `;
  }
}

async function markThreadRead(itemId, senderId) {
  if (!state.token || !senderId) return;
  try {
    const markUrl = (itemId && itemId > 0)
      ? `/api/messages/mark-read/${itemId}/${senderId}`
      : `/api/messages/mark-read/${senderId}`;

    await fetch(markUrl, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    fetchUnreadCount();
  } catch (e) {
    // ignore background mark-read errors
  }
}

/**
 * Handles sending a message via POST /api/messages/send
 */
async function handleSendChatMessage(event) {
  event.preventDefault();

  if (!state.token) {
    showToast('Please sign in to send messages.', 'info');
    openAuthModal('login');
    return;
  }

  if (!state.activeChat || !state.activeChat.receiverId) {
    showToast('No active conversation selected.', 'error');
    return;
  }

  const input = document.getElementById('inAppChatInput');
  const sendBtn = document.getElementById('inAppChatSendBtn');
  if (!input) return;

  const content = input.value.trim();
  if (!content) return;

  input.value = '';
  if (sendBtn) sendBtn.disabled = true;

  // Optimistic UI Append
  const messagesContainer = document.getElementById('inAppChatMessages');
  const tempMsgId = 'temp_' + Date.now();
  if (messagesContainer) {
    const emptyState = messagesContainer.querySelector('.fa-comment-dots');
    if (emptyState && emptyState.closest('.text-center')) {
      messagesContainer.innerHTML = '';
    }

    const optimisticBubble = document.createElement('div');
    optimisticBubble.id = tempMsgId;
    optimisticBubble.className = 'flex flex-col items-end opacity-80';
    optimisticBubble.innerHTML = `
      <div class="bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-2xl rounded-tr-xs px-3.5 py-2.5 max-w-[82%] shadow-md text-xs leading-relaxed break-words">
        ${escapeHtml(content)}
        <div class="flex items-center justify-end gap-1 mt-1 text-[9px] text-teal-200">
          <span>${formatChatTime(new Date())}</span>
          <i class="fa-solid fa-clock text-[9px] text-teal-200"></i>
        </div>
      </div>
    `;
    messagesContainer.appendChild(optimisticBubble);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  try {
    const res = await fetch('/api/messages/send', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        itemId: state.activeChat.itemId || 1,
        receiverId: state.activeChat.receiverId,
        content: content
      })
    });

    if (!res.ok) {
      if (res.status === 401) {
        handleAuthExpiry();
        throw new Error('Your session has expired. Please sign in again.');
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to send message.');
    }

    const savedMsg = await res.json();
    if (state.activeChat.renderedIds) {
      state.activeChat.renderedIds.add(savedMsg.id);
    }

    const tempEl = document.getElementById(tempMsgId);
    if (tempEl) {
      tempEl.outerHTML = renderChatMessageBubble(savedMsg);
    }

    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Refresh conversation list in background so new message is reflected
    fetchUserConversations();
  } catch (err) {
    showToast(err.message, 'error');
    const tempEl = document.getElementById(tempMsgId);
    if (tempEl) tempEl.remove();
  } finally {
    if (sendBtn) sendBtn.disabled = false;
    input.focus();
  }
}

function formatChatTime(timestamp) {
  if (!timestamp) return '';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}

/* ================= TOASTS & UI UTILITIES ================= */

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');

  const icons = {
    success: 'fa-circle-check text-emerald-400',
    error: 'fa-circle-exclamation text-rose-400',
    info: 'fa-circle-info text-sky-400'
  };

  toast.className = 'pointer-events-auto flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 text-xs font-semibold transform translate-y-2 opacity-0 transition-all duration-300';
  toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info} text-base"></i> <span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);

  // Trigger animation in
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  // Auto dismiss
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.toggle('hidden');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ================= FEEDBACK & RATINGS MODULE ================= */

let currentFeedbackRating = 5;
let isFeedbackListView = false;

const ratingLabels = {
  1: '1 Star — Needs Improvement',
  2: '2 Stars — Fair',
  3: '3 Stars — Good',
  4: '4 Stars — Very Good',
  5: '5 Stars — Excellent!'
};

function openFeedbackModal() {
  const modal = document.getElementById('feedbackModal');
  const errorMsg = document.getElementById('feedbackErrorMsg');
  const userNameInput = document.getElementById('feedbackUserName');
  const emailInput = document.getElementById('feedbackEmail');
  const commentsInput = document.getElementById('feedbackComments');

  if (errorMsg) errorMsg.classList.add('hidden');

  // Pre-fill user data if authenticated
  if (state.user) {
    if (userNameInput) userNameInput.value = state.user.name || '';
    if (emailInput) emailInput.value = state.user.email || '';
  }

  // Reset to form view
  isFeedbackListView = false;
  document.getElementById('feedbackFormView').classList.remove('hidden');
  document.getElementById('feedbackListView').classList.add('hidden');
  document.getElementById('toggleFeedbackViewBtn').textContent = 'View Community Ratings';
  document.getElementById('feedbackModalTitle').textContent = 'Rate Your Experience';
  document.getElementById('feedbackModalSubtitle').textContent = 'Help us improve LOSTLINK by sharing your valuable feedback and rating.';

  selectStarRating(5);

  modal.classList.remove('hidden');
}

function closeFeedbackModal() {
  const modal = document.getElementById('feedbackModal');
  if (modal) modal.classList.add('hidden');
}

function selectStarRating(rating) {
  currentFeedbackRating = rating;
  const ratingInput = document.getElementById('feedbackRatingInput');
  if (ratingInput) ratingInput.value = rating;

  const label = document.getElementById('ratingLabel');
  if (label) {
    label.textContent = ratingLabels[rating] || `${rating} Stars`;
  }

  updateStarDisplay(rating);
}

function previewStarRating(hoverRating) {
  updateStarDisplay(hoverRating);
  const label = document.getElementById('ratingLabel');
  if (label) {
    label.textContent = ratingLabels[hoverRating] || `${hoverRating} Stars`;
  }
}

function resetStarPreview() {
  updateStarDisplay(currentFeedbackRating);
  const label = document.getElementById('ratingLabel');
  if (label) {
    label.textContent = ratingLabels[currentFeedbackRating] || `${currentFeedbackRating} Stars`;
  }
}

function updateStarDisplay(activeCount) {
  const stars = document.querySelectorAll('#starRatingContainer .star-btn');
  stars.forEach((btn, index) => {
    const starNum = index + 1;
    if (starNum <= activeCount) {
      btn.className = 'star-btn text-3xl text-amber-400 focus:outline-none transition-transform hover:scale-125';
    } else {
      btn.className = 'star-btn text-3xl text-slate-300 focus:outline-none transition-transform hover:scale-125';
    }
  });
}

function toggleFeedbackView() {
  isFeedbackListView = !isFeedbackListView;
  const formView = document.getElementById('feedbackFormView');
  const listView = document.getElementById('feedbackListView');
  const toggleBtn = document.getElementById('toggleFeedbackViewBtn');
  const title = document.getElementById('feedbackModalTitle');
  const subtitle = document.getElementById('feedbackModalSubtitle');

  if (isFeedbackListView) {
    formView.classList.add('hidden');
    listView.classList.remove('hidden');
    toggleBtn.textContent = 'Write Feedback';
    title.textContent = 'Community Ratings & Feedback';
    subtitle.textContent = 'See what other members say about their experience with LOSTLINK.';
    loadFeedbackList();
  } else {
    formView.classList.remove('hidden');
    listView.classList.add('hidden');
    toggleBtn.textContent = 'View Community Ratings';
    title.textContent = 'Rate Your Experience';
    subtitle.textContent = 'Help us improve LOSTLINK by sharing your valuable feedback and rating.';
  }
}

async function handleFeedbackSubmit(event) {
  event.preventDefault();
  const errorMsg = document.getElementById('feedbackErrorMsg');
  const submitBtn = document.getElementById('feedbackSubmitBtn');
  const userNameInput = document.getElementById('feedbackUserName');
  const emailInput = document.getElementById('feedbackEmail');
  const commentsInput = document.getElementById('feedbackComments');

  errorMsg.classList.add('hidden');

  const payload = {
    userName: userNameInput.value.trim(),
    email: emailInput.value.trim(),
    rating: parseInt(document.getElementById('feedbackRatingInput').value, 10),
    comments: commentsInput.value.trim()
  };

  if (!payload.userName || !payload.email || !payload.rating || !payload.comments) {
    errorMsg.textContent = 'Please fill out all required fields and choose a rating.';
    errorMsg.classList.remove('hidden');
    return;
  }

  // Set loading state
  const origBtnContent = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting...';

  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to submit feedback. Please try again.');
    }

    const savedFeedback = await res.json();

    // Instant toast confirmation
    showToast('Thank you! Your feedback & rating have been submitted.', 'success');

    // Reset comment field
    commentsInput.value = '';

    // Switch to view the updated list
    toggleFeedbackView();
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.classList.remove('hidden');
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = origBtnContent;
  }
}

async function loadFeedbackList() {
  const container = document.getElementById('feedbackEntriesContainer');
  const avgScoreEl = document.getElementById('avgRatingScore');
  const avgStarsEl = document.getElementById('avgRatingStars');
  const totalReviewsEl = document.getElementById('totalReviewsCount');

  container.innerHTML = `
    <div class="py-8 text-center text-slate-400">
      <i class="fa-solid fa-circle-notch fa-spin text-2xl text-teal-600 mb-2"></i>
      <p class="text-xs">Loading feedback entries...</p>
    </div>
  `;

  try {
    const res = await fetch('/api/feedback');
    if (!res.ok) {
      throw new Error('Failed to load feedback entries.');
    }
    const feedbacks = await res.json();

    if (!feedbacks || feedbacks.length === 0) {
      avgScoreEl.textContent = '0.0';
      avgStarsEl.innerHTML = '<i class="fa-regular fa-star text-slate-300"></i>';
      totalReviewsEl.textContent = '0 Reviews';
      container.innerHTML = `
        <div class="py-8 text-center text-slate-400">
          <i class="fa-regular fa-comment-dots text-3xl mb-2 text-slate-300"></i>
          <p class="text-xs font-semibold">No feedback reviews yet. Be the first to review!</p>
        </div>
      `;
      return;
    }

    // Calculate Average Rating
    const totalRating = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
    const avgRating = (totalRating / feedbacks.length).toFixed(1);

    avgScoreEl.textContent = avgRating;
    totalReviewsEl.textContent = `${feedbacks.length} Review${feedbacks.length > 1 ? 's' : ''}`;

    // Render stars for average
    let starsHtml = '';
    const roundedAvg = Math.round(parseFloat(avgRating));
    for (let i = 1; i <= 5; i++) {
      if (i <= roundedAvg) {
        starsHtml += '<i class="fa-solid fa-star text-amber-400"></i> ';
      } else {
        starsHtml += '<i class="fa-regular fa-star text-slate-300"></i> ';
      }
    }
    avgStarsEl.innerHTML = starsHtml;

    // Render individual feedback cards
    container.innerHTML = feedbacks.map(item => {
      const initials = (item.userName || 'U').charAt(0).toUpperCase();
      let starIcons = '';
      for (let s = 1; s <= 5; s++) {
        if (s <= item.rating) {
          starIcons += '<i class="fa-solid fa-star text-amber-400"></i>';
        } else {
          starIcons += '<i class="fa-solid fa-star text-slate-200"></i>';
        }
      }

      let formattedDate = 'Recently';
      if (item.createdAt) {
        try {
          const d = new Date(item.createdAt);
          formattedDate = d.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
        } catch (_) {}
      }

      return `
        <div class="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-500 text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm">
                ${escapeHtml(initials)}
              </div>
              <div>
                <p class="text-xs font-bold text-slate-800 leading-tight">${escapeHtml(item.userName)}</p>
                <p class="text-[10px] text-slate-400">${escapeHtml(formattedDate)}</p>
              </div>
            </div>
            <div class="flex gap-1 text-xs">
              ${starIcons}
            </div>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed font-normal">${escapeHtml(item.comments)}</p>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `
      <div class="py-6 text-center text-rose-500 text-xs">
        <i class="fa-solid fa-triangle-exclamation mb-1 text-base"></i>
        <p>${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}

/* ================= LOSTLINK EXPERT GUIDE CHATBOT ================= */

const chatState = {
  isOpen: false,
  isWaiting: false,
  messages: []
};

function initChatbot() {
  const container = document.getElementById('chatMessagesContainer');
  if (!container) return;

  // Initial welcome message
  if (chatState.messages.length === 0) {
    const welcomeText = "👋 Hello! I am your **LOSTLINK Expert Guide**.\n\nI can answer questions about reporting items, how **direct phone & email contacts** connect you immediately with finders and owners, searching & filters, messaging, or submitting feedback.\n\nAsk me anything below or tap one of the quick suggestions above!";
    chatState.messages.push({
      sender: 'bot',
      text: welcomeText,
      time: formatChatTime(new Date())
    });
    renderChatMessages();
  }
}

function toggleChatWidget() {
  const chatWindow = document.getElementById('chatWidgetWindow');
  const toggleIcon = document.getElementById('chatToggleIcon');
  const badge = document.getElementById('chatNotificationBadge');
  const inputField = document.getElementById('chatInputField');

  if (!chatWindow) return;

  chatState.isOpen = !chatState.isOpen;

  if (chatState.isOpen) {
    chatWindow.classList.remove('hidden');
    if (toggleIcon) {
      toggleIcon.className = 'fa-solid fa-xmark text-2xl transition-transform';
    }
    if (badge) badge.classList.add('hidden');
    scrollChatToBottom();
    if (inputField) {
      setTimeout(() => inputField.focus(), 150);
    }
  } else {
    chatWindow.classList.add('hidden');
    if (toggleIcon) {
      toggleIcon.className = 'fa-solid fa-comments text-2xl transition-transform';
    }
  }
}

function resetChatConversation() {
  chatState.messages = [];
  initChatbot();
  showToast('Chat conversation has been reset.', 'info');
}

function sendQuickPrompt(promptText) {
  const inputField = document.getElementById('chatInputField');
  if (inputField) {
    inputField.value = promptText;
  }
  // Open widget if closed
  if (!chatState.isOpen) {
    toggleChatWidget();
  }
  handleChatSubmit(new Event('submit'));
}

async function handleChatSubmit(event) {
  if (event) event.preventDefault();

  const inputField = document.getElementById('chatInputField');
  if (!inputField) return;

  const userText = inputField.value.trim();
  if (!userText || chatState.isWaiting) return;

  // Add user message to state
  chatState.messages.push({
    sender: 'user',
    text: userText,
    time: formatChatTime(new Date())
  });

  inputField.value = '';
  chatState.isWaiting = true;
  renderChatMessages();
  showTypingIndicator();

  try {
    const res = await fetch('/api/chatbot/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: userText })
    });

    if (!res.ok) {
      throw new Error('Failed to get answer from expert guide.');
    }

    const data = await res.json();
    const botReply = data.reply || 'I am sorry, I could not process that request.';

    hideTypingIndicator();
    chatState.messages.push({
      sender: 'bot',
      text: botReply,
      time: formatChatTime(new Date())
    });
  } catch (err) {
    hideTypingIndicator();
    chatState.messages.push({
      sender: 'bot',
      text: "⚠️ Sorry, I am having trouble connecting to the guide service right now. Please make sure the server is running and try again.",
      time: formatChatTime(new Date())
    });
  } finally {
    chatState.isWaiting = false;
    renderChatMessages();
  }
}

function renderChatMessages() {
  const container = document.getElementById('chatMessagesContainer');
  if (!container) return;

  container.innerHTML = chatState.messages.map(msg => {
    if (msg.sender === 'user') {
      return `
        <div class="flex justify-end items-end gap-2">
          <div class="max-w-[80%] bg-gradient-to-r from-teal-600 to-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-br-sm shadow-sm text-xs space-y-1">
            <p class="leading-relaxed whitespace-pre-wrap">${escapeHtml(msg.text)}</p>
            <span class="block text-[9px] text-teal-100/70 text-right">${escapeHtml(msg.time)}</span>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="flex items-start gap-2.5">
          <div class="w-7 h-7 rounded-xl bg-gradient-to-tr from-teal-700 to-indigo-900 text-teal-300 flex items-center justify-center text-xs flex-shrink-0 shadow-sm border border-teal-500/30">
            <i class="fa-solid fa-robot"></i>
          </div>
          <div class="max-w-[85%] bg-white border border-slate-200/90 text-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm text-xs space-y-1.5">
            <div class="leading-relaxed break-words">${formatBotMarkdown(msg.text)}</div>
            <span class="block text-[9px] text-slate-400">${escapeHtml(msg.time)}</span>
          </div>
        </div>
      `;
    }
  }).join('');

  scrollChatToBottom();
}

function showTypingIndicator() {
  const container = document.getElementById('chatMessagesContainer');
  if (!container) return;

  const indicator = document.createElement('div');
  indicator.id = 'chatTypingIndicator';
  indicator.className = 'flex items-start gap-2.5';
  indicator.innerHTML = `
    <div class="w-7 h-7 rounded-xl bg-gradient-to-tr from-teal-700 to-indigo-900 text-teal-300 flex items-center justify-center text-xs flex-shrink-0 shadow-sm border border-teal-500/30">
      <i class="fa-solid fa-robot"></i>
    </div>
    <div class="bg-white border border-slate-200 text-slate-500 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5 text-xs">
      <span class="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></span>
      <span class="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
      <span class="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
    </div>
  `;
  container.appendChild(indicator);
  scrollChatToBottom();
}

function hideTypingIndicator() {
  const indicator = document.getElementById('chatTypingIndicator');
  if (indicator) indicator.remove();
}

function scrollChatToBottom() {
  const container = document.getElementById('chatMessagesContainer');
  if (container) {
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 50);
  }
}

function formatChatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatBotMarkdown(text) {
  if (!text) return '';

  let html = escapeHtml(text);

  // Bold text: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');

  // Italic text: *text*
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-700">$1</em>');

  // Bullet points: lines starting with • or -
  html = html.replace(/(?:^|<br>)[•-]\s*(.*?)(?=(?:<br>|$))/g, '<div class="flex items-start gap-1.5 my-1 ml-1"><span class="text-teal-600 font-bold">•</span><span>$1</span></div>');

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  return html;
}
