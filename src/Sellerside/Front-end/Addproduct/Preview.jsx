 /* dev- viraj
 */ 
import React from 'react';
import {Link} from 'react-router-dom';


export default function Preview() {
  const laptopData = {
    title: 'Dell Precision 15.6\" FHD Laptop Intel Xeon 3.8GHz 32GB RAM 512GB SSD Windows 10',
    price: '$278.12',
    condition: 'Very Good - Refurbished',
    description: 'The item shows minimal wear and is backed by a one year warranty. It is fully functional and has...',
    imageUrl: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fpisces.bbystatic.com%2Fimage2%2FBestBuy_US%2Fimages%2Fproducts%2F6083%2F6083539cv3d.jpg&f=1&nofb=1&ipt=44e6b0db27ad673d5107a7214e47ffb14a402915d551c60b5e3434c992f555e8',
    store: 'Discount Computer Depot',
    rating: '98.4% positive',
    location: 'Jacksonville, Texas, United States',
    stock: 2,
    watchers: 1894,
    trending: 427,
    shipping: 'Does not ship to United Kingdom.',
    tags: ['Refurbished', 'Business', 'Very Good']
  };

  return (
    <div className="p-4 flex flex-row md:flex-col gap-6 max-w-7xl mx-auto">
      <Link to='/adddetails'>Back</Link>
      <div className='flex flex-row justify-between items-center '>
      <div className="flex-1 ">
        <img
          src={laptopData.imageUrl}
          alt="Laptop"
          className="pr-3 w-full object-contain max-h-[400px]"
        />
      </div>

      <div className="flex-[2] space-y-4">
        <div className="border rounded-xl shadow p-4 space-y-3">
          <h1 className="text-2xl font-semibold">{laptopData.title}</h1>
          <p className="text-xl text-green-600 font-bold">{laptopData.price}</p>
          <div className="text-sm text-gray-600">{laptopData.condition}</div>
          <p className="text-gray-700 text-sm">{laptopData.description}</p>

          <div className="text-sm text-gray-700">
            <span className="font-medium">Store:</span> {laptopData.store} ({laptopData.rating})
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-medium">Location:</span> {laptopData.location}
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-medium">Shipping:</span> {laptopData.shipping}
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-medium">Watchers:</span> {laptopData.watchers} watching | Trending: {laptopData.trending} sold
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {laptopData.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-gray-200 text-sm text-gray-800 px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex gap-4 mt-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md w-full hover:bg-blue-700">
              Buy It Now
            </button>
            <button className="border border-blue-600 text-blue-600 px-4 py-2 rounded-md w-full hover:bg-blue-50">
              Add to cart
            </button>
          </div>
        </div>
      </div>
      </div>
      <ItemSpecs />
      <div className='flex flex-row justify-center items-center w-full py-2'>
      <Link to='/live' className='border-1 border-gray-700 rounded-xl hover:bg-blue-600 hover:text-white px-10 mr-3 py-3'>
        Go live 
      </Link>
      <button className='border-1 border-gray-700 rounded-xl hover:bg-blue-600 hover:text-white px-10 mr-3 py-3'>
        Schedule live  
      </button>
      </div>
    </div>
  );
}

const itemSpecs = [
    { label: 'Condition', value: 'Very Good - Refurbished' },
    { label: 'Processor', value: 'Intel Xeon E3-1535M v5' },
    { label: 'MPN', value: 'delldeals' },
    { label: 'SSD Capacity', value: '512 GB' },
    { label: 'GPU', value: 'Intel UHD Graphics 620' },
    { label: 'Item Height', value: '1.09 in' },
    { label: 'Features', value: 'Bluetooth, Built-in Microphone, Built-in Webcam, Multi-Touch Trackpad, Widescreen Display, Wi-Fi, 4.90 GHz Processor Boost Frequency' },
    { label: 'Warranty', value: 'Free Microsoft Authorized Refurbisher 1 Year Limited Warranty' },
    { label: 'RAM Size', value: '32 GB' },
    { label: 'Processor Speed', value: '3.80 GHz' },
    { label: 'Series', value: 'Precision' },
    { label: 'Maximum Resolution', value: '1920 x 1080' },
    { label: 'Connectivity', value: 'Gigabit Ethernet, Mini DisplayPort, HDMI, SD Card Slot, USB 3.2, Headphone/Microphone combo port' },
    { label: 'Item Weight', value: '6.15 lbs' },
    { label: 'Seller Notes', value: 'The item shows minimal wear and is backed by a one year warranty. It is fully functional and has...' },
    { label: 'Graphics Processing Type', value: 'Integrated/On-Board Graphics' },
    { label: 'Most Suitable For', value: 'Casual Computing, Business, School' },
    { label: 'Item Length', value: '10.27 in' },
    { label: 'Release Year', value: '2016' },
    { label: 'Operating System', value: 'Windows 10 Home' },
    { label: 'Item Width', value: '14.9 in' },
    { label: 'Screen Size', value: '15.6 in' },
    { label: 'Color', value: 'Black' },
    { label: 'Brand', value: 'Dell' },
    { label: 'Type', value: 'Notebook/Laptop' },
    { label: 'Model', value: 'Dell Precision 7510' },
    { label: 'Storage Type', value: 'SSD (Solid State Drive)' },
    { label: 'UPC', value: 'does not apply' }
  ];
  
  function ItemSpecs() {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-6">Item specifics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm text-gray-800">
          {itemSpecs.map((item, index) => (
            <div key={index} className="flex">
              <div className="font-medium w-40 min-w-[10rem] text-gray-600">{item.label}</div>
              <div>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  