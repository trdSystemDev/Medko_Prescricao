import { drizzle } from 'drizzle-orm/mysql2';
import { auditLogs, type InsertAuditLog } from '../drizzle/schema';
import { maskSensitiveData } from './encryption';

let _db: ReturnType<typeof drizzle> | null = null;

async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn('[Audit] Failed to connect to database:', error);
      _db = null;
    }
  }
  return _db;
}

export interface AuditLogData {
  userId: number;
  userRole: string;
  action: string;
  resourceType?: string;
  resourceId?: number;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Registra uma ação no log de auditoria
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  const db = await getDb();
  
  if (!db) {
    console.warn('[Audit] Cannot log: database not available');
    return;
  }

  try {
    // Mascarar dados sensíveis no metadata antes de salvar
    let maskedMetadata = data.metadata;
    if (maskedMetadata) {
      maskedMetadata = { ...maskedMetadata };
      
      // Campos sensíveis que devem ser mascarados
      const sensitiveFields = ['cpf', 'rg', 'telefone', 'email', 'endereco', 'password'];
      
      for (const field of sensitiveFields) {
        if (maskedMetadata[field] && typeof maskedMetadata[field] === 'string') {
          maskedMetadata[field] = maskSensitiveData(maskedMetadata[field]);
        }
      }
    }

    const logEntry: InsertAuditLog = {
      userId: data.userId,
      userRole: data.userRole,
      action: data.action,
      resourceType: data.resourceType || null,
      resourceId: data.resourceId || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      success: data.success !== undefined ? (data.success ? 1 : 0) : 1,
      metadata: maskedMetadata ? JSON.stringify(maskedMetadata) : null,
    };

    await db.insert(auditLogs).values(logEntry);
  } catch (error) {
    console.error('[Audit] Failed to log action:', error);
    // Não lançar erro para não interromper a operação principal
  }
}

/**
 * Ações comuns de auditoria
 */
export const AuditActions = {
  // Autenticação
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  
  // Pacientes
  CREATE_PATIENT: 'CREATE_PATIENT',
  VIEW_PATIENT: 'VIEW_PATIENT',
  UPDATE_PATIENT: 'UPDATE_PATIENT',
  DELETE_PATIENT: 'DELETE_PATIENT',
  
  // Prescrições
  CREATE_PRESCRIPTION: 'CREATE_PRESCRIPTION',
  VIEW_PRESCRIPTION: 'VIEW_PRESCRIPTION',
  SIGN_PRESCRIPTION: 'SIGN_PRESCRIPTION',
  SEND_PRESCRIPTION: 'SEND_PRESCRIPTION',
  
  // Atestados
  CREATE_CERTIFICATE: 'CREATE_CERTIFICATE',
  VIEW_CERTIFICATE: 'VIEW_CERTIFICATE',
  SIGN_CERTIFICATE: 'SIGN_CERTIFICATE',
  SEND_CERTIFICATE: 'SEND_CERTIFICATE',
  
  // Pedidos de Exames
  CREATE_EXAM_REQUEST: 'CREATE_EXAM_REQUEST',
  VIEW_EXAM_REQUEST: 'VIEW_EXAM_REQUEST',
  SIGN_EXAM_REQUEST: 'SIGN_EXAM_REQUEST',
  SEND_EXAM_REQUEST: 'SEND_EXAM_REQUEST',
  
  // Medicamentos
  SEARCH_MEDICATION: 'SEARCH_MEDICATION',
  VIEW_MEDICATION: 'VIEW_MEDICATION',
  VIEW_BULA: 'VIEW_BULA',
  
  // Modelos
  CREATE_TEMPLATE: 'CREATE_TEMPLATE',
  UPDATE_TEMPLATE: 'UPDATE_TEMPLATE',
  DELETE_TEMPLATE: 'DELETE_TEMPLATE',
  USE_TEMPLATE: 'USE_TEMPLATE',
  
  // Exportação de dados
  EXPORT_DATA: 'EXPORT_DATA',
  
  // Tentativas de acesso não autorizado
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
} as const;

/**
 * Tipos de recursos
 */
export const ResourceTypes = {
  PATIENT: 'patient',
  PRESCRIPTION: 'prescription',
  CERTIFICATE: 'certificate',
  EXAM_REQUEST: 'exam_request',
  MEDICATION: 'medication',
  TEMPLATE: 'template',
  USER: 'user',
} as const;

/**
 * Helper para extrair IP do request
 */
export function getClientIp(req: any): string {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Helper para extrair User Agent do request
 */
export function getUserAgent(req: any): string {
  return req.headers['user-agent'] || 'unknown';
}
