import { useEffect, useState } from "react";
import { AiOutlineStar, AiOutlineUser } from "react-icons/ai";
import pb from "../lib/pocketbase.js";

const Zebricky = () => {
  const [topBooks, setTopBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Načtení recenzí
        const reviews = await pb.collection("reviews").getFullList({
          filter: `approved=true`,
          expand: "book", // Předpokládám, že máte vztah na knihu v recenzích
        });

        console.log("Reviews:", reviews[0]); // Vypíše první recenzi pro kontrolu

        // Výpočet průměrného hodnocení knih
        const bookRatings = {};
        
        // Vytvoření mapy knih s potřebnými informacemi z databáze
        reviews.forEach((review) => {
          const title = review.title;
          const rating = review.rating;
          
          // Zajistíme, že author je vždy string
          let author = "Neznámý autor";
          
          if (review.expand?.book?.author) {
            author = review.expand.book.author;
          } else if (review.authors) {
            author = review.authors;
          }
          
          // Ujistíme se, že author je string
          if (typeof author !== 'string') {
            try {
              author = String(author); // Pokus o konverzi na string
            } catch (e) {
              author = "Neznámý autor"; // Fallback, pokud konverze selže
            }
          }
          
          if (!bookRatings[title]) {
            bookRatings[title] = { 
              total: 0, 
              count: 0,
              bookId: review.expand?.book?.id || null,
              author: author, // Nyní by to měl být string
              cover: review.expand?.book?.cover || null,
              isbn: review.expand?.book?.isbn || null,
            };
          }
          
          bookRatings[title].total += rating;
          bookRatings[title].count += 1;
        });

        // Vytvoření setříděného seznamu knih
        const sortedBooks = Object.entries(bookRatings)
          .map(([title, data]) => ({
            id: data.bookId || `book-${title.replace(/\s+/g, '-').toLowerCase()}`,
            title,
            author: data.author, // Toto by nyní mělo obsahovat správnou hodnotu z "authors"
            cover: data.cover,
            averageRating: data.total / data.count,
            reviewCount: data.count,
            isbn: data.isbn
          }))
          .sort((a, b) => b.averageRating - a.averageRating)
          .slice(0, 10); // Omezení na pouze top 10

        console.log("Zpracované knihy:", sortedBooks); // Pro kontrolu finálních dat
        setTopBooks(sortedBooks);
      } catch (error) {
        console.error("Chyba při načítání žebříčku:", error);
        setError("Nepodařilo se načíst žebříček knih. Zkuste to prosím později.");
        
        // Fallback data pro případ chyby
        setTopBooks([
          {
            id: "fallback1",
            title: "Pýcha a předsudek",
            author: "Jane Austen",
            cover: null,
            averageRating: 4.5,
            reviewCount: 42
          },
          {
            id: "fallback2",
            title: "1984",
            author: "George Orwell",
            cover: null,
            averageRating: 4.3,
            reviewCount: 36
          },
          {
            id: "fallback3",
            title: "Hobit",
            author: "J.R.R. Tolkien",
            cover: null,
            averageRating: 4.2,
            reviewCount: 29
          }
        ]);
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
      <div className="mb-14 text-center relative">
  {/* Moderní geometrické tvary v pozadí */}
  <div className="absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute top-10 left-1/3 w-64 h-64 bg-gradient-to-r from-purple-200 to-pink-200 opacity-20 rounded-full blur-3xl"></div>
    <div className="absolute -top-10 right-1/3 w-80 h-80 bg-gradient-to-r from-yellow-100 to-amber-100 opacity-20 rounded-full blur-3xl"></div>
    <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-full h-40 bg-gradient-to-r from-burgundy-50 to-burgundy-100 opacity-20 rounded-full blur-3xl"></div>
  </div>
  
  {/* Vizuální designové prvky - minimalistické ikony */}
  <div className="hidden md:flex absolute justify-between w-full top-0 opacity-10">
    <div className="flex gap-2 transform -translate-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="w-1.5 h-16 bg-burgundy-600 rounded-full" style={{ height: `${(i+2) * 16}px` }}></div>
      ))}
    </div>
    <div className="flex gap-2 transform translate-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="w-1.5 h-16 bg-fourth rounded-full" style={{ height: `${(3-i) * 16}px` }}></div>
      ))}
    </div>
  </div>

  {/* Moderní badge jako akcent před nadpisem */}
  <div className="inline-flex items-center justify-center px-3 py-1 mb-6 rounded-full bg-gradient-to-r from-burgundy-100 to-burgundy-200 text-burgundy-800 text-xs font-medium tracking-wide">
    <span className="inline-block w-2 h-2 rounded-full bg-fourth mr-2"></span>
    ŽEBŘÍČEK KNIH
  </div>

  {/* Hlavní nadpis - jednodušší, ale výraznější */}
  <h1 className="relative text-4xl md:text-5xl font-extrabold mb-6 text-gray-900 leading-tight tracking-tight">
    <span className="relative">
      Top 10 Nejlépe <span className="text-[#800020]">Hodnocených</span> Knih
      <div className="absolute h-3 w-full left-0 -bottom-1 bg-fourth opacity-30 -rotate-1"></div>
    </span>
  </h1>

  {/* Modernější zobrazení hvězdiček - interaktivnější vzhled */}
  <div className="flex justify-center items-center gap-1 mb-6">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="relative group">
        <div className="absolute inset-0 bg-fourth rounded-full blur-sm opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 text-fourth transform group-hover:scale-110 transition-transform"
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </div>
    ))}
  </div>

  {/* Popis s trendovou typografií */}
  <p className="font-light text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
    Nejoblíbenější knihy mezi čtenáři Knihotoku podle průměrného hodnocení.
    <span className="inline-block h-1 w-8 bg-burgundy-200 ml-2 rounded-full align-middle"></span>
  </p>
  
  {/* Modernizovaná chybová hláška s neuromorfním designem */}
  {error && (
    <div className="mt-6 relative bg-white border border-red-100 p-5 rounded-2xl shadow-sm max-w-xl mx-auto overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-red-50 opacity-80"></div>
      <div className="relative flex items-start gap-4">
        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-red-100 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-red-800 font-medium tracking-wide mb-1">Nepodařilo se načíst data</h3>
          <p className="text-red-600 text-sm">{error}</p>
          <p className="mt-2 text-red-500 text-xs font-medium uppercase tracking-wider">Zobrazujeme záložní data</p>
        </div>
      </div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-300 to-red-500"></div>
    </div>
  )}
</div>

      {/* Leaderboard */}
      <ol className="space-y-5">
        {topBooks.map((book, index) => (
          <li key={book.id}>
            <div className="bg-white border border-gray-200 shadow-md transition-all duration-300 rounded-xl overflow-hidden flex flex-row items-center p-0">
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
                  drop-shadow-md
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
                    className="w-24 h-36 object-cover rounded-md shadow-md"
                  />
                ) : (
                  <div className="w-24 h-36 flex items-center justify-center rounded-md shadow-md bg-gradient-to-br from-[#800020]/80 to-[#800020] text-white">
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
      {typeof book.author === 'string' 
        ? book.author.split(',')[0] 
        : typeof book.author === 'object' && book.author !== null
          ? JSON.stringify(book.author).substring(0, 15)
          : "Kniha"}
    </div>
  </div>
</div>
                )}
              </div>

              {/* Book info with improved spacing */}
              <div className="flex flex-col p-4 flex-grow">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                  {book.title}
                </h2>
                <p className="text-gray-700 flex items-center gap-2 mt-1">
  <AiOutlineUser className="text-[#800020]" size={18} /> 
  <span>
    {typeof book.author === 'string'
      ? book.author
      : "Neznámý autor"}
  </span>
</p>
                <div className="mt-2 flex items-center">
                  <div className="flex items-center bg-[#800020]/10 rounded-full px-3 py-1">
                    <AiOutlineStar className="text-[#800020] mr-1" size={18} />
                    <span className="font-semibold text-[#800020]">{book.averageRating.toFixed(2)}</span>
                    <span className="text-gray-600 text-sm">/5</span>
                  </div>
                  <span className="ml-2 text-sm text-gray-500">
                    podle {book.reviewCount} {book.reviewCount === 1 ? 'recenze' : 
                            book.reviewCount < 5 ? 'recenzí' : 'recenzí'}
                  </span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
      
      {topBooks.length === 0 && !loading && (
        <div className="text-center py-10">
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-2xl font-medium text-gray-700 mb-2">Zatím žádné hodnocené knihy</h3>
          <p className="text-gray-500">
            Až čtenáři ohodnotí více knih, objeví se zde žebříček těch nejlepších.
          </p>
          {error && (
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-[#800020] text-white rounded-lg hover:bg-[#600018] transition-colors"
            >
              Zkusit znovu načíst
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Zebricky;