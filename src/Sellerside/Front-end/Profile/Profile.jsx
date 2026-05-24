 /* 
 dev- viraj
 */ 
import React, { useState, useRef } from "react";
import Profilenav from "./Profilenav";
import Topnav from "./Topnav";
import { Pencil } from "lucide-react";


const userData = {
  username: "kulk7827",
  fullname: "Viraj kulkarni",
  accountType: "Individual",
  contact: {
    email: "v***5@gmail.com",
    phone: "+91 xxxxxxxx60",
    verified: false
  },
  personalInfo: {
    name: "Viraj Kulkarni",
    address: "Kcc bank layout, house no 26 navnagar"
  },
  
};

export default function Profile() {
  const fileRefCover = useRef();
    const fileRefProfile = useRef();
  
    const [cover, setCover] = useState(null);
    const [profile, setProfile] = useState(null);

      const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const imgURL = URL.createObjectURL(file);
      if (type === "cover") setCover(imgURL);
      else setProfile(imgURL);
    }
  };
  return (
    <div className="bg-white text-sm text-gray-900 min-h-screen p-6 md:p-10 font-sans">
      <Topnav />

      <div className="flex flex-col md:flex-row gap-10">
       <Profilenav />

        <main className="w-full md:w-3/4 space-y-8 bg-white">
              {/* Cover Image */}
      <div className="relative rounded-xl overflow-hidden h-[400px] w-full border-1 border-b-neutral-800">
        <img
          src={cover || "https://www.pixelstalk.net/wp-content/uploads/2016/09/Free-Download-Album-Cover-Background-.jpg"}
          alt="cover"
          className="object-cover h-full w-full"
        />
          
        <button
          onClick={() => fileRefCover.current.click()}
          className="absolute top-2 right-2 bg-white p-2 rounded-full shadow"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <input
          type="file"
          ref={fileRefCover}
          className="hidden"
          accept="image/*"
          onChange={(e) => handleImageChange(e, "cover")}
        />
      </div>

      {/* Profile Image */}
      <section className="flex flex-row">
        <div className=" w-[300px] relative mt-[-5%] h-[300px] border-8 border-white rounded-full  overflow-hidden ">
          <img
            src={profile || "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fimages.pexels.com%2Fphotos%2F220453%2Fpexels-photo-220453.jpeg%3Fcs%3Dsrgb%26dl%3Dpexels-pixabay-220453.jpg%26fm%3Djpg&f=1&nofb=1&ipt=f55334d8e8c15b14b4bac6eb4bdf83c7e7d57e1ad0879970335ba433640712ba"}
            alt="profile"
            className="w-full h-full object-cover"
          />
          <button
            onClick={() => fileRefProfile.current.click()}
            className="absolute bottom-1 left-1/2 bg-white p-1 mb-3 rounded-full shadow"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileRefProfile}
            className="hidden"
            accept="image/*"
            onChange={(e) => handleImageChange(e, "profile")}
          />
        </div>

        <div className="ml-3">
          <div className="flex flex-col "> 
            <h1 className="font-normal text-xl pt-2">{userData.username}</h1>
            <h1 className="font-medium text-3xl ">{userData.fullname}</h1>
            <button className="text-blue-600 text-sm text-left">Edit</button>
          </div>
        </div>
      </section>
          <section className="text-[20px]">
            <h2 className="text-2xl font-semibold mb-4">Personal Info</h2>
            <div className="space-y-2">
              
              <div className="flex justify-between text-xl px-6 py-2  items-center">
                <span className="text-gray-700">Account type</span>
                <span className="font-medium">{userData.accountType}</span>
              </div>

              <div className="space-y-2 text-xl pt-2">
                <div className="font-medium text-2xl">Contact details</div>
                <div className="flex justify-between px-6 py-2 ">
                  <div>Email<br /><span className="text-gray-600">{userData.contact.email}</span><br /><span className="text-red-500">Not verified</span></div>
                  <div className="flex gap-2 text-blue-600"><button>Edit</button></div>
                </div>
                <div className="flex justify-between px-6 py-2 ">
                  <div>Phone<br /><span className="text-gray-600">{userData.contact.phone}</span><br /><span className="text-red-500">Not verified</span></div>
                  <div className="flex gap-2 text-blue-600"><button>Edit</button></div>
                </div>
              </div>

                <div className="font-medium text-2xl">Personal Address</div>
              <div className="flex flex-row text-xl justify-between px-6 py-2 ">
                
                <div className="flex flex-col text-left">
                  <span>{userData.personalInfo.name}</span>
                  <span className="text-[20px]">{userData.personalInfo.address}</span>
                </div>
                
                <button className="text-blue-600">Edit</button>
                </div>
              </div>
          </section>  
       
        </main>
      </div>
    </div>
  );
}
