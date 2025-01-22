const express = require("express");
const axios = require("axios");
const router = express.Router();

// Google Books API Base URL
const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";

router.get("/search", async (req, res) => {
  const { query, type = "title", limit = 10 } = req.query;

  if (!query || query.length < 3) {
    return res
      .status(400)
      .json({ message: "Query must be at least 3 characters long" });
  }

  try {
    const formattedQuery =
      type === "author" ? `inauthor:${query}` : `intitle:${query}`;
    const response = await axios.get(GOOGLE_BOOKS_API, {
      params: {
        q: formattedQuery,
        maxResults: limit,
        orderBy: "relevance",
        key: process.env.GOOGLE_BOOKS_API_KEY,
      },
    });

    if (!response.data.items) {
      return res.status(404).json({ message: "No books found" });
    }

    const books = response.data.items.map((book) => ({
      id: book.id,
      title: book.volumeInfo.title || "No title available",
      author: book.volumeInfo.authors?.join(", ") || "Unknown Author",
      description: book.volumeInfo.description || "No description available.",
      cover: book.volumeInfo.imageLinks?.thumbnail || "",
      isbn:
        book.volumeInfo.industryIdentifiers?.find((id) => id.type === "ISBN_13")
          ?.identifier || "N/A",
      publishedDate: book.volumeInfo.publishedDate || "Unknown",
      pageCount: book.volumeInfo.pageCount || "N/A",
    }));

    res.json(books);
  } catch (error) {
    console.error(
      "Error in /search route:",
      error.message,
      error.response?.data
    );
    res.status(500).json({ message: "Error fetching books" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Získej údaje o knize z Google Books API
    const response = await axios.get(`${GOOGLE_BOOKS_API}/${id}`, {
      params: { key: process.env.GOOGLE_BOOKS_API_KEY },
    });

    const book = response.data.volumeInfo;

    const cover = book.imageLinks?.thumbnail || "";

    const genres = book.categories || ["No genres available"];

    const primaryAuthor = book.authors?.[0] || null;
    let authorDetails = null;

    if (primaryAuthor) {
      try {
        const wikiResponse = await axios.get(
          "https://cs.wikipedia.org/w/api.php", 
          {
            params: {
              action: "query",
              format: "json",
              titles: primaryAuthor,
              prop: "extracts|pageimages",
              exintro: true, 
              explaintext: true, 
              piprop: "thumbnail",
              pithumbsize: 200,
              redirects: 1, 
              uselang: "cs", 
            },
          }
        );

        const pages = wikiResponse.data.query.pages;
        const pageKey = Object.keys(pages)[0]; 
        const page = pages[pageKey];

        if (pageKey !== "-1") {
          let summary = page.extract || null;

          if (!summary) {
            const fullWikiResponse = await axios.get(
              "https://cs.wikipedia.org/w/api.php",
              {
                params: {
                  action: "query",
                  format: "json",
                  titles: primaryAuthor,
                  prop: "extracts",
                  explaintext: true,
                  redirects: 1,
                  uselang: "cs",
                },
              }
            );

            const fullPage = Object.values(
              fullWikiResponse.data.query.pages
            )[0];
            summary =
              fullPage.extract || `Další informace naleznete na Wikipedii.`;
          }

          // Nastavení detailů o autorovi
          authorDetails = {
            summary: summary,
            thumbnail: page.thumbnail?.source || null,
            wikipediaLink: `https://cs.wikipedia.org/wiki/${encodeURIComponent(
              page.title
            )}`,
          };
        } else {
          console.log("No valid page found for author:", primaryAuthor);
        }
      } catch (wikiError) {
        console.error(
          "Error fetching author details from Wikimedia API:",
          wikiError
        );
      }
    } else {
      console.log("No primary author found for this book.");
    }

    // Odpověď
    res.json({
      id: response.data.id,
      title: book.title,
      author: book.authors?.join(", ") || "Unknown Author",
      description: book.description || "No description available.",
      cover: cover,
      isbn:
        book.industryIdentifiers?.find((id) => id.type === "ISBN_13")
          ?.identifier || "N/A",
      publisher: book.publisher || "Unknown Publisher",
      publishedDate: book.publishedDate || "N/A",
      pageCount: book.pageCount || "N/A",
      language: book.language || "N/A",
      genres: genres,
      authorDetails: authorDetails, 
    });
  } catch (error) {
    console.error("Error fetching book details:", error);
    res.status(500).json({ message: "Error fetching book details" });
  }
});

module.exports = router;
