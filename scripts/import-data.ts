import * as fs from 'fs';
import * as path from 'path';
import { drizzle } from 'drizzle-orm/mysql2';
import { medications } from '../drizzle/schema';
import { storagePut } from '../storage';

const DATA_DIR = path.join(process.cwd(), 'data');
const JSON_FILE = path.join(DATA_DIR, 'medicamentos.json');
const BULAS_DIR = path.join(DATA_DIR, 'bulas');

interface MedicamentoJSON {
  id: number;
  codigo?: string;
  numeroRegistro?: string;
  nomeProduto: string;
  numeroProcesso?: string;
  empresaNome?: string;
  empresaCnpj?: string;
  principioAtivo?: string;
  tarja?: string;
  apresentacoes?: string;
  medicamentoReferencia?: string;
  classesTerapeuticas?: string;
  bula_txt?: string;
  bula_pdf?: string;
  bula_txt_profissional?: string;
  bula_pdf_profissional?: string;
  categoriaRegulatoria?: string;
  situacaoRegistro?: string;
  dataProduto?: string;
  dataVencimentoRegistro?: string;
  dataPublicacao?: string;
  indicacao?: string;
}

async function importData() {
  console.log('🚀 Iniciando importação de medicamentos e bulas...\n');

  // 1. Verificar arquivos
  if (!fs.existsSync(JSON_FILE)) {
    console.error('❌ Erro: medicamentos.json não encontrado!');
    console.error(`   Execute primeiro: pnpm run validate-data`);
    process.exit(1);
  }

  if (!fs.existsSync(BULAS_DIR)) {
    console.error('❌ Erro: Pasta de bulas não encontrada!');
    process.exit(1);
  }

  // 2. Ler JSON
  console.log('📖 Lendo JSON de medicamentos...');
  const jsonContent = fs.readFileSync(JSON_FILE, 'utf-8');
  const medicamentosJSON: MedicamentoJSON[] = JSON.parse(jsonContent);
  console.log(`✅ ${medicamentosJSON.length} medicamentos encontrados\n`);

  // 3. Conectar ao banco
  console.log('🔌 Conectando ao banco de dados...');
  if (!process.env.DATABASE_URL) {
    console.error('❌ Erro: DATABASE_URL não configurada!');
    process.exit(1);
  }
  const db = drizzle(process.env.DATABASE_URL);
  console.log('✅ Conectado ao banco\n');

  // 4. Processar medicamentos
  let processados = 0;
  let comBulas = 0;
  let semBulas = 0;
  let erros = 0;

  console.log('⏳ Processando medicamentos...\n');

  for (let i = 0; i < medicamentosJSON.length; i++) {
    const med = medicamentosJSON[i];
    
    // Barra de progresso
    if (i % 100 === 0) {
      const progresso = ((i / medicamentosJSON.length) * 100).toFixed(1);
      process.stdout.write(`\r   Progresso: ${progresso}% (${i}/${medicamentosJSON.length})`);
    }

    try {
      let bulaPdfUrl: string | null = null;
      let bulaPdfProfissionalUrl: string | null = null;

      // 5. Upload de PDFs para S3 (se existirem)
      if (med.numeroProcesso) {
        const pdfPacientePath = path.join(BULAS_DIR, `${med.numeroProcesso}_paciente.pdf`);
        const pdfProfissionalPath = path.join(BULAS_DIR, `${med.numeroProcesso}_profissional.pdf`);

        // Upload bula do paciente
        if (fs.existsSync(pdfPacientePath)) {
          try {
            const pdfBuffer = fs.readFileSync(pdfPacientePath);
            const s3Key = `bulas/${med.numeroProcesso}_paciente.pdf`;
            const { url } = await storagePut(s3Key, pdfBuffer, 'application/pdf');
            bulaPdfUrl = url;
          } catch (error) {
            console.error(`\n⚠️  Erro ao fazer upload de ${med.numeroProcesso}_paciente.pdf:`, error);
          }
        }

        // Upload bula do profissional
        if (fs.existsSync(pdfProfissionalPath)) {
          try {
            const pdfBuffer = fs.readFileSync(pdfProfissionalPath);
            const s3Key = `bulas/${med.numeroProcesso}_profissional.pdf`;
            const { url } = await storagePut(s3Key, pdfBuffer, 'application/pdf');
            bulaPdfProfissionalUrl = url;
          } catch (error) {
            console.error(`\n⚠️  Erro ao fazer upload de ${med.numeroProcesso}_profissional.pdf:`, error);
          }
        }

        if (bulaPdfUrl && bulaPdfProfissionalUrl) {
          comBulas++;
        } else {
          semBulas++;
        }
      }

      // 6. Converter datas
      const parseDate = (dateStr?: string): Date | null => {
        if (!dateStr) return null;
        try {
          // Formato: "2018-10-1 03:00:00"
          const parts = dateStr.split(/[\s-:]/);
          if (parts.length >= 3) {
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
            const day = parseInt(parts[2]);
            return new Date(year, month, day);
          }
          return null;
        } catch {
          return null;
        }
      };

      // 7. Inserir no banco
      await db.insert(medications).values({
        codigo: med.codigo || null,
        numeroRegistro: med.numeroRegistro || null,
        nomeProduto: med.nomeProduto,
        numeroProcesso: med.numeroProcesso || null,
        empresaNome: med.empresaNome || null,
        empresaCnpj: med.empresaCnpj || null,
        principioAtivo: med.principioAtivo || null,
        tarja: med.tarja || null,
        apresentacoes: med.apresentacoes || null,
        medicamentoReferencia: med.medicamentoReferencia || null,
        classesTerapeuticas: med.classesTerapeuticas || null,
        categoriaRegulatoria: med.categoriaRegulatoria || null,
        bulaTxt: med.bula_txt || null,
        bulaPdfUrl: bulaPdfUrl,
        bulaTxtProfissional: med.bula_txt_profissional || null,
        bulaPdfProfissionalUrl: bulaPdfProfissionalUrl,
        situacaoRegistro: med.situacaoRegistro || null,
        indicacao: med.indicacao || null,
        dataProduto: parseDate(med.dataProduto),
        dataVencimentoRegistro: parseDate(med.dataVencimentoRegistro),
        dataPublicacao: parseDate(med.dataPublicacao),
      });

      processados++;
    } catch (error) {
      console.error(`\n❌ Erro ao processar medicamento ${med.nomeProduto}:`, error);
      erros++;
    }
  }

  // Limpar linha de progresso
  process.stdout.write('\r' + ' '.repeat(80) + '\r');

  // 8. Relatório final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO DE IMPORTAÇÃO');
  console.log('='.repeat(60));
  console.log(`\n✅ Medicamentos processados: ${processados}`);
  console.log(`📄 Com ambas as bulas: ${comBulas}`);
  console.log(`⚠️  Sem bulas: ${semBulas}`);
  console.log(`❌ Erros: ${erros}`);
  console.log('\n' + '='.repeat(60));

  if (erros > 0) {
    console.log('\n⚠️  Importação concluída com erros. Revise os logs acima.');
  } else {
    console.log('\n✅ Importação concluída com sucesso!');
  }

  console.log('\n💡 Próximos passos:');
  console.log('   1. Verifique os dados: pnpm run check-medications');
  console.log('   2. Crie índices para busca rápida');
  console.log('   3. Teste a busca de medicamentos no sistema\n');
}

importData().catch(error => {
  console.error('\n❌ Erro fatal durante importação:', error);
  process.exit(1);
});
