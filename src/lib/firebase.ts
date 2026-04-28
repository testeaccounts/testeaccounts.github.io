import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyC97bRIOIH7H3cNyzqeisaVf0eI-4twJd4',
  authDomain: 'mangas-1a342.firebaseapp.com',
  projectId: 'mangas-1a342',
  storageBucket: 'mangas-1a342.firebasestorage.app',
  messagingSenderId: '579612987424',
  appId: '1:579612987424:web:81c74ec7607d3dd7d0ac45',
}

export const firebaseApp = initializeApp(firebaseConfig)
export const firebaseAuth = getAuth(firebaseApp)
export const firestoreDb = getFirestore(firebaseApp)
