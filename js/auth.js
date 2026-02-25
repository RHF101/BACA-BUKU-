// js/auth.js
import { auth, db } from './firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { ref, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

// Fungsi ini dipanggil di halaman yang butuh auth (login.html, index.html, dll.)
export function initAuth() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const message = document.getElementById('auth-message');
    const logoutBtn = document.getElementById('logout-btn');

    if (loginForm) {
        loginForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            signInWithEmailAndPassword(auth, email, password)
                .then(() => {
                    message.style.color = 'green';
                    message.textContent = 'Login berhasil! Mengarahkan...';
                    setTimeout(() => location.href = 'index.html', 1500);
                })
                .catch(err => {
                    message.style.color = 'red';
                    message.textContent = err.code === 'auth/wrong-password' ? 'Password salah' :
                                          err.code === 'auth/user-not-found' ? 'Akun tidak ditemukan' :
                                          'Error: ' + err.message;
                });
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            const name = document.getElementById('name').value.trim();

            if (!name) {
                message.style.color = 'red';
                message.textContent = 'Masukkan nama lengkap';
                return;
            }

            createUserWithEmailAndPassword(auth, email, password)
                .then(cred => {
                    set(ref(db, 'users/' + cred.user.uid), {
                        name,
                        email,
                        role: 'user',
                        purchasedBooks: {},
                        createdAt: serverTimestamp()
                    });
                    message.style.color = 'green';
                    message.textContent = 'Akun berhasil dibuat! Silakan login.';
                })
                .catch(err => {
                    message.style.color = 'red';
                    message.textContent = err.code === 'auth/email-already-in-use' ? 'Email sudah terdaftar' :
                                          err.code === 'auth/weak-password' ? 'Password minimal 6 karakter' :
                                          'Error: ' + err.message;
                });
        });
    }

    // Logout jika ada tombol
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => location.href = 'login.html');
        });
    }

    // Pantau status login (untuk navbar di semua halaman)
    onAuthStateChanged(auth, user => {
        const loginLink = document.getElementById('login-link');
        const logoutLink = document.getElementById('logout-link');
        if (user) {
            if (loginLink) loginLink.style.display = 'none';
            if (logoutLink) logoutLink.style.display = 'inline';
        } else {
            if (loginLink) loginLink.style.display = 'inline';
            if (logoutLink) logoutLink.style.display = 'none';
        }
    });
}
