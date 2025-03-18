import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const type = searchParams.get("type") || "title"; // Možnost filtrování podle typu
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length < 3) return; // Zabránění zbytečným requestům při krátkých dotazech

    const fetchBooks = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL_LOCAL}/api/books/search`,
          {
            params: { query, type, limit: 15 },
          }
        );
        setBooks(response.data);
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, [query, type]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
    {/* Hlavička s výsledky vyhledávání */}
    <div className="mb-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
        Výsledky vyhledávání
      </h1>
      <p className="text-lg text-gray-600">
        Hledaný výraz: <span className="font-medium text-[#800020]">&quot;{query}&quot;</span>
      </p>
    </div>
  
    {/* Přepínač mezi hledáním podle názvu a autora */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-gray-700 font-medium">Filtrovat podle:</h2>
        <div className="flex gap-3">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 
                      ${type === "title" 
                      ? "bg-[#800020] text-white shadow-md" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            onClick={() => navigate(`/search-results?query=${query}&type=title`)}
          >
            Název knihy
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 
                      ${type === "author" 
                      ? "bg-[#800020] text-white shadow-md" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            onClick={() => navigate(`/search-results?query=${query}&type=author`)}
          >
            Autor
          </button>
        </div>
      </div>
    </div>
  
    {/* Výsledky vyhledávání */}
    {isLoading ? (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#800020] mb-4"></div>
          <p className="text-gray-600 text-lg">Načítám knihy...</p>
        </div>
      </div>
    ) : books.length > 0 ? (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Desktop verze tabulky */}
        <div className="hidden md:block">
          <table className="w-full text-sm text-left">
            <thead className="text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 w-24">
                  Obálka
                </th>
                <th scope="col" className="px-6 py-4">
                  Název
                </th>
                <th scope="col" className="px-6 py-4">
                  Autor
                </th>
                <th scope="col" className="px-6 py-4 w-32">
                  ISBN
                </th>
                <th scope="col" className="px-6 py-4 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {books.map((book) => (
                <tr
                  key={book.id}
                  className="bg-white transition-colors hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/books/${book.id}`)}
                >
                  <td className="px-6 py-4">
                    {book.cover ? (
                      <div className="h-24 w-16 rounded-md overflow-hidden shadow-sm border border-gray-200 bg-gray-50">
                        <img
                          src={book.cover}
                          alt={book.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="h-24 w-16 rounded-md overflow-hidden shadow-sm border border-gray-200 bg-gray-50 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <h3 className="font-medium text-[#800020]">{book.title}</h3>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {book.author}
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                    {book.isbn || "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 rounded-full hover:bg-[#800020]/10 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#800020]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
        {/* Mobilní verze - karty */}
        <div className="md:hidden divide-y divide-gray-200">
          {books.map((book) => (
            <div 
              key={book.id}
              className="p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => navigate(`/books/${book.id}`)}
            >
              <div className="flex items-start gap-4">
                {book.cover ? (
                  <div className="h-24 w-16 flex-shrink-0 rounded-md overflow-hidden shadow-sm border border-gray-200 bg-gray-50">
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="h-24 w-16 flex-shrink-0 rounded-md overflow-hidden shadow-sm border border-gray-200 bg-gray-50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[#800020] mb-1 truncate">{book.title}</h3>
                  <p className="text-gray-600 text-sm mb-1">{book.author}</p>
                  {book.isbn && (
                    <p className="text-gray-500 text-xs font-mono">ISBN: {book.isbn}</p>
                  )}
                </div>
                <div className="ml-auto">
                  <div className="p-2 rounded-full hover:bg-[#800020]/10 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#800020]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-700 mb-2">Žádné knihy nebyly nalezeny</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Zkuste použít jiná klíčová slova nebo změnit typ vyhledávání.
        </p>
      </div>
    )}
  </div>
  );
};

export default SearchResults;
