import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'

// A chave de API de um app web do Firebase não é secreta: ela apenas identifica
// o projeto perante o Google. A segurança real vem das regras do Firestore
// (veja firestore.rules), por isso é seguro versionar este arquivo.
const firebaseConfig = {
  apiKey: 'AIzaSyDMxwzZ8FpkAq6GsMKP_lfTmgZkdo-1uuQ',
  authDomain: 'mundo-delas-a2767.firebaseapp.com',
  projectId: 'mundo-delas-a2767',
  storageBucket: 'mundo-delas-a2767.firebasestorage.app',
  messagingSenderId: '654649912976',
  appId: '1:654649912976:web:b479969846a90e27c07215',
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

export const ready = signInAnonymously(auth)
