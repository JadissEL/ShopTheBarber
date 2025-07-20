import { RequestHandler } from "express";

// Mock user data - replace with actual database queries later
const mockUsers = [
  {
    id: 1,
    email: "admin@shopthebarber.ma",
    password: "admin123", // In production, this would be hashed
    firstName: "Admin",
    lastName: "ShopTheBarber",
    role: "admin",
    phone: "+212 5 22 XX XX XX",
    city: "Casablanca",
  },
  {
    id: 2,
    email: "client@test.com",
    password: "client123",
    firstName: "Client",
    lastName: "Test",
    role: "client",
    phone: "+212 6 XX XX XX XX",
    city: "Casablanca",
  },
  {
    id: 3,
    email: "barber@test.com",
    password: "barber123",
    firstName: "Ahmed",
    lastName: "Benali",
    role: "barber",
    phone: "+212 6 XX XX XX XX",
    city: "Casablanca",
  },
];

export const handleLogin: RequestHandler = (req, res) => {
  try {
    console.log("Login request received from browser:", {
      method: req.method,
      url: req.url,
      body: req.body,
      headers: req.headers,
      userAgent: req.headers["user-agent"],
    });

    const { email, password } = req.body;

    // Temporarily always return success to debug
    const debugUser = {
      id: 1,
      email: email || "debug@test.com",
      firstName: "Debug",
      lastName: "User",
      role: "admin",
      phone: "+212 5 22 XX XX XX",
      city: "Casablanca",
    };

    const token = `debug_token_${Date.now()}`;

    console.log("Sending debug success response");
    res.json({
      token,
      user: debugUser,
      message: "Debug connexion réussie",
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

export const handleRegister: RequestHandler = (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      city,
      role = "client",
    } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: "Email, mot de passe, prénom et nom requis",
      });
    }

    // Check if user already exists
    const existingUser = mockUsers.find((u) => u.email === email);
    if (existingUser) {
      return res
        .status(409)
        .json({ error: "Un compte avec cet email existe déjà" });
    }

    // Create new user
    const newUser = {
      id: mockUsers.length + 1,
      email,
      password, // In production, hash the password
      firstName,
      lastName,
      role,
      phone: phone || "",
      city: city || "",
    };

    // Add to mock database
    mockUsers.push(newUser);

    // Generate token
    const token = `token_${newUser.id}_${Date.now()}`;

    // Return user data without password
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      token,
      user: userWithoutPassword,
      message: "Compte créé avec succès",
    });
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

export const handleProfile: RequestHandler = (req, res) => {
  try {
    // In production, decode JWT token to get user ID
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token manquant" });
    }

    const token = authHeader.replace("Bearer ", "");

    // Extract user ID from token (simplified for demo)
    const userId = parseInt(token.split("_")[1]);
    const user = mockUsers.find((u) => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Error in profile:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

export const handleUpdateProfile: RequestHandler = (req, res) => {
  try {
    // In production, decode JWT token to get user ID
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token manquant" });
    }

    const token = authHeader.replace("Bearer ", "");

    // Extract user ID from token (simplified for demo)
    const userId = parseInt(token.split("_")[1]);
    const userIndex = mockUsers.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const { firstName, lastName, phone, city, address } = req.body;

    // Update user data
    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      firstName: firstName || mockUsers[userIndex].firstName,
      lastName: lastName || mockUsers[userIndex].lastName,
      phone: phone || mockUsers[userIndex].phone,
      city: city || mockUsers[userIndex].city,
      address: address || mockUsers[userIndex].address || "",
    };

    // Return updated user data without password
    const { password: _, ...userWithoutPassword } = mockUsers[userIndex];
    res.json({
      user: userWithoutPassword,
      message: "Profil mis à jour avec succès",
    });
  } catch (error) {
    console.error("Error in update profile:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};
