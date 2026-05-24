 /* dev- viraj
 */ 

import React from "react";
import Nav from './Nav.jsx'


const App = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
    
     <Nav />

      {/* Main Content */}
      <main className="flex-1 p-6">
        <header className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Hey Viraj, here’s what’s happening today</h2>
          <div className="flex space-x-4 items-center">
            <span className="relative">
              <span className="absolute top-0 right-0 bg-red-500 w-2 h-2 rounded-full"></span>
              🔔
            </span>
            <img
              src="https://static.vecteezy.com/system/resources/previews/020/213/738/large_2x/add-profile-picture-icon-upload-photo-of-social-media-user-vector.jpg"
              alt="User"
              className="rounded-full w-8 h-8"
            />
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 my-6">
          {[
            { title: "Today's Sales", value: "$12,426", change: "+36%" },
            { title: "Total Sales", value: "$2,38,485", change: "-14%" },
            { title: "Total Orders", value: "84,382", change: "+36%" },
            { title: "Total Customers", value: "33,493", change: "+36%" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600">{stat.title}</p>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
              <span className="text-green-500">{stat.change}</span>
            </div>
          ))}
        </div>

        {/* Sales Report */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold mb-2">Sales Report</h3>
          <p className="text-sm text-gray-500">Last 12 months</p>
          <div className="w-full h-40 bg-gray-200 mt-4 flex items-center justify-center">
            <span className="text-gray-500">[Graph Placeholder]</span>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h3 className="font-bold mb-4">Transactions</h3>
          <div className="space-y-4">
            {[
              { status: "Completed", card: "Visa **** 4831", amount: "$182.94", company: "Amazon" },
              { status: "Completed", card: "Mastercard **** 6442", amount: "$99.00", company: "Facebook" },
              { status: "Pending", card: "Account **** 882", amount: "$249.94", company: "Netflix" },
              { status: "Canceled", card: "Amex **** 5666", amount: "$199.24", company: "Amazon Prime" },
            ].map((txn, i) => (
              <div key={i} className="flex justify-between items-center p-2 border rounded-lg">
                <span className={`px-2 py-1 text-sm font-medium rounded ${
                  txn.status === "Completed" ? "bg-green-100 text-green-600" :
                  txn.status === "Pending" ? "bg-yellow-100 text-yellow-600" :
                  "bg-red-100 text-red-600"
                }`}>
                  {txn.status}
                </span>
                <span>{txn.card}</span>
                <span className="font-bold">{txn.amount}</span>
                <span className="text-gray-500">{txn.company}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources & Recent Customers */}
        <div className="grid grid-cols-2 gap-6 mt-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold mb-2">Traffic Sources</h3>
            {[
              { source: "Direct", value: "1,43,382" },
              { source: "Referral", value: "87,974" },
              { source: "Social Media", value: "45,211" },
              { source: "Twitter", value: "21,893" },
            ].map((item, i) => (
              <div key={i} className="mb-2">
                <p className="text-sm text-gray-500">{item.source}</p>
                <div className="w-full bg-gray-200 h-2 rounded">
                  <div className="bg-blue-500 h-2 rounded" style={{ width: `${Math.random() * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold mb-2">Recent Customers</h3>
            {[
              { name: "Jenny Wilson", email: "w.lawson@example.com", amount: "$11,234" },
              { name: "Devon Lane", email: "dat.roberts@example.com", amount: "$11,159" },
              { name: "Jane Cooper", email: "jgraham@example.com", amount: "$10,483" },
              { name: "Dianne Russell", email: "curtis.d@example.com", amount: "$9,084" },
            ].map((customer, i) => (
              <div key={i} className="flex justify-between py-2">
                <span>
                  <strong>{customer.name}</strong>
                  <p className="text-xs text-gray-500">{customer.email}</p>
                </span>
                <span className="font-bold">{customer.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
