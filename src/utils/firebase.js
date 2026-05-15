import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCscKWuvvL4OgEvZ9w5-WwbX6nPzNMgXWU",
  authDomain: "react-2-80683.firebaseapp.com",
  projectId: "react-2-80683",
  storageBucket: "react-2-80683.firebasestorage.app",
  messagingSenderId: "897335795044",
  appId: "1:897335795044:web:b84941c74b7487a58b2e71",
  measurementId: "G-69GE65SEE7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
