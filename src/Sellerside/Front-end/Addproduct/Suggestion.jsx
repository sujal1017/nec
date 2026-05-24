 /* dev- viraj
 */ 
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import suggestionsData from "./shoesAndIphones.json";

const Suggestion = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Parse the passed JSON data from the state
  const parsedData = location.state?.data ? JSON.parse(location.state.data) : {};
  const { itemName, category } = parsedData;

  const normalizedItem = itemName.toLowerCase().includes("shoe")
    ? "shoes"
    : itemName.toLowerCase().includes("iphone")
    ? "iphone"
    : null;

  const suggestions = normalizedItem ? suggestionsData[normalizedItem] : [];

  // State for storing the selected card index
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleCardClick = (index) => {
    const selectedCard = suggestions[index];
    navigate('/choose', {
      state: {
        selectedItem: selectedCard,
        originalInput: parsedData, // Optional: include original input if needed later
      },
    });
  };

  const handleContinueWithSelected = () => {
    if (selectedIndex !== null) {
      const selectedCardData = suggestions[selectedIndex];
      navigate('/Chooseoption', { state: { data: selectedCardData } });
    } else {
      alert("Please select a card before continuing.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate(-1)}
          className="text-white hover:font-bold mr-4 bg-black px-4 py-2 rounded-xl"
        >
          Back
        </button>
        <h1 className="text-3xl font-bold">Find a match</h1>
      </div>
      <p className="text-gray-600 mb-2">
        for <b>'{itemName}'</b> in category <b>{category}</b>
      </p>

      {suggestions.length === 0 ? (
        <p>No suggestions found for the entered item.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestions.map((item, index) => (
            <div
              key={index}
              onClick={() => handleCardClick(index)}
              className={`border rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer ${
                selectedIndex === index ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-40 object-contain mb-3"
              />
              <h2 className="font-semibold text-lg mb-1">{item.title}</h2>
              <p className="text-sm text-gray-600">Brand: {item.brand}</p>
              <p className="text-sm text-gray-600">Colour: {item.color}</p>
              {item.size && <p className="text-sm text-gray-600">Size: {item.size}</p>}
              {item.model && <p className="text-sm text-gray-600">Model: {item.model}</p>}
              {item.mpn && <p className="text-sm text-gray-600">MPN: {item.mpn}</p>}
              {item.storage && <p className="text-sm text-gray-600">Storage: {item.storage}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <button
          onClick={handleContinueWithSelected}
          className="px-12 py-3 rounded-full font-semibold bg-[#1c1c1c] text-white hover:bg-black transition"
        >
          Continue with selected match
        </button>
      </div>
    </div>
  );
};

export default Suggestion;
