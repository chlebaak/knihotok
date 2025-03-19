import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const SearchBooks = () => {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [type, setType] = useState("title");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchContainerRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const navigate = useNavigate();

  const searchBooks = async () => {
    if (query.length < 3) {
      setBooks([]);
      return;
    }

    console.log(`Searching for: "${query}" (type: ${type})`);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/books/search`,
        {
          params: {
            query: query.trim(),
            type,
            limit: 10,
          },
          headers: {
            "Accept-Language": "cs,en;q=0.9",
          },
          signal: abortControllerRef.current.signal,
        }
      );

      console.log(`Received ${response.data.length} results`);

      if (response.data.length === 0) {
        setBooks([]);
      } else {
        setBooks(response.data.slice(0, 5));
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("Request was cancelled");
      } else {
        console.error("Error fetching books:", error);
        setBooks([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (query.trim()) {
        searchBooks();
      } else {
        setBooks([]);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, type]);

  const handleFullSearch = () => {
    navigate(`/search-results?query=${query}&type=${type}`);
  };

  const handleClickOutside = (event) => {
    if (
      searchContainerRef.current &&
      !searchContainerRef.current.contains(event.target)
    ) {
      setIsFocused(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleFullSearch();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative max-w-xl mx-auto my-4" ref={searchContainerRef}>
      <div className="relative">
        {/* Ikona lupy */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-[#800020]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Vyhledávací pole */}
        <input
          type="text"
          className="block w-full p-4 pl-12 text-base text-gray-800 border-2 border-gray-200 rounded-xl bg-white shadow-sm 
                  focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020] transition-all duration-200 outline-none"
          placeholder="Hledej knihy..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />

        {/* Tlačítko vyhledávání */}
        <button
          onClick={handleFullSearch}
          className="absolute right-3 bottom-3 bg-gradient-to-r from-[#800020] to-[#aa0030] text-white font-medium 
                 rounded-lg text-sm px-5 py-2.5 shadow-sm hover:shadow-md transform hover:scale-[1.02] 
                 transition-all duration-200 focus:ring-2 focus:ring-[#800020]/50 focus:outline-none 
                 flex items-center gap-1"
        >
          <span>Hledat</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Přepínače pro typ vyhledávání */}
      <div className="flex gap-3 mt-3">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 
                ${
                  type === "title"
                    ? "bg-[#800020] text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
          onClick={() => setType("title")}
        >
          Název knihy
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 
                ${
                  type === "author"
                    ? "bg-[#800020] text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
          onClick={() => setType("author")}
        >
          Autor
        </button>
      </div>

      {/* Rozbalovací seznam výsledků */}
      {isFocused && (
        <div
          className="absolute bg-white border border-gray-200 rounded-xl w-full mt-2 max-h-80 overflow-y-auto 
                    shadow-lg z-50 transition-all duration-200 animate-slideDown"
        >
          {isLoading ? (
            <div className="text-center py-8 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#800020]"></div>
              <p className="text-gray-600 mt-4">Hledám knihy...</p>
            </div>
          ) : books.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {books.map((book) => (
                <li
                  key={book.id}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <Link
                    to={`/books/${book.id}`}
                    className="flex items-center gap-4 p-3 w-full block"
                    onClick={() => setIsFocused(false)}
                  >
                    {book.cover ? (
                      <div className="h-16 w-12 flex-shrink-0 rounded-md overflow-hidden shadow-sm border border-gray-200 bg-gray-100">
                        <img
                          src={book.cover}
                          alt={book.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-12 flex-shrink-0 rounded-md overflow-hidden shadow-sm border border-gray-200 bg-gray-100 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[#800020] font-medium text-base truncate">
                        {book.title}
                      </p>
                      <p className="text-gray-600 text-sm mt-0.5">
                        <span className="text-gray-500">od</span> {book.author}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <div className="bg-gray-100 p-2 rounded-full hover:bg-[#800020]/10 transition-colors">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-[#800020]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : query.length > 0 ? (
            <div className="text-center py-10 px-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-600 font-medium">Žádné výsledky</p>
              <p className="text-gray-500 text-sm mt-2">
                Zkuste použít jiná klíčová slova nebo změnit typ vyhledávání.
              </p>
            </div>
          ) : (
            <div className="text-center py-10 px-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-gray-600 font-medium">
                Začněte psát pro vyhledávání
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Zadejte nejméně 3 znaky pro zobrazení výsledků.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBooks;
