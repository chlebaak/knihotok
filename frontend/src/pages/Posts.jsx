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
      .get(`${import.meta.env.VITE_API_URL_LOCAL}/api/auth/profile`, { withCredentials: true })
      .then((response) => {
        setUser(response.data);
        // Once we have the user, fetch posts with userId
        return axios.get(`${import.meta.env.VITE_API_URL_LOCAL}/api/posts`, { 
          params: { userId: response.data.id },
          withCredentials: true 
        });
      })
      .then((response) => {
        if (Array.isArray(response.data)) {
          setPosts(response.data);
          setFilteredPosts(response.data);
          
          // Set user votes based on the data from server
          const votes = response.data.reduce((acc, post) => {
            acc[post.id] = post.user_vote || null;
            return acc;
          }, {});
          setUserVotes(votes);
        } else {
          console.error("API nevrací pole:", response.data);
          setPosts([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setUser(null);
        // Even if user auth fails, still fetch posts without userId
        axios.get(`${import.meta.env.VITE_API_URL_LOCAL}/api/posts`, { withCredentials: true })
          .then(response => {
            if (Array.isArray(response.data)) {
              setPosts(response.data);
              setFilteredPosts(response.data);
            }
          });
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
        `${import.meta.env.VITE_API_URL_LOCAL}/api/posts`,
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
      let voteStatus;
      
      // If user already voted this way, remove the vote
      if (userVotes[id] === type) {
        voteStatus = "removeVote";
      } 
      // If user voted the opposite way, change the vote
      else if (userVotes[id]) {
        voteStatus = type; // This will update from one vote type to another
      } 
      // If user hasn't voted, add a new vote
      else {
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
    } catch (error) {
      console.error("Chyba při hlasování:", error);
      alert(error.response?.data?.error || "Chyba při hlasování");
    }
  };

  const handleDeletePost = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL_LOCAL}/api/posts/${id}`, {
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

{filteredPosts.length === 0 ? (
  <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
    <p className="text-gray-600">Žádné příspěvky nenalezeny</p>
  </div>
) : (
  filteredPosts.map((post) => (
    <div
      key={post.id}
      className="mb-6 overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 bg-white border border-gray-200"
    >
      {/* Post header with user info */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
        <div className="flex items-center" onClick={(e) => {
          e.stopPropagation();
          navigate(`/profile/${post.user_id}`);
        }}>
          <div className="relative cursor-pointer">
            <img
              src={post.profile_picture}
              alt={post.username}
              className="w-12 h-12 rounded-full object-cover border-2 border-[#800020]"
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

      {/* Post footer with voting - updated for better UX */}
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
      title={userVotes[post.id] === "upvote" ? "Odebrat hlas" : "Líbí se mi"}
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
      title={userVotes[post.id] === "downvote" ? "Odebrat hlas" : "Nelíbí se mi"}
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
