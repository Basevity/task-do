# Task Do

A simple todo app with **Firebase (Firestore)** and **sprint** support. Tasks live in a **Backlog** or in a **Sprint**; switch between them with one click.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Firebase**

   - Create a project in [Firebase Console](https://console.firebase.google.com).
   - Enable **Firestore Database** (Create database → Start in test mode for local dev).
   - Enable **Authentication** → Sign-in method → **Email/Password** (enable and save).
   - In Project settings → General, copy your web app config.
   - Copy `.env.example` to `.env.local` and set:

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

   When you first filter tasks by sprint, Firestore may ask you to create a **composite index**. Use the link in the browser console to create it (sprintId + createdAt).

   **Assignment (other users):** So that you can assign tasks to any team member, Firestore must allow authenticated users to read the `users` collection. Deploy the included rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
   (If you don’t use Firebase CLI yet: Firebase Console → Firestore → Rules, then paste the contents of `firestore.rules` and publish.)  
   Other users will appear in the “Assign to” list after they have signed in at least once.

3. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Features

- **Auth** – Sign in / sign up with email and password. Profile: change display name, change password; avatar is the first letter of your name.
- **Backlog & sprints** – Sprints listed oldest first in the sidebar. Optional time frame (start/end dates) per sprint and per task.
- **Sidebar** – Collapsible (toggle with ← / →). Add sprint with optional dates.
- **Kanban** – Tasks in columns (Backlog, Todo, In Progress, In Review, Done). Drag and drop; horizontal scroll with scrollbar hidden.
- **Assignment** – Assign tasks to users (list comes from signed-in users in the `users` collection).
- **Import** – CSV with Sprint, Module, Task, Role, Priority, Notes.

Create a Firestore **composite index** for `users` on `createdAt` if prompted when loading the app.
