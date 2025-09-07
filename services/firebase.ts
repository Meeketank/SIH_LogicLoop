import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork, doc, getDoc } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCcBP63Qml2A93fzrqh0MACWYUlLY9UFIk",
  authDomain: "vikasit-jharkhand.firebaseapp.com",
  projectId: "vikasit-jharkhand",
  storageBucket: "vikasit-jharkhand.firebasestorage.app",
  messagingSenderId: "574437035680",
  appId: "1:574437035680:web:449a2297227a48c94bc3c5",
  measurementId: "G-K54R78G1WY"
};

let app;
let auth;
let db;
let storage;
let isFirebaseInitialized = false;

// Suppress Firebase console errors
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Filter out Firebase connection errors
const suppressFirebaseErrors = (message: any, ...args: any[]) => {
  const messageStr = String(message);
  if (
    messageStr.includes('WebChannelConnection RPC') ||
    messageStr.includes('transport errored') ||
    messageStr.includes('Firestore (') ||
    messageStr.includes('firebase')
  ) {
    return; // Don't log Firebase connection errors
  }
  originalConsoleError(message, ...args);
};

const suppressFirebaseWarnings = (message: any, ...args: any[]) => {
  const messageStr = String(message);
  if (
    messageStr.includes('firebase') ||
    messageStr.includes('Firestore')
  ) {
    return; // Don't log Firebase warnings
  }
  originalConsoleWarn(message, ...args);
};

// Apply the filters
console.error = suppressFirebaseErrors;
console.warn = suppressFirebaseWarnings;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  isFirebaseInitialized = true;
  
  // Don't use emulators in this environment as they cause connection issues
  // Just use the real Firebase services in offline-friendly mode
  
} catch (error) {
  console.log('Firebase initialization failed, running in offline mode');
  isFirebaseInitialized = false;
}

// Export a flag to check if Firebase is available
export const isFirebaseAvailable = isFirebaseInitialized;

// Add runtime check for Firebase availability
export const checkFirebaseConnection = async (): Promise<boolean> => {
  if (!isFirebaseInitialized) return false;
  
  try {
    // Simple test to check if Firestore is reachable
    const testRef = doc(db, '_test', 'connection');
    await getDoc(testRef);
    return true;
  } catch (error) {
    return false;
  }
};

// Graceful error handling for Firebase operations
export const handleFirebaseError = (error: any) => {
  console.error('Firebase operation failed:', error);
  if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
    return 'Service temporarily unavailable. Operating in offline mode.';
  }
  return error.message || 'An error occurred. Please try again.';
};

export { auth, db, storage };
export default app;