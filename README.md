# 🚀 Firebase Social Productivity Platform

A modern full-stack social productivity web application built using React.js and Firebase.

This project combines:

* 🔐 Firebase Authentication
* 📝 Notes Management
* 💬 Real-time Community Chat
* 👥 User System
* 🌙 Modern Dark UI
* ⚡ Firebase Firestore Realtime Database

---

# 📸 Project Overview

This platform is designed as a modern productivity + social application inspired by:

* Discord
* WhatsApp
* Notion
* Modern SaaS dashboards

Users can:

* Create accounts
* Login securely
* Create and manage notes
* Connect with community users
* Chat in real-time
* Build productivity workflows

---

# ✨ Features Implemented

## 🔐 Authentication

* Firebase Email/Password Signup
* Firebase Login System
* Persistent Authentication
* Logout Functionality
* Protected User Access

---

## 👤 User System

* Unique usernames
* User profiles
* Online/Offline status
* Community users list

---

## 📝 Notes System

* Add notes
* Delete notes
* Store notes in Firebase Firestore
* Real-time note updates
* Persistent cloud storage

---

## 💬 Community & Chat

* Community users section
* Real-time one-to-one chat
* User search
* Modern messaging UI
* Firebase realtime listeners

---

## 🎨 UI/UX

* Responsive Design
* Modern Layout
* Dark Theme
* Glassmorphism UI
* Smooth Animations
* Mobile Friendly

---

# 🛠️ Tech Stack

## Frontend

* React.js
* React Router DOM
* Tailwind CSS
* Framer Motion

## Backend & Database

* Firebase Authentication
* Firebase Firestore
* Firebase Storage

## Deployment

* Firebase Hosting
* GitHub

---

# 📂 Folder Structure

```bash
src
 ┣ components
 ┃ ┣ Login.jsx
 ┃ ┣ Signup.jsx
 ┃ ┣ Notes.jsx
 ┃ ┣ Community.jsx
 ┃ ┣ Chat.jsx
 ┣ context
 ┃ ┣ AuthContext.jsx
 ┣ firebase.js
 ┣ App.jsx
 ┣ main.jsx
 ┣ index.css
```

---

# ⚙️ Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone (https://github.com/navee-d18/firebase-social-app.git)
```

---

## 2️⃣ Open Project

```bash
cd firebase-social-app
```

---

## 3️⃣ Install Dependencies

```bash
npm install
```

---

# 🔥 Firebase Setup

## Step 1 — Create Firebase Project

Open Firebase Console:

[https://console.firebase.google.com/](https://console.firebase.google.com/)

Create a new Firebase project.

---

## Step 2 — Enable Authentication

Enable:

* Email/Password Authentication
* Google Authentication

---

## Step 3 — Enable Firestore Database

Create Firestore Database in test mode.

---

## Step 4 — Create `.env` File

Create:

```bash
.env
```

Add:

```env
VITE_API_KEY=YOUR_API_KEY
VITE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
VITE_PROJECT_ID=YOUR_PROJECT_ID
VITE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
VITE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
VITE_APP_ID=YOUR_APP_ID
```

---

# 🔐 Firebase Security

## `.gitignore`

Ensure:

```bash
.env
```

is included inside `.gitignore`.

This prevents secret keys from being uploaded to GitHub.

---

# 🔥 Firebase Configuration

## `src/firebase.js`

```js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
```

---

# 🚀 Run Project

```bash
npm run dev
```

Open:

```bash
http://localhost:5173
```

---

# 📦 GitHub Upload

```bash
git init
git add .
git commit -m "Initial Commit"
git branch -M main
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

---

# 📈 Future Improvements

## 🔥 Planned Features

* AI Chatbot
* AI Notes Summary
* Voice Messages
* Video Uploads
* Group Chats
* Notifications System
* Followers/Following
* Admin Dashboard
* Kanban Board
* Pomodoro Timer
* XP & Achievement System
* Real-time Online Status
* File Sharing
* Markdown Notes
* Mobile App Version

---

# 🌍 Deployment

You can deploy this project using:

* Firebase Hosting
* Vercel
* Netlify

---

# 🤝 Contribution

Contributions are welcome.

Fork the repository and create a pull request.

---

# 📄 License

This project is open-source and available under the MIT License.

---

# 👨‍💻 Developer

Developed by Mohammed Naveed using React.js and Firebase.

---

# ⭐ Support

If you like this project:

* Star the repository ⭐
* Fork the project 🍴
* Share with others 🚀

---

# 🔥 Final Vision

The goal of this platform is to create a modern real-time productivity and social collaboration app using Firebase and React.js.

This project is continuously evolving with new features and improvements.
