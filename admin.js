// js/admin.js (adapted to RTDB)
onAuthStateChanged(auth, user => {
    if (!user) return location.href = 'index.html';
    get(ref(db, `users/${user.uid}/role`)).then(snapshot => {
        if (snapshot.val() !== 'admin') location.href = 'index.html';
    });
    loadDashboard();
    loadBooksList();
    loadUsersList();
});

async function loadDashboard() {
    let totalUsers = 0, totalBooks = 0, totalGratis = 0, totalPremium = 0;
    const usersSnapshot = await get(ref(db, 'users'));
    totalUsers = Object.keys(usersSnapshot.val() || {}).length;
    document.getElementById('total-users').textContent = totalUsers;

    const booksSnapshot = await get(ref(db, 'books'));
    const books = booksSnapshot.val() || {};
    totalBooks = Object.keys(books).length;
    Object.values(books).forEach(book => {
        if (book.category === 'gratis') totalGratis++;
        else if (book.category === 'premium') totalPremium++;
    });
    document.getElementById('total-books').textContent = totalBooks;
    document.getElementById('total-gratis').textContent = totalGratis;
    document.getElementById('total-premium').textContent = totalPremium;
}

const bookForm = document.getElementById('book-form');
bookForm.addEventListener('submit', async e => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const category = document.getElementById('category').value;
    const price = category === 'premium' ? parseFloat(document.getElementById('price').value) : 0;
    const status = document.getElementById('status').value;
    const featured = document.getElementById('featured').checked;
    const content = document.getElementById('content').value;
    const file = document.getElementById('cover').files[0];

    if (file) {
        const sRef = storageRef(storage, `covers/${file.name}`);
        await uploadBytes(sRef, file);
        const coverURL = await getDownloadURL(sRef);

        const newRef = push(ref(db, 'books'));
        await set(newRef, {
            title, author, category, price, content, coverURL, status, featured,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        alert('Buku ditambahkan');
        bookForm.reset();
    }
});

document.getElementById('category').addEventListener('change', e => {
    document.getElementById('price').disabled = e.target.value !== 'premium';
});

async function loadBooksList() {
    const list = document.getElementById('books-list');
    list.innerHTML = '';
    const snapshot = await get(ref(db, 'books'));
    const books = snapshot.val() || {};
    Object.entries(books).forEach(([id, data]) => {
        const div = document.createElement('div');
        div.innerHTML = `\( {data.title} <button onclick="editBook(' \){id}')">Edit</button> <button onclick="deleteBook('${id}')">Hapus</button>`;
        list.appendChild(div);
    });
}

async function deleteBook(id) {
    if (confirm('Yakin hapus?')) {
        await remove(ref(db, `books/${id}`));
        loadBooksList();
    }
}

async function editBook(id) {
    // Simple prompt-based edit for brevity; can expand to form
    const snapshot = await get(ref(db, `books/${id}`));
    const data = snapshot.val();
    if (!data) return;

    const newTitle = prompt('Judul baru:', data.title);
    const newAuthor = prompt('Penulis baru:', data.author);
    const newCategory = prompt('Kategori (gratis/premium):', data.category);
    const newPrice = newCategory === 'premium' ? parseFloat(prompt('Harga baru:', data.price)) : 0;
    const newStatus = prompt('Status (draft/published):', data.status);
    const newFeatured = confirm('Featured?');
    const newContent = prompt('Isi baru:', data.content);

    // For cover upload, skip or add file input if needed
    await update(ref(db, `books/${id}`), {
        title: newTitle,
        author: newAuthor,
        category: newCategory,
        price: newPrice,
        status: newStatus,
        featured: newFeatured,
        content: newContent,
        updatedAt: serverTimestamp()
    });
    alert('Buku diupdate');
    loadBooksList();
}

async function loadUsersList() {
    const list = document.getElementById('users-list');
    list.innerHTML = '';
    const snapshot = await get(ref(db, 'users'));
    const users = snapshot.val() || {};
    Object.entries(users).forEach(([uid, data]) => {
        const purchased = Object.keys(data.purchasedBooks || {}).join(', ');
        const div = document.createElement('div');
        div.innerHTML = `${data.email} (Purchased: \( {purchased}) <button onclick="addPurchase(' \){uid}')">Tambah Pembelian</button> <button onclick="deleteUser('\( {uid}')">Hapus</button> <button onclick="toggleRole(' \){uid}', '${data.role}')">Ubah Role</button>`;
        list.appendChild(div);
    });
}

async function addPurchase(uid) {
    const bookId = prompt('Masukkan bookId untuk ditambahkan:');
    if (bookId) {
        await update(ref(db, `users/\( {uid}/purchasedBooks/ \){bookId}`), true);
        loadUsersList();
    }
}

async function deleteUser(uid) {
    if (confirm('Yakin hapus user?')) {
        await remove(ref(db, `users/${uid}`));
        loadUsersList();
    }
}

async function toggleRole(uid, current) {
    const newRole = current === 'admin' ? 'user' : 'admin';
    await update(ref(db, `users/${uid}`), { role: newRole });
    loadUsersList();
      }
