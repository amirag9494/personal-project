const API_URL = "http://127.0.0.1:8000";

let editingBookId = null;

const switcherButton = document.getElementById("theme-switcher-button");
const dropdown = document.getElementById("theme-dropdown");
const statusEl = document.getElementById("status");
const themeItems = document.querySelectorAll("[role='menuitem']");

const themes = [
  { name: "dark", message: "Switched to Dark theme!" },
  { name: "light", message: "Switched to Light theme!" }
];

switcherButton.addEventListener("click", () => {
  const isHidden = dropdown.hasAttribute("hidden");
  if (isHidden) {
    dropdown.removeAttribute("hidden");
    switcherButton.setAttribute("aria-expanded", "true");
  } else {
    dropdown.setAttribute("hidden", "");
    switcherButton.setAttribute("aria-expanded", "false");
  }
});

themeItems.forEach(item => {
  item.addEventListener("click", () => {
    const themeName = item.textContent.toLowerCase();
    
    themes.forEach(t => {
      document.body.classList.remove(`theme-${t.name}`);
    });

    document.body.classList.add(`theme-${themeName}`);

    const selectedTheme = themes.find(t => t.name === themeName);
    if (selectedTheme) {
      statusEl.textContent = selectedTheme.message;
    }

    dropdown.setAttribute("hidden", "");
    switcherButton.setAttribute("aria-expanded", "false");
  });
});

async function fetchBooks() {
    const genreValue = document.getElementById("genre-input").value.trim();
    const authorValue = document.getElementById("author-input").value.trim();

    let url = `${API_URL}/books?`;
    const params = [];

    if (genreValue) {
        params.push(`genre=${encodeURIComponent(genreValue)}`);
    }
    if (authorValue) {
        params.push(`author=${encodeURIComponent(authorValue)}`);
    }

    if (params.length > 0) {
        url += params.join("&");
    } else {
        url = `${API_URL}/books`;
    }

    try {
        const response = await fetch(url);
        const books = await response.json();
        displayBooks(books);
    } catch (error) {
        console.error("Error fetching books:", error);
    }
}

function displayBooks(books) {
    const bookList = document.getElementById("book-list");
    bookList.innerHTML = "";

    if (books.length === 0) {
        bookList.innerHTML = "<li>No books found.</li>";
        return;
    }

    books.forEach(book => {
        const li = document.createElement("li");
        li.innerHTML = `
            <strong>${book.title}</strong> by ${book.author} 
            <em>(${book.genre})</em>
            <p>${book.notes || ""}</p>
            <div style="margin-top: 8px; display: flex; gap: 8px;">
                <button class="edit-btn" style="background-color: #457b9d; color: white; width: auto; padding: 6px 12px; margin-bottom: 0;">Edit</button>
                <button class="delete-btn" style="background-color: #e63946; color: white; width: auto; padding: 6px 12px; margin-bottom: 0;">Delete</button>
            </div>
        `;

        li.querySelector(".edit-btn").addEventListener("click", () => {
            document.getElementById("title").value = book.title;
            document.getElementById("author").value = book.author;
            document.getElementById("genre").value = book.genre;
            document.getElementById("notes").value = book.notes || "";
            
            editingBookId = book.id;
            document.querySelector("#book-form button[type='submit']").textContent = "Update Book";
        });

        li.querySelector(".delete-btn").addEventListener("click", () => {
            deleteBook(book.id);
        });

        bookList.appendChild(li);
    });
}

async function fetchStats() {
    try {
        const response = await fetch(`${API_URL}/books/stats`);
        const stats = await response.json();

        document.getElementById("total-books").textContent = stats.total_books;

        const genresContainer = document.getElementById("genres-breakdown");
        genresContainer.innerHTML = "";

        for (const [genre, count] of Object.entries(stats.genres_breakdown)) {
            const p = document.createElement("p");
            p.textContent = `${genre}: ${count}`;
            genresContainer.appendChild(p);
        }
    } catch (error) {
        console.error("Error fetching stats:", error);
    }
}

document.getElementById("book-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const bookData = {
        title: document.getElementById("title").value,
        author: document.getElementById("author").value,
        genre: document.getElementById("genre").value,
        notes: document.getElementById("notes").value
    };

    try {
        let response;
        if (editingBookId !== null) {
            response = await fetch(`${API_URL}/books/${editingBookId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bookData)
            });
            editingBookId = null;
            document.querySelector("#book-form button[type='submit']").textContent = "Add Book";
        } else {
            response = await fetch(`${API_URL}/books`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bookData)
            });
        }

        if (response.ok) {
            document.getElementById("book-form").reset();
            fetchBooks(); 
            fetchStats(); 
        }
    } catch (error) {
        console.error("Error saving book:", error);
    }
});

async function deleteBook(id) {
    try {
        const response = await fetch(`${API_URL}/books/${id}`, {
            method: "DELETE"
        });

        if (response.ok) {
            fetchBooks(); 
            fetchStats(); 
        }
    } catch (error) {
        console.error("Error deleting book:", error);
    }
}

document.getElementById("search-btn").addEventListener("click", fetchBooks);

fetchBooks();
fetchStats();
