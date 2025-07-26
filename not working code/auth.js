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

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const errorMsg = document.getElementById('error-message');

// --- Show Error/Success Message ---
const showMessage = (message, isError = true) => {
    errorMsg.textContent = message;
    errorMsg.classList.remove('hidden');
    errorMsg.classList.toggle('bg-red-500', isError);
    errorMsg.classList.toggle('bg-green-500', !isError);
    setTimeout(() => {
        errorMsg.classList.add('hidden');
    }, 3000);
};

// --- Signup ---
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((cred) => {
            // Create a user document in Firestore with 'customer' role
            return db.collection('users').doc(cred.user.uid).set({
                email: email,
                role: 'customer'
            });
        })
        .then(() => {
            showMessage("Account created! You are now logged in.", false);
            signupForm.reset();
            // Redirect to customer menu after a short delay
            setTimeout(() => window.location.href = 'menu.html', 1500);
        })
        .catch((err) => {
            showMessage(err.message);
        });
});

// --- Login ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then((cred) => {
            // Check user's role
            return db.collection('users').doc(cred.user.uid).get();
        })
        .then((doc) => {
            if (doc.exists) {
                const role = doc.data().role;
                showMessage("Login successful!", false);
                // Redirect based on role
                if (role === 'admin' || role === 'waiter') {
                    setTimeout(() => window.location.href = 'index.html', 1000);
                } else {
                    setTimeout(() => window.location.href = 'menu.html', 1000);
                }
            } else {
                throw new Error("User data not found.");
            }
        })
        .catch((err) => {
            showMessage(err.message);
        });
});