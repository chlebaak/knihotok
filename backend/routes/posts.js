const express = require("express");
const router = express.Router();

// Načtení všech příspěvků
router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId;

    let query = `
      SELECT 
        posts.*, 
        users.username, 
        users.profile_picture 
    `;

    if (userId) {
      query += `, 
        (SELECT vote_type FROM votes WHERE user_id = $1 AND post_id = posts.id) AS user_vote
      `;
    }

    query += `
      FROM posts 
      INNER JOIN users ON posts.user_id = users.id 
      ORDER BY posts.created_at DESC
    `;

    const posts = userId
      ? await req.db.query(query, [userId])
      : await req.db.query(query);

    res.json(posts.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Chyba při načítání příspěvků" });
  }
});

// Načtení příspěvků konkrétního uživatele podle ID
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const posts = await req.db.query(
      `SELECT 
        posts.*, 
        users.username, 
        users.profile_picture 
      FROM posts 
      INNER JOIN users ON posts.user_id = users.id 
      WHERE posts.user_id = $1 
      ORDER BY posts.created_at DESC`,
      [userId]
    );

    res.json(posts.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Chyba při načítání příspěvků uživatele" });
  }
});

// Endpoint pro získání počtu komentářů k příspěvku
router.get("/posts/:id/comments/count", async (req, res) => {
  const postId = req.params.id;

  try {
    const result = await req.db.query(
      "SELECT COUNT(*) AS count FROM comments WHERE post_id = ?",
      [postId]
    );

    res.json({ count: result[0].count });
  } catch (error) {
    console.error("Chyba při načítání počtu komentářů:", error);
    res
      .status(500)
      .json({ error: "Chyba serveru při získávání počtu komentářů" });
  }
});

// Přidání nového příspěvku
router.post("/", async (req, res) => {
  const { content, user_id } = req.body;
  if (!content || !user_id) {
    return res.status(400).json({ error: "Chybí obsah nebo ID uživatele" });
  }

  try {
    const result = await req.db.query(
      "INSERT INTO posts (content, user_id, upvotes, downvotes, created_at) VALUES ($1, $2, 0, 0, NOW()) RETURNING *",
      [content, user_id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Chyba při přidávání příspěvku" });
  }
});

// Načtení konkrétního příspěvku podle ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.query.userId;

  try {
    let query = `
      SELECT 
        posts.*, 
        users.username, 
        users.profile_picture 
    `;

    if (userId) {
      query += `, 
        (SELECT vote_type FROM votes WHERE user_id = $1 AND post_id = posts.id) AS user_vote
      `;
    }

    query += `
      FROM posts 
      INNER JOIN users ON posts.user_id = users.id 
      WHERE posts.id = $${userId ? "2" : "1"}
    `;

    const result = userId
      ? await req.db.query(query, [userId, id])
      : await req.db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Příspěvek nebyl nalezen" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Chyba při načítání příspěvku" });
  }
});

// Načtení komentářů k příspěvku včetně informací o uživateli
router.get("/:id/comments", async (req, res) => {
  const { id } = req.params;

  try {
    const comments = await req.db.query(
      `
      SELECT 
        comments.*, 
        users.username, 
        users.profile_picture 
      FROM comments 
      INNER JOIN users ON comments.user_id = users.id 
      WHERE comments.post_id = $1 
      ORDER BY comments.created_at ASC
    `,
      [id]
    );
    res.json(comments.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Chyba při načítání komentářů" });
  }
});

// Přidání komentáře
router.post("/:id/comments", async (req, res) => {
  const { id } = req.params;
  const { content, user_id } = req.body;

  if (!content || !user_id) {
    return res.status(400).json({ error: "Chybí obsah nebo ID uživatele" });
  }

  try {
    const result = await req.db.query(
      "INSERT INTO comments (post_id, user_id, content, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *",
      [id, user_id, content]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Chyba při přidávání komentáře" });
  }
});

router.post("/:id/removeVote", async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(401).json({ error: "Uživatel není přihlášen" });
  }

  try {
    const voteCheck = await req.db.query(
      "SELECT * FROM votes WHERE user_id = $1 AND post_id = $2",
      [user_id, id]
    );

    if (voteCheck.rows.length === 0) {
      return res.status(400).json({ error: "Uživatel nehlasoval" });
    }

    const currentVote = voteCheck.rows[0].vote_type;

    await req.db.query(
      "DELETE FROM votes WHERE user_id = $1 AND post_id = $2",
      [user_id, id]
    );

    if (currentVote === "upvote") {
      await req.db.query(
        "UPDATE posts SET upvotes = upvotes - 1 WHERE id = $1",
        [id]
      );
    } else if (currentVote === "downvote") {
      await req.db.query(
        "UPDATE posts SET downvotes = downvotes - 1 WHERE id = $1",
        [id]
      );
    }

    const updatedPost = await req.db.query(
      "SELECT upvotes, downvotes FROM posts WHERE id = $1",
      [id]
    );

    res.json(updatedPost.rows[0]);
  } catch (error) {
    console.error("Chyba při odebírání hlasu:", error);
    res.status(500).json({ error: "Chyba při odebírání hlasu" });
  }
});

router.post("/:id/upvote", async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(401).json({ error: "Uživatel není přihlášen" });
  }

  try {
    const voteCheck = await req.db.query(
      "SELECT * FROM votes WHERE user_id = $1 AND post_id = $2",
      [user_id, id]
    );

    if (voteCheck.rows.length > 0) {
      if (voteCheck.rows[0].vote_type === "upvote") {
        await req.db.query(
          "DELETE FROM votes WHERE user_id = $1 AND post_id = $2",
          [user_id, id]
        );
        await req.db.query(
          "UPDATE posts SET upvotes = upvotes - 1 WHERE id = $1",
          [id]
        );
      } else {
        await req.db.query(
          "UPDATE posts SET downvotes = downvotes - 1, upvotes = upvotes + 1 WHERE id = $1",
          [id]
        );
        await req.db.query(
          "UPDATE votes SET vote_type = 'upvote' WHERE user_id = $1 AND post_id = $2",
          [user_id, id]
        );
      }
    } else {
      await req.db.query(
        "UPDATE posts SET upvotes = upvotes + 1 WHERE id = $1",
        [id]
      );
      await req.db.query(
        "INSERT INTO votes (user_id, post_id, vote_type) VALUES ($1, $2, 'upvote')",
        [user_id, id]
      );
    }

    const updatedPost = await req.db.query(
      "SELECT upvotes, downvotes FROM posts WHERE id = $1",
      [id]
    );
    res.json(updatedPost.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Chyba při přidávání upvotu" });
  }
});

router.post("/:id/downvote", async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(401).json({ error: "Uživatel není přihlášen" });
  }

  try {
    const voteCheck = await req.db.query(
      "SELECT * FROM votes WHERE user_id = $1 AND post_id = $2",
      [user_id, id]
    );

    if (voteCheck.rows.length > 0) {
      if (voteCheck.rows[0].vote_type === "downvote") {
        await req.db.query(
          "DELETE FROM votes WHERE user_id = $1 AND post_id = $2",
          [user_id, id]
        );
        await req.db.query(
          "UPDATE posts SET downvotes = downvotes - 1 WHERE id = $1",
          [id]
        );
      } else {
        await req.db.query(
          "UPDATE posts SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = $1",
          [id]
        );
        await req.db.query(
          "UPDATE votes SET vote_type = 'downvote' WHERE user_id = $1 AND post_id = $2",
          [user_id, id]
        );
      }
    } else {
      await req.db.query(
        "UPDATE posts SET downvotes = downvotes + 1 WHERE id = $1",
        [id]
      );
      await req.db.query(
        "INSERT INTO votes (user_id, post_id, vote_type) VALUES ($1, $2, 'downvote')",
        [user_id, id]
      );
    }

    const updatedPost = await req.db.query(
      "SELECT upvotes, downvotes FROM posts WHERE id = $1",
      [id]
    );
    res.json(updatedPost.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Chyba při přidávání downvotu" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(401).json({ error: "Uživatel není přihlášen" });
  }

  try {
    // Ověření, zda je uživatel autorem příspěvku
    const postCheck = await req.db.query(
      "SELECT user_id FROM posts WHERE id = $1",
      [id]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: "Příspěvek nebyl nalezen" });
    }

    if (postCheck.rows[0].user_id !== user_id) {
      return res
        .status(403)
        .json({ error: "Nemáte oprávnění smazat tento příspěvek" });
    }

    await req.db.query("DELETE FROM comments WHERE post_id = $1", [id]);

    await req.db.query("DELETE FROM votes WHERE post_id = $1", [id]);

    await req.db.query("DELETE FROM posts WHERE id = $1", [id]);

    res.json({ message: "Příspěvek byl úspěšně smazán" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Chyba při mazání příspěvku" });
  }
});

router.delete("/:id/comments", async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(401).json({ error: "Uživatel není přihlášen" });
  }

  try {
    const commentCheck = await req.db.query(
      "SELECT user_id FROM comments WHERE id = $1",
      [id]
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: "Komentář nebyl nalezen" });
    }

    if (commentCheck.rows[0].user_id !== user_id) {
      return res
        .status(403)
        .json({ error: "Nemáte oprávnění smazat tento komentář" });
    }

    // Smazání komentáře
    await req.db.query("DELETE FROM comments WHERE id = $1", [id]);

    res.json({ message: "Komentář byl úspěšně smazán" });
  } catch (error) {
    console.error("Chyba při mazání komentáře:", error);
    res.status(500).json({ error: "Chyba při mazání komentáře" });
  }
});

module.exports = router;
