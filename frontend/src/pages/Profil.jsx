import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import defaultProfilePic from "../assets/user_icon.png";
import Cover from "../assets/cover.png";
import { FaArrowUp, FaArrowDown, FaTrash } from "react-icons/fa";
import pb from "../lib/pocketbase.js";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("seznamy"); // Výchozí tab
  const { id } = useParams(); // Získání ID z URL
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [canEdit, setCanEdit] = useState(false); // Přidáme kontrolu pro úpravy
  const [favorites, setFavorites] = useState([]);
  const [toRead, setToRead] = useState([]);
  const [formData, setFormData] = useState({
    username: "",
    description: "",
    profile_picture: "",
  });
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [userVotes, setUserVotes] = useState({});
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Načtení profilu uživatele
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL_LOCAL}/api/auth/profile/${id}`,
          {
            withCredentials: true,
          }
        );

        setUser(response.data.profile);
        setCanEdit(response.data.canEdit); // Nastavení možnosti editace
        setFormData({
          username: response.data.profile.username,
          description: response.data.profile.description || "",
          profile_picture: response.data.profile.profile_picture || "",
          created_at: response.data.profile.created_at,
        });

        // Paralelní načtení knih a příspěvků
        await Promise.all([fetchUserBooks(), fetchUserPosts()]);
      } catch (err) {
        setError("Nepodařilo se načíst profil.");
        navigate("/Login");
      }
    };

    const fetchUserPosts = async () => {
      try {
        const postResponse = await axios.get(
          `${import.meta.env.VITE_API_URL_LOCAL}/api/posts/user/${id}`
        );
        setPosts(postResponse.data);
      } catch (err) {
        console.error("Chyba při načítání příspěvků:", err);
      }
    };

    fetchUserData();
  }, [id, navigate]);

  const fetchUserReviews = async () => {
    try {
      // Fetch pouze schválených recenzí pro daného uživatele
      const reviews = await pb.collection("reviews").getFullList({
        filter: `author_zub=${id}`, // Vynechání author_zub pro test
        expand: "authorProfile",
      });

      console.log("📌 Všechny schválené recenze:", reviews);

      setReviews(reviews);
      console.log("Recenze načteny:", reviews);
    } catch (error) {
      console.error("Chyba při načítání recenzí:", error);
    }
  };
  useEffect(() => {
    if (activeTab === "recenze") {
      fetchUserReviews();
    }
  }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const fetchUserBooks = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/user-books/profile/${id}/books`,
        {
          withCredentials: true,
        }
      );
      setFavorites(response.data.favorites);
      setToRead(response.data.toread);
    } catch (error) {
      console.error("Error fetching user books:", error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profile_picture: file });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("username", formData.username);
      formDataToSend.append("description", formData.description);
      if (formData.profile_picture instanceof File) {
        formDataToSend.append("profile_picture", formData.profile_picture);
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/auth/profile/${id}`,
        formDataToSend,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setUser(response.data);
      setIsEditing(false);
    } catch (err) {
      setError("Nepodařilo se uložit změny. Zkuste to prosím znovu.");
    }
  };

  const handleRemoveBook = async (bookId, listType) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/user-books/profile/${id}/books`,
        {
          data: { userId: id, bookId, listType },
          withCredentials: true,
        }
      );

      // Aktualizace seznamu na frontendu
      if (listType === "favorite") {
        setFavorites(
          favorites.filter((book) => book.google_books_id !== bookId)
        );
      } else if (listType === "toread") {
        setToRead(toRead.filter((book) => book.google_books_id !== bookId));
      }

      alert("Kniha byla úspěšně odebrána ze seznamu.");
    } catch (error) {
      console.error("Error removing book:", error);
      alert("Chyba při odebírání knihy.");
    }
  };

  if (error) {
    return <p className="text-red-500 text-center mt-4">{error}</p>;
  }

  if (!user) {
    return <p className="text-gray-500 text-center mt-4">Načítání...</p>;
  }

  return (
    <section className="relative pt-40 pb-24 px-5">
      <img
        src={Cover}
        alt="cover-image"
        className="w-full absolute top-0 left-0 z-0 h-60 object-cover rounded-lg shadow-lg"
      />
      <div className="w-full max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex items-center justify-center sm:justify-start relative z-10 mb-5">
          <div className="relative group">
            {/* Vnější kruh (gradient + jemná záře) */}
            <div className="absolute inset-0 w-28 h-28 rounded-full bg-gradient-to-tr from-[#5a0014] to-[#800020] opacity-90 group-hover:opacity-100 transition duration-300 blur-md"></div>

            {/* Profilovka */}
            <img
              src={user.profile_picture || defaultProfilePic}
              alt="user-avatar-image"
              className="w-24 h-24 rounded-full object-cover border-4 border-[#800020] shadow-lg transition-transform duration-300 transform group-hover:scale-110 group-hover:shadow-2xl"
            />
          </div>
        </div>

        <div className="flex items-center justify-center flex-col sm:flex-row max-sm:gap-5 sm:justify-between mb-20">
          {isEditing ? (
            <form
              onSubmit={handleFormSubmit}
              className="space-y-6 w-full max-w-lg bg-white shadow-lg rounded-lg p-6 border border-[#800020] animate-fade-in"
            >
              <div>
                <label
                  htmlFor="username"
                  className="block font-medium text-gray-700"
                >
                  Uživatelské jméno
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-[#800020] rounded-md shadow-sm p-2 transition-all focus:ring-2 focus:ring-[#800020] focus:border-[#800020]"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block font-medium text-gray-700"
                >
                  Popis
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-[#800020] rounded-md shadow-sm p-2 transition-all focus:ring-2 focus:ring-[#800020] focus:border-[#800020]"
                />
              </div>

              <div>
                <label
                  htmlFor="profile_picture"
                  className="block font-medium text-gray-700"
                >
                  Profilová fotka
                </label>
                <input
                  type="file"
                  id="profile_picture"
                  onChange={handleFileChange}
                  className="mt-1 block w-full border border-[#800020] rounded-md p-2 bg-gray-50 cursor-pointer file:bg-[#800020] file:text-white file:rounded-md file:py-1 file:px-2 file:border-none hover:file:bg-[#5a0014] transition"
                />
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-2 px-4 bg-gray-400 text-white rounded-md transition-all hover:bg-gray-500"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-[#800020] text-white rounded-md transition-all hover:bg-[#5a0014] transform hover:scale-105"
                >
                  Uložit
                </button>
              </div>
            </form>
          ) : (
            <div className="block animate-fade-in">
              <h3 className="font-manrope font-bold text-4xl text-[#800020] mb-1 max-sm:text-center transition-all duration-300 hover:scale-105">
                {user.username}
              </h3>
              <p className="font-normal text-base leading-7 text-gray-500 max-sm:text-center">
                {user.email}
              </p>
              <p className="font-normal text-base leading-7 text-gray-500 max-sm:text-center pt-4">
                {user.description || "Žádný popis."}
              </p>
              <p className="pt-2">
                Členem od:{" "}
                {new Date(user.created_at).toLocaleDateString("cs-CZ", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 py-2 px-4 bg-[#800020] text-white rounded-md transition-all hover:bg-[#5a0014] transform hover:scale-105"
                >
                  Upravit profil
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigační lišta */}
      <ul className="flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-[#800020]">
        <li className="me-2">
          <button
            onClick={() => setActiveTab("seznamy")}
            className={`inline-block p-4 rounded-t-lg ${
              activeTab === "seznamy"
                ? "text-[#800020] bg-gray-100"
                : "hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            Seznamy knih
          </button>
        </li>
        <li className="me-2">
          <button
            onClick={() => setActiveTab("prispevky")}
            className={`inline-block p-4 rounded-t-lg ${
              activeTab === "prispevky"
                ? "text-[#800020] bg-gray-100"
                : "hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            Příspěvky
          </button>
        </li>
        <li className="me-2">
          <button
            onClick={() => setActiveTab("recenze")}
            className={`inline-block p-4 rounded-t-lg ${
              activeTab === "recenze"
                ? "text-[#800020] bg-gray-100"
                : "hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            Recenze
          </button>
        </li>
      </ul>

      {/* Obsah podle aktivní záložky */}
      <div className="p-4">
        {activeTab === "seznamy" && (
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Oblíbené knihy
            </h3>
            {favorites.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-4 justify-center">
                {favorites.map((book) => (
                  <div
                    key={book.google_books_id}
                    className="relative group w-40 h-72 rounded-lg overflow-hidden shadow-md"
                  >
                    {/* Obálka knihy jako pozadí */}
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="absolute inset-0 w-full h-full object-cover transform transition duration-300 group-hover:scale-105"
                    />

                    {/* Tmavý gradient pro lepší čitelnost */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>

                    {/* Text a tlačítko */}
                    <div className="absolute bottom-0 left-0 w-full p-3 text-white flex flex-col items-center text-center">
                      <h4 className="text-sm font-semibold leading-tight">
                        <Link
                          to={`/books/${book.google_books_id}`}
                          className="hover:underline"
                        >
                          {book.title}
                        </Link>
                      </h4>
                      <p className="text-xs opacity-90">{book.author}</p>
                      <button
                        onClick={() =>
                          handleRemoveBook(book.google_books_id, "favorite")
                        }
                        className="mt-2 bg-red-600 text-white px-3 py-1 rounded-md text-xs hover:bg-red-700 transition opacity-0 group-hover:opacity-100"
                      >
                        Odebrat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Žádné oblíbené knihy.</p>
            )}

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-6">
              ToRead seznam
            </h3>
            {toRead.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-4 justify-center">
                {toRead.map((book) => (
                  <div
                    key={book.google_books_id}
                    className="relative group w-40 h-72 rounded-lg overflow-hidden shadow-md"
                  >
                    {/* Obálka knihy jako pozadí */}
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="absolute inset-0 w-full h-full object-cover transform transition duration-300 group-hover:scale-105"
                    />

                    {/* Tmavý gradient pro lepší čitelnost */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>

                    {/* Text a tlačítko */}
                    <div className="absolute bottom-0 left-0 w-full p-3 text-white flex flex-col items-center text-center">
                      <h4 className="text-sm font-semibold leading-tight">
                        <Link
                          to={`/books/${book.google_books_id}`}
                          className="hover:underline"
                        >
                          {book.title}
                        </Link>
                      </h4>
                      <p className="text-xs opacity-90">{book.author}</p>
                      <button
                        onClick={() =>
                          handleRemoveBook(book.google_books_id, "toread")
                        }
                        className="mt-2 bg-red-600 text-white px-3 py-1 rounded-md text-xs hover:bg-red-700 transition opacity-0 group-hover:opacity-100"
                      >
                        Odebrat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Žádné knihy v seznamu ToRead.</p>
            )}
          </div>
        )}
        {activeTab === "prispevky" && (
          <>
            <h2 className="text-2xl font-semibold mb-4">Příspěvky</h2>
            {posts.length > 0 ? (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="border p-5 rounded-lg mb-6 shadow-md bg-gray-50 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/posts/${post.id}`)}
                >
                  {/* Profilová fotka a uživatelské jméno */}
                  <div className="flex items-center mb-4">
                    <img
                      src={post.profile_picture || "/default-avatar.png"} // Defaultní avatar, pokud není profilová fotka
                      alt={post.username}
                      className="w-10 h-10 rounded-full border border-gray-300 mr-3"
                    />
                    <div>
                      <p className="font-bold text-gray-800">{post.username}</p>
                      <p className="text-gray-500 text-sm">
                        {new Date(post.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Obsah příspěvku */}
                  <h2 className="text-xl font-semibold text-gray-900 leading-tight mb-2">
                    {post.content}
                  </h2>

                  {/* Upvotes/Downvotes */}
                  <div className="flex items-center space-x-4 text-gray-600 mt-3">
                    <div className="flex items-center space-x-2">
                      <FaArrowUp className="text-green-500" />
                      <span>{post.upvotes}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaArrowDown className="text-red-500" />
                      <span>{post.downvotes}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>Tento uživatel zatím nemá žádné příspěvky.</p>
            )}
          </>
        )}
        {activeTab === "recenze" && (
          <div className="mt-6 border-t border-gray-300 pt-6 space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-start gap-4 pb-6 border-b border-gray-300 transition-transform duration-300 hover:scale-105"
                >
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

                  <div className="flex-1">
                    <div className="flex items-center gap-1">
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
                      {review.title }
                    </p>

                    <p className="text-sm text-gray-500">
                      {new Date(review.created).toLocaleString()}
                    </p>

                    <p className="text-gray-800 mt-2">{review.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Žádné recenze.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
