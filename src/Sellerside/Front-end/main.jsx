 /* dev- viraj
 */ 
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Maindashboard from './Maindashboard.jsx'
import Productlisting from './Productlisting.jsx'
import Per from './Preformance.jsx'
import Login from './Login/Login.jsx'
import Signup from './Signup/Signup.jsx'
// import Test from './SellerProductpage/Test.jsx'
import Addpro from './Addproduct/Addproduct.jsx'
import Suggestion from './Addproduct/Suggestion.jsx'
import Chooseop from './Addproduct/Chooseop.jsx'
import Profiles from './Profile/Profile.jsx'
import Adddetails from './Addproduct/Adddetails.jsx'
import Live from './Addproduct/Applicationlive.jsx'
import Preview from './Addproduct/Preview.jsx'
import Messages from './Profile/Messages.jsx'
import Sellerpassword from './Profile/Password.jsx'
import Selleraddress from './Profile/Address.jsx'

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router";

const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/main',
    element: <Maindashboard />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '/addcategory',
    element: <Addpro />,
  },
  {
    path: '/Chooseoption',
    element: <Chooseop />,
  },
  {
    path: '/live',
    element: <Live />,
  },
  {
    path: '/suggestion',
    element: <Suggestion />,
  },
  {
    path: '/adddetails',
    element: <Adddetails />,
  },
  {
    path: '/preview',
    element: <Preview />,
  },
  {
    path: '/message',
    element: <Messages />,
  },
  
  {
    path: '/profile',
    element: <Profiles />,
  },
  {
    path: '/password',
    element: <Sellerpassword />,
  },
  
  {
    path: '/address',
    element: <Selleraddress />,
  },
  {
    path:'/productlisting',
    element: <Productlisting />,
  },
  {
    path:'/per',
    element:<Per />,
  },

])
createRoot(document.getElementById('root')).render(
  <StrictMode>
  <RouterProvider router={router} />
  </StrictMode>,
)
