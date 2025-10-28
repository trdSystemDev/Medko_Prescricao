import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { drizzle } from 'drizzle-orm/mysql2';
import { medications } from '../drizzle/schema';

const db = drizzle(process.env.DATABASE_URL!);

interface Medication {
  id?: number;
  codigo?: string;
  numeroRegistro?: string;
  nomeProduto: string;
  numeroProcesso: string;
  empresaNome?: string;
  empresaCnpj?: string;
  principioAtivo?: string;
  tarja?: string;
  apresentacoes?: string;
  bula_txt?: string;
  bula_pdf_url?: string;
  bula_txt_profissional?: string;
  bula_pdf_profissional_url?: string;
  categoriaRegulatoria?: string;
  situacaoRegistro?: string;
  medicamentoReferencia?: string;
  classesTerapeuticas?: string;
  indicacao?: string;
  dataProduto?: string;
  dataVencimentoRegistro?: string;
  dataPublicacao?: string;
}

async function importMedications() {
  console.log('🚀 Iniciando importação de medicamentos...\n');

  const filePath = '/home/ubuntu/medko/data/medicamentos.json';
  const fileStream = createReadStream(filePath, { encoding: 'utf8' });
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let buffer = '';
  let medicationCount = 0;
  let batch: any[] = [];
  const BATCH_SIZE = 100;

  for await (const line of rl) {
    buffer += line;

    // Tentar parsear objetos JSON completos
    try {
      // Remover caracteres iniciais/finais que não são parte do array
      let cleanBuffer = buffer.trim();
      if (cleanBuffer.startsWith('[')) {
        cleanBuffer = cleanBuffer.substring(1);
      }
      if (cleanBuffer.endsWith(']')) {
        cleanBuffer = cleanBuffer.substring(0, cleanBuffer.length - 1);
      }

      // Dividir por objetos JSON
      const objects = cleanBuffer.split(/},\s*{/);
      
      for (let i = 0; i < objects.length - 1; i++) {
        let obj = objects[i].trim();
        if (!obj.startsWith('{')) obj = '{' + obj;
        if (!obj.endsWith('}')) obj = obj + '}';

        try {
          const medication: Medication = JSON.parse(obj);
          
          // Preparar dados para inserção
          const medicationData = {
            codigo: medication.codigo || null,
            numeroRegistro: medication.numeroRegistro || null,
            nomeProduto: medication.nomeProduto,
            numeroProcesso: medication.numeroProcesso,
            empresaNome: medication.empresaNome || null,
            empresaCnpj: medication.empresaCnpj || null,
            principioAtivo: medication.principioAtivo || null,
            tarja: medication.tarja || null,
            apresentacoes: medication.apresentacoes ? JSON.stringify(medication.apresentacoes) : null,
            bula_txt: medication.bula_txt || null,
            bula_pdf_url: medication.bula_pdf_url || null,
            bula_txt_profissional: medication.bula_txt_profissional || null,
            bula_pdf_profissional_url: medication.bula_pdf_profissional_url || null,
            categoriaRegulatoria: medication.categoriaRegulatoria || null,
            situacaoRegistro: medication.situacaoRegistro || null,
            medicamentoReferencia: medication.medicamentoReferencia || null,
            classesTerapeuticas: medication.classesTerapeuticas || null,
            indicacao: medication.indicacao || null,
            dataProduto: medication.dataProduto || null,
            dataVencimentoRegistro: medication.dataVencimentoRegistro || null,
            dataPublicacao: medication.dataPublicacao || null,
          };

          batch.push(medicationData);
          medicationCount++;

          // Inserir em lote
          if (batch.length >= BATCH_SIZE) {
            await db.insert(medications).values(batch);
            console.log(`✅ Importados ${medicationCount} medicamentos...`);
            batch = [];
          }
        } catch (parseError) {
          // Ignorar erros de parse de objetos incompletos
        }
      }

      // Manter o último objeto incompleto no buffer
      buffer = objects[objects.length - 1];
    } catch (error) {
      // Buffer ainda não contém um objeto completo
    }
  }

  // Inserir últimos registros
  if (batch.length > 0) {
    await db.insert(medications).values(batch);
    console.log(`✅ Importados ${medicationCount} medicamentos...`);
  }

  console.log(`\n✅ Importação concluída! Total: ${medicationCount} medicamentos`);
}

importMedications().catch(console.error);
