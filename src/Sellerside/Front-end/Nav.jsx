import React from 'react'
import dashboard from "./assets/dashboard.png"
import Bus from './assets/Business.png'
import chart from './assets/chart-bar.png'
import customer from './assets/customer.png'
import file from './assets/file.png'
import order from './assets/order.png'
import report from './assets/report.png'
import profile from './assets/profile.png';
import { Link } from "react-router";

const Nav = () => {
  return (
    <div className=' bg-white'>
       <aside className="w-64 bg-white p-5 ">
        <h1 className="text-xl font-bold mb-6">New dash</h1>
      
        <nav>
          <ul className="space-y-4">
            <div className="flex flex-row items-center">
            <img src={dashboard} className="h-[16px] pr-1.5"></img>
            <Link to="/main">
            <li className="text-gray-700 font-medium"> Dashboard</li>
            </Link>
            </div>
            <div className="flex flex-row items-center">
            <img src={Bus} className="h-[16px] pr-1.5"></img>
            <li className="text-gray-700 font-medium"> Business</li>
            </div>
            <div className="flex flex-row items-center">
            <img src={chart} className="h-[16px] pr-1.5"></img>
            <Link to="/per">
            <li className="text-gray-700 font-medium"> Performance</li>
            </Link>
            </div>
            <div className="flex flex-row items-center">
            <img src={customer} className="h-[16px] pr-1.5"></img>
            <li className="text-gray-700 font-medium"> Customers</li>
            </div>
            <div className="flex flex-row items-center">
            <img src={file} className="h-[16px] pr-1.5"></img>
            <Link to="/productlisting">
            <li className="text-gray-700 font-medium"> Products</li>
            </Link>
            </div>
            <div className="flex flex-row items-center">
            <img src={order} className="h-[16px] pr-1.5"></img>
            <li className="text-gray-700 font-medium"> Orders</li>
            </div>
            <div className="flex flex-row items-center">
            <img src={report} className="h-[16px] pr-1.5"></img>
            <Link to='/live'>
            <li className="text-gray-700 font-medium"> Applications</li>
            </Link>
            </div>
            <div className="flex flex-row items-center">
            <img src={profile} className="h-[16px] pr-1.5"></img>
            <Link to="/profile">
            <li className="text-gray-700 font-medium"> Profile</li>
            </Link>
            </div>
            
          </ul>
        </nav>
      </aside>
    </div>
  )
}

export default Nav
