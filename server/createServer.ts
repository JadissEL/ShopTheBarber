import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleGetBarbers, handleGetBarberById } from "./routes/barbers";
import { handleSearch } from "./routes/search";
import {
  handleLogin,
  handleRegister,
  handleProfile,
  handleUpdateProfile,
} from "./routes/auth";
import {
  handleGetAnalyticsOverview,
  handleGetClientAnalytics,
} from "./routes/analytics";
import {
  handleGetAppointments,
  handleCreateAppointment,
  handleCancelAppointment,
} from "./routes/appointments";
import {
  handleGetFavorites,
  handleAddFavorite,
  handleRemoveFavorite,
} from "./routes/favorites";
import {
  handleGetNotifications,
  handleMarkNotificationRead,
  handleMarkAllNotificationsRead,
} from "./routes/notifications";
import { handleGetServices, handleGetServiceById } from "./routes/services";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // Barber routes
  app.get("/api/barbers", handleGetBarbers);
  app.get("/api/barbers/:id", handleGetBarberById);

  // Search route
  app.get("/api/search", handleSearch);

  // Authentication routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/register", handleRegister);
  app.get("/api/profile", handleProfile);
  app.put("/api/profile", handleUpdateProfile);

  // Analytics routes
  app.get("/api/analytics/overview", handleGetAnalyticsOverview);
  app.get("/api/analytics/client", handleGetClientAnalytics);

  // Appointments routes
  app.get("/api/appointments", handleGetAppointments);
  app.post("/api/appointments", handleCreateAppointment);
  app.put("/api/appointments/:id/cancel", handleCancelAppointment);

  // Favorites routes
  app.get("/api/favorites", handleGetFavorites);
  app.post("/api/favorites", handleAddFavorite);
  app.delete("/api/favorites/:id", handleRemoveFavorite);

  // Notifications routes
  app.get("/api/notifications", handleGetNotifications);
  app.put("/api/notifications/:id/read", handleMarkNotificationRead);
  app.put("/api/notifications/read-all", handleMarkAllNotificationsRead);

  // Services routes
  app.get("/api/services", handleGetServices);
  app.get("/api/services/:id", handleGetServiceById);

  return app;
}
