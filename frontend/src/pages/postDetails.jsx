import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowUp, FaArrowDown, FaTrash, FaArrowLeft } from "react-icons/fa";
const PostDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL_LOCAL}/api/auth/profile`, {
        withCredentials: true,
      })
      .then((response) => setUser(response.data))
      .catch(() => setUser(null));

    axios
      .get(`${import.meta.env.VITE_API_URL_LOCAL}/api/posts/${id}`)
      .then((response) => {
        setPost(response.data);
      });

    axios
      .get(`${import.meta.env.VITE_API_URL_LOCAL}/api/posts/${id}/comments`)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setComments(response.data);
        } else {
          console.error("API nevrací pole:", response.data);
          setComments([]);
        }
      });
  }, [id]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/posts/${id}/comments`,
        { content: newComment, user_id: user.id },
        { withCredentials: true }
      );
      setComments([...comments, response.data]);
      setNewComment("");
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteComment = async (commentId) => {
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
    } catch (error) {
      console.error("Chyba při mazání komentáře:", error);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl bg-white shadow-xl rounded-xl">
      <Link
        to="/posts"
        className="mb-8 flex items-center text-[#800020] hover:text-[#5a0014] transition-colors font-medium bg-gray-50 p-3 rounded-lg w-fit"
      >
        <FaArrowLeft className="mr-2" /> Zpět na příspěvky
      </Link>

      {post ? (
        <>
          {/* User info card */}
          <div className="flex items-center mb-6 p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
            <img
              src={post.profile_picture}
              alt={post.username}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#800020] mr-4 cursor-pointer transform hover:scale-105 transition-transform"
              onClick={() => navigate(`/profile/${post.user_id}`)}
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

          {/* Post content */}
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
        <div className="animate-pulse bg-gray-100 p-8 rounded-xl mb-8">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      )}

      {/* Comments section */}
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

        {/* Add comment form */}
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
          <div className="bg-gray-100 p-4 rounded-lg text-center mt-6">
            <p className="text-gray-600">
              Pro přidání komentáře se musíte{" "}
              <Link
                to="/login"
                className="text-[#800020] font-medium hover:underline"
              >
                přihlásit
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetail;
