import axios from 'axios';

/**
 * Helper para integração com Zenvia API
 * Documentação: https://zenvia.github.io/zenvia-openapi-spec/v1/
 */

const ZENVIA_API_URL = 'https://api.zenvia.com/v2';

interface ZenviaConfig {
  apiToken: string;
}

function getConfig(): ZenviaConfig {
  const apiToken = process.env.ZENVIA_API_TOKEN;
  
  if (!apiToken) {
    throw new Error('ZENVIA_API_TOKEN não configurada');
  }
  
  return { apiToken };
}

export interface SendMessageParams {
  to: string; // Número do destinatário (formato: +5511999999999)
  message: string;
  channel: 'sms' | 'whatsapp';
  from?: string; // Remetente (opcional)
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envia mensagem via SMS ou WhatsApp
 */
export async function sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
  try {
    const config = getConfig();
    
    const endpoint = params.channel === 'sms' 
      ? `${ZENVIA_API_URL}/channels/sms/messages`
      : `${ZENVIA_API_URL}/channels/whatsapp/messages`;
    
    const payload = {
      from: params.from || 'Medko',
      to: params.to,
      contents: [
        {
          type: 'text',
          text: params.message,
        },
      ],
    };
    
    const response = await axios.post(endpoint, payload, {
      headers: {
        'X-API-TOKEN': config.apiToken,
        'Content-Type': 'application/json',
      },
    });
    
    return {
      success: true,
      messageId: response.data.id,
    };
  } catch (error: any) {
    console.error('Erro ao enviar mensagem via Zenvia:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

/**
 * Envia prescrição médica via SMS/WhatsApp
 */
export async function sendPrescription(params: {
  patientPhone: string;
  patientName: string;
  doctorName: string;
  pdfUrl: string;
  channel: 'sms' | 'whatsapp';
}): Promise<SendMessageResult> {
  const message = `
Olá ${params.patientName}!

O Dr(a). ${params.doctorName} enviou uma prescrição médica para você.

Acesse o link abaixo para visualizar:
${params.pdfUrl}

Este documento é válido e pode ser apresentado em qualquer farmácia.

---
Medko - Sistema de Prescrição Médica Digital
  `.trim();
  
  return sendMessage({
    to: params.patientPhone,
    message,
    channel: params.channel,
  });
}

/**
 * Envia atestado médico via SMS/WhatsApp
 */
export async function sendCertificate(params: {
  patientPhone: string;
  patientName: string;
  doctorName: string;
  pdfUrl: string;
  channel: 'sms' | 'whatsapp';
}): Promise<SendMessageResult> {
  const message = `
Olá ${params.patientName}!

O Dr(a). ${params.doctorName} enviou um atestado médico para você.

Acesse o link abaixo para visualizar:
${params.pdfUrl}

---
Medko - Sistema de Prescrição Médica Digital
  `.trim();
  
  return sendMessage({
    to: params.patientPhone,
    message,
    channel: params.channel,
  });
}

/**
 * Verifica status de uma mensagem
 */
export async function getMessageStatus(messageId: string): Promise<{
  status: string;
  timestamp: string;
}> {
  try {
    const config = getConfig();
    
    const response = await axios.get(
      `${ZENVIA_API_URL}/messages/${messageId}`,
      {
        headers: {
          'X-API-TOKEN': config.apiToken,
        },
      }
    );
    
    return {
      status: response.data.status,
      timestamp: response.data.timestamp,
    };
  } catch (error: any) {
    console.error('Erro ao verificar status da mensagem:', error);
    throw error;
  }
}
