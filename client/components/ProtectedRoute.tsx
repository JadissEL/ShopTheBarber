import React from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("client" | "barber" | "admin")[];
  fallbackPath?: string;
}

// Fonction pour valider le token (incluant les tokens demo)
const validateToken = (token: string) => {
  try {
    // Pour notre système de tokens simples, on va juste vérifier le format
    // Format: token_userId_timestamp ou debug_token_timestamp ou demo-{role}-token-{id}
    if (
      token.startsWith("token_") ||
      token.startsWith("debug_token_") ||
      token.startsWith("demo-")
    ) {
      return { valid: true };
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la validation du token:", error);
    return null;
  }
};

// Extraire le rôle directement du token demo
const getUserRole = async (token: string): Promise<string | null> => {
  try {
    // Si c'est un token demo, extraire le rôle directement
    if (token.startsWith("demo-")) {
      const parts = token.split("-");
      if (parts.length >= 2) {
        const role = parts[1]; // demo-admin-token-123 -> admin
        console.log("Demo token detected, role:", role);
        return role;
      }
    }

    // Pour les autres tokens, essayer l'API (mais elle sera bloquée en mode demo)
    const response = await fetch("/api/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const userData = await response.json();
      return userData.role;
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération du rôle:", error);
    // En cas d'erreur (mode demo), retourner null pour que la validation échoue
    return null;
  }
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = ["client", "barber", "admin"],
  fallbackPath = "/login",
}) => {
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const token = localStorage.getItem("token");

  React.useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        console.log("Aucun token trouvé, redirection vers:", fallbackPath);
        setLoading(false);
        return;
      }

      const tokenValid = validateToken(token);
      if (!tokenValid) {
        console.log("Token invalide, redirection vers:", fallbackPath);
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        setLoading(false);
        return;
      }

      // Récupérer le rôle de l'utilisateur
      const role = await getUserRole(token);
      if (!role) {
        console.log(
          "Impossible de récupérer le rôle, redirection vers:",
          fallbackPath,
        );
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        setLoading(false);
        return;
      }

      setUserRole(role);
      setLoading(false);
    };

    checkAuth();
  }, [token, fallbackPath]);

  if (loading) {
    return (
      <div className="min-h-screen bg-moroccan-charcoal flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-3 border-moroccan-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-moroccan-sand">
            Vérification des autorisations...
          </p>
        </div>
      </div>
    );
  }

  if (!token || !userRole) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (!allowedRoles.includes(userRole as any)) {
    console.log(
      `Rôle ${userRole} non autorisé. Rôles autoris��s:`,
      allowedRoles,
    );
    // Rediriger vers le dashboard approprié selon le rôle
    switch (userRole) {
      case "client":
        return <Navigate to="/client-dashboard" replace />;
      case "barber":
        return <Navigate to="/barber-dashboard" replace />;
      case "admin":
        return <Navigate to="/admin-dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  console.log(`Accès autorisé pour le rôle: ${userRole}`);
  return <>{children}</>;
};
