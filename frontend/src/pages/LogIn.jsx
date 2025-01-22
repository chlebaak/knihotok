import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext"; // Import AuthContext
import logo from "../assets/logo.png";
import loginImage from "../assets/login2.png";

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
    <section className="bg-white">
      <div className="flex flex-col md:flex-row h-screen">
        <div className="flex flex-col justify-center items-center w-full md:w-1/2 px-6 py-8">
          <Link
            to="/"
            className="flex items-center mb-6 text-2xl font-semibold text-[#800020]"
          >
            <img className="w-8 h-8 mr-2" src={logo} alt="logo" />
            Knihotok
          </Link>
          <div className="w-full bg-white rounded-lg shadow border sm:max-w-md">
            <div className="p-6 space-y-4 sm:p-8">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                Přihlaš se do svého účtu
              </h1>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="email"
                    className="block mb-2 text-sm font-medium text-gray-900"
                  >
                    Your email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block mb-2 text-sm font-medium text-gray-900"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    placeholder="••••••••"
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full text-white bg-red-900 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  disabled={loading}
                >
                  {loading ? "Přihlašování..." : "Přihlásit se"}
                </button>
                {message && (
                  <p
                    className={`text-sm ${
                      message.includes("úspěšné")
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {message}
                  </p>
                )}
                <p className="text-sm font-light text-gray-500">
                  Nemáš účet?{" "}
                  <Link
                    to="/SignUp"
                    className="font-medium text-primary-600 hover:underline"
                  >
                    Zaregistrovat se
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
        <div
          className="hidden md:flex w-full md:w-1/2 bg-cover bg-center m-20"
          style={{ backgroundImage: `url(${loginImage})` }}
        ></div>
      </div>
    </section>
  );
}
