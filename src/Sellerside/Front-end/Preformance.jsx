

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FaChartLine, FaUsers, FaShoppingCart, FaDollarSign, FaCog, FaSignOutAlt } from "react-icons/fa";
import Nav from './Nav.jsx'

const Preformance = () => {
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [todaySales, setTodaySales] = useState(12426);
  const [totalSales, setTotalSales] = useState(238485);
  const [totalOrders, setTotalOrders] = useState(84382);
  const [totalCustomers, setTotalCustomers] = useState(33493);

  const salesData = [
    { month: "Feb", sales: 20000 },
    { month: "Mar", sales: 25000 },
    { month: "Apr", sales: 30000 },
    { month: "May", sales: 28000 },
    { month: "Jun", sales: 45591 },
    { month: "Jul", sales: 40000 },
    { month: "Aug", sales: 42000 },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}

     <Nav />
      
      {/* Main Content */}
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Performance Dashboard</h1>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 shadow rounded-lg"><p>Today's Sales: ${todaySales}</p></div>
          <div className="bg-white p-4 shadow rounded-lg"><p>Total Sales: ${totalSales}</p></div>
          <div className="bg-white p-4 shadow rounded-lg"><p>Total Orders: {totalOrders}</p></div>
          <div className="bg-white p-4 shadow rounded-lg"><p>Total Customers: {totalCustomers}</p></div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <input type="date" className="p-2 border rounded" onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} />
          <input type="date" className="p-2 border rounded" onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} />
          <button className="bg-blue-500 text-white p-2 rounded">Filter</button>
        </div>

        <div className="bg-white p-4 shadow rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Sales Report</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Preformance;
