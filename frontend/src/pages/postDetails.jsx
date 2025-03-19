import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowUp, FaArrowDown, FaTrash, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify"; // Přidáme import pro toasty

const PostDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    setIsLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_URL_LOCAL}/api/auth/profile`, {
        withCredentials: true,
      })
      .then((response) => setUser(response.data))
      .catch((error) => {
        console.error("Chyba při načítání profilu:", error);
        setUser(null);
      });

    const fetchPostData = axios
      .get(`${import.meta.env.VITE_API_URL_LOCAL}/api/posts/${id}`)
      .then((response) => {
        setPost(response.data);
        return response;
      })
      .catch((error) => {
        console.error("Chyba při načítání příspěvku:", error);
        toast.error("Nepodařilo se načíst příspěvek");
        return null;
      });

    const fetchComments = axios
      .get(`${import.meta.env.VITE_API_URL_LOCAL}/api/posts/${id}/comments`)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setComments(response.data);
        } else {
          console.error("API nevrací pole:", response.data);
          setComments([]);
        }
        return response;
      })
      .catch((error) => {
        console.error("Chyba při načítání komentářů:", error);
        toast.error("Nepodařilo se načíst komentáře");
        setComments([]);
        return null;
      });

    Promise.all([fetchPostData, fetchComments])
      .then(([postResponse, commentsResponse]) => {
        if (postResponse && commentsResponse) {
          setIsLoading(false);
          toast.success("Příspěvek byl úspěšně načten");
        } else {
          setIsLoading(false);
        }
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [id]);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.warning("Komentář nemůže být prázdný");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/posts/${id}/comments`,
        { content: newComment, user_id: user.id },
        { withCredentials: true }
      );
      
      setComments([...comments, response.data]);
      setNewComment("");
      
      toast.success("Komentář byl úspěšně přidán");
    } catch (error) {
      console.error("Chyba při přidávání komentáře:", error);
      toast.error(error.response?.data?.error || "Chyba při přidávání komentáře");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Opravdu chcete smazat tento komentář?")) {
      return;
    }
    
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/posts/${commentId}/comments`,
        {
          data: { user_id: user.id },
          withCredentials: true,
        }
      );

      setComments((prevComments) =>
        prevComments.filter((comment) => comment.id !== commentId)
      );
      
      toast.success("Komentář byl úspěšně smazán");
    } catch (error) {
      console.error("Chyba při mazání komentáře:", error);
      toast.error(error.response?.data?.error || "Chyba při mazání komentáře");
    }
  };

  const handleBackClick = () => {
    navigate("/posts");
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl bg-white shadow-xl rounded-xl">
      <button
        onClick={handleBackClick}
        className="mb-8 flex items-center text-[#800020] hover:text-[#5a0014] transition-colors font-medium bg-gray-50 p-3 rounded-lg w-fit"
      >
        <FaArrowLeft className="mr-2" /> Zpět na příspěvky
      </button>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12">
          <div className="animate-pulse flex flex-col items-center space-y-6 w-full">
            <div className="flex items-center space-x-4 w-full">
              <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
            <div className="space-y-3 w-full">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div className="flex justify-center">
              <div className="inline-flex items-center px-4 py-2 text-[#800020] bg-[#800020]/10 rounded-lg">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#800020]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Načítání příspěvku...
              </div>
            </div>
          </div>
        </div>
      ) : post ? (
        <>
          <div className="flex items-center mb-6 p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
            <img
              src={post.profile_picture}
              alt={post.username}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#800020] mr-4 cursor-pointer transform hover:scale-105 transition-transform"
              onClick={() => navigate(`/profile/${post.user_id}`)}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${post.username}`;
              }}
            />
            <div
              className="cursor-pointer"
              onClick={() => navigate(`/profile/${post.user_id}`)}
            >
              <p className="font-bold text-xl text-[#800020] hover:text-[#5a0014] transition-colors">
                {post.username}
              </p>
              <p className="text-gray-500 text-sm flex items-center">
                <span className="mr-1">🕒</span>
                {new Date(post.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <div className="text-xl text-gray-800 leading-relaxed whitespace-pre-wrap mb-4">
              {post.content}
            </div>
            <div className="flex items-center text-gray-600">
              <div className="flex items-center">
                <span className="p-1.5 bg-green-50 rounded-full mr-1 flex items-center justify-center">
                  <FaArrowUp className="text-green-700" />
                </span>
                <span className="font-medium">{post.upvotes}</span>
              </div>
              {post.downvotes > 0 && (
                <div className="flex items-center ml-4">
                  <span className="p-1.5 bg-red-50 rounded-full mr-1 flex items-center justify-center">
                    <FaArrowDown className="text-[#800020]" />
                  </span>
                  <span className="font-medium">{post.downvotes}</span>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-gray-50 p-8 rounded-xl text-center shadow-md mb-8">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-[#800020]/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[#800020]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Příspěvek nebyl nalezen</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Litujeme, ale požadovaný příspěvek nebyl nalezen nebo byl odstraněn.
          </p>
          <button
            onClick={handleBackClick}
            className="mt-6 px-5 py-2.5 bg-[#800020] text-white rounded-lg hover:bg-[#600018] transition-colors focus:outline-none focus:ring-2 focus:ring-[#800020]/50"
          >
            Zpět na seznam příspěvků
          </button>
        </div>
      )}

      <div className="bg-gray-50 p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-6 text-[#800020] flex items-center">
          <span className="text-2xl mr-2">💬</span> Komentáře
          {comments.length > 0 && (
            <span className="ml-2 text-gray-500 text-base">
              ({comments.length})
            </span>
          )}
        </h2>

        {comments.length === 0 ? (
          <div className="text-center p-6 bg-white rounded-lg border border-dashed border-gray-300 mb-6">
            <p className="text-gray-500">Zatím žádné komentáře.</p>
            <p className="text-sm text-gray-400 mt-2">
              Buďte první, kdo zanechá komentář!
            </p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border-l-4 border-[#800020]"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={comment.profile_picture}
                    alt={comment.username}
                    className="w-10 h-10 rounded-full object-cover border border-[#800020] transform hover:scale-110 transition-transform"
                    onClick={() => navigate(`/profile/${comment.user_id}`)}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${comment.username}`;
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p
                          className="font-bold text-[#800020] cursor-pointer hover:text-[#5a0014] transition-colors"
                          onClick={() =>
                            navigate(`/profile/${comment.user_id}`)
                          }
                        >
                          {comment.username}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                      {user?.id === comment.user_id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-gray-400 hover:text-[#800020] transition-colors p-1 rounded-full hover:bg-gray-100"
                          title="Smazat komentář"
                        >
                          <FaTrash size={14} />
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-gray-800 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {user ? (
          <div className="bg-white p-5 rounded-xl shadow-md mt-6">
            <h3 className="text-lg font-medium text-[#800020] mb-3">
              Přidat komentář
            </h3>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800020] focus:border-[#800020] focus:outline-none min-h-[120px] shadow-inner resize-none"
              placeholder="Napište nový komentář..."
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className={`mt-3 px-6 py-3 rounded-lg text-white font-medium w-full flex items-center justify-center transition-all ${
                newComment.trim()
                  ? "bg-[#800020] hover:bg-[#5a0014] shadow-md hover:shadow-lg"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              <span className="mr-2">✉️</span> Odeslat komentář
            </button>
          </div>
        ) : (
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 mt-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800">
                  Pro přidání komentáře se musíte přihlásit
                </p>
                <p className="mt-1 text-sm text-blue-700">
                  <Link
                    to="/login"
                    className="font-medium underline hover:text-blue-900"
                  >
                    Přihlásit se
                  </Link> nebo {' '}
                  <Link
                    to="/signup"
                    className="font-medium underline hover:text-blue-900"
                  >
                    Vytvořit účet
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetail;