from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Text
from pydantic import BaseModel
from typing import List, Optional
from fastapi import HTTPException

from database import engine, SessionLocal, Base

class BookModel(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    author = Column(String, index=True)
    genre = Column(String, index=True)
    notes = Column(Text, nullable=True)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Biblioscape API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class BookCreate(BaseModel):
    title: str
    author: str
    genre: str
    notes: Optional[str] = ""

class BookResponse(BookCreate):
    id: int

    class Config:
        from_attributes = True

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to Biblioscape API with SQLite! 📚"}

@app.get("/books", response_model=List[BookResponse])
def get_books(
    genre: Optional[str] = None, 
    author: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    query = db.query(BookModel)
    
    if genre:
        query = query.filter(BookModel.genre.ilike(f"%{genre}%"))
        
    if author:
        query = query.filter(BookModel.author.ilike(f"%{author}%"))
        
    books = query.all()
    return books

@app.post("/books", response_model=BookResponse)
def add_book(book: BookCreate, db: Session = Depends(get_db)):
    db_book = BookModel(
        title=book.title,
        author=book.author,
        genre=book.genre,
        notes=book.notes
    )
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

@app.put("/books/{book_id}")
def update_book(book_id: int, updated_book: BookCreate, db: Session = Depends(get_db)):
    book = db.query(BookModel).filter(BookModel.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    book.title = updated_book.title
    book.author = updated_book.author
    book.genre = updated_book.genre
    book.notes = updated_book.notes
    
    db.commit()
    db.refresh(book)
    return book

@app.get("/books/stats")
def get_book_stats(db: Session = Depends(get_db)):
    total_books = db.query(BookModel).count()
    
    books = db.query(BookModel).all()
    
    genres_count = {}
    for book in books:
        genre = book.genre
        if genre in genres_count:
            genres_count[genre] += 1
        else:
            genres_count[genre] = 1
            
    return {
        "total_books": total_books,
        "genres_breakdown": genres_count
    }
