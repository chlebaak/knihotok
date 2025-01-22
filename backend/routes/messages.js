const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Middleware pro ověřování přihlášení uživatele
router.use((req, res, next) => {
  if (!req.cookies || !req.cookies.user) {
    return res.status(401).json({ error: "Uživatel není přihlášen." });
  }
  next();
});

// 1. Získání seznamu uživatelů (pro vyhledávání)
router.get("/users", async (req, res) => {
  const { search } = req.query;

  try {
    const users = await pool.query(
      "SELECT id, username, profile_picture FROM users WHERE username ILIKE $1 LIMIT 10",
      [`%${search}%`]
    );
    res.json(users.rows);
  } catch (error) {
    console.error("Chyba při získávání uživatelů:", error);
    res.status(500).json({ error: "Chyba při získávání uživatelů." });
  }
});

// 2. Získání posledních chatů
router.get("/recent-chats", async (req, res) => {
  const userId = req.cookies.user.id;

  try {
    const chats = await pool.query(
      `
      SELECT DISTINCT ON (u.id) u.id, u.username, u.profile_picture, m.sent_at
      FROM users u
      JOIN messages m ON (u.id = m.sender_id OR u.id = m.receiver_id)
      WHERE m.sender_id = $1 OR m.receiver_id = $1
      ORDER BY u.id, m.sent_at DESC
      `,
      [userId]
    );
    res.json(chats.rows);
  } catch (error) {
    console.error("Chyba při získávání posledních chatů:", error);
    res.status(500).json({ error: "Chyba při získávání posledních chatů." });
  }
});

// 3. Získání zpráv mezi dvěma uživateli
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.cookies.user.id;

  try {
    const messages = await pool.query(
      `
      SELECT sender_id, receiver_id, content, sent_at
      FROM messages
      WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY sent_at
      `,
      [currentUserId, userId]
    );
    res.json(messages.rows);
  } catch (error) {
    console.error("Chyba při získávání zpráv:", error);
    res.status(500).json({ error: "Chyba při získávání zpráv." });
  }
});

// 4. Odeslání nové zprávy
router.post("/", async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.cookies.user.id;

  if (!content || content.trim() === "") {
    return res.status(400).json({ error: "Obsah zprávy nemůže být prázdný." });
  }

  try {
    await pool.query(
      `
      INSERT INTO messages (sender_id, receiver_id, content, sent_at)
      VALUES ($1, $2, $3, NOW())
      `,
      [senderId, receiverId, content]
    );
    res.status(201).json({ message: "Zpráva byla odeslána." });
  } catch (error) {
    console.error("Chyba při odesílání zprávy:", error);
    res.status(500).json({ error: "Chyba při odesílání zprávy." });
  }
});

module.exports = router;
