 /* 
 dev- amuruta
 dev- viraj (JWT auth)
 */ 
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import React, { useState } from "react";
import axios from "axios";

export default function Signup() {
  const navigate = useNavigate();
  const [type, setType] = useState("Private");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone:"",    
    password: "",
    confirmPassword: "",
    businessName: ""
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Full name is required.";

    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = "Invalid email format.";
    }

    if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    } else if (!/[!@#$%^&*(),.?\":{}|<>]/.test(form.password)) {
      newErrors.password = "Password must include at least one special character.";
    } else if (!/\d/.test(form.password)) {
      newErrors.password = "Password must include at least one number.";
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (type === "Business" && !form.businessName.trim()) {
      newErrors.businessName = "Business name is required.";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSuccess(false);
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/register", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        type,
        businessName: form.businessName || ""
      });

      setSuccess(true);
      navigate("/main");
    } catch (error) {
      const serverMsg = error.response?.data?.error || "Signup failed. Please try again.";
      setErrors({ email: serverMsg });
      setSuccess(false);
    }
  };

  return (
    <div className="flex min-h-screen font-sans bg-gradient-to-r from-white to-blue-50">
      <div className="w-1/2 bg-blue-600 text-white flex flex-col justify-center px-20 py-12 relative overflow-hidden">
        <h1 className="text-5xl font-extrabold leading-tight mb-6">
          Register and start <br /> selling products at your original cost
        </h1>
        <p className="text-lg text-blue-200 mb-12 max-w-md">
          Buy with your price tag bargain with seller like on road
        </p>

        <div className="bg-white text-gray-900 p-6 rounded-2xl shadow-2xl w-[26rem]">
          <div className="flex mb-3">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-yellow-400 text-xl">★</span>
            ))}
          </div>
          <p className="mb-5 text-base leading-relaxed">
            "Good platform support bargain system and available with all kinds of products."
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

      <div className="w-1/2 flex items-center justify-center px-16">
        <div className="max-w-md w-full bg-white p-10 rounded-xl shadow-xl">
          <h2 className="text-3xl font-bold mb-2 text-gray-900">Hello, Register here</h2>
          <p className="text-gray-500 text-sm mb-6">
            Clarity gives you the blocks and components you need to create a truly professional website.
          </p>

          <div className="flex mb-6 rounded-full overflow-hidden border border-gray-300">
            <button
              className={`w-1/2 py-2 text-sm font-semibold transition ${type === "Private" ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
              onClick={() => setType("Private")}
            >
              Private
            </button>
            <button
              className={`w-1/2 py-2 text-sm font-semibold transition ${type === "Business" ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
              onClick={() => setType("Business")}
            >
              Business
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <input
                type="text"
                name="name"
                placeholder="Full-name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div className="mb-4">
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div className="mb-4">
              <input
                type="Phone"
                name="phone"
                placeholder="Phone number"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            {type === "Business" && (
              <div className="mb-4">
                <input
                  type="text"
                  name="businessName"
                  placeholder="Business name"
                  value={form.businessName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {errors.businessName && <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>}
              </div>
            )}

            <div className="mb-4">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div className="mb-4">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
            >
              Sign up
            </button>

            {success && (
              <p className="text-green-600 text-center mt-4">Registered successfully!</p>
            )}
          </form>

          <p className="text-sm text-center text-gray-600 mt-6">
            Have an account?{' '}
            <Link to='/auth' className="text-blue-500 hover:underline">
              Sign-in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
