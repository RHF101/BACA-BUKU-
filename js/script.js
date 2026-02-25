// js/script.js (for user side, adapted to RTDB)
let currentAudio = null;

// Auth State
onAuthStateChanged(auth, user => {
    if (user) {
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'block';
        get(ref(db, `users/${user.uid}/role`)).then(snapshot => {
            if (snapshot.val() === 'admin') {
                document.getElementById('admin-link').style.display = 'block';
            }
        });
    } else {
        document.getElementById('login-btn').style.display = 'block';
        document.getElementById('logout-btn').style.display = 'none';
        document.getElementById('admin-link').style.display = 'none';
    }
});

// Login/Register
document.getElementById('login-submit').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    signInWithEmailAndPassword(auth, email, password).catch(err => console.error(err));
});

document.getElementById('register-submit').addEventListener('click', () => {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    createUserWithEmailAndPassword(auth, email, password).then(cred => {
        set(ref(db, `users/${cred.user.uid}`), {
            name,
            email,
            role: 'user',
            purchasedBooks: {},
            createdAt: serverTimestamp()
        });
    }).catch(err => console.error(err));
});

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

// Settings Panel
const settingsIcon = document.getElementById('settings-icon');
const settingsPanel = document.getElementById('settings-panel');
settingsIcon.addEventListener('click', () => settingsPanel.classList.toggle('open'));

const fontSizeSelect = document.getElementById('font-size');
const focusModeCheckbox = document.getElementById('focus-mode');
const soundToggle = document.getElementById('background-sound-toggle');
const soundChoice = document.getElementById('sound-choice');
const volumeSlider = document.getElementById('volume-slider');
const soundOptions = document.getElementById('sound-options');

function applySettings() {
    document.body.className = '';
    const fontSize = localStorage.getItem('fontSize') || 'medium';
    document.body.classList.add(`font-${fontSize}`);
    fontSizeSelect.value = fontSize;

    const focusMode = localStorage.getItem('focusMode') === 'true';
    if (focusMode) document.body.classList.add('focus-mode');
    focusModeCheckbox.checked = focusMode;

    const soundOn = localStorage.getItem('soundOn') === 'true';
    soundToggle.checked = soundOn;
    soundOptions.style.display = soundOn ? 'block' : 'none';

    const choice = localStorage.getItem('soundChoice') || 'morning-birds';
    soundChoice.value = choice;

    const volume = localStorage.getItem('volume') || 50;
    volumeSlider.value = volume;

    updateAudio(volume / 100, choice, soundOn);
}

fontSizeSelect.addEventListener('change', e => {
    localStorage.setItem('fontSize', e.target.value);
    applySettings();
});

focusModeCheckbox.addEventListener('change', e => {
    localStorage.setItem('focusMode', e.target.checked);
    applySettings();
});

soundToggle.addEventListener('change', e => {
    localStorage.setItem('soundOn', e.target.checked);
    soundOptions.style.display = e.target.checked ? 'block' : 'none';
    applySettings();
});

soundChoice.addEventListener('change', e => {
    localStorage.setItem('soundChoice', e.target.value);
    applySettings();
});

volumeSlider.addEventListener('input', e => {
    localStorage.setItem('volume', e.target.value);
    applySettings();
});

// Audio fade in/out (simple volume ramp)
function updateAudio(volume, choice, play) {
    if (currentAudio) {
        // Fade out
        const fadeOut = setInterval(() => {
            if (currentAudio.volume > 0) {
                currentAudio.volume = Math.max(0, currentAudio.volume - 0.1);
            } else {
                clearInterval(fadeOut);
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }
        }, 200);
    }
    if (play) {
        currentAudio = document.getElementById(choice);
        currentAudio.volume = 0;
        currentAudio.play().then(() => {
            // Fade in
            const fadeIn = setInterval(() => {
                if (currentAudio.volume < volume) {
                    currentAudio.volume = Math.min(volume, currentAudio.volume + 0.1);
                } else {
                    clearInterval(fadeIn);
                }
            }, 200);
        }).catch(err => console.error('Audio play error', err));
    }
}

// Modal
const modal = document.getElementById('login-modal');
document.querySelector('.close').addEventListener('click', () => modal.style.display = 'none');
document.getElementById('login-btn').addEventListener('click', () => modal.style.display = 'block');

// Page Specific Logic
if (location.pathname.endsWith('index.html') || location.pathname === '/') {
    loadBooks();
}

async function loadBooks() {
    const freeGrid = document.querySelector('#free-collection .grid');
    const premiumGrid = document.querySelector('#premium-collection .grid');

    const snapshot = await get(ref(db, 'books'));
    const books = snapshot.val() || {};
    Object.entries(books).forEach(([id, data]) => {
        if (data.status !== 'published') return;
        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = `
            <img src="${data.coverURL}" alt="Cover">
            <h3>${data.title}</h3>
            <p>${data.author}</p>
        `;
        if (data.category === 'gratis') {
            card.innerHTML += '<span class="label">Gratis</span><button onclick="location.href=\'read.html?id=' + id + '\'">Baca</button>';
            freeGrid.appendChild(card);
        } else {
            card.innerHTML += `<p>Harga: ${data.price}</p><button onclick="location.href=\'detail.html?id=' + id + '\'">Lihat Detail</button>`;
            premiumGrid.appendChild(card);
        }
    });
}

if (location.pathname.endsWith('detail.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');
    loadDetail(bookId);
}

async function loadDetail(bookId) {
    const snapshot = await get(ref(db, `books/${bookId}`));
    const data = snapshot.val();
    if (data) {
        document.getElementById('cover').src = data.coverURL;
        document.getElementById('title').textContent = data.title;
        document.getElementById('author').textContent = data.author;
        document.getElementById('price').textContent = data.category === 'premium' ? `Harga: ${data.price}` : '';
        document.getElementById('description').textContent = data.content.substring(0, 200) + '...';

        const btn = document.getElementById('action-btn');
        if (data.category === 'gratis') {
            btn.textContent = 'Baca Sekarang';
            btn.onclick = () => location.href = `read.html?id=${bookId}`;
        } else {
            const user = auth.currentUser;
            if (!user) {
                btn.textContent = 'Login untuk Membeli';
                btn.onclick = () => document.getElementById('login-modal').style.display = 'block';
            } else {
                const userSnapshot = await get(ref(db, `users/${user.uid}/purchasedBooks`));
                const purchased = userSnapshot.val() || {};
                if (purchased[bookId]) {
                    btn.textContent = 'Baca Sekarang';
                    btn.onclick = () => location.href = `read.html?id=${bookId}`;
                } else {
                    btn.textContent = 'Beli Buku';
                    btn.onclick = () => alert('Instruksi pembayaran manual: Transfer ke [rekening admin], kirim bukti ke admin@email.com. Admin akan konfirmasi.');
                }
            }
        }
    }
}

if (location.pathname.endsWith('read.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');
    loadContent(bookId);
}

async function loadContent(bookId) {
    const snapshot = await get(ref(db, `books/${bookId}`));
    const data = snapshot.val();
    if (data) {
        if (data.category === 'gratis') {
            document.getElementById('content').innerHTML = data.content;
        } else {
            const user = auth.currentUser;
            if (user) {
                const userSnapshot = await get(ref(db, `users/${user.uid}/purchasedBooks`));
                const purchased = userSnapshot.val() || {};
                if (purchased[bookId]) {
                    document.getElementById('content').innerHTML = data.content;
                } else {
                    location.href = `detail.html?id=${bookId}`;
                }
            } else {
                location.href = `detail.html?id=${bookId}`;
            }
        }
    }
}

// Init settings
applySettings();
