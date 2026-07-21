import type { Request, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";
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

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const idOrToken = getRouteId(req);
    if (!idOrToken) {
      return res.status(400).json({ error: "Identificador do paciente não informado." });
    }

    const located = await locatePatient(idOrToken);
    if (!located) {
      return res.status(404).json({ error: "Paciente não encontrado." });
    }

    const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return res.status(500).json({
        error: "A variável GEMINI_API_KEY não está disponível nesta implantação da Vercel.",
      });
    }

    const patient = located.data;
    const resumoManual = String(req.body?.resumoManual || "").trim();
    const techEval = patient.avaliacaoTecnica || {};

    const patientName = patient.identificacao?.nomeCompleto || "Paciente";
    const isDiabetic = patient.historicoSaude?.diabetes
      ? "SIM (atenção redobrada para prevenção de complicações)"
      : "Não";
    const hasHypertension = patient.historicoSaude?.hipertensao ? "Sim" : "Não";
    const hasCirculationProblem = patient.historicoSaude?.circulacao ? "Sim" : "Não";
    const otherHealthConditions = patient.historicoSaude?.outrasCondicoes || "Nenhuma relatada";
    const allergies = patient.medicamentosAlergias?.alergias === "sim"
      ? patient.medicamentosAlergias?.quaisAlergias || "Alergia relatada, sem descrição"
      : "Nenhuma relatada";
    const safetyShoesInput = patient.habitosRotina?.calcadoSeguranca === "sim"
      ? "Usa calçado de segurança rígido"
      : "Não usa calçado de segurança rígido";

    const checkedUnhas = [
      techEval.unhasEspessadas && "unhas espessadas",
      techEval.unhasMicose && "micose ungueal",
      techEval.unhasDescolamento && "descolamento",
      techEval.unhasEncravada && "unha encravada",
    ].filter(Boolean).join(", ") || "Unhas sem alterações assinaladas";

    const checkedPele = [
      techEval.peleRessecada && "pele ressecada",
      techEval.peleFissuras && "fissuras",
      techEval.peleCalosidade && "calosidade plantar",
      techEval.peleHiperqueratose && "hiperqueratose",
      techEval.peleVerruga && "verruga plana",
    ].filter(Boolean).join(", ") || "Pele plantar sem alterações assinaladas";

    const promptText = `
Você é um assistente de apoio à documentação clínica da Clínica DF Saúde Integrada, da Dra. Denise Ferreira.
Gere orientações pós-atendimento personalizadas, acolhedoras, objetivas e prudentes. Não faça diagnóstico novo, não prescreva medicamentos e não substitua avaliação profissional.

Paciente:
- Nome: ${patientName}
- Profissão: ${patient.identificacao?.profissao || "Não informada"}
- Queixa principal: ${patient.queixaPrincipal || "Não informada"}
- Diabetes: ${isDiabetic}
- Hipertensão: ${hasHypertension}
- Circulação/varizes: ${hasCirculationProblem}
- Outras condições: ${otherHealthConditions}
- Alergias: ${allergies}
- Calçado de segurança: ${safetyShoesInput}
- Calçado mais utilizado: ${patient.habitosRotina?.tipoCalcadoMaisUtilizado || "Não informado"}

Avaliação e atendimento:
- Unhas: ${checkedUnhas}. Observações: ${techEval.unhasObservacoes || "Sem observações"}
- Pele: ${checkedPele}. Observações: ${techEval.peleObservacoes || "Sem observações"}
- Sensibilidade: ${techEval.sensibilidade || "Não informada"}. Observações: ${techEval.sensibilidadeObservacoes || "Sem observações"}
- Circulação: ${techEval.circulacaoVal || "Não informada"}. Observações: ${techEval.circulacaoObservacoes || "Sem observações"}
- Pé direito: ${techEval.peDireito || "Não informado"}
- Pé esquerdo: ${techEval.peEsquerdo || "Não informado"}
- Resumo manual: ${resumoManual || "Nenhum resumo adicional"}

Retorne estritamente um JSON com:
- resumoProcedimento: parágrafo profissional e humano sobre o atendimento;
- orientacoesHomeCare: tópicos em Markdown com cuidados domiciliares seguros e sinais de alerta;
- dataRetornoRecomendada: intervalo sugerido, condicionado à evolução clínica;
- lembreteMensagemCustom: mensagem curta e acolhedora para WhatsApp, usando *negrito* e poucos emojis.
`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            resumoProcedimento: { type: Type.STRING },
            orientacoesHomeCare: { type: Type.STRING },
            dataRetornoRecomendada: { type: Type.STRING },
            lembreteMensagemCustom: { type: Type.STRING },
          },
          required: [
            "resumoProcedimento",
            "orientacoesHomeCare",
            "dataRetornoRecomendada",
            "lembreteMensagemCustom",
          ],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("A IA retornou uma resposta vazia.");
    }

    const aiParsed = JSON.parse(resultText) as Record<string, string>;
    const posCareRecord = {
      resumoProcedimento: aiParsed.resumoProcedimento || "",
      orientacoesHomeCare: aiParsed.orientacoesHomeCare || "",
      dataRetornoRecomendada: aiParsed.dataRetornoRecomendada || "",
      lembreteMensagemCustom: aiParsed.lembreteMensagemCustom || "",
      geradoPorIA: true,
      dataCriacao: new Date().toISOString(),
    };

    const updatedAt = new Date().toISOString();
    await setDoc(
      doc(db, "clientes", located.documentId),
      {
        posCare: posCareRecord,
        updatedAt,
      },
      { merge: true },
    );

    const confirmation = await getDoc(doc(db, "clientes", located.documentId));
    if (!confirmation.exists() || !confirmation.data()?.posCare) {
      throw new Error("O Firestore não confirmou a gravação do plano de cuidados.");
    }

    return res.status(200).json(posCareRecord);
  } catch (error: any) {
    console.error("POST /api/clientes/[id]/pos-care falhou:", error);
    return res.status(500).json({
      error: "Falha ao gerar ou salvar o plano de cuidados inteligentes.",
      detalhe: error?.message || String(error),
    });
  }
}
