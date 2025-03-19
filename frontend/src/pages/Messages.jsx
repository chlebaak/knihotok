import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function Messages() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true); // Pro mobilní přepínání
  const navigate = useNavigate();
  const messagesEndRef = useRef(null); // Reference pro automatické scrollování
  const chatContainerRef = useRef(null); // Reference na kontejner chatu

  // Detekce mobilní velikosti obrazovky
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // Na mobilech defaultně skrýt sidebar po výběru uživatele
        if (selectedUser) {
          setShowSidebar(false);
        }
      } else {
        // Na desktopu vždy zobrazit sidebar
        setShowSidebar(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Spustit při prvním načtení
    
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedUser]);

  // Upravené scrollování na konec zpráv - scrolluje pouze uvnitř kontejneru chatu
  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      // Scrollujeme pouze v rámci kontejneru chatu, ne celé stránky
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL_LOCAL}/api/auth/profile`, { credentials: "include" })
      .then((res) => res.json())
      .then((user) =>
        setCurrentUser(typeof user === "string" ? JSON.parse(user) : user)
      )
      .catch((err) => console.error("Chyba při načítání uživatele:", err));
  }, []);

  useEffect(() => {
    const endpoint = search
      ? `${import.meta.env.VITE_API_URL_LOCAL}/api/messages/users?search=${search}`
      : `${import.meta.env.VITE_API_URL_LOCAL}/api/messages/recent-chats`;

    fetch(endpoint, { credentials: "include" })
      .then((res) => res.json())
      .then(search ? setUsers : setRecentChats)
      .catch((err) => console.error("Chyba při načítání:", err));
  }, [search]);

  useEffect(() => {
    if (selectedUser) {
      fetch(`${import.meta.env.VITE_API_URL_LOCAL}/api/messages/${selectedUser.id}`, {
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
    
    // Na mobilním zobrazení skrýt sidebar po výběru uživatele
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !currentUser) return;

    fetch(`${import.meta.env.VITE_API_URL_LOCAL}/api/messages`, {
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
        
        // Zajistíme, že se kontejner scrollne na konec, ale ne celá stránka
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 100);
      })
      .catch((err) => console.error("Chyba při odesílání zprávy:", err));
  };

  // Zpět do seznamu uživatelů na mobilních zařízeních
  const goBackToUserList = () => {
    setShowSidebar(true);
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-60px)] bg-gray-50 relative">
      {/* Sidebar - Seznam uživatelů */}
      <div className={`${showSidebar ? 'block' : 'hidden'} md:block w-full md:w-1/4 border-r border-gray-200 bg-white shadow-lg overflow-hidden flex flex-col md:relative z-20`}>
        {/* Vyhledávací pole */}
        <div className="p-4 bg-gradient-to-r from-[#800020]/90 to-[#800020] shadow-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Vyhledat uživatele..."
              className="w-full p-3 pl-10 border-0 rounded-lg shadow-inner bg-white/90 focus:bg-white focus:ring-2 focus:ring-[#800020]/50 focus:outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="absolute left-3 top-3 text-[#800020]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
        </div>
        
        {/* Seznam uživatelů */}
        <div className="flex-1 overflow-y-auto p-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 px-2">
            {search ? "Výsledky vyhledávání" : "Nedávné konverzace"}
          </h3>
          <ul className="space-y-1">
            {(search ? users : recentChats).length > 0 ? (
              (search ? users : recentChats).map((user) => (
                <li
                  key={user.id}
                  className={`flex items-center p-2.5 rounded-lg cursor-pointer transition-all ${
                    selectedUser?.id === user.id 
                      ? "bg-[#800020]/10 border-l-4 border-[#800020]" 
                      : "hover:bg-gray-100 border-l-4 border-transparent"
                  }`}
                  onClick={() => handleUserClick(user)}
                >
                  <div className="relative">
                    <img
                      src={user.profile_picture || "https://via.placeholder.com/40"}
                      alt={user.username}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover mr-3 border-2 ${
                        selectedUser?.id === user.id ? "border-[#800020]" : "border-gray-200"
                      }`}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/40?text=" + user.username.charAt(0).toUpperCase();
                      }}
                    />
                    <span className="absolute bottom-0 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{user.username}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.last_message || "Začněte konverzaci"}
                    </p>
                  </div>
                </li>
              ))
            ) : (
              <li className="py-4 px-2 text-center text-gray-500">
                <p>Žádní uživatelé nenalezeni</p>
                <p className="text-sm mt-1 text-gray-400">
                  {search ? "Zkuste jiné vyhledávací kritérium" : "Zahajte novou konverzaci vyhledáním uživatele"}
                </p>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Hlavní obsah chatu - přidána třída h-full pro zajištění výšky na mobilních zařízeních */}
      <div className={`${showSidebar ? 'hidden' : 'flex'} md:flex w-full md:w-3/4 flex-col bg-gray-50 h-full`}>
        {selectedUser ? (
          // Přidán flex a flex-col pro mobile-first přístup k rozvržení
          <div className="flex flex-col h-full">
            {/* Hlavička chatu */}
            <div className="p-4 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between flex-shrink-0">
              {/* Tlačítko zpět pro mobilní zobrazení */}
              <button 
                className="md:hidden mr-2 p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                onClick={goBackToUserList}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#800020]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div 
                className="flex items-center cursor-pointer flex-1" 
                onClick={() => navigate(`/profile/${selectedUser.id}`)}
              >
                <img
                  src={selectedUser.profile_picture || "https://via.placeholder.com/48"}
                  alt={selectedUser.username}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover mr-3 border-2 border-[#800020] hover:shadow-md transition-all"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/48?text=" + selectedUser.username.charAt(0).toUpperCase();
                  }}
                />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 hover:text-[#800020] transition-colors">
                    {selectedUser.username}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {selectedUser.status === "online" ? (
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> Online
                      </span>
                    ) : (
                      "Offline"
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Oblast zpráv - flex-grow-1 zajistí, že zabere dostupný prostor mezi hlavičkou a formulářem */}
            <div 
              ref={chatContainerRef}
              className="flex-grow overflow-y-auto p-2 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100"
            >
              <div className="min-h-full relative">
                {/* Jemný vzor pozadí */}
                <div className="absolute inset-0 opacity-5" style={{ 
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23800020' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundSize: '20px 20px'
                }}></div>
                
                {/* Obsah zpráv */}
                <div className="relative z-10">
                  {messages.length > 0 ? (
                    <div className="space-y-3 pb-2">
                      {messages.map((msg, idx) => {
                        const isCurrentUser = currentUser?.id === msg.sender_id;
                        const showAvatar = idx === 0 || 
                          messages[idx-1].sender_id !== msg.sender_id;
                        
                        return (
                          <div
                            key={idx}
                            className={`flex items-end ${
                              isCurrentUser ? "justify-end" : "justify-start"
                            }`}
                          >
                            {!isCurrentUser && showAvatar && (
                              <img 
                                src={selectedUser.profile_picture || "https://via.placeholder.com/32"} 
                                alt={selectedUser.username}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full mr-2 mb-1 object-cover shadow-sm" 
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://ui-avatars.com/api/?name=${selectedUser.username}&background=800020&color=fff`;
                                }}
                              />
                            )}
                            
                            <div
                              className={`p-2 sm:p-3 rounded-2xl max-w-[75%] sm:max-w-xs lg:max-w-md ${
                                isCurrentUser
                                  ? "bg-gradient-to-br from-[#800020] to-[#600010] text-white rounded-tr-none shadow-md"
                                  : "bg-white text-gray-800 rounded-tl-none shadow"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words text-sm sm:text-base">{msg.content}</p>
                              <span className={`block text-xs mt-1 ${
                                isCurrentUser ? "text-white/70" : "text-gray-500"
                              }`}>
                                {new Date(msg.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                            
                            {isCurrentUser && showAvatar && (
                              <img 
                                src={currentUser.profile_picture || "https://via.placeholder.com/32"} 
                                alt={currentUser.username}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full ml-2 mb-1 object-cover shadow-sm" 
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://ui-avatars.com/api/?name=${currentUser.username}&background=800020&color=fff`;
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                      {/* Reference pro automatické scrollování na konec - nyní uvnitř kontejneru */}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center p-4 sm:p-6 bg-white rounded-lg shadow-md border border-gray-100 max-w-[90%]">
                        <div className="text-3xl sm:text-4xl mb-3">💬</div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1">
                          Nová konverzace
                        </h3>
                        <p className="text-gray-500 text-sm sm:text-base">
                          Napište {selectedUser.username} zprávu a začněte konverzaci
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Formulář pro novou zprávu - flex-shrink-0 zajistí, že zůstane na spodní části*/}
            <div className="p-2 sm:p-4 bg-white border-t border-gray-200 flex-shrink-0">
              <div className="flex">
                <input
                  type="text"
                  className="flex-grow p-2 sm:p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-[#800020] focus:border-[#800020] focus:outline-none text-sm sm:text-base"
                  placeholder="Napište zprávu..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  className="px-3 sm:px-6 py-2 sm:py-3 bg-[#800020] text-white rounded-r-lg hover:bg-[#5a0014] disabled:bg-gray-400 transition-colors flex items-center"
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                  <span className="hidden sm:inline">Odeslat</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-4 sm:p-8">
            <div className="max-w-md w-full text-center bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200">
              <div className="bg-[#800020]/10 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 text-[#800020]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Vítejte v chatu</h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                Vyberte uživatele ze seznamu nebo vyhledejte někoho nového pro začátek konverzace
              </p>
              <div className="text-xs sm:text-sm text-gray-500 border-t border-gray-100 pt-4">
                <p>Tip: Pomocí vyhledávacího pole můžete najít další uživatele</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;