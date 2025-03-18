const express = require('express');
const db = require("../config/db");
const router = express.Router();

// Word list v backendu
const wordList = [
  { word: "1984", hint: "Dystopický román George Orwella." },
  { word: "tolkien", hint: "Autor Pána prstenů." },
  { word: "dune", hint: "Sci-fi klasika Franka Herberta." },
  { word: "gatsby", hint: "Slavný román o americkém snu." },
  { word: "twilight", hint: "Upíří romantika pro teenagery." },
  { word: "sherlock", hint: "Nejznámější detektiv všech dob." },
  { word: "dracula", hint: "Klasický horor od Brama Stokera." },
  { word: "hamlet", hint: "Tragédie od Williama Shakespeara." },
  { word: "potter", hint: "Čaroděj s jizvou na čele." },
  { word: "verne", hint: "Francouzský autor sci-fi románů." }
];

// Funkce pro výběr denního slova podle data
const getDailyWord = () => {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const wordIndex = dayOfYear % wordList.length;
  return wordList[wordIndex];
};

// Endpoint pro kontrolu, zda uživatel může dnes hrát a získání denního slova
router.get("/daily-challenge", async (req, res) => {
  const user = req.cookies.user;

  if (!user || !user.id) {
    return res.status(401).json({ error: "Uživatel není přihlášen." });
  }

  try {
    // Získáme datum poslední hry uživatele
    const result = await db.query(
      "SELECT last_played_at FROM users WHERE id = $1",
      [user.id]
    );
    
    const lastPlayedAt = result.rows[0]?.last_played_at;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    let canPlay = true;
    let nextPlayDate = null;
    
    if (lastPlayedAt) {
      const lastPlayedDate = new Date(lastPlayedAt).toISOString().split('T')[0];
      canPlay = lastPlayedDate !== today;
      
      if (!canPlay) {
        // Pokud dnes už hrál, nastavíme čas příští hry
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        nextPlayDate = tomorrow.toISOString();
      }
    }
    
    // Vrátíme informace o denní výzvě
    const dailyWord = getDailyWord();
    
    res.status(200).json({
      canPlay,
      nextPlayDate,
      // Vrátíme slovo jen pokud může hrát
      wordData: canPlay ? dailyWord : null
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Chyba při kontrole denní výzvy." });
  }
});

// Záznam prohry (bez přidání bodů)
router.post("/record-loss", async (req, res) => {
  const user = req.cookies.user;

  if (!user || !user.id) {
    return res.status(401).json({ error: "Uživatel není přihlášen." });
  }

  try {
    // Jen aktualizujeme čas poslední hry
    await db.query(
      "UPDATE users SET last_played_at = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    );

    res.status(200).json({ message: "Prohra zaznamenána." });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Chyba při záznamu prohry." });
  }
});

router.post("/add-points", async (req, res) => {
  console.log("Cookies received:", req.cookies);

  const user = req.cookies.user;

  if (!user || !user.id) {
    console.error("User not authenticated");
    return res.status(401).json({ error: "Uživatel není přihlášen." });
  }

  const pointsToAdd = 5; // Body za výhru

  try {
    // Přičtení bodů a aktualizace času poslední hry
    const updatedUser = await db.query(
      "UPDATE users SET points = points + $1, last_played_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING points",
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

router.get("/profile", async (req, res) => {
  console.log("Cookies received:", req.cookies);

  const user = req.cookies.user;

  if (!user || !user.id) {
    console.error("User not authenticated");
    return res.status(401).json({ error: "Uživatel není přihlášen." });
  }

  try {
    // Načteme rank a body přihlášeného uživatele
    const userData = await db.query(
      "SELECT username, points, rank FROM users WHERE id = $1",
      [user.id]
    );

    if (userData.rows.length === 0) {
      return res.status(404).json({ error: "Uživatel nenalezen." });
    }

    console.log("User profile fetched:", userData.rows[0]);
    res.status(200).json(userData.rows[0]);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Chyba při získávání profilu." });
  }
});

module.exports = router;