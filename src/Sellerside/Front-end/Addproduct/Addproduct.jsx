 /* dev- viraj
 */ 
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import list1 from "../assets/list1.svg";
import list2 from "../assets/list2.svg";
import list3 from "../assets/list3.svg";

// ✅ Item suggestions list (dummy JSON)
const itemSuggestions = [
  "Adidas Running Shoes",
  "Nike Air Max",
  "Puma Sports Shoes",
  "Reebok Classic",
  "Vans Skate Shoes",
  "Red Tape Leather Shoes",
  "Skechers Walking Shoes",
  "Woodland Boots",
  "Crocs Clogs",
  "Converse All Star",
];

// ✅ Category data
const mainCategories = ["Physical", "Digital", "Job"];

const subCategoryMap = {
  Physical: ["Electronics", "Furniture", "Toys", "Kitchen"],
  Digital: ["Software", "Web App"],
  Job: ["Freelance", "Full-time", "Part-time", "Remote"],
};

const Addproduct = () => {
  const [itemName, setItemName] = useState("");
  const [mainCategory, setMainCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  const handleContinue = () => {
    const jsonData = JSON.stringify({
      itemName,
      mainCategory,
      subCategory,
    });
    navigate("/suggestion", { state: { data: jsonData } });
  };

  const handleItemChange = (e) => {
    const userInput = e.target.value;
    setItemName(userInput);

    if (userInput.length > 0) {
      const filtered = itemSuggestions.filter((item) =>
        item.toLowerCase().includes(userInput.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setItemName(suggestion);
    setFilteredSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">What you're selling</h1>

      <div className="relative flex flex-col gap-2 mb-6">
        <div className="relative">
          <input
            type="text"
            value={itemName}
            onChange={handleItemChange}
            placeholder="Enter item name (e.g. shoes)"
            className="w-full rounded-xl p-3 border shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>

        {showSuggestions && filteredSuggestions.length > 0 && (
          <ul className="absolute z-10 top-full left-0 w-full bg-white border border-gray-300 rounded-xl mt-1 shadow-md max-h-60 overflow-y-auto">
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={index}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {["STEP 1", "STEP 2", "STEP 3"].map((step, idx) => (
          <div
            key={idx}
            className="p-4 flex flex-col items-center text-center bg-[#F7F7F7]"
          >
            {step === "STEP 1" ? (
              <img src={list1} alt="Step Illustration" />
            ) : step === "STEP 2" ? (
              <img src={list2} alt="Step Illustration" />
            ) : (
              <img src={list3} alt="Step Illustration" />
            )}
            <h2 className="font-bold text-lg">{step}</h2>
            <p className="font-medium">
              {step === "STEP 1"
                ? "Share item details"
                : step === "STEP 2"
                ? "Find a match"
                : "Edit and list"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {step === "STEP 1"
                ? "Use keywords like brand, model or unique info (ISBN, MPN, VIN)."
                : step === "STEP 2"
                ? "We’ll search our catalogue to find similar items."
                : "You can preview or make changes before listing your item."}
            </p>
          </div>
        ))}
      </div>

      {/* Main Category Selection */}
      <div className="mt-6">
        <label className="font-semibold">Choose Main Category</label>
        <select
          className="w-full p-3 border mt-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={mainCategory}
          onChange={(e) => {
            setMainCategory(e.target.value);
            setSubCategory(""); // reset subcategory on change
          }}
        >
          <option value="" disabled>
            -- Select Main Category --
          </option>
          {mainCategories.map((cat, idx) => (
            <option key={idx} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Subcategory Selection */}
      {mainCategory && (
        <div className="mt-4">
          <label className="font-semibold">Choose Subcategory</label>
          <select
            className="w-full p-3 border mt-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
          >
            <option value="" disabled>
              -- Select Subcategory --
            </option>
            {subCategoryMap[mainCategory].map((sub, idx) => (
              <option key={idx} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={handleContinue}
        className="mt-6 w-full font-medium flex justify-center items-center gap-2 bg-[#1c1c1c] hover:bg-black text-white py-3 px-4 rounded-xl transition"
      >
        Continue
      </button>
    </div>
  );
};

export default Addproduct;
