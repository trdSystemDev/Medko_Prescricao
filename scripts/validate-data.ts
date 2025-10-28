import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const JSON_FILE = path.join(DATA_DIR, 'medicamentos.json');
const BULAS_DIR = path.join(DATA_DIR, 'bulas');

interface Medicamento {
  id: number;
  numeroProcesso: string;
  nomeProduto: string;
  bula_pdf?: string;
  bula_pdf_profissional?: string;
}

async function validateData() {
  console.log('🔍 Validando dados de importação...\n');

  // 1. Verificar se o JSON existe
  if (!fs.existsSync(JSON_FILE)) {
    console.error('❌ Erro: Arquivo medicamentos.json não encontrado!');
    console.error(`   Esperado em: ${JSON_FILE}`);
    console.error('\n📋 Copie seu arquivo JSON para:');
    console.error(`   ${JSON_FILE}\n`);
    process.exit(1);
  }

  console.log('✅ Arquivo medicamentos.json encontrado');

  // 2. Verificar se a pasta de bulas existe
  if (!fs.existsSync(BULAS_DIR)) {
    console.error('❌ Erro: Pasta de bulas não encontrada!');
    console.error(`   Esperado em: ${BULAS_DIR}`);
    process.exit(1);
  }

  console.log('✅ Pasta de bulas encontrada');

  // 3. Ler e validar o JSON
  let medicamentos: Medicamento[];
  try {
    const jsonContent = fs.readFileSync(JSON_FILE, 'utf-8');
    medicamentos = JSON.parse(jsonContent);
    
    if (!Array.isArray(medicamentos)) {
      throw new Error('JSON deve ser um array de medicamentos');
    }
    
    console.log(`✅ JSON válido com ${medicamentos.length} medicamentos`);
  } catch (error) {
    console.error('❌ Erro ao ler JSON:', error);
    process.exit(1);
  }

  // 4. Validar estrutura dos medicamentos
  const semNumeroProcesso: string[] = [];
  const numeroProcessos = new Set<string>();
  const duplicados: string[] = [];

  medicamentos.forEach((med, index) => {
    if (!med.numeroProcesso) {
      semNumeroProcesso.push(`Medicamento #${index + 1}: ${med.nomeProduto || 'sem nome'}`);
    } else {
      if (numeroProcessos.has(med.numeroProcesso)) {
        duplicados.push(med.numeroProcesso);
      }
      numeroProcessos.add(med.numeroProcesso);
    }
  });

  if (semNumeroProcesso.length > 0) {
    console.warn(`\n⚠️  ${semNumeroProcesso.length} medicamentos sem numeroProcesso:`);
    semNumeroProcesso.slice(0, 5).forEach(msg => console.warn(`   - ${msg}`));
    if (semNumeroProcesso.length > 5) {
      console.warn(`   ... e mais ${semNumeroProcesso.length - 5}`);
    }
  }

  if (duplicados.length > 0) {
    console.error(`\n❌ ${duplicados.length} numeroProcesso duplicados encontrados:`);
    duplicados.slice(0, 5).forEach(np => console.error(`   - ${np}`));
    if (duplicados.length > 5) {
      console.error(`   ... e mais ${duplicados.length - 5}`);
    }
  }

  // 5. Verificar PDFs
  console.log('\n🔍 Verificando PDFs de bulas...');
  
  const pdfFiles = fs.readdirSync(BULAS_DIR);
  console.log(`✅ ${pdfFiles.length} arquivos PDF encontrados na pasta`);

  const pdfsPaciente = new Set<string>();
  const pdfsProfissional = new Set<string>();
  const pdfsInvalidos: string[] = [];

  pdfFiles.forEach(file => {
    if (!file.endsWith('.pdf')) {
      pdfsInvalidos.push(file);
      return;
    }

    if (file.endsWith('_paciente.pdf')) {
      const numeroProcesso = file.replace('_paciente.pdf', '');
      pdfsPaciente.add(numeroProcesso);
    } else if (file.endsWith('_profissional.pdf')) {
      const numeroProcesso = file.replace('_profissional.pdf', '');
      pdfsProfissional.add(numeroProcesso);
    } else {
      pdfsInvalidos.push(file);
    }
  });

  if (pdfsInvalidos.length > 0) {
    console.warn(`\n⚠️  ${pdfsInvalidos.length} arquivos com nomenclatura inválida:`);
    pdfsInvalidos.slice(0, 5).forEach(file => console.warn(`   - ${file}`));
    if (pdfsInvalidos.length > 5) {
      console.warn(`   ... e mais ${pdfsInvalidos.length - 5}`);
    }
    console.warn('\n   Padrão esperado: {numeroProcesso}_paciente.pdf ou {numeroProcesso}_profissional.pdf');
  }

  // 6. Verificar correspondência entre medicamentos e PDFs
  const semBulaPaciente: string[] = [];
  const semBulaProfissional: string[] = [];
  const comBulas: string[] = [];

  medicamentos.forEach(med => {
    if (!med.numeroProcesso) return;

    const temPaciente = pdfsPaciente.has(med.numeroProcesso);
    const temProfissional = pdfsProfissional.has(med.numeroProcesso);

    if (!temPaciente) {
      semBulaPaciente.push(`${med.numeroProcesso} - ${med.nomeProduto}`);
    }
    if (!temProfissional) {
      semBulaProfissional.push(`${med.numeroProcesso} - ${med.nomeProduto}`);
    }
    if (temPaciente && temProfissional) {
      comBulas.push(med.numeroProcesso);
    }
  });

  // 7. Relatório final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO DE VALIDAÇÃO');
  console.log('='.repeat(60));
  
  console.log('\n📋 Medicamentos:');
  console.log(`   Total: ${medicamentos.length}`);
  console.log(`   Com numeroProcesso: ${numeroProcessos.size}`);
  console.log(`   Sem numeroProcesso: ${semNumeroProcesso.length}`);
  console.log(`   Duplicados: ${duplicados.length}`);

  console.log('\n📄 PDFs:');
  console.log(`   Total de arquivos: ${pdfFiles.length}`);
  console.log(`   Bulas do paciente: ${pdfsPaciente.size}`);
  console.log(`   Bulas do profissional: ${pdfsProfissional.size}`);
  console.log(`   Arquivos inválidos: ${pdfsInvalidos.length}`);

  console.log('\n🔗 Correspondência:');
  console.log(`   Medicamentos com ambas as bulas: ${comBulas.length}`);
  console.log(`   Medicamentos sem bula do paciente: ${semBulaPaciente.length}`);
  console.log(`   Medicamentos sem bula do profissional: ${semBulaProfissional.length}`);

  if (semBulaPaciente.length > 0) {
    console.log('\n⚠️  Medicamentos sem bula do paciente (primeiros 10):');
    semBulaPaciente.slice(0, 10).forEach(msg => console.log(`   - ${msg}`));
    if (semBulaPaciente.length > 10) {
      console.log(`   ... e mais ${semBulaPaciente.length - 10}`);
    }
  }

  if (semBulaProfissional.length > 0) {
    console.log('\n⚠️  Medicamentos sem bula do profissional (primeiros 10):');
    semBulaProfissional.slice(0, 10).forEach(msg => console.log(`   - ${msg}`));
    if (semBulaProfissional.length > 10) {
      console.log(`   ... e mais ${semBulaProfissional.length - 10}`);
    }
  }

  // 8. Conclusão
  console.log('\n' + '='.repeat(60));
  
  const temErros = duplicados.length > 0;
  const temAvisos = semNumeroProcesso.length > 0 || 
                    pdfsInvalidos.length > 0 || 
                    semBulaPaciente.length > 0 || 
                    semBulaProfissional.length > 0;

  if (temErros) {
    console.log('❌ VALIDAÇÃO FALHOU - Corrija os erros antes de importar');
    process.exit(1);
  } else if (temAvisos) {
    console.log('⚠️  VALIDAÇÃO COM AVISOS - Revise antes de importar');
    console.log('\n💡 Você pode prosseguir com a importação, mas alguns medicamentos');
    console.log('   não terão bulas disponíveis para visualização.');
    process.exit(0);
  } else {
    console.log('✅ VALIDAÇÃO COMPLETA - Pronto para importar!');
    console.log('\n🚀 Execute: pnpm run import-data');
    process.exit(0);
  }
}

validateData().catch(error => {
  console.error('\n❌ Erro inesperado:', error);
  process.exit(1);
});
