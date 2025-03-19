const express = require("express");
const router = express.Router();

const getUserFromCookies = (req) => {
  if (!req.cookies || !req.cookies.user) {
    return null;
  }
  return req.cookies.user;
};

const checkAuth = (req, res, next) => {
  const user = getUserFromCookies(req);
  if (!user || !user.id) {
    return res.status(401).json({ error: "Není přihlášen žádný uživatel" });
  }
  req.user = user;
  next();
};

router.get("/", checkAuth, async (req, res) => {
  const { id: userId } = req.user;
  const db = req.db;

  try {
    const friends = await db.query(
      `
      SELECT 
        u.id, u.username, u.email, u.profile_picture, u.created_at,
        CASE
          WHEN f.sender_id = $1 THEN 'sent'
          WHEN f.receiver_id = $2 THEN 'received'
        END AS type,
        f.created_at AS friendship_date
      FROM friendships f
      JOIN users u ON (f.sender_id = $3 AND f.receiver_id = u.id) OR (f.receiver_id = $4 AND f.sender_id = u.id)
      WHERE f.status = 'accepted'
      ORDER BY u.username ASC
    `,
      [userId, userId, userId, userId]
    );

    res.json({ friends: friends.rows });
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ error: "Chyba při načítání přátel" });
  }
});

router.get("/requests", checkAuth, async (req, res) => {
  const { id: userId } = req.user;
  const db = req.db;

  try {
    const requests = await db.query(
      `
      SELECT 
        u.id, u.username, u.email, u.profile_picture, u.created_at,
        f.created_at AS request_date
      FROM friendships f
      JOIN users u ON f.sender_id = u.id
      WHERE f.receiver_id = $1 AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `,
      [userId]
    );

    res.json({ requests: requests.rows });
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    res.status(500).json({ error: "Chyba při načítání žádostí o přátelství" });
  }
});

router.get("/search", checkAuth, async (req, res) => {
  const { query } = req.query;
  const { id: userId } = req.user;
  const db = req.db;

  if (!query || query.length < 2) {
    return res
      .status(400)
      .json({ error: "Vyhledávací dotaz musí mít alespoň 2 znaky" });
  }

  try {
    const users = await db.query(
      `
      SELECT id, username, email, profile_picture
      FROM users
      WHERE username ILIKE $1 AND id != $2
      AND id NOT IN (
        SELECT 
          CASE WHEN sender_id = $3 THEN receiver_id ELSE sender_id END
        FROM friendships 
        WHERE (sender_id = $4 OR receiver_id = $5)
        AND (status = 'accepted' OR status = 'pending')
      )
      LIMIT 10
    `,
      [`%${query}%`, userId, userId, userId, userId]
    );

    res.json({ users: users.rows });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Chyba při vyhledávání uživatelů" });
  }
});

router.post("/request", checkAuth, async (req, res) => {
  const { receiverId } = req.body;
  const { id: senderId } = req.user;
  const db = req.db;

  if (!receiverId) {
    return res.status(400).json({ error: "ID příjemce je povinné" });
  }

  try {
    const userExists = await db.query("SELECT id FROM users WHERE id = $1", [
      receiverId,
    ]);

    if (userExists.rows.length === 0) {
      return res.status(404).json({ error: "Uživatel nebyl nalezen" });
    }

    const existingFriendship = await db.query(
      `
      SELECT * FROM friendships
      WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $3 AND receiver_id = $4)
    `,
      [senderId, receiverId, receiverId, senderId]
    );

    if (existingFriendship.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Žádost o přátelství již existuje" });
    }

    // Create new friendship request
    await db.query(
      `
      INSERT INTO friendships (sender_id, receiver_id, status, created_at)
      VALUES ($1, $2, 'pending', NOW())
    `,
      [senderId, receiverId]
    );

    res.status(201).json({ message: "Žádost o přátelství byla odeslána" });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({ error: "Chyba při odesílání žádosti o přátelství" });
  }
});

router.put("/accept/:requestId", checkAuth, async (req, res) => {
  const { requestId } = req.params;
  const { id: userId } = req.user;
  const db = req.db;

  try {
    const friendship = await db.query(
      `
      SELECT * FROM friendships
      WHERE receiver_id = $1 AND sender_id = $2 AND status = 'pending'
    `,
      [userId, requestId]
    );

    if (friendship.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Žádost o přátelství nebyla nalezena" });
    }

    await db.query(
      `
      UPDATE friendships
      SET status = 'accepted', updated_at = NOW()
      WHERE receiver_id = $1 AND sender_id = $2
    `,
      [userId, requestId]
    );

    res.json({ message: "Žádost o přátelství byla přijata" });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    res.status(500).json({ error: "Chyba při přijímání žádosti o přátelství" });
  }
});

router.delete("/reject/:requestId", checkAuth, async (req, res) => {
  const { requestId } = req.params;
  const { id: userId } = req.user;
  const db = req.db;

  try {
    const result = await db.query(
      `
      DELETE FROM friendships
      WHERE receiver_id = $1 AND sender_id = $2 AND status = 'pending'
      RETURNING id
    `,
      [userId, requestId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Žádost o přátelství nebyla nalezena" });
    }

    res.json({ message: "Žádost o přátelství byla odmítnuta" });
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    res.status(500).json({ error: "Chyba při odmítání žádosti o přátelství" });
  }
});

router.delete("/:friendId", checkAuth, async (req, res) => {
  const { friendId } = req.params;
  const { id: userId } = req.user;
  const db = req.db;

  try {
    const result = await db.query(
      `
      DELETE FROM friendships
      WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $3 AND receiver_id = $4)
      RETURNING id
    `,
      [userId, friendId, friendId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Přátelství nebylo nalezeno" });
    }

    res.json({ message: "Přátelství bylo odstraněno" });
  } catch (error) {
    console.error("Error removing friend:", error);
    res.status(500).json({ error: "Chyba při odstraňování přátelství" });
  }
});

module.exports = router;
