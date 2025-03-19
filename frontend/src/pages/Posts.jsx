import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaArrowUp, FaArrowDown, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [expandedPosts, setExpandedPosts] = useState({});
  const [newPost, setNewPost] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [user, setUser] = useState(null);
  const [userVotes, setUserVotes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const maxLength = 200;

  useEffect(() => {
    setIsLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_URL_LOCAL}/api/auth/profile`, {
        withCredentials: true,
      })
      .then((response) => {
        setUser(response.data);
        return axios.get(`${import.meta.env.VITE_API_URL_LOCAL}/api/posts`, {
          params: { userId: response.data.id },
          withCredentials: true,
        });
      })
      .then((response) => {
        if (Array.isArray(response.data)) {
          setPosts(response.data);
          setFilteredPosts(response.data);

          const votes = response.data.reduce((acc, post) => {
            acc[post.id] = post.user_vote || null;
            return acc;
          }, {});
          setUserVotes(votes);

          if (response.data.length > 0) {
            toast.success("Příspěvky byly úspěšně načteny");
          }
        } else {
          console.error("API nevrací pole:", response.data);
          setPosts([]);
          toast.error("Nepodařilo se načíst příspěvky");
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setUser(null);

        if (error.response?.status === 401) {
          toast.info("Pro plný přístup k obsahu se přihlaste");
        } else {
          toast.error("Nastala chyba při komunikaci se serverem");
        }

        axios
          .get(`${import.meta.env.VITE_API_URL_LOCAL}/api/posts`, {
            withCredentials: true,
          })
          .then((response) => {
            if (Array.isArray(response.data)) {
              setPosts(response.data);
              setFilteredPosts(response.data);
            }
            setIsLoading(false);
          })
          .catch(() => {
            toast.error("Nepodařilo se načíst příspěvky");
            setIsLoading(false);
          });
      });
  }, []);

  useEffect(() => {
    let updatedPosts = [...posts];

    if (searchQuery.trim()) {
      updatedPosts = updatedPosts.filter(
        (post) =>
          post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortBy === "newest") {
      updatedPosts.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
    } else if (sortBy === "oldest") {
      updatedPosts.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
    } else if (sortBy === "popular") {
      updatedPosts.sort(
        (a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes)
      );
    }

    setFilteredPosts(updatedPosts);
  }, [searchQuery, sortBy, posts]);

  const handleAddPost = async () => {
    if (!newPost.trim()) {
      toast.warning("Příspěvek nemůže být prázdný");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/posts`,
        { content: newPost, user_id: user.id },
        { withCredentials: true }
      );

      const newPostData = response.data;

      const updatedPost = {
        ...newPostData,
        username: user.username,
        profile_picture: user.profile_picture,
      };

      setPosts([updatedPost, ...posts]);
      setNewPost("");
      toast.success("Příspěvek byl úspěšně přidán");
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.error || "Nepodařilo se přidat příspěvek"
      );
    }
  };

  const handleVote = async (id, type) => {
    if (!user) {
      toast.info("Musíte být přihlášeni pro hlasování");
      return;
    }

    try {
      let voteStatus;

      if (userVotes[id] === type) {
        voteStatus = "removeVote";
      } else if (userVotes[id]) {
        voteStatus = type;
      } else {
        voteStatus = type;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/posts/${id}/${voteStatus}`,
        { user_id: user.id },
        { withCredentials: true }
      );

      setUserVotes((prevVotes) => ({
        ...prevVotes,
        [id]: voteStatus === "removeVote" ? null : type,
      }));

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === id
            ? {
                ...post,
                upvotes: response.data.upvotes,
                downvotes: response.data.downvotes,
              }
            : post
        )
      );

      // Různé zprávy podle typu hlasování
      if (voteStatus === "removeVote") {
        toast.info("Hlas byl odebrán");
      } else if (voteStatus === "upvote") {
        toast.success("Přidán pozitivní hlas");
      } else {
        toast.info("Přidán negativní hlas");
      }
    } catch (error) {
      console.error("Chyba při hlasování:", error);
      toast.error(error.response?.data?.error || "Chyba při hlasování");
    }
  };

  const handleDeletePost = async (id) => {
    if (window.confirm("Opravdu chcete smazat tento příspěvek?")) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_API_URL_LOCAL}/api/posts/${id}`,
          {
            data: { user_id: user.id },
            withCredentials: true,
          }
        );
        setPosts((prevPosts) => prevPosts.filter((post) => post.id !== id));
        toast.success("Příspěvek byl úspěšně smazán");
      } catch (error) {
        toast.error(
          error.response?.data?.error || "Chyba při mazání příspěvku"
        );
      }
    }
  };

  const toggleExpand = (id) => {
    setExpandedPosts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-[#800020]">Příspěvky</h1>

      {user && (
        <div className="mb-8 bg-gradient-to-r from-white to-gray-100 p-6 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-[#800020] mb-4 flex items-center">
            <span className="text-2xl mr-2">📝</span> Vytvořit nový příspěvek
          </h2>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#800020] focus:outline-none resize-none min-h-[120px] text-gray-700 shadow-inner"
            placeholder="Co máte na srdci?"
          />
          <button
            onClick={handleAddPost}
            className="bg-[#800020] hover:bg-[#5a0014] text-white px-6 py-3 rounded-xl mt-4 transition-all w-full font-semibold shadow-md hover:shadow-xl flex items-center justify-center"
          >
            <span className="mr-2">✨</span> Přidat příspěvek
          </button>
        </div>
      )}

      {!user && (
        <div className="mb-8 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">
                Pro přidávání a hodnocení příspěvků se prosím přihlaste
              </p>
              <p className="mt-1 text-sm text-blue-700">
                <button
                  onClick={() => navigate("/login")}
                  className="font-medium underline hover:text-blue-900"
                >
                  Přihlásit se
                </button>{" "}
                nebo{" "}
                <button
                  onClick={() => navigate("/signup")}
                  className="font-medium underline hover:text-blue-900"
                >
                  Vytvořit účet
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Hledání a filtrace */}
      <div className="mb-8 p-6 bg-white rounded-xl shadow-lg border-l-4 border-[#800020]">
        <h2 className="text-lg font-semibold text-[#800020] mb-4 flex items-center">
          <span className="text-xl mr-2">🔍</span> Filtrovat a třídit
        </h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hledat podle autora nebo obsahu..."
              className="p-3 pl-10 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-[#800020] focus:outline-none shadow-sm"
            />
            <span className="absolute left-3 top-3 text-gray-400">🔍</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg md:w-1/3 focus:ring-2 focus:ring-[#800020] focus:outline-none shadow-sm bg-white"
          >
            <option value="newest">📅 Nejnovější</option>
            <option value="oldest">⏳ Nejstarší</option>
            <option value="popular">🔥 Nejoblíbenější</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        // Zobrazení načítání
        <div className="text-center p-8">
          <div className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-[#800020] bg-white shadow-sm animate-pulse">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#800020]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Načítání příspěvků...
          </div>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-[#800020]/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[#800020]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Žádné příspěvky nenalezeny</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {searchQuery ? "Zkuste upravit vyhledávací kritéria" : "Zatím nebyly přidány žádné příspěvky"}
          </p>
          {user && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSortBy("newest");
                document.querySelector('textarea').focus();
              }}
              className="mt-6 px-5 py-2.5 bg-[#800020] text-white rounded-lg hover:bg-[#600018] transition-colors focus:outline-none focus:ring-2 focus:ring-[#800020]/50"
            >
              {searchQuery ? "Zrušit filtr" : "Vytvořit první příspěvek"}
            </button>
          )}
        </div>
      ) : (
        // Ostatní renderování příspěvků zůstává stejné...
        filteredPosts.map((post) => (
          // Zbytek kódu pro mapování příspěvků
          <div
            key={post.id}
            className="mb-6 overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 bg-white border border-gray-200"
          >
            {/* Post header with user info */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
              <div
                className="flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile/${post.user_id}`);
                }}
              >
                <div className="relative cursor-pointer">
                  <img
                    src={post.profile_picture}
                    alt={post.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#800020]"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${post.username}`;
                    }}
                  />
                  <div className="absolute inset-0 rounded-full hover:bg-black hover:bg-opacity-10 transition-all duration-200"></div>
                </div>
                <div className="ml-3">
                  <p className="font-bold text-lg text-[#800020] hover:underline cursor-pointer">
                    {post.username}
                  </p>
                  <p className="text-gray-500 text-sm flex items-center">
                    <span className="mr-1">🕒</span>
                    {new Date(post.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {user?.id === post.user_id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePost(post.id);
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  title="Smazat příspěvek"
                >
                  <FaTrash className="text-[#800020] hover:text-[#5a0014]" />
                </button>
              )}
            </div>

            {/* Post content */}
            <div
              className="p-5 cursor-pointer"
              onClick={() => navigate(`/posts/${post.id}`)}
            >
              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {expandedPosts[post.id] || post.content.length <= maxLength
                  ? post.content
                  : `${post.content.slice(0, maxLength)}...`}
              </div>
              {post.content.length > maxLength && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(post.id);
                  }}
                  className="mt-3 text-[#800020] hover:text-[#5a0014] font-medium text-sm flex items-center focus:outline-none"
                >
                  {expandedPosts[post.id] ? (
                    <>
                      <span className="mr-1">▲</span> Skrýt
                    </>
                  ) : (
                    <>
                      <span className="mr-1">▼</span> Zobrazit více
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center p-3 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center mr-6">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVote(post.id, "upvote");
                  }}
                  className={`p-1.5 rounded-full ${
                    userVotes[post.id] === "upvote"
                      ? "bg-green-100"
                      : "hover:bg-gray-200"
                  } transition-colors`}
                  title={
                    userVotes[post.id] === "upvote"
                      ? "Odebrat hlas"
                      : "Líbí se mi"
                  }
                  disabled={!user}
                >
                  <FaArrowUp
                    className={
                      userVotes[post.id] === "upvote"
                        ? "text-green-700"
                        : "text-green-500"
                    }
                  />
                </button>
                <span className="font-medium mx-2">{post.upvotes}</span>
              </div>

              <div className="flex items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVote(post.id, "downvote");
                  }}
                  className={`p-1.5 rounded-full ${
                    userVotes[post.id] === "downvote"
                      ? "bg-red-100"
                      : "hover:bg-gray-200"
                  } transition-colors`}
                  title={
                    userVotes[post.id] === "downvote"
                      ? "Odebrat hlas"
                      : "Nelíbí se mi"
                  }
                  disabled={!user}
                >
                  <FaArrowDown
                    className={
                      userVotes[post.id] === "downvote"
                        ? "text-[#800020]"
                        : "text-[#a52a2a]"
                    }
                  />
                </button>
                <span className="font-medium mx-2">{post.downvotes}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Posts;