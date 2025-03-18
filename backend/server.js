require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require('axios');

const authRoutes = require("./routes/auth");
const booksRoutes = require("./routes/books");
const reviewsRoutes = require("./routes/reviews");
const postsRoutes = require("./routes/posts");
const userBooksRoutes = require("./routes/userBooks");
const messagesRoutes = require("./routes/messages");
const userRoutes = require("./routes/users");
const rankRoutes = require("./routes/rank");
const friendsRoutes = require("./routes/friends");


const pool = require("./config/db");
const app = express();
const cookieParser = require("cookie-parser");

app.use(
  cors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600
  })
);

// Middleware pro parsování JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser()); 
app.use((req, res, next) => {
  req.db = pool; 
  next();
});

// Připojení routerů
app.use("/api/auth", authRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/user-books", userBooksRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rank", rankRoutes);
app.use("/api/friends", friendsRoutes);

// Spuštění serveru
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server běží na portu ${PORT}`);
});

// Testování připojení k databázi
async function testConnection() {
  console.log("Testování připojení k databázi...");

  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Úspěšné připojení k databázi:", result.rows[0]);
  } catch (error) {
    console.error("Chyba při připojení k databázi:", error);
  }
}

testConnection();





