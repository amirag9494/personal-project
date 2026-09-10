from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Biblioscape API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Book(BaseModel):
    id: Optional[int] = None
    title: str
    author: str
    genre: str
    notes: Optional[str] = ""

fake_db_books = [
    {"id": 1, "title": "1984", "author": "George Orwell", "genre": "Dystopian", "notes": "A masterpiece on totalitarianism."},
    {"id": 2, "title": "The Great Gatsby", "author": "F. Scott Fitzgerald", "genre": "Classic", "notes": "The American dream illusion."}
]

@app.get("/")
def read_root():
    return {"message": "Welcome to Biblioscape API! 📚"}

@app.get("/books", response_model=List[Book])
def get_books():
    return fake_db_books

@app.post("/books", response_model=Book)
def add_book(book: Book):
    new_id = max((b["id"] for b in fake_db_books), default=0) + 1
    book.id = new_id
    fake_db_books.append(book.model_dump()) 
    return book

@app.delete("/books/{book_id}")
def delete_book(book_id: int):
    global fake_db_books
    initial_length = len(fake_db_books)
    fake_db_books = [b for b in fake_db_books if b["id"] != book_id]
    if len(fake_db_books) == initial_length:
        raise HTTPException(status_code=404, detail="Book not found")
    return {"message": f"Book with id {book_id} deleted successfully."}
