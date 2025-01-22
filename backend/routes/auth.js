const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const pool = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();

// Middleware for CORS
router.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Helper funkce pro validaci emailu
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper funkce pro validaci hesla
const isValidPassword = (password) => {
  return password.length >= 6;
};

// Registrace
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Všechna pole jsou povinná." });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Neplatný formát e-mailu." });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({ error: "Heslo musí mít alespoň 6 znaků." });
  }

  try {
    const emailCheck = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (emailCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Uživatel s tímto emailem již existuje." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password, created_at) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
       RETURNING id, username, email`,
      [username, email, hashedPassword]
    );

    res
      .status(201)
      .json({ message: "Registrace byla úspěšná.", user: result.rows[0] });
  } catch (error) {
    console.error("Chyba při registraci:", error);
    res.status(500).json({ error: "Chyba serveru při registraci." });
  }
});

// Přihlášení
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  console.log("Login request body:", req.body);

  if (!email || !password) {
    return res.status(400).json({ error: "Všechna pole jsou povinná." });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Neplatný formát e-mailu." });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({ error: "Heslo musí mít alespoň 6 znaků." });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      console.error("Email neexistuje:", email);
      return res.status(401).json({ error: "Neplatný email nebo heslo." });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.error("Neplatné heslo pro email:", email);
      return res.status(401).json({ error: "Neplatný email nebo heslo." });
    }

    // Nastavení cookies s údaji o uživateli
    res.cookie(
      "user",
      {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
      },
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 3600000, // 1 hodina
      }
    );

    console.log("Uživatel úspěšně přihlášen:", user.email);
    res.status(200).json({ message: "Přihlášení bylo úspěšné." });
  } catch (error) {
    console.error("Chyba při přihlášení:", error);
    res.status(500).json({ error: "Chyba serveru." });
  }
});

// Odhlášení
router.post("/logout", (req, res) => {
  res.clearCookie("user");
  res.status(200).json({ message: "Odhlášení bylo úspěšné." });
});

// Nastavení Multer pro nahrávání obrázků
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(
      __dirname,
      "..",
      "..",
      "frontend",
      "src",
      "assets",
      "profilePics"
    );

    console.log(uploadPath); // Ověření výsledné cesty

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true }); // Vytvoří složku, pokud neexistuje
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Middleware pro kontrolu přihlášení
const authenticateUser = (req, res, next) => {
  const user = req.cookies.user;
  if (!user) {
    return res.status(401).json({ error: "Uživatel není přihlášen." });
  }
  req.user = user;
  next();
};

// Endpoint pro získání profilu
router.get("/profile", (req, res) => {
  console.log("Cookies received:", req.cookies);

  const user = req.cookies.user;

  if (!user) {
    console.error("User not authenticated");
    return res.status(401).json({ error: "Uživatel není přihlášen." });
  }

  console.log("User profile fetched:", user);
  res.status(200).json(user);
});

router.put(
  "/profile/:id",
  upload.single("profile_picture"),
  async (req, res) => {
    const userFromCookies = req.cookies.user;
    const { id } = req.params;

    if (!userFromCookies || parseInt(userFromCookies.id) !== parseInt(id)) {
      return res
        .status(403)
        .json({ error: "Nemáte oprávnění upravit tento profil." });
    }

    const { username, description } = req.body;

    try {
      // Načtení aktuálních uživatelských dat
      const userResult = await pool.query(
        "SELECT profile_picture FROM users WHERE id = $1",
        [id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "Uživatel nenalezen." });
      }

      // Použití aktuálního profilového obrázku, pokud nebyl nahrán nový
      let profilePicturePath = userResult.rows[0].profile_picture;

      if (req.file) {
        profilePicturePath = `/src/assets/profilePics/${req.file.filename}`;
      }

      // Kontrola, zda nové uživatelské jméno již neexistuje
      const usernameCheck = await pool.query(
        "SELECT id FROM users WHERE username = $1 AND id != $2",
        [username, id]
      );
      if (usernameCheck.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Uživatelské jméno je již obsazeno." });
      }

      // Aktualizace profilu v databázi
      const { rows } = await pool.query(
        `UPDATE users 
       SET username = $1, description = $2, profile_picture = $3 
       WHERE id = $4 RETURNING *`,
        [username, description, profilePicturePath, id]
      );

      res.json(rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Chyba serveru při aktualizaci profilu." });
    }
  }
);

router.get("/profile/:id", async (req, res) => {
  const userFromCookies = req.cookies.user;
  const { id } = req.params;

  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Profil nenalezen." });
    }

    const profile = rows[0];
    const canEdit =
      userFromCookies && parseInt(userFromCookies.id) === parseInt(id);

    res.status(200).json({ profile, canEdit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Chyba serveru." });
  }
});

module.exports = router;
