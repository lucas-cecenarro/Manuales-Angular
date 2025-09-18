import { initializeApp } from "firebase/app";

export const firebaseConfig = {
  apiKey: "AIzaSyD4F5Y6wWnAHKy7W1BhFZ0uqk1r2fSzbOc",
  authDomain: "pagina-todotecno.firebaseapp.com",
  databaseURL: "https://pagina-todotecno-default-rtdb.firebaseio.com",
  projectId: "pagina-todotecno",
  storageBucket: "pagina-todotecno.firebasestorage.app",
  messagingSenderId: "895627521617",
  appId: "1:895627521617:web:5531f935c5b041dd56d270",
  measurementId: "G-11F6VDB35X"
};

const app = initializeApp(firebaseConfig);
