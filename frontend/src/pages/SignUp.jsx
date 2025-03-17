import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo.png";

export default function SignUp() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }

    try {
      console.log(formData);
      const response = await axios.post(
      `${import.meta.env.VITE_API_URL_LOCAL}/api/auth/register`,
      {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      }
      );
      setMessage(response.data.message || "Registration successful!");
      navigate("/Login");
    } catch (error) {
      setMessage(error.response?.data?.error || "Error during registration.");
    }
  };

  return (
    <section className="bg-white flex items-center justify-center min-h-screen p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="relative bg-white/80 backdrop-blur-lg border border-white/20 shadow-lg rounded-2xl p-8 w-full max-w-md"
      >
        <motion.a 
          href="#" 
          className="flex items-center justify-center mb-6 text-3xl font-semibold text-red-900"
          whileHover={{ scale: 1.05 }}
        >
          <img className="w-10 h-10 mr-2" src={logo} alt="logo" /> Knihotok
        </motion.a>
        <h1 className="text-2xl font-bold text-center text-gray-900">Vytvoř si účet</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {['username', 'email', 'password', 'confirmPassword'].map((field, index) => (
            <motion.div 
              key={field} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: index * 0.1 }}
            >
              <label htmlFor={field} className="block text-sm font-medium text-gray-900 capitalize">
                {field === 'confirmPassword' ? 'Confirm Password' : field}
              </label>
              <input
                type={field.includes('password') || field.includes('confirmPassword') ? 'password' : 'text'}
                name={field}
                id={field}
                className="w-full bg-white/90 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-red-700 focus:border-red-700 p-3"
                placeholder={field === 'email' ? 'xxxx@xxx.xx' : field}
                value={formData[field]}
                onChange={handleChange}
                required
              />
            </motion.div>
          ))}
          <motion.button 
            type="submit" 
            className="w-full text-white bg-red-900 hover:bg-red-700 transition-all focus:ring-4 focus:outline-none focus:ring-red-700 font-medium rounded-lg text-sm px-5 py-3 text-center mt-4"
            whileHover={{ scale: 1.02 }}
          >
            Zaregistrovat se
          </motion.button>
          {message && <p className="text-sm text-red-500 text-center">{message}</p>}
          <p className="text-sm text-gray-600 text-center mt-4">
            Už máš účet?{' '}
            <Link to="/LogIn" className="font-medium text-red-900 hover:underline">
              Přihlásit se
            </Link>
          </p>
        </form>
      </motion.div>
    </section>
  );
}
