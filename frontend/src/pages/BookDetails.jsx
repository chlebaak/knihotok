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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

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

  const showToastMessage = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 6000);
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
        `${import.meta.env.VITE_API_URL_LOCAL}/api/books/${id}`
      );
      setBook(bookResponse.data);

      const title = bookResponse.data.title;
      if (title) {
        console.log("Hledám recenze pro knihu:", title);

        let reviewsData = [];

        try {
          const escapedTitle = title.replace(/"/g, '\\"');
          console.log(
            "Zkouším přesnou shodu:",
            `title="${escapedTitle}" && approved=true`
          );

          const exactMatchReviews = await pb.collection("reviews").getFullList({
            filter: `title="${escapedTitle}" && approved=true`,
          });

          console.log(
            `Nalezeno ${exactMatchReviews.length} recenzí při přesné shodě`
          );

          if (exactMatchReviews.length > 0) {
            reviewsData = exactMatchReviews;
          } else {
            if (title.length < 10) {
              console.log("Zkouším částečnou shodu pro krátký název");

              const partialMatchReviews = await pb
                .collection("reviews")
                .getFullList({
                  filter: `title~"${escapedTitle}" && approved=true`,
                });

              console.log(
                `Nalezeno ${partialMatchReviews.length} recenzí při částečné shodě`
              );

              if (partialMatchReviews.length > 0) {
                reviewsData = partialMatchReviews;
              }
            }

            if (reviewsData.length === 0 && book.author) {
              const escapedAuthor = book.author.replace(/"/g, '\\"');
              console.log("Zkouším vyhledávání podle autora:", escapedAuthor);

              const authorReviews = await pb.collection("reviews").getFullList({
                filter: `authors~"${escapedAuthor}" && title~"${escapedTitle}" && approved=true`,
              });

              console.log(
                `Nalezeno ${authorReviews.length} recenzí podle autora a názvu`
              );

              if (authorReviews.length > 0) {
                reviewsData = authorReviews;
              }
            }

            if (reviewsData.length === 0 && id) {
              console.log("Zkouším vyhledávání podle ID knihy:", id);

              const bookIdReviews = await pb.collection("reviews").getFullList({
                filter: `book="${id}" && approved=true`,
              });

              console.log(
                `Nalezeno ${bookIdReviews.length} recenzí podle ID knihy`
              );

              if (bookIdReviews.length > 0) {
                reviewsData = bookIdReviews;
              }
            }

            if (
              reviewsData.length === 0 &&
              (title === "1984" || title.includes("1984"))
            ) {
              console.log("Zkouším speciální vyhledávání pro knihu 1984");

              const specialCaseReviews = await pb
                .collection("reviews")
                .getFullList({
                  filter: `title="1984" || title~"1984" && approved=true`,
                });

              console.log(
                `Nalezeno ${specialCaseReviews.length} recenzí pro specifický případ 1984`
              );

              if (specialCaseReviews.length > 0) {
                reviewsData = specialCaseReviews;
              }
            }
          }

          if (reviewsData.length > 0) {
            const reviewsWithProfiles = await Promise.all(
              reviewsData.map(async (review) => {
                if (review.author_zub) {
                  try {
                    const userResponse = await axios.get(
                      `${import.meta.env.VITE_API_URL_LOCAL}/api/users/${
                        review.author_zub
                      }`,
                      { withCredentials: true }
                    );
                    return {
                      ...review,
                      authorProfile: userResponse.data,
                    };
                  } catch (error) {
                    console.warn(
                      `Could not fetch user data for review:`,
                      error
                    );
                    return {
                      ...review,
                      authorProfile: null,
                    };
                  }
                }
                return {
                  ...review,
                  authorProfile: null,
                };
              })
            );

            setReviews(reviewsWithProfiles);
            updateReviewStats(reviewsWithProfiles);

            if (userId) {
              const existingReview = reviewsWithProfiles.find(
                (review) => review.author_zub === userId
              );
              setUserReview(existingReview || null);
            }
          } else {
            console.log("Nepodařilo se najít žádné recenze pro knihu", title);
            setReviews([]);
            setAverageRating(0);
            setTotalReviews(0);
            setRatingsBreakdown([]);
          }
        } catch (error) {
          console.error("Chyba při načítání recenzí:", error);
          showToastMessage(
            "Nepodařilo se načíst recenze nebo žádné nejsou napsané.",
            "danger"
          );
        }
      }
    } catch (error) {
      console.error("Error fetching book details:", error);
      showToastMessage("Nepodařilo se načíst detaily knihy.", "danger");
    }
  };

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
        `${import.meta.env.VITE_API_URL_LOCAL}/api/auth/profile`,
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
        `${import.meta.env.VITE_API_URL_LOCAL}/api/auth/profile`,
        {
          withCredentials: true,
        }
      );
      const userId = userResponse.data.id;

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/user-books/${userId}/${id}`,
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
      showToastMessage("Review text cannot be empty!", "danger");
      return;
    }

    if (userReview) {
      showToastMessage("You can only submit one review per book.", "danger");
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
      showToastMessage("Review successfully added!");
    } catch (error) {
      console.error("Error submitting review:", error);
      showToastMessage(
        "Failed to submit the review. Please try again.",
        "danger"
      );
    }
  };

  const handleReviewDelete = async (reviewId) => {
    try {
      await axios.delete(
        `https://db.ladislavpokorny.cz/api/collections/reviews/records/${reviewId}`
      );

      await fetchBookDetails(userId);

      showToastMessage("Review deleted successfully.", "danger");
    } catch (error) {
      console.error("Error deleting review:", error);
      showToastMessage(
        "Failed to delete the review. Please try again.",
        "danger"
      );
    }
  };

  if (!book) {
    return (
      <div className="bg-gray-50 min-h-screen pt-16 pb-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-[#800020]/10 to-[#aa0030]/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-5 -left-5 w-32 h-32 bg-gradient-to-tr from-[#800020]/10 to-[#aa0030]/5 rounded-full blur-3xl"></div>

            <div className="relative inline-block">
              <div className="relative w-32 h-44 mx-auto mb-6 animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-r from-[#800020] to-[#aa0030] rounded-md shadow-xl"></div>
                <div className="absolute inset-0 bg-white opacity-30 rounded-r-md transform translate-x-2"></div>
                <div className="absolute left-0 h-full w-[3px] bg-gradient-to-b from-white/40 via-white/10 to-white/40 rounded"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <svg
                    className="w-16 h-16 text-white/80 animate-bounce"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            <span className="block text-[#800020]">Kniha se načítá</span>
          </h1>

          <div className="mt-8 max-w-xl mx-auto">
            <div className="space-y-4 animate-pulse">
              <div className="h-7 bg-gray-200 rounded-lg w-3/4 mx-auto"></div>

              <div className="flex justify-center space-x-1">
                {[...Array(5)].map((_, index) => (
                  <div
                    key={index}
                    className="w-6 h-6 rounded-full bg-gray-200"
                  ></div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-full mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>

              <div className="flex justify-center space-x-4 mt-6">
                <div className="h-10 bg-gray-200 rounded w-1/3"></div>
                <div className="h-10 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex justify-center">
            <div className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-[#800020] bg-white shadow-sm animate-pulse">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#800020]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Načítáme detaily knihy...
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleAddToList = async (listType) => {
    try {
      const userResponse = await axios.get(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/auth/profile`,
        {
          withCredentials: true,
        }
      );
      const userId = userResponse.data.id;

      await axios.post(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/user-books`,
        {
          userId: userId, // Změň na dynamické ID uživatele
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
      const userResponse = await axios.get(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/auth/profile`,
        {
          withCredentials: true,
        }
      );
      const userId = userResponse.data.id;
      await axios.delete(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/user-books`,
        {
          data: {
            userId: userId,
            bookId: id,
            listType,
          },
          withCredentials: true,
        }
      );

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
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
          {toastType === "success" ? (
            <div
              id="toast-success"
              className="flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow animate-slide-in"
              role="alert"
            >
              <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-green-500 bg-green-100 rounded-lg">
                <svg
                  className="w-5 h-5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                </svg>
                <span className="sr-only">Check icon</span>
              </div>
              <div className="ms-3 text-sm font-normal">{toastMessage}</div>
              <button
                type="button"
                className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8"
                onClick={() => setShowToast(false)}
                aria-label="Close"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="w-3 h-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 14"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <div
              id="toast-danger"
              className="flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow animate-slide-in"
              role="alert"
            >
              <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-red-500 bg-red-100 rounded-lg">
                <svg
                  className="w-5 h-5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
                </svg>
                <span className="sr-only">Error icon</span>
              </div>
              <div className="ms-3 text-sm font-normal">{toastMessage}</div>
              <button
                type="button"
                className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8"
                onClick={() => setShowToast(false)}
                aria-label="Close"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="w-3 h-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 14"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
      <Search />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
              {/* Book Cover Section */}
              <div className="md:col-span-4 lg:col-span-3">
                {book.cover ? (
                  <div className="relative group">
                    <div className="absolute inset-0 bg-[#800020] opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl"></div>
                    <img
                      className="w-full rounded-xl shadow-lg border-2 border-[#800020]/20 transition-transform duration-300 group-hover:scale-[1.02]"
                      src={book.cover}
                      alt={book.title}
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="relative rounded-xl shadow-lg border-2 border-[#800020]/20 aspect-[2/3] bg-gradient-to-br from-[#800020] to-[#aa0030] text-white p-6">
                    <div className="absolute inset-0 bg-black/5"></div>
                    <div className="relative flex flex-col h-full">
                      <div className="text-4xl font-bold text-center mb-6">
                        {book.title
                          .split(" ")
                          .map((word) => word[0])
                          .slice(0, 3)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="w-full border-t border-white/20 my-4"></div>
                      <div className="text-xl text-center font-medium">
                        {book.title.length > 30
                          ? book.title.substring(0, 30) + "..."
                          : book.title}
                      </div>
                      <div className="mt-auto text-sm text-white/70 text-center">
                        {book.author?.split(",")[0] || ""}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Book Info Section */}
              <div className="md:col-span-8 lg:col-span-9">
                <h1 className="text-3xl sm:text-4xl font-bold text-[#800020] mb-4">
                  {book.title}
                </h1>

                {/* Rating Section */}
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <svg
                        key={index}
                        className={`w-6 h-6 ${
                          index < Math.round(averageRating)
                            ? "text-[#800020]"
                            : "text-gray-200"
                        } transition-colors duration-200`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-600">
                    {averageRating.toFixed(1)} z 5 ({totalReviews} hodnocení)
                  </span>
                </div>

                {/* Author */}
                <p className="text-xl text-gray-700 mb-6">
                  <span className="font-medium">Autor:</span> {book.author}
                </p>

                {/* Description */}
                <div className="prose prose-sm sm:prose lg:prose-lg max-w-none mb-6">
                  <div
                    className="text-gray-600"
                    dangerouslySetInnerHTML={{ __html: renderDescription() }}
                  />
                  {book.description.length > MAX_LENGTH && (
                    <button
                      onClick={toggleExpanded}
                      className="text-[#800020] hover:text-[#aa0030] font-medium transition-colors duration-200"
                    >
                      {isExpanded ? "Zobrazit méně ↑" : "Zobrazit více ↓"}
                    </button>
                  )}
                </div>

                {/* Book Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <p className="flex items-center text-gray-700">
                      <span className="font-medium mr-2">Vydavatel:</span>
                      <span className="text-[#800020]">{book.publisher}</span>
                    </p>
                    <p className="flex items-center text-gray-700">
                      <span className="font-medium mr-2">Datum vydání:</span>
                      {new Date(book.publishedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="flex items-center text-gray-700">
                      <span className="font-medium mr-2">Počet stran:</span>
                      {book.pageCount}
                    </p>
                    <p className="flex items-center text-gray-700">
                      <span className="font-medium mr-2">Jazyk:</span>
                      <img
                        src={`https://flagcdn.com/w40/${countryCode}.png`}
                        alt={book.language}
                        className="w-5 h-4 ml-1"
                      />
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() =>
                      isInFavorites
                        ? handleRemoveFromList("favorite")
                        : handleAddToList("favorite")
                    }
                    className={`
                flex items-center px-6 py-3 rounded-xl font-medium text-sm
                transition-all duration-300 transform hover:scale-105
                ${
                  isInFavorites
                    ? "bg-orange-600 text-white hover:bg-orange-700"
                    : "bg-[#800020] text-white hover:bg-[#aa0030]"
                }
                shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800020]
              `}
                  >
                    <FaHeart
                      className={`mr-2 ${isInFavorites ? "animate-pulse" : ""}`}
                    />
                    {isInFavorites ? "V oblíbených" : "Přidat do oblíbených"}
                  </button>

                  <button
                    onClick={() =>
                      isInToRead
                        ? handleRemoveFromList("toread")
                        : handleAddToList("toread")
                    }
                    className={`
                flex items-center px-6 py-3 rounded-xl font-medium text-sm
                transition-all duration-300 transform hover:scale-105
                ${
                  isInToRead
                    ? "bg-orange-600 text-white hover:bg-orange-700"
                    : "bg-[#800020] text-white hover:bg-[#aa0030]"
                }
                shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800020]
              `}
                  >
                    <FaBook className="mr-2" />
                    {isInToRead ? "V ToRead" : "Přidat do ToRead"}
                  </button>
                </div>

                {/* Genres */}
                {book.genres && book.genres.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-[#800020] mb-3 flex items-center">
                      <span className="mr-2">📚</span> Žánry
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {book.genres.map((genre, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium
                             hover:bg-[#800020]/10 transition-colors duration-200 cursor-pointer"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {book.authorDetails && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200/50">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center space-x-3 mb-6">
                <span className="text-2xl">👤</span>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[#800020] to-[#aa0030] bg-clip-text text-transparent">
                  O autorovi
                </h2>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                {/* Author Image/Placeholder */}
                <div className="flex-shrink-0">
                  {book.authorDetails.thumbnail ? (
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#800020] to-[#aa0030] rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                      <div className="relative">
                        <img
                          src={book.authorDetails.thumbnail}
                          alt={`Autor ${book.author}`}
                          className="w-32 h-40 rounded-xl shadow-lg object-cover border-2 border-white transition-transform duration-300 group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-32 h-40 rounded-xl overflow-hidden relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#800020] to-[#aa0030] opacity-90"></div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                        <div className="text-3xl font-bold">
                          {book.author
                            ?.split(" ")
                            .map((word) => word[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase() || "A"}
                        </div>
                        <div className="mt-2 text-sm text-white/80">Autor</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Author Info */}
                <div className="flex-1 space-y-4">
                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {book.authorDetails.summary}
                    </p>
                  </div>

                  {book.authorDetails.wikipediaLink && (
                    <a
                      href={book.authorDetails.wikipediaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
                         text-[#800020] bg-[#800020]/5 hover:bg-[#800020]/10
                         transition-all duration-300 group"
                    >
                      <span className="mr-2 transition-transform duration-300 group-hover:scale-110">
                        📖
                      </span>
                      <span className="relative">
                        Přečtěte si více na Wikipedii
                        <span className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-[#800020] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                      </span>
                      <svg
                        className="ml-2 w-4 h-4 transform transition-transform duration-300 group-hover:translate-x-1"
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
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            {/* Rating Summary */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
              <div className="flex flex-col items-start">
                <div className="flex items-center">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <svg
                        key={index}
                        className={`w-8 h-8 ${
                          index < Math.round(averageRating)
                            ? "text-[#800020]"
                            : "text-gray-200"
                        } transition-colors duration-200`}
                        viewBox="0 0 22 20"
                        fill="currentColor"
                      >
                        <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-3 text-2xl font-bold text-gray-900">
                    {averageRating.toFixed(1)}
                    <span className="text-base font-normal text-gray-500 ml-1">
                      / 5
                    </span>
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-500 mt-1">
                  {totalReviews === 0
                    ? "Zatím bez hodnocení"
                    : `${totalReviews} ${
                        totalReviews === 1 ? "hodnocení" : "hodnocení"
                      }`}
                </p>
              </div>

              {/* Rating Breakdown */}
              <div className="w-full md:w-1/2 mt-6 md:mt-0">
                {ratingsBreakdown.map((rating, index) => (
                  <div className="flex items-center mb-2" key={index}>
                    <span className="w-20 text-sm font-medium text-gray-600">
                      {rating.stars} {rating.stars === 1 ? "hvězda" : "hvězdy"}
                    </span>
                    <div className="flex-1 h-3 mx-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#800020] rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${rating.percentage}%` }}
                      />
                    </div>
                    <span className="w-20 text-sm text-gray-500">
                      {rating.count} ({rating.percentage.toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Form */}
            {isLoggedIn && !userReview ? (
              <div className="mt-8 border-t border-gray-200 pt-8">
                <h2 className="text-2xl font-bold text-[#800020] mb-6">
                  Přidat recenzi
                </h2>
                <form onSubmit={handleReviewSubmit} className="space-y-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Hodnocení
                    </label>
                    <div className="flex items-center gap-3">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating })}
                          className={`relative group`}
                        >
                          <svg
                            className={`w-8 h-8 transition-all duration-200 ${
                              newReview.rating >= rating
                                ? "text-[#800020]"
                                : "text-gray-300 group-hover:text-[#800020]/50"
                            }`}
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M13.849 4.22c-.684-1.626-3.014-1.626-3.698 0L8.397 8.387l-4.552.361c-1.775.14-2.495 2.331-1.142 3.477l3.468 2.937-1.06 4.392c-.413 1.713 1.472 3.067 2.992 2.149L12 19.35l3.897 2.354c1.52.918 3.405-.436 2.992-2.15l-1.06-4.39 3.468-2.938c1.353-1.146.633-3.336-1.142-3.477l-4.552-.36-1.754-4.17Z" />
                          </svg>
                        </button>
                      ))}
                      <span className="text-sm text-gray-500 ml-2">
                        {newReview.rating} z 5
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Vaše recenze
                    </label>
                    <textarea
                      placeholder="Podělte se o své dojmy z knihy..."
                      value={newReview.comment}
                      onChange={(e) =>
                        setNewReview({ ...newReview, comment: e.target.value })
                      }
                      className="w-full min-h-[150px] px-4 py-3 border-2 border-gray-200 rounded-xl
                       focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/20
                       transition-all duration-200 text-gray-700 placeholder-gray-400"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent
                       text-base font-medium rounded-xl text-white bg-[#800020] 
                       hover:bg-[#5a0014] focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-[#800020] transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Zveřejnit recenzi
                  </button>
                </form>
              </div>
            ) : isLoggedIn && userReview ? (
              <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-green-700">
                  Pro tuto knihu jste již napsal/a recenzi.
                </p>
              </div>
            ) : (
              <div className="mt-8 p-4 bg-[#800020]/5 border border-[#800020]/20 rounded-xl">
                <p className="text-[#800020]">
                  Pro přidání recenze se prosím nejdříve přihlaste.
                </p>
              </div>
            )}

            {/* Reviews List */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                Recenze čtenářů
              </h2>
              <div className="space-y-8">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex gap-6 p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200"
                  >
                    <div
                      className={`relative group cursor-pointer`}
                      onClick={() => {
                        if (review.authorProfile)
                          navigate(`/profile/${review.author_zub}`);
                      }}
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#800020]">
                        {review.authorProfile ? (
                          <img
                            src={review.authorProfile.profile_picture}
                            alt={review.authorProfile.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-gray-400"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 12c2.75 0 5-2.25 5-5s-2.25-5-5-5-5 2.25-5 5 2.25 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium text-gray-900">
                          {review.authorProfile?.username ||
                            "Recenze ze SPSUL knihovny"}
                        </p>
                        <span className="text-gray-300">•</span>
                        <time className="text-sm text-gray-500">
                          {new Date(review.created).toLocaleDateString()}
                        </time>
                      </div>

                      <div className="flex items-center mb-3">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-5 h-5 ${
                              i < review.rating
                                ? "text-[#800020]"
                                : "text-gray-200"
                            }`}
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 17.75l-5.95 3.13 1.14-6.64L2.5 9.37l6.67-.97L12 2.5l2.83 5.9 6.67.97-4.82 4.87 1.14 6.64z" />
                          </svg>
                        ))}
                      </div>

                      <p className="text-gray-700 leading-relaxed">
                        {review.text}
                      </p>

                      {isLoggedIn && review.author_zub === userId && (
                        <button
                          onClick={() => handleReviewDelete(review.id)}
                          className="mt-4 inline-flex items-center text-sm font-medium text-[#800020] hover:text-[#5a0014]"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Smazat recenzi
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
