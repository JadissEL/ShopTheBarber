# ShopTheBarber - Plateforme de Réservation de Barbiers

Une application React full-stack prête pour la production avec serveur Express intégré, utilisant React Router 6 en mode SPA, TypeScript, Vitest, Zod et des outils modernes.

Bien que le starter inclue un serveur Express, créez des endpoints uniquement lorsque c'est strictement nécessaire, par exemple pour encapsuler une logique qui doit rester sur le serveur, comme la gestion des clés privées, ou certaines opérations de base de données, etc.

## Stack Technologique

- **Frontend**: React 18 + React Router 6 (spa) + TypeScript + Vite + TailwindCSS 3
- **Backend**: Serveur Express intégré avec le serveur de développement Vite
- **Tests**: Vitest
- **Interface**: Radix UI + TailwindCSS 3 + Icônes Lucide React

## Structure du Projet

```
client/                   # Frontend React SPA
├── pages/                # Composants de routes (Index.tsx = accueil)
├── components/ui/        # Bibliothèque de composants UI pré-construits
├── App.tsx               # Point d'entrée de l'app et configuration du routage SPA
└── global.css            # Thème TailwindCSS 3 et styles globaux

server/                   # Backend API Express
├── index.ts              # Configuration principale du serveur (config express + routes)
└── routes/               # Gestionnaires d'API

shared/                   # Types utilisés par le client et le serveur
└── api.ts                # Exemple de partage d'interfaces API
```

## Fonctionnalités Principales

## Système de Routage SPA

Le système de routage est alimenté par React Router 6 :

- `client/pages/Index.tsx` représente la page d'accueil.
- Les routes sont définies dans `client/App.tsx` en utilisant l'import `react-router-dom`
- Les fichiers de routes se trouvent dans le répertoire `client/pages/`

Par exemple, les routes peuvent être définies avec :

```typescript
import { BrowserRouter, Routes, Route } from "react-router-dom";

<Routes>
  <Route path="/" element={<Index />} />
  {/* AJOUTEZ TOUTES LES ROUTES PERSONNALISÉES AU-DESSUS DE LA ROUTE GLOBALE "*" */}
  <Route path="*" element={<NotFound />} />
</Routes>;
```

### Système de Style

- **Principal**: Classes utilitaires TailwindCSS 3
- **Thème et tokens de design**: Configurés dans `client/global.css` 
- **Composants UI**: Bibliothèque pré-construite dans `client/components/ui/`
- **Utilitaire**: La fonction `cn()` combine `clsx` + `tailwind-merge` pour les classes conditionnelles

```typescript
// Utilisation de l'utilitaire cn
className={cn(
  "classes-de-base",
  { "classe-conditionnelle": condition },
  props.className  // Surcharges utilisateur
)}
```

### Intégration du Serveur Express

- **Développement**: Port unique (8080) pour le frontend et le backend
- **Rechargement à chaud**: Code client et serveur
- **Points d'API**: Préfixés avec `/api/`

#### Exemples de Routes API
- `GET /api/ping` - API ping simple
- `GET /api/demo` - Point de démonstration  

### Types Partagés
Importez des types cohérents dans le client et le serveur :
```typescript
import { DemoResponse } from '@shared/api';
```

Alias de chemins :
- `@shared/*` - Dossier partagé
- `@/*` - Dossier client

## Commandes de Développement

```bash
npm run dev        # Démarrer le serveur de développement (client + serveur)
npm run build      # Build de production
npm run start      # Démarrer le serveur de production
npm run typecheck  # Validation TypeScript
npm test          # Exécuter les tests Vitest
```

## Ajout de Fonctionnalités

### Ajouter de nouvelles couleurs au thème

Ouvrez `client/global.css` et `tailwind.config.ts` et ajoutez de nouvelles couleurs Tailwind.

### Nouvelle Route API
1. **Optionnel** : Créez une interface partagée dans `shared/api.ts` :
```typescript
export interface MyRouteResponse {
  message: string;
  // Ajoutez d'autres propriétés de réponse ici
}
```

2. Créez un nouveau gestionnaire de route dans `server/routes/my-route.ts` :
```typescript
import { RequestHandler } from "express";
import { MyRouteResponse } from "@shared/api"; // Optionnel : pour la sécurité des types

export const handleMyRoute: RequestHandler = (req, res) => {
  const response: MyRouteResponse = {
    message: 'Bonjour depuis mon endpoint !'
  };
  res.json(response);
};
```

3. Enregistrez la route dans `server/index.ts` :
```typescript
import { handleMyRoute } from "./routes/my-route";

// Ajoutez à la fonction createServer :
app.get("/api/my-endpoint", handleMyRoute);
```

4. Utilisez dans les composants React avec la sécurité des types :
```typescript
import { MyRouteResponse } from '@shared/api'; // Optionnel : pour la sécurité des types

const response = await fetch('/api/my-endpoint');
const data: MyRouteResponse = await response.json();
```

### Nouvelle Route de Page
1. Créez un composant dans `client/pages/MyPage.tsx`
2. Ajoutez la route dans `client/App.tsx` :
```typescript
<Route path="/my-page" element={<MyPage />} />
```

## Déploiement en Production

- **Standard** : `npm run build` + `npm start`
- **Docker** : Dockerfile inclus
- **Binaire** : Exécutables autonomes (Linux, macOS, Windows)
- Express sert le SPA React construit avec support de routage de secours

## Notes d'Architecture

- Développement à port unique avec intégration Vite + Express
- TypeScript partout (client, serveur, partagé)
- Rechargement à chaud complet pour un développement rapide
- Prêt pour la production avec plusieurs options de déploiement
- Bibliothèque de composants UI complète incluse
- Communication API type-safe via interfaces partagées
