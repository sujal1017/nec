/* 
dev - amuruta
dev- viraj (jwt auth)
*/
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { BaseUrl } from "../../../config";


export default function Login() {
  const navigate = useNavigate();
  const [signin, setSignin] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
   const [loading, setLoading] = useState("");


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
      setSignin(true);
      console.log("bhai  ja raha hai");
      const response = await axios.post(`${BaseUrl}/customer/login/`, {
        username: form.email,
        password: form.password,
      });
      if (response.status === 200) {
        const token = response.data.access;
        localStorage.setItem("token", token);
        navigate("/");
      }
      else if (response.status === 400) {
        setError("Invalid credentials. Please try again.");
      }
      else if (response.status === 500) {
        setError("Server error. Please try again later.");
      }
      else if (response.status === 404) {
        setError("User not found. Please check your email.");
      }
      else if (response.status === 401) {
        setError("Unauthorized access. Please check your credentials.");
      }
    } catch (err) {
      const serverError = err.response?.data?.error || "Login failed. Try again.";
      setError(serverError);
    }
    finally {
      setSignin(false);
    }
  };

  return (
    <div className="flex min-h-screen font-sans bg-gray-50 flex-col justify-center items-center md:flex-row md:items-stretch">
      {/* Left Section - Hidden on mobile, visible on tablet/desktop */}
      <div className="hidden md:flex md:w-1/2 bg-blue-600 text-white flex-col justify-center px-20 py-12 relative overflow-hidden">
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
      <div className="w-full flex justify-center items-center md:w-1/2 px-4">
        <div className="max-w-md w-[90%] md:w-full bg-white p-8 rounded-xl shadow-xl my-4">
          <h2 className="text-3xl font-bold mb-2 text-gray-900 md:text-left text-center">Welcome back!</h2>
          <p className="text-gray-500 text-sm mb-8 md:text-left text-center">
            Clarity gives you the blocks and components you need to create a truly professional website.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="mb-5 flex flex-col items-center md:items-start">
              <label className="block text-sm font-medium text-gray-700 mb-2 w-full">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:w-[120%] md:focus:w-full md:focus:ml-0 h-10"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10"
                placeholder="Enter your password"
              />
            </div>
            <div className="flex items-center justify-between text-sm mb-6">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2 rounded-sm" /> Remember me
              </label>
              <a href="/forgotPassword" className="text-blue-500 hover:underline">
                Forgot password?
              </a>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <button
              type="submit"
              onClick={handleSubmit}
              disabled={signin} // 🔹 Disable button while signing in
              className={`w-full text-white py-2.5 rounded-lg font-semibold transition duration-200 
    ${signin
                  ? "bg-green-400 cursor-not-allowed opacity-70" // 🔹 Lighter + disabled look
                  : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {signin ? "Signing in..." : "Sign in"}
            </button>

          </form>

          <p className="text-sm text-center text-gray-600 mt-6">
            Don't have an account?{" "}
          </p>
          <Link to="/signup" className="text-blue-500 hover:underline text-center block text-sm">
            Create free account
          </Link>
        </div>
      </div>
    </div>
  );
}
