# todozz
Voici un plan structuré pour le projet Todozz, une app de gestion de tâches avec Next.js App Router, TypeScript, Firebase Firestore, sans Tailwind, et une UX épurée et moderne.


---

Nom du projet : Todozz


---

Arborescence du projet


 app/
   ├── layout.tsx
   ├── globals.css
   ├── page.tsx
   ├── todo/
   │   ├── [id]/
   │   │   └── page.tsx
   │   ├── new/
   │   │   └── page.tsx
   ├── api/
   │   └── todo/
   │       ├── route.ts
   │       └── [id]/
   │           └── route.ts
components/
  ├── TodoForm.tsx
  ├── TodoItem.tsx
  ├── ChecklistItem.tsx
  ├── CategorySelector.tsx
lib/
  └── firebase.ts
 types/
  └── index.ts

package.json
tsconfig.json


---

Détail des fonctionnalités principales

Firestore

Une seule collection todos

Champs :

title: string

description: string

category: string

subCategory: string

assignee: 'Alice' | 'Bob' | 'Charlie' (enum)

checklist: { text: string; checked: boolean }[]

createdAt, updatedAt timestamps



Pages

/ : Liste des todos, filtrage par catégorie

/todo/new : Création d'une tâche

/todo/[id] : Vue + édition d’une tâche


Composants

Formulaire réutilisable TodoForm

Checkbox checklist avec texte barré si checked

Sélecteur de catégorie et sous-catégorie

Items listés par utilisateur ou catégorie


API Routes

POST /api/todo : Créer une tâche

GET /api/todo : Lister tous les todos

GET /api/todo/[id] : Récupérer une tâche

PUT /api/todo/[id] : Mettre à jour une tâche

DELETE /api/todo/[id] : Supprimer une tâche




---

Prompt pour générer le code (à utiliser avec une IA de génération)

Génère une app Next.js (App Router) en TypeScript avec les spécifications suivantes :

- Nom du projet : Todozz
- Base de données : Firebase Firestore
  - Une seule collection : "todos"
  - Champs :
    - title: string
    - description: string
    - category: string
    - subCategory: string
    - assignee: enum ('Alice', 'Bob', 'Charlie')
    - checklist: array of { text: string, checked: boolean }
    - timestamps
- Fonctionnalités :
  - CRUD complet via API Routes (route.ts et [id]/route.ts)
  - Pages :
    - `/` : liste des todos avec filtre par catégorie
    - `/todo/new` : page de création
    - `/todo/[id]` : édition/vue
- Composants :
  - `TodoForm` : formulaire de création/édition
  - `ChecklistItem` : item avec checkbox (texte barré si coché)
  - `CategorySelector` : champ de sélection + ajout catégorie/sous-catégorie
- Firebase SDK initialisé dans `lib/firebase.ts`
- CSS global dans `globals.css`, sans Tailwind, avec style épuré, espacement cohérent, font lisible, layout responsive.
- Bonne séparation du code, types dans `types/index.ts`

Fournis un fichier par composant ou route comme défini dans le tree. Écris un code propre et idiomatique, commenté si utile, et avec une UX moderne et intuitive.


---


