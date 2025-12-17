import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  signOut,
  updateProfile
} from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'

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

// Email authentication functions
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  if (displayName) {
    await updateProfile(result.user, { displayName })
  }
  // Create user profile in Firestore
  await setDoc(doc(db, 'users', result.user.uid, 'profile', 'data'), {
    email,
    displayName: displayName || null,
    createdAt: serverTimestamp(),
    emailSignupBonusClaimed: false,
  })
  return result.user
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function linkAnonymousToEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<User> {
  const currentUser = auth.currentUser
  if (!currentUser) {
    throw new Error('No user is currently signed in')
  }
  if (!currentUser.isAnonymous) {
    throw new Error('Current user is not anonymous')
  }

  const credential = EmailAuthProvider.credential(email, password)
  const result = await linkWithCredential(currentUser, credential)

  if (displayName) {
    await updateProfile(result.user, { displayName })
  }

  // Create user profile in Firestore
  await setDoc(doc(db, 'users', result.user.uid, 'profile', 'data'), {
    email,
    displayName: displayName || null,
    linkedAt: serverTimestamp(),
    emailSignupBonusClaimed: false,
  })

  return result.user
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

export async function logOut(): Promise<void> {
  await signOut(auth)
}

export async function getCurrentUser(): Promise<User | null> {
  return auth.currentUser
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}

// Subscribe to daily reminders
export async function subscribeToReminders(
  userId: string,
  email: string,
  displayName: string | null,
  enabled: boolean
): Promise<void> {
  await setDoc(doc(db, 'email_subscribers', userId), {
    email,
    displayName,
    enabled,
    updatedAt: serverTimestamp(),
  })
}

// Get user profile
export async function getUserProfile(userId: string): Promise<Record<string, unknown> | null> {
  const docRef = doc(db, 'users', userId, 'profile', 'data')
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? docSnap.data() : null
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  data: Record<string, unknown>
): Promise<void> {
  await setDoc(doc(db, 'users', userId, 'profile', 'data'), data, { merge: true })
}

export { app, auth, db }
