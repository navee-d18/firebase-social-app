# Advanced AI Social Productivity Platform
## Architecture & Setup Guide

This document outlines the foundation for a premium full-stack React + Firebase application with advanced AI features, real-time community tools, and futuristic glassmorphism UI.

### 1. Technology Stack
- **Frontend**: React 19, React Router v7, Vite
- **Styling**: Tailwind CSS v3/v4, Framer Motion (3D/animations), Lucide React
- **Backend**: Firebase v9/v10 (Auth, Firestore, Storage)
- **State Management**: React Context API
- **AI Integration**: OpenAI/Gemini API (to be connected via Cloud Functions or Serverless proxy)

---

### 2. Firestore Database Architecture

To support real-time chat, productivity tools, and gamification, set up your Firestore Database with the following collections:

#### `users`
- `uid` (string)
- `username` (string, unique)
- `email` (string)
- `photoURL` (string)
- `bio` (string)
- `followers` (array of uids)
- `following` (array of uids)
- `xp` (number)
- `level` (number)
- `isOnline` (boolean)
- `lastActive` (timestamp)
- `createdAt` (timestamp)

#### `chats` (For 1-on-1 and Group DMs)
- `id` (string)
- `type` (string: "direct" | "group")
- `participants` (array of uids)
- `recentMessage` (object)
  - `text` (string)
  - `senderId` (string)
  - `timestamp` (timestamp)
- `updatedAt` (timestamp)

#### `messages` (Subcollection under `chats`)
- `id` (string)
- `text` (string)
- `senderId` (string)
- `timestamp` (timestamp)
- `isSeen` (boolean)
- `mediaUrl` (string, optional)

#### `notes` (Productivity)
- `id` (string)
- `userId` (string)
- `title` (string)
- `content` (string)
- `isPinned` (boolean)
- `isArchived` (boolean)
- `tags` (array of strings)
- `updatedAt` (timestamp)

#### `communities` (Discord-style servers)
- `id` (string)
- `name` (string)
- `description` (string)
- `bannerUrl` (string)
- `members` (array of uids)
- `adminId` (string)
- `channels` (array of objects: { id, name, type })

---

### 3. Firebase Security Rules
To secure the platform, apply these Firestore rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function
    function isSignedIn() {
      return request.auth != null;
    }

    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if request.auth.uid == userId;
    }
    
    match /notes/{noteId} {
      allow read, write: if request.auth.uid == resource.data.userId || request.auth.uid == request.resource.data.userId;
    }
    
    match /chats/{chatId} {
      allow read, write: if request.auth.uid in resource.data.participants || request.auth.uid in request.resource.data.participants;
    }
  }
}
```

---

### 4. Implementation Roadmap

Building this massive platform requires a modular approach:

**Phase 1: Core Foundation (In Progress)**
- [x] Vite + React setup
- [x] Tailwind CSS + Glassmorphism UI variables
- [x] Firebase Config + `.env` security
- [x] App Router & Layout Shell

**Phase 2: Advanced Authentication**
- [ ] AuthContext with `onAuthStateChanged`
- [ ] User Profile creation in Firestore
- [ ] Unique username validation

**Phase 3: Real-Time Communication (WhatsApp/Discord Style)**
- [ ] Chat Context with `onSnapshot` listeners
- [ ] Direct Messaging UI
- [ ] Community Channels UI

**Phase 4: Productivity & AI Features**
- [ ] Markdown Notes Editor
- [ ] AI Chatbot component
- [ ] AI Summarizer integration
- [ ] Kanban Board

---

### 5. Next Steps
The platform architecture is huge. We will proceed module by module. I have provided the foundational Dashboard and Layout updates below. We can tackle the **AI Chatbot Component** or the **Real-Time Firebase Chat** next.
