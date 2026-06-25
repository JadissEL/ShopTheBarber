import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { sovereign } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Diamond } from "lucide-react";

const defaultServices = [
  {
    id: "1",
    name: "Haircut",
    price: 35,
    duration: 45,
    image: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=200&h=200&fit=crop",
    bgColor: "bg-gray-100"
  },
  {
    id: "2",
    name: "Beard Trim",
    price: 25,
    duration: 30,
    image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=200&h=200&fit=crop",
    bgColor: "bg-blue-50"
  },
  {
    id: "3",
    name: "Hot Towel Shave",
    price: 40,
    duration: 45,
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&h=200&fit=crop",
    bgColor: "bg-slate-100"
  },
  {
    id: "4",
    name: "Hair Color",
    price: 60,
    duration: 60,
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&h=200&fit=crop",
    bgColor: "bg-amber-50"
  },
  {
    id: "5",
    name: "Facial",
    price: 50,
    duration: 45,
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&h=200&fit=crop",
    bgColor: "bg-orange-100"
  },
  {
    id: "6",
    name: "Manicure",
    price: 30,
    duration: 30,
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&h=200&fit=crop",
    bgColor: "bg-pink-50"
  }
];

export default function SelectServices() {
  const [selectedServices, setSelectedServices] = useState([]);

  const toggleService = (serviceId) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const formatDuration = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
    }
    return `${minutes} min`;
  };

  return (
    <div className="min-h-screen bg-[#1a1d21]">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to={createPageUrl("Home")} className="flex items-center gap-2">
              <Diamond className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-xl">Groomr</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to={createPageUrl("UserHome")} className="text-gray-400 hover:text-white text-sm transition-colors">
                Home
              </Link>
              <Link to={createPageUrl("SelectServices")} className="text-white text-sm transition-colors">
                Services
              </Link>
              <Link to={createPageUrl("Barbers")} className="text-gray-400 hover:text-white text-sm transition-colors">
                Stylists
              </Link>
              <Link to={createPageUrl("Barbers")} className="text-gray-400 hover:text-white text-sm transition-colors">
                Locations
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Barbers")}>
              <Button className="bg-[#6366f1] hover:bg-[#5558e3] text-white text-sm h-9 px-4 rounded-lg">
                Book Now
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="border-gray-700 text-white hover:bg-gray-800 text-sm h-9 px-4 rounded-lg"
              onClick={() => sovereign.auth.redirectToLogin()}
            >
              Log in
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Select Services</h1>
          <p className="text-gray-400">Choose the services you'd like to book.</p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {defaultServices.map((service) => (
            <div
              key={service.id}
              onClick={() => toggleService(service.id)}
              className={`cursor-pointer group transition-all duration-200 ${
                selectedServices.includes(service.id) ? 'scale-[0.98]' : ''
              }`}
            >
              <div 
                className={`aspect-square rounded-xl overflow-hidden mb-3 ${service.bgColor} ${
                  selectedServices.includes(service.id) 
                    ? 'ring-2 ring-[#6366f1] ring-offset-2 ring-offset-[#1a1d21]' 
                    : ''
                }`}
              >
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="text-white font-medium text-sm mb-1">{service.name}</h3>
              <p className="text-gray-500 text-sm">
                ${service.price} - {formatDuration(service.duration)}
              </p>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        {selectedServices.length > 0 && (
          <div className="fixed bottom-6 left-0 right-0 flex justify-center">
            <Link to={createPageUrl("Barbers")}>
              <Button className="bg-[#6366f1] hover:bg-[#5558e3] text-white px-8 py-3 rounded-xl shadow-lg">
                Continue with {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}