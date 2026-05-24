 /* dev- viraj
 */ 
import React from 'react';
import { Link } from 'react-router';

const Messages = () => {
  return (
    <div className="flex flex-col h-screen font-sans">
      {/* Sidebar */}
      <div className="flex justify-between items-center border-b p-4 mb-6">
        <div className="space-x-6 text-base font-medium">
          <button className="text-gray-500 border-b-2 border-blue-600 hover:text-black">Messages</button>
          <Link to='/pro' className="text-black  pb-1">Account</Link>
        </div>
       
      </div>
      <div className='flex flex-row w-full h-screen'>
      <aside className="w-64 bg-white border-r border-gray-200">
        <h2 className="text-xl font-bold px-4 py-3">Messages</h2>
        <ul className="space-y-2 text-sm">
          <li className="bg-gray-100 font-semibold px-4 py-2">Inbox</li>
          <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">From members</li>
          <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Unread from members</li>
          <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">From eBay</li>
          <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center">
            Unread from eBay <span className="bg-red-600 text-white rounded-full px-2 text-xs">3</span>
          </li>
          <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Sent</li>
          <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Deleted</li>
          <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Archive</li>
        </ul>
      </aside>

      {/* Main Section */}
      <main className="flex-1 flex">
        {/* Left Panel */}
        <div className="w-1/2  bg-white">
          {/* Search Bar */}
          <div className="px-4 py-3 border-b border-gray-300">
            <input
              type="text"
              placeholder="Search all member messages"
              className="w-full px-4 py-2 border border-gray-300 rounded-full text-sm bg-gray-100 focus:outline-none"
            />
          </div>

          {/* Toolbar */}
          <div className="flex items-center space-x-4 px-4 py-2 border-b border-gray-300">
            <input type="checkbox" />
            <div className="flex space-x-2">
              <button className="p-2 rounded-full hover:bg-gray-200">
                <span className="material-icons">delete</span>
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200">
                <span className="material-icons">mail</span>
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200">
                <span className="material-icons">mark_email_read</span>
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200">
                <span className="material-icons">delete_sweep</span>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="divide-y">
            {[
              { date: '11 Apr', title: 'A new device is using your account' },
              { date: '2 Apr', title: 'A new device is using your account' },
              { date: '2 Apr', title: 'Nice to meet you, Viraj.' },
            ].map((msg, idx) => (
              <div key={idx} className="flex items-start px-4 py-3 hover:bg-gray-100 cursor-pointer">
                <input type="checkbox" className="mt-1 mr-3" />
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.png"
                  alt="eBay"
                  className="w-6 h-6 rounded-full mr-3"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold">eBay</p>
                  <p className="text-sm text-gray-700">{msg.title}</p>
                </div>
                <span className="text-sm text-gray-500 ml-auto">{msg.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
          <img
            src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fthumbs.dreamstime.com%2Fb%2Fmail-box-vector-icon-post-mailbox-letter-illustration-letterbox-flat-delivery-194998819.jpg&f=1&nofb=1&ipt=76c3cd0de1c8601c4756670c7c4d32d892c09334748913bc0ec3926ee6d2b7bb"
            alt="mailbox"
            className="w-40 mb-4"
          />
          <p className="text-sm text-gray-600">Select a message to read.</p>
        </div>
      </main>
      </div>
    </div>
  );
};

export default Messages;
