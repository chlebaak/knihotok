const express = require('express');
const db = require("../config/db");
const router = express.Router();

router.post("/add-points", async (req, res) => {
    console.log("Cookies received:", req.cookies);
  
    const user = req.cookies.user; // Ověření uživatele
  
    if (!user || !user.id) {
      console.error("User not authenticated");
      return res.status(401).json({ error: "Uživatel není přihlášen." });
    }
  
    const pointsToAdd = 5; // Body za výhru
  
    try {
      // Přičtení bodů (rank se nastaví triggerem v DB)
      const updatedUser = await db.query(
        "UPDATE users SET points = points + $1 WHERE id = $2 RETURNING points",
        [pointsToAdd, user.id]
      );
  
      console.log("Updated points:", updatedUser.rows[0]);
  
      res.status(200).json({
        message: "Body přidány!",
        newPoints: updatedUser.rows[0].points,
      });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Chyba při aktualizaci bodů." });
    }
});

module.exports = router;