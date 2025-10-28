import { drizzle } from 'drizzle-orm/mysql2';
import { medications } from '../drizzle/schema';
import { count, sql, isNull, isNotNull } from 'drizzle-orm';

async function checkMedications() {
  console.log('🔍 Verificando medicamentos importados...\n');

  // Conectar ao banco
  if (!process.env.DATABASE_URL) {
    console.error('❌ Erro: DATABASE_URL não configurada!');
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  try {
    // Total de medicamentos
    const [totalResult] = await db.select({ count: count() }).from(medications);
    const total = totalResult.count;

    // Medicamentos com bulas
    const [comBulasResult] = await db
      .select({ count: count() })
      .from(medications)
      .where(sql`${medications.bulaPdfUrl} IS NOT NULL AND ${medications.bulaPdfProfissionalUrl} IS NOT NULL`);
    const comBulas = comBulasResult.count;

    // Medicamentos sem bula do paciente
    const [semBulaPacienteResult] = await db
      .select({ count: count() })
      .from(medications)
      .where(isNull(medications.bulaPdfUrl));
    const semBulaPaciente = semBulaPacienteResult.count;

    // Medicamentos sem bula do profissional
    const [semBulaProfissionalResult] = await db
      .select({ count: count() })
      .from(medications)
      .where(isNull(medications.bulaPdfProfissionalUrl));
    const semBulaProfissional = semBulaProfissionalResult.count;

    // Medicamentos por situação
    const [ativosResult] = await db
      .select({ count: count() })
      .from(medications)
      .where(sql`${medications.situacaoRegistro} = 'ATIVO'`);
    const ativos = ativosResult.count;

    // Medicamentos por tarja
    const porTarja = await db
      .select({
        tarja: medications.tarja,
        count: count(),
      })
      .from(medications)
      .groupBy(medications.tarja)
      .where(isNotNull(medications.tarja));

    // Relatório
    console.log('='.repeat(60));
    console.log('📊 RELATÓRIO DE MEDICAMENTOS');
    console.log('='.repeat(60));
    
    console.log('\n📋 Totais:');
    console.log(`   Total de medicamentos: ${total}`);
    console.log(`   Medicamentos ativos: ${ativos}`);
    console.log(`   Medicamentos inativos: ${total - ativos}`);

    console.log('\n📄 Bulas:');
    console.log(`   Com ambas as bulas: ${comBulas}`);
    console.log(`   Sem bula do paciente: ${semBulaPaciente}`);
    console.log(`   Sem bula do profissional: ${semBulaProfissional}`);

    console.log('\n🏷️  Por Tarja:');
    porTarja.forEach(item => {
      console.log(`   ${item.tarja || 'Sem tarja'}: ${item.count}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Verificação concluída!\n');

  } catch (error) {
    console.error('❌ Erro ao verificar medicamentos:', error);
    process.exit(1);
  }
}

checkMedications().catch(error => {
  console.error('\n❌ Erro inesperado:', error);
  process.exit(1);
});
