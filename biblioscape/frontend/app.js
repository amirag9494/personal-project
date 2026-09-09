const API_URL = "http://127.0.0.1:8000";

// دریافت و نمایش کتاب‌ها از API
async function fetchBooks() {
    try {
        const response = await fetch(`${API_URL}/books`);
        const books = await response.json();
        renderBooks(books);
    } catch (error) {
        console.error("Error fetching books (Make sure FastAPI is running):", error);
    }
}

// رندر کردن لیست کتاب‌ها در صفحه
function renderBooks(books) {
    const container = document.getElementById("books-container");
    container.innerHTML = "";

    if (books.length === 0) {
        container.innerHTML = "<p>Your bookshelf is empty.</p>";
        return;
    }

    books.forEach(book => {
        const bookEl = document.createElement("div");
        bookEl.classList.add("book-item");
        bookEl.innerHTML = `
            <h3>${book.title} <span style="font-size: 0.8rem; color: #a8a095;">(${book.genre})</span></h3>
            <p>Author: ${book.author}</p>
            ${book.notes ? `<p style="margin-top: 5px; font-style: italic;">"${book.notes}"</p>` : ""}
            <button onclick="deleteBook(${book.id})" style="margin-top: 8px; background: #a83232; color: #fff; padding: 2px 6px; font-size: 0.75rem; border:none; border-radius:3px; cursor:pointer;">Delete</button>
        `;
        container.appendChild(bookEl);
    });
}

// ثبت کتاب جدید از طریق متد POST در API
document.getElementById("book-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const newBook = {
        title: document.getElementById("title").value,
        author: document.getElementById("author").value,
        genre: document.getElementById("genre").value,
        notes: document.getElementById("notes").value
    };

    try {
        const response = await fetch(`${API_URL}/books`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newBook)
        });

        if (response.ok) {
            document.getElementById("book-form").reset();
            fetchBooks();
        }
    } catch (error) {
        console.error("Error adding book:", error);
    }
});

// حذف کتاب از طریق متد DELETE در API
async function deleteBook(id) {
    try {
        const response = await fetch(`${API_URL}/books/${id}`, {
            method: "DELETE"
        });

        if (response.ok) {
            fetchBooks();
        }
    } catch (error) {
        console.error("Error deleting book:", error);
    }
}

// اجرای اولیه هنگام لود صفحه
fetchBooks();