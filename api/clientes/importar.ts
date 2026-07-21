import type { Request, Response } from "express";
import { initializeApp, getApp, getApps } from "firebase/app";
import { doc, getFirestore, setDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0427980254",
  appId: process.env.FIREBASE_APP_ID || "1:152029939526:web:a6d4c4658e394e01ef0747",
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAo76nYx5Cyo1mDO98C2Ea049QaM7z78c0",
  authDomain:
    process.env.FIREBASE_AUTH_DOMAIN ||
    "gen-lang-client-0427980254.firebaseapp.com",
  storageBucket:
    process.env.FIREBASE_STORAGE_BUCKET ||
    "gen-lang-client-0427980254.firebasestorage.app",
  messagingSenderId:
    process.env.FIREBASE_MESSAGING_SENDER_ID || "152029939526",
};

const databaseId =
  process.env.FIRESTORE_DATABASE_ID ||
  "ai-studio-aaa6872e-3a96-41dc-aa58-820fbf9d86a3";

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, databaseId);

function parseBody(body: unknown): unknown {
  if (typeof body !== "string") return body;
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function removeUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(removeUndefined);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, removeUndefined(item)]),
    );
  }

  return value;
}

export default async function handler(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const body = parseBody(req.body);

    if (!Array.isArray(body)) {
      return res.status(400).json({
        error: "O backup é inválido. O arquivo precisa conter uma lista de pacientes.",
      });
    }

    if (body.length === 0) {
      return res.status(400).json({ error: "O arquivo de backup está vazio." });
    }

    let imported = 0;
    let ignored = 0;
    const failures: Array<{ index: number; id?: string; error: string }> = [];

    for (let index = 0; index < body.length; index += 1) {
      const raw = body[index];

      if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        ignored += 1;
        continue;
      }

      const patient = removeUndefined(raw) as Record<string, unknown>;
      const id = String(patient.id || "").trim();

      if (!id) {
        ignored += 1;
        continue;
      }

      try {
        await setDoc(
          doc(db, "clientes", id),
          {
            ...patient,
            id,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
        imported += 1;
      } catch (error: any) {
        failures.push({
          index,
          id,
          error: error?.message || String(error),
        });
      }
    }

    if (failures.length > 0) {
      return res.status(500).json({
        error: `A importação foi parcial: ${imported} paciente(s) salvo(s) e ${failures.length} com falha.`,
        imported,
        ignored,
        failures: failures.slice(0, 10),
      });
    }

    return res.status(200).json({
      success: true,
      count: imported,
      ignored,
      message: `${imported} paciente(s) importado(s) com sucesso.`,
    });
  } catch (error: any) {
    console.error("POST /api/clientes/importar falhou:", error);
    return res.status(500).json({
      error: "Falha ao importar o backup no Firestore.",
      detalhe: error?.message || String(error),
    });
  }
}
