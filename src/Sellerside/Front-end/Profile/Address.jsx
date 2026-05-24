 /* dev- viraj
 */ 
import React from 'react'
import Profilenav from './Profilenav'
import Topnav from './Topnav';

function Address() {
    const userData = {
        addresses: {
          billing: {
            firstName: "viraj",
            lastName: "kulkarni",
            company: "",
            address: "Road No. 13/k, House no. 1320/C, Flat No. 5D",
            country: "india",
            state: "",
            city: "hubali",
            zip: "1207",
            email: "virja45@gmail.com",
            phone: "+1-202-555-0118"
          },
          shipping: {
            firstName: "viraj",
            lastName: "kulkarni",
            company: "",
            address: "Road No. 13/k, House no. 1320/C, Flat No. 5D",
            country: "india",
            state: "",
            city: "gokuldam powder gali",
            zip: "1207",
            email: "Jethalal@gmail.com",
            phone: "+1-202-555-0118"
          }
        }
      };
  return (
    <div className='p-4'> 
    <Topnav />
    <div className='flex flex-row w-full p-6'>

      <Profilenav />
      <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(userData.addresses).map(([key, data]) => (
              <section key={key} className="bg-white border rounded p-5 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 capitalize">{key} Address</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input className="border p-2 rounded" placeholder="First Name" defaultValue={data.firstName} />
                  <input className="border p-2 rounded" placeholder="Last Name" defaultValue={data.lastName} />
                </div>
                <input className="border p-2 rounded w-full mb-3" placeholder="Company Name (Optional)" defaultValue={data.company} />
                <input className="border p-2 rounded w-full mb-3" placeholder="Address" defaultValue={data.address} />
                <select className="border p-2 rounded w-full mb-3" defaultValue={data.country}>
                  <option>{data.country}</option>
                </select>
                <select className="border p-2 rounded w-full mb-3" defaultValue={data.state}>
                  <option>Select...</option>
                </select>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <select className="border p-2 rounded" defaultValue={data.city}>
                    <option>{data.city}</option>
                  </select>
                  <input className="border p-2 rounded" placeholder="Zip Code" defaultValue={data.zip} />
                </div>
                <input className="border p-2 rounded w-full mb-3" placeholder="Email" defaultValue={data.email} />
                <input className="border p-2 rounded w-full mb-3" placeholder="Phone Number" defaultValue={data.phone} />
                <button className="bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600">Save Changes</button>
              </section>
            ))}
          </div>

         
    </div>
    </div>
  )
}

export default Address
