import { RequestHandler } from "express";

// Mock services data - replace with actual database queries later
const mockServices = [
  {
    id: "coupe",
    name: "Coupe de cheveux",
    description: "Coupe classique ou moderne selon vos préférences",
    basePrice: 60,
    duration: 30,
    category: "hair",
  },
  {
    id: "barbe",
    name: "Taille de barbe",
    description: "Taille et mise en forme de la barbe",
    basePrice: 40,
    duration: 20,
    category: "beard",
  },
  {
    id: "styling",
    name: "Styling",
    description: "Coiffage et mise en forme avec produits",
    basePrice: 30,
    duration: 15,
    category: "styling",
  },
  {
    id: "shampoing",
    name: "Shampoing",
    description: "Lavage et soin des cheveux",
    basePrice: 20,
    duration: 15,
    category: "care",
  },
  {
    id: "rasage",
    name: "Rasage traditionnel",
    description: "Rasage complet au rasoir traditionnel",
    basePrice: 50,
    duration: 25,
    category: "beard",
  },
  {
    id: "soin-visage",
    name: "Soin du visage",
    description: "Nettoyage et hydratation du visage",
    basePrice: 70,
    duration: 30,
    category: "care",
  },
];

export const handleGetServices: RequestHandler = (req, res) => {
  try {
    console.log("Get services request received");
    res.json(mockServices);
  } catch (error) {
    console.error("Error in get services:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

export const handleGetServiceById: RequestHandler = (req, res) => {
  try {
    const serviceId = req.params.id;
    console.log("Get service by ID request received for:", serviceId);

    const service = mockServices.find((s) => s.id === serviceId);

    if (!service) {
      return res.status(404).json({ error: "Service non trouvé" });
    }

    res.json(service);
  } catch (error) {
    console.error("Error in get service by ID:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};
