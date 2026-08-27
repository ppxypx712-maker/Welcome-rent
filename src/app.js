// ==========================================================================
// WELCOME ARENDA - MAIN APPLICATION LOGIC (COMPREHENSIVE UPGRADE)
// ==========================================================================

import { INITIAL_ACCOUNTS, ADMIN_CONFIG, ACCOUNT_PRICING, DAY_LABEL_21_ACCOUNTS } from './data.js';

// Application State
const STATE = {
  currentUser: null,
  accounts: INITIAL_ACCOUNTS.map(a => ({ ...a })),
  selectedCategory: 'ALL', // 'ALL', 'VIP', 'TOP', 'CHEAP', 'FAVORITES'
  selectedStatus: 'ALL',   // 'ALL', 'free', 'busy'
  freeOnlyActive: false,   // boolean toggle for BO'SH button
  selectedTag: 'all',      // 'all', 'xsuit', 'supercar', 'glacier', 'mumiya', 'prok', 'budget'
  sortBy: 'default',       // 'default', 'price-asc', 'price-desc', 'mifik-desc', 'cars-desc', 'col-desc'
  searchQuery: '',
  favorites: [],           // array of account IDs
  compareList: [],         // array of account IDs (max 3)
  soundEnabled: true,
  editingAccountId: null,
  calcPackage: '3h',       // active rental package in calculator modal
  calcAccId: null          // current active account in modal
};

// Storage Keys
const STORAGE_KEYS = {
  USER: 'welcome_current_user',
  REGISTERED_USERS: 'welcome_registered_users',
  ACCOUNTS: 'welcome_accounts_data_v8',
  FAVORITES: 'welcome_favorites_list',
  SOUND: 'welcome_sound_pref'
};




// ==========================================================================
// WEB AUDIO API - GAMING SOUND EFFECTS
// ==========================================================================
class CyberSoundFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  playBeep(freq = 440, type = 'sine', duration = 0.1, gainVal = 0.1) {
    if (!STATE.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.log('Audio FX error:', e);
    }
  }

  click() {
    this.playBeep(800, 'triangle', 0.08, 0.08);
  }

  success() {
    this.playBeep(523.25, 'sine', 0.1, 0.1);
    setTimeout(() => this.playBeep(659.25, 'sine', 0.1, 0.1), 80);
    setTimeout(() => this.playBeep(783.99, 'sine', 0.2, 0.12), 160);
  }

  toggle() {
    this.playBeep(600, 'sine', 0.06, 0.08);
  }

  heart() {
    this.playBeep(700, 'sine', 0.08, 0.1);
    setTimeout(() => this.playBeep(880, 'sine', 0.15, 0.12), 60);
  }
}

const sfx = new CyberSoundFX();

// ==========================================================================
// PARSE SPECS HELPER (COLLECTION %, MYTHICS, ULTIMATE, CARS, WEAPONS)
// ==========================================================================
function parseAccountSpecs(acc) {
  const text = ((acc.rawDetails || '') + ' ' + (acc.title || '') + ' ' + (acc.description || '')).toUpperCase();
  
  // Extract collection %
  const colMatch = text.match(/(\d+)\s*(?:COLLECTION|\+?\s*COLLECTION)/i);
  const col = colMatch ? parseInt(colMatch[1]) : (acc.category === 'VIP' ? 88 : acc.category === 'TOP' ? 76 : 65);

  // Extract mythics count
  const mifikMatch = text.match(/(\d+)\s*\+?\s*TA\s*MIFIK/i) || text.match(/(\d+)\s*\+?\s*MIFIK/i);
  const mifik = mifikMatch ? parseInt(mifikMatch[1]) : (acc.category === 'VIP' ? 400 : acc.category === 'TOP' ? 180 : 60);

  // Extract ultimate count
  const ultMatch = text.match(/(\d+)\s*\+?\s*TA\s*ULTIMATE/i) || text.match(/(\d+)\s*\+?\s*ULTIMATE/i);
  const ultimate = ultMatch ? parseInt(ultMatch[1]) : (acc.category === 'VIP' ? 30 : acc.category === 'TOP' ? 10 : 2);

  // Extract cars count
  const carMatch = text.match(/(\d+)\s*\+?\s*TA\s*SUPPER\s*CAR/i) || text.match(/(\d+)\s*\+?\s*SUPPER\s*CAR/i);
  const cars = carMatch ? parseInt(carMatch[1]) : (acc.category === 'VIP' ? 15 : acc.category === 'TOP' ? 8 : 2);

  // Extract prokachka weapons count
  const prokMatch = text.match(/(\d+)\s*\+?\s*TA\s*PROKACHKA/i) || text.match(/(\d+)\s*\+?\s*PROKACHKA/i);
  const prokachka = prokMatch ? parseInt(prokMatch[1]) : (acc.category === 'VIP' ? 120 : acc.category === 'TOP' ? 60 : 20);

  // Extract numeric price per hour
  const priceNum = parseInt((acc.price || '').replace(/[^\d]/g, '')) || (acc.category === 'VIP' ? 14000 : acc.category === 'TOP' ? 9000 : 5000);

  // Extract specific tag attributes
  const hasXSuit = text.includes('MAXX 7') || text.includes('FARAON') || text.includes('VARON') || text.includes('VORON') || text.includes('ANUXRA') || text.includes('IGNIS') || text.includes('DRAVION') || text.includes('FLORA') || text.includes('PASIDON');
  const hasGlacier = text.includes('LAVINA') || text.includes('GLACIER') || text.includes('M416');
  const hasMumiya = text.includes('MUMIYA') || text.includes('BAPE');
  const hasSupercar = cars > 0 || text.includes('LAMBORGHINI') || text.includes('BUGATTI') || text.includes('MACLAREN') || text.includes('BENTLEY') || text.includes('PAGANI') || text.includes('PORSCHE');

  return {
    collection: col,
    mifik: mifik,
    ultimate: ultimate,
    cars: cars,
    prokachka: prokachka,
    priceNum: priceNum,
    hasXSuit: hasXSuit,
    hasGlacier: hasGlacier,
    hasMumiya: hasMumiya,
    hasSupercar: hasSupercar
  };
}

// ==========================================================================
// INITIALIZATION & STORAGE HELPERS
// ==========================================================================
function loadStoredData() {
  // Load User
  const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
  if (storedUser) {
    try {
      STATE.currentUser = JSON.parse(storedUser);
    } catch (e) {
      STATE.currentUser = null;
    }
  }

  // Load Accounts & merge customized statuses
  const storedAccounts = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
  if (storedAccounts) {
    try {
      const parsed = JSON.parse(storedAccounts);
      STATE.accounts = INITIAL_ACCOUNTS.map(initAcc => {
        const found = parsed.find(p => p.id === initAcc.id);
        if (found) {
          return {
            ...initAcc,
            status: found.status || initAcc.status
          };
        }
        return { ...initAcc };
      });
    } catch (e) {
      STATE.accounts = INITIAL_ACCOUNTS.map(a => ({ ...a }));
    }
  } else {
    STATE.accounts = INITIAL_ACCOUNTS.map(a => ({ ...a }));
  }

  saveAccounts();

  // Load Favorites
  const storedFavs = localStorage.getItem(STORAGE_KEYS.FAVORITES);
  if (storedFavs) {
    try {
      STATE.favorites = JSON.parse(storedFavs);
    } catch (e) {
      STATE.favorites = [];
    }
  }

  // Load Sound Pref
  const soundPref = localStorage.getItem(STORAGE_KEYS.SOUND);
  if (soundPref !== null) {
    STATE.soundEnabled = soundPref === 'true';
    updateAudioIcon();
  }
}

function saveAccounts() {
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(STATE.accounts));
}

function saveFavorites() {
  localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(STATE.favorites));
  updateFavoritesBadge();
}

function updateFavoritesBadge() {
  const count = STATE.favorites.length;
  const navFavCount = document.getElementById('nav-fav-count');
  const catFavCount = document.getElementById('count-fav');
  const mobileFavBadge = document.getElementById('mobile-fav-badge');

  if (navFavCount) navFavCount.textContent = count;
  if (catFavCount) catFavCount.textContent = count;
  if (mobileFavBadge) mobileFavBadge.textContent = count;
}

function saveCurrentUser(user) {
  STATE.currentUser = user;
  if (user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
}

function getRegisteredUsers() {
  const users = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
  if (users) {
    try {
      return JSON.parse(users);
    } catch (e) {
      return [];
    }
  }
  return [];
}

function saveRegisteredUser(user) {
  const users = getRegisteredUsers();
  users.push(user);
  localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));
}

// ==========================================================================
// PRELOADER / SPLASH SCREEN CONTROLLER
// ==========================================================================
function startSplashScreen() {
  const splash = document.getElementById('splash-screen');
  const progress = document.getElementById('splash-progress');
  const percentText = document.getElementById('splash-percent');
  const statusText = document.getElementById('splash-status-text');
  const skipBtn = document.getElementById('skip-splash-btn');

  let currentPercent = 0;
  const statusStages = [
    { at: 15, text: 'Gaming resurslar tekshirilmoqda...' },
    { at: 40, text: 'PUBG Akkauntlar bazasi ulanmoqda...' },
    { at: 70, text: 'WELCOME ARENDA interfeysi sozlanmoqda...' },
    { at: 90, text: 'Tayyor! Xush kelibsiz!' }
  ];

  const interval = setInterval(() => {
    currentPercent += Math.floor(Math.random() * 10) + 5;
    if (currentPercent > 100) currentPercent = 100;

    progress.style.width = `${currentPercent}%`;
    percentText.textContent = `${currentPercent}%`;

    const stage = statusStages.find(s => currentPercent >= s.at && currentPercent < s.at + 25);
    if (stage) {
      statusText.textContent = stage.text;
    }

    if (currentPercent >= 100) {
      clearInterval(interval);
      setTimeout(finishSplash, 350);
    }
  }, 45);

  skipBtn.addEventListener('click', () => {
    sfx.click();
    clearInterval(interval);
    finishSplash();
  });
}

function finishSplash() {
  const splash = document.getElementById('splash-screen');
  splash.classList.add('fade-out');
  sfx.success();

  const bgVideo = document.getElementById('bg-video');
  if (bgVideo && bgVideo.paused) {
    bgVideo.play().catch(() => {});
  }

  setTimeout(() => {
    splash.classList.add('hidden');
    checkAuthStateAndRender();
  }, 600);
}

// ==========================================================================
// AUTH CONTROLLER (LOGIN & REGISTER)
// ==========================================================================
function checkAuthStateAndRender() {
  const authScreen = document.getElementById('auth-screen');
  const mainApp = document.getElementById('main-app');

  // Visitors always directly access the main app
  if (authScreen) authScreen.classList.add('hidden');
  if (mainApp) mainApp.classList.remove('hidden');

  setupUserHeader();
  renderApp();
}

window.openAuthModal = function() {
  sfx.click();
  const authScreen = document.getElementById('auth-screen');
  if (authScreen) authScreen.classList.remove('hidden');
};

window.closeAuthModal = function() {
  sfx.click();
  const authScreen = document.getElementById('auth-screen');
  if (authScreen) authScreen.classList.add('hidden');
};

window.switchAuthTab = function(tab) {
  sfx.click();
  const loginTab = document.getElementById('tab-login-btn');
  const regTab = document.getElementById('tab-register-btn');
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');

  if (tab === 'login') {
    loginTab.classList.add('active');
    regTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
  } else {
    loginTab.classList.remove('active');
    regTab.classList.add('active');
    loginForm.classList.add('hidden');
    regForm.classList.remove('hidden');
  }
};

window.togglePasswordVisibility = function(inputId) {
  sfx.click();
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
};

window.fillAdminCredentials = function() {
  sfx.click();
  document.getElementById('login-username').value = ADMIN_CONFIG.defaultUser;
  document.getElementById('login-password').value = ADMIN_CONFIG.defaultPass;
  showToast("Admin ma'lumotlari kiritildi!", 'success');
};

function handleLoginSubmit(e) {
  e.preventDefault();
  sfx.click();
  const userField = document.getElementById('login-username').value.trim();
  const passField = document.getElementById('login-password').value.trim();

  // Check Admin
  if (userField === ADMIN_CONFIG.defaultUser && passField === ADMIN_CONFIG.defaultPass) {
    const adminUser = {
      username: ADMIN_CONFIG.defaultUser,
      name: 'Bosh Admin',
      telegram: '@WELCOME_ARENDA',
      role: 'admin'
    };
    saveCurrentUser(adminUser);
    showToast("Xush kelibsiz, Admin! To'liq boshqaruv faollashtirildi.", 'success');
    sfx.success();
    closeAuthModal();
    checkAuthStateAndRender();
    return;
  }

  // Check Regular Users
  const registeredUsers = getRegisteredUsers();
  const matchedUser = registeredUsers.find(u => u.username.toLowerCase() === userField.toLowerCase() && u.password === passField);

  if (matchedUser) {
    const regularUser = {
      username: matchedUser.username,
      name: matchedUser.name,
      telegram: matchedUser.telegram,
      role: 'user'
    };
    saveCurrentUser(regularUser);
    showToast(`Xush kelibsiz, ${matchedUser.name}!`, 'success');
    sfx.success();
    closeAuthModal();
    checkAuthStateAndRender();
    return;
  }

  showToast("Login yoki parol noto'g'ri! Iltimos qayta tekshiring.", 'error');
}

function handleRegisterSubmit(e) {
  e.preventDefault();
  sfx.click();
  const name = document.getElementById('reg-name').value.trim();
  const telegram = document.getElementById('reg-telegram').value.trim();
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value.trim();

  if (username === ADMIN_CONFIG.defaultUser) {
    showToast("Bu login band qilingan!", 'error');
    return;
  }

  const registeredUsers = getRegisteredUsers();
  const exists = registeredUsers.some(u => u.username.toLowerCase() === username.toLowerCase());

  if (exists) {
    showToast("Bunday loginli foydalanuvchi allaqachon mavjud!", 'error');
    return;
  }

  const newUser = { name, telegram, username, password };
  saveRegisteredUser(newUser);

  // Auto login
  saveCurrentUser({
    username: newUser.username,
    name: newUser.name,
    telegram: newUser.telegram,
    role: 'user'
  });

  showToast("Ro'yxatdan o'tdingiz va tizimga kirdingiz!", 'success');
  sfx.success();
  closeAuthModal();
  checkAuthStateAndRender();
}

function handleLogout() {
  sfx.click();
  saveCurrentUser(null);
  showToast("Tizimdan chiqdingiz.", 'info');
  checkAuthStateAndRender();
}

function setupUserHeader() {
  const user = STATE.currentUser;
  const displayUserName = document.getElementById('display-user-name');
  const displayUserRole = document.getElementById('display-user-role');
  const userAvatar = document.getElementById('user-avatar');
  const adminActionBar = document.getElementById('admin-action-bar');
  const logoutBtn = document.getElementById('logout-btn');

  if (user && user.role === 'admin') {
    if (displayUserName) displayUserName.textContent = user.name || 'Admin';
    if (displayUserRole) {
      displayUserRole.textContent = 'ADMIN';
      displayUserRole.style.color = '#38bdf8';
    }
    if (userAvatar) userAvatar.innerHTML = '<i class="fa-solid fa-crown text-yellow-400"></i>';
    if (adminActionBar) adminActionBar.classList.remove('hidden');
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
  } else {
    if (displayUserName) displayUserName.textContent = user ? user.name : 'Mehmon';
    if (displayUserRole) {
      displayUserRole.textContent = user ? (user.telegram || 'FOYDALANUVCHI') : 'Kirish';
      displayUserRole.style.color = '#94a3b8';
    }
    if (userAvatar) userAvatar.innerHTML = '<i class="fa-solid fa-user-shield"></i>';
    if (adminActionBar) adminActionBar.classList.add('hidden');
    if (logoutBtn) logoutBtn.style.display = user ? 'inline-flex' : 'none';
  }

  updateFavoritesBadge();
  updateCompareDock();
}

// ==========================================================================
// MULTI-FILTERING, TAGGING & SORTING ENGINE
// ==========================================================================
function getFilteredAccounts() {
  let list = STATE.accounts.filter(acc => {
    const specs = parseAccountSpecs(acc);

    // 1. Category Filter
    if (STATE.selectedCategory === 'FAVORITES') {
      if (!STATE.favorites.includes(acc.id)) return false;
    } else if (STATE.selectedCategory !== 'ALL' && acc.category !== STATE.selectedCategory) {
      return false;
    }

    // 2. Status Filter
    if (STATE.freeOnlyActive || STATE.selectedStatus === 'free') {
      if (acc.status !== 'free') return false;
    } else if (STATE.selectedStatus === 'busy') {
      if (acc.status !== 'busy') return false;
    }

    // 3. Quick Tag Filter Chips
    if (STATE.selectedTag !== 'all') {
      if (STATE.selectedTag === 'xsuit' && !specs.hasXSuit) return false;
      if (STATE.selectedTag === 'supercar' && !specs.hasSupercar) return false;
      if (STATE.selectedTag === 'glacier' && !specs.hasGlacier) return false;
      if (STATE.selectedTag === 'mumiya' && !specs.hasMumiya) return false;
      if (STATE.selectedTag === 'prok' && specs.prokachka < 100) return false;
      if (STATE.selectedTag === 'budget' && specs.priceNum > 6000) return false;
    }

    // 4. Search Query Filter
    if (STATE.searchQuery) {
      const q = STATE.searchQuery.toLowerCase();
      const inTitle = acc.title.toLowerCase().includes(q);
      const inCat = acc.category.toLowerCase().includes(q);
      const inDetails = (acc.rawDetails || '').toLowerCase().includes(q);

      if (!inTitle && !inCat && !inDetails) {
        return false;
      }
    }

    return true;
  });

  // Sorting Logic
  if (STATE.sortBy === 'price-asc') {
    list.sort((a, b) => parseAccountSpecs(a).priceNum - parseAccountSpecs(b).priceNum);
  } else if (STATE.sortBy === 'price-desc') {
    list.sort((a, b) => parseAccountSpecs(b).priceNum - parseAccountSpecs(a).priceNum);
  } else if (STATE.sortBy === 'mifik-desc') {
    list.sort((a, b) => parseAccountSpecs(b).mifik - parseAccountSpecs(a).mifik);
  } else if (STATE.sortBy === 'cars-desc') {
    list.sort((a, b) => parseAccountSpecs(b).cars - parseAccountSpecs(a).cars);
  } else if (STATE.sortBy === 'col-desc') {
    list.sort((a, b) => parseAccountSpecs(b).collection - parseAccountSpecs(a).collection);
  }

  return list;
}

window.handleSortChange = function(val) {
  sfx.click();
  STATE.sortBy = val;
  renderApp();
};

window.filterByFavorites = function() {
  sfx.click();
  STATE.selectedCategory = 'FAVORITES';
  document.querySelectorAll('.cat-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === 'FAVORITES');
  });
  renderApp();
};

function updateStatsAndCounts() {
  const allAccounts = STATE.accounts;
  const vipCount = allAccounts.filter(a => a.category === 'VIP').length;
  const topCount = allAccounts.filter(a => a.category === 'TOP').length;
  const cheapCount = allAccounts.filter(a => a.category === 'CHEAP').length;
  const freeCount = allAccounts.filter(a => a.status === 'free').length;

  document.getElementById('stat-vip-count').textContent = vipCount;
  document.getElementById('stat-top-count').textContent = topCount;
  document.getElementById('stat-cheap-count').textContent = cheapCount;
  document.getElementById('stat-free-count').textContent = freeCount;

  // Tabs badge counts
  const cAll = document.getElementById('count-all');
  const cVip = document.getElementById('count-vip');
  const cTop = document.getElementById('count-top');
  const cCheap = document.getElementById('count-cheap');

  if (cAll) cAll.textContent = allAccounts.length;
  if (cVip) cVip.textContent = vipCount;
  if (cTop) cTop.textContent = topCount;
  if (cCheap) cCheap.textContent = cheapCount;

  updateFavoritesBadge();
}

function updateFilterSummary() {
  const filtered = getFilteredAccounts();
  const summaryDesc = document.getElementById('filter-status-desc');
  const filteredCount = document.getElementById('filtered-count');

  let catText = 'BARCHA TOIFALAR';
  if (STATE.selectedCategory === 'VIP') catText = 'VIP TOIFASI';
  if (STATE.selectedCategory === 'TOP') catText = 'TOP TOIFASI';
  if (STATE.selectedCategory === 'CHEAP') catText = 'CHEAP TOIFASI';
  if (STATE.selectedCategory === 'FAVORITES') catText = '💖 SEVIMLI AKKAUNTLAR';

  let statusText = '';
  if (STATE.freeOnlyActive || STATE.selectedStatus === 'free') {
    statusText = " + FAQAT BO'SH";
  } else if (STATE.selectedStatus === 'busy') {
    statusText = " + BAND";
  }

  if (STATE.selectedTag !== 'all') {
    statusText += ` [Tag: ${STATE.selectedTag.toUpperCase()}]`;
  }

  summaryDesc.textContent = `${catText}${statusText}`;
  filteredCount.textContent = filtered.length;
}

// Helper to format verbatim details lines
function formatRawDetailsHtml(rawText, maxLines = null) {
  if (!rawText) return '<div class="raw-detail-row empty">Ma\'lumot kiritilmagan</div>';
  const lines = rawText.split('\n').map(l => l.trim());
  const displayLines = maxLines ? lines.slice(0, maxLines) : lines;

  return displayLines.map(line => {
    if (!line) {
      return '<div class="raw-detail-separator"></div>';
    }

    const upper = line.toUpperCase();
    let isHeader = upper.includes('COLLECTION') || upper.includes('MIFIK') || upper.includes('ULTIMATE');
    let isWeapon = upper.includes('PROKACHKA') || upper.includes('MAXX') || upper.includes('LVL') || upper.includes('KILLCHAT') || upper.includes('ARUJA') || upper.includes('ARUJIYA') || upper.includes('STATTRACK');
    let isCar = upper.includes('CAR') || upper.includes('SHEDEVR') || upper.includes('DROP') || upper.includes('PORSCHE') || upper.includes('LAMBORGHINI') || upper.includes('BUGATTI') || upper.includes('BENTLEY') || upper.includes('MACLAREN') || upper.includes('PAGANI') || upper.includes('FERRARI') || upper.includes('KOENIGSEGG') || upper.includes('TESLA');
    let isSpecial = upper.includes('ORQA FON') || upper.includes('EMOJI') || upper.includes('SET') || upper.includes('MUMIYA') || upper.includes('BAPE') || upper.includes('KAPITAN') || upper.includes('KOFT') || upper.includes('X-SUIT') || upper.includes('LEDNIK');

    let badgeClass = 'normal';
    let bulletIcon = '<i class="fa-solid fa-diamond detail-bullet"></i>';

    if (isHeader) {
      badgeClass = 'highlight';
      bulletIcon = '<i class="fa-solid fa-crown detail-bullet"></i>';
    } else if (isWeapon) {
      badgeClass = 'weapon';
      bulletIcon = '<i class="fa-solid fa-gun detail-bullet"></i>';
    } else if (isCar) {
      badgeClass = 'car';
      bulletIcon = '<i class="fa-solid fa-car detail-bullet"></i>';
    } else if (isSpecial) {
      badgeClass = 'special';
      bulletIcon = '<i class="fa-solid fa-star detail-bullet"></i>';
    }

    return `
      <div class="raw-detail-row ${badgeClass}">
        ${bulletIcon}
        <span class="detail-text">${line}</span>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// RENDER ACCOUNTS GRID
// ==========================================================================
// Helper for current time format (YYYY.MM.DD - HH:MM)
function getCurrentTimeFormatted() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${d} - ${h}:${min}`;
}

// Format currency helper in UZS format (e.g. 60.000 UZS)
function formatUZS(num) {
  if (typeof num !== 'number') num = parseInt(num) || 0;
  return num.toLocaleString('de-DE') + ' UZS';
}



// ==========================================================================
// RENDER ACCOUNTS GRID
// ==========================================================================
function renderApp() {
  updateStatsAndCounts();
  updateFilterSummary();

  const filteredAccounts = getFilteredAccounts();
  const grid = document.getElementById('accounts-grid');
  const emptyState = document.getElementById('no-results-state');

  if (filteredAccounts.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  const isAdmin = STATE.currentUser && STATE.currentUser.role === 'admin';

  grid.innerHTML = filteredAccounts.map(acc => {
    const isFree = acc.status === 'free';
    const catClass = acc.category.toLowerCase();
    const isFav = STATE.favorites.includes(acc.id);

    // Admin bottom action buttons
    const adminActions = isAdmin
      ? `<div class="card-admin-row" onclick="event.stopPropagation()">
           <button class="card-admin-btn-row edit" onclick="event.stopPropagation(); openEditAccountModal('${acc.id}')">
             <i class="fa-solid fa-pen-to-square"></i> Tahrirlash
           </button>
           <button class="card-admin-btn-row danger" onclick="event.stopPropagation(); deleteAccount('${acc.id}')">
             <i class="fa-solid fa-trash"></i> O'chirish
           </button>
         </div>`
      : '';

    const priceText = acc.price || "Kelishilgan narx";

    return `
      <div class="account-card ${catClass}-card" data-id="${acc.id}" onclick="openAccountDetails('${acc.id}')" role="button" tabindex="0" aria-label="${acc.title} to'liq ma'lumotlarini ko'rish">
        <!-- Media / Preview Image -->
        <div class="card-media">
          <img src="${acc.image || '/assets/vip-badge.jpg'}" alt="${acc.title}" class="card-img" loading="lazy">

          <!-- Heart Fav Button top-right -->
          <button class="card-fav-corner-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite('${acc.id}', event)" title="${isFav ? 'Sevimlilardan o\'chirish' : 'Sevimlilarga qo\'shish'}" aria-label="Sevimli">
            <i class="fa-solid fa-heart"></i>
          </button>
        </div>

        <!-- Card Body (Screenshot Style) -->
        <div class="card-body">
          <div class="card-title-main">${acc.title}</div>
          
          <button class="card-status-pill ${isFree ? 'free' : 'busy'}" 
            onclick="${isAdmin ? `event.stopPropagation(); toggleAccountStatus('${acc.id}', event)` : `event.stopPropagation(); openAccountDetails('${acc.id}')`}">
            ${isFree ? "BÖSH" : "BAND"}
          </button>

          <div class="card-price-sub">${priceText}</div>

          ${adminActions}
        </div>
      </div>
    `;
  }).join('');
}

function getCategoryIcon(category) {
  switch (category) {
    case 'VIP': return 'fa-crown';
    case 'TOP': return 'fa-fire';
    case 'CHEAP': return 'fa-bolt';
    default: return 'fa-gamepad';
  }
}

// ==========================================================================
// FAVORITES SYSTEM
// ==========================================================================
window.toggleFavorite = function(accId, event) {
  if (event) event.stopPropagation();
  sfx.heart();

  const idx = STATE.favorites.indexOf(accId);
  const acc = STATE.accounts.find(a => a.id === accId);
  const title = acc ? acc.title : 'Akkaunt';

  if (idx > -1) {
    STATE.favorites.splice(idx, 1);
    showToast(`${title} sevimlilardan olib tashlandi`, 'info');
  } else {
    STATE.favorites.push(accId);
    showToast(`${title} sevimlilarga qo'shildi! 💖`, 'success');
  }

  saveFavorites();
  renderApp();
};

// ==========================================================================
// COMPARISON TOOL SYSTEM (SIDE-BY-SIDE COMPARE)
// ==========================================================================
window.toggleCompare = function(accId, event) {
  if (event) event.stopPropagation();
  sfx.click();

  const idx = STATE.compareList.indexOf(accId);
  const acc = STATE.accounts.find(a => a.id === accId);
  const title = acc ? acc.title : 'Akkaunt';

  if (idx > -1) {
    STATE.compareList.splice(idx, 1);
    showToast(`${title} taqqoslashdan chiqarildi`, 'info');
  } else {
    if (STATE.compareList.length >= 3) {
      showToast("Bir vaqtning o'zida ko'pi bilan 3 ta akkauntni taqqoslash mumkin!", 'error');
      return;
    }
    STATE.compareList.push(accId);
    showToast(`${title} taqqoslashga qo'shildi! ⚖️`, 'success');
  }

  updateCompareDock();
  renderApp();
};

function updateCompareDock() {
  const dock = document.getElementById('compare-dock');
  const countEl = document.getElementById('compare-dock-count');
  const thumbsEl = document.getElementById('compare-dock-thumbnails');
  const navCompareCount = document.getElementById('nav-compare-count');
  const navCompareBtn = document.getElementById('nav-compare-btn');
  const mobileCompareBadge = document.getElementById('mobile-compare-badge');

  const count = STATE.compareList.length;

  if (navCompareCount) navCompareCount.textContent = count;
  if (mobileCompareBadge) mobileCompareBadge.textContent = count;
  if (navCompareBtn) navCompareBtn.classList.toggle('hidden', count === 0);

  if (count === 0) {
    dock.classList.add('hidden');
    return;
  }

  dock.classList.remove('hidden');
  countEl.textContent = `${count}/3`;

  thumbsEl.innerHTML = STATE.compareList.map(id => {
    const acc = STATE.accounts.find(a => a.id === id);
    if (!acc) return '';
    return `<img src="${acc.image || '/assets/vip-badge.jpg'}" alt="${acc.title}" class="compare-thumb-img" title="${acc.title}">`;
  }).join('');
}

window.clearCompareList = function() {
  sfx.click();
  STATE.compareList = [];
  updateCompareDock();
  renderApp();
  showToast("Taqqoslash ro'yxati tozalandi", 'info');
};

window.openCompareModal = function() {
  sfx.click();
  if (STATE.compareList.length === 0) {
    showToast("Taqqoslash uchun kamida 1 ta akkaunt tanlang (kartochkadagi ⚖️ belgisini bosing)", 'info');
    return;
  }

  const wrap = document.getElementById('compare-table-wrap');
  const accounts = STATE.compareList.map(id => STATE.accounts.find(a => a.id === id)).filter(Boolean);

  wrap.innerHTML = `
    <table class="compare-table">
      <thead>
        <tr>
          <th>Xususiyat</th>
          ${accounts.map(acc => `
            <th>
              <div class="compare-acc-head">
                <img src="${acc.image || '/assets/vip-badge.jpg'}" class="compare-head-img">
                <strong style="color:#fff;">${acc.title}</strong>
                <span class="card-badge-category ${acc.category.toLowerCase()}" style="font-size:0.75rem;">${acc.category}</span>
              </div>
            </th>
          `).join('')}
        </tr>
      </thead>
      <tbody>
        <tr class="compare-highlight-row">
          <td>💵 Soatlik Narxi</td>
          ${accounts.map(acc => `<td class="compare-spec-val" style="color:#10b981; font-weight:700;">${acc.price}</td>`).join('')}
        </tr>
        <tr>
          <td>🟢 Holati</td>
          ${accounts.map(acc => `<td class="compare-spec-val">${acc.status === 'free' ? '<span style="color:#10b981;">🟢 Bo\'sh</span>' : '<span style="color:#ef4444;">🔴 Band</span>'}</td>`).join('')}
        </tr>
        <tr>
          <td>🔝 Collection</td>
          ${accounts.map(acc => `<td class="compare-spec-val">${parseAccountSpecs(acc).collection}% Collection</td>`).join('')}
        </tr>
        <tr>
          <td>🔥 Mifiklar soni</td>
          ${accounts.map(acc => `<td class="compare-spec-val">${parseAccountSpecs(acc).mifik}+ Mifik</td>`).join('')}
        </tr>
        <tr>
          <td>✨ Ultimate kiyimlar</td>
          ${accounts.map(acc => `<td class="compare-spec-val">${parseAccountSpecs(acc).ultimate}+ Ultimate</td>`).join('')}
        </tr>
        <tr>
          <td>🏎️ Supercarlar</td>
          ${accounts.map(acc => `<td class="compare-spec-val">${parseAccountSpecs(acc).cars} ta Super Car</td>`).join('')}
        </tr>
        <tr>
          <td>🎯 Prokachka qurollar</td>
          ${accounts.map(acc => `<td class="compare-spec-val">${parseAccountSpecs(acc).prokachka}+ Prokachka</td>`).join('')}
        </tr>
        <tr>
          <td>⚡ Arendaga olish</td>
          ${accounts.map(acc => `
            <td>
              <button class="cyber-btn primary small" onclick="closeModal('compare-modal'); openAccountDetails('${acc.id}')">
                <i class="fa-solid fa-key"></i> Tanlash
              </button>
            </td>
          `).join('')}
        </tr>
      </tbody>
    </table>
  `;

  document.getElementById('compare-modal').classList.remove('hidden');
};

// ==========================================================================
// ==========================================================================
// ACCOUNT DETAILS & RENTAL TARIFF PACKAGES MODAL
// ==========================================================================
window.openAccountDetails = function(accId) {
  try {
    sfx.click();
    const acc = STATE.accounts.find(a => a.id === accId);
    if (!acc) {
      console.warn("Account not found:", accId);
      return;
    }

    STATE.calcAccId = accId;
    STATE.calcPackage = '3h'; // Default package is 3 hours

    renderDetailsModalContent(acc);
    const modal = document.getElementById('account-modal');
    if (modal) {
      modal.classList.remove('hidden');
      const dialog = modal.querySelector('.modal-dialog');
      if (dialog) dialog.scrollTop = 0;
    }
  } catch (err) {
    console.error("Error opening account details:", err);
  }
};

function renderDetailsModalContent(acc) {
  const modalBody = document.getElementById('account-modal-body');
  if (!modalBody) return;
  const isAdmin = STATE.currentUser && STATE.currentUser.role === 'admin';
  const isFree = acc.status === 'free';
  const fullDetailsHtml = formatRawDetailsHtml(acc.rawDetails);

  // Retrieve exact pricing for this account
  const pricing = ACCOUNT_PRICING[acc.id] || {
    '3h': 50000,
    day: 120000,
    night: 120000,
    '24h': 240000
  };

  const is21Day = DAY_LABEL_21_ACCOUNTS.includes(acc.id);
  const dayTitle = is21Day ? '09:00 DAN 21:00 GACHA' : '09:00 DAN 19:00 GACHA';
  const dayDuration = is21Day ? '09:00 dan 21:00 gacha' : '09:00 dan 19:00 gacha';
  const dayBadge = is21Day ? 'KUNDUZGI (12 SOAT)' : 'KUNDUZGI (10 SOAT)';

  // 4 Exact Tariff Packages requested by user
  const packages = [
    {
      key: '3h',
      title: '3 SOAT HARID QILISH',
      icon: '⚡',
      badge: '3 SOAT TEZKOR',
      price: pricing['3h'],
      durationName: '3 soat'
    },
    {
      key: 'day',
      title: dayTitle,
      icon: '☀️',
      badge: dayBadge,
      price: pricing.day,
      durationName: dayDuration
    },
    {
      key: 'night',
      title: '21:00 DAN 09:00 GACHA',
      icon: '🌙',
      badge: 'TUNGI TARIF (12 SOAT)',
      price: pricing.night,
      durationName: '21:00 dan 09:00 gacha'
    },
    {
      key: '24h',
      title: '24 SOATGA HARID QILISH',
      icon: '👑',
      badge: '1 KUN (24 SOAT)',
      price: pricing['24h'],
      durationName: '24 soat'
    }
  ];

  if (!STATE.calcPackage || !packages.some(p => p.key === STATE.calcPackage)) {
    STATE.calcPackage = '3h';
  }

  const selectedPkg = packages.find(p => p.key === STATE.calcPackage) || packages[0];
  const finalTotal = selectedPkg.price;

  // Telegram order prefilled message format
  const telegramMessageText = 
`Assalomu aleykum WELCOME ARENDA saytdan accaunt ko'rib yozvotkan edim 😄

Menga (${acc.title}) shu accaunt maqul keldi 

(${acc.title}) ${selectedPkg.durationName}ga olmoqchi edim narxi qancha bo'ladi`;

  const prefilledMessage = encodeURIComponent(telegramMessageText);
  const telegramOrderUrl = `https://t.me/${ADMIN_CONFIG.adminContact.replace('@', '')}?text=${prefilledMessage}`;

  modalBody.innerHTML = `
    <div class="detail-modal-header">
      <img src="${acc.image || '/assets/vip-badge.jpg'}" alt="${acc.title}">
      <div class="detail-header-overlay"></div>
      <span class="card-badge-category ${acc.category.toLowerCase()}" style="position:absolute; top:1rem; left:1rem; z-index:3;">
        <i class="fa-solid ${getCategoryIcon(acc.category)}"></i> ${acc.category} TOIFASI
      </span>
      <span class="card-badge-status ${isFree ? 'free' : 'busy'}" style="position:absolute; top:1rem; right:1rem; z-index:3;">
        ${isFree ? "🟢 HOZIRDA BO'SH" : "🔴 HOZIRDA BAND"}
      </span>
    </div>

    <!-- Big Watch Button on Modal -->
    <a href="${acc.telegramUrl}" target="_blank" rel="noopener noreferrer" class="cyber-btn telegram large-watch-btn pulse-glow">
      <i class="fa-solid fa-play"></i>
      <span>ACCAUNTNI KO'RISH (TELEGRAM ABZOR POST)</span>
      <i class="fa-solid fa-arrow-up-right-from-square"></i>
    </a>

    <div class="detail-title-bar">
      <div>
        <h2 class="detail-modal-title">${acc.title}</h2>
        <span class="detail-price-tag">${formatUZS(pricing['3h'])} dan</span>
      </div>
      <button class="cyber-btn-outline small" onclick="copyTelegramLink('${acc.telegramUrl}', event)">
        <i class="fa-solid fa-copy"></i> Telegram post havolasi
      </button>
    </div>

    <!-- ================= 4 RENTAL TARIFF PACKAGES SELECTION ================= -->
    <div class="calc-widget">
      <div class="calc-widget-header">
        <span class="calc-widget-title"><i class="fa-solid fa-bolt-lightning text-cyan"></i> ARENDA MUDDATINI TANLANG:</span>
      </div>

      <!-- 4 Tariff Package Cards Grid -->
      <div class="tariff-packages-grid">
        ${packages.map(pkg => {
          const isActive = pkg.key === selectedPkg.key;
          return `
            <button class="tariff-card-btn ${isActive ? 'active' : ''}" onclick="selectTariffPackage('${pkg.key}')">
              <div class="tariff-card-left">
                <span class="tariff-icon">${pkg.icon}</span>
                <div class="tariff-info">
                  <span class="tariff-title">${pkg.title}</span>
                  <span class="tariff-badge">${pkg.badge}</span>
                </div>
              </div>
              <div class="tariff-card-right">
                <span class="tariff-price">${formatUZS(pkg.price)}</span>
                <span class="tariff-radio"><i class="fa-solid ${isActive ? 'fa-circle-check text-cyan' : 'fa-circle'}"></i></span>
              </div>
            </button>
          `;
        }).join('')}
      </div>

      <!-- BUYURTMANGIZ Summary Box -->
      <div class="calc-order-summary-card">
        <div class="summary-card-title">BUYURTMANGIZ :</div>
        <div class="summary-line">
          <span class="s-label">Narxi:</span>
          <span class="s-val highlight">${formatUZS(finalTotal)}</span>
        </div>
        <div class="summary-line">
          <span class="s-label">Start:</span>
          <span class="s-val">${getCurrentTimeFormatted()} <i class="fa-solid fa-clock-rotate-left sync-icon"></i></span>
        </div>
        <div class="summary-line">
          <span class="s-label">Vaqti:</span>
          <span class="s-val">${selectedPkg.durationName}</span>
        </div>
      </div>
    </div>

    <!-- 1-Click Order Button -->
    <a href="${telegramOrderUrl}" target="_blank" rel="noopener noreferrer" class="cyber-btn primary full-width order-submit-btn">
      <i class="fa-brands fa-telegram" style="font-size:1.3rem;"></i>
      <span>ADMINGA TELEGRAMDA BRON QILISH (${formatUZS(finalTotal)})</span>
    </a>

    <!-- Exact Line by Line Verbatim Details -->
    <div class="modal-specs-section">
      <h4 class="modal-specs-title">
        <i class="fa-solid fa-list-check text-cyan"></i> AKKAUNT MA'LUMOTLARI VA TAVSIFI:
      </h4>
      <div class="raw-details-box modal-full-box">
        ${fullDetailsHtml}
      </div>
    </div>

    <!-- ACCUNTNI ARENDAGA OLISH QOIDASI -->
    <div class="rent-instructions rent-rules-box">
      <h4 class="rent-rules-title">
        <i class="fa-solid fa-shield-halved text-cyan"></i> ACCUNTNI ARENDAGA OLISH QOIDASI
      </h4>
      
      <div class="rent-rules-list">
        <p class="rule-p highlight">⚡️ <b>ARENDAGA ACCAUNT OLISH UCHUN :</b> ( YASHASH MANZILI , TELEFON RAQAM, VIDEOHABAR , PASPORT ) BERILADI ‼️</p>

        <p class="rule-p header-pill">⚡️ <b>ACCAUNTNI ARENDAGA OLISH QOIDALARI ‼️</b></p>

        <p class="rule-p danger">⚡️ CHEAT VA MOD BILAN O’YNASH MUTLAQO TAQIQLANADI ❌</p>

        <p class="rule-p danger">⚡️ AGARDA CHIT BILAN OYANGANIZNI BILSAM ACCAUNT OLINADI VA PULIZ QAYTARIB BERILMIDI ❌</p>

        <p class="rule-p warning">⚡️ ACCAUNT SIZ O’YNAVOTGANIZDA BLOK BO’LSA ( BAN OLSA ) JAVOBGARLIKGA TORTILASIZ ( ACCAUNTNI PULI TO’LANADI )</p>

        <p class="rule-p">⚡️ AVTOPADBOR BILAN UMUMMAN O’YNAMANG ( SHERGINGIZ CHITAK BO’LISHI MUMKIN )</p>

        <p class="rule-p success">⚡️ <b>DIQQAT ‼️</b><br>VAQT SIZ ACCAUNTGA KIRGANIZDAN BOSHLANADI ✅</p>

        <p class="rule-p warning">⚡️ QOIDALARNI BILMASLIK SIZNI JAVOBGARLIKDAN OZOD QILMAYDI ‼️</p>

        <p class="rule-p">⚡️ ACCAUNT PRIVYAZKALARGA UMUMMAN TEGMANG ‼️</p>

        <p class="rule-p">⚡️ BAYROQNI 🇺🇿, MINTAQANI 🪙, SERVERNI 📡 UMUMMAN O’ZGARTIRMANG ‼️</p>

        <p class="rule-p">⚡️ ACCAUNTNI NIKINI O’ZGARTIRMANG ‼️ ( O’ZGARTIRISH PULLIK )</p>

        <p class="rule-p">⚡️ ACCAUNTGA UC TASHLAMANG ‼️ ( ADMIN RUXSATISIZ )</p>

        <p class="rule-p">⚡️ MEN ACCAUNTGA BIR MARTA KIRGIZIB BERAMAN ACCAUNTDAN QANDAYDIR SABABLAR TUFAYLI CHIQIB KETMANG ‼️</p>

        <p class="rule-p danger">⚡️ AGAR QOIDALARGA RIOYA QILMASANGIZ SIZGA HISOB BERILMAYDI VA PULINGIZ KUYADI ‼️</p>
      </div>
    </div>

    ${isAdmin ? `
      <div class="modal-admin-actions-bar" style="margin-top:1.5rem; padding-top:1rem; border-top:1px dashed rgba(255,255,255,0.15); display:flex; gap:0.75rem;">
        <button class="cyber-btn success small" style="flex:1;" onclick="closeModal('account-modal'); openEditAccountModal('${acc.id}')">
          <i class="fa-solid fa-pen-to-square"></i> Tahrirlash
        </button>
        <button class="cyber-btn-outline small" style="flex:1; border-color:#ef4444; color:#f87171;" onclick="closeModal('account-modal'); deleteAccount('${acc.id}')">
          <i class="fa-solid fa-trash"></i> O'chirish
        </button>
      </div>
    ` : ''}
  `;
}

window.selectTariffPackage = function(pkgKey) {
  sfx.toggle();
  STATE.calcPackage = pkgKey;
  const acc = STATE.accounts.find(a => a.id === STATE.calcAccId);
  if (acc) {
    renderDetailsModalContent(acc);
  }
};

window.closeModal = function(modalId) {
  sfx.click();
  document.getElementById(modalId).classList.add('hidden');
};


// ==========================================================================
// FAQ ACCORDION
// ==========================================================================
window.toggleFaq = function(btn) {
  sfx.toggle();
  const item = btn.closest('.faq-item');
  const isActive = item.classList.contains('active');

  document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('active'));

  if (!isActive) {
    item.classList.add('active');
  }
};

// ==========================================================================
// MOBILE BOTTOM NAVIGATION
// ==========================================================================
window.handleMobileNavClick = function(type) {
  sfx.click();
  if (type === 'fav') {
    filterByFavorites();
  } else if (type === 'all') {
    STATE.selectedCategory = 'ALL';
    document.querySelectorAll('.cat-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === 'ALL');
    });
    renderApp();
  }
};

// ==========================================================================
// STATUS TOGGLE & COPY UTILS
// ==========================================================================
window.toggleAccountStatus = function(accId, event) {
  if (event) event.stopPropagation();
  const isAdmin = STATE.currentUser && STATE.currentUser.role === 'admin';

  if (!isAdmin) {
    const acc = STATE.accounts.find(a => a.id === accId);
    if (acc) {
      if (acc.status === 'free') {
        showToast(`Bu akkaunt hozirda bo'sh! Arendaga olishingiz mumkin.`, 'success');
      } else {
        showToast(`Bu akkaunt hozirda band qilingan.`, 'info');
      }
    }
    return;
  }

  // Admin toggles status
  sfx.toggle();
  const acc = STATE.accounts.find(a => a.id === accId);
  if (acc) {
    acc.status = acc.status === 'free' ? 'busy' : 'free';
    saveAccounts();
    renderApp();
    showToast(`${acc.title} holati "${acc.status === 'free' ? "BO'SH 🟢" : "BAND 🔴"}" ga o'zgartirildi!`, 'success');
  }
};

window.copyTelegramLink = function(url, event) {
  if (event) event.stopPropagation();
  sfx.click();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      showToast("Telegram havola nusxalandi!", 'success');
    }).catch(() => fallbackCopy(url));
  } else {
    fallbackCopy(url);
  }
};

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  showToast("Telegram havola nusxalandi!", 'success');
}

// ==========================================================================
// ADMIN EDIT & ADD
// ==========================================================================
window.openEditAccountModal = function(accId = null) {
  sfx.click();
  STATE.editingAccountId = accId;
  const modal = document.getElementById('admin-account-modal');
  const title = document.getElementById('admin-modal-title');
  const form = document.getElementById('admin-account-form');

  if (accId) {
    const acc = STATE.accounts.find(a => a.id === accId);
    if (!acc) return;
    title.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> ${acc.title} ni Tahrirlash`;
    document.getElementById('edit-acc-id').value = acc.id;
    document.getElementById('edit-acc-title').value = acc.title;
    document.getElementById('edit-acc-category').value = acc.category;
    document.getElementById('edit-acc-status').value = acc.status;
    document.getElementById('edit-acc-price').value = acc.price;
    document.getElementById('edit-acc-link').value = acc.telegramUrl;
    document.getElementById('edit-acc-raw').value = acc.rawDetails || '';
  } else {
    title.innerHTML = `<i class="fa-solid fa-plus"></i> Yangi Akkaunt Qo'shish`;
    form.reset();
    document.getElementById('edit-acc-id').value = '';
    document.getElementById('edit-acc-category').value = 'VIP';
    document.getElementById('edit-acc-status').value = 'free';
  }

  modal.classList.remove('hidden');
};

function handleAdminAccountSubmit(e) {
  e.preventDefault();
  sfx.click();
  const accId = document.getElementById('edit-acc-id').value;
  const title = document.getElementById('edit-acc-title').value.trim();
  const category = document.getElementById('edit-acc-category').value;
  const status = document.getElementById('edit-acc-status').value;
  const price = document.getElementById('edit-acc-price').value.trim();
  const telegramUrl = document.getElementById('edit-acc-link').value.trim();
  const rawDetails = document.getElementById('edit-acc-raw').value.trim();

  let img = '/assets/vip-badge.jpg';
  if (category === 'TOP') img = '/assets/top-badge.jpg';
  if (category === 'CHEAP') img = '/assets/cheap-badge.jpg';

  if (accId) {
    const index = STATE.accounts.findIndex(a => a.id === accId);
    if (index !== -1) {
      STATE.accounts[index] = {
        ...STATE.accounts[index],
        title,
        category,
        status,
        price,
        telegramUrl,
        rawDetails,
        image: STATE.accounts[index].image || img
      };
      showToast(`${title} yangilandi!`, 'success');
    }
  } else {
    const newAcc = {
      id: `acc-${Date.now()}`,
      title,
      category,
      status,
      price,
      telegramUrl,
      rawDetails,
      image: img
    };
    STATE.accounts.unshift(newAcc);
    showToast(`Yangi ${title} qo'shildi!`, 'success');
  }

  saveAccounts();
  renderApp();
  closeModal('admin-account-modal');
}

window.deleteAccount = function(accId) {
  sfx.click();
  if (confirm("Haqiqatan ham ushbu akkauntni o'chirmoqchimisiz?")) {
    STATE.accounts = STATE.accounts.filter(a => a.id !== accId);
    saveAccounts();
    renderApp();
    showToast("Akkaunt o'chirildi!", 'info');
  }
};

function handleResetDefaults() {
  sfx.click();
  if (confirm("Barcha akkauntlarni dastlabki holatiga qaytarishni xohlaysizmi?")) {
    STATE.accounts = [...INITIAL_ACCOUNTS];
    saveAccounts();
    renderApp();
    showToast("Barcha akkauntlar asliga qaytarildi!", 'success');
  }
}

// ==========================================================================
// TOAST NOTIFICATION SYSTEM
// ==========================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-circle-check text-green';
  if (type === 'error') icon = 'fa-triangle-exclamation text-red';

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3500);
}

// ==========================================================================
// AUDIO & NETWORK HELPER
// ==========================================================================
function updateAudioIcon() {
  const icon = document.getElementById('audio-icon');
  if (STATE.soundEnabled) {
    icon.className = 'fa-solid fa-volume-high';
    icon.style.color = 'var(--neon-cyan)';
  } else {
    icon.className = 'fa-solid fa-volume-xmark';
    icon.style.color = 'var(--text-dim)';
  }
}

window.copyLocalUrl = function() {
  sfx.click();
  const input = document.getElementById('local-ip-url');
  input.select();
  document.execCommand('copy');
  showToast("Tarmoq havolasi nusxalandi!", 'success');
};

window.resetAllFilters = function() {
  sfx.click();
  STATE.selectedCategory = 'ALL';
  STATE.selectedStatus = 'ALL';
  STATE.selectedTag = 'all';
  STATE.sortBy = 'default';
  STATE.freeOnlyActive = false;
  STATE.searchQuery = '';

  document.querySelectorAll('.cat-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === 'ALL');
  });

  document.querySelectorAll('.tag-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tag === 'all');
  });

  document.getElementById('sort-select').value = 'default';
  document.getElementById('filter-free-only-btn').classList.remove('active');
  document.querySelectorAll('.status-pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.status === 'ALL');
  });

  const searchInput = document.getElementById('search-input');
  searchInput.value = '';
  document.getElementById('clear-search-btn').classList.add('hidden');

  renderApp();
  showToast("Filtrlar tozalandi.", 'info');
};

// ==========================================================================
// EVENT LISTENERS BINDING & APP INITIALIZATION
// ==========================================================================
function bindApplicationEvents() {
  // Auth Forms
  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);

  const registerForm = document.getElementById('register-form');
  if (registerForm) registerForm.addEventListener('submit', handleRegisterSubmit);

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  // Category Tabs
  document.querySelectorAll('.cat-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sfx.click();
      document.querySelectorAll('.cat-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.category;
      if (cat === 'FREE_ONLY') {
        STATE.selectedCategory = 'ALL';
        STATE.freeOnlyActive = true;
      } else {
        STATE.freeOnlyActive = false;
        STATE.selectedCategory = cat;
      }
      renderApp();
    });
  });

  // Tag Chips
  document.querySelectorAll('.tag-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      sfx.click();
      document.querySelectorAll('.tag-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.selectedTag = btn.dataset.tag;
      renderApp();
    });
  });

  // Big BO'SH Toggle Button
  const freeToggleBtn = document.getElementById('filter-free-only-btn');
  if (freeToggleBtn) {
    freeToggleBtn.addEventListener('click', () => {
      sfx.click();
      STATE.freeOnlyActive = !STATE.freeOnlyActive;
      freeToggleBtn.classList.toggle('active', STATE.freeOnlyActive);

      document.querySelectorAll('.status-pill-btn').forEach(b => {
        if (STATE.freeOnlyActive) {
          b.classList.toggle('active', b.dataset.status === 'free');
        } else {
          b.classList.toggle('active', b.dataset.status === 'ALL');
        }
      });

      renderApp();
    });
  }

  // Status Pills
  document.querySelectorAll('.status-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sfx.click();
      document.querySelectorAll('.status-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.selectedStatus = btn.dataset.status;
      STATE.freeOnlyActive = (btn.dataset.status === 'free');
      if (freeToggleBtn) freeToggleBtn.classList.toggle('active', STATE.freeOnlyActive);
      renderApp();
    });
  });

  // Search Input
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      STATE.searchQuery = e.target.value.trim();
      if (clearSearchBtn) clearSearchBtn.classList.toggle('hidden', STATE.searchQuery.length === 0);
      renderApp();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      sfx.click();
      if (searchInput) searchInput.value = '';
      STATE.searchQuery = '';
      clearSearchBtn.classList.add('hidden');
      renderApp();
    });
  }

  // Admin Actions
  const addAccountBtn = document.getElementById('add-account-btn');
  if (addAccountBtn) {
    addAccountBtn.addEventListener('click', () => openEditAccountModal(null));
  }

  const resetDefaultsBtn = document.getElementById('reset-defaults-btn');
  if (resetDefaultsBtn) {
    resetDefaultsBtn.addEventListener('click', handleResetDefaults);
  }

  const adminAccountForm = document.getElementById('admin-account-form');
  if (adminAccountForm) {
    adminAccountForm.addEventListener('submit', handleAdminAccountSubmit);
  }

  // Audio Toggle
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      STATE.soundEnabled = !STATE.soundEnabled;
      localStorage.setItem(STORAGE_KEYS.SOUND, STATE.soundEnabled);
      updateAudioIcon();
      sfx.click();
      showToast(STATE.soundEnabled ? "Ovoz effektlari yoqildi" : "Ovoz effektlari o'chirildi", 'info');
    });
  }

  // QR Modal
  const qrModalBtn = document.getElementById('qr-modal-btn');
  if (qrModalBtn) {
    qrModalBtn.addEventListener('click', () => {
      sfx.click();
      const loc = window.location;
      const url = `${loc.protocol}//${loc.hostname}:${loc.port || '5173'}`;
      const localIpUrl = document.getElementById('local-ip-url');
      if (localIpUrl) localIpUrl.value = url;
      const qrModal = document.getElementById('qr-modal');
      if (qrModal) qrModal.classList.remove('hidden');
    });
  }


  // Global ESC key listener to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(modal => {
        modal.classList.add('hidden');
      });
    }
  });

  // Global backdrop click listener
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
        modal.classList.add('hidden');
      }
    });
  });
}

function initializeApplication() {
  loadStoredData();
  startSplashScreen();
  bindApplicationEvents();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApplication);
} else {
  initializeApplication();
}


