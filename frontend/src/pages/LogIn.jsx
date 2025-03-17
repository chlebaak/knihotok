import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext"; // Import AuthContext
import logo from "../assets/logo.png";
import loginImage from "../assets/login4.png";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth(); // Přístup k login funkci z AuthContextu
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await login(formData); // Volání login funkce z AuthContextu
      setMessage("Přihlášení bylo úspěšné.");
      navigate("/"); // Přesměrování na profil
      window.location.reload(); // Obnovení stránky
    } catch (error) {
      setMessage(error.response?.data?.error || "Chyba při přihlášení.");
      console.error("Login error:", error.response || error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white flex items-center justify-center min-h-screen">
      <div className="flex flex-col md:flex-row h-screen w-full max-w-7xl shadow-lg rounded-lg overflow-hidden my-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.5 }}

          className="flex flex-col justify-center items-center w-full md:w-1/2 px-8 py-12 bg-white backdrop-blur-lg"
        >
          <motion.a 
            href="#" 
            className="flex items-center mb-6 text-3xl font-semibold text-red-900"
            whileHover={{ scale: 1.05 }}
          >
            <img className="w-10 h-10 mr-2" src={logo} alt="logo" /> Knihotok
          </motion.a>
          <h1 className="text-2xl font-bold text-gray-900 text-center">Přihlaš se do svého účtu</h1>
          <form className="mt-6 space-y-6 w-full max-w-sm" onSubmit={handleSubmit}>
            {['email', 'password'].map((field, index) => (
              <motion.div 
                key={field} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.1 }}
              >
                <label htmlFor={field} className="block text-sm font-medium text-gray-900 capitalize">
                  {field === 'password' ? 'Password' : 'Your Email'}
                </label>
                <input
                  type={field}
                  name={field}
                  id={field}
                  className="w-full bg-white/90 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-red-700 focus:border-red-700 p-3"
                  placeholder={field === 'email' ? 'name@company.com' : '••••••••'}
                  value={formData[field]}
                  onChange={handleChange}
                  required
                />
              </motion.div>
            ))}
            <motion.button 
              type="submit" 
              className="w-full text-white bg-red-900 hover:bg-red-700 transition-all focus:ring-4 focus:outline-none focus:ring-red-700 font-medium rounded-lg text-sm px-5 py-3 text-center"
              whileHover={{ scale: 1.02 }}
              disabled={loading}
            >
              {loading ? "Přihlašování..." : "Přihlásit se"}
            </motion.button>
            {message && (
              <p className={`text-sm text-center ${message.includes("úspěšné") ? "text-green-500" : "text-red-500"}`}>
                {message}
              </p>
            )}
            <p className="text-sm text-gray-600 text-center mt-4">
              Nemáš účet?{' '}
              <Link to="/SignUp" className="font-medium text-red-900 hover:underline">
                Zaregistrovat se
              </Link>
            </p>
          </form>
        </motion.div>
        <motion.div 
  initial={{ opacity: 0, x: 20 }} 
  animate={{ opacity: 1, x: 0 }} 
  transition={{ duration: 0.5 }}
  className="hidden md:flex w-full md:w-2/5 bg-cover bg-center p-6"
  style={{ 
    backgroundImage: `url(${loginImage})`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat'
  }}
></motion.div>
      </div>
    </section>
  );
}
