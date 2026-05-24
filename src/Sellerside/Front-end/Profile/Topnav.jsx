import React from 'react'
import { Link } from 'react-router';

function Topnav() {
  return (
    <div>
        <div className="flex justify-between items-center border-b pb-3 mb-6">
        <div className="space-x-6 text-base font-medium">
          <Link to="/message" className="text-gray-500 hover:text-black">Messages</Link>
          <Link to='/profile' className="text-black border-b-2 border-blue-600 pb-1">Account</Link>
        </div>
        {/* <div className="text-blue-700 font-semibold">Kulkarn878</div> */}
      </div>
    </div>
  )
}

export default Topnav;
