const express = require("express");
const pool = require("../config/db");
const router = express.Router();

//Nepoužívá se

const authenticateUser = (req, res, next) => {
  const user = req.cookies.user;
  if (!user) {
    return res.status(401).json({ error: "Uživatel není přihlášen." });
  }
  req.user = user;
  next();
};

router.post("/", authenticateUser, async (req, res) => {
  const { googleBooksId, title, author, coverUrl, rating, comment } = req.body;

  if (!googleBooksId || !title || !author || !rating) {
    return res.status(400).json({ error: "Chybí požadovaná pole." });
  }

  try {
    const bookResult = await pool.query(
      "SELECT id FROM books WHERE google_books_id = $1",
      [googleBooksId]
    );

    let bookId;
    if (bookResult.rows.length > 0) {
      bookId = bookResult.rows[0].id;
    } else {
      const newBook = await pool.query(
        `INSERT INTO books (google_books_id, title, author, cover_url) 
                 VALUES ($1, $2, $3, $4) 
                 RETURNING id`,
        [googleBooksId, title, author, coverUrl]
      );
      bookId = newBook.rows[0].id;
    }

    const review = await pool.query(
      `INSERT INTO reviews (user_id, book_id, rating, comment) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
      [req.user.id, bookId, rating, comment]
    );

    res
      .status(201)
      .json({ message: "Recenze přidána.", review: review.rows[0] });
  } catch (error) {
    console.error("Chyba při přidávání recenze:", error);
    res.status(500).json({ error: "Chyba serveru." });
  }
});
router.get("/:googleBooksId", async (req, res) => {
  const { googleBooksId } = req.params;

  try {
    const book = await pool.query(
      "SELECT * FROM books WHERE google_books_id = $1",
      [googleBooksId]
    );

    if (book.rows.length === 0) {
      return res.json([]);
    }

    const reviews = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.username 
             FROM reviews r 
             JOIN users u ON r.user_id = u.id 
             WHERE r.book_id = $1`,
      [book.rows[0].id]
    );

    res.json(reviews.rows);
  } catch (error) {
    console.error("Chyba při získávání recenzí:", error);
    res.status(500).json({ error: "Chyba serveru." });
  }
});

module.exports = router;
