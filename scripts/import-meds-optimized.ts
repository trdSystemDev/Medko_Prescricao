import { readFileSync } from 'fs';
import { drizzle } from 'drizzle-orm/mysql2';
import { medications } from '../drizzle/schema';

const db = drizzle(process.env.DATABASE_URL!);

async function importMedications() {
  console.log('🚀 Iniciando importação de medicamentos...\n');

  try {
    // Ler arquivo em chunks
    console.log('📖 Lendo arquivo JSON...');
    const content = readFileSync('/home/ubuntu/medko/data/medicamentos.json', 'utf8');
    
    console.log('🔄 Parseando JSON...');
    const data = JSON.parse(content);
    
    const totalMeds = data.length;
    console.log(`📊 Total de medicamentos encontrados: ${totalMeds}\n`);

    // Processar em lotes de 500
    const BATCH_SIZE = 500;
    let imported = 0;

    for (let i = 0; i < totalMeds; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      
      const medicationsData = batch.map((med: any) => ({
        codigo: med.codigo || null,
        numeroRegistro: med.numeroRegistro || null,
        nomeProduto: med.nomeProduto || 'Sem nome',
        numeroProcesso: med.numeroProcesso || '',
        empresaNome: med.empresaNome || null,
        empresaCnpj: med.empresaCnpj || null,
        principioAtivo: med.principioAtivo || null,
        tarja: med.tarja || null,
        apresentacoes: med.apresentacoes ? (typeof med.apresentacoes === 'string' ? med.apresentacoes : JSON.stringify(med.apresentacoes)) : null,
        bula_txt: med.bula_txt ? med.bula_txt.substring(0, 65000) : null, // Limitar tamanho
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
      }));

      await db.insert(medications).values(medicationsData);
      imported += medicationsData.length;
      
      const progress = ((imported / totalMeds) * 100).toFixed(1);
      console.log(`✅ Progresso: ${imported}/${totalMeds} (${progress}%)`);
    }

    console.log(`\n🎉 Importação concluída com sucesso!`);
    console.log(`📊 Total importado: ${imported} medicamentos`);
    
  } catch (error) {
    console.error('❌ Erro durante importação:', error);
    throw error;
  }
}

importMedications()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
