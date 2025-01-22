import { useState } from "react";
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
        "http://localhost:5000/api/auth/register",
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
    <section className="bg-gray-50">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <a
          href="#"
          className="flex items-center mb-6 text-2xl font-semibold text-gray-900"
        >
          <img className="w-8 h-8 mr-2" src={logo} alt="logo" />
          Knihotok
        </a>
        <div className="w-full bg-white rounded-lg shadow border md:mt-0 sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
              Vytvoř si účet
            </h1>
            <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="username"
                  className="block mb-2 text-sm font-medium text-gray-900"
                >
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  id="username"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
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
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                  placeholder="xxxx@xxx.xx"
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
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block mb-2 text-sm font-medium text-gray-900"
                >
                  Confirm password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  placeholder="••••••••"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full text-white bg-red-900 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
              >
                Zaregistrovat se
              </button>
              {message && <p className="text-sm text-red-500">{message}</p>}
              <p className="text-sm font-light text-gray-500">
                Už máš účet?{" "}
                <Link
                  to="/LogIn"
                  className="font-medium text-primary-600 hover:underline"
                >
                  Přihlásit se
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
