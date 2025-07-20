# ShopTheBarber - Plateforme de Réservation de Barbiers

Une application web complète pour la réservation de services de barbier au Maroc, développée avec React, TypeScript, SQLite et Express.

## 🚀 Fonctionnalités

### Pour les Clients
- **Inscription et Connexion** : Système d'authentification sécurisé
- **Recherche de Barbiers** : Filtrage par services, localisation et type de prestation
- **Réservation en Ligne** : Réservation de créneaux avec sélection de services
- **Gestion des RDV** : Consultation, modification et annulation des rendez-vous
- **Système de Favoris** : Ajout et gestion des barbiers favoris
- **Avis et Notes** : Notation et commentaires sur les services
- **Notifications** : Rappels et alertes personnalisées
- **Profil Utilisateur** : Gestion des informations personnelles

### Pour les Barbiers
- **Profil Professionnel** : Présentation des services et tarifs
- **Gestion des Disponibilités** : Planning et créneaux disponibles
- **Offres Spéciales** : Promotions et réductions personnalisées
- **Historique des RDV** : Suivi des réservations et clients

## 🛠️ Technologies Utilisées

### Frontend
- **React 18** avec TypeScript
- **Vite** pour le build et le développement
- **Tailwind CSS** pour le styling
- **Lucide React** pour les icônes
- **React Router** pour la navigation

### Backend
- **Node.js** avec Express
- **SQLite** pour la base de données
- **JWT** pour l'authentification
- **bcryptjs** pour le hachage des mots de passe

### Base de Données
- **SQLite** avec schéma relationnel complet
- **Tables** : Users, Barbers, Services, Appointments, Reviews, Favorites, etc.

## 📦 Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd pixel-verse
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Lancer l'application**
```bash
# Lancer le frontend et le backend en même temps
npm run dev:full

# Ou lancer séparément :
npm run dev          # Frontend (port 8080)
npm run dev:server   # Backend (port 3001)
```

## 🗄️ Base de Données

La base de données SQLite est automatiquement créée et initialisée avec des données de test :

### Données de Test Incluses
- **Utilisateurs** : 5 comptes clients de test
- **Barbiers** : 4 barbiers avec profils complets
- **Services** : 10 services différents (coupe, barbe, soins, etc.)
- **Réservations** : Exemples de RDV passés et à venir
- **Avis** : Commentaires et notes d'exemple

### Structure de la Base
```
users/           # Utilisateurs clients
barbers/         # Profils des barbiers
services/        # Services disponibles
barber_services/ # Services proposés par chaque barbier
appointments/    # Réservations
reviews/         # Avis clients
favorites/       # Barbiers favoris
notifications/   # Notifications système
```

## 🔧 Configuration

### Variables d'Environnement
```env
PORT=3001                    # Port du serveur backend
JWT_SECRET=your-secret-key   # Clé secrète JWT
```

### API Endpoints

#### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

#### Services
- `GET /api/services` - Liste des services

#### Barbiers
- `GET /api/barbers` - Liste des barbiers (avec filtres)
- `GET /api/barbers/:id` - Détails d'un barbier

#### Réservations
- `POST /api/appointments` - Créer une réservation
- `GET /api/appointments` - Mes réservations
- `PUT /api/appointments/:id/cancel` - Annuler une réservation

#### Favoris
- `POST /api/favorites` - Ajouter aux favoris
- `DELETE /api/favorites/:id` - Retirer des favoris
- `GET /api/favorites` - Mes favoris

#### Profil
- `GET /api/profile` - Mon profil
- `PUT /api/profile` - Modifier mon profil

## 🎨 Interface Utilisateur

### Pages Principales
1. **Page d'Accueil** (`/`) - Présentation et recherche
2. **Connexion** (`/login`) - Authentification
3. **Inscription** (`/signup`) - Création de compte
4. **Dashboard Client** (`/dashboard`) - Espace personnel
5. **Blog** (`/blog`) - Articles et conseils

### Design
- **Thème Sombre** : Interface moderne avec fond noir/gris
- **Couleurs** : Orange ambré (#f59e0b) pour les accents
- **Responsive** : Adaptation mobile et desktop
- **Animations** : Transitions fluides et micro-interactions

## 🔐 Sécurité

- **Authentification JWT** : Tokens sécurisés
- **Hachage des Mots de Passe** : bcrypt avec salt
- **Validation des Données** : Vérification côté serveur
- **CORS** : Configuration sécurisée pour les requêtes

## 📱 Utilisation

### Première Utilisation
1. Accéder à `http://localhost:8080`
2. Créer un compte ou se connecter
3. Explorer les barbiers disponibles
4. Effectuer une première réservation

### Fonctionnalités Avancées
- **Filtrage** : Par services, localisation, type de prestation
- **Recherche** : Nom de barbier, salon, spécialités
- **Notifications** : Rappels automatiques des RDV
- **Historique** : Suivi des réservations passées

## 🚀 Déploiement

### Production
```bash
# Build de l'application
npm run build

# Démarrage en production
npm start
```

### Variables d'Environnement de Production
```env
NODE_ENV=production
PORT=3001
JWT_SECRET=your-production-secret
DATABASE_URL=path/to/production.db
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Email : contact@shopthebarber.ma
- Téléphone : +212 6 12 34 56 78

---

**ShopTheBarber** - La plateforme qui connecte les barbiers et clients à travers le Maroc 🇲🇦 