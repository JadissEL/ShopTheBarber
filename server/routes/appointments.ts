import { RequestHandler } from "express";

// Mock appointments data - replace with actual database queries later
let mockAppointments = [
  {
    id: 1,
    user_id: 1,
    barber_id: 1,
    barber_name: "Ahmed Benali",
    service_names: "Coupe classique, Taille de barbe",
    appointment_date: "2024-01-20",
    appointment_time: "10:00",
    total_price: 120,
    status: "confirmed",
    location_type: "shop",
    address: "",
    notes: "",
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: 2,
    user_id: 1,
    barber_id: 2,
    barber_name: "Youssef El Mansouri",
    service_names: "Coupe moderne",
    appointment_date: "2024-01-25",
    appointment_time: "14:00",
    total_price: 80,
    status: "pending",
    location_type: "home",
    address: "123 Rue Example, Casablanca",
    notes: "Première visite",
    created_at: "2024-01-18T14:00:00Z",
  },
  {
    id: 3,
    user_id: 1,
    barber_id: 1,
    barber_name: "Ahmed Benali",
    service_names: "Coupe + Barbe",
    appointment_date: "2024-01-10",
    appointment_time: "16:00",
    total_price: 100,
    status: "completed",
    location_type: "shop",
    address: "",
    notes: "",
    created_at: "2024-01-08T16:00:00Z",
  },
];

export const handleGetAppointments: RequestHandler = (req, res) => {
  try {
    console.log("Get appointments request received");

    // In production, filter by authenticated user ID
    const userAppointments = mockAppointments.filter(
      (apt) => apt.user_id === 1,
    );

    res.json(userAppointments);
  } catch (error) {
    console.error("Error in get appointments:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

export const handleCreateAppointment: RequestHandler = (req, res) => {
  try {
    console.log("Create appointment request received:", req.body);

    const { barberId, services, date, time, locationType, address, notes } =
      req.body;

    if (!barberId || !services || !date || !time) {
      return res.status(400).json({
        error: "Barbier, services, date et heure requis",
      });
    }

    // Create new appointment
    const newAppointment = {
      id: mockAppointments.length + 1,
      user_id: 1, // In production, get from authenticated user
      barber_id: barberId,
      barber_name: "Barbier Sélectionné", // In production, fetch from barber ID
      service_names: Array.isArray(services) ? services.join(", ") : services,
      appointment_date: date,
      appointment_time: time,
      total_price: 100, // In production, calculate based on services
      status: "pending",
      location_type: locationType || "shop",
      address: address || "",
      notes: notes || "",
      created_at: new Date().toISOString(),
    };

    // Add to mock database
    mockAppointments.push(newAppointment);

    res.status(201).json({
      appointment: newAppointment,
      message: "Rendez-vous créé avec succès",
    });
  } catch (error) {
    console.error("Error in create appointment:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

export const handleCancelAppointment: RequestHandler = (req, res) => {
  try {
    const appointmentId = parseInt(req.params.id);
    console.log("Cancel appointment request received for ID:", appointmentId);

    const appointmentIndex = mockAppointments.findIndex(
      (apt) => apt.id === appointmentId && apt.user_id === 1,
    );

    if (appointmentIndex === -1) {
      return res.status(404).json({ error: "Rendez-vous non trouvé" });
    }

    // Update appointment status
    mockAppointments[appointmentIndex].status = "cancelled";

    res.json({
      appointment: mockAppointments[appointmentIndex],
      message: "Rendez-vous annulé avec succès",
    });
  } catch (error) {
    console.error("Error in cancel appointment:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};
