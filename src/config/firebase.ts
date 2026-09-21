import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  Auth,
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { Platform } from "react-native";

// Configuração oficial do Firebase da aplicação Web
// As chaves são injetadas de forma segura via variáveis de ambiente (.env)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Inicialização Singleton do Firebase App
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inicialização segura de Autenticação para Web e Mobile
let auth: Auth;
try {
  if (Platform.OS === "web") {
    auth = getAuth(app);
  } else {
    try {
      // Lazy require de persistência nativa caso venha a rodar em iOS/Android
      // @ts-ignore
      const { getReactNativePersistence } = require("firebase/auth");
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      auth = getAuth(app);
    }
  }
} catch {
  auth = getAuth(app);
}

// Firestore Database Singleton
const db: Firestore = getFirestore(app);

// Inicialização segura do Firebase Analytics (apenas em navegadores suportados)
let analytics: Analytics | null = null;
if (typeof window !== "undefined" && Platform.OS === "web") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Ignora erro em navegadores que bloqueiam rastreamento/IndexedDB
    });
}

export { app, auth, db, analytics, firebaseConfig };
