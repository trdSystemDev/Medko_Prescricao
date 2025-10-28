import { createReadStream } from 'fs';
import { chain } from 'stream-chain/index.js';
import { parser } from 'stream-json/Parser.js';
import { streamArray } from 'stream-json/streamers/StreamArray.js';
import { drizzle } from 'drizzle-orm/mysql2';
import { medications } from '../drizzle/schema';

const db = drizzle(process.env.DATABASE_URL!);

async function importMedications() {
  console.log('🚀 Iniciando importação de medicamentos...\n');

  const pipeline = chain([
    createReadStream('/home/ubuntu/medko/data/medicamentos.json'),
    parser(),
    streamArray(),
  ]);

  let batch: any[] = [];
  const BATCH_SIZE = 500;
  let imported = 0;
  let total = 0;

  return new Promise<void>((resolve, reject) => {
    pipeline.on('data', async (data) => {
      const med = data.value;
      total++;

      const medicationData = {
        codigo: med.codigo || null,
        numeroRegistro: med.numeroRegistro || null,
        nomeProduto: med.nomeProduto || 'Sem nome',
        numeroProcesso: med.numeroProcesso || '',
        empresaNome: med.empresaNome || null,
        empresaCnpj: med.empresaCnpj || null,
        principioAtivo: med.principioAtivo || null,
        tarja: med.tarja || null,
        apresentacoes: med.apresentacoes ? (typeof med.apresentacoes === 'string' ? med.apresentacoes : JSON.stringify(med.apresentacoes)) : null,
        bula_txt: med.bula_txt ? med.bula_txt.substring(0, 65000) : null,
        bula_pdf_url: med.bula_pdf_url || null,
        bula_txt_profissional: med.bula_txt_profissional ? med.bula_txt_profissional.substring(0, 65000) : null,
        bula_pdf_profissional_url: med.bula_pdf_profissional_url || null,
        categoriaRegulatoria: med.categoriaRegulatoria || null,
        situacaoRegistro: med.situacaoRegistro || null,
        medicamentoReferencia: med.medicamentoReferencia || null,
        classesTerapeuticas: med.classesTerapeuticas || null,
        indicacao: med.indicacao || null,
        dataProduto: med.dataProduto || null,
        dataVencimentoRegistro: med.dataVencimentoRegistro || null,
        dataPublicacao: med.dataPublicacao || null,
      };

      batch.push(medicationData);

      if (batch.length >= BATCH_SIZE) {
        pipeline.pause();
        
        try {
          await db.insert(medications).values(batch);
          imported += batch.length;
          const progress = ((imported / 17808) * 100).toFixed(1);
          console.log(`✅ Progresso: ${imported}/17808 (${progress}%)`);
          batch = [];
        } catch (error) {
          console.error('❌ Erro ao inserir lote:', error);
        }
        
        pipeline.resume();
      }
    });

    pipeline.on('end', async () => {
      // Inserir últimos registros
      if (batch.length > 0) {
        try {
          await db.insert(medications).values(batch);
          imported += batch.length;
          console.log(`✅ Progresso: ${imported}/17808 (100%)`);
        } catch (error) {
          console.error('❌ Erro ao inserir último lote:', error);
        }
      }

      console.log(`\n🎉 Importação concluída com sucesso!`);
      console.log(`📊 Total importado: ${imported} medicamentos`);
      resolve();
    });

    pipeline.on('error', (error) => {
      console.error('❌ Erro durante importação:', error);
      reject(error);
    });
  });
}

importMedications()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
