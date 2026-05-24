 /* dev- viraj
 */ 
import React from 'react'
import { Eye } from "lucide-react";
import Profilenav from './Profilenav'
import Topnav from './Topnav'

function Password() {
  return (
    <div className='p-6'>
      <Topnav />
    
    <div className='flex flex-row w-full p-6'>
        <Profilenav />
        <section className="bg-white w-1/2 border rounded p-5 shadow-sm space-y-8">
            <h3 className="text-lg font-semibold">Change Password</h3>
            {["Current Password", "New Password", "Confirm Password"].map((label, idx) => (
              <div className="relative" key={idx}>
                <input type="password" placeholder={label} className="border p-2 rounded w-full" />
                <Eye className="absolute right-3 top-3 text-gray-400 w-4 h-4" />
              </div>
            ))}
            <button className="bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600">Change Password</button>
          </section>
    </div>
    </div>
  )
}

export default Password;
