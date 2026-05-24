 /* 
 dev - amuruta
 dev- viraj (jwt auth)
 */ 
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // Clear error on change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        email: form.email,
        password: form.password,
      });

      const token = response.data.token;
      localStorage.setItem("token", token);
      navigate("/main");
    } catch (err) {
      const serverError = err.response?.data?.error || "Login failed. Try again.";
      setError(serverError);
    }
  };

  return (
    <div className="flex min-h-screen font-sans bg-gray-50">
      {/* Left Section */}
      <div className="w-1/2 bg-blue-600 text-white flex flex-col justify-center px-20 py-12 relative overflow-hidden">
        <h1 className="text-5xl font-extrabold leading-tight mb-6">
          Welcome to our <br /> community
        </h1>
        <p className="text-lg text-blue-200 mb-12 max-w-md">
          Buy with your price tag, bargain with seller like on road
        </p>

        {/* Testimonial */}
        <div className="bg-white text-gray-900 p-6 rounded-2xl shadow-2xl w-[26rem]">
          <div className="flex mb-3">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-yellow-400 text-xl">★</span>
            ))}
          </div>
          <p className="mb-5 text-base leading-relaxed">
            "Good platform supports bargain system and is available with all kinds of products."
          </p>
          <div className="flex items-center">
            <img
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt="Devon Lane"
              className="w-12 h-12 rounded-full mr-4"
            />
            <div>
              <p className="font-semibold text-sm">Devon Lane</p>
              <p className="text-xs text-gray-500">Customer</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-[-50px] right-[-50px] opacity-20">
          <svg className="w-80 h-80 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="100" strokeWidth="10" />
          </svg>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-1/2 flex items-center justify-center px-16">
        <div className="max-w-md w-full bg-white p-10 rounded-xl shadow-xl">
          <h2 className="text-3xl font-bold mb-2 text-gray-900">Welcome back!</h2>
          <p className="text-gray-500 text-sm mb-8">
            Clarity gives you the blocks and components you need to create a truly professional website.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>
            <div className="flex items-center justify-between text-sm mb-6">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2 rounded-sm" /> Remember me
              </label>
              <a href="#" className="text-blue-500 hover:underline">
                Forgot password?
              </a>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
            >
              Sign in
            </button>
          </form>

          <p className="text-sm text-center text-gray-600 mt-6">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-blue-500 hover:underline">
              Create free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
