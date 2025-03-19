const express = require("express");
const axios = require("axios");
const router = express.Router();

// Google Books API Base URL
const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";
const NodeCache = require('node-cache');
const searchCache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

router.get("/search", async (req, res) => {
  const { query, type = "title", limit = 10 } = req.query;
  
  // Validate input
  if (!query?.trim() || query.length < 3) {
    return res.status(400).json({ 
      message: "Query must be at least 3 characters long" 
    });
  }

  // Generate cache key
  const cacheKey = `search:${type}:${query}:${limit}`;
  
  // Check cache first
  const cachedResult = searchCache.get(cacheKey);
  if (cachedResult) {
    return res.json(cachedResult);
  }

  try {
    const formattedQuery = type === "author" 
      ? `inauthor:"${query.trim()}"` 
      : `intitle:"${query.trim()}"`;

    // Jednodušší přístup - jeden požadavek bez jazykového omezení, ale s preferencí
    const response = await axios.get(GOOGLE_BOOKS_API, {
      params: {
        q: formattedQuery,
        maxResults: Math.min(limit * 2, 30), // Získat více výsledků pro filtrování
        orderBy: "relevance",
        key: process.env.GOOGLE_BOOKS_API_KEY,
        fields: 'items(id,volumeInfo(title,authors,description,imageLinks/thumbnail,industryIdentifiers,publishedDate,pageCount,language))',
      },
      headers: {
        'Accept-Language': 'cs,en;q=0.9' // Preferovat češtinu, potom angličtinu
      },
      timeout: 8000
    });

    // Zpracování výsledků
    if (!response.data.items || response.data.items.length === 0) {
      console.log('No books found for query:', query);
      return res.json([]);
    }

    // Mapování a filtrace výsledků
    const books = response.data.items
      .map(book => ({
        id: book.id,
        title: book.volumeInfo.title || "Název není k dispozici",
        author: book.volumeInfo.authors?.join(", ") || "Neznámý autor",
        description: book.volumeInfo.description?.slice(0, 200) || "Popis není k dispozici.",
        cover: book.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || "",
        isbn: book.volumeInfo.industryIdentifiers?.find(id => id.type === "ISBN_13")?.identifier || "N/A",
        publishedDate: book.volumeInfo.publishedDate?.split('-')[0] || "Neznámý rok vydání",
        pageCount: book.volumeInfo.pageCount || "N/A",
        language: book.volumeInfo.language || "unknown"
      }))
      // Řazení výsledků - prioritně české, pak anglické
      .sort((a, b) => {
        // Prioritizovat české knihy
        if (a.language === 'cs' && b.language !== 'cs') return -1;
        if (a.language !== 'cs' && b.language === 'cs') return 1;
        
        // Potom anglické knihy
        if (a.language === 'en' && b.language !== 'en') return -1;
        if (a.language !== 'en' && b.language === 'en') return 1;
        
        return 0;
      })
      // Omezit počet výsledků
      .slice(0, limit);

    // Logování pro debugování
    console.log(`Found ${books.length} books for query "${query}" (type: ${type})`);
    
    // Cache the results
    searchCache.set(cacheKey, books);
    res.json(books);

  } catch (error) {
    console.error("Search API Error:", error.message);
    console.error("Full error:", error);
    
    res.status(error.response?.status || 500).json({ 
      message: "Chyba při vyhledávání knih",
      error: error.message 
    });
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

    // Získej větší verzi obálky, pokud je dostupná
    const cover = book.imageLinks?.thumbnail || "";

    // Získej žánry (categories)
    const genres = book.categories || ["No genres available"];

    // Získej prvního autora
    const primaryAuthor = book.authors?.[0] || null;
    let authorDetails = null;

    // Pokud je dostupný autor, získej informace z Wikimedia API
    if (primaryAuthor) {
      try {
        const wikiResponse = await axios.get(
          "https://cs.wikipedia.org/w/api.php", // Používáme českou Wikipedii
          {
            params: {
              action: "query",
              format: "json",
              titles: primaryAuthor,
              prop: "extracts|pageimages",
              exintro: true, // Získá pouze úvodní část
              explaintext: true, // Vrací čistý text
              piprop: "thumbnail",
              pithumbsize: 200,
              redirects: 1, // Přesměrování na správný název
              uselang: "cs", // Čeština
            },
          }
        );

        const pages = wikiResponse.data.query.pages;
        const pageKey = Object.keys(pages)[0]; // Získej ID stránky
        const page = pages[pageKey];

        if (pageKey !== "-1") {
          // Kontrola, zda `extract` existuje
          let summary = page.extract || null;

          // Pokud `extract` chybí, zkusíme celý obsah bez `exintro`
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

          // Nastav detaily o autorovi
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

    // Odpověď s informacemi o knize a autorovi
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
      authorDetails: authorDetails, // Přidáno podrobnosti o autorovi
    });
  } catch (error) {
    console.error("Error fetching book details:", error);
    res.status(500).json({ message: "Error fetching book details" });
  }
});

module.exports = router;
