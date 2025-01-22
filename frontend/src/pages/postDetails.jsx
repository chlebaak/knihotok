import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaTrash, FaArrowLeft } from "react-icons/fa";

const PostDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/auth/profile", { withCredentials: true })
      .then((response) => setUser(response.data))
      .catch(() => setUser(null));

    axios.get(`http://localhost:5000/api/posts/${id}`).then((response) => {
      setPost(response.data);
    });

    axios
      .get(`http://localhost:5000/api/posts/${id}/comments`)
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
        `http://localhost:5000/api/posts/${id}/comments`,
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
        `http://localhost:5000/api/posts/${commentId}/comments`,
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
    <div className="container mx-auto p-6 max-w-2xl bg-white shadow-lg rounded-lg">
      <Link
        to="/posts"
        className="mb-6 flex items-center text-[#800020] hover:text-[#5a0014] transition-colors"
      >
        <FaArrowLeft className="mr-2" /> Zpět na příspěvky
      </Link>

      {post && (
        <>
          <div className="flex items-center mb-6 border-b pb-4 hover:bg-gray-100 transition-all duration-200 rounded-lg p-2">
            <img
              src={post.profile_picture}
              alt={post.username}
              className="w-14 h-14 rounded-full border border-[#800020] mr-4 cursor-pointer transform hover:scale-110 transition-transform"
            />
            <div
              className="cursor-pointer transform transition-all hover:scale-105"
              onClick={() => navigate(`/profile/${post.user_id}`)}
            >
              <p className="font-bold text-lg text-[#800020] hover:text-[#5a0014]">
                {post.username}
              </p>
              <p className="text-gray-500 text-sm">
                {new Date(post.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-3 text-gray-900 leading-tight">
            {post.content}
          </h1>
          <p className="text-gray-700 text-sm">👍 Upvoty: {post.upvotes}</p>
        </>
      )}

      <div className="mt-6">
        <h2 className="text-xl font-semibold border-b border-[#800020] pb-2 mb-4 text-[#800020]">
          Komentáře
        </h2>

        {comments.length === 0 ? (
          <p className="text-gray-500 text-center">Zatím žádné komentáře.</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="border border-[#800020] p-4 rounded-lg mb-3 flex items-start gap-3 bg-gray-50 hover:shadow-lg transition-shadow duration-200"
            >
              <img
                src={comment.profile_picture}
                alt={comment.username}
                className="w-10 h-10 rounded-full border border-[#800020] transform hover:scale-110 transition-transform"
              />
              <div className="flex-1">
                <p
                  className="font-bold text-sm text-[#800020] cursor-pointer hover:text-[#5a0014]"
                  onClick={() => navigate(`/profile/${comment.user_id}`)}
                >
                  {comment.username}
                </p>
                <p className="text-gray-500 text-xs">
                  {new Date(comment.created_at).toLocaleString()}
                </p>
                <p className="text-md mt-2 text-gray-800">{comment.content}</p>
              </div>
              {user?.id === comment.user_id && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-[#800020] hover:text-[#5a0014] transition-colors"
                >
                  <FaTrash />
                </button>
              )}
            </div>
          ))
        )}

        {user && (
          <div className="mt-4 border-t border-[#800020] pt-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full p-3 border border-[#800020] rounded-lg focus:ring-2 focus:ring-[#800020] focus:outline-none"
              placeholder="Napište nový komentář..."
            />
            <button
              onClick={handleAddComment}
              className="bg-[#800020] hover:bg-[#5a0014] text-white px-4 py-2 rounded-lg mt-3 w-full transition-all shadow-md hover:shadow-lg"
            >
              Přidat komentář
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetail;
