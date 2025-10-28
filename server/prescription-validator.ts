/**
 * Validador de prescrições médicas conforme legislação brasileira
 */

export type TipoReceituario =
  | 'simples'
  | 'controle_especial' // C1, C5
  | 'azul' // B1, B2
  | 'amarela' // A1, A2, A3
  | 'retinoides' // C2
  | 'talidomida'; // C3

export interface PrescriptionValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MedicationForPrescription {
  tarja: string;
  nomeProduto: string;
}

/**
 * Mapeia tarja do medicamento para tipo de receituário necessário
 */
export function getTipoReceituarioByTarja(tarja: string): TipoReceituario {
  const tarjaLower = tarja.toLowerCase();

  if (tarjaLower.includes('amarela') || tarjaLower.includes('a1') || tarjaLower.includes('a2') || tarjaLower.includes('a3')) {
    return 'amarela';
  }

  if (tarjaLower.includes('azul') || tarjaLower.includes('b1') || tarjaLower.includes('b2')) {
    return 'azul';
  }

  if (tarjaLower.includes('c2') || tarjaLower.includes('retinóide') || tarjaLower.includes('retinoide')) {
    return 'retinoides';
  }

  if (tarjaLower.includes('c3') || tarjaLower.includes('talidomida')) {
    return 'talidomida';
  }

  if (
    tarjaLower.includes('c1') ||
    tarjaLower.includes('c5') ||
    tarjaLower.includes('controle especial') ||
    tarjaLower.includes('vermelha sob restrição') ||
    tarjaLower.includes('vermelha sob restricao')
  ) {
    return 'controle_especial';
  }

  return 'simples';
}

/**
 * Valida uma prescrição conforme o tipo de receituário
 */
export function validatePrescription(
  tipoReceituario: TipoReceituario,
  medications: MedicationForPrescription[]
): PrescriptionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Validar quantidade de medicamentos por receita
  switch (tipoReceituario) {
    case 'amarela':
    case 'azul':
      if (medications.length > 1) {
        errors.push(`Receita ${tipoReceituario} permite apenas 1 medicamento por receita`);
      }
      break;

    case 'controle_especial':
      if (medications.length > 3) {
        errors.push('Receita de controle especial permite no máximo 3 medicamentos por receita');
      }
      break;

    case 'retinoides':
    case 'talidomida':
      if (medications.length > 1) {
        errors.push(`Receita de ${tipoReceituario} permite apenas 1 medicamento por receita`);
      }
      break;

    case 'simples':
      // Sem restrição de quantidade
      break;
  }

  // 2. Validar compatibilidade de tarja com tipo de receituário
  for (const med of medications) {
    const tipoNecessario = getTipoReceituarioByTarja(med.tarja);

    if (tipoNecessario !== tipoReceituario) {
      // Exceção: medicamentos simples podem ir em qualquer receita
      if (tipoNecessario !== 'simples') {
        errors.push(
          `Medicamento "${med.nomeProduto}" (tarja: ${med.tarja}) requer receita do tipo "${tipoNecessario}", mas está sendo prescrito em receita "${tipoReceituario}"`
        );
      }
    }
  }

  // 3. Avisos específicos por tipo
  switch (tipoReceituario) {
    case 'retinoides':
      warnings.push('Lembre-se: paciente deve assinar Termo de Consentimento de Risco');
      warnings.push('Validade: 30 dias');
      warnings.push('Abrangência: apenas no Estado de emissão');
      break;

    case 'talidomida':
      warnings.push('Lembre-se: paciente deve assinar Termo de Consentimento');
      warnings.push('Validade: 15 dias');
      warnings.push('Abrangência: apenas no Estado de emissão');
      break;

    case 'amarela':
      warnings.push('Validade: 30 dias');
      warnings.push('Retenção: 1 via retida na farmácia');
      break;

    case 'azul':
      warnings.push('Validade: 60 dias');
      warnings.push('Retenção: 1 via retida na farmácia');
      break;

    case 'controle_especial':
      warnings.push('Validade: 30 dias');
      warnings.push('Retenção: 1 via retida na farmácia');
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calcula data de validade da receita
 */
export function getDataValidade(tipoReceituario: TipoReceituario, dataEmissao: Date = new Date()): Date {
  const validade = new Date(dataEmissao);

  switch (tipoReceituario) {
    case 'talidomida':
      validade.setDate(validade.getDate() + 15); // 15 dias
      break;

    case 'amarela':
    case 'controle_especial':
    case 'retinoides':
      validade.setDate(validade.getDate() + 30); // 30 dias
      break;

    case 'azul':
      validade.setDate(validade.getDate() + 60); // 60 dias
      break;

    case 'simples':
      // Receita simples não tem validade definida em lei
      // Mas por boas práticas, definimos 1 ano
      validade.setFullYear(validade.getFullYear() + 1);
      break;
  }

  return validade;
}

/**
 * Verifica se assinatura digital é obrigatória
 */
export function isAssinaturaDigitalObrigatoria(tipoReceituario: TipoReceituario): boolean {
  // Conforme Resolução CFM 2.299/2021:
  // Receitas simples não exigem assinatura digital
  // Receitas de controle especial, exames e atestados exigem
  return tipoReceituario !== 'simples';
}

/**
 * Obtém descrição do tipo de receituário
 */
export function getDescricaoTipoReceituario(tipoReceituario: TipoReceituario): string {
  const descricoes: Record<TipoReceituario, string> = {
    simples: 'Receita Simples (Branca)',
    controle_especial: 'Receita de Controle Especial (Branca - C1/C5)',
    azul: 'Receita Azul (B1/B2 - Psicotrópicos)',
    amarela: 'Receita Amarela (A1/A2/A3 - Entorpecentes)',
    retinoides: 'Receita de Retinóides (C2)',
    talidomida: 'Receita de Talidomida (C3)',
  };

  return descricoes[tipoReceituario];
}
