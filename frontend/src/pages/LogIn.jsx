import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import logo from "../assets/logo.png";
import loginImage from "../assets/login4.png";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await login(formData);
      setMessage("Přihlášení bylo úspěšné.");
      navigate("/");
      window.location.reload();
    } catch (error) {
      setMessage(error.response?.data?.error || "Chyba při přihlášení.");
      console.error("Login error:", error.response || error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-gray-50 to-[#f8e5e5]">
      <div className="flex flex-col md:flex-row max-w-6xl w-full mx-4 my-8 rounded-2xl shadow-xl overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 relative"
        >
          <motion.a
            href="#"
            className="group flex items-center mb-8 relative"
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

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center">
            Přihlášení do účtu
          </h1>

          <form className="w-full max-w-md space-y-6" onSubmit={handleSubmit}>
            {["email", "password"].map((field, index) => (
              <motion.div
                key={field}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <label
                  htmlFor={field}
                  className="block text-sm font-medium text-gray-700"
                >
                  {field === "password" ? "Heslo" : "Email"}
                </label>
                <div className="relative">
                  <input
                    type={field}
                    name={field}
                    id={field}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm
                           focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020] transition-all duration-200"
                    placeholder={
                      field === "email" ? "vas@email.cz" : "••••••••"
                    }
                    value={formData[field]}
                    onChange={handleChange}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {field === "email" ? (
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            <motion.button
              type="submit"
              className="w-full bg-gradient-to-r from-[#800020] to-[#aa0030] text-white font-medium rounded-xl
                     px-6 py-3 text-sm shadow-sm hover:shadow-md transform hover:scale-[1.02] 
                     transition-all duration-200 focus:ring-2 focus:ring-[#800020]/50 focus:outline-none
                     disabled:opacity-70 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                  <span>Přihlašování...</span>
                </div>
              ) : (
                "Přihlásit se"
              )}
            </motion.button>

            {message && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm text-center p-3 rounded-lg ${
                  message.includes("úspěšné")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </motion.p>
            )}

            <p className="text-sm text-gray-600 text-center">
              Nemáš účet?{" "}
              <Link
                to="/SignUp"
                className="font-medium text-[#800020] hover:text-[#aa0030] transition-colors duration-200"
              >
                Zaregistrovat se →
              </Link>
            </p>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden md:block w-2/5 relative bg-[#fdf6f6]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#800020]/5 to-transparent"></div>
          <div
            className="absolute inset-0 bg-contain bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${loginImage})`,
              filter: "drop-shadow(0 0 20px rgba(128, 0, 32, 0.1))",
            }}
          ></div>
        </motion.div>
      </div>
    </section>
  );
}
