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
  const directSnapshot = await getDoc(doc(db, "clientes", idOrToken));
  if (directSnapshot.exists()) {
    return { documentId: directSnapshot.id, data: directSnapshot.data() as Record<string, any> };
  }

  const tokenSnapshot = await getDocs(
    query(collection(db, "clientes"), where("tokenAcesso", "==", idOrToken), limit(1)),
  );
  if (tokenSnapshot.empty) return null;

  const found = tokenSnapshot.docs[0];
  return { documentId: found.id, data: found.data() as Record<string, any> };
}

function buildPrompt(patient: Record<string, any>, resumoManual: string): string {
  const tech = patient.avaliacaoTecnica || {};
  const yesNo = (value: unknown) => (value ? "Sim" : "Não");
  const list = (items: Array<string | false | undefined>) =>
    items.filter(Boolean).join(", ") || "Nenhuma alteração assinalada";

  return `Você apoia a documentação clínica da Clínica DF Saúde Integrada. Gere orientações pós-atendimento prudentes, objetivas e acolhedoras. Não diagnostique, não prescreva medicamentos e recomende avaliação profissional diante de sinais de alerta.

PACIENTE
Nome: ${patient.identificacao?.nomeCompleto || "Paciente"}
Queixa: ${patient.queixaPrincipal || "Não informada"}
Diabetes: ${yesNo(patient.historicoSaude?.diabetes)}
Hipertensão: ${yesNo(patient.historicoSaude?.hipertensao)}
Problemas circulatórios/varizes: ${yesNo(patient.historicoSaude?.circulacao)}
Alergias: ${patient.medicamentosAlergias?.quaisAlergias || "Nenhuma relatada"}

AVALIAÇÃO TÉCNICA
Unhas: ${list([
    tech.unhasEspessadas && "espessadas",
    tech.unhasMicose && "suspeita/registro de micose",
    tech.unhasDescolamento && "descolamento",
    tech.unhasEncravada && "encravada",
  ])}
Pele: ${list([
    tech.peleRessecada && "ressecada",
    tech.peleFissuras && "fissuras",
    tech.peleCalosidade && "calosidades",
    tech.peleHiperqueratose && "hiperqueratose",
    tech.peleVerruga && "verruga registrada",
  ])}
Observações gerais: ${tech.observacoesGerais || "Sem observações"}
Resumo da profissional: ${resumoManual || "Sem resumo adicional"}

Responda SOMENTE com JSON válido, sem crases e sem texto externo, neste formato:
{"resumoProcedimento":"...","orientacoesHomeCare":"...","dataRetornoRecomendada":"...","lembreteMensagemCustom":"..."}`;
}

function extractJson(text: string): Record<string, string> {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("A IA não retornou JSON válido.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export default async function handler(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const idOrToken = getRouteId(req);
    if (!idOrToken) return res.status(400).json({ error: "Paciente não informado." });

    const located = await locatePatient(idOrToken);
    if (!located) return res.status(404).json({ error: "Paciente não encontrado." });

    const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return res.status(500).json({ error: "A variável GEMINI_API_KEY não está configurada na Vercel." });
    }

    const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35_000);

    let geminiResponse: globalThis.Response;
    try {
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: buildPrompt(located.data, String(req.body?.resumoManual || "").trim()) }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.25,
              maxOutputTokens: 1200,
            },
          }),
          signal: controller.signal,
        },
      );
    } finally {
      clearTimeout(timeout);
    }

    const raw = await geminiResponse.text();
    if (!geminiResponse.ok) {
      let detail = raw;
      try {
        const parsed = JSON.parse(raw);
        detail = parsed?.error?.message || parsed?.error || raw;
      } catch {}
      return res.status(geminiResponse.status).json({
        error: "O Gemini não conseguiu gerar o plano.",
        detalhe: String(detail).slice(0, 500),
      });
    }

    const payload = JSON.parse(raw);
    const text = payload?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text || "").join("") || "";
    if (!text) throw new Error("O Gemini retornou uma resposta vazia.");

    const parsed = extractJson(text);
    const posCareRecord = {
      resumoProcedimento: String(parsed.resumoProcedimento || ""),
      orientacoesHomeCare: String(parsed.orientacoesHomeCare || ""),
      dataRetornoRecomendada: String(parsed.dataRetornoRecomendada || ""),
      lembreteMensagemCustom: String(parsed.lembreteMensagemCustom || ""),
      geradoPorIA: true,
      dataCriacao: new Date().toISOString(),
    };

    await setDoc(
      doc(db, "clientes", located.documentId),
      { posCare: posCareRecord, updatedAt: new Date().toISOString() },
      { merge: true },
    );

    return res.status(200).json(posCareRecord);
  } catch (error: any) {
    console.error("POST /api/clientes/[id]/pos-care falhou:", error);
    const timedOut = error?.name === "AbortError";
    return res.status(timedOut ? 504 : 500).json({
      error: timedOut
        ? "A IA demorou mais de 35 segundos. Tente novamente em instantes."
        : "Falha ao gerar ou salvar o plano inteligente.",
      detalhe: error?.message || String(error),
    });
  }
}
