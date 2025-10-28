import { int, longtext, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "doctor"]).default("user").notNull(),
  
  // Dados específicos do médico (apenas se role = 'doctor')
  crm: varchar("crm", { length: 20 }),
  crmUf: varchar("crmUf", { length: 2 }),
  especialidade: text("especialidade"),
  rqe: varchar("rqe", { length: 20 }),
  endereco: text("endereco"),
  telefone: varchar("telefone", { length: 20 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tabela de pacientes
export const patients = mysqlTable("patients", {
  id: int("id").autoincrement().primaryKey(),
  doctorId: int("doctorId").notNull(), // FK para users (médico)
  
  // Dados pessoais (criptografados)
  nomeCompleto: text("nomeCompleto").notNull(),
  cpf: varchar("cpf", { length: 255 }), // Criptografado
  rg: varchar("rg", { length: 255 }), // Criptografado
  dataNascimento: varchar("dataNascimento", { length: 255 }), // Criptografado
  sexo: varchar("sexo", { length: 1 }),
  
  // Contato (criptografado)
  telefone: varchar("telefone", { length: 255 }), // Criptografado
  email: varchar("email", { length: 255 }), // Criptografado
  
  // Endereço (criptografado)
  endereco: text("endereco"), // Criptografado
  
  // Observações médicas
  observacoes: text("observacoes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;

// Tabela de medicamentos
export const medications = mysqlTable("medications", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 50 }),
  numeroRegistro: varchar("numeroRegistro", { length: 50 }),
  nomeProduto: text("nomeProduto").notNull(),
  numeroProcesso: varchar("numeroProcesso", { length: 50 }).unique(),
  
  // Empresa
  empresaNome: text("empresaNome"),
  empresaCnpj: varchar("empresaCnpj", { length: 20 }),
  
  // Composição
  principioAtivo: text("principioAtivo"),
  tarja: varchar("tarja", { length: 50 }),
  apresentacoes: longtext("apresentacoes"), // JSON string - pode ser muito grande
  
  // Referência e classificação
  medicamentoReferencia: text("medicamentoReferencia"),
  classesTerapeuticas: text("classesTerapeuticas"),
  categoriaRegulatoria: varchar("categoriaRegulatoria", { length: 50 }),
  
  // Bulas
  bulaTxt: longtext("bulaTxt"),
  bulaPdfUrl: text("bulaPdfUrl"), // URL no S3
  bulaTxtProfissional: longtext("bulaTxtProfissional"),
  bulaPdfProfissionalUrl: text("bulaPdfProfissionalUrl"), // URL no S3
  
  // Regulatório
  situacaoRegistro: varchar("situacaoRegistro", { length: 20 }),
  indicacao: text("indicacao"),
  
  // Datas
  dataProduto: timestamp("dataProduto"),
  dataVencimentoRegistro: timestamp("dataVencimentoRegistro"),
  dataPublicacao: timestamp("dataPublicacao"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = typeof medications.$inferInsert;

// Tabela de exames
export const exams = mysqlTable("exams", {
  id: int("id").autoincrement().primaryKey(),
  nome: text("nome").notNull(),
  codigoTuss: varchar("codigoTuss", { length: 20 }),
  codigoSus: varchar("codigoSus", { length: 20 }),
  descricao: text("descricao"),
  categoria: varchar("categoria", { length: 100 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Exam = typeof exams.$inferSelect;
export type InsertExam = typeof exams.$inferInsert;

// Tabela de prescrições
export const prescriptions = mysqlTable("prescriptions", {
  id: int("id").autoincrement().primaryKey(),
  doctorId: int("doctorId").notNull(),
  patientId: int("patientId").notNull(),
  
  // Tipo de receituário
  tipoReceituario: mysqlEnum("tipoReceituario", [
    "simples",
    "controle_especial",
    "azul",
    "amarela",
    "retinoides",
    "talidomida"
  ]).notNull(),
  
  // Medicamentos prescritos (JSON array)
  medicamentos: text("medicamentos").notNull(), // JSON: [{ medicationId, apresentacao, posologia, ... }]
  
  // Orientações
  orientacoes: text("orientacoes"),
  
  // Assinatura digital
  assinado: int("assinado").default(0).notNull(), // 0 = não, 1 = sim
  assinaturaData: timestamp("assinaturaData"),
  assinaturaCertificado: text("assinaturaCertificado"), // Dados do certificado
  
  // Documento gerado
  pdfUrl: text("pdfUrl"), // URL no S3
  qrCodeData: text("qrCodeData"), // Dados para validação
  
  // Validade
  dataValidade: timestamp("dataValidade"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = typeof prescriptions.$inferInsert;

// Tabela de atestados
export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  doctorId: int("doctorId").notNull(),
  patientId: int("patientId").notNull(),
  
  // Tipo de atestado
  tipo: mysqlEnum("tipo", ["comparecimento", "afastamento", "obito"]).notNull(),
  
  // Dados do atestado
  cid: varchar("cid", { length: 10 }),
  dataInicio: timestamp("dataInicio"),
  dataFim: timestamp("dataFim"),
  observacoes: text("observacoes"),
  
  // Assinatura digital
  assinado: int("assinado").default(0).notNull(),
  assinaturaData: timestamp("assinaturaData"),
  assinaturaCertificado: text("assinaturaCertificado"),
  
  // Documento gerado
  pdfUrl: text("pdfUrl"),
  qrCodeData: text("qrCodeData"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

// Tabela de pedidos de exames
export const examRequests = mysqlTable("examRequests", {
  id: int("id").autoincrement().primaryKey(),
  doctorId: int("doctorId").notNull(),
  patientId: int("patientId").notNull(),
  
  // Exames solicitados (JSON array)
  exames: text("exames").notNull(), // JSON: [{ examId, indicacao }]
  
  // Observações
  observacoes: text("observacoes"),
  
  // Assinatura digital
  assinado: int("assinado").default(0).notNull(),
  assinaturaData: timestamp("assinaturaData"),
  assinaturaCertificado: text("assinaturaCertificado"),
  
  // Documento gerado
  pdfUrl: text("pdfUrl"),
  qrCodeData: text("qrCodeData"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExamRequest = typeof examRequests.$inferSelect;
export type InsertExamRequest = typeof examRequests.$inferInsert;

// Tabela de modelos (templates)
export const templates = mysqlTable("templates", {
  id: int("id").autoincrement().primaryKey(),
  doctorId: int("doctorId").notNull(),
  
  // Tipo de modelo
  tipo: mysqlEnum("tipo", ["prescricao", "atestado", "exame"]).notNull(),
  
  // Nome do modelo
  nome: varchar("nome", { length: 255 }).notNull(),
  
  // Dados do modelo (JSON)
  dados: text("dados").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

// Tabela de logs de mensagens (Zenvia)
export const messageLogs = mysqlTable("messageLogs", {
  id: int("id").autoincrement().primaryKey(),
  doctorId: int("doctorId").notNull(),
  patientId: int("patientId").notNull(),
  
  // Tipo de documento enviado
  documentType: varchar("documentType", { length: 50 }).notNull(),
  documentId: int("documentId").notNull(),
  
  // Canal de envio
  canal: mysqlEnum("canal", ["sms", "whatsapp"]).notNull(),
  
  // Dados do envio
  destinatario: varchar("destinatario", { length: 20 }).notNull(),
  mensagem: text("mensagem"),
  
  // Status
  status: varchar("status", { length: 50 }).default("enviando").notNull(),
  zenviaMessageId: varchar("zenviaMessageId", { length: 100 }),
  
  // Datas
  dataEnvio: timestamp("dataEnvio").defaultNow().notNull(),
  dataEntrega: timestamp("dataEntrega"),
  dataLeitura: timestamp("dataLeitura"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MessageLog = typeof messageLogs.$inferSelect;
export type InsertMessageLog = typeof messageLogs.$inferInsert;

// Tabela de logs de auditoria
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  userRole: varchar("userRole", { length: 20 }).notNull(),
  
  // Ação realizada
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resourceType", { length: 50 }),
  resourceId: int("resourceId"),
  
  // Dados da requisição
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  // Resultado
  success: int("success").default(1).notNull(),
  
  // Metadados (JSON)
  metadata: text("metadata"),
  
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;