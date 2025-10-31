import twilio from 'twilio';

/**
 * Helper para integração com Twilio Video API
 * 
 * Configuração necessária:
 * - TWILIO_ACCOUNT_SID: Account SID do Twilio
 * - TWILIO_API_KEY: API Key do Twilio
 * - TWILIO_API_SECRET: API Secret do Twilio
 */

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;

// Cliente Twilio
let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (!accountSid || !apiKey || !apiSecret) {
    throw new Error('Credenciais Twilio não configuradas. Configure TWILIO_ACCOUNT_SID, TWILIO_API_KEY e TWILIO_API_SECRET');
  }
  
  if (!twilioClient) {
    twilioClient = twilio(apiKey, apiSecret, { accountSid });
  }
  
  return twilioClient;
}

/**
 * Gera um token de acesso para o Twilio Video
 * @param identity Identificador único do usuário (ex: "doctor_123" ou "patient_456")
 * @param roomName Nome da sala de vídeo
 * @returns Token de acesso JWT
 */
export function generateVideoToken(identity: string, roomName: string): string {
  if (!accountSid || !apiKey || !apiSecret) {
    throw new Error('Credenciais Twilio não configuradas');
  }

  const AccessToken = twilio.jwt.AccessToken;
  const VideoGrant = AccessToken.VideoGrant;

  // Criar token de acesso
  const token = new AccessToken(accountSid, apiKey, apiSecret, {
    identity,
    ttl: 14400, // 4 horas
  });

  // Adicionar permissão de vídeo
  const videoGrant = new VideoGrant({
    room: roomName,
  });
  token.addGrant(videoGrant);

  return token.toJwt();
}

/**
 * Cria ou retorna uma sala de vídeo existente
 * @param roomName Nome único da sala
 * @returns Dados da sala criada
 */
export async function createOrGetRoom(roomName: string) {
  const client = getTwilioClient();
  
  try {
    // Tentar buscar sala existente
    const room = await client.video.v1.rooms(roomName).fetch();
    return {
      sid: room.sid,
      name: room.uniqueName,
      status: room.status,
    };
  } catch (error: any) {
    // Se não existir, criar nova sala
    if (error.code === 20404) {
      const newRoom = await client.video.v1.rooms.create({
        uniqueName: roomName,
        type: 'group', // Tipo de sala: group, peer-to-peer, group-small
        maxParticipants: 2, // Médico + Paciente
      });
      
      return {
        sid: newRoom.sid,
        name: newRoom.uniqueName,
        status: newRoom.status,
      };
    }
    
    throw error;
  }
}

/**
 * Finaliza uma sala de vídeo
 * @param roomSid SID da sala
 */
export async function completeRoom(roomSid: string) {
  const client = getTwilioClient();
  
  await client.video.v1.rooms(roomSid).update({
    status: 'completed',
  });
}

/**
 * Lista participantes de uma sala
 * @param roomSid SID da sala
 */
export async function getRoomParticipants(roomSid: string) {
  const client = getTwilioClient();
  
  const participants = await client.video.v1
    .rooms(roomSid)
    .participants.list();
  
  return participants.map(p => ({
    sid: p.sid,
    identity: p.identity,
    status: p.status,
    startTime: p.startTime,
    endTime: p.endTime,
  }));
}

/**
 * Verifica se as credenciais Twilio estão configuradas
 */
export function isTwilioConfigured(): boolean {
  return !!(accountSid && apiKey && apiSecret);
}
