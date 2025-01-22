const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Endpoint pro získání uživatele podle ID
router.get("/:id", async (req, res) => {
  const userId = req.params.id;

  if (!userId || isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    console.log(`Fetching user with ID: ${userId}`);

    const query =
      "SELECT id, username, profile_picture, description FROM users WHERE id = $1";
    const { rows } = await db.query(query, [userId]);

    if (rows.length === 0) {
      console.log(`User with ID ${userId} not found.`);
      return res.status(404).json({ error: "User not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
