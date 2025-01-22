import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Messages() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:5000/api/auth/profile`, { credentials: "include" })
      .then((res) => res.json())
      .then((user) =>
        setCurrentUser(typeof user === "string" ? JSON.parse(user) : user)
      )
      .catch((err) => console.error("Chyba při načítání uživatele:", err));
  }, []);

  useEffect(() => {
    const endpoint = search
      ? `http://localhost:5000/api/messages/users?search=${search}`
      : `http://localhost:5000/api/messages/recent-chats`;

    fetch(endpoint, { credentials: "include" })
      .then((res) => res.json())
      .then(search ? setUsers : setRecentChats)
      .catch((err) => console.error("Chyba při načítání:", err));
  }, [search]);

  useEffect(() => {
    if (selectedUser) {
      fetch(`http://localhost:5000/api/messages/${selectedUser.id}`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then(setMessages)
        .catch((err) => console.error("Chyba při načítání zpráv:", err));
    }
  }, [selectedUser]);

  const handleUserClick = (user) => {
    if (currentUser?.id === user.id) {
      alert("Nemůžete psát zprávy sami sobě.");
      return;
    }
    setSelectedUser(user);
    setMessages([]);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !currentUser) return;

    fetch(`http://localhost:5000/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        receiverId: selectedUser.id,
        content: newMessage,
      }),
    })
      .then(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender_id: currentUser.id,
            content: newMessage,
            sent_at: new Date().toISOString(),
          },
        ]);
        setNewMessage("");
      })
      .catch((err) => console.error("Chyba při odesílání zprávy:", err));
  };

  return (
    <div className="flex h-[calc(100vh-60px)] bg-gray-100">
      <div className="w-1/4 p-4 border-r bg-white shadow-md">
        <input
          type="text"
          placeholder="🔍 Hledat uživatele"
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ul className="mt-4 space-y-2">
          {(search ? users : recentChats).map((user) => (
            <li
              key={user.id}
              className="flex items-center p-2 cursor-pointer hover:bg-gray-200 rounded transition"
              onClick={() => handleUserClick(user)}
            >
              <img
                src={user.profile_picture}
                alt={user.username}
                className="w-10 h-10 rounded-full mr-3"
              />
              <span className="font-semibold">{user.username}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="w-3/4 p-4 flex flex-col">
        {selectedUser ? (
          <>
            <div
              className="flex items-center border-b pb-3 mb-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-burgundy-100 hover:scale-[1.03] active:scale-95"
              onClick={() => navigate(`/profile/${selectedUser.id}`)}
            >
              <img
                src={selectedUser.profile_picture}
                alt={selectedUser.username}
                className="w-12 h-12 rounded-full mr-3 border-2 border-burgundy-600 transition-transform duration-300 hover:rotate-6 hover:scale-110"
              />
              <h2 className="text-xl font-bold text-burgundy-800 transition-all duration-300 hover:tracking-wide">
                {selectedUser.username}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto bg-white p-4 rounded shadow-md">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    currentUser?.id === msg.sender_id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`p-3 m-1 rounded-lg text-sm max-w-xs ${
                      currentUser?.id === msg.sender_id
                        ? "bg-red-800 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <span className="block text-xs text-gray-200 mt-1">
                      {new Date(msg.sent_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 mb-4 flex items-center">
              <input
                type="text"
                className="flex-grow p-2 border rounded focus:ring-2 focus:ring-blue-400"
                placeholder="Napsat zprávu..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                className="p-2 ml-2 bg-red-800 text-white rounded hover:bg-red-700 transition"
                onClick={sendMessage}
              >
                Odeslat
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p className="text-lg">Vyberte uživatele pro chat 📩</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;
