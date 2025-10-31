import { and, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, patients, medications, prescriptions, exams, templates, appointments, consultationMessages } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Pacientes
import { type InsertPatient, type Patient } from '../drizzle/schema';
import { encrypt, decrypt, encryptFields, decryptFields } from './encryption';

// Campos que devem ser criptografados
const ENCRYPTED_PATIENT_FIELDS: (keyof InsertPatient)[] = [
  'cpf',
  'rg',
  'dataNascimento',
  'telefone',
  'email',
  'endereco',
];

export async function createPatient(doctorId: number, patientData: Omit<InsertPatient, 'doctorId'>): Promise<Patient> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  // Criptografar campos sensíveis
  const encryptedData = encryptFields(
    { ...patientData, doctorId },
    ENCRYPTED_PATIENT_FIELDS
  );

  const [result] = await db.insert(patients).values(encryptedData).$returningId();
  
  // Buscar paciente criado
  const [patient] = await db.select().from(patients).where(eq(patients.id, result.id));
  
  return patient;
}

export async function getPatientById(patientId: number, doctorId: number): Promise<Patient | null> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const [patient] = await db
    .select()
    .from(patients)
    .where(eq(patients.id, patientId));

  if (!patient) return null;

  // Verificar se o paciente pertence ao médico
  if (patient.doctorId !== doctorId) {
    throw new Error('Unauthorized: Patient does not belong to this doctor');
  }

  // Descriptografar campos sensíveis
  return decryptFields(patient, ENCRYPTED_PATIENT_FIELDS);
}

export async function getPatientsByDoctor(doctorId: number): Promise<Patient[]> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const patientsList = await db
    .select()
    .from(patients)
    .where(eq(patients.doctorId, doctorId))
    .orderBy(patients.nomeCompleto);

  // Descriptografar campos sensíveis de todos os pacientes
  return patientsList.map(patient => 
    decryptFields(patient, ENCRYPTED_PATIENT_FIELDS)
  );
}

export async function updatePatient(
  patientId: number,
  doctorId: number,
  patientData: Partial<Omit<InsertPatient, 'id' | 'doctorId'>>
): Promise<Patient> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  // Verificar se o paciente pertence ao médico
  const existing = await getPatientById(patientId, doctorId);
  if (!existing) {
    throw new Error('Patient not found or unauthorized');
  }

  // Criptografar campos sensíveis
  const encryptedData = encryptFields(patientData as any, ENCRYPTED_PATIENT_FIELDS) as Partial<InsertPatient>;

  await db
    .update(patients)
    .set(encryptedData)
    .where(eq(patients.id, patientId));

  // Retornar paciente atualizado
  return getPatientById(patientId, doctorId) as Promise<Patient>;
}

export async function deletePatient(patientId: number, doctorId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  // Verificar se o paciente pertence ao médico
  const existing = await getPatientById(patientId, doctorId);
  if (!existing) {
    throw new Error('Patient not found or unauthorized');
  }

  // LGPD: Anonimizar dados ao invés de deletar
  await db
    .update(patients)
    .set({
      nomeCompleto: 'Paciente Anonimizado',
      cpf: null,
      rg: null,
      dataNascimento: null,
      telefone: null,
      email: null,
      endereco: null,
      observacoes: 'Dados anonimizados conforme LGPD',
    })
    .where(eq(patients.id, patientId));
}

// Medicamentos
import { type Medication } from '../drizzle/schema';
import { sql } from 'drizzle-orm';

export async function searchMedications(query: string, filters?: {
  tarja?: string;
  categoriaRegulatoria?: string;
  situacaoRegistro?: string;
}): Promise<Medication[]> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const searchPattern = `%${query}%`;
  
  let conditions = or(
    like(medications.nomeProduto, searchPattern),
    like(medications.principioAtivo, searchPattern),
    like(medications.classesTerapeuticas, searchPattern)
  );

  // Aplicar filtros adicionais
  const filterConditions = [];
  
  if (filters?.tarja) {
    filterConditions.push(eq(medications.tarja, filters.tarja));
  }
  
  if (filters?.categoriaRegulatoria) {
    filterConditions.push(eq(medications.categoriaRegulatoria, filters.categoriaRegulatoria));
  }
  
  if (filters?.situacaoRegistro) {
    filterConditions.push(eq(medications.situacaoRegistro, filters.situacaoRegistro));
  } else {
    // Por padrão, mostrar apenas medicamentos ativos
    filterConditions.push(eq(medications.situacaoRegistro, 'ATIVO'));
  }

  const finalConditions = filterConditions.length > 0
    ? and(conditions, ...filterConditions)
    : conditions;

  const results = await db
    .select()
    .from(medications)
    .where(finalConditions)
    .limit(50); // Limitar a 50 resultados

  return results;
}

export async function getMedicationById(medicationId: number): Promise<Medication | null> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const [medication] = await db
    .select()
    .from(medications)
    .where(eq(medications.id, medicationId));

  return medication || null;
}

export async function getMedicationByNumeroProcesso(numeroProcesso: string): Promise<Medication | null> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const [medication] = await db
    .select()
    .from(medications)
    .where(eq(medications.numeroProcesso, numeroProcesso));

  return medication || null;
}

// Prescrições
import { type Prescription, type InsertPrescription } from '../drizzle/schema';
import { desc } from 'drizzle-orm';

export async function createPrescription(prescriptionData: InsertPrescription): Promise<Prescription> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const [result] = await db.insert(prescriptions).values(prescriptionData).$returningId();
  const [prescription] = await db.select().from(prescriptions).where(eq(prescriptions.id, result.id));
  
  return prescription;
}

export async function getPrescriptionById(prescriptionId: number, doctorId: number): Promise<Prescription | null> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const [prescription] = await db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.id, prescriptionId));

  if (!prescription) return null;

  // Verificar se a prescrição pertence ao médico
  if (prescription.doctorId !== doctorId) {
    throw new Error('Unauthorized: Prescription does not belong to this doctor');
  }

  return prescription;
}

export async function getPrescriptionsByDoctor(doctorId: number, limit: number = 50): Promise<Prescription[]> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  return db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.doctorId, doctorId))
    .orderBy(desc(prescriptions.createdAt))
    .limit(limit);
}

export async function getPrescriptionsByPatient(patientId: number, doctorId: number): Promise<Prescription[]> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  return db
    .select()
    .from(prescriptions)
    .where(and(eq(prescriptions.patientId, patientId), eq(prescriptions.doctorId, doctorId)))
    .orderBy(desc(prescriptions.createdAt));
}

export async function updatePrescription(
  prescriptionId: number,
  doctorId: number,
  data: Partial<InsertPrescription>
): Promise<Prescription> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  // Verificar autorização
  const existing = await getPrescriptionById(prescriptionId, doctorId);
  if (!existing) {
    throw new Error('Prescription not found or unauthorized');
  }

  await db.update(prescriptions).set(data).where(eq(prescriptions.id, prescriptionId));

  return getPrescriptionById(prescriptionId, doctorId) as Promise<Prescription>;
}

// Exames
export async function searchExams(query: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(exams)
    .where(
      or(
        like(exams.nome, `%${query}%`),
        like(exams.codigoTuss, `%${query}%`),
        like(exams.codigoSus, `%${query}%`)
      )
    )
    .limit(50);
}

export async function getExamById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(exams).where(eq(exams.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Templates
export async function createTemplate(
  doctorId: number,
  tipo: string,
  nome: string,
  dados: any
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const result = await db.insert(templates).values({
    doctorId,
    tipo: tipo as any,
    nome,
    dados: JSON.stringify(dados),
  });

  return result;
}

export async function getTemplatesByDoctor(doctorId: number, tipo?: string) {
  const db = await getDb();
  if (!db) return [];

  if (tipo) {
    return db.select().from(templates).where(
      and(
        eq(templates.doctorId, doctorId),
        eq(templates.tipo, tipo as any)
      )
    );
  }

  return db.select().from(templates).where(eq(templates.doctorId, doctorId));
}

export async function deleteTemplate(id: number, doctorId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.delete(templates).where(and(eq(templates.id, id), eq(templates.doctorId, doctorId)));
}

// Appointments (Consultas)
export async function createAppointment(data: {
  doctorId: number;
  patientId: number;
  scheduledDate: Date;
  motivo?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const result = await db.insert(appointments).values({
    doctorId: data.doctorId,
    patientId: data.patientId,
    scheduledDate: data.scheduledDate,
    motivo: data.motivo,
    status: 'agendada',
  });

  return result;
}

export async function getAppointmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAppointmentsByDoctor(doctorId: number, date?: Date) {
  const db = await getDb();
  if (!db) return [];

  if (date) {
    // Buscar consultas de um dia específico
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return db.select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          // Nota: MySQL não tem operador >= e <= direto no Drizzle, 
          // então vamos buscar todas e filtrar no código
        )
      );
  }

  return db.select().from(appointments).where(eq(appointments.doctorId, doctorId));
}

export async function getAppointmentsByPatient(patientId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(appointments).where(eq(appointments.patientId, patientId));
}

export async function updateAppointmentStatus(
  id: number,
  status: 'agendada' | 'aguardando' | 'em_andamento' | 'finalizada' | 'cancelada',
  additionalData?: {
    twilioRoomName?: string;
    twilioRoomSid?: string;
    startedAt?: Date;
    endedAt?: Date;
  }
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const updateData: any = { status };
  
  if (additionalData?.twilioRoomName) updateData.twilioRoomName = additionalData.twilioRoomName;
  if (additionalData?.twilioRoomSid) updateData.twilioRoomSid = additionalData.twilioRoomSid;
  if (additionalData?.startedAt) updateData.startedAt = additionalData.startedAt;
  if (additionalData?.endedAt) updateData.endedAt = additionalData.endedAt;

  await db.update(appointments).set(updateData).where(eq(appointments.id, id));
}

// Consultation Messages (Chat)
export async function createConsultationMessage(data: {
  appointmentId: number;
  senderId: number;
  senderType: 'doctor' | 'patient';
  message: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const result = await db.insert(consultationMessages).values({
    appointmentId: data.appointmentId,
    senderId: data.senderId,
    senderType: data.senderType,
    message: data.message, // TODO: Criptografar mensagem
  });

  return result;
}

export async function getConsultationMessages(appointmentId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(consultationMessages)
    .where(eq(consultationMessages.appointmentId, appointmentId))
    .orderBy(consultationMessages.timestamp);
}
