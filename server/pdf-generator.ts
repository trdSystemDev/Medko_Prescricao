import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { type Prescription } from '../drizzle/schema';
import { getDescricaoTipoReceituario } from './prescription-validator';

export interface PrescriptionPDFData {
  prescription: Prescription;
  doctor: {
    name: string;
    crm: string;
    crmUf: string;
    especialidade?: string;
    endereco?: string;
    telefone?: string;
  };
  patient: {
    nomeCompleto: string;
    dataNascimento?: string;
    cpf?: string;
  };
  medications: Array<{
    nomeProduto: string;
    apresentacao?: string;
    dose: string;
    frequencia: string;
    duracao: string;
    orientacoes?: string;
  }>;
}

/**
 * Gera PDF de prescrição médica
 */
export async function generatePrescriptionPDF(data: PrescriptionPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Cabeçalho
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('PRESCRIÇÃO MÉDICA', { align: 'center' });

      doc.moveDown(0.5);

      // Tipo de receituário
      const tipoDesc = getDescricaoTipoReceituario(data.prescription.tipoReceituario);
      doc
        .fontSize(12)
        .font('Helvetica')
        .text(tipoDesc, { align: 'center' });

      doc.moveDown(1);

      // Dados do médico
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('DADOS DO MÉDICO');

      doc
        .fontSize(9)
        .font('Helvetica')
        .text(`Nome: ${data.doctor.name}`)
        .text(`CRM: ${data.doctor.crm}/${data.doctor.crmUf}`)
        .text(`Especialidade: ${data.doctor.especialidade || 'Não informada'}`);

      if (data.doctor.endereco) {
        doc.text(`Endereço: ${data.doctor.endereco}`);
      }
      if (data.doctor.telefone) {
        doc.text(`Telefone: ${data.doctor.telefone}`);
      }

      doc.moveDown(1);

      // Dados do paciente
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('DADOS DO PACIENTE');

      doc
        .fontSize(9)
        .font('Helvetica')
        .text(`Nome: ${data.patient.nomeCompleto}`);

      if (data.patient.dataNascimento) {
        doc.text(`Data de Nascimento: ${data.patient.dataNascimento}`);
      }
      if (data.patient.cpf) {
        doc.text(`CPF: ${data.patient.cpf}`);
      }

      doc.moveDown(1);

      // Medicamentos prescritos
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('MEDICAMENTOS PRESCRITOS');

      doc.moveDown(0.5);

      data.medications.forEach((med, index) => {
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .text(`${index + 1}. ${med.nomeProduto}`);

        if (med.apresentacao) {
          doc.font('Helvetica').text(`   Apresentação: ${med.apresentacao}`);
        }

        doc.text(`   Dose: ${med.dose}`);
        doc.text(`   Frequência: ${med.frequencia}`);
        doc.text(`   Duração: ${med.duracao}`);

        if (med.orientacoes) {
          doc.text(`   Orientações: ${med.orientacoes}`);
        }

        doc.moveDown(0.5);
      });

      // Orientações gerais
      if (data.prescription.orientacoes) {
        doc.moveDown(0.5);
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('ORIENTAÇÕES GERAIS');

        doc
          .fontSize(9)
          .font('Helvetica')
          .text(data.prescription.orientacoes);

        doc.moveDown(1);
      }

      // Data de emissão e validade
      doc.moveDown(1);
      doc
        .fontSize(9)
        .font('Helvetica')
        .text(`Data de Emissão: ${new Date(data.prescription.createdAt).toLocaleDateString('pt-BR')}`);

      if (data.prescription.dataValidade) {
        doc.text(`Válido até: ${new Date(data.prescription.dataValidade).toLocaleDateString('pt-BR')}`);
      }

      // Assinatura (se assinado)
      doc.moveDown(2);
      if (data.prescription.assinado) {
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('DOCUMENTO ASSINADO DIGITALMENTE', { align: 'center' });

        if (data.prescription.assinaturaData) {
          doc
            .fontSize(8)
            .font('Helvetica')
            .text(
              `Assinado em: ${new Date(data.prescription.assinaturaData).toLocaleString('pt-BR')}`,
              { align: 'center' }
            );
        }
      } else {
        doc.moveDown(2);
        doc
          .fontSize(9)
          .font('Helvetica')
          .text('_'.repeat(50), { align: 'center' });
        doc.text(`${data.doctor.name}`, { align: 'center' });
        doc.text(`CRM: ${data.doctor.crm}/${data.doctor.crmUf}`, { align: 'center' });
      }

      // QR Code para validação (se houver)
      if (data.prescription.qrCodeData) {
        doc.moveDown(1);
        QRCode.toDataURL(data.prescription.qrCodeData, { width: 150 })
          .then(qrDataUrl => {
            // Converter data URL para buffer
            const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
            const qrBuffer = Buffer.from(base64Data, 'base64');

            // Adicionar QR Code ao PDF (centralizado)
            const pageWidth = doc.page.width;
            const qrSize = 100;
            const xPosition = (pageWidth - qrSize) / 2;

            doc.image(qrBuffer, xPosition, doc.y, { width: qrSize });

            doc
              .fontSize(7)
              .font('Helvetica')
              .text('Escaneie para validar este documento', { align: 'center' });

            // Finalizar documento
            doc.end();
          })
          .catch(error => {
            console.error('Erro ao gerar QR Code:', error);
            // Finalizar mesmo sem QR Code
            doc.end();
          });
      } else {
        // Finalizar documento sem QR Code
        doc.end();
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Gera QR Code data para validação de documento
 */
export function generateQRCodeData(prescriptionId: number, doctorId: number): string {
  // URL para validação pública
  const baseUrl = process.env.VITE_APP_URL || 'https://medko.com.br';
  const validationUrl = `${baseUrl}/validar/${prescriptionId}`;

  // Dados adicionais para validação
  const data = {
    url: validationUrl,
    id: prescriptionId,
    doctor: doctorId,
    timestamp: new Date().toISOString(),
  };

  return JSON.stringify(data);
}

/**
 * Gera marca d'água de segurança no PDF
 */
export function addWatermark(doc: typeof PDFDocument, text: string) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  doc.save();
  doc
    .opacity(0.1)
    .fontSize(60)
    .font('Helvetica-Bold')
    .rotate(45, { origin: [pageWidth / 2, pageHeight / 2] })
    .text(text, 0, pageHeight / 2, {
      align: 'center',
      width: pageWidth,
    });
  doc.restore();
}
