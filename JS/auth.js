/* ============================================
   TYPEFLOW - Authentication Module
   ============================================ */

// ============================================
// FIREBASE CONFIGURATION
// ============================================
// Note: Replace these with your actual Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyD-PLACEHOLDER-KEY",
    authDomain: "typeflow-app.firebaseapp.com",
    projectId: "typeflow-app",
    storageBucket: "typeflow-app.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// ============================================
// INITIALIZE FIREBASE (if available)
// ============================================
let auth = null;
let db = null;
let firebaseAvailable = false;

try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        firebaseAvailable = true;
        console.log('Firebase initialized successfully');
    }
} catch (e) {
    console.log('Firebase not available, running in demo mode');
}

// ============================================
// AUTH STATE OBSERVER
// ============================================
if (firebaseAvailable && auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            const userData = {
                uid: user.uid,
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                avatar: user.photoURL || '',
                isGoogle: user.providerData.some(p => p.providerId === 'google.com'),
            };
            
            window.AppState.currentUser = userData;
            updateAuthUIWithFirebase(userData);
            
            // Save to localStorage
            localStorage.setItem('typeflow_user', JSON.stringify(userData));
            
            // Load user data from Firestore
            loadUserFirestoreData(user.uid);
            
        } else {
            // User is signed out
            window.AppState.currentUser = null;
            updateAuthUIWithFirebase(null);
            localStorage.removeItem('typeflow_user');
        }
    });
}

// ============================================
// FIREBASE AUTH METHODS
// ============================================

// Email/Password Login
async function firebaseLogin(email, password, rememberMe = false) {
    try {
        if (!auth) throw new Error('Firebase not initialized');
        
        const persistence = rememberMe 
            ? firebase.auth.Auth.Persistence.LOCAL 
            : firebase.auth.Auth.Persistence.SESSION;
        
        await auth.setPersistence(persistence);
        const result = await auth.signInWithEmailAndPassword(email, password);
        
        return {
            success: true,
            user: result.user,
        };
    } catch (error) {
        return {
            success: false,
            error: getFirebaseErrorMessage(error.code),
        };
    }
}

// Email/Password Signup
async function firebaseSignup(name, email, password) {
    try {
        if (!auth) throw new Error('Firebase not initialized');
        
        const result = await auth.createUserWithEmailAndPassword(email, password);
        
        // Update profile with name
        await result.user.updateProfile({
            displayName: name,
        });
        
        // Create user document in Firestore
        if (db) {
            await db.collection('users').doc(result.user.uid).set({
                name: name,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                totalTests: 0,
                averageWPM: 0,
                bestWPM: 0,
                averageAccuracy: 0,
                tests: [],
            });
        }
        
        return {
            success: true,
            user: result.user,
        };
    } catch (error) {
        return {
            success: false,
            error: getFirebaseErrorMessage(error.code),
        };
    }
}

// Google Sign-In
async function firebaseGoogleSignIn() {
    try {
        if (!auth) throw new Error('Firebase not initialized');
        
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        
        // Check if new user (create Firestore document)
        if (result.additionalUserInfo.isNewUser && db) {
            await db.collection('users').doc(result.user.uid).set({
                name: result.user.displayName,
                email: result.user.email,
                avatar: result.user.photoURL,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                totalTests: 0,
                averageWPM: 0,
                bestWPM: 0,
                averageAccuracy: 0,
                tests: [],
            });
        }
        
        return {
            success: true,
            user: result.user,
        };
    } catch (error) {
        return {
            success: false,
            error: getFirebaseErrorMessage(error.code),
        };
    }
}

// Logout
async function firebaseLogout() {
    try {
        if (!auth) throw new Error('Firebase not initialized');
        await auth.signOut();
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: 'Failed to logout',
        };
    }
}

// Password Reset
async function firebaseResetPassword(email) {
    try {
        if (!auth) throw new Error('Firebase not initialized');
        await auth.sendPasswordResetEmail(email);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: getFirebaseErrorMessage(error.code),
        };
    }
}

// ============================================
// FIRESTORE DATA
// ============================================
async function loadUserFirestoreData(uid) {
    if (!db) return;
    
    try {
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
            const data = doc.data();
            // Update profile page with Firestore data
            updateProfileStats(data);
        }
    } catch (e) {
        console.log('Error loading user data:', e);
    }
}

async function saveTestToFirestore(testData) {
    if (!db || !window.AppState.currentUser) return;
    
    try {
        const uid = window.AppState.currentUser.uid;
        const userRef = db.collection('users').doc(uid);
        
        // Add test to tests array
        await userRef.update({
            tests: firebase.firestore.FieldValue.arrayUnion({
                ...testData,
                date: firebase.firestore.FieldValue.serverTimestamp(),
            }),
        });
        
        // Update stats
        const doc = await userRef.get();
        if (doc.exists) {
            const data = doc.data();
            const allTests = data.tests || [];
            allTests.push({ ...testData, date: new Date().toISOString() });
            
            const totalTests = allTests.length;
            const avgWPM = Math.round(allTests.reduce((sum, t) => sum + t.wpm, 0) / totalTests);
            const bestWPM = Math.max(...allTests.map(t => t.wpm));
            const avgAccuracy = Math.round(allTests.reduce((sum, t) => sum + t.accuracy, 0) / totalTests);
            
            await userRef.update({
                totalTests,
                averageWPM: avgWPM,
                bestWPM,
                averageAccuracy: avgAccuracy,
            });
        }
    } catch (e) {
        console.log('Error saving test:', e);
    }
}

async function updateUserProfile(updates) {
    if (!db || !window.AppState.currentUser) return;
    
    try {
        const uid = window.AppState.currentUser.uid;
        await db.collection('users').doc(uid).update(updates);
        
        // Update local state
        if (updates.name) {
            window.AppState.currentUser.name = updates.name;
            localStorage.setItem('typeflow_user', JSON.stringify(window.AppState.currentUser));
            updateAuthUIWithFirebase(window.AppState.currentUser);
        }
        
        return { success: true };
    } catch (e) {
        return { success: false, error: 'Failed to update profile' };
    }
}

async function uploadProfilePhoto(file) {
    if (!firebaseAvailable || !window.AppState.currentUser) return null;
    
    try {
        const storage = firebase.storage();
        const uid = window.AppState.currentUser.uid;
        const ref = storage.ref(`avatars/${uid}`);
        await ref.put(file);
        const url = await ref.getDownloadURL();
        
        // Update auth profile
        await auth.currentUser.updateProfile({ photoURL: url });
        
        // Update Firestore
        await db.collection('users').doc(uid).update({ avatar: url });
        
        return url;
    } catch (e) {
        console.log('Error uploading photo:', e);
        return null;
    }
}

// ============================================
// ERROR MESSAGE HANDLER
// ============================================
function getFirebaseErrorMessage(code) {
    const messages = {
        'auth/email-already-in-use': 'This email is already registered. Please login instead.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/user-not-found': 'No account found with this email. Please sign up.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
        'auth/operation-not-allowed': 'This sign-in method is not enabled.',
        'auth/requires-recent-login': 'Please login again to perform this action.',
    };
    
    return messages[code] || 'An error occurred. Please try again.';
}

// ============================================
// UI UPDATE WITH FIREBASE
// ============================================
function updateAuthUIWithFirebase(userData) {
    const DOM = {
        btnAuth: document.getElementById('btnAuth'),
        userInfo: document.getElementById('userInfo'),
        userAvatar: document.getElementById('userAvatar'),
        userName: document.getElementById('userName'),
        profileName: document.getElementById('profileName'),
        profileEmail: document.getElementById('profileEmail'),
        profileAvatar: document.getElementById('profileAvatar'),
    };
    
    if (userData) {
        DOM.btnAuth.classList.add('hidden');
        DOM.userInfo.classList.remove('hidden');
        DOM.userName.textContent = userData.name;
        
        if (userData.avatar) {
            DOM.userAvatar.src = userData.avatar;
        } else {
            DOM.userAvatar.src = generateDefaultAvatar(userData.name);
        }
        
        // Update profile page
        if (DOM.profileName) DOM.profileName.textContent = userData.name;
        if (DOM.profileEmail) DOM.profileEmail.textContent = userData.email;
        if (DOM.profileAvatar) DOM.profileAvatar.src = userData.avatar || generateDefaultAvatar(userData.name);
        
        // Enable Firebase sync for tests
        window._useFirebaseSync = true;
        
    } else {
        DOM.btnAuth.classList.remove('hidden');
        DOM.userInfo.classList.add('hidden');
        window._useFirebaseSync = false;
    }
}

// ============================================
// DEFAULT AVATAR GENERATOR
// ============================================
function generateDefaultAvatar(name) {
    const initial = name ? name.charAt(0).toUpperCase() : 'U';
    const colors = ['#6c5ce7', '#48bb78', '#f6e05e', '#fc8181', '#63b3ed', '#f687b3'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    return `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="20" fill="${color}"/>
            <text x="20" y="26" text-anchor="middle" fill="white" font-size="18" font-family="Poppins, sans-serif" font-weight="700">${initial}</text>
        </svg>
    `)}`;
}

// ============================================
// AUTH FORM HANDLERS (with Firebase)
// ============================================
async function handleFirebaseLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (!email || !password) {
        window.showToast('Please fill in all fields', 'error');
        return;
    }
    
    const btn = document.getElementById('btnLogin');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    
    const result = await firebaseLogin(email, password, rememberMe);
    
    if (result.success) {
        document.getElementById('authModal').classList.add('hidden');
        window.showToast('Welcome back! 🎉', 'success');
        clearAuthForms();
    } else {
        window.showToast(result.error, 'error');
    }
    
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
}

async function handleFirebaseSignup() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    
    if (!name || !email || !password) {
        window.showToast('Please fill in all fields', 'error');
        return;
    }
    
    if (password.length < 6) {
        window.showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    const btn = document.getElementById('btnSignup');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    
    const result = await firebaseSignup(name, email, password);
    
    if (result.success) {
        document.getElementById('authModal').classList.add('hidden');
        window.showToast('Account created successfully! 🎉', 'success');
        clearAuthForms();
    } else {
        window.showToast(result.error, 'error');
    }
    
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus"></i> Sign Up';
}

async function handleFirebaseGoogleSignIn() {
    const result = await firebaseGoogleSignIn();
    
    if (result.success) {
        document.getElementById('authModal').classList.add('hidden');
        window.showToast('Welcome! 🎉', 'success');
    } else {
        window.showToast(result.error, 'error');
    }
}

function clearAuthForms() {
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('signupName').value = '';
    document.getElementById('signupEmail').value = '';
    document.getElementById('signupPassword').value = '';
}

// ============================================
// OVERRIDE DEFAULT AUTH HANDLERS
// ============================================
// Override the demo handlers from app.js with Firebase handlers
document.addEventListener('DOMContentLoaded', () => {
    // Wait for app.js to load first
    setTimeout(() => {
        const btnLogin = document.getElementById('btnLogin');
        const btnSignup = document.getElementById('btnSignup');
        const btnGoogleLogin = document.getElementById('btnGoogleLogin');
        const btnGoogleSignup = document.getElementById('btnGoogleSignup');
        const btnLogout = document.getElementById('btnLogout');
        
        if (firebaseAvailable) {
            // Replace with Firebase handlers
            if (btnLogin) {
                btnLogin.removeEventListener('click', window._demoLoginHandler);
                btnLogin.addEventListener('click', handleFirebaseLogin);
            }
            if (btnSignup) {
                btnSignup.removeEventListener('click', window._demoSignupHandler);
                btnSignup.addEventListener('click', handleFirebaseSignup);
            }
            if (btnGoogleLogin) {
                btnGoogleLogin.addEventListener('click', handleFirebaseGoogleSignIn);
            }
            if (btnGoogleSignup) {
                btnGoogleSignup.addEventListener('click', handleFirebaseGoogleSignIn);
            }
            if (btnLogout) {
                btnLogout.addEventListener('click', firebaseLogout);
            }
            
            // Add forgot password handler
            const forgotPassword = document.querySelector('.forgot-password');
            if (forgotPassword) {
                forgotPassword.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const email = document.getElementById('loginEmail').value.trim();
                    if (!email) {
                        window.showToast('Please enter your email first', 'info');
                        return;
                    }
                    const result = await firebaseResetPassword(email);
                    if (result.success) {
                        window.showToast('Password reset email sent! Check your inbox.', 'success');
                    } else {
                        window.showToast(result.error, 'error');
                    }
                });
            }
            
            // Add profile photo upload handler
            const btnChangeAvatar = document.getElementById('btnChangeAvatar');
            if (btnChangeAvatar) {
                btnChangeAvatar.addEventListener('click', () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            const url = await uploadProfilePhoto(file);
                            if (url) {
                                window.showToast('Profile photo updated!', 'success');
                                updateAuthUIWithFirebase({
                                    ...window.AppState.currentUser,
                                    avatar: url,
                                });
                            } else {
                                window.showToast('Failed to upload photo', 'error');
                            }
                        }
                    };
                    input.click();
                });
            }
            
            console.log('Firebase auth handlers attached');
        } else {
            console.log('Running in demo mode - Firebase not configured');
        }
    }, 500);
});

// ============================================
// EXPORT FOR OTHER MODULES
// ============================================
window.saveTestToFirestore = saveTestToFirestore;
window.updateUserProfile = updateUserProfile;
window.firebaseAvailable = firebaseAvailable;