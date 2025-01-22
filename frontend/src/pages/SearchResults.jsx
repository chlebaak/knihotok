import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
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
          "http://localhost:5000/api/books/search",
          {
            params: { query, type, limit: 40 },
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Výsledky pro &quot;{query}&quot;
      </h1>

      {/* Přepínač mezi hledáním podle názvu a autora */}
      <div className="flex gap-2 mb-4">
        <button
          className={`px-3 py-1 text-sm font-semibold rounded ${
            type === "title" ? "bg-red-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => navigate(`/search-results?query=${query}&type=title`)}
        >
          Název
        </button>
        <button
          className={`px-3 py-1 text-sm font-semibold rounded ${
            type === "author" ? "bg-red-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => navigate(`/search-results?query=${query}&type=author`)}
        >
          Autor
        </button>
      </div>

      {/* Načítání indikátor */}
      {isLoading ? (
        <p className="text-center text-lg">🔄 Načítám knihy...</p>
      ) : books.length > 0 ? (
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Obálka
                </th>
                <th scope="col" className="px-6 py-3">
                  Název
                </th>
                <th scope="col" className="px-6 py-3">
                  Autor
                </th>
                <th scope="col" className="px-6 py-3">
                  ISBN
                </th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr
                  key={book.id}
                  className="bg-white border-b cursor-pointer hover:bg-gray-100"
                  onClick={() => navigate(`/books/${book.id}`)}
                >
                  <td className="px-6 py-4">
                    {book.cover && (
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="h-20 object-cover"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {book.title}
                  </td>
                  <td className="px-6 py-4">{book.author}</td>
                  <td className="px-6 py-4">{book.isbn || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-lg">😞 Žádné knihy nebyly nalezeny.</p>
      )}
    </div>
  );
};

export default SearchResults;
