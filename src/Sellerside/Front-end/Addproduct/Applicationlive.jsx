 /* dev- viraj
 */ 
import { Pencil, Trash } from 'lucide-react';
import { Link } from 'react-router';

const data = [
  {
    id: '#102',
    name: 'Nike jordon shoes',
    category: 'Training shoes',
    date: '26 Jan 2022',
    status: 'Pending'
  },
  {
    id: '#102',
    name: 'Nike jordon shoes',
    category: 'Training shoes',
    date: '26 Jan 2022',
    status: 'Live'
  }
];

const statusStyles = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Live: 'bg-green-100 text-green-700'
};

export default function Applicationlive() {
  return (
    
    <div className="max-w-5xl my-10 mx-auto ">
        <Link to="/main" className='bg-black px-4 text-white py-2'> Back to Dashboard</Link>
      <h1 className="text-3xl font-bold mt-8 mb-2">Applications requests</h1>
      <p className="text-gray-500 mb-6">Applications to request to make it live on product pages on network</p>

      <div className="w-full  rounded-lg ">
        <div className="grid grid-cols-5 text-sm font-semibold text-gray-600 px-6 py-3">
          <span>Product-id</span>
          <span>Product name</span>
          <span>Category</span>
          <span>Date</span>
          <span>Status</span>
        </div>

        {data.map((item, idx) => (
          <div key={idx} className="grid grid-cols-5 border mt-2 border-gray-300 items-center px-6 py-4 hover:bg-gray-50 text-sm">
            <span>{item.id}</span>
            <span className="font-semibold">{item.name}</span>
            <span className="text-blue-600">{item.category}</span>
            <span>{item.date}</span>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[item.status]}`}>{item.status}</span>
              <button><Trash size={16} className="text-gray-400 hover:text-red-500" /></button>
              <button><Pencil size={16} className="text-gray-400 hover:text-blue-500" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  
  );
}
