import React, { useState, useEffect } from "react";
import { 
  Heart, User, Activity, Flame, ShieldAlert, CheckCircle, 
  HelpCircle, Calendar, Phone, Mail, Award, MapPin, Sparkles, Send, ShieldCheck, ArrowRight, ArrowLeft 
} from "lucide-react";
import SignatureCanvas from "./SignatureCanvas";
import { Cliente, PacienteIdentificacao, HistoricoSaude, MedicamentosEAlergias, HabitosERotina } from "../types";
import DeniseLogo from "./DeniseLogo";

interface AnamnesePublicViewProps {
  token: string;
  onSubmitted: () => void;
}

export default function AnamnesePublicView({ token, onSubmitted }: AnamnesePublicViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<Cliente | null>(null);
  
  // Form step navigation (0: Welcome, 1: Identification, 2: Complaint & Health, 3: Drugs & Habits, 4: Signature)
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Core interactive states matching our schemas
  const [identificacao, setIdentificacao] = useState<PacienteIdentificacao>({
    nomeCompleto: "",
    dataNascimento: "",
    idade: "",
    sexo: "Feminino",
    cpf: "",
    estadoCivil: "Solteira",
    telefone: "",
    whatsapp: "",
    email: "",
    endereco: "",
    profissao: "",
    contatoEmergencia: "",
    telefoneEmergencia: ""
  });

  const [queixaPrincipal, setQueixaPrincipal] = useState("");
  
  const [historicoSaude, setHistoricoSaude] = useState<HistoricoSaude>({
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
  });

  const [medicamentosAlergias, setMedicamentosAlergias] = useState<MedicamentosEAlergias>({
    usoMedicamentos: "",
    quaisMedicamentos: "",
    alergias: "",
    quaisAlergias: ""
  });

  const [habitosRotina, setHabitosRotina] = useState<HabitosERotina>({
    praticaAtividadeFisica: "",
    qualAtividadeFisica: "",
    frequenciaAtividadeFisica: "",
    periodosEmPe: "",
    calcadoSeguranca: "",
    tipoCalcadoMaisUtilizado: ""
  });

  const [assinaturaPaciente, setAssinaturaPaciente] = useState("");

  useEffect(() => {
    // Load client structure from API to prefill any default name/phone from invitation
    async function fetchClient() {
      try {
        setLoading(true);
        const res = await fetch(`/api/clientes/${encodeURIComponent(token)}`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Link inválido ou expirado. Verifique com a Dra. Denise.");
        }
        const data: Cliente = await res.json();
        setClient(data);
        
        // Prefill default fields from invitation if present
        if (data.identificacao) {
          setIdentificacao(prev => ({
            ...prev,
            nomeCompleto: data.identificacao.nomeCompleto || "",
            telefone: data.identificacao.telefone || "",
            whatsapp: data.identificacao.whatsapp || prev.whatsapp,
            email: data.identificacao.email || ""
          }));
        }

        // If patient has already completed this, we can show thank you or warning
        if (data.status !== "aguardando_cliente") {
          setSuccess(true);
        }
      } catch (err: any) {
        setError(err.message || "Erro desconhecido ao carregar a ficha.");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchClient();
    }
  }, [token]);

  const handleInputChange = (field: keyof PacienteIdentificacao, value: string) => {
    setIdentificacao(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate age if birthday changes
      if (field === "dataNascimento" && value) {
        try {
          const birthDate = new Date(value);
          if (!isNaN(birthDate.getTime())) {
            const tempAge = new Date().getFullYear() - birthDate.getFullYear();
            updated.idade = tempAge.toString();
          }
        } catch {}
      }
      return updated;
    });
  };

  const toggleHealthCheckbox = (field: keyof Omit<HistoricoSaude, "outrasCondicoes">) => {
    setHistoricoSaude(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSaveAndNext = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Simple page validations
    if (step === 1) {
      if (!identificacao.nomeCompleto.trim()) {
        alert("Por favor, informe seu nome completo.");
        return;
      }
      if (!identificacao.telefone.trim()) {
        alert("Por favor, preencha o campo de telefone para contato.");
        return;
      }
    }

    if (step === 2) {
      if (!queixaPrincipal.trim()) {
        alert("Por favor, descreva brevemente o motivo da consulta ou queixa principal.");
        return;
      }
    }

    if (step === 4) {
      if (!assinaturaPaciente) {
        alert("Por favor, realize a sua assinatura na tela para enviar.");
        return;
      }
      
      // Submit full form to backend
      try {
        setSaving(true);
        const response = await fetch(`/api/clientes/${client?.id}/cliente-preenchimento`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identificacao,
            queixaPrincipal,
            historicoSaude,
            medicamentosAlergias,
            habitosRotina,
            assinaturaPaciente
          })
        });

        if (!response.ok) {
          throw new Error("Falha ao salvar seus dados. Tente novamente.");
        }

        setSuccess(true);
      } catch (err: any) {
        alert(err.message || "Erro no envio");
      } finally {
        setSaving(false);
      }
      return;
    }

    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => Math.max(0, prev - 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7F5] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Abstract Mesh Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#E8D8C3] rounded-full mix-blend-multiply filter blur-[80px] opacity-40"></div>
          <div className="absolute bottom-[0%] right-[-5%] w-[400px] h-[400px] bg-[#C9D7D8] rounded-full mix-blend-multiply filter blur-[100px] opacity-40"></div>
        </div>
        
        <div className="relative z-10 bg-white/40 backdrop-blur-xl rounded-3xl p-8 border border-white/60 max-w-sm w-full shadow-xl shadow-[#8E7D6F]/5">
          <div className="w-12 h-12 border-4 border-white/40 border-t-[#8E7D6F] rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="font-serif text-lg text-[#4A4440] font-medium leading-tight">Carregando sua ficha...</p>
          <p className="text-xs text-[#8E7D6F] mt-2 font-semibold">Dra. Denise Ferreira • Saúde e Estética</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F9F7F5] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Abstract Mesh Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#E8D8C3] rounded-full mix-blend-multiply filter blur-[80px] opacity-40"></div>
          <div className="absolute bottom-[0%] right-[-5%] w-[400px] h-[400px] bg-[#C9D7D8] rounded-full mix-blend-multiply filter blur-[100px] opacity-40"></div>
        </div>

        <div className="relative z-10 bg-white/40 backdrop-blur-xl rounded-2xl max-w-md w-full p-8 text-center border border-white/60 shadow-xl">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4 border border-rose-100 mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-xl font-semibold text-[#4A4440] mb-2">Ops! Acesso não localizado</h3>
          <p className="text-sm text-stone-600 mb-6">{error}</p>
          <div className="text-xs text-[#8E7D6F] p-3.5 bg-white/50 border border-white/80 rounded-xl">
            Se o problema persistir, solicite um novo link exclusivo à Dra. Denise.
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F9F7F5] flex items-center justify-center p-4 sm:p-6 md:p-10 relative overflow-hidden">
        {/* Abstract Mesh Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#E8D8C3] rounded-full mix-blend-multiply filter blur-[80px] opacity-40"></div>
          <div className="absolute bottom-[0%] right-[-5%] w-[600px] h-[600px] bg-[#C9D7D8] rounded-full mix-blend-multiply filter blur-[100px] opacity-40"></div>
        </div>

        <div id="anamnese-success-card" className="relative z-10 bg-white/40 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-lg w-full text-center border border-white/60 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E8D8C3] via-[#8E7D6F] to-[#C9D7D8]"></div>
          
          {/* Denise's Gold Logo */}
          <DeniseLogo size="xl" variant="gold" className="mx-auto mb-6 mt-2" />

          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4 border border-emerald-100">
            <CheckCircle className="w-6 h-6" />
          </div>

          <h2 className="font-serif text-2xl font-semibold text-[#4A4440] mb-3">Tudo Pronto! Ficha Enviada</h2>
          <p className="text-sm text-stone-600 leading-relaxed mb-6">
            Olá, <strong className="text-[#4A4440]">{identificacao.nomeCompleto || "Paciente"}</strong>. Suas informações de bem-estar foram recebidas de forma criptografada. Dra. Denise Ferreira já tem acesso completo no sistema profissional para planejar sua sessão de atendimento.
          </p>

          <div className="p-4 bg-white/50 border border-white/80 rounded-2xl mb-6 text-left shadow-sm">
            <h4 className="font-serif text-xs font-semibold text-[#8E7D6F] uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Atendimento Humanizado
            </h4>
            <p className="text-xs text-stone-600">
              Cuidamos de você antes mesmo de entrar em nossa sala. Obrigado pela colaboração!
            </p>
          </div>

          <p className="text-xs text-[#8E7D6F]">Você já pode fechar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F5] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-[#E8D8C3]">
      
      {/* Abstract Mesh Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-[#E8D8C3] rounded-full mix-blend-multiply filter blur-[100px] opacity-40"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] bg-[#C9D7D8] rounded-full mix-blend-multiply filter blur-[120px] opacity-40"></div>
        <div className="absolute top-[30%] right-[10%] w-[500px] h-[500px] bg-[#F2E1E1] rounded-full mix-blend-multiply filter blur-[90px] opacity-35"></div>
      </div>

      {/* Brand Elegant Header */}
      <div className="max-w-2xl mx-auto text-center mb-8 relative z-10 font-[Cinzel]">
        <DeniseLogo size="xl" variant="gold" className="mb-3" />
        <h1 className="font-serif text-2xl font-medium tracking-tight text-[#4A4440]">DENISE FERREIRA</h1>
        <p className="text-[10px] text-[#8E7D6F] uppercase tracking-widest font-semibold mt-1">
          Enfermagem • Podologia • Estética de Alta Performance
        </p>
        <div className="h-px bg-white/60 mt-4 max-w-xs mx-auto"></div>
      </div>

      {/* Main Form Stepper Wizard Container */}
      <div id="anamnese-wizard-card" className="max-w-2xl mx-auto bg-white/40 backdrop-blur-xl rounded-3xl shadow-2xl shadow-[#8E7D6F]/5 border border-white/60 overflow-hidden relative z-10 transition-all duration-350">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#E8D8C3]/50">
          <div 
            className="h-full bg-gradient-to-r from-[#8E7D6F] to-[#5A7C7E] transition-all duration-300" 
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* STEP 0: WELCOME DESK SCREEN */}
        {step === 0 && (
          <div className="p-6 sm:p-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-white/80 rounded-2xl flex items-center justify-center border border-[#8E7D6F]/10 mb-6 shadow-sm shadow-[#8E7D6F]/5">
              <Heart className="w-8 h-8 text-[#8E7D6F] animate-pulse" />
            </div>
            
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-[#4A4440] mb-4">
              Seja bem-vindo(a) ao seu pré-atendimento clínico
            </h2>
            
            <p className="text-sm text-stone-600 leading-relaxed mb-6 max-w-lg">
              Para oferecer um diagnóstico sob medida e totalmente focar no seu histórico clínico de forma segura, criei esta etapa virtual. Ela possibilita um estudo prévio do seu caso antes do seu atendimento físico.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-8 max-w-lg text-left">
              <div className="p-4 bg-white/60 border border-white/80 rounded-2xl flex items-start gap-3 shadow-inner">
                <div className="p-2 bg-[#C9D7D8]/40 text-[#5A7C7E] rounded-xl shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-xs font-semibold text-[#4A4440]">Segurança de Dados</h4>
                  <p className="text-[10px] text-stone-500 mt-0.5">Processamento seguro criptografado seguindo normas éticas de saúde.</p>
                </div>
              </div>
              
              <div className="p-4 bg-white/60 border border-white/80 rounded-2xl flex items-start gap-3 shadow-inner">
                <div className="p-2 bg-[#E8D8C3]/55 text-[#8E7D6F] rounded-xl shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-xs font-semibold text-[#4A4440]">Cuidado Humano</h4>
                  <p className="text-[10px] text-stone-500 mt-0.5">Uso personalizado do seu perfil para planejar a sua conduta terapêutica.</p>
                </div>
              </div>
            </div>

            <button
              id="btn-start-anamnese"
              onClick={() => setStep(1)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-bold rounded-full bg-[#8E7D6F] text-white px-8 py-3.5 hover:bg-[#7a6a5d] shadow-lg shadow-[#8E7D6F]/20 cursor-pointer hover:scale-[1.01] transition-all duration-200"
            >
              Iniciar preenchimento da ficha <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {/* STEP 1: IDENTIFICATION */}
        {step === 1 && (
          <form onSubmit={handleSaveAndNext} className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1 px-2.5 bg-[#E8D8C3]/50 text-[#8E7D6F] rounded-xl font-bold text-xs font-serif uppercase tracking-wider">Etapa 1 de 4</div>
              <h3 className="font-serif text-lg font-semibold text-[#4A4440] flex items-center gap-2"><User className="w-5 h-5 text-[#8E7D6F]" /> Identificação do Paciente</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-[#8E7D6F] uppercase tracking-wider block mb-1.5">Nome Completo *</label>
                <input
                  id="patient-name"
                  type="text"
                  required
                  placeholder="Seu nome completo"
                  value={identificacao.nomeCompleto}
                  onChange={e => handleInputChange("nomeCompleto", e.target.value)}
                  className="w-full text-sm bg-white/50 border border-white/80 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8E7D6F] transition-all text-[#4A4440]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#8E7D6F] uppercase tracking-wider block mb-1.5">Data de Nascimento</label>
                <input
                  id="patient-birth"
                  type="date"
                  value={identificacao.dataNascimento}
                  onChange={e => handleInputChange("dataNascimento", e.target.value)}
                  className="w-full text-sm bg-white/50 border border-white/80 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8E7D6F] transition-all text-[#4A4440]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-[#8E7D6F] uppercase tracking-wider block mb-1.5">Idade</label>
                  <input
                    id="patient-age"
                    type="number"
                    value={identificacao.idade}
                    onChange={e => handleInputChange("idade", e.target.value)}
                    className="w-full text-sm bg-white/50 border border-white/80 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8E7D6F] transition-all text-[#4A4440]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#8E7D6F] uppercase tracking-wider block mb-1.5">Sexo</label>
                  <select
                    id="patient-sex"
                    value={identificacao.sexo}
                    onChange={e => handleInputChange("sexo", e.target.value)}
                    className="w-full text-sm bg-white/50 border border-white/80 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8E7D6F] transition-all text-[#4A4440]"
                  >
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#8E7D6F] uppercase tracking-wider block mb-1.5">CPF</label>
                <input
                  id="patient-cpf"
                  type="text"
                  placeholder="Ex: 000.000.000-00"
                  value={identificacao.cpf}
                  onChange={e => handleInputChange("cpf", e.target.value)}
                  className="w-full text-sm bg-white/50 border border-white/80 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8E7D6F] transition-all text-[#4A4440]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#8E7D6F] uppercase tracking-wider block mb-1.5">Estado Civil</label>
                <select
                  id="patient-civil"
                  value={identificacao.estadoCivil}
                  onChange={e => handleInputChange("estadoCivil", e.target.value)}
                  className="w-full text-sm bg-white/50 border border-white/80 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8E7D6F] transition-all text-[#4A4440]"
                >
                  <option value="Solteira">Solteiro(a)</option>
                  <option value="Casada">Casado(a)</option>
                  <option value="Divorciado">Divorciado(a)</option>
                  <option value="Viúvo">Viúvo(a)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#8E7D6F] uppercase tracking-wider block mb-1.5">Celular / WhatsApp *</label>
                <input
                  id="patient-phone"
                  type="tel"
                  required
                  placeholder="Ex: (11) 99999-9999"
                  value={identificacao.telefone}
                  onChange={e => handleInputChange("telefone", e.target.value)}
                  className="w-full text-sm bg-white/50 border border-white/80 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8E7D6F] transition-all text-[#4A4440]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#8E7D6F] uppercase tracking-wider block mb-1.5">E-mail</label>
                <input
                  id="patient-email"
                  type="email"
                  placeholder="exemplo@email.com"
                  value={identificacao.email}
                  onChange={e => handleInputChange("email", e.target.value)}
                  className="w-full text-sm bg-white/50 border border-white/80 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8E7D6F] transition-all text-[#4A4440]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-[#8E7D6F] uppercase tracking-wider block mb-1.5">Endereço Residencial</label>
                <input
                  id="patient-addr"
                  type="text"
                  placeholder="Rua, número, bairro, cidade - UF"
                  value={identificacao.endereco}
                  onChange={e => handleInputChange("endereco", e.target.value)}
                  className="w-full text-sm bg-white/50 border border-white/80 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8E7D6F] transition-all text-[#4A4440]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#8E7D6F] uppercase tracking-wider block mb-1.5">Profissão</label>
                <input
                  id="patient-job"
                  type="text"
                  placeholder="Sua ocupação principal"
                  value={identificacao.profissao}
                  onChange={e => handleInputChange("profissao", e.target.value)}
                  className="w-full text-sm bg-white/50 border border-white/80 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8E7D6F] transition-all text-[#4A4440]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-[#8E7D6F] uppercase tracking-wider block mb-1.5">Contato Emergência</label>
                  <input
                    id="patient-emg-name"
                    type="text"
                    placeholder="Nome"
                    value={identificacao.contatoEmergencia}
                    onChange={e => handleInputChange("contatoEmergencia", e.target.value)}
                    className="w-full text-sm bg-white/50 border border-white/80 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8E7D6F] transition-all text-[#4A4440]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#8E7D6F] uppercase tracking-wider block mb-1.5">Telefone</label>
                  <input
                    id="patient-emg-phone"
                    type="tel"
                    placeholder="Telefone"
                    value={identificacao.telefoneEmergencia}
                    onChange={e => handleInputChange("telefoneEmergencia", e.target.value)}
                    className="w-full text-sm bg-white/50 border border-white/80 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8E7D6F] transition-all text-[#4A4440]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-8 pt-5 border-t border-white/40">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm text-[#8E7D6F] hover:text-[#4A4440] font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              
              <button
                type="submit"
                className="px-8 py-2.5 rounded-full bg-[#8E7D6F] text-white hover:bg-[#7a6a5d] font-bold text-sm shadow-md shadow-[#8E7D6F]/10 hover:scale-[1.01] transition-all duration-200"
              >
                Próxima Etapa
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: COMPLAINT & HEALTH HISTORY */}
        {step === 2 && (
          <form onSubmit={handleSaveAndNext} className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1 px-2.5 bg-[#E8D8C3]/50 text-[#8E7D6F] rounded-xl font-bold text-xs font-serif uppercase tracking-wider">Etapa 2 de 4</div>
              <h3 className="font-serif text-lg font-semibold text-[#4A4440] flex items-center gap-2"><Activity className="w-5 h-5 text-[#8E7D6F]" /> Queixa Principal & Patologias</h3>
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-bold text-[#8E7D6F] uppercase tracking-wider block mb-1.5">
                Queixa Principal & Motivos da Consulta *
              </label>
              <textarea
                id="patient-complaint"
                required
                rows={3}
                placeholder="Por favor, descreva qual o seu desconforto, queixa ou o que levou você a buscar atendimento hoje..."
                value={queixaPrincipal}
                onChange={e => setQueixaPrincipal(e.target.value)}
                className="w-full text-sm bg-white/50 border border-white/80 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8E7D6F] transition-all text-[#4A4440] shadow-inner"
              />
            </div>

            <div className="h-px bg-white/60 my-5" />

            <div className="mb-6">
              <label className="text-[10px] font-bold text-[#8E7D6F] uppercase tracking-wider block mb-3.5 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#8E7D6F]" /> Histórico de Saúde & Patologias (Selecione todos os que possui)
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(Object.keys(historicoSaude) as Array<keyof HistoricoSaude>).map(key => {
                  if (key === "outrasCondicoes") return null;
                  
                  // Label map
                  const labels: Record<string, string> = {
                    diabetes: "Diabetes",
                    hipertensao: "Hipertensão",
                    cardiopatia: "Cardiopatia",
                    circulacao: "Circulação",
                    varizes: "Varizes",
                    trombose: "Trombose",
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

                  const isChecked = historicoSaude[key] as boolean;

                  return (
                    <label 
                      key={key} 
                      className={`flex items-center gap-2 p-3 rounded-2xl border text-xs cursor-pointer transition-all duration-200 select-none ${
                        isChecked 
                          ? "bg-[#8E7D6F] text-white border-[#8E7D6F] shadow-md shadow-[#8E7D6F]/15" 
                          : "bg-white/40 text-[#4A4440] border-white/60 hover:bg-white/80"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleHealthCheckbox(key as any)}
                        className="sr-only"
                      />
                      <span className="font-semibold">{labels[key] || key}</span>
                    </label>
                  );
                })}
              </div>

              <div className="mt-5">
                <label className="text-[10px] font-bold text-[#8E7D6F] uppercase tracking-wider block mb-1.5">Outras Condições Clínicas Relevantes</label>
                <input
                  id="patient-other-conditions"
                  type="text"
                  placeholder="Ex: alergias corriqueiras, pinos nos ossos, gota..."
                  value={historicoSaude.outrasCondicoes}
                  onChange={e => setHistoricoSaude(prev => ({ ...prev, outrasCondicoes: e.target.value }))}
                  className="w-full text-sm bg-white/50 border border-white/80 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8E7D6F] transition-all text-[#4A4440]"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-8 pt-5 border-t border-white/40">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm text-[#8E7D6F] hover:text-[#4A4440] font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              
              <button
                type="submit"
                className="px-8 py-2.5 rounded-full bg-[#8E7D6F] text-white hover:bg-[#7a6a5d] font-bold text-sm shadow-md shadow-[#8E7D6F]/10 hover:scale-[1.01] transition-all duration-200"
              >
                Próxima Etapa
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: DRUGS, ALLERGIES & HABITS */}
        {step === 3 && (
          <form onSubmit={handleSaveAndNext} className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1 px-2.5 bg-[#E8D8C3]/50 text-[#8E7D6F] rounded-xl font-bold text-xs font-serif uppercase tracking-wider">Etapa 3 de 4</div>
              <h3 className="font-serif text-lg font-semibold text-[#4A4440] flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#8E7D6F]" /> Medicamentos & Rotina</h3>
            </div>

            {/* SECT 1: MEDICAMENTOS */}
            <div className="space-y-4 mb-6">
              <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#8E7D6F] mb-3">Uso de Remédios & Alergias</h4>
              
              <div className="p-4 bg-white/60 border border-white/80 rounded-2xl shadow-sm">
                <label className="block text-sm font-semibold text-[#4A4440] mb-2">Faz uso contínuo de medicamentos?</label>
                <div className="flex gap-6 mb-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer text-[#4A4440] font-medium">
                    <input
                      type="radio"
                      name="usoMed"
                      checked={medicamentosAlergias.usoMedicamentos === "sim"}
                      onChange={() => setMedicamentosAlergias(prev => ({ ...prev, usoMedicamentos: "sim" }))}
                      className="accent-[#8E7D6F] w-4 h-4"
                    /> Sim
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer text-[#4A4440] font-medium">
                    <input
                      type="radio"
                      name="usoMed"
                      checked={medicamentosAlergias.usoMedicamentos === "nao"}
                      onChange={() => setMedicamentosAlergias(prev => ({ ...prev, usoMedicamentos: "nao", quaisMedicamentos: "" }))}
                      className="accent-[#8E7D6F] w-4 h-4"
                    /> Não
                  </label>
                </div>
                {medicamentosAlergias.usoMedicamentos === "sim" && (
                  <input
                    id="patient-meds"
                    type="text"
                    required
                    placeholder="Quais remédios e dosagem?"
                    value={medicamentosAlergias.quaisMedicamentos}
                    onChange={e => setMedicamentosAlergias(prev => ({ ...prev, quaisMedicamentos: e.target.value }))}
                    className="w-full text-sm bg-white/85 border border-[#8E7D6F]/20 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8E7D6F] text-[#4A4440]"
                  />
                )}
              </div>

              <div className="p-4 bg-white/60 border border-white/80 rounded-2xl shadow-sm">
                <label className="block text-sm font-semibold text-[#4A4440] mb-2">Possui algum tipo de alergia?</label>
                <div className="flex gap-6 mb-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer text-[#4A4440] font-medium">
                    <input
                      type="radio"
                      name="alergiasRadio"
                      checked={medicamentosAlergias.alergias === "sim"}
                      onChange={() => setMedicamentosAlergias(prev => ({ ...prev, allergies: "sim", alergias: "sim" }))}
                      className="accent-[#8E7D6F] w-4 h-4"
                    /> Sim
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer text-[#4A4440] font-medium">
                    <input
                      type="radio"
                      name="alergiasRadio"
                      checked={medicamentosAlergias.alergias === "nao"}
                      onChange={() => setMedicamentosAlergias(prev => ({ ...prev, allergies: "nao", alergias: "nao", quaisAlergias: "" }))}
                      className="accent-[#8E7D6F] w-4 h-4"
                    /> Não
                  </label>
                </div>
                {medicamentosAlergias.alergias === "sim" && (
                  <input
                    id="patient-allergies"
                    type="text"
                    required
                    placeholder="Alergia a quê? (Esmalte, iodo, medicamentos, esparadrapos...)"
                    value={medicamentosAlergias.quaisAlergias}
                    onChange={e => setMedicamentosAlergias(prev => ({ ...prev, quaisAlergias: e.target.value }))}
                    className="w-full text-sm bg-white/85 border border-[#8E7D6F]/20 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8E7D6F] text-[#4A4440]"
                  />
                )}
              </div>
            </div>

            <div className="h-px bg-white/60 my-5" />

            {/* SECT 2: HÁBITOS */}
            <div className="space-y-4">
              <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#8E7D6F] mb-3">Hábitos & Estilo de Vida</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white/60 border border-white/80 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <label className="block text-sm font-semibold text-[#4A4440] mb-2">Pratica atividades físicas?</label>
                    <div className="flex gap-4 mb-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer text-[#4A4440] font-medium">
                        <input
                          type="radio"
                          name="atvFisica"
                          checked={habitosRotina.praticaAtividadeFisica === "sim"}
                          onChange={() => setHabitosRotina(prev => ({ ...prev, praticaAtividadeFisica: "sim" }))}
                          className="accent-[#8E7D6F]"
                        /> Sim
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer text-[#4A4440] font-medium">
                        <input
                          type="radio"
                          name="atvFisica"
                          checked={habitosRotina.praticaAtividadeFisica === "nao"}
                          onChange={() => setHabitosRotina(prev => ({ ...prev, praticaAtividadeFisica: "nao", qualAtividadeFisica: "", frequenciaAtividadeFisica: "" }))}
                          className="accent-[#8E7D6F]"
                        /> Não
                      </label>
                    </div>
                  </div>
                  {habitosRotina.praticaAtividadeFisica === "sim" && (
                    <div className="space-y-2 mt-3">
                      <input
                        id="patient-activity-type"
                        type="text"
                        required
                        placeholder="Qual atividade física pratica?"
                        value={habitosRotina.qualAtividadeFisica}
                        onChange={e => setHabitosRotina(prev => ({ ...prev, qualAtividadeFisica: e.target.value }))}
                        className="w-full text-xs bg-white/85 border border-[#8E7D6F]/10 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#8E7D6F] text-[#4A4440]"
                      />
                      <input
                        id="patient-activity-freq"
                        type="text"
                        placeholder="Frequência (Ex: 3 vezes por semana)"
                        value={habitosRotina.frequenciaAtividadeFisica}
                        onChange={e => setHabitosRotina(prev => ({ ...prev, frequenciaAtividadeFisica: e.target.value }))}
                        className="w-full text-xs bg-white/85 border border-[#8E7D6F]/10 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#8E7D6F] text-[#4A4440]"
                      />
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white/60 border border-white/80 rounded-2xl shadow-sm">
                  <label className="block text-sm font-semibold text-[#4A4440] mb-2">Permanece longos períodos em pé?</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer text-[#4A4440] font-medium">
                      <input
                        type="radio"
                        name="periodosPe"
                        checked={habitosRotina.periodosEmPe === "sim"}
                        onChange={() => setHabitosRotina(prev => ({ ...prev, periodosEmPe: "sim" }))}
                        className="accent-[#8E7D6F]"
                      /> Sim
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer text-[#4A4440] font-medium">
                      <input
                        type="radio"
                        name="periodosPe"
                        checked={habitosRotina.periodosEmPe === "nao"}
                        onChange={() => setHabitosRotina(prev => ({ ...prev, periodosEmPe: "nao" }))}
                        className="accent-[#8E7D6F]"
                      /> Não
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-white/60 border border-white/80 rounded-2xl shadow-sm">
                  <label className="block text-xs font-bold text-[#8E7D6F] uppercase tracking-wider mb-2">Exigência profissional:</label>
                  <p className="text-xs text-stone-600 mb-2">Usa regularmente sapato profissional / E.P.I. com bico de aço rígido?</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer text-[#4A4440] font-medium">
                      <input
                        type="radio"
                        name="calcadoSeg"
                        checked={habitosRotina.calcadoSeguranca === "sim"}
                        onChange={() => setHabitosRotina(prev => ({ ...prev, calcadoSeguranca: "sim" }))}
                        className="accent-[#8E7D6F]"
                      /> Sim
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer text-[#4A4440] font-medium">
                      <input
                        type="radio"
                        name="calcadoSeg"
                        checked={habitosRotina.calcadoSeguranca === "nao"}
                        onChange={() => setHabitosRotina(prev => ({ ...prev, calcadoSeguranca: "nao" }))}
                        className="accent-[#8E7D6F]"
                      /> Não
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-white/60 border border-white/80 rounded-2xl shadow-sm flex flex-col justify-between">
                  <label className="block text-xs font-bold text-[#8E7D6F] uppercase tracking-wider mb-2">Tipo de Calçado do Dia a Dia</label>
                  <p className="text-xs text-stone-600 mb-2">Qual tipo usa mais no cotidiano?</p>
                  <input
                    id="patient-shoe-preference"
                    type="text"
                    placeholder="Ex: Tênis macio, salto alto, bico fino, rasteirinhas..."
                    value={habitosRotina.tipoCalcadoMaisUtilizado}
                    onChange={e => setHabitosRotina(prev => ({ ...prev, tipoCalcadoMaisUtilizado: e.target.value }))}
                    className="w-full text-xs bg-white/85 border border-[#8E7D6F]/10 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#8E7D6F] text-[#4A4440]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-8 pt-5 border-t border-white/40">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm text-[#8E7D6F] hover:text-[#4A4440] font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              
              <button
                type="submit"
                className="px-8 py-2.5 rounded-full bg-[#8E7D6F] text-white hover:bg-[#7a6a5d] font-bold text-sm shadow-md shadow-[#8E7D6F]/10 hover:scale-[1.01] transition-all duration-200"
              >
                Próxima Etapa
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: DECLARATION & SIGNATURE CANVAS */}
        {step === 4 && (
          <form onSubmit={handleSaveAndNext} className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1 px-2.5 bg-[#E8D8C3]/50 text-[#8E7D6F] rounded-xl font-bold text-xs font-serif uppercase tracking-wider">Etapa Final</div>
              <h3 className="font-serif text-lg font-semibold text-[#4A4440] flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-[#8E7D6F]" /> Declaração & Assinatura</h3>
            </div>

            <div className="p-4 bg-[#8E7D6F]/5 border border-[#8E7D6F]/10 rounded-2xl mb-4 text-justify shadow-inner">
              <p className="text-stone-700 text-xs leading-relaxed italic">
                "Declaro para os devidos fins que todas as informações preenchidas nesta ficha são inteiramente verdadeiras. Autorizo a realização dos cuidados e procedimentos terapêuticos indicados pela enfermeira e podóloga Dra. Denise Ferreira, comprometendo-me a cooperar e seguir fielmente as recomendações domiciliares."
              </p>
            </div>

            <div className="bg-white/60 border border-white/80 rounded-2xl p-4 shadow-sm">
              <label id="digital-signature-label" className="block text-[10px] font-bold text-[#8E7D6F] uppercase tracking-wider mb-2">
                Assinatura do Paciente (Escreva utilizando o dedo na tela ou o mouse)
              </label>
              
              <div className="bg-white rounded-xl overflow-hidden border border-[#8E7D6F]/10">
                <SignatureCanvas
                  savedSignature={assinaturaPaciente}
                  onSave={base64 => setAssinaturaPaciente(base64)}
                  placeholderText="Realize a sua rubrica eletrônica neste espaço para validação"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-8 pt-5 border-t border-white/40">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm text-[#8E7D6F] hover:text-[#4A4440] font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 rounded-full bg-[#8E7D6F] text-white hover:bg-[#7a6a5d] font-bold text-sm shadow-xl shadow-[#8E7D6F]/20 transition-all inline-flex items-center gap-2 active:scale-95 disabled:bg-stone-400 cursor-pointer text-center"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-stone-100 border-t-stone-800 rounded-full animate-spin"></span>
                    Transferindo prontuário...
                  </>
                ) : (
                  <>
                     Concluir e Enviar Ficha <Send className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="max-w-2xl mx-auto text-center mt-8 relative z-10">
        <p className="text-[10px] text-[#8E7D6F] tracking-wide">© 2026 Denise Ferreira • Estética & Podologia Avançada • Registro Profissional Integrado • Todos os direitos reservados.</p>
      </div>
    </div>
  );
}
