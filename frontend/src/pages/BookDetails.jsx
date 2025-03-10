import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Search from "../components/search.jsx";
import pb from "../lib/pocketbase.js";
import { FaHeart, FaBook } from "react-icons/fa";

const BookDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userReview, setUserReview] = useState(null);

  const [averageRating, setAverageRating] = useState(0);
  const [ratingsBreakdown, setRatingsBreakdown] = useState([]);
  const [totalReviews, setTotalReviews] = useState(0);

  const [isInFavorites, setIsInFavorites] = useState(false);
  const [isInToRead, setIsInToRead] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_LENGTH = 700; // Maximální délka zkráceného textu

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  const renderDescription = () => {
    if (isExpanded || book.description.length <= MAX_LENGTH) {
      return book.description;
    }
    return `${book.description.slice(0, MAX_LENGTH)}...`;
  };

  const fetchBookDetails = async (userId) => {
    try {
      const bookResponse = await axios.get(
        `http://localhost:5000/api/books/${id}`
      );
      setBook(bookResponse.data);

      const title = bookResponse.data.title;
      if (title) {
        // Získání recenzí pro danou knihu
        const reviewsResponse = await pb.collection("reviews").getFullList({
          filter: `title="${title}" && approved=true`,
        });

        const userIds = reviewsResponse
          .filter((review) => review.author_zub !== null)
          .map((review) => review.author_zub);

        const userProfiles = await Promise.all(
          userIds.map(async (id) => {
            const response = await axios.get(
              `http://localhost:5000/api/users/${id}`
            );
            return response.data;
          })
        );

        // Přidání profilových informací k recenzím
        const reviewsWithProfiles = reviewsResponse.map((review) => {
          if (review.author_zub) {
            const userProfile = userProfiles.find(
              (profile) => profile.id === review.author_zub
            );
            return {
              ...review,
              authorProfile: userProfile,
            };
          }
          return review;
        });

        setReviews(reviewsWithProfiles);
        updateReviewStats(reviewsWithProfiles);

        // Pokud je uživatel přihlášen, ověřit, zda již napsal recenzi
        if (userId) {
          const existingReview = reviewsWithProfiles.find(
            (review) => review.author_zub === userId
          );
          setUserReview(existingReview || null);
        }
      }
    } catch (error) {
      console.error("Error fetching book details or reviews:", error);
    }
  };

  // Funkce na aktualizaci průměrného hodnocení a rozložení
  const updateReviewStats = (reviews) => {
    if (reviews.length > 0) {
      const totalRatings = reviews.length;
      setTotalReviews(totalRatings);

      const totalScore = reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      setAverageRating(totalScore / totalRatings);

      const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
        stars,
        count: reviews.filter((review) => review.rating === stars).length,
        percentage:
          (reviews.filter((review) => review.rating === stars).length /
            totalRatings) *
          100,
      }));

      setRatingsBreakdown(breakdown);
    } else {
      setTotalReviews(0);
      setAverageRating(0);
      setRatingsBreakdown([]);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/auth/profile",
        {
          withCredentials: true,
        }
      );
      setIsLoggedIn(true);
      setUserId(response.data.id);

      fetchBookDetails(response.data.id);
    } catch (error) {
      console.error("User not logged in:", error);
      setIsLoggedIn(false);
    }
  };

  const checkBookStatus = async () => {
    try {
      const userResponse = await axios.get(
        "http://localhost:5000/api/auth/profile",
        {
          withCredentials: true,
        }
      );
      const userId = userResponse.data.id;

      const response = await axios.get(
        `http://localhost:5000/api/user-books/${userId}/${id}`,
        {
          withCredentials: true,
        }
      );

      const { favorite, toread } = response.data;
      setIsInFavorites(favorite);
      setIsInToRead(toread);
    } catch (error) {
      console.error("Error checking book status:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchBookDetails();
      await checkAuth();
      await checkBookStatus(); 
    };

    fetchData();
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!newReview.comment.trim()) {
      alert("Review text cannot be empty!");
      return;
    }

    if (userReview) {
      alert("You can only submit one review per book.");
      return;
    }

    try {
      const reviewData = {
        author_zub: userId,
        collectionId: "pbc_4163081445",
        collectionName: "reviews",
        title: book.title,
        rating: newReview.rating,
        text: newReview.comment,
        authors: book.author,
        approved: true,
      };

      await axios.post(
        "https://db.ladislavpokorny.cz/api/collections/reviews/records",
        reviewData
      );

      await fetchBookDetails(userId); 

      setNewReview({ rating: 5, comment: "" });
      alert("Review successfully added!");
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit the review. Please try again.");
    }
  };

  const handleReviewDelete = async (reviewId) => {
    try {
      await axios.delete(
        `https://db.ladislavpokorny.cz/api/collections/reviews/records/${reviewId}`
      );

      await fetchBookDetails(userId); 

      alert("Review deleted successfully.");
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete the review. Please try again.");
    }
  };

  if (!book)
    return (
      <div
        role="status"
        className="flex items-center justify-center min-h-screen w-full space-x-8 animate-pulse md:flex md:items-center"
      >
        <div className="flex items-center justify-center w-1/3 h-48 bg-red-900 rounded sm:w-96">
          <svg
            className="w-10 h-10 text-white"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 18"
          >
            <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
          </svg>
        </div>
        <div className="w-2/3">
          <h1 className="text-4xl font-bold text-red-900 mb-6">Načítá se</h1>
          <div className="h-2.5 bg-red-800 rounded-full w-48 mb-4"></div>
          <div className="h-2 bg-red-800 rounded-full max-w-[480px] mb-2.5"></div>
          <div className="h-2 bg-red-800 rounded-full mb-2.5"></div>
          <div className="h-2 bg-red-800 rounded-full max-w-[440px] mb-2.5"></div>
          <div className="h-2 bg-red-800 rounded-full max-w-[460px] mb-2.5"></div>
          <div className="h-2 bg-red-800 rounded-full max-w-[360px]"></div>
        </div>
        <span className="sr-only">Loading...</span>
      </div>
    );

  const handleAddToList = async (listType) => {
    try {
      const userResponse = await axios.get(
        "http://localhost:5000/api/auth/profile",
        {
          withCredentials: true,
        }
      );
      const userId = userResponse.data.id;

      await axios.post(
        "http://localhost:5000/api/user-books",
        {
          userId: userId, 
          bookId: id,
          listType,
          title: book.title,
          author: book.author,
          coverUrl: book.cover,
        },
        { withCredentials: true }
      );

      if (listType === "favorite") setIsInFavorites(true);
      if (listType === "toread") setIsInToRead(true);
    } catch (error) {
      console.error("Error adding book to list:", error);
    }
  };

  const handleRemoveFromList = async (listType) => {
    try {
      await axios.delete("http://localhost:5000/api/user-books", {
        data: {
          userId: 1, 
          bookId: id,
          listType,
        },
        withCredentials: true,
      });

      if (listType === "favorite") setIsInFavorites(false);
      if (listType === "toread") setIsInToRead(false);
    } catch (error) {
      console.error("Error removing book from list:", error);
    }
  };

  const languageToCountry = {
    cs: "cz",
    en: "gb",
    de: "de",
    fr: "fr",
    es: "es",
    it: "it",
    ru: "ru",
    pl: "pl",
    ja: "jp",
    zh: "cn",
  };
  const countryCode = languageToCountry[book.language] || "un";

  return (
    <div className="p-2">
      <Search />
      <div className="gap-6 py-8 px-6 mx-auto max-w-screen-xl xl:gap-4 md:grid md:grid-cols-3 sm:py-16 lg:px-8 bg-white rounded-lg shadow-xl">
        {/* Obálka knihy */}
        <img
          className="col-span-1 w-2/4 rounded-lg shadow-lg mx-auto md:mx-0 sm:w-2/5 md:w-2/4 sm:mb-4 md:mb-0 border-4 border-[#800020]"
          src={book.cover}
          alt={book.title}
        />

        {/* Informace o knize */}
        <div className="col-span-2 mt-4 md:mt-0">
          <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-[#800020]">
            {book.title}
          </h2>

          {/* Hodnocení hvězdičkami */}
          <div className="flex items-center mb-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <svg
                key={index}
                className={`w-7 h-7 ${
                  index < Math.round(averageRating)
                    ? "text-[#800020]"
                    : "text-gray-300"
                } me-1`}
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 22 20"
              >
                <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
              </svg>
            ))}
            <p className="ms-1 text-sm font-medium text-gray-600">
              {averageRating.toFixed(1)} z 5
            </p>
          </div>

          <i className="text-gray-700">{book.author}</i>

          <div>
            <p
              className="mb-2 font-light text-gray-700 md:text-lg"
              dangerouslySetInnerHTML={{ __html: renderDescription() }}
            ></p>
            {book.description.length > MAX_LENGTH && (
              <button
                onClick={toggleExpanded}
                className="text-[#800020] hover:underline font-medium"
              >
                {isExpanded ? "Zobrazit méně" : "Zobrazit více"}
              </button>
            )}
          </div>

          {/* Další informace */}
          <div className="mt-2 text-gray-800">
            <span className="font-bold text-[#800020]">{book.publisher}</span> ·
            <span className="ml-2">
              {new Date(book.publishedDate).toLocaleDateString()}
            </span>
            <br />
            <span>{book.pageCount} stran</span>
            <br />
            <div className="flex items-center">
              Jazyk:&nbsp;
              <img
                src={`https://flagcdn.com/w40/${countryCode}.png`}
                alt={book.language}
                className="w-5 h-4 ml-1"
              />
            </div>
          </div>

          {/* Akční tlačítka */}
          <div className="mt-4">
            <a
              href="#"
              onClick={() =>
                isInFavorites
                  ? handleRemoveFromList("favorite")
                  : handleAddToList("favorite")
              }
              className={`inline-flex items-center m-2 text-white ${
                isInFavorites ? "bg-orange-600" : "bg-[#800020]"
              } hover:bg-[#5a0014] focus:ring-4 focus:ring-[#800020] font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-all shadow-md hover:shadow-lg`}
            >
              <FaHeart className="mr-2" />
              {isInFavorites ? "V oblíbených" : "Přidat do oblíbených"}
            </a>

            <a
              href="#"
              onClick={() =>
                isInToRead
                  ? handleRemoveFromList("toread")
                  : handleAddToList("toread")
              }
              className={`inline-flex items-center m-2 text-white ${
                isInToRead ? "bg-orange-600" : "bg-[#800020]"
              } hover:bg-[#5a0014] focus:ring-4 focus:ring-[#800020] font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-all shadow-md hover:shadow-lg`}
            >
              <FaBook className="mr-2" />
              {isInToRead ? "V ToRead" : "Přidat do ToRead"}
            </a>
          </div>

          {/* Žánry */}
          {book.genres && book.genres.length > 0 ? (
            <div className="mt-3">
              <h3 className="text-lg font-semibold text-[#800020]">
                📚 Žánry:
              </h3>
              <ul className="flex flex-wrap gap-2 mt-2">
                {book.genres.map((genre, index) => (
                  <li
                    key={index}
                    className="bg-gray-200 text-gray-800 px-3 py-1 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-300 transition"
                  >
                    {genre}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-600 italic mt-3">Žánry nejsou dostupné.</p>
          )}
        </div>
      </div>

      {/* Detaily autora */}
      {book.authorDetails && (
        <div className="mt-8 p-6 bg-white border  rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-[#800020] border-b border-[#800020] pb-2 mb-4">
            O autorovi
          </h2>

          <div className="flex items-center gap-6">
            {book.authorDetails.thumbnail && (
              <img
                src={book.authorDetails.thumbnail}
                alt="Author"
                className="w-28 h-32 rounded-lg shadow-md border border-[#800020]"
              />
            )}
            <p className="text-gray-700 leading-relaxed flex-1">
              {book.authorDetails.summary}
            </p>
          </div>

          {book.authorDetails.wikipediaLink && (
            <a
              href={book.authorDetails.wikipediaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-[#800020] hover:text-[#5a0014] font-medium transition-all"
            >
              📖 Přečtěte si více na Wikipedii
            </a>
          )}
        </div>
      )}

      {/* Dynamické hodnocení hvězd */}
      <div className="mt-8 p-6 bg-white border border-gray-200 rounded-xl shadow-lg">
        <div className="flex items-center mb-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <svg
              key={index}
              className={`w-7 h-7 ${
                index < Math.round(averageRating)
                  ? "text-red-800"
                  : "text-gray-300"
              } me-1`}
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 22 20"
            >
              <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
            </svg>
          ))}
          <p className="ms-1 text-sm font-medium text-gray-500">
            {averageRating.toFixed(1)} z 5
          </p>
        </div>
        <p className="text-sm font-medium text-gray-500">
          {totalReviews === 0
            ? "No reviews yet"
            : `${totalReviews} ${totalReviews === 1 ? "review" : "reviews"}`}
        </p>

        {/* Dynamické rozložení hodnocení */}
        {ratingsBreakdown.map((rating, index) => (
          <div className="flex items-center mt-4" key={index}>
            <span className="text-sm font-medium text-red-800 hover:underline">
              {rating.stars} star
            </span>
            <div className="w-2/4 h-5 mx-4 bg-gray-200 rounded">
              <div
                className="h-5 bg-red-800 rounded"
                style={{ width: `${rating.percentage}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-500">
              {rating.count} ({rating.percentage.toFixed(1)}%)
            </span>
          </div>
        ))}

        <section className="bg-white py-8 antialiased md:py-16">
          <div className="mx-auto max-w-screen-xl px-4">
            {isLoggedIn && !userReview ? (
              <div className="mt-6 border-t border-gray-400 pt-6">
                <h2 className="text-2xl font-bold text-[#800020]">
                  Přidat recenzi
                </h2>
                <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
                  {/* Hodnocení */}
                  <div>
                    <label className="block text-gray-900 font-semibold text-lg">
                      Hodnocení:
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <svg
                          key={rating}
                          className={`h-7 w-7 cursor-pointer transition-colors duration-200 ${
                            newReview.rating >= rating
                              ? "text-[#800020]"
                              : "text-gray-400 hover:text-[#a52a2a]"
                          }`}
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          onClick={() => setNewReview({ ...newReview, rating })}
                        >
                          <path d="M13.849 4.22c-.684-1.626-3.014-1.626-3.698 0L8.397 8.387l-4.552.361c-1.775.14-2.495 2.331-1.142 3.477l3.468 2.937-1.06 4.392c-.413 1.713 1.472 3.067 2.992 2.149L12 19.35l3.897 2.354c1.52.918 3.405-.436 2.992-2.15l-1.06-4.39 3.468-2.938c1.353-1.146.633-3.336-1.142-3.477l-4.552-.36-1.754-4.17Z" />
                        </svg>
                      ))}
                    </div>
                  </div>

                  {/* Recenze */}
                  <div>
                    <label className="block text-gray-900 font-semibold text-lg">
                      Recenze:
                    </label>
                    <textarea
                      placeholder="Napište svou recenzi zde..."
                      value={newReview.comment}
                      onChange={(e) =>
                        setNewReview({ ...newReview, comment: e.target.value })
                      }
                      className="border-2 border-[#800020] focus:border-[#5a0014] focus:ring-2 focus:ring-[#800020] p-3 w-full rounded-lg mt-1 outline-none transition-all duration-200 bg-gray-50 text-gray-900"
                    />
                  </div>

                  {/* Tlačítko */}
                  <button
                    type="submit"
                    className="bg-[#800020] hover:bg-[#5a0014] text-white font-bold px-5 py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Zveřejnit recenzi
                  </button>
                </form>
              </div>
            ) : isLoggedIn && userReview ? (
              <p className="text-green-500 mt-6">
                Pro tuto knihu jste již napsal/a recenzi.
              </p>
            ) : (
              <p className="text-red-500 mt-6">
                Přihlaste se, abyste mohli přidat recenzi.
              </p>
            )}

            <h2 className="text-2xl font-bold text-[#800020] mt-6">
              Všechny recenze
            </h2>
            <div className="mt-6 border-t border-gray-300 pt-6 space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-start gap-4 pb-6 border-b border-gray-300 transition-transform duration-300 hover:scale-105"
                >
                  {/* Profilový obrázek */}
                  <div
                    className={`w-14 h-14 flex-shrink-0 rounded-full overflow-hidden border-2 transition-all ${
                      review.authorProfile
                        ? "border-[#800020] cursor-pointer hover:shadow-lg"
                        : "border-gray-500"
                    }`}
                    onClick={() => {
                      if (review.authorProfile)
                        navigate(`/profile/${review.author_zub}`);
                    }}
                  >
                    {review.authorProfile ? (
                      <img
                        src={review.authorProfile.profile_picture}
                        alt={review.authorProfile.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-gray-300">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-8 h-8 text-gray-600"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 12c2.75 0 5-2.25 5-5s-2.25-5-5-5-5 2.25-5 5 2.25 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Informace o recenzi */}
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      {/* Hvězdičky hodnocení */}
                      {[...Array(review.rating)].map((_, i) => (
                        <svg
                          key={i}
                          className="h-5 w-5 text-[#800020]"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 17.75l-5.95 3.13 1.14-6.64L2.5 9.37l6.67-.97L12 2.5l2.83 5.9 6.67.97-4.82 4.87 1.14 6.64z" />
                        </svg>
                      ))}
                    </div>

                    
                    <p
                      className={`text-base font-semibold transition ${
                        review.authorProfile
                          ? "text-[#800020] cursor-pointer hover:underline"
                          : "text-gray-900"
                      }`}
                      onClick={() => {
                        if (review.authorProfile)
                          navigate(`/profile/${review.author_zub}`);
                      }}
                    >
                      {review.authorProfile?.username ||
                        "Recenze ze spsul knihovny"}
                    </p>

                    
                    <p className="text-sm text-gray-500">
                      {new Date(review.created).toLocaleString()}
                    </p>

                   
                    <p className="text-gray-800 mt-2">{review.text}</p>

                   
                    {isLoggedIn && review.author_zub === userId && (
                      <button
                        onClick={() => handleReviewDelete(review.id)}
                        className="bg-[#800020] hover:bg-[#5a0014] text-white px-3 py-1 mt-2 rounded transition shadow-md hover:shadow-lg"
                      >
                        Smazat
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BookDetails;
