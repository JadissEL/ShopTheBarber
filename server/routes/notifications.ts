import { RequestHandler } from "express";

// Mock notifications data - replace with actual database queries later
const mockNotifications = [
  {
    id: 1,
    user_id: 1,
    title: "Rappel de rendez-vous",
    message: "Votre rendez-vous avec Ahmed Benali est prévu demain à 10h00",
    type: "reminder",
    date: "2024-01-19T08:00:00Z",
    read: false,
  },
  {
    id: 2,
    user_id: 1,
    title: "Nouveau barbier disponible",
    message: "Mohamed Alami vient de s'inscrire dans votre quartier",
    type: "new_barber",
    date: "2024-01-18T15:30:00Z",
    read: false,
  },
  {
    id: 3,
    user_id: 1,
    title: "Offre spéciale",
    message: "20% de réduction sur votre prochain rendez-vous avec Youssef",
    type: "promotion",
    date: "2024-01-17T12:00:00Z",
    read: true,
  },
  {
    id: 4,
    user_id: 1,
    title: "Rendez-vous confirmé",
    message: "Votre rendez-vous du 25 janvier à 14h00 a été confirmé",
    type: "confirmation",
    date: "2024-01-15T16:45:00Z",
    read: false,
  },
  {
    id: 5,
    user_id: 1,
    title: "Demande d'avis",
    message: "Comment s'est passé votre rendez-vous avec Ahmed Benali ?",
    type: "review_request",
    date: "2024-01-11T18:00:00Z",
    read: false,
  },
];

export const handleGetNotifications: RequestHandler = (req, res) => {
  try {
    console.log("Get notifications request received");

    // In production, filter by authenticated user ID
    const userNotifications = mockNotifications.filter(
      (notif) => notif.user_id === 1,
    );

    res.json(userNotifications);
  } catch (error) {
    console.error("Error in get notifications:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

export const handleMarkNotificationRead: RequestHandler = (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    console.log(
      "Mark notification read request received for ID:",
      notificationId,
    );

    const notification = mockNotifications.find(
      (notif) => notif.id === notificationId && notif.user_id === 1,
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification non trouvée" });
    }

    // Mark as read
    notification.read = true;

    res.json({
      notification,
      message: "Notification marquée comme lue",
    });
  } catch (error) {
    console.error("Error in mark notification read:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

export const handleMarkAllNotificationsRead: RequestHandler = (req, res) => {
  try {
    console.log("Mark all notifications read request received");

    // Mark all user notifications as read
    mockNotifications.forEach((notif) => {
      if (notif.user_id === 1) {
        notif.read = true;
      }
    });

    res.json({ message: "Toutes les notifications marquées comme lues" });
  } catch (error) {
    console.error("Error in mark all notifications read:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};
