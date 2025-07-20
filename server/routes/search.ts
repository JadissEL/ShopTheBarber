import { RequestHandler } from "express";

// Mock search data - replace with actual database queries later
const mockSearchResults = [
  { id: 1, name: "Ahmed Benali", type: "barber", location: "Casablanca" },
  { id: 2, name: "Omar Mansouri", type: "barber", location: "Marrakech" },
  { id: 3, name: "Youssef Alami", type: "barber", location: "Rabat" },
  { id: 4, name: "Hassan Riad", type: "barber", location: "Fès" },
  { id: 5, name: "Karim Fassi", type: "barber", location: "Tanger" },
  { id: 6, name: "Rachid Ouali", type: "barber", location: "Agadir" },
  {
    id: 101,
    title: "Coupe Classique",
    type: "service",
    description: "Coupe traditionnelle",
  },
  {
    id: 102,
    title: "Barbe Premium",
    type: "service",
    description: "Taille et soin de barbe",
  },
  {
    id: 103,
    title: "Coupe Moderne",
    type: "service",
    description: "Styles contemporains",
  },
  {
    id: 104,
    title: "Shampoing Deluxe",
    type: "service",
    description: "Lavage et soin",
  },
];

export const handleSearch: RequestHandler = (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.json([]);
    }

    const searchTerm = q.toLowerCase();
    const filteredResults = mockSearchResults.filter(
      (item) =>
        (item.name && item.name.toLowerCase().includes(searchTerm)) ||
        (item.title && item.title.toLowerCase().includes(searchTerm)) ||
        (item.location && item.location.toLowerCase().includes(searchTerm)) ||
        (item.description &&
          item.description.toLowerCase().includes(searchTerm)),
    );

    // Limit to 10 results
    const limitedResults = filteredResults.slice(0, 10);

    res.json(limitedResults);
  } catch (error) {
    console.error("Error in search:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
