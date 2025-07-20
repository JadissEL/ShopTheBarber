import { RequestHandler } from "express";

// Mock favorites data - replace with actual database queries later
const mockFavorites = [
  {
    id: 1,
    name: "Ahmed Benali",
    salon_name: "Salon Elite",
    location: "Maarif, Casablanca",
    rating: 4.8,
    total_bookings: 5,
    last_visit: "2024-01-10",
    average_price: 100,
    services: ["coupe", "barbe", "styling"],
    accepts_home: true,
    accepts_shop: true,
    priceList: {
      coupe: 60,
      barbe: 40,
      styling: 30,
    },
  },
  {
    id: 2,
    name: "Youssef El Mansouri",
    salon_name: "Barber Shop Modern",
    location: "Gauthier, Casablanca",
    rating: 4.6,
    total_bookings: 3,
    last_visit: "2024-01-18",
    average_price: 80,
    services: ["coupe", "styling"],
    accepts_home: false,
    accepts_shop: true,
    priceList: {
      coupe: 80,
      styling: 35,
    },
  },
];

export const handleGetFavorites: RequestHandler = (req, res) => {
  try {
    console.log("Get favorites request received");

    // In production, filter by authenticated user ID
    res.json(mockFavorites);
  } catch (error) {
    console.error("Error in get favorites:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

export const handleAddFavorite: RequestHandler = (req, res) => {
  try {
    const { barberId } = req.body;
    console.log("Add favorite request received for barber ID:", barberId);

    // In production, add to user's favorites in database
    res.json({ message: "Barbier ajouté aux favoris" });
  } catch (error) {
    console.error("Error in add favorite:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

export const handleRemoveFavorite: RequestHandler = (req, res) => {
  try {
    const barberId = parseInt(req.params.id);
    console.log("Remove favorite request received for barber ID:", barberId);

    // In production, remove from user's favorites in database
    res.json({ message: "Barbier retiré des favoris" });
  } catch (error) {
    console.error("Error in remove favorite:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};
