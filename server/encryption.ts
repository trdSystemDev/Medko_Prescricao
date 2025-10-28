import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Obter chave de criptografia do ambiente
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY não configurada nas variáveis de ambiente');
  }
  
  // Derivar chave de 32 bytes a partir da chave fornecida
  return crypto.scryptSync(key, 'salt', KEY_LENGTH);
}

/**
 * Criptografa um texto usando AES-256-GCM
 * @param text Texto a ser criptografado
 * @returns Texto criptografado em formato base64
 */
export function encrypt(text: string | null | undefined): string | null {
  if (!text) return null;
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Formato: iv:tag:encrypted
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Erro ao criptografar:', error);
    throw new Error('Falha na criptografia');
  }
}

/**
 * Descriptografa um texto criptografado com AES-256-GCM
 * @param encryptedText Texto criptografado em formato base64
 * @returns Texto original descriptografado
 */
export function decrypt(encryptedText: string | null | undefined): string | null {
  if (!encryptedText) return null;
  
  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Formato de texto criptografado inválido');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    throw new Error('Falha na descriptografia');
  }
}

/**
 * Criptografa um objeto, criptografando apenas campos específicos
 * @param obj Objeto a ser criptografado
 * @param fields Campos a serem criptografados
 * @returns Objeto com campos criptografados
 */
export function encryptFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj };
  
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = encrypt(result[field] as string) as any;
    }
  }
  
  return result;
}

/**
 * Descriptografa um objeto, descriptografando apenas campos específicos
 * @param obj Objeto a ser descriptografado
 * @param fields Campos a serem descriptografados
 * @returns Objeto com campos descriptografados
 */
export function decryptFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj };
  
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = decrypt(result[field] as string) as any;
    }
  }
  
  return result;
}

/**
 * Hash de senha usando bcrypt (para futuro uso se necessário)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifica se uma senha corresponde ao hash
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

/**
 * Gera um token aleatório seguro
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Mascara dados sensíveis para logs (mostra apenas primeiros e últimos caracteres)
 */
export function maskSensitiveData(data: string, visibleChars: number = 3): string {
  if (!data || data.length <= visibleChars * 2) {
    return '***';
  }
  
  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const middle = '*'.repeat(Math.min(data.length - visibleChars * 2, 10));
  
  return `${start}${middle}${end}`;
}
