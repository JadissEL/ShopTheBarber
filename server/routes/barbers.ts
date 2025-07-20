import { RequestHandler } from "express";

// Mock data for featured barbers - replace with actual database queries later
const mockBarbers = [
  {
    id: 1,
    name: "Ahmed Benali",
    salon_name: "Elite Barber Shop",
    rating: 4.9,
    location: "Casablanca",
    description: "Expert en coupes modernes et traditionnelles",
    image_url: null,
    accepts_home: true,
    accepts_shop: true,
    review_count: 156,
    services: ["coupe", "barbe", "styling", "rasage"],
    priceList: {
      coupe: 60,
      barbe: 40,
      styling: 30,
      rasage: 50,
    },
    comboOffers: [
      {
        services: ["coupe", "barbe"],
        discount: 10,
      },
    ],
    timeOffers: [
      {
        days: [1, 2, 3], // Monday to Wednesday
        startHour: 9,
        endHour: 12,
        discount: 15,
      },
    ],
  },
  {
    id: 2,
    name: "Omar Mansouri",
    salon_name: "Royal Cut",
    rating: 4.8,
    location: "Marrakech",
    description: "Spécialiste des coupes premium et soins de barbe",
    image_url: null,
    accepts_home: false,
    accepts_shop: true,
    review_count: 134,
    services: ["coupe", "barbe", "soin-visage"],
    priceList: {
      coupe: 80,
      barbe: 50,
      "soin-visage": 70,
    },
    comboOffers: [],
    timeOffers: [],
  },
  {
    id: 3,
    name: "Youssef Alami",
    salon_name: "Modern Style",
    rating: 4.7,
    location: "Rabat",
    description: "Innovation et style pour l'homme moderne",
    image_url: null,
    accepts_home: true,
    accepts_shop: true,
    review_count: 98,
    services: ["coupe", "styling", "shampoing"],
    priceList: {
      coupe: 70,
      styling: 35,
      shampoing: 20,
    },
    comboOffers: [],
    timeOffers: [],
  },
  {
    id: 4,
    name: "Hassan Riad",
    salon_name: "Classic Cuts",
    rating: 4.9,
    location: "Fès",
    description: "Maître barbier avec 15 ans d'expérience",
    image_url: null,
    accepts_home: false,
    accepts_shop: true,
    review_count: 201,
    services: ["coupe", "barbe", "rasage", "soin-visage"],
    priceList: {
      coupe: 65,
      barbe: 45,
      rasage: 55,
      "soin-visage": 75,
    },
    comboOffers: [
      {
        services: ["coupe", "barbe", "rasage"],
        discount: 20,
      },
    ],
    timeOffers: [],
  },
  {
    id: 5,
    name: "Karim Fassi",
    salon_name: "Gentleman Club",
    rating: 4.6,
    location: "Tanger",
    description: "Service premium et ambiance exclusive",
    image_url: null,
    accepts_home: true,
    accepts_shop: true,
    review_count: 87,
    services: ["coupe", "barbe", "styling", "soin-visage"],
    priceList: {
      coupe: 90,
      barbe: 60,
      styling: 40,
      "soin-visage": 80,
    },
    comboOffers: [],
    timeOffers: [],
  },
  {
    id: 6,
    name: "Rachid Ouali",
    salon_name: "Barber's Choice",
    rating: 4.8,
    location: "Agadir",
    description: "Coupes tendance et services de qualité",
    image_url: null,
    accepts_home: false,
    accepts_shop: true,
    review_count: 112,
    services: ["coupe", "styling", "shampoing"],
    priceList: {
      coupe: 75,
      styling: 30,
      shampoing: 25,
    },
    comboOffers: [],
    timeOffers: [],
  },
];

export const handleGetBarbers: RequestHandler = (req, res) => {
  try {
    // For now, return mock data. In production, this would query the database
    const { limit, city, search } = req.query;

    let filteredBarbers = [...mockBarbers];

    // Filter by city if provided
    if (city && typeof city === "string") {
      filteredBarbers = filteredBarbers.filter((barber) =>
        barber.location.toLowerCase().includes(city.toLowerCase()),
      );
    }

    // Filter by search term if provided
    if (search && typeof search === "string") {
      const searchTerm = search.toLowerCase();
      filteredBarbers = filteredBarbers.filter(
        (barber) =>
          barber.name.toLowerCase().includes(searchTerm) ||
          barber.salon_name.toLowerCase().includes(searchTerm) ||
          barber.description.toLowerCase().includes(searchTerm),
      );
    }

    // Limit results if specified
    if (limit && typeof limit === "string") {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum)) {
        filteredBarbers = filteredBarbers.slice(0, limitNum);
      }
    }

    res.json(filteredBarbers);
  } catch (error) {
    console.error("Error fetching barbers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetBarberById: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const barberId = parseInt(id, 10);

    const barber = mockBarbers.find((b) => b.id === barberId);

    if (!barber) {
      return res.status(404).json({ error: "Barber not found" });
    }

    res.json(barber);
  } catch (error) {
    console.error("Error fetching barber:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
