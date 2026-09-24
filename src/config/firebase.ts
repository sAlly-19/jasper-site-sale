import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  Auth,
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { Platform } from "react-native";

// A configuração web é pública por definição; somente credenciais administrativas são secretas.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredFirebaseConfig = {
  EXPO_PUBLIC_FIREBASE_API_KEY: firebaseConfig.apiKey,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  EXPO_PUBLIC_FIREBASE_APP_ID: firebaseConfig.appId,
};
const missingFirebaseConfig = Object.entries(requiredFirebaseConfig)
  .filter(([, value]) => !value)
  .map(([name]) => name);
if (missingFirebaseConfig.length > 0) {
  throw new Error(`Configuração Firebase incompleta: ${missingFirebaseConfig.join(', ')}`);
}

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
if (typeof window !== "undefined" && Platform.OS === "web" && firebaseConfig.measurementId) {
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
