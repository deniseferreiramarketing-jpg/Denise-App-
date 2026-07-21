import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp as initClientApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  limit 
} from "firebase/firestore";

// Load environment variables
dotenv.config();

// Initialize Firebase using explicit configuration so Vercel includes it in the function bundle.
let firestoreDB: any = null;

try {
  const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0427980254",
    appId: process.env.FIREBASE_APP_ID || "1:152029939526:web:a6d4c4658e394e01ef0747",
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAo76nYx5Cyo1mDO98C2Ea049QaM7z78c0",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "gen-lang-client-0427980254.firebaseapp.com",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "gen-lang-client-0427980254.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "152029939526"
  };
  const databaseId = process.env.FIRESTORE_DATABASE_ID || "ai-studio-aaa6872e-3a96-41dc-aa58-820fbf9d86a3";

  const clientApp = initClientApp(firebaseConfig);
  firestoreDB = getFirestore(clientApp, databaseId);
  console.log(`🔥 Firestore configured. Project: ${firebaseConfig.projectId}, database: ${databaseId}`);
} catch (error) {
  console.error("❌ Failed to initialize Firestore:", error);
}

const app = express();
const PORT = 3000;

// Enable JSON bodies
app.use(express.json({ limit: "15mb" }));

// Directory to store database
const DB_DIR = path.join(process.cwd(), "db");
const DB_FILE = path.join(DB_DIR, "storage.json");

// Ensure DB directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Helper to load current database state
function loadDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    // Generate high-quality initial seed data to showcase the system immediately
    const initialData = [
      {
        id: "paciente-1",
        tokenAcesso: "token-maria",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "concluido",
        identificacao: {
          nomeCompleto: "Maria Eduarda de Souza",
          dataNascimento: "1978-04-12",
          idade: "48",
          sexo: "Feminino",
          cpf: "123.456.789-00",
          estadoCivil: "Casada",
          telefone: "(11) 98765-4321",
          whatsapp: "11987654321",
          email: "maria.souza@email.com",
          endereco: "Alameda Lorena, 1420 - Jardins, São Paulo - SP",
          profissao: "Arquiteta",
          contatoEmergencia: "Ricardo Souza (Marido)",
          telefoneEmergencia: "(11) 99123-4567"
        },
        queixaPrincipal: "Dor e desconforto extremo no hálux do pé direito após uso prolongado de calçados de bico fino. Suspeita de unha encravada nas laterais.",
        historicoSaude: {
          diabetes: true,
          hipertensao: false,
          cardiopatia: false,
          circulacao: true,
          varizes: true,
          trombose: false,
          neuropatia: false,
          osteoporose: false,
          artrite: false,
          artrose: false,
          psoriase: false,
          hepatite: false,
          gestante: false,
          lactante: false,
          fumante: false,
          etilista: false,
          outrasCondicoes: "Sensibilidade um pouco reduzida nos pés devido à diabetes recente."
        },
        medicamentosAlergias: {
          usoMedicamentos: "sim",
          quaisMedicamentos: "Metformina 500mg para controle de glicemia.",
          alergias: "sim",
          quaisAlergias: "Alergia moderada a esmalte tradicional contendo formol."
        },
        habitosRotina: {
          praticaAtividadeFisica: "sim",
          qualAtividadeFisica: "Caminhada leve e Pilates",
          frequenciaAtividadeFisica: "3 vezes por semana",
          periodosEmPe: "sim",
          calcadoSeguranca: "nao",
          tipoCalcadoMaisUtilizado: "Sapatilhas apertadas e calçados sociais para reuniões."
        },
        assinaturaPaciente: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", // Dummy sign
        assinaturaPacienteData: new Date().toISOString(),
        avaliacaoTecnica: {
          unhasSaudaveis: false,
          unhasEspessadas: false,
          unhasMicose: false,
          unhasDescolamento: false,
          unhasEncravada: true,
          unhasObservacoes: "Espícula de unha encravada no sulco ungueal lateral externo do hálux direito. Presença de leve hiperqueratose e eritema local.",
          peleIntegra: false,
          peleRessecada: true,
          peleFissuras: false,
          peleCalosidade: true,
          peleHiperqueratose: true,
          peleVerruga: false,
          peleObservacoes: "Pele plantar bastante xerótica (ressecamento acentuado), principalmente nas regiões calcâneas bilateralmente.",
          sensibilidade: "reduzida",
          sensibilidadeObservacoes: "Teste com monofilamento de 10g revelou sensibilidade tátil levemente diminuída na região plantar do antepé posterior.",
          circulacaoVal: "normal",
          circulacaoObservacoes: "Pulsos pedioso e tibial posterior presentes e simétricos.",
          peDireito: "Retirada de espícula dolorosa ungueal no hálux direito com sucesso. Antissepsia local rigorosa realizada.",
          peEsquerdo: "Corte técnico preventivo das unhas, lixamento e hidratação profunda.",
          observacoesGerais: "Paciente necessita de acompanhamento rigoroso devido à diabetes. Orientada expressamente sobre corte reto de unhas e desuso de bico fino."
        },
        assinaturaProfissional: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        assinaturaProfissionalData: new Date().toISOString(),
        posCare: {
          resumoProcedimento: "Realizamos a espiculotomia no hálux direito para alívio imediato da dor, seguido por corte técnico preventivo e hidratação profunda das regiões xeróticas dos calcâneos.",
          orientacoesHomeCare: "### Orientações de Cuidados para Maria Eduarda:\n* **Atenção Próxima à Diabetes**: Inspecione seus pés diariamente com auxílio de um espelho doméstico buscando vermelhidão ou microfissuras.\n* **Hidratação Adequada**: Use hidratante específico para pé diabético (rico em ureia) no dorso e na sola dos pés, mas **nunca passe creme entre os dedos** para evitar micose.\n* **Calçados**: Evite sapatilhas de bico fino ou apertadas nos próximos 15 dias. Prefira calçados confortáveis que não gerem atrito nos cantos das unhas.\n* **Esparadrapagem**: Se indicado, afaste a prega lateral com fita microporosa macia para aliviar a pressão.",
          dataRetornoRecomendada: "30 dias",
          lembreteMensagemCustom: "Olá *Maria Eduarda*! 🌸 Aqui é a Denise Ferreira.\nFoi ótimo cuidar de você hoje! Para garantir um pós-atendimento excelente, separei suas recomendações de Home Care:\n\n1️⃣ **Hidratação Forte**: Aplique seu creme diariamente, evitando a região entre os dedos.\n2️⃣ **Evite Bico Fino**: Dê descanso para as sapatilhas apertadas para não inflamar a unha que tratamos!\n3️⃣ **Inspeção Diária**: Como você tem diabetes, dê aquela olhadinha preventiva nos pés todos os dias com espelho.\n\nNosso próximo encontro preventivo ficou sugerido para daqui a **30 dias**. Se sentir qualquer dor ou incômodo, me chame imediatamente no WhatsApp.\n\nTenha uma excelente semana com saúde! ✨👟",
          geradoPorIA: true,
          dataCriacao: new Date().toISOString()
        }
      },
      {
        id: "paciente-2",
        tokenAcesso: "token-joao",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "preenchido_cliente",
        identificacao: {
          nomeCompleto: "João Carlos de Mendonça",
          dataNascimento: "1962-11-23",
          idade: "63",
          sexo: "Masculino",
          cpf: "987.654.321-11",
          estadoCivil: "Divorciado",
          telefone: "(21) 99888-7766",
          whatsapp: "21998887766",
          email: "joao.mendonca@email.com",
          endereco: "Avenida Atlântica, 4200 - Copacabana, Rio de Janeiro - RJ",
          profissao: "Engenheiro de Produção",
          contatoEmergencia: "Ana Mendonça (Filha)",
          telefoneEmergencia: "(21) 98111-2233"
        },
        queixaPrincipal: "Placa esbranquiçada e espessamento marcante na unha do dedão esquerdo. Coceira eventual nas solas dos pés.",
        historicoSaude: {
          diabetes: false,
          hipertensao: true,
          cardiopatia: false,
          circulacao: false,
          varizes: false,
          trombose: false,
          neuropatia: false,
          osteoporose: false,
          artrite: false,
          artrose: true,
          psoriase: false,
          hepatite: false,
          gestante: false,
          lactante: false,
          fumante: true,
          etilista: false,
          outrasCondicoes: "Faz tratamento para hipertensão arterial de longa data."
        },
        medicamentosAlergias: {
          usoMedicamentos: "sim",
          quaisMedicamentos: "Losartana 50mg diário.",
          alergias: "nao",
          quaisAlergias: ""
        },
        habitosRotina: {
          praticaAtividadeFisica: "sim",
          qualAtividadeFisica: "Natação e academia",
          frequenciaAtividadeFisica: "4 vezes por semana",
          periodosEmPe: "sim",
          calcadoSeguranca: "sim",
          tipoCalcadoMaisUtilizado: "Botas de segurança pesadas de couro durante vistorias técnicas longas."
        },
        assinaturaPaciente: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        assinaturaPacienteData: new Date().toISOString(),
        avaliacaoTecnica: {
          unhasSaudaveis: true,
          unhasEspessadas: false,
          unhasMicose: false,
          unhasDescolamento: false,
          unhasEncravada: false,
          unhasObservacoes: "",
          peleIntegra: true,
          peleRessecada: false,
          peleFissuras: false,
          peleCalosidade: false,
          peleHiperqueratose: false,
          peleVerruga: false,
          peleObservacoes: "",
          sensibilidade: "preservada",
          sensibilidadeObservacoes: "",
          circulacaoVal: "normal",
          circulacaoObservacoes: "",
          peDireito: "",
          peEsquerdo: "",
          observacoesGerais: ""
        },
        assinaturaProfissional: "",
        assinaturaProfissionalData: ""
      },
      {
        id: "paciente-3",
        tokenAcesso: "token-ana",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "aguardando_cliente",
        identificacao: {
          nomeCompleto: "Ana Beatriz Ramos",
          dataNascimento: "1995-09-02",
          idade: "31",
          sexo: "Feminino",
          cpf: "456.789.123-45",
          estadoCivil: "Solteira",
          telefone: "(11) 97777-8888",
          whatsapp: "11977778888",
          email: "anab@email.com",
          endereco: "Rua Augusta, 980 - Consolação, São Paulo - SP",
          profissao: "Advogada",
          contatoEmergencia: "Laura Ramos (Mãe)",
          telefoneEmergencia: "(11) 97111-5555"
        },
        queixaPrincipal: "Agendamento preventivo focado em estética. Deseja realizar reflexologia e hidratação profunda devido à secura frequente provocada pelo uso de saltos.",
        historicoSaude: {
          diabetes: false,
          hipertensao: false,
          cardiopatia: false,
          circulacao: false,
          varizes: false,
          trombose: false,
          neuropatia: false,
          osteoporose: false,
          artrite: false,
          artrose: false,
          psoriase: false,
          hepatite: false,
          gestante: false,
          lactante: false,
          fumante: false,
          etilista: false,
          outrasCondicoes: ""
        },
        medicamentosAlergias: {
          usoMedicamentos: "nao",
          quaisMedicamentos: "",
          alergias: "nao",
          quaisAlergias: ""
        },
        habitosRotina: {
          praticaAtividadeFisica: "nao",
          qualAtividadeFisica: "",
          frequenciaAtividadeFisica: "",
          periodosEmPe: "nao",
          calcadoSeguranca: "nao",
          tipoCalcadoMaisUtilizado: "Saltos altos de 8cm no escritório de advocacia de segunda a sexta."
        },
        assinaturaPaciente: "",
        assinaturaPacienteData: "",
        avaliacaoTecnica: {
          unhasSaudaveis: true,
          unhasEspessadas: false,
          unhasMicose: false,
          unhasDescolamento: false,
          unhasEncravada: false,
          unhasObservacoes: "",
          peleIntegra: true,
          peleRessecada: false,
          peleFissuras: false,
          peleCalosidade: false,
          peleHiperqueratose: false,
          peleVerruga: false,
          peleObservacoes: "",
          sensibilidade: "preservada",
          sensibilidadeObservacoes: "",
          circulacaoVal: "normal",
          circulacaoObservacoes: "",
          peDireito: "",
          peEsquerdo: "",
          observacoesGerais: ""
        },
        assinaturaProfissional: "",
        assinaturaProfissionalData: ""
      }
    ];
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
    return initialData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Erro ao carregar banco de dados", err);
    return [];
  }
}

// Save state to JSON file
function saveDatabase(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Erro ao salvar no banco de dados", err);
  }
}

// --- FIRESTORE DATABASE HELPERS ---

// Automatic Data Migration: If Firestore is connected & empty, seed it with local storage.json data
async function migrateDbToFirestore() {
  if (!firestoreDB) {
    console.log("⚠️ Firestore not configured or unavailable. Skipping migration.");
    return;
  }
  try {
    const coll = collection(firestoreDB, "clientes");
    const snapshot = await getDocs(query(coll, limit(1)));
    if (snapshot.empty) {
      console.log("📂 Empty Firestore database detected. Starting automatic data migration/seeding...");
      const localData = loadDatabase();
      if (localData && localData.length > 0) {
        console.log(`🚀 Seeding/Migrating ${localData.length} client records to Firestore...`);
        for (const c of localData) {
          if (c && c.id) {
            await setDoc(doc(firestoreDB, "clientes", c.id), c);
          }
        }
        console.log("✅ Seeding completed successfully!");
      }
    } else {
      console.log("ℹ️ Firestore already contains user or seeded data. Skipping migration to prevent overwriting.");
    }
  } catch (err) {
    console.error("❌ Seeding of local data to Firestore failed:", err);
  }
}

// Trigger migration on start-up
migrateDbToFirestore().catch(console.error);

async function getClientes(): Promise<any[]> {
  if (firestoreDB) {
    try {
      const snapshot = await getDocs(collection(firestoreDB, "clientes"));
      const docs: any[] = [];
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data();
        if (data && data.id) {
          docs.push(data);
        } else {
          console.warn(`⚠️ Skipping malformed or test document with ID: ${docSnap.id}`);
        }
      });
      // Sort in descending order of creation date
      docs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return docs;
    } catch (e) {
      console.error("Critical error reading collection from Firestore:", e);
      throw e; // Do not fall back to local ephemeral file to prevent data loss or showing old dummy data
    }
  }
  return loadDatabase();
}

async function getClienteByIdOrToken(idOrToken: string): Promise<any | null> {
  if (firestoreDB) {
    try {
      // 1. Try finding by document id directly
      const docRef = await getDoc(doc(firestoreDB, "clientes", idOrToken));
      if (docRef.exists()) {
        return docRef.data() || null;
      }
      // 2. Try looking up record matching tokenAcesso
      const snapshot = await getDocs(query(collection(firestoreDB, "clientes"), where("tokenAcesso", "==", idOrToken), limit(1)));
      if (!snapshot.empty) {
        return snapshot.docs[0].data();
      }
      return null;
    } catch (e) {
      console.error(`Critical error fetching client ${idOrToken} from Firestore:`, e);
      throw e; // Do not fall back to local ephemeral file to prevent data loss or showing old dummy data
    }
  }
  const data = loadDatabase();
  return data.find((c: any) => c.id === idOrToken || c.tokenAcesso === idOrToken) || null;
}

async function saveCliente(cliente: any): Promise<void> {
  if (firestoreDB) {
    try {
      await setDoc(doc(firestoreDB, "clientes", cliente.id), cliente);
      return;
    } catch (e) {
      console.error("Critical error saving customer to Firestore:", e);
      throw e; // Do not fall back to local ephemeral file to prevent data loss
    }
  }
  const data = loadDatabase();
  const index = data.findIndex((c: any) => c.id === cliente.id);
  if (index !== -1) {
    data[index] = cliente;
  } else {
    data.unshift(cliente);
  }
  saveDatabase(data);
}

async function deleteCliente(id: string): Promise<boolean> {
  if (firestoreDB) {
    try {
      await deleteDoc(doc(firestoreDB, "clientes", id));
      return true;
    } catch (e) {
      console.error(`Critical error deleting client ${id} from Firestore:`, e);
      throw e; // Do not fall back to local ephemeral file to prevent mismatch
    }
  }
  const data = loadDatabase();
  const filtered = data.filter((c: any) => c.id !== id);
  if (filtered.length === data.length) return false;
  saveDatabase(filtered);
  return true;
}

// Client endpoint: Get all patients
app.get("/api/clientes", async (req, res) => {
  try {
    const data = await getClientes();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Client endpoint: Fetch single patient by ID or access token (important for the client link)
app.get("/api/clientes/:id", async (req, res) => {
  try {
    const idOrToken = req.params.id;
    const match = await getClienteByIdOrToken(idOrToken);
    
    if (!match) {
      return res.status(404).json({ error: "Paciente não localizado." });
    }
    res.json(match);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Create new patient (for online anamnesis pre-consultation sharing)
app.post("/api/clientes", async (req, res) => {
  const { nome, telefone, email } = req.body;
  if (!nome) {
    return res.status(400).json({ error: "O nome completo do paciente é indispensável." });
  }

  const newId = `paciente-${Date.now()}`;
  const token = `token-${Math.random().toString(36).substring(2, 10)}${Date.now().toString().substring(8)}`;

  const newPatient = {
    id: newId,
    tokenAcesso: token,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "aguardando_cliente",
    identificacao: {
      nomeCompleto: nome,
      dataNascimento: "",
      idade: "",
      sexo: "",
      cpf: "",
      estadoCivil: "",
      telefone: telefone || "",
      whatsapp: telefone ? telefone.replace(/\D/g, "") : "",
      email: email || "",
      endereco: "",
      profissao: "",
      contatoEmergencia: "",
      telefoneEmergencia: ""
    },
    queixaPrincipal: "",
    historicoSaude: {
      diabetes: false,
      hipertensao: false,
      cardiopatia: false,
      circulacao: false,
      varizes: false,
      trombose: false,
      neuropatia: false,
      osteoporose: false,
      artrite: false,
      artrose: false,
      psoriase: false,
      hepatite: false,
      gestante: false,
      lactante: false,
      fumante: false,
      etilista: false,
      outrasCondicoes: ""
    },
    medicamentosAlergias: {
      usoMedicamentos: "",
      quaisMedicamentos: "",
      alergias: "",
      quaisAlergias: ""
    },
    habitosRotina: {
      praticaAtividadeFisica: "",
      qualAtividadeFisica: "",
      frequenciaAtividadeFisica: "",
      periodosEmPe: "",
      calcadoSeguranca: "",
      tipoCalcadoMaisUtilizado: ""
    },
    assinaturaPaciente: "",
    assinaturaPacienteData: "",
    avaliacaoTecnica: {
      unhasSaudaveis: true,
      unhasEspessadas: false,
      unhasMicose: false,
      unhasDescolamento: false,
      unhasEncravada: false,
      unhasObservacoes: "",
      peleIntegra: true,
      peleRessecada: false,
      peleFissuras: false,
      peleCalosidade: false,
      peleHiperqueratose: false,
      peleVerruga: false,
      peleObservacoes: "",
      sensibilidade: "preservada",
      sensibilidadeObservacoes: "",
      circulacaoVal: "normal",
      circulacaoObservacoes: "",
      peDireito: "",
      peEsquerdo: "",
      observacoesGerais: ""
    },
    assinaturaProfissional: "",
    assinaturaProfissionalData: ""
  };

  await saveCliente(newPatient);
  res.status(201).json(newPatient);
});

// Update: Client submits anamnesis (identification, anamnesis answers, and patient signature)
app.put("/api/clientes/:id/cliente-preenchimento", async (req, res) => {
  const idOrToken = req.params.id;
  const current = await getClienteByIdOrToken(idOrToken);

  if (!current) {
    return res.status(404).json({ error: "Paciente não localizado." });
  }

  const { identificacao, queixaPrincipal, historicoSaude, medicamentosAlergias, habitosRotina, assinaturaPaciente } = req.body;

  // Perform surgical updates
  const updated = {
    ...current,
    identificacao: {
      ...current.identificacao,
      ...identificacao,
      // Keep name filled if client left empty
      nomeCompleto: identificacao?.nomeCompleto || current.identificacao?.nomeCompleto
    },
    queixaPrincipal: queixaPrincipal !== undefined ? queixaPrincipal : current.queixaPrincipal,
    historicoSaude: {
      ...current.historicoSaude,
      ...historicoSaude
    },
    medicamentosAlergias: {
      ...current.medicamentosAlergias,
      ...medicamentosAlergias
    },
    habitosRotina: {
      ...current.habitosRotina,
      ...habitosRotina
    },
    assinaturaPaciente: assinaturaPaciente || current.assinaturaPaciente,
    assinaturaPacienteData: assinaturaPaciente ? new Date().toISOString() : current.assinaturaPacienteData,
    status: current.status === "aguardando_cliente" ? "preenchido_cliente" : current.status,
    updatedAt: new Date().toISOString()
  };

  await saveCliente(updated);
  res.json(updated);
});

// Update: Denise submits Technical Evaluation and signs it
app.put("/api/clientes/:id/avaliacao-tecnica", async (req, res) => {
  const idOrToken = req.params.id;
  const current = await getClienteByIdOrToken(idOrToken);

  if (!current) {
    return res.status(404).json({ error: "Paciente não encontrado." });
  }

  const { avaliacaoTecnica, assinaturaProfissional } = req.body;

  const updated = {
    ...current,
    avaliacaoTecnica: {
      ...current.avaliacaoTecnica,
      ...avaliacaoTecnica
    },
    assinaturaProfissional: assinaturaProfissional || current.assinaturaProfissional,
    assinaturaProfissionalData: assinaturaProfissional ? new Date().toISOString() : current.assinaturaProfissionalData,
    status: "concluido" as const, // Technical evaluated = completed anamnesis
    updatedAt: new Date().toISOString()
  };

  await saveCliente(updated);
  res.json(updated);
});

// POST: Generate Post-Care Smart Recommendations with Gemini 3.5 Flash
app.post("/api/clientes/:id/pos-care", async (req, res) => {
  const idOrToken = req.params.id;
  const patient = await getClienteByIdOrToken(idOrToken);

  if (!patient) {
    return res.status(404).json({ error: "Paciente não encontrado." });
  }
  const { resumoManual } = req.body; // Can pass custom details of what actually took place

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ 
      error: "A chave GEMINI_API_KEY não foi configurada. Habilite-a nas configurações." 
    });
  }

  try {
    // Initialize standard SDK
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Collate client profile parameters with ultra-safe fallbacks
    const patientName = patient.identificacao?.nomeCompleto || "Paciente";
    const isDiabetic = patient.historicoSaude?.diabetes ? "SIM (Atenção redobrada, perigo de complicação severa)" : "Não";
    const hasHypertension = patient.historicoSaude?.hipertensao ? "Sim" : "Não";
    const hasCirculationProblem = patient.historicoSaude?.circulacao ? "Sim" : "Não";
    const otherHealthConditions = patient.historicoSaude?.outrasCondicoes || "Nenhuma relatada";
    const allergies = patient.medicamentosAlergias?.alergias === "sim" ? patient.medicamentosAlergias?.quaisAlergias : "Nenhuma relatada";
    const safetyShoesInput = patient.habitosRotina?.calcadoSeguranca === "sim" ? "Usa bota de segurança rígida em pé" : "Não usa calçados rígidos";
    
    // Evaluation summary
    const techEval = patient.avaliacaoTecnica || {};
    const checkedUnhas = [
      techEval.unhasEspessadas && "unhas espessadas",
      techEval.unhasMicose && "micose ungueal",
      techEval.unhasDescolamento && "descolamento",
      techEval.unhasEncravada && "unha encravada"
    ].filter(Boolean).join(", ") || "Unhas saudáveis";

    const checkedPele = [
      techEval.peleRessecada && "pele ressecada",
      techEval.peleFissuras && "fissuras",
      techEval.peleCalosidade && "calosidade plantar",
      techEval.peleHiperqueratose && "hiperqueratose",
      techEval.peleVerruga && "verruga plana"
    ].filter(Boolean).join(", ") || "Pele plantar íntegra";

    const promptText = `
Você é o assistente inteligente da clínica de podologia, enfermagem e estética da Dra. Denise Ferreira.
A Denise promove um posicionamento premium, extremamente humanizado e científico.
Desejamos gerar um plano personalizado de Pós-Atendimento ("Home Care") para o(a) paciente e uma correspondência no WhatsApp de alto encantamento.

Aqui estão as informações detalhadas da Anamnese Integrada do(a) paciente:
- Nome Completo: ${patientName}
- Profissão: ${patient.identificacao?.profissao || "Não informada"}
- Queixa Principal: ${patient.queixaPrincipal || "Não informada"}
- Diabetes: ${isDiabetic}
- Hipertensão: ${hasHypertension}
- Problemas de Circulação ou Varizes: ${hasCirculationProblem}
- Outras Doenças/Condições: ${otherHealthConditions}
- Alergias: ${allergies}
- Rotina/Calçado de cano alto ou de segurança: ${safetyShoesInput}
- Calçado mais utilizado: ${patient.habitosRotina?.tipoCalcadoMaisUtilizado || "Não informado"}

Diagnóstico/Procedimento realizado pela Dra. Denise Ferreira hoje:
- Resumo das Unhas: ${checkedUnhas} (${techEval.unhasObservacoes || "Sem notas adicionais"})
- Resumo da Pele Plantar: ${checkedPele} (${techEval.peleObservacoes || "Sem notas adicionais"})
- Sensibilidade: ${techEval.sensibilidade || "Não informada"} (${techEval.sensibilidadeObservacoes || "Sem notas"})
- Circulação Sanguínea: ${techEval.circulacaoVal || "Não informada"} (${techEval.circulacaoObservacoes || "Sem notas"})
- Relato de Atendimento Pé Direito: ${techEval.peDireito || "Procedimentos higiênico-técnicos comuns."}
- Relato de Atendimento Pé Esquerdo: ${techEval.peEsquerdo || "Procedimentos higiênico-técnicos comuns."}
- Resumo Manual adicionado do atendimento: ${resumoManual || "Nenhum resumo manual extra adicionado."}

Crie um plano estruturado de orientação médica com:
1. "resumoProcedimento" - Um parágrafo aconchegante, profissional e técnico que descreva o que foi feito na clínica. Use uma linguagem humana e atenciosa.
2. "orientacoesHomeCare" - Recomendações precisas e específicas, detalhadas, escritas sob forma de tópicos em Markdown, abordando o quadro clínico. Exemplo: caso tenha diabetes, adicione instruções rígidas contra cortes caseiros e acúmulo de umidade. Caso use bota de segurança ou tenha muito ressecamento, prescreva rituais de hidratação noturna e higiene. Alerte sobre as alergias caso existam.
3. "dataRetornoRecomendada" - Uma sugestão científica embasada (ex: "30 a 45 dias" ou "15 dias em casos infecciosos ou de órtese").
4. "lembreteMensagemCustom" - Uma mensagem de WhatsApp encantadora, usando marcadores em negrito (*), que Denise Ferreira pode disparar para o cliente. Deve conter:
   - Uma abertura carinhosa e exclusiva.
   - O resumo das orientações Home Care descritas de forma curta, de leitura ultrarrápida, decorada com emojis acolhedores.
   - A sugestão amigável do retorno e um canal aberto para dúvidas.

Retorne estritamente em formato JSON seguindo este esquema:
{
  "resumoProcedimento": "texto",
  "orientacoesHomeCare": "markdown",
  "dataRetornoRecomendada": "texto",
  "lembreteMensagemCustom": "texto"
}
`;

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
            lembreteMensagemCustom: { type: Type.STRING }
          },
          required: ["resumoProcedimento", "orientacoesHomeCare", "dataRetornoRecomendada", "lembreteMensagemCustom"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Resposta nula recebida da inteligência artificial.");
    }

    const aiParsed = JSON.parse(resultText);

    const posCareRecord = {
      resumoProcedimento: aiParsed.resumoProcedimento,
      orientacoesHomeCare: aiParsed.orientacoesHomeCare,
      dataRetornoRecomendada: aiParsed.dataRetornoRecomendada,
      lembreteMensagemCustom: aiParsed.lembreteMensagemCustom,
      geradoPorIA: true,
      dataCriacao: new Date().toISOString()
    };

    // Save back to client structure
    patient.posCare = posCareRecord;
    patient.updatedAt = new Date().toISOString();
    
    await saveCliente(patient);

    res.json(posCareRecord);
  } catch (err: any) {
    console.error("Falha no processamento do Gemini API:", err);
    res.status(500).json({ 
      error: "Houve uma instabilidade na inteligência de cuidados da IA. Mais detalhes: " + err.message 
    });
  }
});

// Delete client (convenience for individual control)
app.delete("/api/clientes/:id", async (req, res) => {
  const id = req.params.id;
  const success = await deleteCliente(id);
  if (!success) {
    return res.status(404).json({ error: "Paciente não localizado." });
  }
  res.json({ success: true, message: "Cadastro e fichas excluídas com sucesso." });
});

// Import complete backup/restoration bundle of clients
app.post("/api/clientes/importar", async (req, res) => {
  try {
    const list = req.body;
    if (!Array.isArray(list)) {
      return res.status(400).json({ error: "Formato de dados para importação inválido. Deve ser um array." });
    }
    
    // Save each client to DB (configured firestoreDB or local fallback)
    for (const item of list) {
      if (item && item.id) {
        await saveCliente(item);
      }
    }
    
    res.json({ success: true, count: list.length, message: "Backup importado com absoluto sucesso!" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Exportado como função serverless da Vercel.
export default app;
