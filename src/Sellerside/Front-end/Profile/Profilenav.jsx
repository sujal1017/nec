import React from 'react'
import {Link} from 'react-router-dom'
/*  */

function Profilenav() {
  return (
    <div className='w-2xs text-[20px] space-y-4 font-normal'>
          <section>
            <h4 className="font-semibold mb-1 text-gray-700">Personal information and privacy</h4>
            <div className="space-y-1 flex flex-col">
              <Link to='/profile' className="text-gray-600">Personal information</Link>
              <Link to='/password' className="text-gray-600">Sign-in and security</Link>
              <Link to='/address' className="text-gray-600">Addresses</Link>
              <div className="text-gray-600">Feedback</div>
            </div>
          </section>

          <section>
            <h4 className="font-semibold text-gray-700">Payment information</h4>
            <div className="text-gray-600">Payments</div>
          </section>

          <section>
            <h4 className="font-semibold text-gray-700">Account preferences</h4>
            <div className="text-gray-600">Permissions</div>
            <div className="text-gray-600">Communication preferences</div>
            <div className="text-gray-600">Close account</div>
          </section>

          <section>
            <h4 className="font-semibold text-gray-700">Selling</h4>
            <Link to='/main' className="text-gray-600">Seller Dashboard</Link>
            <div className="text-gray-600">Subscriptions</div>
          </section>
        
    </div>
  )
}

export default Profilenav
 