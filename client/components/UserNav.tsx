import React from 'react';
import { Button } from './ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { User, Settings, Scissors, Sparkles, Bell, Search, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from "./ui/button";
import { Input } from "./ui/input";

// Fonction pour décoder le token JWT
const decodeToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erreur lors du décodage du token:', error);
    return null;
  }
};

// Fonction pour obtenir l'icône selon le rôle
const getRoleIcon = (role: string) => {
  switch (role) {
    case 'client':
      return <User className="h-4 w-4" />;
    case 'barber':
      return <Scissors className="h-4 w-4" />;
    case 'admin':
      return <Settings className="h-4 w-4" />;
    default:
      return <User className="h-4 w-4" />;
  }
};

// Fonction pour obtenir le nom du rôle en français
const getRoleName = (role: string) => {
  switch (role) {
    case 'client':
      return 'Client Premium';
    case 'barber':
      return 'Barbier Expert';
    case 'admin':
      return 'Administrateur';
    default:
      return 'Utilisateur';
  }
};

// Fonction pour obtenir la couleur selon le rôle
const getRoleColor = (role: string) => {
  switch (role) {
    case 'client':
      return 'bg-gradient-to-br from-blue-500 to-blue-600';
    case 'barber':
      return 'bg-gradient-to-br from-amber-500 to-amber-600';
    case 'admin':
      return 'bg-gradient-to-br from-red-500 to-red-600';
    default:
      return 'bg-gradient-to-br from-gray-500 to-gray-600';
  }
};

// Fonction pour obtenir la couleur de bordure selon le rôle
const getRoleBorderColor = (role: string) => {
  switch (role) {
    case 'client':
      return 'border-blue-400/30';
    case 'barber':
      return 'border-amber-400/30';
    case 'admin':
      return 'border-red-400/30';
    default:
      return 'border-gray-400/30';
  }
};

export const UserNav: React.FC = () => {
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Ajout d'un effet pour capturer les erreurs non catchées
  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setGlobalError(event.message || 'Erreur inconnue');
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  // Ajout d'un log pour vérifier le render
  console.log('Rendering UserNav component...');
  
  try {
    if (globalError) {
      return (
        <div style={{ color: 'red', background: '#222', padding: 8, fontSize: 12 }}>
          <b>Erreur dans la navigation :</b>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{globalError}</pre>
        </div>
      );
    }

    if (!token) {
      return (
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/login')}
            className="moroccan-button-ghost"
          >
            Se connecter
          </Button>
          <Button 
            size="sm" 
            onClick={() => navigate('/signup')}
            className="moroccan-button-gold"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            S'inscrire
          </Button>
        </div>
      );
    }

    const decodedToken = decodeToken(token);
    
    if (!decodedToken) {
      // Token invalide, nettoyer et rediriger
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      return (
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/login')}
            className="moroccan-button-ghost"
          >
            Se connecter
          </Button>
          <Button 
            size="sm" 
            onClick={() => navigate('/signup')}
            className="moroccan-button-gold"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            S'inscrire
          </Button>
        </div>
      );
    }

    const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      navigate('/');
    };

    const handleProfile = () => {
      switch (decodedToken.role) {
        case 'client':
          navigate('/client-dashboard');
          break;
        case 'barber':
          navigate('/barber-dashboard');
          break;
        case 'admin':
          navigate('/admin-dashboard');
          break;
        default:
          navigate('/');
      }
    };

    const handleSettings = () => {
      switch (decodedToken.role) {
        case 'client':
          navigate('/client-settings');
          break;
        case 'barber':
          navigate('/barber-settings');
          break;
        case 'admin':
          navigate('/admin-settings');
          break;
        default:
          navigate('/');
      }
    };

    return (
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5 text-moroccan-gold" />
        </Button>
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Profil utilisateur">
              <Avatar className="h-8 w-8">
                <AvatarFallback className={`${getRoleColor(decodedToken.role)} text-white text-sm font-medium border-2 ${getRoleBorderColor(decodedToken.role)}`}>
                  {decodedToken.first_name?.[0]?.toUpperCase() || decodedToken.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {decodedToken.first_name} {decodedToken.last_name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {decodedToken.email}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  {getRoleIcon(decodedToken.role)}
                  <span className="text-xs text-moroccan-gold font-medium">
                    {getRoleName(decodedToken.role)}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfile}>
              <User className="mr-2 h-4 w-4" />
              <span>Mon Profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSettings}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Paramètres</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <ArrowRight className="mr-2 h-4 w-4" />
              <span>Se déconnecter</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  } catch (err: any) {
    setGlobalError(err?.message || String(err));
    return (
      <div style={{ color: 'red', background: '#222', padding: 8, fontSize: 12 }}>
        <b>Erreur dans la navigation (render) :</b>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{err?.message || String(err)}</pre>
      </div>
    );
  }
}; 