import type { Request, Response } from "express";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  where,
} from "firebase/firestore";

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0427980254",
  appId: process.env.FIREBASE_APP_ID || "1:152029939526:web:a6d4c4658e394e01ef0747",
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAo76nYx5Cyo1mDO98C2Ea049QaM7z78c0",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "gen-lang-client-0427980254.firebaseapp.com",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "gen-lang-client-0427980254.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "152029939526",
};

const databaseId =
  process.env.FIRESTORE_DATABASE_ID ||
  "ai-studio-aaa6872e-3a96-41dc-aa58-820fbf9d86a3";

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, databaseId);

export default async function handler(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const raw = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    const idOrToken = decodeURIComponent(String(raw || "")).trim();

    if (!idOrToken) {
      return res.status(400).json({ error: "Identificador do paciente não informado." });
    }

    // Primeiro procura pelo ID real do documento.
    const directSnapshot = await getDoc(doc(db, "clientes", idOrToken));
    if (directSnapshot.exists()) {
      const data = directSnapshot.data();
      return res.status(200).json({ ...data, id: data.id || directSnapshot.id });
    }

    // Compatibilidade com links antigos que usam tokenAcesso.
    const tokenSnapshot = await getDocs(
      query(
        collection(db, "clientes"),
        where("tokenAcesso", "==", idOrToken),
        limit(1),
      ),
    );

    if (!tokenSnapshot.empty) {
      const found = tokenSnapshot.docs[0];
      const data = found.data();
      return res.status(200).json({ ...data, id: data.id || found.id });
    }

    return res.status(404).json({
      error: "Paciente não localizado. Gere um novo link no painel profissional.",
      identificadorRecebido: idOrToken,
    });
  } catch (error: any) {
    console.error("GET /api/clientes/[id] falhou:", error);
    return res.status(500).json({
      error: "Falha ao consultar o paciente no Firestore.",
      detalhe: error?.message || String(error),
    });
  }
}
