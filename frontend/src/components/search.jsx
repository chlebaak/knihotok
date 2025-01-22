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
  const navigate = useNavigate();

  const searchBooks = async () => {
    if (query.length < 3) {
      setBooks([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:5000/api/books/search",
        {
          params: { query, type, limit: 5 },
        }
      );
      setBooks(response.data);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchBooks();
    }, 300); // Rychlejší debounce

    return () => clearTimeout(delayDebounceFn);
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

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative max-w-md mx-auto mt-10" ref={searchContainerRef}>
      <div className="relative">
        <input
          type="text"
          className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-red-700 focus:border-red-600"
          placeholder="Hledej knihy"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          autoComplete="off"
        />
        <button
          onClick={handleFullSearch}
          className="text-white absolute end-2.5 bottom-2.5 bg-red-800 hover:bg-red-900 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2"
        >
          Hledej
        </button>
      </div>

      <div className="flex gap-2 mt-2">
        <button
          className={`px-3 py-1 text-sm font-semibold rounded ${
            type === "title" ? "bg-red-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setType("title")}
        >
          Název
        </button>
        <button
          className={`px-3 py-1 text-sm font-semibold rounded ${
            type === "author" ? "bg-red-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setType("author")}
        >
          Autor
        </button>
      </div>

      {isFocused && (
        <div className="absolute bg-white border border-gray-300 rounded-lg w-full mt-1 max-h-60 overflow-y-auto shadow-lg z-50">
          {isLoading ? (
            <p className="text-center py-2">Načítání...</p>
          ) : books.length > 0 ? (
            <ul>
              {books.map((book) => (
                <li
                  key={book.id}
                  className="hover:bg-gray-100 transition-colors"
                >
                  <Link
                    to={`/books/${book.id}`}
                    className="flex items-center gap-4 px-4 py-2 w-full block"
                    onClick={() => setIsFocused(false)}
                  >
                    {book.cover && (
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="h-12 object-cover border rounded"
                      />
                    )}
                    <div>
                      <p className="text-red-600 font-semibold">{book.title}</p>
                      <p className="text-gray-600 text-sm">by {book.author}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center py-2">Žádné výsledky</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBooks;
