 /* dev- viraj
 */ 
import React, { useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const Chooseop = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedItem = location.state?.selectedItem;

  const [mainOption, setMainOption] = useState(null);
  const [subOption, setSubOption] = useState(null);

  const mainOptions = ['New', 'Used'];

  const subOptionsMap = {
    New: [
      {
        title: 'New with box',
        description: 'Brand new, unworn and defect-free with original box, packaging and accessories.',
      },
      {
        title: 'New without box',
        description: 'Brand new, unworn, and defect-free with all accessories but missing the original box.',
      },
    ],
    Used: [
      {
        title: 'Good condition',
        description: 'Gently used, minimal wear, fully functional.',
      },
      {
        title: 'Small defects',
        description: 'Used with minor visible signs of wear or small flaws.',
      },
      {
        title: 'Refurbished',
        description: 'Used item that has been restored to working condition by the manufacturer or seller.',
      },
    ],
  };

  const handleContinue = () => {
    if (mainOption && subOption !== null) {
      const selectedCondition = subOptionsMap[mainOption][subOption].title;
      navigate('/adddetails', {
        state: {
          item: selectedItem,
          condition: selectedCondition,
        },
      });
      console.log(selectedItem);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">Select Item Condition</h1>

      {selectedItem && (
        <div className="border rounded-xl p-4 shadow-sm mb-6">
          <img src={selectedItem.image} alt={selectedItem.title} className="w-full h-40 object-contain mb-2" />
          <h2 className="text-xl font-semibold">{selectedItem.title}</h2>
          <p className="text-sm text-gray-600">Brand: {selectedItem.brand}</p>
          {selectedItem.model && <p className="text-sm text-gray-600">Model: {selectedItem.model}</p>}
        </div>
      )}

      <div className="flex gap-4 mb-8">
        {mainOptions.map((option, index) => (
          <button
            key={index}
            onClick={() => {
              setMainOption(option);
              setSubOption(null);
            }}
            className={`px-6 py-2 rounded-full border font-medium transition ${
              mainOption === option ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700 hover:border-black'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {mainOption && (
        <div className="space-y-4 mb-8">
          {subOptionsMap[mainOption].map((sub, idx) => (
            <button
              key={idx}
              onClick={() => setSubOption(idx)}
              className={`w-full text-left p-4 border rounded-xl shadow-sm transition duration-150 flex justify-between items-start ${
                subOption === idx ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-black'
              }`}
            >
              <div>
                <h3 className="text-lg font-semibold">{sub.title}</h3>
                <p className="text-sm text-gray-600">{sub.description}</p>
              </div>
              {subOption === idx && <FaCheckCircle className="text-green-600 text-xl mt-1" />}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={handleContinue}
          disabled={mainOption === null || subOption === null}
          className={`w-full py-3 rounded-full font-semibold text-white transition ${
            mainOption === null || subOption === null
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-black hover:bg-gray-800'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default Chooseop;
