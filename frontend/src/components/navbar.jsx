import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import logo from "../assets/logo.png";
import userIcon from "../assets/user_icon.png";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/Login");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white border-gray-200">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4 relative">
        <Link
          to="/"
          className="flex items-center space-x-3 rtl:space-x-reverse"
        >
          <img src={logo} className="h-8" alt="Logo" />
          <span className="self-center text-2xl font-semibold whitespace-nowrap">
            Knihotok
          </span>
        </Link>

        <div className="flex items-center space-x-3 rtl:space-x-reverse md:order-2 relative">
          {user ? (
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <img
                  className="w-8 h-8 rounded-full"
                  src={user.profile_picture || userIcon}
                  alt="user"
                />
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 z-50 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow">
                  <div className="px-4 py-3">
                    <span className="block text-sm text-gray-900">
                      {user.username}
                    </span>
                    <span className="block text-sm text-gray-500 truncate">
                      {user.email}
                    </span>
                  </div>
                  <ul className="py-2">
                    <li>
                      <Link
                        to={`/profile/${user.id}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Profil
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={`/friends`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Přátelé
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={`/messages`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Zprávy
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/rank"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Rank
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Odhlásit se
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <Link
  to="/Login"
  className="group relative inline-flex items-center justify-center px-5 py-2.5 
            text-sm font-medium tracking-wide text-white 
            bg-gradient-to-r from-[#800020] to-[#aa0030]
            rounded-lg overflow-hidden transition-all duration-300
            hover:shadow-lg hover:shadow-[#800020]/30 
            focus:outline-none focus:ring-2 focus:ring-[#800020] focus:ring-offset-2"
>
  <span className="relative flex items-center gap-2">
    <svg 
      className="w-4 h-4 transform transition-transform duration-300 group-hover:-translate-x-1" 
      fill="currentColor" 
      viewBox="0 0 24 24"
    >
      <path d="M20 12a1 1 0 0 0-1-1h-7.59l2.3-2.29a1 1 0 1 0-1.42-1.42l-4 4a1 1 0 0 0-.21.33 1 1 0 0 0 0 .76 1 1 0 0 0 .21.33l4 4a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42L11.41 13H19a1 1 0 0 0 1-1Z"/>
    </svg>
    <span className="relative group-hover:translate-x-1 transition-transform duration-300">
      Přihlásit se
    </span>
  </span>
</Link>
          )}

          <button
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 17 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M1 1h15M1 7h15M1 13h15"
              />
            </svg>
          </button>
        </div>

        <div
          className={`items-center justify-between w-full md:flex md:w-auto md:order-1 ${
            isMenuOpen ? "block" : "hidden"
          }`}
        >
          <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-white">
            <li>
              <Link
                to="/"
                className="block py-2 px-3 text-white bg-red-700 rounded md:bg-transparent md:text-red-700 md:p-0"
              >
                Domov
              </Link>
            </li>
            <li>
              <Link
                to="/posts"
                className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-red-700 md:p-0"
              >
                Příspěvky
              </Link>
            </li>
            
            <li>
              <Link
                to="/zebricky"
                className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-red-700 md:p-0"
              >
                Žebříčky
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
