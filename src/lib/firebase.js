import { initializeApp } from 'firebase/app'
import {
  browserLocalPersistence,
  GoogleAuthProvider,
  indexedDBLocalPersistence,
  initializeAuth,
} from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Si no hay datos de Firebase, la app arranca en "modo local" (localStorage).
export const firebaseActivo = Boolean(config.apiKey && config.projectId)

let auth = null
let db = null
let googleProvider = null

if (firebaseActivo) {
  const app = initializeApp(config)
  // initializeAuth (en vez de getAuth) evita cargar al arrancar la ventanita
  // invisible del login, que en iPhone demora muchísimo la apertura.
  auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  })
  googleProvider = new GoogleAuthProvider()
  googleProvider.setCustomParameters({ prompt: 'select_account' })
  // Caché persistente: se puede cargar sin señal y sincroniza al volver internet.
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  })
}

export { auth, db, googleProvider }
