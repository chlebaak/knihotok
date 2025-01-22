import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AiOutlineStar, AiOutlineUser } from "react-icons/ai";
import pb from "../lib/pocketbase.js";

const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes?q=";

const Zebricky = () => {
  const [topBooks, setTopBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviews = await pb.collection("reviews").getFullList({
          filter: `approved=true`,
        });

        const bookRatings = {};
        reviews.forEach(({ title, rating }) => {
          if (!bookRatings[title]) {
            bookRatings[title] = { total: 0, count: 0 };
          }
          bookRatings[title].total += rating;
          bookRatings[title].count += 1;
        });

        const sortedBooks = Object.entries(bookRatings)
          .map(([title, { total, count }]) => ({
            title,
            averageRating: total / count,
          }))
          .sort((a, b) => b.averageRating - a.averageRating);

        const usedBookIds = new Set(); 

        const bookDetailsPromises = sortedBooks.map(async (book) => {
          const response = await fetch(
            `${GOOGLE_BOOKS_API}intitle:${encodeURIComponent(book.title)}`
          );
          const data = await response.json();
          const items = data.items || [];

          let validBook = null;

          
          for (const item of items) {
            if (
              item.volumeInfo.imageLinks?.thumbnail &&
              !usedBookIds.has(item.id)
            ) {
              validBook = item;
              break;
            }
          }

          if (!validBook) return null;

          usedBookIds.add(validBook.id); 

          const bookInfo = validBook.volumeInfo;

          return {
            title: book.title,
            averageRating: book.averageRating.toFixed(2),
            author: bookInfo.authors?.join(", ") || "Neznámý autor",
            cover: bookInfo.imageLinks.thumbnail,
            googleBookId: validBook.id,
          };
        });

        const finalBooks = (await Promise.all(bookDetailsPromises))
          .filter((book) => book !== null)
          .slice(0, 10);
        setTopBooks(finalBooks);
      } catch (error) {
        console.error("Chyba při načítání žebříčku:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading)
    return <p className="text-center text-lg mt-6">⏳ Načítám žebříček...</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-center text-[#800020]">
        Top 10 Nejlépe Hodnocených Knih
      </h1>
      <ol className="space-y-4">
        {topBooks.map((book, index) => (
          <li key={book.googleBookId}>
            <Link
              to={`/books/${book.googleBookId}`}
              className="block bg-white border border-gray-300 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-lg overflow-hidden flex items-center gap-4 p-4 hover:bg-gray-100"
            >
              <span className="text-2xl font-bold text-[#800020] w-8 text-center">
                {index + 1}.
              </span>
              <img
                src={book.cover}
                alt={book.title}
                className="w-20 h-28 object-cover rounded"
              />
              <div className="flex flex-col">
                <h2 className="text-xl font-semibold text-gray-900">
                  {book.title}
                </h2>
                <p className="text-gray-700 flex items-center gap-2">
                  <AiOutlineUser className="text-[#800020]" /> {book.author}
                </p>
                <p className="text-[#800020] font-semibold flex items-center gap-2">
                  <AiOutlineStar className="text-[#800020]" />{" "}
                  {book.averageRating}/5
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default Zebricky;
