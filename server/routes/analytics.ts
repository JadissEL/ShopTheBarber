import { RequestHandler } from "express";

// Mock analytics data - replace with actual database queries later
const mockAnalytics = {
  overview: {
    upcomingBookings: 3,
    favoriteBarbers: 2,
    totalBookings: 12,
    unreadNotifications: 5,
  },
  monthlyBookings: [
    { month: "Jan", count: 3 },
    { month: "Fév", count: 5 },
    { month: "Mar", count: 4 },
    { month: "Avr", count: 0 },
  ],
  statusDistribution: [
    { status: "completed", count: 8 },
    { status: "cancelled", count: 2 },
    { status: "pending", count: 1 },
    { status: "confirmed", count: 1 },
  ],
};

export const handleGetAnalyticsOverview: RequestHandler = (req, res) => {
  try {
    console.log("Analytics overview request received");
    res.json(mockAnalytics.overview);
  } catch (error) {
    console.error("Error in analytics overview:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

export const handleGetClientAnalytics: RequestHandler = (req, res) => {
  try {
    console.log("Client analytics request received");
    res.json({
      monthlyBookings: mockAnalytics.monthlyBookings,
      statusDistribution: mockAnalytics.statusDistribution,
    });
  } catch (error) {
    console.error("Error in client analytics:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};
