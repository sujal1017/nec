 /* dev- viraj
 */ 
import React, {useState, useRef} from 'react'
import ContentEditable from "react-contenteditable";
import { CheckCircle } from "lucide-react";
import { Link, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'

const Adddetails = () => {
  const location = useLocation();
  const Data = location.state || {};
  console.log(Data.item)
  console.log(Data.condition)

  const categories = [
    "Garden & Patio",
    "Health & Beauty",
    "Holidays & Travel",
    "Home, Furniture & DIY",
    "Jewellery & Watches",
    "Mobile Phones & Communication",
    "Music",
    "Musical Instruments",
    "Pet Supplies",
    "Pottery, Porcelain & Glass",
    "Property",
    "Sound & Vision",
    "Sporting Goods",
    "Sports Memorabilia",
    "Stamps",
    "Toys & Games",
    "Vehicle Parts & Accessories",
    "Video Games & Consoles",
    "Wholesale & Job Lots",
    "Everything Else",
    "Shoes",
  ];
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showToast, setShowToast] = useState(false);
  

  const handleClick = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000); // hide after 3 seconds
  };
   
  return (
    <div className='flex flex-col items-center justify-start py-8'>
      <div className="flex flex-col items-start justify-start h-screen my-10 ">
        <h1 className='font-semibold text-4xl border-b-1 w-full pb-2 border-gray-500'>Compelete the item details</h1>
        
        <div className='w-3xl mt-8 py-3 '>
            <label className="block text-xl font-semibold mb-1">Title for your product</label>
            <label className="block text-[18px] font-normal mb-1">(Please provide more descriptive title for your product)</label>
            <input
              type="text"
              placeholder="Eg- Iphone pro max"
              value={Data.item.title}
              className="w-full p-3 rounded-md border bg-gray-50 placeholder-gray-400"
            />
            <div className="mt-6">
        <label className="font-semibold text-xl">Category</label>
        <select
          className="w-full p-3 border mt-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="" disabled>
            -- Select Category --
          </option>
          {categories.map((cat, idx) => (
            <option key={idx} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <h1 className='text-gray-600 mt-2 underline'>in Clothes, Shoes & Accessories - Men - Men's Shoes</h1>
            </div>
          
          </div>

          <Photos />
          <ItemSpecifics />
          <RichTextEditor />
          <PricingForm />
          <ShippingPreferences />
          
          <div className='py-10 flex flex-row justify-center items-center w-full'>
            <button
            onClick={handleClick} 
            className='bg-blue-700 text-white text-xl px-10 mr-3 py-3 rounded-xl'>
              Save
            </button>
            {showToast && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-300 text-green-800 px-6 py-3 rounded-lg flex items-center space-x-3 shadow-lg z-50">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="font-medium">Saved successfully</span>
        </div>
      )}
            <Link to='/live' className='border-1 border-gray-700 rounded-xl px-10 mr-3 py-3'>
              Product page
            </Link> 

            <Link to='/preview' className='border-1 border-gray-700 rounded-xl px-10 mr-3 py-3'>
              Preview
            </Link>
          </div>
      </div>
    </div>
  )
}

const Photos = () => {
  const fileInputRef = useRef();
  const [images, setImages] = useState([]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Prevent more than 12 images
    if (images.length + files.length > 12) {
      toast.warn('Limit reached! Switch to premium to upload more than 12 images.', {
        position: 'top-center',
        autoClose: 3000,
      });
      return;
    }

    setImages((prev) => [...prev, ...files.slice(0, 12 - prev.length)]);
  };

  return (
    <div className="my-10 py-3">
      <ToastContainer />

      <div>
        <h1 className="text-xl font-semibold">Photos & Videos</h1>
        <p className="py-2">
          You can add up to 12 photos and a 30sec video. Buyers want to see all details and angles.
        </p>
      </div>

      <div>
        <div
          className={`w-full h-52 border-dashed border-1 border-gray-600 rounded-md flex justify-center items-center text-2xl cursor-pointer ${
            images.length >= 12 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={() => {
            if (images.length < 12) fileInputRef.current.click();
          }}
        >
          <label className="flex flex-col justify-center items-center">
            <img
              width="50"
              height="50"
              src="https://img.icons8.com/ios/50/737373/camera--v1.png"
              alt="camera--v1"
            />
            <h1 className="text-[16px]">Drag and drop files</h1>
          </label>

          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={URL.createObjectURL(img)}
              alt={`img-${idx}`}
              className="h-16 w-16 rounded-md object-cover border"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

function RichTextEditor() {
  const [html, setHtml] = useState("");
  const contentRef = useRef(null);

  const exec = (command, value = null) => {
    contentRef.current?.focus();
    document.execCommand(command, false, value);
    syncHtml(); // sync after command execution
  };

  const syncHtml = () => {
    if (contentRef.current) {
      setHtml(contentRef.current.innerHTML);
    }
  };

  const handleChange = (e) => {
    // Don't auto-update html on every keystroke to avoid clobbering execCommand
    setHtml(e.target.value);
  };

  const handleInsertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      exec("createLink", url);
    }
  };

  const insertAIDescription = () => {
    setHtml("<p>This is an <strong>AI-generated</strong> description. Customize it.</p>");
  };

  const templates = [
    "<p>This item is <strong>brand new</strong>.</p>",
    "<p>Used product in <em>excellent</em> condition.</p>",
    "<ul><li>Rare collectible</li><li>Limited stock</li></ul>"
  ];

  const handleTemplateChange = (e) => {
    const selected = e.target.value;
    if (selected !== "") setHtml(selected);
  };

  return (
    <div className="w-full my-10 mx-auto">
      <h2 className="text-lg font-semibold mb-2">DESCRIPTION</h2>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-2 ">
        <button onClick={() => exec("bold")} className="border px-2 py-1 rounded text-sm font-bold">
          B
        </button>
        <button onClick={() => exec("italic")} className="border px-2 py-1 rounded text-sm italic">
          I
        </button>
        <button onClick={() => exec("underline")} className="border px-2 py-1 rounded text-sm underline">
          U
        </button>
  
        <button onClick={() => exec("undo")} className="border px-2 py-1 rounded text-sm">
          ↶ Undo
        </button>
        <button onClick={() => exec("redo")} className="border px-2 py-1 rounded text-sm">
          ↷ Redo
        </button>

        <select onChange={handleTemplateChange} className="border px-3 py-1 rounded text-sm">
          <option value="">Custom template</option>
          {templates.map((t, i) => (
            <option key={i} value={t}>
              Template {i + 1}
            </option>
          ))}
        </select>

        <a href="#" className="ml-auto text-sm text-blue-600 hover:underline">
          Show all options
        </a>
      </div>

      {/* Editable content */}
      <div className="border rounded min-h-[300px] p-2">
        <ContentEditable
          innerRef={contentRef}
          html={html}
          onBlur={syncHtml} // Save changes on blur
          onChange={handleChange}
          tagName="div"
          className="outline-none w-full min-h-[260px]"
        />
      </div>

      {/* AI Button */}
      <div className="flex justify-end mt-4">
        <button
          onClick={insertAIDescription}
          className="flex items-center gap-2 border px-4 py-2 rounded-full text-sm hover:bg-gray-100"
        >
          <span className="text-purple-500">★</span> Use AI description
        </button>
      </div>
    </div>
  );
}



function PricingForm() {
  const [selectedOptions, setSelectedOptions] = useState([]);
  
  const [fixedPrice, setFixedPrice] = useState("");
  const [offerMin, setOfferMin] = useState("");
  const [offerMed, setOfferMed] = useState("");
  const [offerMax, setOfferMax] = useState("");
  const [auctionDuration, setAuctionDuration] = useState("7 days");
  const [startingBid, setStartingBid] = useState("");

  const toggleOption = (option) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(prev => prev.filter(item => item !== option));
    } else {
      if (selectedOptions.length < 2) {
        setSelectedOptions(prev => [...prev, option]);
      }
    }
  };

  const isDisabled = (option) => {
    return selectedOptions.length >= 2 && !selectedOptions.includes(option);
  };

  return (
    <div className="w-full my-14 mx-auto bg-white rounded-xl ">
      <h2 className="text-2xl font-bold mb-6">Pricing Options</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Sell at Fixed Price */}
        <div className={`border rounded-xl p-4 space-y-4 ${selectedOptions.includes("sell") ? "border-black" : "border-gray-300"}`}>
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox"
              checked={selectedOptions.includes("sell")}
              onChange={() => toggleOption("sell")}
              disabled={isDisabled("sell")}
            />
            <h3 className="text-lg font-semibold">Sell for a Fixed Price</h3>
          </div>
          {selectedOptions.includes("sell") && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Price (£)</label>
              <input 
                type="text" 
                value={fixedPrice}
                onChange={(e) => setFixedPrice(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Enter fixed price"
              />
            </div>
          )}
        </div>

        {/* Offer 3 Prices */}
        <div className={`border rounded-xl p-4 space-y-4 ${selectedOptions.includes("offer") ? "border-black" : "border-gray-300"}`}>
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox"
              checked={selectedOptions.includes("offer")}
              onChange={() => toggleOption("offer")}
              disabled={isDisabled("offer")}
            />
            <h3 className="text-lg font-semibold">Offer 3 Prices</h3>
          </div>
          {selectedOptions.includes("offer") && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Min Price (£)</label>
              <input 
                type="text" 
                value={offerMin}
                onChange={(e) => setOfferMin(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Enter minimum price"
              />
              <label className="block text-sm font-semibold">Median Price (£)</label>
              <input 
                type="text" 
                value={offerMed}
                onChange={(e) => setOfferMed(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Enter median price"
              />
              <label className="block text-sm font-semibold">Max Price (£)</label>
              <input 
                type="text" 
                value={offerMax}
                onChange={(e) => setOfferMax(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Enter maximum price"
              />
            </div>
          )}
        </div>

        {/* Auction */}
        <div className={`border rounded-xl p-4 space-y-4 ${selectedOptions.includes("auction") ? "border-black" : "border-gray-300"}`}>
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox"
              checked={selectedOptions.includes("auction")}
              onChange={() => toggleOption("auction")}
              disabled={isDisabled("auction")}
            />
            <h3 className="text-lg font-semibold">Auction</h3>
          </div>
          {selectedOptions.includes("auction") && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Auction Duration</label>
              <select 
                value={auctionDuration}
                onChange={(e) => setAuctionDuration(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option>1 day</option>
                <option>3 days</option>
                <option>5 days</option>
                <option>7 days</option>
                <option>10 days</option>
              </select>

              <label className="block text-sm font-semibold">Starting Bid (£)</label>
              <input 
                type="text" 
                value={startingBid}
                onChange={(e) => setStartingBid(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Enter starting bid"
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}


function ShippingPreferences() {
  const [deliveryOption, setDeliveryOption] = useState("Collection only");
  const [postcode, setPostcode] = useState("580025");
  const [city, setCity] = useState("HUBLI-DHARWAD, KARNATAKA");

  const options = [
    "Postage or collection in person",
    "Free Postage",
    "Ship with charges",
    "International shipping"
  ];

  return (
    <div className=" max-w-3xl my-20 bg-white rounded-xl  space-y-6">
        <h1 className='font-semibold text-xl'>Delivery options</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

        {options.map(option => (
          <div
            key={option}
            className={`p-4 border rounded cursor-pointer ${
              deliveryOption === option ? "border-black" : "border-gray-300"
            }`}
            onClick={() => setDeliveryOption(option)}
          >
            <p className="font-semibold">{option}</p>
            <p className="text-sm text-gray-600">
              {option === "Postage or collection in person" && "Let buyers choose how they get their items."}
              {option === "Free Postage" && "Post items directly to buyers."}
              {option === "Ship with charges" && "Arrange collection in person or by Post with any postage costs."}
              {option === "International shipping" && "Post items overseas ."}
            </p>
          </div>
        ))}
      </div>

    

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Preferences</h3>
        <div className="border rounded p-4 bg-gray-50 text-sm">
          <p className="font-semibold">Your settings</p>
          <p>Item location {postcode} ({city}, India)</p>
          <p className="text-gray-500">Postcode not visible on listing</p>
          <p className="mt-2">No returns accepted</p>
          <p className="text-gray-500">Unless item is not as described</p>
        </div>
      </div>
    </div>
  );
}

function ItemSpecifics() {
  const requiredFields = [
    { label: "Brand", frequently: "Unbranded, VANS, Crocs" },
    { label: "UK Shoe Size", frequently: "8, 7, 8.5" },
    { label: "Style", frequently: "Sneaker, Loafer, Boat Shoe" },
    { label: "Colour", frequently: "Black, Brown, Blue" },
    { label: "Upper Material", frequently: "Leather, Synthetic, Faux Leather" },
    { label: "Department", type: "select", options: ["Men", "Women"] }
  ];

  const additionalFields = [
    { label: "EAN", type: "text" },
    { label: "US Shoe Size", frequently: "8, 9, 8.5" },
    { label: "AU Shoe Size", frequently: "8, 8.5, 12.5" },
    { label: "Lining Material", frequently: "Leather, Fabric, Synthetic" },
    { label: "Outsole Material", frequently: "Rubber, Leather, Synthetic" },
    { label: "Insole Material", frequently: "Leather, Foam, Synthetic" },
    { label: "Closure", frequently: "Lace Up, Slip On" }
  ];

  return (
    <div className="space-y-6 w-full my-10">
      <h3 className="text-lg font-bold">ITEM SPECIFICS</h3>

      <div>
        <h4 className="font-semibold">Required</h4>
        <p className="text-sm text-gray-600 mb-4">Buyers need these details to find your item.</p>
        <div className="space-y-4">
          {requiredFields.map(({ label, frequently, type = "select", options }) => (
            <div key={label}>
              <label className="block text-sm font-medium mb-1">{label}</label>
              {type === "select" ? (
                <select className="w-full border p-2 rounded">
                  {options ? options.map(opt => (
                    <option key={opt}>{opt}</option>
                  )) : <option>Select {label}</option>}
                </select>
              ) : (
                <input type="text" className="w-full border p-2 rounded" />
              )}
              {frequently && (
                <p className="text-xs text-gray-500 mt-1">Frequently selected: {frequently}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mt-6">Additional <span className="text-gray-500 text-sm">(optional)</span></h4>
        <p className="text-sm text-gray-600 mb-4">Buyers also search for these details.</p>
        <div className="space-y-4">
          {additionalFields.map(({ label, frequently, type = "select" }) => (
            <div key={label}>
              <label className="block text-sm font-medium mb-1">{label}</label>
              {type === "text" ? (
                <input type="text" placeholder="Enter number" className="w-full border p-2 rounded" />
              ) : (
                <select className="w-full border p-2 rounded">
                  <option>Select {label}</option>
                </select>
              )}
              {frequently && (
                <p className="text-xs text-gray-500 mt-1">Frequently selected: {frequently}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 



export default Adddetails
