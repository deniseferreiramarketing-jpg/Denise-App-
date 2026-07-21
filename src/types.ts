export interface PacienteIdentificacao {
  nomeCompleto: string;
  dataNascimento: string;
  idade: string;
  sexo: string;
  cpf: string;
  estadoCivil: string;
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: string;
  profissao: string;
  contatoEmergencia: string;
  telefoneEmergencia: string;
}

export interface HistoricoSaude {
  diabetes: boolean;
  hipertensao: boolean;
  cardiopatia: boolean;
  circulacao: boolean;
  varizes: boolean;
  trombose: boolean;
  neuropatia: boolean;
  osteoporose: boolean;
  artrite: boolean;
  artrose: boolean;
  psoriase: boolean;
  hepatite: boolean;
  gestante: boolean;
  lactante: boolean;
  fumante: boolean;
  etilista: boolean;
  outrasCondicoes: string;
}

export interface MedicamentosEAlergias {
  usoMedicamentos: "sim" | "nao" | "";
  quaisMedicamentos: string;
  alergias: "sim" | "nao" | "";
  quaisAlergias: string;
}

export interface HabitosERotina {
  praticaAtividadeFisica: "sim" | "nao" | "";
  qualAtividadeFisica: string;
  frequenciaAtividadeFisica: string;
  periodosEmPe: "sim" | "nao" | "";
  calcadoSeguranca: "sim" | "nao" | "";
  tipoCalcadoMaisUtilizado: string;
}

export interface AvaliacaoTecnica {
  // UNHAS checkboxes: Saudáveis, Espessadas, Micose, Descolamento, Encravada
  unhasSaudaveis: boolean;
  unhasEspessadas: boolean;
  unhasMicose: boolean;
  unhasDescolamento: boolean;
  unhasEncravada: boolean;
  unhasObservacoes: string;

  // PELE checkboxes: Íntegra, Ressecada, Fissuras, Calosidade, Hiperqueratose, Verruga
  peleIntegra: boolean;
  peleRessecada: boolean;
  peleFissuras: boolean;
  peleCalosidade: boolean;
  peleHiperqueratose: boolean;
  peleVerruga: boolean;
  peleObservacoes: string;

  // SENSIBILIDADE radio: Preservada, Reduzida, Ausente
  sensibilidade: "preservada" | "reduzida" | "ausente" | "";
  sensibilidadeObservacoes: string;

  // CIRCULO-SANGUÍNEA radio: Normal, Alterada
  circulacaoVal: "normal" | "alterada" | "";
  circulacaoObservacoes: string;

  // Avaliação dos pés
  peDireito: string;
  peEsquerdo: string;
  
  // Observações adicionais
  observacoesGerais: string;
}

export type FichaStatus = "aguardando_cliente" | "preenchido_cliente" | "concluido";

export interface AtendimentoPosCare {
  resumoProcedimento: string; // O que foi feito na sessão
  orientacoesHomeCare: string; // Orientações de Home Care geradas por IA
  dataRetornoRecomendada: string; // Data da próxima sessão
  lembreteMensagemCustom: string; // Mensagem completa do WhatsApp gerada
  geradoPorIA: boolean;
  dataCriacao: string;
}

export interface Cliente {
  id: string;
  tokenAcesso: string; // Token único contido no link de compartilhamento para preenchimento online
  createdAt: string;
  updatedAt: string;
  status: FichaStatus;
  
  // Parte preenchida pelo Paciente (Cliente)
  identificacao: PacienteIdentificacao;
  queixaPrincipal: string;
  historicoSaude: HistoricoSaude;
  medicamentosAlergias: MedicamentosEAlergias;
  habitosRotina: HabitosERotina;
  assinaturaPaciente: string; // base64 do canvas
  assinaturaPacienteData: string;

  // Parte preenchida pela Profissional (Dra. Denise)
  avaliacaoTecnica: AvaliacaoTecnica;
  assinaturaProfissional: string; // base64 ou carimbo digital da profissional
  assinaturaProfissionalData: string;
  
  // Módulo de Pós-Atendimento inteligente
  posCare?: AtendimentoPosCare;
}
