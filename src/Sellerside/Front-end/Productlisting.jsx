 /* dev- viraj
 */ 
import { useState, useRef } from "react";
import Nav from './Nav.jsx'
import { Link } from "react-router";

export default function Dash() {
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [images, setImages] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const fileInputRef = useRef();

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
  };

  const handleAddCustomField = () => {
    setCustomFields([...customFields, { label: "New Field", value: "" }]);
  };

  const handleCustomFieldChange = (index, key, val) => {
    const updated = [...customFields];
    updated[index][key] = val;
    setCustomFields(updated);
  };

  if (!showForm) return <Dash /> ;

  const vendors = [
    { name: "Product1", url: "catalogapp.io", rating: 60, change: 5, date: "22 Jan 2022", status: "Active", tags: ["Customer data", "Admin", "+4"] },
    { name: "Circooles", url: "getcicooles.com", rating: 72, change: -4, date: "20 Jan 2022", status: "Active", tags: ["Business data", "Admin", "+2"] },
    { name: "Command+R", url: "cmdr.ai", rating: 78, change: 6, date: "24 Jan 2022", status: "Active", tags: ["Customer data", "Financials"] },
    { name: "Hourglass", url: "hourglass.app", rating: 38, change: 8, date: "26 Jan 2022", status: "Active", tags: ["Database access", "Admin"] },
    { name: "Layers", url: "getlayers.io", rating: 42, change: -1, date: "18 Jan 2022", status: "Active", tags: ["Salesforce", "Admin", "+2"] },
    { name: "Quotient", url: "quotient.co", rating: 66, change: -6, date: "28 Jan 2022", status: "Active", tags: ["Business data", "Admin", "+4"] },
    { name: "Sisyphus", url: "sisyphus.com", rating: 91, change: 2, date: "16 Jan 2022", status: "Inactive", tags: ["Customer data", "Financials"] },
  ];

  return (
    <div className=" bg-gray-100 min-h-screen flex flex-row">
    <Nav />
      <div className="bg-white p-6 w-full rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Business - Product name - category</h1>
          <Link to="/addcategory"
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            onClick={() => setPopupOpen(true)}
          >
            + Add Product
          </Link>
        </div>
        <p className="text-sm text-gray-500 mb-4">Keep track of Products and their ratings.</p>
        
        <div className="flex justify-between items-center mb-4">
          <button className="bg-gray-200 px-4 py-2 rounded-md">View all</button>
          <input type="text" placeholder="Search" className="border px-4 py-2 rounded-md w-1/3" />
        </div>
        
        <table className="w-full border-collapse">
          <thead>
            <tr className=" text-left">
              <th className="p-3">Vendor</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Last Assessed</th>
              <th className="p-3">License Use</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor, index) => (
              <tr key={index} className="border-t">
                <td className="p-3 flex items-center gap-2">
                  <input type="checkbox" className="mr-2" />
                  <div>
                    <div className="font-semibold">{vendor.name}</div>
                    <div className="text-sm text-gray-500">{vendor.url}</div>
                  </div>
                </td>
                <td className="p-3 flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-300 rounded">
                    <div
                      className="h-2 bg-purple-500 rounded"
                      style={{ width: `${vendor.rating}%` }}
                    ></div>
                  </div>
                  <span>{vendor.rating}</span>
                  <span className={vendor.change > 0 ? "text-green-500" : "text-red-500"}>
                    {vendor.change > 0 ? `↑ ${vendor.change}%` : `↓ ${Math.abs(vendor.change)}%`}
                  </span>
                </td>
                <td className="p-3">{vendor.date}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${vendor.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                    {vendor.status}
                  </span>
                  {vendor.tags.map((tag, i) => (
                    <span key={i} className="ml-2 px-2 py-1 bg-gray-200 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </td>
                <td className="p-3 flex gap-2">
                  <Link to='/adddetails' className="text-blue-500">✏️</Link>
                  <button className="text-red-500">🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {isPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="min-h-screen bg-white py-10 w-full px-16">
      <div className="flex justify-between items-center mb-6">
        <button
          className="text-black text-sm font-medium flex items-center gap-2"
          onClick={handleAddCustomField}
        >
          <span className="text-xl font-bold">+</span> Add custom field
        </button>
        <button
          className="text-xl font-bold hover:text-red-500"
          onClick={() => setShowForm(false)}
        >
          &times;
        </button>
      </div>

      <div className="grid grid-cols-2 gap-10">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Product name</label>
            <input
              type="text"
              placeholder="Eg- Iphone pro max"
              className="w-full p-3 rounded-md border bg-gray-50 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Description</label>
            <input
              type="text"
              placeholder="Specs"
              className="w-full p-3 rounded-md border bg-gray-50 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Price</label>
            <div className="flex items-center">
              <div className="p-3 border bg-gray-100 rounded-l-md">$</div>
              <input
                type="text"
                defaultValue="100"
                className="w-full p-3 border border-l-0 rounded-r-md bg-gray-50"
              />
            </div>
          </div>

          {customFields.map((field, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={field.label}
                onChange={(e) => handleCustomFieldChange(idx, "label", e.target.value)}
                className="w-1/3 p-2 rounded-md border bg-gray-100"
              />
              <input
                type="text"
                value={field.value}
                onChange={(e) => handleCustomFieldChange(idx, "value", e.target.value)}
                className="w-2/3 p-2 rounded-md border bg-gray-50"
              />
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Product Images</label>
          <div
            className="w-full h-52 border bg-gray-50 rounded-md flex justify-center items-center text-2xl cursor-pointer"
            onClick={() => fileInputRef.current.click()}
          >
            +
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

      <div className="flex justify-end mt-10 gap-4">
        <button className="bg-blue-100 text-black px-6 py-2 rounded-full hover:bg-blue-200">Save</button>
        <button className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700">Live product</button>
      </div>
    </div>
        </div>
      )}
    </div>
  );
}
