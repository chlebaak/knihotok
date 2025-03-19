import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import logo from "../assets/logo.png";

export default function SignUp() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setMessage("Hesla se neshodují!");
      toast.error("Hesla se neshodují!");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/auth/register`,
        {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }
      );
      
      // Úspěšná registrace
      setMessage(response.data.message || "Registrace byla úspěšná!");
      toast.success("Registrace proběhla úspěšně! Přesměrováváme na přihlášení...", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Počkáme 1,5 sekundy, aby uživatel mohl vidět zprávu o úspěchu, a poté přesměrujeme
      setTimeout(() => {
        navigate("/Login");
      }, 1500);
      
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Chyba při registraci.";
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getFieldIcon = (field) => {
    switch(field) {
      case 'email':
        return (
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        );
      case 'username':
        return (
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-gray-50 to-[#f8e5e5] p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Dekorativní prvek */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#800020] to-[#aa0030]"></div>
        
        <div className="p-8">
          {/* Logo a název */}
          <motion.a 
            href="#" 
            className="group flex items-center justify-center mb-8 relative"
            whileHover={{ scale: 1.05 }}
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#5a0014]/30 to-[#800020]/30 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-sm scale-110"></div>
              <img className="w-12 h-12 relative z-10" src={logo} alt="logo" />
            </div>
            <span className="ml-3 text-3xl font-bold bg-gradient-to-r from-[#800020] to-[#aa0030] bg-clip-text text-transparent">
              Knihotok
            </span>
          </motion.a>

          <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8">
            Vytvoř si účet
          </h1>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {['username', 'email', 'password', 'confirmPassword'].map((field, index) => (
              <motion.div 
                key={field} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <label htmlFor={field} className="block text-sm font-medium text-gray-700">
                  {field === 'confirmPassword' ? 'Potvrzení hesla' : 
                   field === 'password' ? 'Heslo' :
                   field === 'username' ? 'Uživatelské jméno' : 'Email'}
                </label>
                <div className="relative">
                  <input
                    type={field.includes('password') ? 'password' : 'text'}
                    name={field}
                    id={field}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm
                             focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020] transition-all duration-200"
                    placeholder={
                      field === 'email' ? 'vas@email.cz' : 
                      field === 'username' ? 'Zadejte uživatelské jméno' :
                      '••••••••'
                    }
                    value={formData[field]}
                    onChange={handleChange}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {getFieldIcon(field)}
                  </div>
                </div>
              </motion.div>
            ))}

            <motion.button 
              type="submit" 
              className={`w-full bg-gradient-to-r from-[#800020] to-[#aa0030] text-white font-medium rounded-xl
                       px-6 py-3.5 text-sm shadow-sm hover:shadow-md transform hover:scale-[1.02] 
                       transition-all duration-200 focus:ring-2 focus:ring-[#800020]/50 focus:outline-none
                       ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registruji...
                </span>
              ) : (
                "Vytvořit účet"
              )}
            </motion.button>

            {message && !loading && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg text-sm text-center ${
                  message.includes("úspěšně") || message.includes("successful") 
                    ? "bg-green-50 text-green-700 border border-green-200" 
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </motion.div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">nebo</span>
              </div>
            </div>

            <p className="text-sm text-gray-600 text-center">
              Už máš účet?{' '}
              <Link 
                to="/LogIn" 
                className="font-medium text-[#800020] hover:text-[#aa0030] transition-colors duration-200"
              >
                Přihlásit se →
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </section>
  );
}