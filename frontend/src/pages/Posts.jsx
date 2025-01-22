import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaArrowUp, FaArrowDown, FaTrash } from "react-icons/fa";

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [expandedPosts, setExpandedPosts] = useState({});
  const [newPost, setNewPost] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [user, setUser] = useState(null);
  const [userVotes, setUserVotes] = useState({});
  const navigate = useNavigate();
  const maxLength = 200; // Maximální počet znaků pro zkrácení textu

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/auth/profile", { withCredentials: true })
      .then((response) => setUser(response.data))
      .catch(() => setUser(null));

    axios
      .get("http://localhost:5000/api/posts", { withCredentials: true })
      .then((response) => {
        if (Array.isArray(response.data)) {
          setPosts(response.data);
          setFilteredPosts(response.data);
          const votes = response.data.reduce((acc, post) => {
            acc[post.id] = post.user_vote || null;
            return acc;
          }, {});
          setUserVotes(votes);
        } else {
          console.error("API nevrací pole:", response.data);
          setPosts([]);
        }
      });
  }, []);

  useEffect(() => {
    let updatedPosts = [...posts];

    // Filtrování podle hledání
    if (searchQuery.trim()) {
      updatedPosts = updatedPosts.filter(
        (post) =>
          post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Seřazení příspěvků
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
    if (!newPost.trim()) return;

    try {
      const response = await axios.post(
        "http://localhost:5000/api/posts",
        { content: newPost, user_id: user.id },
        { withCredentials: true }
      );

      const newPostData = response.data;

      // Doplníme username a profile_picture z aktuálně přihlášeného uživatele
      const updatedPost = {
        ...newPostData,
        username: user.username,
        profile_picture: user.profile_picture,
      };

      setPosts([updatedPost, ...posts]);
      setNewPost("");
    } catch (error) {
      console.error(error);
    }
  };

  const handleVote = async (id, type) => {
    if (!user) return alert("Musíte být přihlášeni pro hlasování");

    try {
      let voteStatus = userVotes[id] === type ? "removeVote" : type;

      const response = await axios.post(
        `http://localhost:5000/api/posts/${id}/${voteStatus}`,
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
    } catch (error) {
      console.error("Chyba při hlasování:", error);
      alert(error.response?.data?.error || "Chyba při hlasování");
    }
  };

  const handleDeletePost = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/posts/${id}`, {
        data: { user_id: user.id },
        withCredentials: true,
      });
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== id));
    } catch (error) {
      alert(error.response?.data?.error || "Chyba při mazání příspěvku");
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
        <div className="mb-6 bg-gray-100 p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-[#800020] mb-3">
            📜 Vytvořit nový příspěvek
          </h2>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#800020] focus:outline-none"
            placeholder="Co máte na srdci?"
          />
          <button
            onClick={handleAddPost}
            className="bg-[#800020] hover:bg-[#5a0014] text-white px-4 py-2 rounded-lg mt-3 transition-all w-full font-semibold shadow-md hover:shadow-lg"
          >
            Přidat příspěvek
          </button>
        </div>
      )}

      {/* Hledání a filtrace */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-[#800020] mb-2">
          🔍 Filtrovat a třídit
        </h2>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hledat podle autora nebo obsahu..."
            className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-[#800020] focus:outline-none"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-3 border rounded-lg w-full md:w-1/3 focus:ring-2 focus:ring-[#800020] focus:outline-none"
          >
            <option value="newest">📅 Nejnovější</option>
            <option value="oldest">⏳ Nejstarší</option>
            <option value="popular">🔥 Nejoblíbenější</option>
          </select>
        </div>
      </div>

      {filteredPosts.map((post) => (
        <div
          key={post.id}
          className="border p-5 rounded-lg mb-6 shadow-md bg-gray-50 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate(`/posts/${post.id}`)}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <img
                src={post.profile_picture}
                alt={post.username}
                className="w-12 h-12 rounded-full border border-[#800020] mr-4"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile/${post.user_id}`);
                }}
              />
              <div>
                <p className="font-bold text-lg text-[#800020]">
                  {post.username}
                </p>
                <p className="text-gray-500 text-sm">
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
              >
                <FaTrash className="text-[#800020] hover:text-[#5a0014] transition-colors" />
              </button>
            )}
          </div>

          {/* Obsah příspěvku s možností rozkliknutí */}
          <h2 className="text-xl font-semibold text-gray-900 leading-tight mb-2">
            {expandedPosts[post.id] || post.content.length <= maxLength
              ? post.content
              : `${post.content.slice(0, maxLength)}...`}
          </h2>
          {post.content.length > maxLength && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(post.id);
              }}
              className="text-[#800020] mt-2"
            >
              {expandedPosts[post.id] ? "Skrýt" : "Zobrazit více"}
            </button>
          )}

          <div className="flex items-center space-x-3 text-gray-600 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleVote(post.id, "upvote");
              }}
            >
              <FaArrowUp
                className={
                  userVotes[post.id] === "upvote"
                    ? "text-green-700"
                    : "text-green-500"
                }
              />
            </button>
            <span className="font-medium">{post.upvotes}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleVote(post.id, "downvote");
              }}
            >
              <FaArrowDown
                className={
                  userVotes[post.id] === "downvote"
                    ? "text-[#800020]"
                    : "text-[#a52a2a]"
                }
              />
            </button>
            <span className="font-medium">{post.downvotes}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Posts;
