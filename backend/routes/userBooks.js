const express = require("express");
const router = express.Router();

// Přidání knihy do seznamu
router.post("/", async (req, res) => {
  const { userId, bookId, listType, title, author, coverUrl } = req.body;

  if (!userId || !bookId || !listType || !title || !author) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const bookCheck = await req.db.query(
      "SELECT * FROM books WHERE google_books_id = $1",
      [bookId]
    );

    if (bookCheck.rows.length === 0) {
      await req.db.query(
        "INSERT INTO books (google_books_id, title, author, cover_url) VALUES ($1, $2, $3, $4)",
        [bookId, title, author, coverUrl]
      );
    }

    await req.db.query(
      "INSERT INTO user_books (user_id, book_id, list_type) VALUES ($1, $2, $3)",
      [userId, bookId, listType]
    );

    res.status(201).json({ message: "Book added to the list." });
  } catch (error) {
    console.error("Error adding book to list:", error);
    res.status(500).json({ message: "Error adding book to the list." });
  }
});

// Odebrání knihy ze seznamu
router.delete("/", async (req, res) => {
  const { userId, bookId, listType } = req.body;

  if (!userId || !bookId || !listType) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    await req.db.query(
      "DELETE FROM user_books WHERE user_id = $1 AND book_id = $2 AND list_type = $3",
      [userId, bookId, listType]
    );

    res.status(200).json({ message: "Book removed from the list." });
  } catch (error) {
    console.error("Error removing book from list:", error);
    res.status(500).json({ message: "Error removing book from the list." });
  }
});

// Kontrola stavu knihy
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const favoriteCheck = await req.db.query(
      "SELECT * FROM user_books WHERE user_id = $1 AND book_id = $2 AND list_type = 'favorite'",
      [userId, id]
    );

    const toreadCheck = await req.db.query(
      "SELECT * FROM user_books WHERE user_id = $1 AND book_id = $2 AND list_type = 'toread'",
      [userId, id]
    );

    res.json({
      favorite: favoriteCheck.rows.length > 0,
      toread: toreadCheck.rows.length > 0,
    });
  } catch (error) {
    console.error("Error checking book status:", error);
    res.status(500).json({ message: "Error checking book status." });
  }
});

router.get("/profile/:id/books", async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await req.db.query(
      `SELECT ub.list_type, b.google_books_id, b.title, b.author, b.cover_url 
             FROM user_books ub 
             JOIN books b ON ub.book_id = b.google_books_id
             WHERE ub.user_id = $1`,
      [id]
    );

    const favorites = rows.filter((row) => row.list_type === "favorite");
    const toread = rows.filter((row) => row.list_type === "toread");

    res.json({ favorites, toread });
  } catch (error) {
    console.error("Error fetching user books:", error);
    res.status(500).json({ error: "Chyba při načítání knih uživatele." });
  }
});

router.delete("/profile/:id/books", async (req, res) => {
  const { userId, bookId, listType } = req.body;

  try {
    const result = await req.db.query(
      "DELETE FROM user_books WHERE user_id = $1 AND book_id = $2 AND list_type = $3",
      [userId, bookId, listType]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Kniha nebyla nalezena v seznamu." });
    }

    res
      .status(200)
      .json({ message: "Kniha byla úspěšně odebrána ze seznamu." });
  } catch (error) {
    console.error("Error removing book from list:", error);
    res.status(500).json({ error: "Chyba při odebírání knihy." });
  }
});

router.get("/:userId/:bookId", async (req, res) => {
  const { userId, bookId } = req.params;

  try {
    const favoriteCheck = await req.db.query(
      "SELECT * FROM user_books WHERE user_id = $1 AND book_id = $2 AND list_type = 'favorite'",
      [userId, bookId]
    );

    const toreadCheck = await req.db.query(
      "SELECT * FROM user_books WHERE user_id = $1 AND book_id = $2 AND list_type = 'toread'",
      [userId, bookId]
    );

    res.json({
      favorite: favoriteCheck.rows.length > 0,
      toread: toreadCheck.rows.length > 0,
    });
  } catch (error) {
    console.error("Error checking book status:", error);
    res.status(500).json({ message: "Error checking book status." });
  }
});

module.exports = router;
