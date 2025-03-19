const express = require("express");
const axios = require("axios");
const router = express.Router();

const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";
const NodeCache = require("node-cache");
const searchCache = new NodeCache({ stdTTL: 300 });

router.get("/search", async (req, res) => {
  const { query, type = "title", limit = 10 } = req.query;

  if (!query?.trim() || query.length < 3) {
    return res.status(400).json({
      message: "Query must be at least 3 characters long",
    });
  }

  const cacheKey = `search:${type}:${query}:${limit}`;

  const cachedResult = searchCache.get(cacheKey);
  if (cachedResult) {
    return res.json(cachedResult);
  }

  try {
    const formattedQuery =
      type === "author"
        ? `inauthor:"${query.trim()}"`
        : `intitle:"${query.trim()}"`;

    const response = await axios.get(GOOGLE_BOOKS_API, {
      params: {
        q: formattedQuery,
        maxResults: Math.min(limit * 2, 30),
        orderBy: "relevance",
        key: process.env.GOOGLE_BOOKS_API_KEY,
        fields:
          "items(id,volumeInfo(title,authors,description,imageLinks/thumbnail,industryIdentifiers,publishedDate,pageCount,language))",
      },
      headers: {
        "Accept-Language": "cs,en;q=0.9",
      },
      timeout: 8000,
    });

    // Zpracování výsledků
    if (!response.data.items || response.data.items.length === 0) {
      console.log("No books found for query:", query);
      return res.json([]);
    }

    const books = response.data.items
      .map((book) => ({
        id: book.id,
        title: book.volumeInfo.title || "Název není k dispozici",
        author: book.volumeInfo.authors?.join(", ") || "Neznámý autor",
        description:
          book.volumeInfo.description?.slice(0, 200) ||
          "Popis není k dispozici.",
        cover:
          book.volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:") ||
          "",
        isbn:
          book.volumeInfo.industryIdentifiers?.find(
            (id) => id.type === "ISBN_13"
          )?.identifier || "N/A",
        publishedDate:
          book.volumeInfo.publishedDate?.split("-")[0] || "Neznámý rok vydání",
        pageCount: book.volumeInfo.pageCount || "N/A",
        language: book.volumeInfo.language || "unknown",
      }))
      .sort((a, b) => {
        if (a.language === "cs" && b.language !== "cs") return -1;
        if (a.language !== "cs" && b.language === "cs") return 1;

        if (a.language === "en" && b.language !== "en") return -1;
        if (a.language !== "en" && b.language === "en") return 1;

        return 0;
      })
      .slice(0, limit);

    console.log(
      `Found ${books.length} books for query "${query}" (type: ${type})`
    );

    searchCache.set(cacheKey, books);
    res.json(books);
  } catch (error) {
    console.error("Search API Error:", error.message);
    console.error("Full error:", error);

    res.status(error.response?.status || 500).json({
      message: "Chyba při vyhledávání knih",
      error: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
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
