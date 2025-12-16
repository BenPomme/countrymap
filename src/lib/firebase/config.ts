import { initializeApp, getApps } from 'firebase/app'
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyATKR_CgZopNx44uXa7WELA_IQIoEHDmjM",
  authDomain: "worldtruth-f9789.firebaseapp.com",
  projectId: "worldtruth-f9789",
  storageBucket: "worldtruth-f9789.firebasestorage.app",
  messagingSenderId: "653141420908",
  appId: "1:653141420908:web:6a7c2b6cc9e8fde0dc6149",
  measurementId: "G-RE016LJZP0"
}

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)
const db = getFirestore(app)

// Anonymous auth helper
export async function ensureAnonymousAuth(): Promise<User> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe()
      if (user) {
        resolve(user)
      } else {
        try {
          const result = await signInAnonymously(auth)
          resolve(result.user)
        } catch (error) {
          reject(error)
        }
      }
    })
  })
}

export { app, auth, db }
