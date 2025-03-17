const express = require("express");
const router = express.Router();
const cors = require("cors");



// Get all events
router.get("/", async (req, res) => {
  try {
    const result = await req.db.query(
      "SELECT events.*, users.username FROM events JOIN users ON events.user_id = users.id ORDER BY event_date DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Chyba při načítání událostí." });
  }
});

// Create new event
router.post("/", async (req, res) => {
  const { title, description, eventDate, location, userId } = req.body;

  if (!title || !description || !eventDate || !location || !userId) {
    return res.status(400).json({ error: "Všechna pole jsou povinná." });
  }

  try {
    const result = await req.db.query(
      "INSERT INTO events (title, description, event_date, location, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [title, description, eventDate, location, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Chyba při vytváření události." });
  }
});

module.exports = router;

