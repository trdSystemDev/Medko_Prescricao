import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { logAudit, AuditActions, ResourceTypes, getClientIp, getUserAgent } from "./audit";
import {
  validatePrescription,
  getTipoReceituarioByTarja,
  getDataValidade,
  type TipoReceituario,
} from "./prescription-validator";
import { generatePrescriptionPDF, generateQRCodeData, type PrescriptionPDFData } from "./pdf-generator";
import { signDocument, getCertificateInfo } from "./digital-signature";
import { storagePut } from "./storage";
import { sendPrescription } from "./zenvia";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Rotas de pacientes
  patients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'doctor') {
        throw new Error('Only doctors can access patients');
      }

      await logAudit({
        userId: ctx.user.id,
        userRole: ctx.user.role,
        action: 'LIST_PATIENTS',
        ipAddress: getClientIp(ctx.req),
        userAgent: getUserAgent(ctx.req),
      });

      return db.getPatientsByDoctor(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'doctor') {
          throw new Error('Only doctors can access patients');
        }

        const patient = await db.getPatientById(input.id, ctx.user.id);

        await logAudit({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          action: AuditActions.VIEW_PATIENT,
          resourceType: ResourceTypes.PATIENT,
          resourceId: input.id,
          ipAddress: getClientIp(ctx.req),
          userAgent: getUserAgent(ctx.req),
        });

        return patient;
      }),

    create: protectedProcedure
      .input(
        z.object({
          nomeCompleto: z.string().min(3),
          cpf: z.string().optional(),
          rg: z.string().optional(),
          dataNascimento: z.string().optional(),
          sexo: z.enum(['M', 'F', 'O']).optional(),
          telefone: z.string().optional(),
          email: z.string().email().optional(),
          endereco: z.string().optional(),
          observacoes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'doctor') {
          throw new Error('Only doctors can create patients');
        }

        const patient = await db.createPatient(ctx.user.id, input);

        await logAudit({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          action: AuditActions.CREATE_PATIENT,
          resourceType: ResourceTypes.PATIENT,
          resourceId: patient.id,
          ipAddress: getClientIp(ctx.req),
          userAgent: getUserAgent(ctx.req),
          metadata: { patientName: input.nomeCompleto },
        });

        return patient;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          nomeCompleto: z.string().min(3).optional(),
          cpf: z.string().optional(),
          rg: z.string().optional(),
          dataNascimento: z.string().optional(),
          sexo: z.enum(['M', 'F', 'O']).optional(),
          telefone: z.string().optional(),
          email: z.string().email().optional(),
          endereco: z.string().optional(),
          observacoes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'doctor') {
          throw new Error('Only doctors can update patients');
        }

        const { id, ...data } = input;
        const patient = await db.updatePatient(id, ctx.user.id, data);

        await logAudit({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          action: AuditActions.UPDATE_PATIENT,
          resourceType: ResourceTypes.PATIENT,
          resourceId: id,
          ipAddress: getClientIp(ctx.req),
          userAgent: getUserAgent(ctx.req),
        });

        return patient;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'doctor') {
          throw new Error('Only doctors can delete patients');
        }

        await db.deletePatient(input.id, ctx.user.id);

        await logAudit({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          action: AuditActions.DELETE_PATIENT,
          resourceType: ResourceTypes.PATIENT,
          resourceId: input.id,
          ipAddress: getClientIp(ctx.req),
          userAgent: getUserAgent(ctx.req),
        });

        return { success: true };
      }),
  }),

  // Rotas de médicos
  doctors: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'doctor') {
        throw new Error('Only doctors can access this endpoint');
      }
      return ctx.user;
    }),

    updateProfile: protectedProcedure
      .input(
        z.object({
          crm: z.string().optional(),
          crmUf: z.string().length(2).optional(),
          especialidade: z.string().optional(),
          rqe: z.string().optional(),
          endereco: z.string().optional(),
          telefone: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'doctor') {
          throw new Error('Only doctors can update profile');
        }

        // TODO: Implementar atualização do perfil do médico
        // await db.updateDoctorProfile(ctx.user.id, input);

        await logAudit({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          action: 'UPDATE_PROFILE',
          resourceType: ResourceTypes.USER,
          resourceId: ctx.user.id,
          ipAddress: getClientIp(ctx.req),
          userAgent: getUserAgent(ctx.req),
        });

        return { success: true };
      }),
  }),

  // Rotas de medicamentos
  medications: router({
    search: protectedProcedure
      .input(
        z.object({
          query: z.string().min(2),
          tarja: z.string().optional(),
          categoriaRegulatoria: z.string().optional(),
          situacaoRegistro: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const { query, ...filters } = input;
        
        await logAudit({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          action: AuditActions.SEARCH_MEDICATION,
          ipAddress: getClientIp(ctx.req),
          userAgent: getUserAgent(ctx.req),
          metadata: { query, filters },
        });

        return db.searchMedications(query, filters);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const medication = await db.getMedicationById(input.id);

        await logAudit({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          action: AuditActions.VIEW_MEDICATION,
          resourceType: ResourceTypes.MEDICATION,
          resourceId: input.id,
          ipAddress: getClientIp(ctx.req),
          userAgent: getUserAgent(ctx.req),
        });

        return medication;
      }),

    getByNumeroProcesso: protectedProcedure
      .input(z.object({ numeroProcesso: z.string() }))
      .query(async ({ ctx, input }) => {
        const medication = await db.getMedicationByNumeroProcesso(input.numeroProcesso);

        await logAudit({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          action: AuditActions.VIEW_MEDICATION,
          resourceType: ResourceTypes.MEDICATION,
          ipAddress: getClientIp(ctx.req),
          userAgent: getUserAgent(ctx.req),
          metadata: { numeroProcesso: input.numeroProcesso },
        });

        return medication;
      }),

    getBula: protectedProcedure
      .input(
        z.object({
          numeroProcesso: z.string(),
          tipo: z.enum(['paciente', 'profissional']),
        })
      )
      .query(async ({ ctx, input }) => {
        const medication = await db.getMedicationByNumeroProcesso(input.numeroProcesso);

        if (!medication) {
          throw new Error('Medication not found');
        }

        const bulaUrl =
          input.tipo === 'paciente'
            ? medication.bulaPdfUrl
            : medication.bulaPdfProfissionalUrl;

        await logAudit({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          action: AuditActions.VIEW_BULA,
          resourceType: ResourceTypes.MEDICATION,
          ipAddress: getClientIp(ctx.req),
          userAgent: getUserAgent(ctx.req),
          metadata: {
            numeroProcesso: input.numeroProcesso,
            tipo: input.tipo,
          },
        });

        return {
          url: bulaUrl,
          nomeProduto: medication.nomeProduto,
          tipo: input.tipo,
        };
      }),
  }),

  // Rotas de prescrições
  prescriptions: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'doctor') {
        throw new Error('Only doctors can access prescriptions');
      }

      return db.getPrescriptionsByDoctor(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'doctor') {
          throw new Error('Only doctors can access prescriptions');
        }

        const prescription = await db.getPrescriptionById(input.id, ctx.user.id);

        await logAudit({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          action: AuditActions.VIEW_PRESCRIPTION,
          resourceType: ResourceTypes.PRESCRIPTION,
          resourceId: input.id,
          ipAddress: getClientIp(ctx.req),
          userAgent: getUserAgent(ctx.req),
        });

        return prescription;
      }),

    getByPatient: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'doctor') {
          throw new Error('Only doctors can access prescriptions');
        }

        return db.getPrescriptionsByPatient(input.patientId, ctx.user.id);
      }),

    validate: protectedProcedure
      .input(
        z.object({
          tipoReceituario: z.enum([
            'simples',
            'controle_especial',
            'azul',
            'amarela',
            'retinoides',
            'talidomida',
          ]),
          medications: z.array(
            z.object({
              tarja: z.string(),
              nomeProduto: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'doctor') {
          throw new Error('Only doctors can validate prescriptions');
        }

        const validation = validatePrescription(
          input.tipoReceituario as TipoReceituario,
          input.medications
        );

        return validation;
      }),

    create: protectedProcedure
      .input(
        z.object({
          patientId: z.number(),
          tipoReceituario: z.enum([
            'simples',
            'controle_especial',
            'azul',
            'amarela',
            'retinoides',
            'talidomida',
          ]),
          medications: z.array(
            z.object({
              medicationId: z.number(),
              tarja: z.string(),
              nomeProduto: z.string(),
              dose: z.string(),
              frequencia: z.string(),
              duracao: z.string(),
              orientacoes: z.string().optional(),
            })
          ),
          observacoes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'doctor') {
          throw new Error('Only doctors can create prescriptions');
        }

        // Validar prescrição
        const validation = validatePrescription(
          input.tipoReceituario as TipoReceituario,
          input.medications
        );

        if (!validation.valid) {
          throw new Error(`Prescrição inválida: ${validation.errors.join(', ')}`);
        }

        // Calcular data de validade
        const dataValidade = getDataValidade(input.tipoReceituario as TipoReceituario);

        // Criar prescrição
        const prescription = await db.createPrescription({
          doctorId: ctx.user.id,
          patientId: input.patientId,
          tipoReceituario: input.tipoReceituario,
          medicamentos: JSON.stringify(input.medications),
          orientacoes: input.observacoes || null,
          dataValidade,
        });

        await logAudit({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          action: AuditActions.CREATE_PRESCRIPTION,
          resourceType: ResourceTypes.PRESCRIPTION,
          resourceId: prescription.id,
          ipAddress: getClientIp(ctx.req),
          userAgent: getUserAgent(ctx.req),
          metadata: {
            patientId: input.patientId,
            tipoReceituario: input.tipoReceituario,
            medicationsCount: input.medications.length,
          },
        });

        return {
          prescription,
          validation,
        };
      }),

    generatePDF: protectedProcedure
      .input(z.object({ prescriptionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'doctor') {
          throw new Error('Only doctors can generate PDFs');
        }

        // Buscar prescrição
        const prescription = await db.getPrescriptionById(input.prescriptionId, ctx.user.id);
        if (!prescription) {
          throw new Error('Prescription not found');
        }

        // Buscar dados do paciente
        const patient = await db.getPatientById(prescription.patientId, ctx.user.id);
        if (!patient) {
          throw new Error('Patient not found');
        }

        // Parsear medicamentos
        const medications = JSON.parse(prescription.medicamentos);

        // Gerar QR Code data
        const qrCodeData = generateQRCodeData(prescription.id, ctx.user.id);

        // Preparar dados para PDF
        const pdfData: PrescriptionPDFData = {
          prescription: { ...prescription, qrCodeData },
          doctor: {
            name: ctx.user.name || 'Médico',
            crm: ctx.user.crm || '',
            crmUf: ctx.user.crmUf || '',
            especialidade: ctx.user.especialidade || undefined,
            endereco: ctx.user.endereco || undefined,
            telefone: ctx.user.telefone || undefined,
          },
          patient: {
            nomeCompleto: patient.nomeCompleto,
            dataNascimento: patient.dataNascimento || undefined,
            cpf: patient.cpf || undefined,
          },
          medications,
        };

        // Gerar PDF
        const pdfBuffer = await generatePrescriptionPDF(pdfData);

        // Upload para S3
        const s3Key = `prescriptions/${prescription.id}_${Date.now()}.pdf`;
        const { url: pdfUrl } = await storagePut(s3Key, pdfBuffer, 'application/pdf');

        // Atualizar prescrição com URL do PDF e QR Code
        await db.updatePrescription(input.prescriptionId, ctx.user.id, {
          pdfUrl,
          qrCodeData,
        });

        await logAudit({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          action: 'GENERATE_PRESCRIPTION_PDF',
          resourceType: ResourceTypes.PRESCRIPTION,
          resourceId: input.prescriptionId,
          ipAddress: getClientIp(ctx.req),
          userAgent: getUserAgent(ctx.req),
        });

        return {
          pdfUrl,
          qrCodeData,
        };
      }),

    sign: protectedProcedure
      .input(z.object({ prescriptionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'doctor') {
          throw new Error('Only doctors can sign prescriptions');
        }

        // Buscar prescrição
        const prescription = await db.getPrescriptionById(input.prescriptionId, ctx.user.id);
        if (!prescription) {
          throw new Error('Prescription not found');
        }

        // Obter informações do certificado
        const certInfo = getCertificateInfo({
          name: ctx.user.name || 'Médico',
          crm: ctx.user.crm || '',
          crmUf: ctx.user.crmUf || '',
        });

        // Assinar documento
        const signature = await signDocument(prescription.medicamentos, certInfo);

        // Atualizar prescrição
        await db.updatePrescription(input.prescriptionId, ctx.user.id, {
          assinado: 1,
          assinaturaData: signature.timestamp,
          assinaturaCertificado: JSON.stringify(signature),
        });

        await logAudit({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          action: AuditActions.SIGN_PRESCRIPTION,
          resourceType: ResourceTypes.PRESCRIPTION,
          resourceId: input.prescriptionId,
          ipAddress: getClientIp(ctx.req),
          userAgent: getUserAgent(ctx.req),
        });

        return {
          signed: true,
          signature,
        };
      }),

    send: protectedProcedure
      .input(
        z.object({
          prescriptionId: z.number(),
          channel: z.enum(['sms', 'whatsapp']),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'doctor') {
          throw new Error('Only doctors can send prescriptions');
        }

        // Buscar prescrição
        const prescription = await db.getPrescriptionById(input.prescriptionId, ctx.user.id);
        if (!prescription) {
          throw new Error('Prescription not found');
        }

        if (!prescription.pdfUrl) {
          throw new Error('PDF not generated yet. Generate PDF first.');
        }

        // Buscar dados do paciente
        const patient = await db.getPatientById(prescription.patientId, ctx.user.id);
        if (!patient) {
          throw new Error('Patient not found');
        }

        if (!patient.telefone) {
          throw new Error('Patient phone number not found');
        }

        // Enviar via Zenvia
        const result = await sendPrescription({
          patientPhone: patient.telefone,
          patientName: patient.nomeCompleto,
          doctorName: ctx.user.name || 'Médico',
          pdfUrl: prescription.pdfUrl,
          channel: input.channel,
        });

        await logAudit({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          action: AuditActions.SEND_PRESCRIPTION,
          resourceType: ResourceTypes.PRESCRIPTION,
          resourceId: input.prescriptionId,
          ipAddress: getClientIp(ctx.req),
          userAgent: getUserAgent(ctx.req),
          success: result.success,
          metadata: {
            channel: input.channel,
            messageId: result.messageId,
            error: result.error,
          },
        });

        return result;
      }),
  }),
});

export type AppRouter = typeof appRouter;
