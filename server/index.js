import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyFirebaseToken, getUserByUid } from "./lib/firebase-admin.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { query, get, run } from "./database/db.js";
// Security middleware configuration - inline for now to avoid import issues
const configureSecurityMiddleware = (app) => {
  // Basic CORS setup
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://localhost:8080');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  });
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

// Security configuration
configureSecurityMiddleware(app);

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Configuration multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Seules les images sont autorisées"));
    }
  },
});

// Authentication middleware - Firebase version
const authenticateToken = async (req, res, next) => {
  try {
    await verifyFirebaseToken(req, res, next);
  } catch (error) {
    return res.status(403).json({ error: "Token invalide" });
  }
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Accès administrateur requis" });
  }
  next();
};

// Barber middleware
const requireBarber = (req, res, next) => {
  if (req.user.role !== 'barber' && req.user.role !== 'admin') {
    return res.status(403).json({ error: "Accès barbier requis" });
  }
  next();
};

// Routes

// Authentication routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, city, address, role } =
      req.body;

    // Validation des champs requis
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: "Tous les champs obligatoires doivent être remplis",
        required: ["email", "password", "firstName", "lastName"],
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Format d'email invalide" });
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    // Check if user already exists
    const existingUser = await get("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (existingUser) {
      return res.status(400).json({ error: "Email déjà utilisé" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Validate role
    const allowedRoles = ["client", "barber", "admin"];
    const userRole = allowedRoles.includes(role) ? role : "client";

    // Insert user
    const result = await run(
      "INSERT INTO users (email, password_hash, first_name, last_name, phone, city, address, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        email,
        hashedPassword,
        firstName,
        lastName,
        phone || null,
        city || null,
        address || null,
        userRole,
      ],
    );

    // Generate token
    const token = jwt.sign(
      { userId: result.id, email, role: userRole },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" },
    );

    res.status(201).json({
      message: "Inscription réussie",
      token,
      userId: result.id,
      role: userRole,
      user: {
        id: result.id,
        email,
        firstName,
        lastName,
        role: userRole,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Erreur lors de l'inscription" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user
    const user = await get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) {
      return res.status(400).json({ error: "Email ou mot de passe incorrect" });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: "Email ou mot de passe incorrect" });
    }

    // For Firebase integration, return user data without JWT token
    // The client will handle Firebase authentication
    res.json({ 
      userId: user.id, 
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone,
        city: user.city,
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
});

// Profile routes
app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const user = await get("SELECT * FROM users WHERE id = ?", [req.user.userId]);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      phone: user.phone,
      city: user.city,
      address: user.address,
      avatarUrl: user.avatar_url,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Erreur lors de la récupération du profil" });
  }
});

app.put("/api/profile", authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, city, address } = req.body;

    await run(
      "UPDATE users SET first_name = ?, last_name = ?, phone = ?, city = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [firstName, lastName, phone, city, address, req.user.userId]
    );

    res.json({ message: "Profil mis à jour avec succès" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du profil" });
  }
});

// Services routes
app.get("/api/services", async (req, res) => {
  try {
    const services = await query(
      "SELECT * FROM services ORDER BY category, name",
    );
    res.json(services);
  } catch (error) {
    console.error("Get services error:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des services" });
  }
});

// Barbers routes
app.get("/api/barbers", async (req, res) => {
  try {
    const { services, location, locationType } = req.query;

    let sql = `
      SELECT DISTINCT b.*, 
             GROUP_CONCAT(s.name) as service_names,
             GROUP_CONCAT(bs.price) as service_prices
      FROM barbers b
      LEFT JOIN barber_services bs ON b.id = bs.barber_id
      LEFT JOIN services s ON bs.service_id = s.id
    `;

    const conditions = [];
    const params = [];

    if (services) {
      const serviceIds = services.split(",");
      conditions.push(`b.id IN (
        SELECT DISTINCT barber_id 
        FROM barber_services 
        WHERE service_id IN (${serviceIds.map(() => "?").join(",")})
      )`);
      params.push(...serviceIds);
    }

    if (location) {
      conditions.push("b.location LIKE ?");
      params.push(`%${location}%`);
    }

    if (locationType === "home") {
      conditions.push("b.accepts_home = 1");
    } else if (locationType === "shop") {
      conditions.push("b.accepts_shop = 1");
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " GROUP BY b.id ORDER BY b.rating DESC";

    const barbers = await query(sql, params);
    res.json(barbers);
  } catch (error) {
    console.error("Get barbers error:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des barbiers" });
  }
});

app.get("/api/barbers/:id", async (req, res) => {
  try {
    const barber = await get("SELECT * FROM barbers WHERE id = ?", [req.params.id]);
    if (!barber) {
      return res.status(404).json({ error: "Barbier non trouvé" });
    }

    // Get barber services
    const services = await query(
      "SELECT bs.*, s.name as service_name, s.duration_minutes FROM barber_services bs JOIN services s ON bs.service_id = s.id WHERE bs.barber_id = ?",
      [req.params.id]
    );

    res.json({ ...barber, services });
  } catch (error) {
    console.error("Get barber error:", error);
    res.status(500).json({ error: "Erreur lors de la récupération du barbier" });
  }
});

// Appointments routes
app.post("/api/appointments", authenticateToken, async (req, res) => {
  try {
    const {
      barberId,
      services,
      date,
      time,
      locationType,
      address,
      notes,
      referenceImage,
    } = req.body;
    const clientId = req.user.userId;

    // Calculate total price
    const servicePrices = await query(
      `
      SELECT SUM(bs.price) as total
      FROM barber_services bs
      WHERE bs.barber_id = ? AND bs.service_id IN (${services.map(() => "?").join(",")})
    `,
      [barberId, ...services],
    );

    const totalPrice = servicePrices[0].total || 0;

    // Create appointment
    const appointmentResult = await run(
      `
      INSERT INTO appointments (client_id, barber_id, appointment_date, appointment_time, location_type, address, total_price, notes, reference_image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        clientId,
        barberId,
        date,
        time,
        locationType,
        address,
        totalPrice,
        notes,
        referenceImage || null,
      ],
    );

    // Add appointment services
    for (const serviceId of services) {
      const servicePrice = await get(
        "SELECT price FROM barber_services WHERE barber_id = ? AND service_id = ?",
        [barberId, serviceId],
      );
      await run(
        "INSERT INTO appointment_services (appointment_id, service_id, price) VALUES (?, ?, ?)",
        [appointmentResult.id, serviceId, servicePrice.price],
      );
    }

    res.json({
      appointmentId: appointmentResult.id,
      message: "Réservation créée avec succès",
    });
  } catch (error) {
    console.error("Create appointment error:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la création de la réservation" });
  }
});

app.get("/api/appointments", authenticateToken, async (req, res) => {
  try {
    const appointments = await query(
      `
      SELECT a.*, b.name as barber_name, b.salon_name
      FROM appointments a
      JOIN barbers b ON a.barber_id = b.id
      WHERE a.client_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `,
      [req.user.userId]
    );

    // Get services for each appointment
    for (let appointment of appointments) {
      const services = await query(
        "SELECT as.*, s.name as service_name FROM appointment_services as JOIN services s ON as.service_id = s.id WHERE as.appointment_id = ?",
        [appointment.id]
      );
      appointment.services = services;
    }

    res.json(appointments);
  } catch (error) {
    console.error("Get appointments error:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des réservations" });
  }
});

app.put("/api/appointments/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const appointment = await get(
      "SELECT * FROM appointments WHERE id = ? AND client_id = ?",
      [req.params.id, req.user.userId]
    );

    if (!appointment) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ error: "Réservation déjà annulée" });
    }

    await run(
      "UPDATE appointments SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [req.params.id]
    );

    res.json({ message: "Réservation annulée avec succès" });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    res.status(500).json({ error: "Erreur lors de l'annulation de la réservation" });
  }
});

// Favorites routes
app.get("/api/favorites", authenticateToken, async (req, res) => {
  try {
    const favorites = await query(
      `
      SELECT b.* FROM barbers b
      JOIN favorites f ON b.id = f.barber_id
      WHERE f.client_id = ?
      ORDER BY f.created_at DESC
    `,
      [req.user.userId]
    );
    res.json(favorites);
  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des favoris" });
  }
});

app.post("/api/favorites", authenticateToken, async (req, res) => {
  try {
    const { barberId } = req.body;

    // Check if already favorited
    const existing = await get(
      "SELECT id FROM favorites WHERE client_id = ? AND barber_id = ?",
      [req.user.userId, barberId]
    );

    if (existing) {
      return res.status(400).json({ error: "Barbier déjà dans les favoris" });
    }

    await run(
      "INSERT INTO favorites (client_id, barber_id) VALUES (?, ?)",
      [req.user.userId, barberId]
    );

    res.json({ message: "Ajouté aux favoris" });
  } catch (error) {
    console.error("Add favorite error:", error);
    res.status(500).json({ error: "Erreur lors de l'ajout aux favoris" });
  }
});

app.delete("/api/favorites/:id", authenticateToken, async (req, res) => {
  try {
    await run(
      "DELETE FROM favorites WHERE client_id = ? AND barber_id = ?",
      [req.user.userId, req.params.id]
    );

    res.json({ message: "Retiré des favoris" });
  } catch (error) {
    console.error("Remove favorite error:", error);
    res.status(500).json({ error: "Erreur lors du retrait des favoris" });
  }
});

// Search route
app.get("/api/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ barbers: [], services: [] });
    }

    const searchTerm = `%${q}%`;

    const barbers = await query(
      "SELECT * FROM barbers WHERE name LIKE ? OR salon_name LIKE ? OR location LIKE ? LIMIT 10",
      [searchTerm, searchTerm, searchTerm]
    );

    const services = await query(
      "SELECT * FROM services WHERE name LIKE ? OR category LIKE ? LIMIT 10",
      [searchTerm, searchTerm]
    );

    res.json({ barbers, services });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Erreur lors de la recherche" });
  }
});

// Analytics routes
app.get("/api/analytics/overview", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await get("SELECT COUNT(*) as count FROM users WHERE role = 'client'");
    const totalBarbers = await get("SELECT COUNT(*) as count FROM barbers");
    const totalAppointments = await get("SELECT COUNT(*) as count FROM appointments");
    const totalRevenue = await get("SELECT SUM(total_price) as total FROM appointments WHERE status = 'completed'");

    res.json({
      totalUsers: totalUsers.count,
      totalBarbers: totalBarbers.count,
      totalAppointments: totalAppointments.count,
      totalRevenue: totalRevenue.total || 0,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des analytics" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export function createServer() {
  return app;
}
