import React, { useState, useEffect } from "react";
import { Lock, Heart, ShieldCheck, KeyRound, Sparkles, LogIn, Printer } from "lucide-react";
import AnamnesePublicView from "./components/AnamnesePublicView";
import ProfissionalDashboard from "./components/ProfissionalDashboard";
import DeniseLogo from "./components/DeniseLogo";
import { Cliente } from "./types";

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [printCard, setPrintCard] = useState<string | null>(null);
  const [printableClient, setPrintableClient] = useState<Cliente | null>(null);
  const [printableLoading, setPrintableLoading] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    // Dynamic routing: check if "?id=TOKEN" is present in browser query params
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("id");
    if (idParam) {
      setToken(idParam);
    }

    // Check for printable card request
    const printParam = params.get("print_card");
    if (printParam) {
      setPrintCard(printParam);
      setPrintableLoading(true);
      fetch(`/api/clientes/${printParam}`)
        .then(res => res.json())
        .then(data => {
          setPrintableClient(data);
          setPrintableLoading(false);
        })
        .catch(err => {
          console.error("Erro ao carregar prontuário para impressão:", err);
          setPrintableLoading(false);
        });
    }

    // Recover login session from localStorage
    const savedLogin = localStorage.getItem("denise-ferreira-auth");
    if (savedLogin === "true") {
      setIsLogged(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "denise123") {
      setIsLogged(true);
      setAuthError("");
      localStorage.setItem("denise-ferreira-auth", "true");
    } else {
      setAuthError("Senha incorreta. Utilize a senha fornecida para sua agência de marketing (denise123).");
    }
  };

  const handleLogout = () => {
    setIsLogged(false);
    localStorage.removeItem("denise-ferreira-auth");
  };

  // 0. Printable Care Card render
  if (printCard) {
    if (printableLoading) {
      return (
        <div className="min-h-screen bg-[#F9F7F5] flex items-center justify-center p-4">
          <div className="text-center font-serif text-[#8E7D6F] animate-pulse font-medium text-xs">
            Preparando Cartão de Cuidados Especializados...
          </div>
        </div>
      );
    }

    if (!printableClient || !printableClient.posCare) {
      return (
        <div className="min-h-screen bg-[#F9F7F5] flex items-center justify-center p-4 text-center">
          <div className="max-w-md bg-white border border-[#E8D8C3] rounded-3xl p-8 shadow-sm">
            <DeniseLogo size="xl" variant="gold" className="mx-auto mb-4" />
            <h2 className="font-serif text-md text-stone-850 font-bold">Resumo Clínico não Gerado</h2>
            <p className="text-xs text-stone-500 mt-2 leading-relaxed">
              Dra. Denise Ferreira precisa salvar ou gerar um Plano de Cuidados Inteligente (IA) para este paciente antes de gerar o cartão.
            </p>
            <button onClick={() => window.close()} className="mt-5 px-5 py-2 bg-stone-900 text-gold-200 hover:bg-stone-800 text-xs font-semibold rounded-xl cursor-pointer">
              Fechar Janela
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-stone-100 p-4 sm:p-8 flex flex-col items-center justify-start print:bg-white print:p-0">
        <div className="w-full max-w-2xl bg-white border border-stone-200 rounded-2xl p-4 mb-6 shadow-sm flex justify-between items-center no-print">
          <div className="text-xs text-stone-600 font-medium leading-relaxed">
            Use a opção <strong>"Salvar como PDF"</strong> no menu de impressão do seu navegador para gerar o arquivo PDF.
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.close()} className="px-3.5 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-lg cursor-pointer transition-all">
              Fechar
            </button>
            <button onClick={() => window.print()} className="px-5 py-1.5 bg-stone-900 text-gold-100 hover:bg-stone-800 text-xs font-bold rounded-lg cursor-pointer shadow transition-all flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-gold-300" /> Imprimir / Salvar PDF
            </button>
          </div>
        </div>

        <div className="w-full max-w-2xl bg-white border-2 border-gold-200 rounded-3xl overflow-hidden shadow-xl p-8 print:border-none print:shadow-none print:p-0">
          
          {/* Care card premium header */}
          <div className="text-center pb-6 border-b border-gold-400/20 mb-6 flex justify-between items-center">
            <div className="text-left flex items-center">
              <div>
                <h1 className="font-serif text-xl font-bold text-stone-900 tracking-wider">DENISE FERREIRA</h1>
                <p className="text-[9px] uppercase tracking-widest font-semibold text-[#8E7D6F] mt-0.5">Enfermagem • Podologia • Estética de Alta Performance</p>
              </div>
            </div>
            <div className="text-right border-l pl-4 border-stone-100">
              <span className="text-[9px] bg-stone-900 text-gold-100 font-bold px-3 py-1 rounded-full uppercase tracking-wider">Cartão de Cuidados</span>
              <p className="text-[10px] text-stone-500 font-semibold mt-3">Paciente: <strong className="text-stone-850 font-bold">{printableClient.identificacao.nomeCompleto}</strong></p>
              <p className="text-[9px] text-stone-400">Emissão: {new Date().toLocaleDateString("pt-BR")}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <span className="text-[10px] text-gold-700 font-bold uppercase tracking-wider block mb-1">Procedimento Realizado</span>
              <p className="text-xs text-stone-800 leading-relaxed font-semibold bg-stone-50 p-4 border border-stone-150 rounded-xl">
                {printableClient.posCare.resumoProcedimento}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-gold-700 font-bold uppercase tracking-wider block mb-2">Recomendações e Dicas Home Care (Prescrição Inteligente)</span>
              <div className="text-xs text-stone-700 space-y-3 p-5 bg-[#F9F7F5] border border-gold-100/40 rounded-2xl">
                {printableClient.posCare.orientacoesHomeCare.split("\n").map((line, idx) => {
                  if (line.startsWith("*") || line.startsWith("-")) {
                    return (
                      <p key={idx} className="pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-gold-500 font-medium">
                        {line.replace(/^[-*]\s*/, "")}
                      </p>
                    );
                  }
                  if (line.startsWith("###")) {
                    return (
                      <h5 key={idx} className="font-serif font-bold text-xs uppercase tracking-widest text-[#8E7D6F] mt-4 border-b border-light-200/40 pb-1">
                        {line.replace(/^###\s*/, "")}
                      </h5>
                    );
                  }
                  return <p key={idx} className="leading-relaxed text-justify">{line}</p>;
                })}
              </div>
            </div>

            <div className="text-xs pt-4 border-t border-stone-100">
              <div>
                <span className="text-[10px] text-stone-400 font-semibold uppercase">Próxima Visita Recomendada</span>
                <p className="font-bold text-stone-850 gap-1.5 mt-0.5">{printableClient.posCare.dataRetornoRecomendada}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 1. Client-facing public web check-in if there is a token param
  if (token) {
    return (
      <AnamnesePublicView 
        token={token} 
        onSubmitted={() => {
          // Client has completed and successfully uploaded
          setToken(null);
        }} 
      />
    );
  }

  // 2. Logged-in Professional Backoffice Workplace
  if (isLogged) {
    return (
      <ProfissionalDashboard 
        onLogout={handleLogout} 
      />
    );
  }

  // 3. Luxurious Custom branded Login Gate
  return (
    <div className="min-h-screen bg-[#F9F7F5] flex items-center justify-center p-4 sm:p-6 md:p-10 no-print selection:bg-[#E8D8C3] relative overflow-hidden">
      
      {/* Abstract Mesh Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#E8D8C3] rounded-full mix-blend-multiply filter blur-[80px] opacity-40"></div>
        <div className="absolute bottom-[0%] right-[-5%] w-[600px] h-[600px] bg-[#C9D7D8] rounded-full mix-blend-multiply filter blur-[100px] opacity-40"></div>
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-[#F2E1E1] rounded-full mix-blend-multiply filter blur-[80px] opacity-30"></div>
      </div>

      <div className="relative z-10 bg-white/40 backdrop-blur-xl rounded-3xl shadow-2xl shadow-[#8E7D6F]/10 border border-white/60 p-8 sm:p-10 max-w-md w-full overflow-hidden transition-all duration-300">
        
        {/* Soft elegant top border */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E8D8C3] via-[#8E7D6F] to-[#C9D7D8]"></div>

        {/* Brand visual badge */}
        <div className="flex flex-col items-center text-center mb-8">
          <DeniseLogo size="xl" variant="gold" className="mb-4" />

          <h1 className="font-serif text-2xl font-medium tracking-tight text-[#4A4440]">DENISE FERREIRA</h1>
          <p className="text-[10px] text-[#8E7D6F] uppercase tracking-widest font-semibold mt-1">
            Enfermagem • Podologia • Estética
          </p>
          <p className="text-xxs text-[#5A7C7E] mt-0.5 tracking-wider font-semibold">Atendimento Humanizado</p>
          <div className="h-px bg-white/60 w-24 mt-4"></div>
        </div>

        {/* Informational intro card for marketing */}
        <div className="p-3.5 bg-white/50 border border-white/80 rounded-2xl text-[#4A4440] text-xxs leading-relaxed mb-6 flex items-start gap-2.5 shadow-sm">
          <div className="p-1 px-1.5 bg-[#E8D8C3] text-[#8E7D6F] rounded font-bold uppercase tracking-wider scale-95 shrink-0">Dra. Denise</div>
          <p className="pt-0.5 font-medium text-stone-600">Benvinda à sua plataforma de automação clínica. Entre com sua credencial de consultório para acessar os prontuários das avaliações.</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xxs font-bold uppercase tracking-widest text-[#8E7D6F] mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#8E7D6F]/70" /> Senha de Segurança
            </label>
            <input
              id="login-password-field"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Digite a sua senha de acesso"
              className="w-full text-xs font-semibold bg-white/50 border border-white/80 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8E7D6F] transition-all text-[#4A4440]"
            />
          </div>

          {authError && (
            <p className="text-xxs text-rose-600 font-semibold leading-relaxed bg-rose-50/75 border border-rose-100 rounded-lg p-2.5">
              {authError}
            </p>
          )}

          <button
            id="btn-login-submit"
            type="submit"
            className="w-full bg-[#8E7D6F] text-white font-bold font-serif text-xs uppercase tracking-widest rounded-xl py-3.5 hover:bg-[#7a6a5d] shadow-lg shadow-[#8E7D6F]/25 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            Acessar Prontuários <LogIn className="w-4 h-4 text-white" />
          </button>
        </form>

        {/* Instructions footer */}
        <div className="mt-8 text-center border-t border-white/40 pt-5">
          <div className="inline-flex items-center gap-1 text-[10px] text-[#8E7D6F]/80">
            <ShieldCheck className="w-3.5 h-3.5 text-[#5A7C7E]" /> Canal de conexão criptografado e seguro
          </div>
          <p className="text-[9px] text-[#8E7D6F]/60 mt-2">Dica de Desenvolvimento: A senha padrão de sua agência é <strong className="text-stone-600">denise123</strong></p>
        </div>

      </div>

    </div>
  );
}
