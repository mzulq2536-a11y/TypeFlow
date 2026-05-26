/* ============================================
   TYPEFLOW - Main Application Logic
   ============================================ */

// ============================================
// GLOBAL STATE
// ============================================
const AppState = {
    currentPage: 'home',
    currentUser: null,
    isDarkMode: false,
    soundEnabled: true,
    keyboardVisible: true,
    sidebarOpen: false,
};

// ============================================
// DOM ELEMENTS
// ============================================
const DOM = {
    // Sidebar
    sidebar: document.getElementById('sidebar'),
    navItems: document.querySelectorAll('.nav-item'),
    btnAuth: document.getElementById('btnAuth'),
    userInfo: document.getElementById('userInfo'),
    userAvatar: document.getElementById('userAvatar'),
    userName: document.getElementById('userName'),
    btnLogout: document.getElementById('btnLogout'),
    
    // Mobile
    menuToggle: document.getElementById('menuToggle'),
    mobileHeader: document.querySelector('.mobile-header'),
    
    // Pages
    mainContent: document.getElementById('mainContent'),
    pages: document.querySelectorAll('.page'),
    
    // Theme & Sound
    themeToggle: document.getElementById('themeToggle'),
    soundToggle: document.getElementById('soundToggle'),
    
    // Auth Modal
    authModal: document.getElementById('authModal'),
    authModalClose: document.getElementById('authModalClose'),
    loginForm: document.getElementById('loginForm'),
    signupForm: document.getElementById('signupForm'),
    showSignup: document.getElementById('showSignup'),
    showLogin: document.getElementById('showLogin'),
    btnLogin: document.getElementById('btnLogin'),
    btnSignup: document.getElementById('btnSignup'),
    btnGoogleLogin: document.getElementById('btnGoogleLogin'),
    btnGoogleSignup: document.getElementById('btnGoogleSignup'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    signupName: document.getElementById('signupName'),
    signupEmail: document.getElementById('signupEmail'),
    signupPassword: document.getElementById('signupPassword'),
    rememberMe: document.getElementById('rememberMe'),
    
    // Settings
    settingDarkMode: document.getElementById('settingDarkMode'),
    settingSound: document.getElementById('settingSound'),
    settingFontSize: document.getElementById('settingFontSize'),
    settingKeyboard: document.getElementById('settingKeyboard'),
    
    // Confetti
    confettiCanvas: document.getElementById('confettiCanvas'),
    
    // Profile
    profileName: document.getElementById('profileName'),
    profileEmail: document.getElementById('profileEmail'),
    profileAvatar: document.getElementById('profileAvatar'),
    
    // Auth mobile
    btnAuthMobile: document.getElementById('btnAuthMobile'),
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    applyTheme();
    applySoundSetting();
    setupEventListeners();
    checkAuthState();
});

// ============================================
// EVENT LISTENERS SETUP
// ============================================
function setupEventListeners() {
    // Navigation
    DOM.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            navigateTo(page);
        });
    });
    
    // Mobile Menu
    DOM.menuToggle.addEventListener('click', toggleSidebar);
    
    // Close sidebar when clicking overlay
    document.addEventListener('click', (e) => {
        if (AppState.sidebarOpen && 
            !DOM.sidebar.contains(e.target) && 
            e.target !== DOM.menuToggle &&
            !DOM.menuToggle.contains(e.target)) {
            closeSidebar();
        }
    });
    
    // Theme Toggle
    DOM.themeToggle.addEventListener('click', toggleTheme);
    
    // Sound Toggle
    DOM.soundToggle.addEventListener('click', toggleSound);
    
    // Auth Modal
    DOM.btnAuth.addEventListener('click', () => openAuthModal('login'));
    DOM.btnAuthMobile.addEventListener('click', () => openAuthModal('login'));
    DOM.authModalClose.addEventListener('click', closeAuthModal);
    DOM.authModal.addEventListener('click', (e) => {
        if (e.target === DOM.authModal) closeAuthModal();
    });
    
    // Switch between Login/Signup
    DOM.showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthForm('signup');
    });
    DOM.showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthForm('login');
    });
    
    // Auth Buttons
    DOM.btnLogin.addEventListener('click', handleLogin);
    DOM.btnSignup.addEventListener('click', handleSignup);
    DOM.btnGoogleLogin.addEventListener('click', handleGoogleAuth);
    DOM.btnGoogleSignup.addEventListener('click', handleGoogleAuth);
    
    // Logout
    DOM.btnLogout.addEventListener('click', handleLogout);
    
    // Settings
    DOM.settingDarkMode.addEventListener('change', (e) => {
        AppState.isDarkMode = e.target.checked;
        applyTheme();
        saveSettings();
    });
    DOM.settingSound.addEventListener('change', (e) => {
        AppState.soundEnabled = e.target.checked;
        applySoundSetting();
        saveSettings();
    });
    DOM.settingKeyboard.addEventListener('change', (e) => {
        AppState.keyboardVisible = e.target.checked;
        saveSettings();
    });
    DOM.settingFontSize.addEventListener('change', (e) => {
        applyFontSize(e.target.value);
        saveSettings();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// ============================================
// NAVIGATION
// ============================================
function navigateTo(pageName) {
    // Update state
    AppState.currentPage = pageName;
    
    // Update nav items
    DOM.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageName);
    });
    
    // Update pages
    DOM.pages.forEach(page => {
        page.classList.toggle('active', page.id === `page-${pageName}`);
    });
    
    // Close sidebar on mobile
    if (window.innerWidth <= 1024) {
        closeSidebar();
    }
    
    // Scroll to top
    DOM.mainContent.scrollTop = 0;
    
    // Page-specific initialization
    switch(pageName) {
        case 'home':
            initTypingTest();
            break;
        case 'hundred-words':
            initHundredWords();
            break;
        case 'games':
            // Games hub - no special init needed
            break;
        case 'profile':
            loadProfileData();
            break;
        case 'settings':
            syncSettingsToForm();
            break;
    }
}

// ============================================
// SIDEBAR
// ============================================
function toggleSidebar() {
    if (AppState.sidebarOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

function openSidebar() {
    AppState.sidebarOpen = true;
    DOM.sidebar.classList.add('open');
    
    // Create overlay
    if (!document.querySelector('.sidebar-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay active';
        overlay.addEventListener('click', closeSidebar);
        document.body.appendChild(overlay);
    } else {
        document.querySelector('.sidebar-overlay').classList.add('active');
    }
}

function closeSidebar() {
    AppState.sidebarOpen = false;
    DOM.sidebar.classList.remove('open');
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// ============================================
// THEME MANAGEMENT
// ============================================
function toggleTheme() {
    AppState.isDarkMode = !AppState.isDarkMode;
    applyTheme();
    saveSettings();
}

function applyTheme() {
    if (AppState.isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        DOM.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.documentElement.removeAttribute('data-theme');
        DOM.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    DOM.settingDarkMode.checked = AppState.isDarkMode;
}

// ============================================
// SOUND MANAGEMENT
// ============================================
let audioContext = null;
let errorSoundBuffer = null;

function toggleSound() {
    AppState.soundEnabled = !AppState.soundEnabled;
    applySoundSetting();
    saveSettings();
}

function applySoundSetting() {
    if (AppState.soundEnabled) {
        DOM.soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
    } else {
        DOM.soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
    }
    DOM.settingSound.checked = AppState.soundEnabled;
}

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        generateErrorSound();
    }
}

function generateErrorSound() {
    // Generate error buzz sound using Web Audio API
    const duration = 0.15;
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        // Low frequency buzz with decay
        data[i] = Math.sin(2 * Math.PI * 120 * t) * Math.exp(-t * 20) * 0.3;
        // Add some noise
        data[i] += (Math.random() * 2 - 1) * 0.1 * Math.exp(-t * 15);
    }
    
    errorSoundBuffer = buffer;
}

function playErrorSound() {
    if (!AppState.soundEnabled) return;
    
    try {
        initAudioContext();
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        const source = audioContext.createBufferSource();
        source.buffer = errorSoundBuffer;
        source.connect(audioContext.destination);
        source.start(0);
    } catch (e) {
        console.log('Sound not supported');
    }
}

// Make playErrorSound available globally
window.playErrorSound = playErrorSound;

// ============================================
// FONT SIZE
// ============================================
function applyFontSize(size) {
    const typingInputs = document.querySelectorAll('.typing-input');
    const paragraphDisplays = document.querySelectorAll('.paragraph-display');
    
    const sizes = {
        small: '0.95rem',
        medium: '1.1rem',
        large: '1.3rem',
    };
    
    typingInputs.forEach(input => {
        input.style.fontSize = sizes[size] || sizes.medium;
    });
    
    paragraphDisplays.forEach(display => {
        display.style.fontSize = sizes[size] || sizes.medium;
    });
}

// ============================================
// AUTH MODAL
// ============================================
function openAuthModal(formType = 'login') {
    DOM.authModal.classList.remove('hidden');
    showAuthForm(formType);
}

function closeAuthModal() {
    DOM.authModal.classList.add('hidden');
}

function showAuthForm(formType) {
    if (formType === 'login') {
        DOM.loginForm.classList.remove('hidden');
        DOM.signupForm.classList.add('hidden');
    } else {
        DOM.loginForm.classList.add('hidden');
        DOM.signupForm.classList.remove('hidden');
    }
}

// ============================================
// AUTHENTICATION HANDLERS
// ============================================
function handleLogin() {
    const email = DOM.loginEmail.value.trim();
    const password = DOM.loginPassword.value;
    
    if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    // Firebase login
    if (window.firebaseAuth) {
        const { signInWithEmailAndPassword } = window.firebaseAuth;
        // Note: In production, you'll import these properly
        showToast('Login functionality requires Firebase setup', 'info');
    } else {
        // Demo mode - simulate login
        simulateLogin(email);
    }
}

function handleSignup() {
    const name = DOM.signupName.value.trim();
    const email = DOM.signupEmail.value.trim();
    const password = DOM.signupPassword.value;
    
    if (!name || !email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Firebase signup
    if (window.firebaseAuth) {
        showToast('Signup functionality requires Firebase setup', 'info');
    } else {
        // Demo mode - simulate signup
        simulateSignup(name, email);
    }
}

function handleGoogleAuth() {
    if (window.firebaseAuth) {
        showToast('Google login requires Firebase setup', 'info');
    } else {
        showToast('Google login requires Firebase configuration', 'info');
    }
}

function handleLogout() {
    AppState.currentUser = null;
    updateAuthUI();
    showToast('Logged out successfully', 'success');
}

// Demo Auth (for testing without Firebase)
function simulateLogin(email) {
    AppState.currentUser = {
        name: email.split('@')[0],
        email: email,
        avatar: '',
    };
    updateAuthUI();
    closeAuthModal();
    showToast('Welcome back! (Demo Mode)', 'success');
}

function simulateSignup(name, email) {
    AppState.currentUser = {
        name: name,
        email: email,
        avatar: '',
    };
    updateAuthUI();
    closeAuthModal();
    showToast('Account created! (Demo Mode)', 'success');
}

function checkAuthState() {
    // Check localStorage for saved user
    const savedUser = localStorage.getItem('typeflow_user');
    if (savedUser) {
        try {
            AppState.currentUser = JSON.parse(savedUser);
        } catch(e) {
            AppState.currentUser = null;
        }
    }
    updateAuthUI();
}

function updateAuthUI() {
    if (AppState.currentUser) {
        DOM.btnAuth.classList.add('hidden');
        DOM.userInfo.classList.remove('hidden');
        DOM.userName.textContent = AppState.currentUser.name;
        if (AppState.currentUser.avatar) {
            DOM.userAvatar.src = AppState.currentUser.avatar;
        } else {
            DOM.userAvatar.src = 'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="18" fill="#6c5ce7"/>
                    <text x="18" y="22" text-anchor="middle" fill="white" font-size="16" font-family="Poppins">${AppState.currentUser.name.charAt(0).toUpperCase()}</text>
                </svg>
            `);
        }
        
        // Update profile page
        if (DOM.profileName) DOM.profileName.textContent = AppState.currentUser.name;
        if (DOM.profileEmail) DOM.profileEmail.textContent = AppState.currentUser.email;
        if (DOM.profileAvatar) DOM.profileAvatar.src = DOM.userAvatar.src;
        
        // Save to localStorage
        localStorage.setItem('typeflow_user', JSON.stringify(AppState.currentUser));
    } else {
        DOM.btnAuth.classList.remove('hidden');
        DOM.userInfo.classList.add('hidden');
        localStorage.removeItem('typeflow_user');
    }
}

// ============================================
// SETTINGS PERSISTENCE
// ============================================
function saveSettings() {
    const settings = {
        isDarkMode: AppState.isDarkMode,
        soundEnabled: AppState.soundEnabled,
        keyboardVisible: AppState.keyboardVisible,
        fontSize: DOM.settingFontSize.value,
    };
    localStorage.setItem('typeflow_settings', JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem('typeflow_settings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            AppState.isDarkMode = settings.isDarkMode || false;
            AppState.soundEnabled = settings.soundEnabled !== false;
            AppState.keyboardVisible = settings.keyboardVisible !== false;
            if (settings.fontSize) {
                applyFontSize(settings.fontSize);
                DOM.settingFontSize.value = settings.fontSize;
            }
        } catch(e) {
            // Use defaults
        }
    }
}

function syncSettingsToForm() {
    DOM.settingDarkMode.checked = AppState.isDarkMode;
    DOM.settingSound.checked = AppState.soundEnabled;
    DOM.settingKeyboard.checked = AppState.keyboardVisible;
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Style the toast
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        padding: '14px 20px',
        borderRadius: '12px',
        background: type === 'success' ? '#48bb78' : type === 'error' ? '#fc8181' : '#6c5ce7',
        color: '#ffffff',
        fontWeight: '600',
        fontSize: '0.9rem',
        fontFamily: "'Poppins', sans-serif",
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
        zIndex: '400',
        animation: 'slideUp 0.3s ease',
        maxWidth: '400px',
    });
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// CONFETTI
// ============================================
function triggerConfetti() {
    const canvas = DOM.confettiCanvas;
    canvas.classList.remove('hidden');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const ctx = canvas.getContext('2d');
    const particles = [];
    const colors = ['#6c5ce7', '#a78bfa', '#48bb78', '#f6e05e', '#fc8181', '#63b3ed'];
    
    // Create particles
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            w: Math.random() * 10 + 5,
            h: Math.random() * 6 + 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedY: Math.random() * 3 + 2,
            speedX: Math.random() * 2 - 1,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 10 - 5,
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let allDone = true;
        
        particles.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += p.rotationSpeed;
            
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
            ctx.restore();
            
            if (p.y < canvas.height + 50) {
                allDone = false;
            }
        });
        
        if (!allDone) {
            requestAnimationFrame(animate);
        } else {
            canvas.classList.add('hidden');
        }
    }
    
    animate();
}

// Make confetti available globally
window.triggerConfetti = triggerConfetti;

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
function handleKeyboardShortcuts(e) {
    // Ctrl+Shift+T - New typing test
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        navigateTo('home');
        if (typeof resetTest === 'function') resetTest();
    }
    
    // Ctrl+Shift+H - Go to 100 Words
    if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        navigateTo('hundred-words');
    }
    
    // Ctrl+Shift+G - Go to Games
    if (e.ctrlKey && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        navigateTo('games');
    }
    
    // Escape - Close modals
    if (e.key === 'Escape') {
        closeAuthModal();
        const resultsModal = document.getElementById('resultsModal');
        if (resultsModal) resultsModal.classList.add('hidden');
    }
}

// ============================================
// RESPONSIVE HANDLING
// ============================================
window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
        closeSidebar();
    }
});

// ============================================
// EXPORT FOR OTHER MODULES
// ============================================
window.AppState = AppState;
window.showToast = showToast;
window.navigateTo = navigateTo;