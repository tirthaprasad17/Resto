// ❗️ PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE
const firebaseConfig = {
  apiKey: "AIzaSyAm6B7oSBlFR1uN9jOXEbSeARLJk_0_ho8",
  authDomain: "myrestaurantmenu-8f6fd.firebaseapp.com",
  projectId: "myrestaurantmenu-8f6fd",
  storageBucket: "myrestaurantmenu-8f6fd.firebasestorage.app",
  messagingSenderId: "100842702438",
  appId: "1:100842702438:web:f9baeaf4c6e49fa9310fa7"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- DOM Elements ---
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');
const messageArea = document.getElementById('message-area');

// --- Tab Switching Logic ---
loginTab.addEventListener('click', () => {
    loginTab.classList.add('border-blue-500', 'text-blue-500');
    loginTab.classList.remove('text-gray-500');
    signupTab.classList.remove('border-green-500', 'text-green-500');
    signupTab.classList.add('text-gray-500');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
});

signupTab.addEventListener('click', () => {
    signupTab.classList.add('border-green-500', 'text-green-500');
    signupTab.classList.remove('text-gray-500');
    loginTab.classList.remove('border-blue-500', 'text-blue-500');
    loginTab.classList.add('text-gray-500');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
});

// --- Show Message ---
const showMessage = (message, isError = true) => {
    messageArea.textContent = message;
    messageArea.classList.toggle('bg-red-500', isError);
    messageArea.classList.toggle('bg-green-500', !isError);
    messageArea.classList.remove('hidden');
    setTimeout(() => {
        messageArea.classList.add('hidden');
    }, 3000);
};

// --- Signup Handler ---
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((cred) => {
            // By default, every new user is a 'customer'.
            // Roles must be changed manually in the Firestore console for security.
            return db.collection('users').doc(cred.user.uid).set({
                email: email,
                role: 'customer'
            });
        })
        .then(() => {
            showMessage("Account created! Redirecting...", false);
            setTimeout(() => window.location.href = 'customer.html', 1500);
        })
        .catch((err) => showMessage(err.message));
});

// --- Login Handler ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then((cred) => {
            // After successful login, get the user's role from Firestore
            return db.collection('users').doc(cred.user.uid).get();
        })
        .then((doc) => {
            if (doc.exists) {
                const role = doc.data().role;
                showMessage("Login successful! Redirecting...", false);
                // REDIRECT BASED ON ROLE
                if (role === 'admin') {
                    setTimeout(() => window.location.href = 'admin.html', 1000);
                } else if (role === 'waiter') {
                    setTimeout(() => window.location.href = 'waiter.html', 1000);
                } else { // Customer or any other role
                    setTimeout(() => window.location.href = 'customer.html', 1000);
                }
            } else {
                throw new Error("User data not found. Please contact support.");
            }
        })
        .catch((err) => showMessage(err.message));
});
