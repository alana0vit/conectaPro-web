// Seleção de várias imagens: soma às já escolhidas (em vez de substituir) e valida limites.

export const TAMANHO_MAX_MB = 5;

const chave = (f) => `${f.name}|${f.size}|${f.lastModified}`;

/**
 * @param {File[]} atuais já escolhidas
 * @param {File[]} novas recém-escolhidas no seletor
 * @param {{max?: number, maxMb?: number}} opcoes
 * @returns {{lista: File[], avisos: string[]}}
 */
export function mesclarImagens(atuais, novas, { max = 5, maxMb = TAMANHO_MAX_MB } = {}) {
  const lista = [...atuais];
  const avisos = [];
  const vistas = new Set(lista.map(chave));

  for (const arquivo of novas) {
    if (!arquivo.type.startsWith("image/")) {
      avisos.push(`"${arquivo.name}" não é uma imagem.`);
      continue;
    }
    if (arquivo.size > maxMb * 1024 * 1024) {
      avisos.push(`"${arquivo.name}" passa de ${maxMb} MB.`);
      continue;
    }
    if (vistas.has(chave(arquivo))) continue;
    if (lista.length >= max) {
      avisos.push(`Limite de ${max} imagens. As demais foram ignoradas.`);
      break;
    }
    vistas.add(chave(arquivo));
    lista.push(arquivo);
  }
  return { lista, avisos: [...new Set(avisos)] };
}
