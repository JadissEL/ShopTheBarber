import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { MetaTags } from "@/components/seo/MetaTags";
import PageHeader from "@/components/layout/PageHeader";
import PageContent from "@/components/layout/PageContent";
import { stb } from "@/lib/stbUi";

const defaultServices = [
  {
    id: "1",
    name: "Haircut",
    price: 35,
    duration: 45,
    image: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=200&h=200&fit=crop",
    bgColor: "bg-muted"
  },
  {
    id: "2",
    name: "Beard Trim",
    price: 25,
    duration: 30,
    image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=200&h=200&fit=crop",
    bgColor: "bg-muted"
  },
  {
    id: "3",
    name: "Hot Towel Shave",
    price: 40,
    duration: 45,
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&h=200&fit=crop",
    bgColor: "bg-muted"
  },
  {
    id: "4",
    name: "Hair Color",
    price: 60,
    duration: 60,
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&h=200&fit=crop",
    bgColor: "bg-primary/10"
  },
  {
    id: "5",
    name: "Facial",
    price: 50,
    duration: 45,
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&h=200&fit=crop",
    bgColor: "bg-muted"
  },
  {
    id: "6",
    name: "Manicure",
    price: 30,
    duration: 30,
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&h=200&fit=crop",
    bgColor: "bg-muted"
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
    <div className="stb-page pb-16 font-sans">
      <MetaTags title="Select Services" description="Choose services for your booking" />
      <PageHeader
        label="Provider"
        title="Select services"
        subtitle="Choose the services you'd like to offer or book."
        compact
        variant="light"
        tier="app"
      >
        <Link to={createPageUrl("Barbers")}>
          <Button className="h-11">Continue to stylists</Button>
        </Link>
      </PageHeader>

      <PageContent>
        <div className={stb.gridCards}>
          {defaultServices.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => toggleService(service.id)}
              className={`cursor-pointer group text-left transition-all duration-200 ${
                selectedServices.includes(service.id) ? 'scale-[0.98]' : ''
              }`}
            >
              <div
                className={`aspect-square rounded-lg overflow-hidden mb-3 ${service.bgColor} ${
                  selectedServices.includes(service.id)
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                    : ''
                }`}
              >
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className={`${stb.uiSubheading} text-sm mb-1`}>{service.name}</h3>
              <p className={`${stb.caption} text-muted-foreground`}>
                ${service.price} · {formatDuration(service.duration)}
              </p>
            </button>
          ))}
        </div>

        {selectedServices.length > 0 && (
          <div className="mt-10 flex justify-center">
            <Link to={createPageUrl("Barbers")}>
              <Button className="h-11 px-8">
                Continue with {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}
              </Button>
            </Link>
          </div>
        )}
      </PageContent>
    </div>
  );
}
