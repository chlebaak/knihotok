import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import defaultProfilePic from "../assets/user_icon.png";
import Cover from "../assets/cover.png";
import { FaArrowUp, FaArrowDown, FaTrash } from "react-icons/fa";
import pb from "../lib/pocketbase.js";
import rank1 from "../assets/rank1.png";
import rank2 from "../assets/rank2.png";
import rank3 from "../assets/rank3.png";
import rank4 from "../assets/rank4.png";
import rank5 from "../assets/rank5.png";

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
            "Content-Type": "multipart/form-daFta",
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

    // Obrázky pro různé úrovně
    const rankImages = {
      1: rank1,
      2: rank2,
      3: rank3,
      4: rank4,
      5: rank5
    };

  if (error) {
    return <p className="text-red-500 text-center mt-4">{error}</p>;
  }

  if (!user) {
    return <p className="text-gray-500 text-center mt-4">Načítání...</p>;
  }

  return (
    <section className="relative">
      {/* Hero sekce s obrázkem na pozadí */}
<div className="relative w-full">
  {/* Cover image s překryvným gradientem */}
  <div className="relative h-72 w-full overflow-hidden">
    <img
      src={Cover}
      alt="cover-image"
      className="w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-[#800020]/30 to-black/70"></div>
  </div>

  {/* Obsah profilu - s relativním positioningem */}
  <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Avatar sekce - vycentrována na mobilech, vlevo na větších obrazovkách */}
    <div className="relative -mt-16 mb-8 flex justify-center sm:justify-start">
      <div className="relative z-10 group">
        {/* Svítící kruh pod avatarem */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#5a0014] to-[#800020] opacity-80 group-hover:opacity-100 transition-all duration-300 blur-md scale-110"></div>
        
        {/* Avatar */}
        <div className="relative">
          <img
            src={user.profile_picture || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}` || defaultProfilePic}
            alt={`${user.username} profile`}
            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:border-[#800020]"
          />
        </div>
      </div>
    </div>

    {/* Obsah profilu - editační formulář nebo zobrazení profilu */}
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      {isEditing ? (
        <form
          onSubmit={handleFormSubmit}
          className="space-y-6 w-full max-w-lg mx-auto animate-fade-in"
        >
          <h2 className="text-2xl font-bold text-[#800020] mb-4">Upravit profil</h2>
          
          <div className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Uživatelské jméno
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-[#800020] shadow-sm p-3 focus:ring-2 focus:ring-[#800020] focus:border-[#800020] transition-all"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Popis profilu
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="mt-1 block w-full rounded-md border-[#800020] shadow-sm p-3 focus:ring-2 focus:ring-[#800020] focus:border-[#800020] transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="profile_picture"
                className="block text-sm font-medium text-gray-700"
              >
                Profilová fotka
              </label>
              <div className="mt-1 flex items-center">
                <input
                  type="file"
                  id="profile_picture"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 
                           file:border-0 file:rounded-md file:font-medium file:bg-[#800020] 
                           file:text-white hover:file:bg-[#5a0014] transition-all 
                           cursor-pointer focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
            >
              Zrušit
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[#800020] text-white hover:bg-[#5a0014] transition-all"
            >
              Uložit změny
            </button>
          </div>
        </form>
      ) : (
        <div className="animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div className="space-y-4 md:w-7/12">
              <h1 className="text-3xl font-bold text-[#800020]">
                {user.username}
              </h1>
              
              <div className="space-y-2 text-gray-600">
                <p className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#800020]" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span>{user.email}</span>
                </p>
                
                <p className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#800020]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>
                    Členem od: {new Date(user.created_at).toLocaleDateString("cs-CZ", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </p>
              </div>
              
              <div className="py-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">O mně</h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {user.description || "Žádný popis."}
                </p>
              </div>
              
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-[#800020] text-white rounded-md hover:bg-[#5a0014] transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Upravit profil
                </button>
              )}
            </div>
            
            {/* Rank card */}
            <div className="mt-6 md:mt-0 p-5 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 md:w-4/12">
              <div className="flex items-center space-x-4">
                <div className="rounded-full p-1 bg-gradient-to-tr from-[#800020] to-[#aa0030]">
                  <img
                    src={rankImages[user.rank]}
                    alt={`Rank ${user.rank}`}
                    className="w-16 h-16 object-contain bg-white rounded-full p-2"
                  />
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Rank {user.rank}
                  </h3>
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center text-sm">
                      <span className="font-medium text-[#800020]">Body:</span>
                      <span className="ml-2 font-semibold">{user.points}</span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                      <div
                        className="h-full bg-gradient-to-r from-[#800020] to-[#aa0030] rounded-full"
                        style={{ width: `${Math.min(100, (user.points % 100))}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {user.points % 100}/10 do dalšího levelu
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
</div>

     {/* Navigační lišta */}
<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
  <nav className="mb-6">
    <ul className="flex flex-wrap border-b border-[#800020]/20 relative">
      {/* Dynamický indikátor aktivní záložky */}
      <div 
        className="absolute bottom-0 h-0.5 bg-[#800020] transition-all duration-300 ease-in-out"
        style={{
          left: activeTab === "seznamy" ? "0%" : activeTab === "prispevky" ? "33.33%" : "66.66%",
          width: "33.33%"
        }}
      ></div>
      
      <li className="w-1/3">
        <button
          onClick={() => setActiveTab("seznamy")}
          className={`relative w-full py-3 px-1 text-center font-medium tracking-wide rounded-t-lg transition-all duration-300
            ${activeTab === "seznamy" 
              ? "text-[#800020] font-semibold" 
              : "text-gray-500 hover:text-[#800020]/70"}`}
        >
          <div className="flex items-center justify-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>Seznamy knih</span>
          </div>
          
          {/* Aktivní indikátor */}
          {activeTab === "seznamy" && (
            <span className="absolute -bottom-[1px] left-0 w-full h-[1px] bg-white"></span>
          )}
        </button>
      </li>
      
      <li className="w-1/3">
        <button
          onClick={() => setActiveTab("prispevky")}
          className={`relative w-full py-3 px-1 text-center font-medium tracking-wide rounded-t-lg transition-all duration-300
            ${activeTab === "prispevky" 
              ? "text-[#800020] font-semibold" 
              : "text-gray-500 hover:text-[#800020]/70"}`}
        >
          <div className="flex items-center justify-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span>Příspěvky</span>
          </div>
          
          {/* Aktivní indikátor */}
          {activeTab === "prispevky" && (
            <span className="absolute -bottom-[1px] left-0 w-full h-[1px] bg-white"></span>
          )}
        </button>
      </li>
      
      <li className="w-1/3">
        <button
          onClick={() => setActiveTab("recenze")}
          className={`relative w-full py-3 px-1 text-center font-medium tracking-wide rounded-t-lg transition-all duration-300
            ${activeTab === "recenze" 
              ? "text-[#800020] font-semibold" 
              : "text-gray-500 hover:text-[#800020]/70"}`}
        >
          <div className="flex items-center justify-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span>Recenze</span>
          </div>
          
          {/* Aktivní indikátor */}
          {activeTab === "recenze" && (
            <span className="absolute -bottom-[1px] left-0 w-full h-[1px] bg-white"></span>
          )}
        </button>
      </li>
    </ul>
  </nav>
</div>

      {/* Obsah podle aktivní záložky */}
      <div className="p-4">
      {activeTab === "seznamy" && (
  <div className="mt-8 max-w-7xl mx-auto animate-fade-in">
    {/* Sekce oblíbených knih */}
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-gradient-to-b from-[#800020] to-[#aa0030] rounded-full"></div>
        <h3 className="text-2xl font-bold text-[#800020]">Oblíbené knihy</h3>
      </div>
      
      {favorites.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 justify-center">
          {favorites.map((book) => (
            <div
              key={book.google_books_id}
              className="relative group rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl"
            >
              {/* Stužka oblíbené */}
              <div className="absolute top-0 right-0 z-20 bg-gradient-to-br from-[#800020] to-[#aa0030] text-white text-xs font-bold py-1 px-2 rounded-bl-lg shadow-md">
                ★ Oblíbené
              </div>
              
              {/* Kartička knihy s 3D efektem */}
              <div className="relative w-full h-64 transform transition-transform duration-500 group-hover:scale-105 perspective preserve-3d">
                {/* Obrázek obálky */}
                {book.cover_url ? (
  <img
    src={book.cover_url}
    alt={book.title}
    className="absolute inset-0 w-full h-full object-cover"
    loading="lazy"
  />
) : (
  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#800020] to-[#aa0030] flex flex-col items-center justify-center p-4">
    <div className="text-white text-center space-y-4">
      <div className="text-4xl font-bold">
        {book.title
          .split(' ')
          .map(word => word[0])
          .slice(0, 3)
          .join('')
          .toUpperCase()}
      </div>
      <div className="w-16 h-1 mx-auto bg-white/20 rounded-full"></div>
      <div className="text-sm font-medium text-white/90 line-clamp-3">
        {book.title}
      </div>
      <div className="text-xs text-white/70">
        {book.author?.split(',')[0] || 'Neznámý autor'}
      </div>
    </div>
  </div>
)}
                
                {/* Gradient překryv pro lepší čitelnost */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-70 group-hover:opacity-80 transition-opacity duration-300"></div>
                
                {/* Informace o knize */}
                <div className="absolute bottom-0 left-0 w-full p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h4 className="text-lg font-bold text-white leading-tight mb-1 line-clamp-2">
                    <Link
                      to={`/books/${book.google_books_id}`}
                      className="hover:text-[#e1c4c4] transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {book.title}
                    </Link>
                  </h4>
                  <p className="text-sm text-gray-300 mb-3 line-clamp-1">{book.author}</p>
                  
                  {/* Tlačítko pro odebrání */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveBook(book.google_books_id, "favorite");
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-[#800020] text-white text-sm font-medium 
                             hover:bg-[#5a0014] focus:ring-2 focus:ring-[#800020] focus:ring-opacity-50 
                             transition-all duration-300 transform opacity-0 group-hover:opacity-100 
                             flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Odebrat
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-gray-600 font-medium">Zatím žádné oblíbené knihy.</p>
          <p className="text-gray-500 text-sm mt-2">Knihy můžeš přidat do oblíbených na jejich detailní stránce.</p>
        </div>
      )}
    </div>
    
    {/* Sekce To Read */}
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-gradient-to-b from-[#800020] to-[#aa0030] rounded-full"></div>
        <h3 className="text-2xl font-bold text-[#800020]">Chci přečíst</h3>
      </div>
      
      {toRead.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 justify-center">
          {toRead.map((book) => (
            <div
              key={book.google_books_id}
              className="relative group rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl"
            >
              {/* Stužka ToRead */}
              <div className="absolute top-0 right-0 z-20 bg-gradient-to-br from-[#800020] to-[#aa0030] text-white text-xs font-bold py-1 px-2 rounded-bl-lg shadow-md">
                📖 Chci přečíst
              </div>
              
              {/* Kartička knihy s 3D efektem */}
              <div className="relative w-full h-64 transform transition-transform duration-500 group-hover:scale-105 perspective preserve-3d">
                {/* Obrázek obálky */}
                {book.cover_url ? (
  <img
    src={book.cover_url}
    alt={book.title}
    className="absolute inset-0 w-full h-full object-cover"
    loading="lazy"
  />
) : (
  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#800020] to-[#aa0030] flex flex-col items-center justify-center p-4">
    <div className="text-white text-center space-y-4">
      <div className="text-4xl font-bold">
        {book.title
          .split(' ')
          .map(word => word[0])
          .slice(0, 3)
          .join('')
          .toUpperCase()}
      </div>
      <div className="w-16 h-1 mx-auto bg-white/20 rounded-full"></div>
      <div className="text-sm font-medium text-white/90 line-clamp-3">
        {book.title}
      </div>
      <div className="text-xs text-white/70">
        {book.author?.split(',')[0] || 'Neznámý autor'}
      </div>
    </div>
  </div>
)}
                
                {/* Gradient překryv pro lepší čitelnost */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-70 group-hover:opacity-80 transition-opacity duration-300"></div>
                
                {/* Informace o knize */}
                <div className="absolute bottom-0 left-0 w-full p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h4 className="text-lg font-bold text-white leading-tight mb-1 line-clamp-2">
                    <Link
                      to={`/books/${book.google_books_id}`}
                      className="hover:text-[#e1c4c4] transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {book.title}
                    </Link>
                  </h4>
                  <p className="text-sm text-gray-300 mb-3 line-clamp-1">{book.author}</p>
                  
                  {/* Tlačítko pro odebrání */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveBook(book.google_books_id, "toread");
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-[#800020] text-white text-sm font-medium 
                             hover:bg-[#5a0014] focus:ring-2 focus:ring-[#800020] focus:ring-opacity-50 
                             transition-all duration-300 transform opacity-0 group-hover:opacity-100 
                             flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Odebrat
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-gray-600 font-medium">Zatím žádné knihy k přečtení.</p>
          <p className="text-gray-500 text-sm mt-2">Knihy můžeš přidat do seznamu na jejich detailní stránce.</p>
        </div>
      )}
    </div>
  </div>
)}
        {activeTab === "prispevky" && (
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1 h-8 bg-gradient-to-b from-[#800020] to-[#aa0030] rounded-full"></div>
      <h3 className="text-2xl font-bold text-[#800020]">Příspěvky</h3>
    </div>
    
    {posts.length > 0 ? (
      <div className="space-y-5">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]"
          >
            {/* Horní lišta příspěvku s barevným akcentem */}
            <div className="h-1 bg-gradient-to-r from-[#800020] to-[#aa0030]"></div>
            
            {/* Obsah příspěvku */}
            <div className="p-5">
              {/* Hlavička s autorem */}
              <div className="flex items-center mb-4">
                <div className="relative group">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#5a0014]/30 to-[#800020]/30 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-sm scale-110"></div>
                  <img
                    src={post.profile_picture || "/default-avatar.png"}
                    alt={post.username}
                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover group-hover:border-[#800020]/50 transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${post.author_id}`);
                    }}
                  />
                </div>
                <div className="ml-3">
                  <p 
                    className="font-semibold text-gray-800 hover:text-[#800020] transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${post.author_id}`);
                    }}
                  >
                    {post.username}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {new Date(post.created_at).toLocaleDateString("cs-CZ", {
                      day: "numeric", 
                      month: "long", 
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>
              
              {/* Obsah příspěvku */}
              <div 
                className="py-3 px-1 cursor-pointer"
                onClick={() => navigate(`/posts/${post.id}`)}
              >
                <p className="text-lg text-gray-800 leading-relaxed">
                  {post.content}
                </p>
              </div>
              
              {/* Interakce a metriky */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 bg-gray-50 px-3 py-1.5 rounded-full">
                    <FaArrowUp className="text-[#5a9944]" />
                    <span className="text-sm font-medium text-gray-700">{post.upvotes}</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-gray-50 px-3 py-1.5 rounded-full">
                    <FaArrowDown className="text-[#994444]" />
                    <span className="text-sm font-medium text-gray-700">{post.downvotes}</span>
                  </div>
                </div>
                
                <button 
                  className="text-sm text-gray-500 hover:text-[#800020] transition-colors flex items-center space-x-1"
                  onClick={() => navigate(`/posts/${post.id}`)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <span>Zobrazit diskuzi</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        <p className="text-gray-600 font-medium">Zatím žádné příspěvky.</p>
        <p className="text-gray-500 text-sm mt-2">Uživatel zatím nepřidal žádné příspěvky do komunity.</p>
      </div>
    )}
  </div>
)}
       {activeTab === "recenze" && (
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1 h-8 bg-gradient-to-b from-[#800020] to-[#aa0030] rounded-full"></div>
      <h3 className="text-2xl font-bold text-[#800020]">Recenze</h3>
    </div>

    {reviews.length > 0 ? (
      <div className="space-y-5">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
          >
            {/* Horní lišta recenze s barevným akcentem */}
            <div className="h-1 bg-gradient-to-r from-[#800020] to-[#aa0030]"></div>
            
            <div className="p-5">
              {/* Hlavička s hvězdičkovým hodnocením */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-5 w-5 ${i < review.rating ? 'text-[#800020]' : 'text-gray-300'}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 17.75l-5.95 3.13 1.14-6.64L2.5 9.37l6.67-.97L12 2.5l2.83 5.9 6.67.97-4.82 4.87 1.14 6.64z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(review.created).toLocaleDateString("cs-CZ", {
                    day: "numeric", 
                    month: "long", 
                    year: "numeric"
                  })}
                </p>
              </div>
              
              {/* Název recenze */}
              <h4 className="text-xl font-bold text-gray-800 mb-2">{review.title}</h4>
              
              {/* Obsah recenze */}
              <p className="text-gray-700 mb-4 leading-relaxed">{review.text}</p>
              
              {/* Autor recenze */}
              <div className="flex items-center pt-3 border-t border-gray-100">
                <div 
                  className={`relative group cursor-pointer`}
                  onClick={() => {
                    if (review.authorProfile)
                      navigate(`/profile/${review.author_zub}`);
                  }}
                >
                  {/* Efekt pod avatarem */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#5a0014]/30 to-[#800020]/30 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-sm scale-110"></div>
                  
                  {/* Avatar autora */}
                  {review.authorProfile ? (
                    <img
                      src={review.authorProfile.profile_picture}
                      alt={review.authorProfile.username}
                      className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover group-hover:border-[#800020]/50 transition-all duration-300"
                    />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 border-2 border-white">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-6 h-6 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 12c2.75 0 5-2.25 5-5s-2.25-5-5-5-5 2.25-5 5 2.25 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="ml-3">
                  {review.authorProfile ? (
                    <p 
                      className="font-semibold text-gray-800 hover:text-[#800020] transition-colors"
                      onClick={() => navigate(`/profile/${review.author_zub}`)}
                    >
                      {user.username}
                    </p>
                  ) : (
                    <p className="font-semibold text-gray-800">{user.username}</p>
                  )}
                  <p className="text-xs text-gray-500">Autor recenze</p>
                </div>
                
                {/* Tlačítko pro zobrazení knihy */}
                {review.book_id && (
                  <button 
                    className="ml-auto text-sm text-gray-500 hover:text-[#800020] transition-colors flex items-center space-x-1 px-3 py-1 rounded-full border border-gray-200 hover:border-[#800020]/30"
                    onClick={() => navigate(`/books/${review.book_id}`)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span>Zobrazit knihu</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <p className="text-gray-600 font-medium">Žádné recenze.</p>
        <p className="text-gray-500 text-sm mt-2">Uživatel zatím nepřidal žádné recenze knih.</p>
      </div>
    )}
  </div>
)}
      </div>
    </section>
  );
}
