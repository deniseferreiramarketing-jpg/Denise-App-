import React, { useState, useEffect, useRef } from "react";
import { 
  Users, UserPlus, Search, Filter, ClipboardList, Calendar, 
  Phone, Mail, CheckCircle2, Moon, Link as LinkIcon, 
  MessageSquare, Share2, Sparkles, AlertCircle, FileText, 
  Printer, Trash2, Heart, Lock, LogOut, Check, Plus, Edit, ChevronRight, PenTool,
  Download, Upload
} from "lucide-react";
import { Cliente, AvaliacaoTecnica } from "../types";
import SignatureCanvas from "./SignatureCanvas";
import DeniseLogo from "./DeniseLogo";

interface ProfissionalDashboardProps {
  onLogout: () => void;
}

export default function ProfissionalDashboard({ onLogout }: ProfissionalDashboardProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  
  // Selected patient profile
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [activeTab, setActiveTab] = useState<"anamnese" | "avaliacao" | "poscare">("anamnese");
  
  // Custom delete confirmation modal state
  const [clientToDelete, setClientToDelete] = useState<Cliente | null>(null);

  // Multi-tab patient workspace states
  const [openClientIds, setOpenClientIds] = useState<string[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);

  // Dual-trigger WhatsApp states
  const [waMode, setWaMode] = useState<"pos" | "lembrete">("pos");
  const [nextAppointmentDate, setNextAppointmentDate] = useState("");
  const [nextAppointmentTime, setNextAppointmentTime] = useState("");
  const [customMessageText, setCustomMessageText] = useState("");

  const getPosMsgTemplate = (nome: string, temUnhaEncravada: boolean) => {
    const nomePrimeiro = nome.split(" ")[0];
    return `Olá, ${nomePrimeiro}! ✨ Passando para saber como estão se sentindo os seus pés após o nosso atendimento de hoje. Cuidar de você com esse olhar integrado é sempre uma alegria! 👣

Para garantir que a sua recuperação seja perfeita e super tranquila, separei alguns lembretes rápidos para o seu Home Care:

* 🧼 Higiene: Mantenha a região da unha tratada limpa e bem sequinha.
* 🚫 Sem Mexer: Não tente cortar ou cutucar a lateral da unha em casa.
* 🩴 Cuidado com Traumas: Ao usar chinelos, atenção redobrada para não bater o dedo em recuperação.
* ⚠️ Alergia: Lembre-se de evitar qualquer medicamento com dipirona caso precise de analgésicos.

Sugiro que agendemos a sua reavaliação para daqui a 15 a 20 dias, garantindo que tudo está cicatrizando perfeitamente. Qualquer dúvida, estou à total disposição por aqui! 

Muito obrigado pela confiança!

Denise Ferreira. 🌸`;
  };

  const getLembreteMsgTemplate = (nome: string, dataStr: string, horaStr: string) => {
    const nomePrimeiro = nome.split(" ")[0];
    const dataFormatada = dataStr 
      ? new Date(dataStr + "T00:00:00").toLocaleDateString("pt-BR") 
      : "___/___/______";
    const horaFormatada = horaStr || "__:__";
    return `Olá, ${nomePrimeiro}! ✨ 

Passando para lembrar que sua próxima consulta de Podologia com a Denise Ferreira está agendada para:

📅 Data: *${dataFormatada}*
⏰ Horário: *${horaFormatada}*

Por favor, nos confirme se este horário continua ideal para você. Estamos nos preparando para te proporcionar uma experiência relaxante, segura e totalmente humanizada! 👣

Qualquer dúvida, estamos sempre por aqui. 

Abraços e até breve!

Denise Ferreira
Enfermagem - Podologia - Estética`;
  };

  useEffect(() => {
    if (selectedClient) {
      if (waMode === "pos") {
        setCustomMessageText(selectedClient.posCare?.lembreteMensagemCustom || getPosMsgTemplate(
          selectedClient.identificacao.nomeCompleto, 
          selectedClient.avaliacaoTecnica?.unhasEncravada || false
        ));
      } else {
        setCustomMessageText(getLembreteMsgTemplate(
          selectedClient.identificacao.nomeCompleto,
          nextAppointmentDate,
          nextAppointmentTime
        ));
      }
    }
  }, [selectedClient?.id, waMode, nextAppointmentDate, nextAppointmentTime, selectedClient?.posCare?.lembreteMensagemCustom]);

  // Tabbed patient navigation functions
  const handleSelectClient = (patient: Cliente) => {
    setSelectedClient(patient);
    setActiveClientId(patient.id);
    if (!openClientIds.includes(patient.id)) {
      setOpenClientIds(prev => [...prev, patient.id]);
    }
  };

  const handleTabClick = (clientId: string) => {
    const client = clientes.find(c => c.id === clientId);
    if (client) {
      setSelectedClient(client);
      setActiveClientId(clientId);
    }
  };

  const handleCloseTab = (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newOpenIds = openClientIds.filter(id => id !== clientId);
    setOpenClientIds(newOpenIds);
    if (activeClientId === clientId) {
      if (newOpenIds.length > 0) {
        const nextId = newOpenIds[newOpenIds.length - 1];
        const nextClient = clientes.find(c => c.id === nextId);
        if (nextClient) {
          setSelectedClient(nextClient);
          setActiveClientId(nextId);
        }
      } else {
        setSelectedClient(null);
        setActiveClientId(null);
      }
    }
  };

  // Create new patient invitation popup
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newNome, setNewNome] = useState("");
  const [newTelefone, setNewTelefone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // Technical Evaluation Form states for editing
  const [avaliacao, setAvaliacao] = useState<AvaliacaoTecnica>({
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
  });
  const [assinaturaProfissional, setAssinaturaProfissional] = useState("");

  // Smart Care generation details
  const [resumoManual, setResumoManual] = useState("");
  const [generatingCare, setGeneratingCare] = useState(false);

  // Link copy visual success state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Backup and Restoration handlers
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportBackup = () => {
    try {
      if (clientes.length === 0) {
        alert("Não existem dados de pacientes para exportar no momento.");
        return;
      }
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(clientes, null, 2));
      const downloadAnchor = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `backup-pacientes-denise-${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err: any) {
      alert("Falha ao exportar backup: " + err.message);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          
          if (!Array.isArray(parsed)) {
            alert("Erro: O arquivo de backup deve ser uma lista (array) de pacientes cadastrados.");
            return;
          }

          if (confirm(`Tem certeza de que gostaria de restaurar ${parsed.length} paciente(s) a partir deste arquivo de backup? Registros com o mesmo ID serão atualizados e novos pacientes serão adicionados ao consultório.`)) {
            const res = await fetch("/api/clientes/importar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: content
            });

            if (res.ok) {
              const result = await res.json();
              alert(`Restauração efetuada com sucesso! ${result.count} paciente(s) importado(s) e mesclado(s) no sistema.`);
              await fetchClientes(); // Refresh list to reflect updates
            } else {
              const errData = await res.json();
              alert("Erro na importação do backup: " + (errData?.error || "resposta inesperada do servidor"));
            }
          }
        } catch (jsonErr: any) {
          alert("O arquivo fornecido não contém uma estrutura JSON válida de backup: " + jsonErr.message);
        }
      };
      reader.readAsText(file);
    } catch (fileErr: any) {
      alert("Falha ao ler o arquivo de backup selecionado: " + fileErr.message);
    } finally {
      // Clear input so uploading same file works
      e.target.value = "";
    }
  };

  // Load clients catalog on startup
  const fetchClientes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/clientes");
      if (res.ok) {
        const data = await res.json();
        setClientes(data);
      }
    } catch (err) {
      console.error("Erro ao carregar pacientes.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  // Update form values when selected patient changes
  useEffect(() => {
    if (selectedClient) {
      setAvaliacao({
        ...selectedClient.avaliacaoTecnica
      });
      setAssinaturaProfissional(selectedClient.assinaturaProfissional || "");
      setResumoManual(selectedClient.posCare?.resumoProcedimento || "");
    }
  }, [selectedClient]);

  // Handle client creation
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNome.trim()) return;

    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: newNome, telefone: newTelefone, email: newEmail })
      });
      if (res.ok) {
        const created: Cliente = await res.json();
        setClientes(prev => [created, ...prev]);
        setShowInviteModal(false);
        setNewNome("");
        setNewTelefone("");
        setNewEmail("");
        handleSelectClient(created); // Automatically select newly created patient
        setActiveTab("anamnese");
      }
    } catch (err) {
      alert("Falha ao criar o convite.");
    }
  };

  // Safe Technical assessment saving
  const handleAvaliacaoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    try {
      const res = await fetch(`/api/clientes/${selectedClient.id}/avaliacao-tecnica`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avaliacaoTecnica: avaliacao,
          assinaturaProfissional
        })
      });

      if (res.ok) {
        const updated: Cliente = await res.json();
        
        // Update selection and items catalog
        setSelectedClient(updated);
        setClientes(prev => prev.map(c => c.id === updated.id ? updated : c));
        alert("Avaliação clínica e podológica salva com absoluto sucesso!");
      }
    } catch (err) {
      alert("Houve uma falha ao salvar as avaliações técnicas de enfermagem.");
    }
  };

  // Generate Personalized smart Home Care advice with a client-side timeout.
  const triggerAICareGeneration = async () => {
    if (!selectedClient || generatingCare) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45_000);

    try {
      setGeneratingCare(true);
      const res = await fetch(`/api/clientes/${selectedClient.id}/pos-care`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumoManual }),
        signal: controller.signal
      });

      const responseText = await res.text();
      let responseData: any = null;
      try {
        responseData = responseText ? JSON.parse(responseText) : null;
      } catch {
        // The message below is clearer than leaving the loading state spinning forever.
      }

      if (!res.ok) {
        const message = responseData?.detalhe
          ? `${responseData.error || "Falha ao gerar o plano."}

Detalhe: ${responseData.detalhe}`
          : responseData?.error || `Falha no servidor (${res.status}).`;
        throw new Error(message);
      }

      if (!responseData) throw new Error("A API retornou uma resposta vazia ou inválida.");

      const updatedClient = { ...selectedClient, posCare: responseData };
      setSelectedClient(updatedClient);
      setClientes(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
      alert("Plano e cuidados inteligentes gerados com sucesso!");
    } catch (err: any) {
      if (err?.name === "AbortError") {
        alert("A geração demorou mais de 45 segundos e foi interrompida. Tente novamente em instantes.");
      } else {
        alert("Falha na geração inteligente: " + (err?.message || "erro desconhecido"));
      }
    } finally {
      window.clearTimeout(timeout);
      setGeneratingCare(false);
    }
  };

  // Delete profile completely
  const handleDeleteClient = async (id: string) => {
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setClientes(prev => prev.filter(c => c.id !== id));
        setOpenClientIds(prev => prev.filter(cid => cid !== id));
        if (activeClientId === id) {
          setActiveClientId(null);
          setSelectedClient(null);
        } else if (selectedClient?.id === id) {
          setSelectedClient(null);
        }
        setClientToDelete(null);
      } else {
        alert("Falha ao deletar.");
      }
    } catch (err) {
      alert("Falha ao deletar.");
    }
  };

  // Format share link
  const getShareLink = (clientItem: Cliente) => {
    const currentUrl = window.location.origin;
    // Usa o ID real do documento no Firestore. A consulta por ID é direta e
    // não depende de índice, busca por token ou sincronização auxiliar.
    return `${currentUrl}?id=${encodeURIComponent(clientItem.id)}`;
  };

  // Copy share link and open WhatsApp
  const handleCopyLink = (clientItem: Cliente) => {
    const link = getShareLink(clientItem);
    navigator.clipboard.writeText(link);
    setCopiedId(clientItem.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // WhatsApp click forwarder
  const handleSendWhatsApp = (clientItem: Cliente) => {
    const link = getShareLink(clientItem);
    const textMsg = `Olá *${clientItem.identificacao.nomeCompleto}*! 🌸 Aqui é a Denise Ferreira.\n\nPara que eu possa realizar um diagnóstico preciso e humanizado na sua consulta, por favor preencha sua ficha clínica de anamnese antes de chegar, clicando neste link seguro:\n${link}\n\nObrigada e nos vemos em breve! ✨`;
    const cleanPhone = clientItem.identificacao.whatsapp || clientItem.identificacao.telefone.replace(/\D/g, "");
    
    // Redirects directly to wa.me safely
    window.open(`https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(textMsg)}`, "_blank");
  };

  // Custom print trigger for reports
  const triggerPrint = () => {
    window.print();
  };

  // Filter clients dynamically
  const filtered = clientes.filter(c => {
    const nome = c.identificacao?.nomeCompleto || "";
    const cpf = c.identificacao?.cpf || "";
    const telefone = c.identificacao?.telefone || "";
    const matchesSearch = nome.toLowerCase().includes(search.toLowerCase()) ||
                          cpf.includes(search) ||
                          telefone.includes(search);
    if (filterStatus === "todos") return matchesSearch;
    return matchesSearch && c.status === filterStatus;
  });

  return (
    <div class="min-h-screen bg-stone-50 flex flex-col no-print">
      
      {/* Top Professional Navigation Bar */}
      <header className="bg-stone-900 text-stone-100 border-b border-gold-400/20 py-4 px-6 sticky top-0 z-10 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <DeniseLogo size="md" variant="gold" />
          <div>
            <h1 class="font-serif text-lg font-semibold tracking-widest text-gold-200">WORKSPACE DENISE FERREIRA</h1>
            <p class="text-xxs text-amber-200 uppercase tracking-widest font-semibold">Atendimento Humanizado & Especialidade Corporal</p>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <span class="text-xs bg-stone-800 text-stone-300 px-3 py-1.5 border border-stone-700 rounded-full font-medium">
             Enfermeira e Podóloga Clinica
          </span>
          <button
            id="btn-export-backup"
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 text-xs text-stone-300 hover:text-white font-semibold cursor-pointer p-2 rounded-lg hover:bg-stone-850 transition-colors"
            title="Exportar arquivo JSON com todos os dados dos pacientes"
          >
            <Download className="w-4 h-4 text-amber-400" /> Exportar Backup
          </button>
          <button
            id="btn-import-trigger"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-stone-300 hover:text-white font-semibold cursor-pointer p-2 rounded-lg hover:bg-stone-850 transition-colors"
            title="Importar e restaurar dados de pacientes a partir de backup JSON"
          >
            <Upload className="w-4 h-4 text-emerald-400" /> Importar Backup
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportBackup}
            accept=".json"
            className="hidden"
          />
          <button
            id="btn-logout"
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer p-2 rounded-lg hover:bg-stone-850 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sair do Sistema
          </button>
        </div>
      </header>

      {/* Main Backoffice Workspace */}
      <div class="flex-1 w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: CLIENT CATALOG & SELECTION (col-span-4) */}
        <div class="lg:col-span-4 flex flex-col gap-4 bg-white border border-stone-200 rounded-xl p-4 shadow-sm h-[calc(100vh-140px)] overflow-hidden">
          <div class="flex justify-between items-center">
            <h3 class="font-serif text-sm font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
              <Users class="w-4 h-4 text-gold-600" /> Pacientes Cadastrados
            </h3>
            <button
              id="btn-invite-client"
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 text-gold-100 hover:bg-stone-800 text-xs font-semibold shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-gold-300" /> Enviar Link
            </button>
          </div>

          {/* Search bar & state filter */}
          <div class="flex flex-col gap-2">
            <div class="relative">
              <Search class="absolute left-2.5 top-3 w-4 h-4 text-stone-400" />
              <input
                id="search-patients"
                type="text"
                placeholder="Buscar paciente por nome, CPF..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
              />
            </div>

            <div class="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
              <Filter className="w-3 h-3 text-stone-500 ml-1.5" />
              <select
                id="filter-status"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-transparent text-xxs font-medium text-stone-600 focus:outline-none w-full"
              >
                <option value="todos">Todos os Status</option>
                <option value="aguardando_cliente">Aguardando Cliente</option>
                <option value="preenchido_cliente">Preenchidos p/ Avaliar</option>
                <option value="concluido">Fichas Concluídas</option>
              </select>
            </div>
          </div>

          {/* List display */}
          <div class="flex-1 overflow-y-auto pr-1 space-y-2 mt-2">
            {loading ? (
              <div class="py-12 text-center text-stone-400 text-xs animate-pulse">
                Carregando registros de consultório...
              </div>
            ) : filtered.length === 0 ? (
              <div class="py-12 text-center text-stone-400 text-xs flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 text-stone-300" />
                Nenhum paciente localizado.
              </div>
            ) : (
              filtered.map(patient => {
                const isSelected = selectedClient?.id === patient.id;
                
                // Set badge styling based on Status
                let badgeClass = "bg-amber-50 text-amber-700 border-amber-100";
                let badgeText = "Aguardando";
                if (patient.status === "preenchido_cliente") {
                  badgeClass = "bg-sky-50 text-sky-700 border-sky-100 animate-pulse";
                  badgeText = "Avaliável";
                } else if (patient.status === "concluido") {
                  badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  badgeText = "Concluída";
                }

                return (
                  <div
                    id={`patient-card-${patient.id}`}
                    key={patient.id}
                    onClick={() => handleSelectClient(patient)}
                    className={`p-3 border rounded-xl cursor-pointer transition-all hover:shadow-sm ${
                      isSelected 
                        ? "bg-amber-50/40 border-gold-300 ring-1 ring-gold-200" 
                        : "bg-stone-50/50 border-stone-200/80 hover:bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h4 className="font-serif text-xs font-bold text-stone-900 truncate">
                        {patient.identificacao?.nomeCompleto || "Sem Nome"}
                      </h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${badgeClass}`}>
                        {badgeText}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[10px] text-stone-500">
                      <span className="truncate flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5 text-stone-400" /> {patient.identificacao?.telefone || "N/A"}
                      </span>
                      <span className="truncate text-right text-stone-400">
                        {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString("pt-BR") : "N/A"}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-stone-200/50 flex justify-between items-center">
                      <div className="flex gap-1.5">
                        <button
                          id={`btn-copy-card-${patient.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyLink(patient);
                          }}
                          className="p-1 hover:bg-stone-200 rounded text-stone-500 hover:text-stone-700 cursor-pointer"
                          title="Copiar Link de Envio"
                        >
                          {copiedId === patient.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <LinkIcon className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          id={`btn-wa-card-${patient.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendWhatsApp(patient);
                          }}
                          className="p-1 hover:bg-emerald-50 rounded text-emerald-600 hover:text-emerald-800 cursor-pointer"
                          title="Disparar no WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        id={`btn-del-card-${patient.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setClientToDelete(patient);
                        }}
                        className="p-1 hover:bg-rose-50 rounded text-stone-400 hover:text-rose-600 cursor-pointer"
                        title="Remover Registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: WORKSPACE FILE DETAILS (col-span-8) */}
        <div className="lg:col-span-8 flex flex-col bg-white border border-stone-200 rounded-xl p-5 shadow-sm h-[calc(100vh-140px)] overflow-hidden">
          
          {selectedClient ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Open Patients Multi-Tab Navigation Bar */}
              <div className="flex items-center gap-1.5 border-b border-stone-150 pb-3 mb-3 overflow-x-auto select-none no-scrollbar">
                {openClientIds.map(clientId => {
                  const clientObj = clientes.find(c => c.id === clientId);
                  if (!clientObj) return null;
                  const isActive = activeClientId === clientId;
                  
                  return (
                    <div
                      key={clientId}
                      onClick={() => handleTabClick(clientId)}
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-serif font-bold uppercase tracking-wider cursor-pointer border transition-all ${
                        isActive
                          ? "bg-stone-900 text-gold-100 border-stone-950 shadow-sm"
                          : "bg-stone-50 text-stone-500 border-stone-200/60 hover:bg-stone-100/80 hover:text-stone-850"
                      }`}
                    >
                      <span className="truncate max-w-[120px]">{clientObj.identificacao.nomeCompleto.split(" ")[0]}</span>
                      <button
                        onClick={(e) => handleCloseTab(clientId, e)}
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[11px] font-sans font-bold leading-none transition-all ${
                          isActive 
                            ? "bg-white/10 hover:bg-white/20 text-gold-300 hover:text-rose-400" 
                            : "hover:bg-stone-200 text-stone-400 hover:text-rose-600"
                        }`}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Patient Identification Header Card */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-100">
                <div>
                  <h2 class="font-serif text-lg font-bold text-stone-900">
                    {selectedClient.identificacao.nomeCompleto}
                  </h2>
                  <div class="flex items-center gap-3 mt-1.5 text-xs text-stone-500">
                    <span><strong>Profissão:</strong> {selectedClient.identificacao.profissao || "Não declarada"}</span>
                    <span>•</span>
                    <span><strong>WhatsApp:</strong> {selectedClient.identificacao.telefone || "Não cadastrado"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-print-patient-form"
                    onClick={triggerPrint}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Imprimir / PDF
                  </button>

                  <button
                    id="btn-delete-patient-file"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setClientToDelete(selectedClient);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50/20 hover:bg-rose-50 text-xs font-semibold text-rose-700 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Excluir Paciente
                  </button>
                </div>
              </div>

              {/* Process Tab Selectors */}
              <div class="flex gap-1 bg-stone-50 border-b border-stone-200/80 p-1 mt-4">
                <button
                  id="tab-btn-anamnese"
                  onClick={() => setActiveTab("anamnese")}
                  className={`flex-1 py-2 text-xs font-bold font-serif uppercase tracking-widest text-center rounded-md transition-all ${
                    activeTab === "anamnese"
                      ? "bg-stone-900 text-gold-200 shadow-sm"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  1. Ficha Anamnese
                </button>
                <button
                  id="tab-btn-avaliacao"
                  onClick={() => setActiveTab("avaliacao")}
                  className={`flex-1 py-2 text-xs font-bold font-serif uppercase tracking-widest text-center rounded-md transition-all ${
                    activeTab === "avaliacao"
                      ? "bg-stone-900 text-gold-200 shadow-sm"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  2. Avaliação Técnica
                </button>
                <button
                  id="tab-btn-poscare"
                  onClick={() => setActiveTab("poscare")}
                  disabled={selectedClient.status === "aguardando_cliente"}
                  className={`flex-1 py-2 text-xs font-bold font-serif uppercase tracking-widest text-center rounded-md transition-all ${
                    activeTab === "poscare"
                      ? "bg-stone-900 text-gold-200 shadow-sm animate-pulse-once"
                      : "text-stone-500 hover:text-stone-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  }`}
                >
                  3. Pós-Atendimento IA
                </button>
              </div>

              {/* Scrollable tab pane container */}
              <div class="flex-1 overflow-y-auto pr-1 py-4">
                
                {/* TAB 1: READ-ONLY ANAMNESIS FROM CLIENT */}
                {activeTab === "anamnese" && (
                  <div className="space-y-6">
                    {selectedClient.status === "aguardando_cliente" ? (
                      <div className="py-12 text-center max-w-md mx-auto">
                        <AlertCircle className="w-12 h-12 text-gold-500 mx-auto mb-4 animate-bounce" />
                        <h4 className="font-serif text-md font-bold text-stone-900">Aguardando Ficha do Cliente</h4>
                        <p className="text-xs text-stone-600 leading-relaxed mt-2">
                          Este paciente foi cadastrado, mas ainda não realizou o preenchimento da ficha online. Envie o acesso para WhatsApp ou copie o link para que ele responda pelo celular.
                        </p>
                        
                        <div className="mt-6 p-4 bg-stone-50 rounded-xl border border-stone-200 text-left">
                          <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Link exclusivo do cliente:</label>
                          <div className="flex gap-2 items-center">
                            <input
                              id="copy-link-input-display"
                              type="text"
                              readOnly
                              value={getShareLink(selectedClient)}
                              className="bg-transparent border-none text-xxs truncate flex-1 text-gold-700 pointer-events-none"
                            />
                            <button
                              id="btn-copy-link-inside"
                              onClick={() => handleCopyLink(selectedClient)}
                              className="text-xs font-semibold px-2 py-1 bg-white hover:bg-stone-100 border rounded cursor-pointer shrink-0"
                            >
                              Copiar
                            </button>
                          </div>
                        </div>

                        <button
                          id="btn-wa-invite-inside"
                          onClick={() => handleSendWhatsApp(selectedClient)}
                          className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow cursor-pointer transition-all"
                        >
                          <MessageSquare className="w-4 h-4" /> Enviar Convite via WhatsApp
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        
                        {/* Paciente bio */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-stone-50 p-4 border border-stone-200 rounded-xl">
                          <div>
                            <span className="block text-[10px] font-semibold text-stone-400 uppercase">CPF</span>
                            <span className="text-xs font-semibold text-stone-800">{selectedClient.identificacao.cpf || "Não informado"}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-semibold text-stone-400 uppercase">Data Nascimento</span>
                            <span className="text-xs font-semibold text-stone-800">
                              {selectedClient.identificacao.dataNascimento 
                                ? new Date(selectedClient.identificacao.dataNascimento).toLocaleDateString("pt-BR")
                                : "Não informada"}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-semibold text-stone-400 uppercase">Idade / Sexo</span>
                            <span className="text-xs font-semibold text-stone-800">{selectedClient.identificacao.idade} anos / {selectedClient.identificacao.sexo}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-semibold text-stone-400 uppercase">Estado Civil</span>
                            <span className="text-xs font-semibold text-stone-800">{selectedClient.identificacao.estadoCivil}</span>
                          </div>
                          <div className="md:col-span-2">
                            <span className="block text-[10px] font-semibold text-stone-400 uppercase">E-mail</span>
                            <span className="text-xs font-semibold text-stone-800">{selectedClient.identificacao.email || "Não informado"}</span>
                          </div>
                          <div className="md:col-span-2">
                            <span className="block text-[10px] font-semibold text-stone-400 uppercase">Endereço Estático</span>
                            <span className="text-xs font-semibold text-stone-800 truncate block">{selectedClient.identificacao.endereco || "Não informado"}</span>
                          </div>
                          <div className="md:col-span-2">
                            <span className="block text-[10px] font-semibold text-stone-400 uppercase">Contato de Emergência</span>
                            <span className="text-xs font-semibold text-stone-800">{selectedClient.identificacao.contatoEmergencia || "Não informado"}</span>
                          </div>
                          <div className="md:col-span-2">
                            <span className="block text-[10px] font-semibold text-stone-400 uppercase">Telefone Emergência</span>
                            <span className="text-xs font-semibold text-stone-800">{selectedClient.identificacao.telefoneEmergencia || "Não informado"}</span>
                          </div>
                        </div>

                        {/* Queixa principal */}
                        <div className="p-4 border border-gold-200/60 bg-gold-50/20 rounded-xl">
                          <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-gold-800 mb-1 flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5 text-gold-500" /> Queixa Principal e Objetivos
                          </h4>
                          <p className="text-xs text-stone-700 leading-relaxed italic">{selectedClient.queixaPrincipal}</p>
                        </div>

                        {/* Histórico bem-estar */}
                        <div>
                          <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Histórico de Saúde & Patologia</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.keys(selectedClient.historicoSaude).map(key => {
                              if (key === "outrasCondicoes") return null;
                              const val = selectedClient.historicoSaude[key as keyof typeof selectedClient.historicoSaude];
                              if (!val) return null;
                              
                              const labels: Record<string, string> = {
                                diabetes: "Diabetes",
                                hipertensao: "Hipertensão",
                                cardiopatia: "Cardiopatia",
                                circulacao: "Insuf. Circulatória",
                                varizes: "Varizes",
                                trombose: "Histérico Trombose",
                                neuropatia: "Neuropatia",
                                osteoporose: "Osteoporose",
                                artrite: "Artrite",
                                artrose: "Artrose",
                                psoriase: "Psoríase",
                                hepatite: "Hepatite",
                                gestante: "Gestante",
                                lactante: "Lactante",
                                fumante: "Fumante",
                                etilista: "Etilista"
                              };

                              return (
                                <span key={key} className="text-[10px] px-2.5 py-1 bg-stone-900 border border-stone-950 rounded-full font-bold text-gold-100 uppercase tracking-wide">
                                  {labels[key] || key}
                                </span>
                              );
                            })}
                            {!Object.values(selectedClient.historicoSaude).some(v => v === true) && (
                              <span className="text-xs text-stone-400 italic">Sem anomalias clínicas ativas mapeadas.</span>
                            )}
                          </div>
                          
                          {selectedClient.historicoSaude.outrasCondicoes && (
                            <div className="mt-3 bg-stone-50 border border-stone-200 p-2.5 rounded-lg text-xs">
                              <strong>Outras observações de saúde:</strong> {selectedClient.historicoSaude.outrasCondicoes}
                            </div>
                          )}
                        </div>

                        {/* Medicamentos e hábitos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-3.5 bg-stone-50/50 border border-stone-200 rounded-xl">
                            <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-stone-600 mb-2 font-semibold">Medicamentos & Alergias</h4>
                            
                            <div className="space-y-2 text-xs">
                              <div>
                                <span className="text-stone-400">Medicamento Contínuo:</span>{" "}
                                <strong>{selectedClient.medicamentosAlergias.usoMedicamentos === "sim" ? selectedClient.medicamentosAlergias.quaisMedicamentos : "Não utiliza"}</strong>
                              </div>
                              <div>
                                <span className="text-stone-400">Possui Alergias:</span>{" "}
                                <strong className="text-rose-600">{selectedClient.medicamentosAlergias.alergias === "sim" ? selectedClient.medicamentosAlergias.quaisAlergias : "Nenhuma relatada"}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="p-3.5 bg-stone-50/50 border border-stone-200 rounded-xl">
                            <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-stone-600 mb-2 font-semibold">Hábitos & Estilo de Vida</h4>
                            
                            <div className="space-y-2 text-xs">
                              <div>
                                <span className="text-stone-400">Atividade Física:</span>{" "}
                                <strong>{selectedClient.habitosRotina.praticaAtividadeFisica === "sim" ? `${selectedClient.habitosRotina.qualAtividadeFisica} (${selectedClient.habitosRotina.frequenciaAtividadeFisica})` : "Sedarismo/Inativo"}</strong>
                              </div>
                              <div>
                                <span className="text-stone-400">Usa bota regulamentar/epi:</span>{" "}
                                <strong>{selectedClient.habitosRotina.calcadoSeguranca === "sim" ? "Sim (Faz uso de biqueira rígida)" : "Não"}</strong>
                              </div>
                              <div className="truncate">
                                <span className="text-stone-400">Calçado majoritário:</span>{" "}
                                <strong title={selectedClient.habitosRotina.tipoCalcadoMaisUtilizado}>{selectedClient.habitosRotina.tipoCalcadoMaisUtilizado || "N/D"}</strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Paciente Signature displaying */}
                        {selectedClient.assinaturaPaciente && (
                          <div className="border border-stone-200 rounded-xl p-4 max-w-sm">
                            <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Assinatura Digital do Paciente</span>
                            <div className="bg-stone-50 rounded p-1.5 flex items-center justify-center border border-stone-100 h-28">
                              <img src={selectedClient.assinaturaPaciente} alt="Assinatura Paciente" className="max-h-full max-w-full object-contain pointer-events-none" />
                            </div>
                            <span className="text-[9px] text-stone-400 mt-1 block">Registrado com carimbo de tempo em {new Date(selectedClient.assinaturaPacienteData).toLocaleString("pt-BR")}</span>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: TECHNICAL CLINICAL VALUATION FORM */}
                {activeTab === "avaliacao" && (
                  <form onSubmit={handleAvaliacaoSubmit} className="space-y-6">
                    
                    {/* Unhas status selections */}
                    <div className="p-4 border border-stone-200 rounded-xl bg-stone-50/20">
                      <h4 className="font-serif text-xs font-bold text-stone-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-stone-100 pb-2 mb-3">
                         Mapeamento de Saúde das Unhas
                      </h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                        {[
                          { field: "unhasSaudaveis", label: "Saudáveis" },
                          { field: "unhasEspessadas", label: "Espessadas" },
                          { field: "unhasMicose", label: "Micose" },
                          { field: "unhasDescolamento", label: "Descolamento" },
                          { field: "unhasEncravada", label: "Encravada" }
                        ].map(chk => (
                          <label 
                            key={chk.field} 
                            className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                              avaliacao[chk.field as keyof AvaliacaoTecnica]
                                ? "bg-stone-900 text-gold-100 border-stone-950 font-semibold"
                                : "bg-stone-50 text-stone-600 border-stone-200/70 hover:bg-stone-100/30"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={avaliacao[chk.field as keyof AvaliacaoTecnica] as boolean}
                              onChange={() => setAvaliacao(prev => ({
                                ...prev,
                                [chk.field]: !prev[chk.field as keyof AvaliacaoTecnica],
                                // If selecting healthy, unselect others automatically or vice versa
                                ...(chk.field === "unhasSaudaveis" && !prev.unhasSaudaveis ? {
                                  unhasEspessadas: false,
                                  unhasMicose: false,
                                  unhasDescolamento: false,
                                  unhasEncravada: false,
                                } : chk.field !== "unhasSaudaveis" ? { unhasSaudaveis: false } : {})
                              }))}
                              className="sr-only"
                            />
                            {chk.label}
                          </label>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-stone-500 uppercase">Observações Clínicas das Unhas</label>
                        <textarea
                          id="input-unhas-obs"
                          rows={2}
                          value={avaliacao.unhasObservacoes}
                          onChange={e => setAvaliacao(prev => ({ ...prev, unhasObservacoes: e.target.value }))}
                          placeholder="Notas ungueais detalhadas..."
                          className="w-full text-xs p-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Pele plantar selections */}
                    <div className="p-4 border border-stone-200 rounded-xl bg-stone-50/20 col-span-2">
                      <h4 className="font-serif text-xs font-bold text-stone-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-stone-100 pb-2 mb-3">
                         Mapeamento de Saúde da Pele Plantar
                      </h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                        {[
                          { field: "peleIntegra", label: "Íntegra" },
                          { field: "peleRessecada", label: "Ressecada / Xerose" },
                          { field: "peleFissuras", label: "Fissuras / Rachaduras" },
                          { field: "peleCalosidade", label: "Calosidade" },
                          { field: "peleHiperqueratose", label: "Hiperqueratose" },
                          { field: "peleVerruga", label: "Verruga Plantar" }
                        ].map(chk => (
                          <label 
                            key={chk.field} 
                            className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs cursor-pointer transition-all text-center justify-center ${
                              avaliacao[chk.field as keyof AvaliacaoTecnica]
                                ? "bg-stone-900 text-gold-100 border-stone-950 font-semibold"
                                : "bg-stone-50 text-stone-600 border-stone-200/70 hover:bg-stone-100/30"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={avaliacao[chk.field as keyof AvaliacaoTecnica] as boolean}
                              onChange={() => setAvaliacao(prev => ({
                                ...prev,
                                [chk.field]: !prev[chk.field as keyof AvaliacaoTecnica],
                                // Auto healthy swap
                                ...(chk.field === "peleIntegra" && !prev.peleIntegra ? {
                                  peleRessecada: false,
                                  peleFissuras: false,
                                  peleCalosidade: false,
                                  peleHiperqueratose: false,
                                  peleVerruga: false
                                } : chk.field !== "peleIntegra" ? { peleIntegra: false } : {})
                              }))}
                              className="sr-only"
                            />
                            {chk.label}
                          </label>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-stone-500 uppercase">Observações Clínicas Cutâneas</label>
                        <textarea
                          id="input-pele-obs"
                          rows={2}
                          value={avaliacao.peleObservacoes}
                          onChange={e => setAvaliacao(prev => ({ ...prev, peleObservacoes: e.target.value }))}
                          placeholder="Notas dermatológicas detalhadas..."
                          className="w-full text-xs p-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Sensibilidade e Circulação */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="p-4 border border-stone-200 rounded-xl bg-stone-50/20">
                        <h4 className="font-serif text-xs font-bold text-stone-800 uppercase tracking-widest mb-1.5">Sensibilidade</h4>
                        <div className="flex gap-4 mb-3">
                          {[
                            { value: "preservada", label: "Preservada" },
                            { value: "reduzida", label: "Reduzida" },
                            { value: "ausente", label: "Ausente" }
                          ].map(opt => (
                            <label key={opt.value} className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                              <input
                                type="radio"
                                name="sensibilidadeRadio"
                                checked={avaliacao.sensibilidade === opt.value}
                                onChange={() => setAvaliacao(prev => ({ ...prev, sensibilidade: opt.value as any }))}
                                className="accent-stone-900"
                              /> {opt.label}
                            </label>
                          ))}
                        </div>
                        <input
                          id="input-sens-obs"
                          type="text"
                          value={avaliacao.sensibilidadeObservacoes}
                          onChange={e => setAvaliacao(prev => ({ ...prev, sensibilidadeObservacoes: e.target.value }))}
                          placeholder="Observações do teste com monofilamento..."
                          className="w-full text-xs p-2 bg-stone-50 border border-stone-200 rounded-lg"
                        />
                      </div>

                      <div className="p-4 border border-stone-200 rounded-xl bg-stone-50/20">
                        <h4 className="font-serif text-xs font-bold text-stone-800 uppercase tracking-widest mb-1.5">Circulação Geral</h4>
                        <div className="flex gap-4 mb-3">
                          {[
                            { value: "normal", label: "Normal (Pulsos pediosos palpáveis)" },
                            { value: "alterada", label: "Alterada (Isquemia local/Edema)" }
                          ].map(opt => (
                            <label key={opt.value} className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                              <input
                                type="radio"
                                name="circRadio"
                                checked={avaliacao.circulacaoVal === opt.value}
                                onChange={() => setAvaliacao(prev => ({ ...prev, circulacaoVal: opt.value as any }))}
                                className="accent-stone-900"
                              /> {opt.label}
                            </label>
                          ))}
                        </div>
                        <input
                          id="input-circ-obs"
                          type="text"
                          value={avaliacao.circulacaoObservacoes}
                          onChange={e => setAvaliacao(prev => ({ ...prev, circulacaoObservacoes: e.target.value }))}
                          placeholder="Observações do sistema circulatório..."
                          className="w-full text-xs p-2 bg-stone-50 border border-stone-200 rounded-lg"
                        />
                      </div>

                    </div>

                    {/* Avaliação dos pés (Pé direito / Pé esquerdo) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="p-4 border border-stone-200 rounded-xl bg-stone-50/20">
                        <h4 className="font-serif text-xs font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-1.5 mb-2.5">
                          PÉ DIREITO (Laudo Clínico)
                        </h4>
                        <textarea
                          id="input-foot-right"
                          rows={3}
                          value={avaliacao.peDireito}
                          onChange={e => setAvaliacao(prev => ({ ...prev, peDireito: e.target.value }))}
                          placeholder="Preencha os cuidados específicos realizados no pé direito..."
                          className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div className="p-4 border border-stone-200 rounded-xl bg-stone-50/20">
                        <h4 className="font-serif text-xs font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-1.5 mb-2.5">
                          PÉ ESQUERDO (Laudo Clínico)
                        </h4>
                        <textarea
                          id="input-foot-left"
                          rows={3}
                          value={avaliacao.peEsquerdo}
                          onChange={e => setAvaliacao(prev => ({ ...prev, peEsquerdo: e.target.value }))}
                          placeholder="Preencha os cuidados específicos realizados no pé esquerdo..."
                          className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                        />
                      </div>

                    </div>

                    {/* Geral obs */}
                    <div className="p-4 border border-stone-200 rounded-xl bg-stone-50/20">
                      <h4 className="font-serif text-xs font-bold text-stone-900 uppercase tracking-widest mb-1.5">Observações Gerais de Diagnóstico</h4>
                      <textarea
                        id="input-obs-genericas"
                        rows={2}
                        value={avaliacao.observacoesGerais}
                        onChange={e => setAvaliacao(prev => ({ ...prev, observacoesGerais: e.target.value }))}
                        placeholder="Quaisquer advertências extras ou recomendações de rotina..."
                        className="w-full text-xs p-2 bg-stone-50 border border-stone-200 rounded-lg"
                      />
                    </div>

                    {/* Denise Digital Signature Stamp */}
                    <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/10">
                      <h4 className="font-serif text-xs font-bold text-stone-900 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <PenTool className="w-4 h-4 text-stone-700" /> Assinatura Eletrônica da Profissional
                      </h4>
                      
                      <SignatureCanvas
                        savedSignature={assinaturaProfissional}
                        onSave={base64 => setAssinaturaProfissional(base64)}
                        placeholderText="Assinatura da Dra. Denise Ferreira"
                      />
                    </div>

                    {/* Submit footer button */}
                    <div className="border-t border-stone-100 pt-4 flex justify-end">
                      <button
                        id="btn-save-evaluation"
                        type="submit"
                        className="px-6 py-2.5 rounded-lg bg-stone-900 text-gold-200 hover:bg-stone-850 hover:text-gold-100 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        Salvar e Concluir Avaliação Técnica
                      </button>
                    </div>

                  </form>
                )}

                {/* TAB 3: SMART CARE AI RECOMMENDATION INTERFACES */}
                {activeTab === "poscare" && (
                  <div className="space-y-6">
                    
                    {/* Input manual procedural background */}
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl">
                      <h4 className="font-serif text-xs font-bold text-stone-900 uppercase tracking-widest mb-1">
                        Resumo Técnico das Atividades Realizadas Hoje
                      </h4>
                      <p className="text-[10px] text-stone-400 mb-2">Descreva de forma curta o que fez clínica hoje para embasar a dedução das dicas do Gemini.</p>
                      
                      <textarea
                        id="input-manual-treatment-recap"
                        rows={2}
                        value={resumoManual}
                        onChange={e => setResumoManual(e.target.value)}
                        placeholder="Ex: Realizei onicoplastia corretiva com fresas cirúrgicas, assepsia local profunda e massagem estimulante com óleos essenciais terapêuticos."
                        className="w-full text-xs p-2 bg-stone-50/20 border border-stone-200 rounded-lg focus:bg-white"
                      />

                      <div className="mt-3 flex justify-end">
                        <button
                          id="btn-trigger-ai-recommendations"
                          type="button"
                          onClick={triggerAICareGeneration}
                          disabled={generatingCare}
                          className="px-4 py-2 rounded-lg bg-stone-900 text-gold-200 hover:bg-stone-850 hover:text-gold-100 text-xs font-bold shadow inline-flex items-center gap-1.5 active:scale-95 disabled:bg-stone-400 cursor-pointer"
                        >
                          {generatingCare ? (
                            <>
                              <span className="w-3 h-3 border-2 border-stone-100 border-t-stone-800 rounded-full animate-spin"></span>
                              Processando laudo clínico do Gemini...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-gold-300 animate-pulse" /> Gerar Plano e Cuidados Inteligentes (IA)
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Display generator container */}
                    {selectedClient.posCare ? (
                      <div className="space-y-6">
                        
                        {/* 1. visual care card (Cartao de Cuidados) */}
                        <div id="visual-homecare-layout" className="bg-white border-2 border-gold-200 rounded-2xl overflow-hidden shadow-md">
                          
                          {/* Card header */}
                          <div className="bg-stone-950 p-4 border-b border-gold-400/20 flex justify-between items-center text-stone-100">
                            <div>
                              <span className="text-[8px] bg-gold-500 text-stone-950 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Cartão de Cuidados Especializados</span>
                              <h3 className="font-serif text-sm font-semibold text-gold-200 mt-1">Dra. Denise Ferreira • Home Care</h3>
                            </div>
                            <DeniseLogo size="sm" variant="gold" />
                          </div>

                          {/* Card body */}
                          <div className="p-5 space-y-4">
                            <div>
                              <span className="text-[10px] text-stone-400 font-semibold uppercase">Procedimento Realizado</span>
                              <p className="text-xs text-stone-800 leading-relaxed font-semibold mt-0.5">{selectedClient.posCare.resumoProcedimento}</p>
                            </div>

                            <div className="h-px bg-stone-100" />

                            <div>
                              <span className="text-[10px] text-stone-400 font-semibold uppercase block mb-1">Dicas e Receitas Recomendadas para Casa (Orientação IA)</span>
                              
                              {/* Parse simplified structure */}
                              <div className="text-xs text-stone-700 space-y-2 prose prose-xs max-w-none text-justify">
                                {selectedClient.posCare.orientacoesHomeCare.split("\n").map((line, ix) => {
                                  if (line.startsWith("*") || line.startsWith("-")) {
                                    return <p key={ix} className="pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-gold-500 font-medium">{line.replace(/^[-*]\s*/, "")}</p>;
                                  }
                                  if (line.startsWith("###")) {
                                    return <h5 key={ix} className="font-serif font-bold text-xs uppercase tracking-wide text-gold-800 mt-2">{line.replace(/^###\s*/, "")}</h5>;
                                  }
                                  return <p key={ix}>{line}</p>;
                                })}
                              </div>
                            </div>

                            <div className="h-px bg-stone-100" />

                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-[10px] text-stone-400 font-semibold uppercase">Próxima Visita Preventiva</span>
                                <p className="font-bold text-stone-800 flex items-center gap-1.5 mt-0.5">
                                  <Calendar className="w-4 h-4 text-stone-400" /> {selectedClient.posCare.dataRetornoRecomendada}
                                </p>
                              </div>
                              <div className="text-right flex flex-col justify-end">
                                <span className="text-[9px] text-stone-400">Canal Atendimento Humanizado</span>
                                <span className="text-[10px] font-bold text-gold-600">deniseferreiramarketing@gmail.com</span>
                              </div>
                            </div>

                          </div>

                        </div>

                        {/* Print PDF Card Button */}
                        <div className="flex flex-wrap justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => window.open(window.location.origin + `?print_card=${selectedClient.id}`, "_blank")}
                            className="px-4 py-2 border-2 border-gold-200/80 hover:bg-stone-50 text-stone-800 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer font-sans"
                          >
                            <Printer className="w-4 h-4 text-gold-600" /> Gerar Cartão em PDF (Dra. Denise Ferreira)
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const cleanPhone = selectedClient.identificacao.whatsapp || selectedClient.identificacao.telefone.replace(/\D/g, "");
                              const cname = selectedClient.identificacao.nomeCompleto.split(" ")[0];
                              const cardLink = window.location.origin + `?print_card=${selectedClient.id}`;
                              const text = `Olá, ${cname}! ✨ Preparei o seu *Cartão de Cuidados Especializados e Plano de Home Care Personalizado*. 

Você pode acessar, visualizar e salvar o seu cartão oficial em formato PDF com o link abaixo:
${cardLink}

Cuidar de você é a nossa prioridade! 👣

Denise Ferreira
Enfermagem - Podologia - Estética`;
                              window.open(`https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(text)}`, "_blank");
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer font-sans"
                          >
                            <MessageSquare className="w-4 h-4" /> Enviar PDF do Cartão via WhatsApp
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const cleanPhone = selectedClient.identificacao.whatsapp || selectedClient.identificacao.telefone.replace(/\D/g, "");
                              const text = getLembreteMsgTemplate(
                                selectedClient.identificacao.nomeCompleto,
                                nextAppointmentDate,
                                nextAppointmentTime
                              );
                              window.open(`https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(text)}`, "_blank");
                            }}
                            className="px-4 py-2 bg-stone-900 border border-stone-950 hover:bg-stone-800 text-gold-100 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer font-sans"
                          >
                            <Calendar className="w-4 h-4 text-gold-300" /> Enviar Agendamento via WhatsApp
                          </button>
                        </div>

                        {/* 2. WhatsApp quick text Selector and Dual Trigger Dispatch panel */}
                        <div className="p-5 bg-gradient-to-b from-stone-50 to-stone-100/55 border border-stone-200 rounded-2xl">
                          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                            <h4 className="font-serif text-xs font-bold text-stone-900 uppercase tracking-widest flex items-center gap-1.5">
                              <MessageSquare className="w-4 h-4 text-emerald-600" /> Canal WhatsApp • Disparo de Mensagem Especializada
                            </h4>
                            
                            {/* Mode Toggle Button Set */}
                            <div className="flex bg-stone-200 p-1 rounded-xl">
                              <button
                                type="button"
                                onClick={() => setWaMode("pos")}
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${
                                  waMode === "pos"
                                    ? "bg-stone-900 text-gold-100 shadow-sm"
                                    : "text-stone-500 hover:text-stone-800"
                                }`}
                              >
                                Pós-Consulta
                              </button>
                              <button
                                type="button"
                                onClick={() => setWaMode("lembrete")}
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${
                                  waMode === "lembrete"
                                    ? "bg-stone-900 text-gold-100 shadow-sm"
                                    : "text-stone-500 hover:text-stone-800"
                                }`}
                              >
                                Lembrar Próxima
                              </button>
                            </div>
                          </div>

                          {/* Dynamic calendar inputs for scheduling message */}
                          {waMode === "lembrete" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-4 bg-white border border-stone-200/70 rounded-xl shadow-inner">
                              <div>
                                <label className="block text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-1">Preencher Data para Consulta:</label>
                                <input
                                  type="date"
                                  value={nextAppointmentDate}
                                  onChange={e => setNextAppointmentDate(e.target.value)}
                                  className="w-full text-xs p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-300 bg-stone-50/30"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-1">Preencher Horário:</label>
                                <input
                                  type="time"
                                  value={nextAppointmentTime}
                                  onChange={e => setNextAppointmentTime(e.target.value)}
                                  className="w-full text-xs p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-300 bg-stone-50/30"
                                />
                              </div>
                            </div>
                          )}

                          <p className="text-[10px] text-stone-400 mb-3 leading-relaxed">
                            {waMode === "pos"
                              ? "A mensagem de pós-consulta foi gerada automaticamente de acordo com as diretrizes e a unha do paciente."
                              : "Preencha a data e o horário agendados no painel superior para preencher automaticamente o convite."
                            } Você pode revisar ou editar o texto final logo abaixo:
                          </p>
                          
                          <textarea
                            id="edit-whatsapp-ready-text-v2"
                            rows={8}
                            value={customMessageText}
                            onChange={e => setCustomMessageText(e.target.value)}
                            className="w-full text-xs p-3.5 font-mono bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-gold-300 focus:outline-none leading-relaxed"
                          />

                          <div className="mt-4 flex flex-wrap justify-between items-center gap-3">
                            <span className="text-xxs text-stone-400 italic">Disparo por WebLink direto para WhatsApp Web ou Mobile.</span>
                            
                            <button
                              id="btn-dispatch-custom-wa-v2"
                              type="button"
                              onClick={() => {
                                const cleanPhone = selectedClient.identificacao.whatsapp || selectedClient.identificacao.telefone.replace(/\D/g, "");
                                window.open(`https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(customMessageText)}`, "_blank");
                              }}
                              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 inline-flex items-center gap-2 cursor-pointer font-sans"
                            >
                              <MessageSquare className="w-4 h-4" /> Enviar Mensagem para o Paciente
                            </button>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="py-12 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-xl flex flex-col items-center gap-2 max-w-sm mx-auto">
                        <Sparkles className="w-8 h-8 text-gold-300 animate-pulse" />
                        Nenhum plano pós-atendimento inteligente gerado. Clique no botão "Gerar Plano" acima para acionar a IA.
                      </div>
                    )}

                  </div>
                )}

              </div>

            </div>
          ) : (
            <div class="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
              <ClipboardList class="w-16 h-16 text-stone-200 mb-4 stroke-[1.25]" />
              <h3 class="font-serif text-lg font-semibold text-stone-700">Central de Prontuários e Anamneses</h3>
              <p class="text-xs text-stone-500 leading-relaxed mt-2">
                Navegue no painel de pacientes à esquerda e selecione um registro ativo para preencher avaliações clínicas, emitir laudos, ou ler o histórico do cliente.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* POPUP POPUP MODAL: CREATE RECORD / ENVIAR LINK PRÉ-CONSULTA */}
      {showInviteModal && (
        <div id="invite-client-modal" class="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl border border-stone-200 p-6 max-w-md w-full relative">
            <h3 class="font-serif text-base font-bold text-stone-900 mb-1 flex items-center gap-2">
              <UserPlus class="w-5 h-5 text-gold-600" /> Cadastrar Novo Paciente
            </h3>
            <p class="text-xxs text-stone-400 mb-4">Isto criará um prontuário no banco de dados e gerará um link único para que o cliente preencha antes da sessão.</p>

            <form onSubmit={handleInviteSubmit} class="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Nome Completo do Paciente *</label>
                <input
                  id="modal-patient-name"
                  type="text"
                  required
                  placeholder="Nome do cliente"
                  value={newNome}
                  onChange={e => setNewNome(e.target.value)}
                  className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Telefone / WhatsApp</label>
                <input
                  id="modal-patient-phone"
                  type="tel"
                  placeholder="Ex: (11) 99999-9999"
                  value={newTelefone}
                  onChange={e => setNewTelefone(e.target.value)}
                  className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">E-mail (opcional)</label>
                <input
                  id="modal-patient-email"
                  type="email"
                  placeholder="exemplo@email.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 mt-4 border-t border-stone-100">
                <button
                  id="btn-close-modal"
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-500 hover:bg-stone-50 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-submit-modal"
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-900 text-gold-100 hover:bg-stone-850 cursor-pointer shadow"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL: DELETE PATIENT */}
      {clientToDelete && (
        <div id="delete-confirm-modal" className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 max-w-sm w-full relative shadow-xl transform transition-all">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Trash2 className="w-6 h-6 text-rose-600 animate-pulse" />
            </div>
            
            <h3 className="font-serif text-center text-base font-semibold text-stone-900 mb-2">
              Confirmar Exclusão de Paciente
            </h3>
            
            <p className="text-center text-xs text-stone-500 leading-relaxed mb-6">
              Tem certeza que deseja remover os dados cadastrais e todo o histórico clínico de <strong className="text-stone-850 font-bold">{clientToDelete.identificacao.nomeCompleto}</strong>? Esta ação é <span className="text-rose-600 font-bold">irreversível</span>.
            </p>

            <div className="flex gap-2.5 justify-center">
              <button
                id="btn-cancel-delete"
                type="button"
                onClick={() => setClientToDelete(null)}
                className="flex-1 px-4 py-2 text-xs font-semibold text-stone-500 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-delete"
                type="button"
                onClick={() => handleDeleteClient(clientToDelete.id)}
                className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-rose-650 hover:bg-rose-700 bg-rose-600 rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED PRINT VIEW - SHOWN EXCLUSIVELY ON print LAYOUTS */}
      {selectedClient && (
        <div id="print-layout-report" className="hidden print:block print:bg-white print:text-stone-900 p-8 text-xs leading-relaxed">
          
          {/* Header */}
          <div className="text-center pb-6 border-b-2 border-stone-800 mb-6 flex justify-between items-center">
            <div className="text-left">
              <h1 className="font-serif text-xl font-bold tracking-widest text-stone-900">DENISE FERREIRA</h1>
              <p className="text-[9px] uppercase tracking-widest font-semibold text-stone-500">Atendimento Humanizado • Podologia • Estética • Enfermagem</p>
              <p className="text-[8px] text-stone-400 mt-0.5">deniseferreiramarketing@gmail.com</p>
            </div>
            <div className="text-right border-l pl-4 border-stone-200">
              <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-stone-800">Prontuário de Anamnese Integrada</h2>
              <p className="text-[9px] text-stone-400 font-semibold mt-1">Data: {new Date().toLocaleDateString("pt-BR")}</p>
            </div>
          </div>

          <div className="space-y-6">
            
            {/* Sec 1: Paciente */}
            <div>
              <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-stone-800 border-b border-stone-300 pb-1 mb-2">1. Identificação do Paciente</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Nome Completo:</strong> {selectedClient.identificacao.nomeCompleto}</div>
                <div><strong>CPF:</strong> {selectedClient.identificacao.cpf || "N/D"}</div>
                <div><strong>Nascimento:</strong> {selectedClient.identificacao.dataNascimento ? new Date(selectedClient.identificacao.dataNascimento).toLocaleDateString("pt-BR") : "N/D"} ({selectedClient.identificacao.idade} anos)</div>
                <div><strong>Sexo:</strong> {selectedClient.identificacao.sexo}</div>
                <div><strong>Estado Civil:</strong> {selectedClient.identificacao.estadoCivil}</div>
                <div><strong>WhatsApp:</strong> {selectedClient.identificacao.telefone || "N/D"}</div>
                <div><strong>E-mail:</strong> {selectedClient.identificacao.email || "N/D"}</div>
                <div><strong>Profissão:</strong> {selectedClient.identificacao.profissao || "N/D"}</div>
              </div>
              <div className="mt-2">
                <strong>Endereço:</strong> {selectedClient.identificacao.endereco || "N/D"}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div><strong>Contato de Emergência:</strong> {selectedClient.identificacao.contatoEmergencia || "N/D"}</div>
                <div><strong>Fone do Contato:</strong> {selectedClient.identificacao.telefoneEmergencia || "N/D"}</div>
              </div>
            </div>

            {/* Sec 2: Queixa */}
            <div>
              <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-stone-800 border-b border-stone-300 pb-1 mb-2">2. Queixa Principal & Objetivos</h3>
              <p className="italic bg-stone-50 p-2 border rounded">{selectedClient.queixaPrincipal || "Nenhuma registrada."}</p>
            </div>

            {/* Sec 3: Historico */}
            <div>
              <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-stone-800 border-b border-stone-300 pb-1 mb-2">3. Histórico de Saúde & Bem-Estar</h3>
              <div className="flex flex-wrap gap-2">
                {Object.keys(selectedClient.historicoSaude).map(key => {
                  if (key === "outrasCondicoes") return null;
                  const val = selectedClient.historicoSaude[key as keyof typeof selectedClient.historicoSaude];
                  if (!val) return null;
                  return <span key={key} className="px-2 py-0.5 border border-stone-600 bg-stone-100 rounded text-[9px] uppercase font-bold">{key}</span>;
                })}
              </div>
              {selectedClient.historicoSaude.outrasCondicoes && (
                <div className="mt-2 text-stone-700"><strong>Outras condições:</strong> {selectedClient.historicoSaude.outrasCondicoes}</div>
              )}
            </div>

            {/* Sec 4: Medicamentos e hábitos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-serif text-[10px] font-bold uppercase border-b border-stone-200 pb-1 mb-1.5">4. Medicamentos e Alergias</h4>
                <p><strong>Uso Contínuo:</strong> {selectedClient.medicamentosAlergias.usoMedicamentos === "sim" ? selectedClient.medicamentosAlergias.quaisMedicamentos : "Não"}</p>
                <p><strong>Alergias:</strong> {selectedClient.medicamentosAlergias.alergias === "sim" ? selectedClient.medicamentosAlergias.quaisAlergias : "Não"}</p>
              </div>
              <div>
                <h4 className="font-serif text-[10px] font-bold uppercase border-b border-stone-200 pb-1 mb-1.5">5. Hábitos e Rotina</h4>
                <p><strong>Atividade Física:</strong> {selectedClient.habitosRotina.praticaAtividadeFisica === "sim" ? `${selectedClient.habitosRotina.qualAtividadeFisica} (${selectedClient.habitosRotina.frequenciaAtividadeFisica})` : "Não"}</p>
                <p><strong>Permanece muito em pé:</strong> {selectedClient.habitosRotina.periodosEmPe === "sim" ? "Sim" : "Não"}</p>
                <p><strong>Calçado EPI:</strong> {selectedClient.habitosRotina.calcadoSeguranca === "sim" ? "Sim" : "Não"}</p>
                <p><strong>Tipo Calçado:</strong> {selectedClient.habitosRotina.tipoCalcadoMaisUtilizado}</p>
              </div>
            </div>

            {/* Sec 5: Avaliação Tecnica */}
            {selectedClient.status === "concluido" && (
              <div>
                <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-stone-800 border-b border-stone-300 pb-1 mb-2">6. Avaliação Técnica (Profissional)</h3>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <strong>Unhas Mapeadas:</strong>{" "}
                    {[
                      selectedClient.avaliacaoTecnica.unhasSaudaveis && "saudáveis",
                      selectedClient.avaliacaoTecnica.unhasEspessadas && "espessadas",
                      selectedClient.avaliacaoTecnica.unhasMicose && "micose",
                      selectedClient.avaliacaoTecnica.unhasDescolamento && "descolamento",
                      selectedClient.avaliacaoTecnica.unhasEncravada && "encravada"
                    ].filter(Boolean).join(", ") || "Sem anomalias"}
                    {selectedClient.avaliacaoTecnica.unhasObservacoes && <p className="italic text-stone-600 mt-1">Obs: {selectedClient.avaliacaoTecnica.unhasObservacoes}</p>}
                  </div>
                  <div>
                    <strong>Pele Plantar:</strong>{" "}
                    {[
                      selectedClient.avaliacaoTecnica.peleIntegra && "íntegra",
                      selectedClient.avaliacaoTecnica.peleRessecada && "ressecada",
                      selectedClient.avaliacaoTecnica.peleFissuras && "fissuras",
                      selectedClient.avaliacaoTecnica.peleCalosidade && "calosidade",
                      selectedClient.avaliacaoTecnica.peleHiperqueratose && "hiperqueratose",
                      selectedClient.avaliacaoTecnica.peleVerruga && "verruga"
                    ].filter(Boolean).join(", ") || "Sem anomalias"}
                    {selectedClient.avaliacaoTecnica.peleObservacoes && <p className="italic text-stone-600 mt-1">Obs: {selectedClient.avaliacaoTecnica.peleObservacoes}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div><strong>Sensibilidade:</strong> {selectedClient.avaliacaoTecnica.sensibilidade} ({selectedClient.avaliacaoTecnica.sensibilidadeObservacoes || "Sem notas"})</div>
                  <div><strong>Circulação:</strong> {selectedClient.avaliacaoTecnica.circulacaoVal} ({selectedClient.avaliacaoTecnica.circulacaoObservacoes || "Sem notas"})</div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="p-2 border rounded"><strong>Atendimento Pé Direito:</strong> {selectedClient.avaliacaoTecnica.peDireito || "Práticas rotineiras realizadas."}</div>
                  <div className="p-2 border rounded"><strong>Atendimento Pé Esquerdo:</strong> {selectedClient.avaliacaoTecnica.peEsquerdo || "Práticas rotineiras realizadas."}</div>
                </div>

                <div><strong>Observações Gerais do Procedimento:</strong> {selectedClient.avaliacaoTecnica.observacoesGerais || "Nenhuma observação extra relatada."}</div>
              </div>
            )}

            {/* Sec 6: Pos care cards */}
            {selectedClient.posCare && (
              <div className="p-4 border-2 border-dashed border-stone-400 rounded bg-stone-50">
                <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-stone-850 mb-1"> Plano IA de Pós-Atendimento e Recomendações Home care</h3>
                <p className="mb-2"><strong>Recapitulado:</strong> {selectedClient.posCare.resumoProcedimento}</p>
                <div className="pl-3 border-l-2 border-stone-300">
                  {selectedClient.posCare.orientacoesHomeCare.split("\n").map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
                <p className="mt-3"><strong>Previsão de Retorno:</strong> {selectedClient.posCare.dataRetornoRecomendada}</p>
              </div>
            )}

            {/* Sec 7: Signatures side by side */}
            <div className="grid grid-cols-2 gap-12 pt-10 text-center">
              <div>
                <div className="border-b border-stone-800 w-full mb-1 h-20 flex items-center justify-center p-1">
                  {selectedClient.assinaturaPaciente && <img src={selectedClient.assinaturaPaciente} alt="Assinatura Paciente" className="max-h-full object-contain" />}
                </div>
                <span>Assinatura do Paciente</span>
                {selectedClient.assinaturaPacienteData && <p className="text-[9px] text-stone-400">Paciência declarada em: {new Date(selectedClient.assinaturaPacienteData).toLocaleDateString("pt-BR")}</p>}
              </div>

              <div>
                <div className="border-b border-stone-800 w-full mb-1 h-20 flex items-center justify-center p-1">
                  {selectedClient.assinaturaProfissional && <img src={selectedClient.assinaturaProfissional} alt="Assinatura Denise" className="max-h-full object-contain" />}
                </div>
                <span>Dra. Denise Ferreira</span>
                {selectedClient.assinaturaProfissionalData && <p className="text-[9px] text-stone-400">Laudo sanitário homologado em: {new Date(selectedClient.assinaturaProfissionalData).toLocaleDateString("pt-BR")}</p>}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
