from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Text
from pydantic import BaseModel
from typing import List, Optional

# ۱. ایمپورت تنظیمات پایگاه داده
from database import engine, SessionLocal, Base

# ۲. تعریف مدل دیتابیس (جدول books)
class BookModel(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    author = Column(String, index=True)
    genre = Column(String, index=True)
    notes = Column(Text, nullable=True)

# ۳. ساخت جدول در دیتابیس
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Biblioscape API", version="2.0.0")

# تنظیمات CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# مدل‌های Pydantic برای اعتبارسنجی داده‌ها
class BookCreate(BaseModel):
    title: str
    author: str
    genre: str
    notes: Optional[str] = ""

class BookResponse(BookCreate):
    id: int

    class Config:
        from_attributes = True

# وابستگی (Dependency) برای مدیریت Session دیتابیس
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to Biblioscape API with SQLite! 📚"}

# دریافت لیست کتاب‌ها همراه با قابلیت فیلتر بر اساس ژانر و نویسنده (Query Parameters)
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

@app.delete("/books/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db)):
    db_book = db.query(BookModel).filter(BookModel.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    db.delete(db_book)
    db.commit()
    return {"message": f"Book with id {book_id} deleted successfully."}
