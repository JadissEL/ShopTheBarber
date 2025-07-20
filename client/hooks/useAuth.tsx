import React from "react";

interface User {
  userId: number;
  email: string;
  role: "client" | "barber" | "admin";
}

interface DecodedToken {
  userId: number;
  email: string;
  role: "client" | "barber" | "admin";
  iat: number;
  exp: number;
}

export const useAuth = () => {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Fonction pour décoder le token JWT (version simplifiée)
  const decodeToken = (token: string): DecodedToken | null => {
    try {
      if (!token || typeof token !== "string") {
        return null;
      }

      const parts = token.split(".");
      if (parts.length !== 3) {
        console.error("Token JWT invalide: format incorrect");
        return null;
      }

      const base64Url = parts[1];
      if (!base64Url) {
        console.error("Token JWT invalide: payload manquant");
        return null;
      }
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(""),
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Erreur lors du décodage du token:", error);
      return null;
    }
  };

  // Vérifier si le token est expiré
  const isTokenExpired = (decodedToken: DecodedToken): boolean => {
    const currentTime = Date.now() / 1000;
    return decodedToken.exp < currentTime;
  };

  // Initialiser l'état d'authentification
  React.useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      const decodedToken = decodeToken(token);

      if (decodedToken && !isTokenExpired(decodedToken)) {
        setUser({
          userId: decodedToken.userId,
          email: decodedToken.email,
          role: decodedToken.role,
        });
      } else {
        // Token expiré ou invalide
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        setUser(null);
      }
    }

    setLoading(false);
  }, []);

  // Fonction pour se connecter
  const login = (
    token: string,
    userId: number,
    role: "client" | "barber" | "admin",
  ) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId.toString());
    setUser({ userId, email: "", role }); // L'email sera récupéré du token décodé
  };

  // Fonction pour se déconnecter
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setUser(null);
  };

  // Vérifier si l'utilisateur a un rôle spécifique
  const hasRole = (role: "client" | "barber" | "admin"): boolean => {
    return user?.role === role;
  };

  // Vérifier si l'utilisateur a accès à un rôle ou plus
  const hasAnyRole = (roles: ("client" | "barber" | "admin")[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  return {
    user,
    loading,
    login,
    logout,
    hasRole,
    hasAnyRole,
    isAuthenticated: !!user,
  };
};
