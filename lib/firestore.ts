import { initializeApp, getApp, getApps } from "firebase/app";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0427980254",
  appId: process.env.FIREBASE_APP_ID || "1:152029939526:web:a6d4c4658e394e01ef0747",
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAo76nYx5Cyo1mDO98C2Ea049QaM7z78c0",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "gen-lang-client-0427980254.firebaseapp.com",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "gen-lang-client-0427980254.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "152029939526",
};

const databaseId = process.env.FIRESTORE_DATABASE_ID || "ai-studio-aaa6872e-3a96-41dc-aa58-820fbf9d86a3";

export function db(): Firestore {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getFirestore(app, databaseId);
}

export async function listClientes(): Promise<any[]> {
  const snap = await getDocs(collection(db(), "clientes"));
  const items = snap.docs
    .map((item) => ({ ...item.data(), id: item.data()?.id || item.id }))
    .filter((item: any) => item && item.id);
  items.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  return items;
}

export async function findCliente(idOrToken: string): Promise<any | null> {
  const value = decodeURIComponent(String(idOrToken || "")).trim();
  if (!value) return null;

  // Caminho principal: os novos cadastros usam o token como ID do documento.
  const direct = await getDoc(doc(db(), "clientes", value));
  if (direct.exists()) {
    const data = direct.data();
    return { ...data, id: data?.id || direct.id };
  }

  // Compatibilidade absoluta com pacientes antigos. Em vez de depender de
  // índice/consulta por campo, lê a coleção e compara o token no servidor.
  const all = await getDocs(collection(db(), "clientes"));
  for (const item of all.docs) {
    const data: any = item.data();
    if (item.id === value || data?.id === value || data?.tokenAcesso === value) {
      return { ...data, id: data?.id || item.id };
    }
  }
  return null;
}

export async function createCliente(input: { nome: string; telefone?: string; email?: string }): Promise<any> {
  const nome = String(input.nome || "").trim();
  if (!nome) throw new Error("O nome completo do paciente é indispensável.");

  const random = Math.random().toString(36).slice(2, 10);
  const token = `token-${random}-${Date.now()}`;
  const now = new Date().toISOString();
  const patient = {
    id: token,
    tokenAcesso: token,
    createdAt: now,
    updatedAt: now,
    status: "aguardando_cliente",
    identificacao: {
      nomeCompleto: nome,
      dataNascimento: "",
      idade: "",
      sexo: "",
      cpf: "",
      estadoCivil: "",
      telefone: input.telefone || "",
      whatsapp: input.telefone ? String(input.telefone).replace(/\D/g, "") : "",
      email: input.email || "",
      endereco: "",
      profissao: "",
      contatoEmergencia: "",
      telefoneEmergencia: "",
    },
    queixaPrincipal: "",
    historicoSaude: {
      diabetes: false, hipertensao: false, cardiopatia: false, circulacao: false,
      varizes: false, trombose: false, neuropatia: false, osteoporose: false,
      artrite: false, artrose: false, psoriase: false, hepatite: false,
      gestante: false, lactante: false, fumante: false, etilista: false,
      outrasCondicoes: "",
    },
    medicamentosAlergias: {
      usoMedicamentos: "", quaisMedicamentos: "", alergias: "", quaisAlergias: "",
    },
    habitosRotina: {
      praticaAtividadeFisica: "", qualAtividadeFisica: "", frequenciaAtividadeFisica: "",
      periodosEmPe: "", calcadoSeguranca: "", tipoCalcadoMaisUtilizado: "",
    },
    assinaturaPaciente: "",
    assinaturaPacienteData: "",
    avaliacaoTecnica: {
      unhasSaudaveis: true, unhasEspessadas: false, unhasMicose: false,
      unhasDescolamento: false, unhasEncravada: false, unhasObservacoes: "",
      peleIntegra: true, peleRessecada: false, peleFissuras: false,
      peleCalosidade: false, peleHiperqueratose: false, peleVerruga: false,
      peleObservacoes: "", sensibilidade: "preservada", sensibilidadeObservacoes: "",
      circulacaoVal: "normal", circulacaoObservacoes: "", peDireito: "",
      peEsquerdo: "", observacoesGerais: "",
    },
    assinaturaProfissional: "",
    assinaturaProfissionalData: "",
  };

  const ref = doc(db(), "clientes", token);
  await setDoc(ref, patient);
  const check = await getDoc(ref);
  if (!check.exists()) throw new Error("O Firestore não confirmou a gravação.");
  return { ...check.data(), id: token, tokenAcesso: token };
}
