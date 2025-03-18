import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/user_icon.png"; // Import your default avatar

const FriendsPage = () => {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState({
    friends: true,
    requests: true,
    search: false,
  });
  const [error, setError] = useState({
    friends: null,
    requests: null,
    search: null,
  });
  const searchTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState(null);


  // Fetch friends and friend requests on component mount
  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  // Handle search input changes with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length >= 2) {
      setLoading((prev) => ({ ...prev, search: true }));
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers();
      }, 500);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Fetch friends list
  const fetchFriends = async () => {
    setLoading((prev) => ({ ...prev, friends: true }));
    setError((prev) => ({ ...prev, friends: null }));

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/friends`,
        { withCredentials: true }
      );
      setFriends(response.data.friends);
    } catch (err) {
      console.error("Error fetching friends:", err);
      setError((prev) => ({
        ...prev,
        friends: "Chyba při načítání přátel. Zkuste to prosím později.",
      }));
      toast.error("Nepodařilo se načíst přátele.");
    } finally {
      setLoading((prev) => ({ ...prev, friends: false }));
    }
  };

  // Fetch friend requests
  const fetchFriendRequests = async () => {
    setLoading((prev) => ({ ...prev, requests: true }));
    setError((prev) => ({ ...prev, requests: null }));

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/friends/requests`,
        { withCredentials: true }
      );
      setFriendRequests(response.data.requests);
    } catch (err) {
      console.error("Error fetching friend requests:", err);
      setError((prev) => ({
        ...prev,
        requests: "Chyba při načítání žádostí. Zkuste to prosím později.",
      }));
      toast.error("Nepodařilo se načíst žádosti o přátelství.");
    } finally {
      setLoading((prev) => ({ ...prev, requests: false }));
    }
  };

  // Search users to add as friends
  const searchUsers = async () => {
    if (searchQuery.length < 2) return;

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/friends/search`,
        {
          params: { query: searchQuery },
          withCredentials: true,
        }
      );
      setSearchResults(response.data.users);
      setError((prev) => ({ ...prev, search: null }));
    } catch (err) {
      console.error("Error searching users:", err);
      setError((prev) => ({
        ...prev,
        search: "Chyba při hledání uživatelů. Zkuste to prosím později.",
      }));
      setSearchResults([]);
    } finally {
      setLoading((prev) => ({ ...prev, search: false }));
    }
  };

  // Send friend request
  const sendFriendRequest = async (receiverId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/friends/request`,
        { receiverId },
        { withCredentials: true }
      );
      
      // Remove user from search results
      setSearchResults((prev) => 
        prev.filter((user) => user.id !== receiverId)
      );
      
      toast.success("Žádost o přátelství byla odeslána");
    } catch (err) {
      console.error("Error sending friend request:", err);
      toast.error(
        err.response?.data?.error || "Nepodařilo se odeslat žádost o přátelství."
      );
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (requestId) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/friends/accept/${requestId}`,
        {},
        { withCredentials: true }
      );
      
      toast.success("Žádost o přátelství byla přijata");
      
      // Update UI
      fetchFriendRequests();
      fetchFriends();
    } catch (err) {
      console.error("Error accepting friend request:", err);
      toast.error(
        err.response?.data?.error || "Nepodařilo se přijmout žádost o přátelství."
      );
    }
  };

  // Reject friend request
  const rejectFriendRequest = async (requestId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/friends/reject/${requestId}`,
        { withCredentials: true }
      );
      
      toast.success("Žádost o přátelství byla odmítnuta");
      
      // Update friend requests list
      setFriendRequests((prev) =>
        prev.filter((request) => request.id !== requestId)
      );
    } catch (err) {
      console.error("Error rejecting friend request:", err);
      toast.error(
        err.response?.data?.error || "Nepodařilo se odmítnout žádost o přátelství."
      );
    }
  };

  // Remove friend
  const removeFriend = async (friendId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/friends/${friendId}`,
        { withCredentials: true }
      );
      
      toast.success("Přátelství bylo odstraněno");
      
      // Update friends list
      setFriends((prev) => 
        prev.filter((friend) => friend.id !== friendId)
      );
    } catch (err) {
      console.error("Error removing friend:", err);
      toast.error(
        err.response?.data?.error || "Nepodařilo se odstranit přátelství."
      );
    }
  };

  // Navigate to user profile
  const navigateToProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.friend-dropdown')) {
        setOpenMenuId(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const toggleMenu = (friendId) => {
    setOpenMenuId(openMenuId === friendId ? null : friendId);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#800020] mb-8">Přátelé</h1>

      {/* Search section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Najít nové přátele
        </h2>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-[#800020]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
          <input
            type="text"
            className="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-[#800020] focus:border-[#800020]"
            placeholder="Hledat uživatele podle jména..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            required
          />
        </div>

        {/* Search results */}
        <div className="mt-4">
          {loading.search ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#800020]"></div>
            </div>
          ) : error.search ? (
            <p className="text-red-500 text-center py-4">{error.search}</p>
          ) : searchResults.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {searchResults.map((user) => (
                <li key={user.id} className="py-4 flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <img
                      src={user.profile_picture || defaultAvatar}
                      alt={`${user.username}'s avatar`}
                      className="h-10 w-10 rounded-full object-cover cursor-pointer"
                      onClick={() => navigateToProfile(user.id)}
                    />
                    <div>
                      <h3 
                        className="text-lg font-medium text-gray-900 cursor-pointer hover:text-[#800020]"
                        onClick={() => navigateToProfile(user.id)}
                      >
                        {user.username}
                      </h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => sendFriendRequest(user.id)}
                    className="ml-4 px-4 py-2 bg-[#800020] text-white rounded-lg hover:bg-[#600018] transition duration-200 flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      ></path>
                    </svg>
                    Přidat přítele
                  </button>
                </li>
              ))}
            </ul>
          ) : searchQuery.length >= 2 ? (
            <p className="text-gray-500 text-center py-4">
              Nenalezeni žádní uživatelé s tímto jménem.
            </p>
          ) : searchQuery.length > 0 ? (
            <p className="text-gray-500 text-center py-4">
              Zadejte alespoň 2 znaky pro vyhledávání.
            </p>
          ) : null}
        </div>
      </div>

      {/* Friend requests section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Žádosti o přátelství{" "}
          {friendRequests.length > 0 && (
            <span className="bg-[#800020] text-white text-sm px-2.5 py-0.5 rounded-full ml-2">
              {friendRequests.length}
            </span>
          )}
        </h2>

        {loading.requests ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#800020]"></div>
          </div>
        ) : error.requests ? (
          <p className="text-red-500 text-center py-4">{error.requests}</p>
        ) : friendRequests.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {friendRequests.map((request) => (
              <li key={request.id} className="py-4 flex flex-wrap md:flex-nowrap justify-between items-center">
                <div className="flex items-center space-x-4 w-full mb-4 md:mb-0 md:w-auto">
                  <img
                    src={request.profile_picture || defaultAvatar}
                    alt={`${request.username}'s avatar`}
                    className="h-10 w-10 rounded-full object-cover cursor-pointer"
                    onClick={() => navigateToProfile(request.id)}
                  />
                  <div>
                    <h3 
                      className="text-lg font-medium text-gray-900 cursor-pointer hover:text-[#800020]"
                      onClick={() => navigateToProfile(request.id)}
                    >
                      {request.username}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(request.request_date).toLocaleDateString("cs-CZ", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3 w-full md:w-auto justify-end">
                  <button
                    onClick={() => acceptFriendRequest(request.id)}
                    className="px-4 py-2 bg-[#800020] text-white rounded-lg hover:bg-[#600018] transition duration-200"
                  >
                    Přijmout
                  </button>
                  <button
                    onClick={() => rejectFriendRequest(request.id)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200"
                  >
                    Odmítnout
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center py-4">
            Nemáte žádné nové žádosti o přátelství.
          </p>
        )}
      </div>

      {/* Friends list section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Vaši přátelé{" "}
          {friends.length > 0 && (
            <span className="bg-gray-200 text-gray-800 text-sm px-2.5 py-0.5 rounded-full ml-2">
              {friends.length}
            </span>
          )}
        </h2>

        {loading.friends ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#800020]"></div>
          </div>
        ) : error.friends ? (
          <p className="text-red-500 text-center py-4">{error.friends}</p>
        ) : friends.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={friend.profile_picture || defaultAvatar}
                      alt={`${friend.username}'s avatar`}
                      className="h-12 w-12 rounded-full object-cover cursor-pointer"
                      onClick={() => navigateToProfile(friend.id)}
                    />
                    <div>
                      <h3 
                        className="text-lg font-medium text-gray-900 cursor-pointer hover:text-[#800020]"
                        onClick={() => navigateToProfile(friend.id)}
                      >
                        {friend.username}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Přátelé od {new Date(friend.friendship_date).toLocaleDateString("cs-CZ", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="relative friend-dropdown">
  <button 
    className="text-gray-500 hover:text-[#800020] focus:outline-none p-2 rounded-full hover:bg-gray-100"
    onClick={(e) => {
      e.stopPropagation();
      toggleMenu(friend.id);
    }}
    aria-label="Možnosti"
  >
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
    </svg>
  </button>
  {openMenuId === friend.id && (
    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20 border border-gray-200">
      <div className="py-1">
        <a
          href={`/messages`}
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          Poslat zprávu
        </a>
        <button
          onClick={() => {
            removeFriend(friend.id);
            setOpenMenuId(null);
          }}
          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
        >
          Odebrat z přátel
        </button>
      </div>
    </div>
  )}
</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              ></path>
            </svg>
            <p className="mt-2 text-sm text-gray-500">
              Zatím nemáte žádné přátele. Vyhledejte uživatele a pošlete jim žádost o přátelství.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;