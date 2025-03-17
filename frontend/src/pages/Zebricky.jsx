import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AiOutlineStar, AiOutlineUser } from "react-icons/ai";
import pb from "../lib/pocketbase.js";

// Import from environment variables
const GOOGLE_BOOKS_API = import.meta.env.VITE_GOOGLE_BOOKS_API;
const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;

const Zebricky = () => {
  const [topBooks, setTopBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Načtení recenzí
        const reviews = await pb.collection("reviews").getFullList({
          filter: `approved=true`,
          expand: "book", // Předpokládám, že máte vztah na knihu v recenzích
        });

        // Výpočet průměrného hodnocení knih
        const bookRatings = {};
        
        // Vytvoření mapy knih s potřebnými informacemi z databáze
        reviews.forEach((review) => {
          const title = review.title;
          const rating = review.rating;
          
          if (!bookRatings[title]) {
            bookRatings[title] = { 
              total: 0, 
              count: 0,
              // Pokud máte v recenzi odkaz na knihu, můžete přidat další údaje
              bookId: review.expand?.book?.id || null,
              author: review.expand?.book?.author || null,
              googleBookId: review.expand?.book?.googleBookId || null,
            };
          }
          
          bookRatings[title].total += rating;
          bookRatings[title].count += 1;
        });

        // Vytvoření setříděného seznamu knih
        const sortedBooks = Object.entries(bookRatings)
          .map(([title, data]) => ({
            title,
            averageRating: data.total / data.count,
            bookId: data.bookId,
            author: data.author,
            googleBookId: data.googleBookId,
          }))
          .sort((a, b) => b.averageRating - a.averageRating)
          .slice(0, 10); // Omezení na pouze top 10

        // Funkce pro lepší porovnání názvů knih
        const normalizeTitleForComparison = (title) => {
          return title
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // Odstranění interpunkce
            .replace(/\s+/g, ' ')    // Normalizace mezer
            .trim();
        };

        const fetchBookDetailsBatch = async (books) => {
          const finalBooks = [];
          const batchSize = 3; // Snížení velikosti dávky pro lepší stabilitu
          const batches = [];

          for (let i = 0; i < books.length; i += batchSize) {
            batches.push(books.slice(i, i + batchSize));
          }

          for (const batch of batches) {
            const requests = batch.map((book) => {
              // Pokud již máme ID knihy v Google Books, použijeme ho přímo
              if (book.googleBookId) {
                return fetch(`https://www.googleapis.com/books/v1/volumes/${book.googleBookId}?key=${API_KEY}`)
                  .then(res => res.json())
                  .then(data => {
                    if (data.id && data.volumeInfo) {
                      return {
                        title: book.title,
                        averageRating: book.averageRating.toFixed(2),
                        author: data.volumeInfo.authors?.join(", ") || book.author || "Neznámý autor",
                        cover: data.volumeInfo.imageLinks?.thumbnail || null,
                        googleBookId: data.id,
                      };
                    }
                    return null;
                  })
                  .catch(error => {
                    console.warn(`❌ Chyba při načítání knihy podle ID ${book.googleBookId}:`, error);
                    return null;
                  });
              }
              
              // Jinak vyhledáme knihu podle názvu a autora
              const searchQuery = book.author 
                ? `intitle:"${encodeURIComponent(book.title)}" inauthor:"${encodeURIComponent(book.author)}"`
                : `intitle:"${encodeURIComponent(book.title)}"`;
                
              return fetch(`${GOOGLE_BOOKS_API}${searchQuery}&maxResults=5&key=${API_KEY}`)
                .then(res => res.json())
                .then(data => {
                  const items = data.items || [];
                  const normalizedBookTitle = normalizeTitleForComparison(book.title);
                  
                  // Najdeme nejlepší shodu podle názvu
                  const bestMatch = items.find(item => {
                    // Kontrola, zda má kniha obálku
                    if (!item.volumeInfo.imageLinks?.thumbnail) return false;
                    
                    const itemTitle = item.volumeInfo.title || "";
                    const normalizedItemTitle = normalizeTitleForComparison(itemTitle);
                    
                    // Pokud názvy přesně odpovídají, je to dobrá shoda
                    return normalizedItemTitle === normalizedBookTitle;
                  }) || items[0]; // Pokud nenajdeme přesnou shodu, vezmeme první výsledek
                  
                  if (!bestMatch) return null;

                  return {
                    title: book.title,
                    averageRating: book.averageRating.toFixed(2),
                    author: bestMatch.volumeInfo.authors?.join(", ") || book.author || "Neznámý autor",
                    cover: bestMatch.volumeInfo.imageLinks?.thumbnail || null,
                    googleBookId: bestMatch.id,
                  };
                })
                .catch(error => {
                  console.warn(`❌ Chyba při vyhledávání knihy "${book.title}":`, error);
                  return null;
                });
            });

            // Zpracování výsledků dávky
            const results = await Promise.allSettled(requests);
            const validResults = results
              .filter(r => r.status === "fulfilled" && r.value)
              .map(r => r.value);
              
            finalBooks.push(...validResults);
            
            // Krátké zpoždění mezi dávkami pro omezení rate-limitingu API
            if (batches.length > 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          return finalBooks;
        };

        const finalBooks = await fetchBookDetailsBatch(sortedBooks);
        setTopBooks(finalBooks);
      } catch (error) {
        console.error("Chyba při načítání žebříčku:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
    return (
      <div className="py-20 px-4 max-w-5xl mx-auto">
        <div className="mb-10 text-center animate-pulse">
          <div className="h-12 bg-gray-200 rounded-lg w-3/4 mx-auto mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
        
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-white border border-gray-200 shadow-md rounded-xl overflow-hidden flex flex-row items-center p-0 animate-pulse">
              {/* Rank placeholder */}
              <div className="flex-shrink-0 w-16 h-24 bg-gray-200 flex items-center justify-center"></div>
              
              {/* Book cover placeholder */}
              <div className="p-4 flex-shrink-0">
                <div className="w-24 h-36 bg-gray-300 rounded-md"></div>
              </div>
              
              {/* Book info placeholder */}
              <div className="flex flex-col p-4 flex-grow">
                <div className="h-7 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-5 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center mt-8 items-center text-[#800020]">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="font-medium">Načítám žebříček nejlepších knih...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 max-w-5xl mx-auto">
  {/* Header with decorative elements */}
  <div className="mb-10 text-center">
    <h1 className="text-4xl md:text-5xl font-bold mb-3 text-[#800020] relative inline-block">
      <span className="relative z-10">Top 10 Nejlépe Hodnocených Knih</span>
      <div className="absolute bottom-1 left-0 w-full h-3 bg-[#800020]/10 -z-0"></div>
    </h1>
    <p className="text-gray-600 max-w-2xl mx-auto">
      Nejoblíbenější knihy mezi čtenáři Knihotoku podle průměrného hodnocení.
    </p>
  </div>

  {/* Leaderboard */}
  <ol className="space-y-5">
    {topBooks.map((book, index) => (
      <li key={book.googleBookId}>
        <Link
          to={`/books/${book.googleBookId}`}
          className="group block bg-white border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden flex flex-row items-center p-0"
        >
          {/* Rank number with gradient background */}
          <div className={`
            flex-shrink-0 w-16 h-full flex items-center justify-center py-6 
            ${index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500' : 
              index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' : 
              index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' : 
              'bg-gradient-to-br from-gray-100 to-gray-200'}
          `}>
            <span className={`
              text-3xl font-bold ${index < 3 ? 'text-white' : 'text-[#800020]'} 
              drop-shadow-md group-hover:scale-110 transition-transform
            `}>
              {index + 1}
            </span>
          </div>

          {/* Book cover with shadow effect or fallback cover if no image */}
<div className="p-4 flex-shrink-0 relative">
  {book.cover ? (
    <img
      src={book.cover}
      alt={book.title}
      className="w-24 h-36 object-cover rounded-md shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300"
    />
  ) : (
    <div className="w-24 h-36 flex items-center justify-center rounded-md shadow-md bg-gradient-to-br from-[#800020]/80 to-[#800020] text-white group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
      <div className="text-center px-2">
        <div className="text-2xl font-bold">
          {book.title
            .split(' ')
            .map(word => word[0])
            .slice(0, 3)
            .join('')
            .toUpperCase()}
        </div>
        <div className="mt-1 text-xs opacity-80 font-medium border-t border-white/30 pt-1">
          {book.author?.split(',')[0] || "Kniha"}
        </div>
      </div>
    </div>
  )}
</div>

          {/* Book info with improved spacing */}
          <div className="flex flex-col p-4 flex-grow">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 group-hover:text-[#800020] transition-colors">
              {book.title}
            </h2>
            <p className="text-gray-700 flex items-center gap-2 mt-1">
              <AiOutlineUser className="text-[#800020]" size={18} /> 
              <span>{book.author}</span>
            </p>
            <div className="mt-2 flex items-center">
              <div className="flex items-center bg-[#800020]/10 rounded-full px-3 py-1">
                <AiOutlineStar className="text-[#800020] mr-1" size={18} />
                <span className="font-semibold text-[#800020]">{book.averageRating}</span>
                <span className="text-gray-600 text-sm">/5</span>
              </div>
              <span className="ml-2 text-sm text-gray-500">
                podle čtenářů
              </span>
            </div>
          </div>

          {/* Arrow indicator for hover state */}
          <div className="pr-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </Link>
      </li>
    ))}
  </ol>
</div>
  );
};

export default Zebricky;
