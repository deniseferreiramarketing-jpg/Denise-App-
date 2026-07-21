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
  setDoc,
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

function getRouteId(req: Request): string {
  const raw = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  return decodeURIComponent(String(raw || "")).trim();
}

async function locatePatient(idOrToken: string) {
  const directRef = doc(db, "clientes", idOrToken);
  const directSnapshot = await getDoc(directRef);

  if (directSnapshot.exists()) {
    return {
      documentId: directSnapshot.id,
      data: directSnapshot.data() as Record<string, any>,
    };
  }

  const tokenSnapshot = await getDocs(
    query(
      collection(db, "clientes"),
      where("tokenAcesso", "==", idOrToken),
      limit(1),
    ),
  );

  if (tokenSnapshot.empty) return null;

  const found = tokenSnapshot.docs[0];
  return {
    documentId: found.id,
    data: found.data() as Record<string, any>,
  };
}

export default async function handler(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  if (req.method !== "PUT") {
    res.setHeader("Allow", "PUT");
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const idOrToken = getRouteId(req);
    if (!idOrToken) {
      return res.status(400).json({ error: "Identificador do paciente não informado." });
    }

    const currentPatient = await locatePatient(idOrToken);
    if (!currentPatient) {
      return res.status(404).json({ error: "Paciente não localizado." });
    }

    const body = req.body || {};
    const avaliacaoTecnica = body.avaliacaoTecnica || {};
    const assinaturaProfissional = body.assinaturaProfissional;
    const current = currentPatient.data;

    const updated = {
      ...current,
      id: current.id || currentPatient.documentId,
      avaliacaoTecnica: {
        ...(current.avaliacaoTecnica || {}),
        ...avaliacaoTecnica,
      },
      assinaturaProfissional:
        assinaturaProfissional || current.assinaturaProfissional || "",
      assinaturaProfissionalData: assinaturaProfissional
        ? new Date().toISOString()
        : current.assinaturaProfissionalData || "",
      status: "concluido",
      updatedAt: new Date().toISOString(),
    };

    await setDoc(
      doc(db, "clientes", currentPatient.documentId),
      updated,
      { merge: true },
    );

    const confirmation = await getDoc(
      doc(db, "clientes", currentPatient.documentId),
    );

    if (!confirmation.exists()) {
      throw new Error("O Firestore não confirmou a avaliação técnica.");
    }

    const saved = confirmation.data() as Record<string, any>;
    if (saved.status !== "concluido") {
      throw new Error("A avaliação foi gravada, mas não foi marcada como concluída.");
    }

    return res.status(200).json({
      ...saved,
      id: saved.id || confirmation.id,
    });
  } catch (error: any) {
    console.error("PUT /api/clientes/[id]/avaliacao-tecnica falhou:", error);
    return res.status(500).json({
      error: "Falha ao salvar e concluir a avaliação técnica.",
      detalhe: error?.message || String(error),
    });
  }
}
