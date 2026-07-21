import type { Request, Response } from "express";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  collection,
  deleteDoc,
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

function readIdentifier(req: Request): string {
  const raw = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  return decodeURIComponent(String(raw || "")).trim();
}

async function findPatientDocument(idOrToken: string) {
  const directRef = doc(db, "clientes", idOrToken);
  const directSnapshot = await getDoc(directRef);

  if (directSnapshot.exists()) {
    return { ref: directRef, snapshot: directSnapshot };
  }

  const tokenSnapshot = await getDocs(
    query(
      collection(db, "clientes"),
      where("tokenAcesso", "==", idOrToken),
      limit(1),
    ),
  );

  if (tokenSnapshot.empty) return null;

  const snapshot = tokenSnapshot.docs[0];
  return { ref: snapshot.ref, snapshot };
}

export default async function handler(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  if (req.method !== "GET" && req.method !== "DELETE") {
    res.setHeader("Allow", "GET, DELETE");
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const idOrToken = readIdentifier(req);

    if (!idOrToken) {
      return res.status(400).json({ error: "Identificador do paciente não informado." });
    }

    const patientDocument = await findPatientDocument(idOrToken);

    if (!patientDocument) {
      return res.status(404).json({
        error: "Paciente não localizado.",
        identificadorRecebido: idOrToken,
      });
    }

    if (req.method === "DELETE") {
      const deletedId = patientDocument.snapshot.id;
      await deleteDoc(patientDocument.ref);

      // Confirma que o documento realmente foi removido.
      const confirmation = await getDoc(patientDocument.ref);
      if (confirmation.exists()) {
        return res.status(500).json({
          error: "O Firestore não confirmou a exclusão do paciente.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Paciente excluído com sucesso.",
        id: deletedId,
      });
    }

    const data = patientDocument.snapshot.data();
    return res.status(200).json({
      ...data,
      id: data.id || patientDocument.snapshot.id,
    });
  } catch (error: any) {
    console.error(`${req.method} /api/clientes/[id] falhou:`, error);
    return res.status(500).json({
      error:
        req.method === "DELETE"
          ? "Falha ao excluir o paciente no Firestore."
          : "Falha ao consultar o paciente no Firestore.",
      detalhe: error?.message || String(error),
    });
  }
}
