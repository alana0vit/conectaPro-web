// CPF / CNPJ: máscara progressiva e validação dos dígitos verificadores.

export const apenasDigitos = (valor) => String(valor ?? "").replace(/\D/g, "");

export const mascararCpf = (valor) => {
  const d = apenasDigitos(valor).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
};

export const mascararCnpj = (valor) => {
  const d = apenasDigitos(valor).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
};

/** Aceita CPF (até 11 dígitos) ou CNPJ (12 a 14) e formata conforme o que foi digitado. */
export const mascararCpfCnpj = (valor) =>
  apenasDigitos(valor).length <= 11 ? mascararCpf(valor) : mascararCnpj(valor);

const todosIguais = (d) => /^(\d)\1+$/.test(d);

export const validarCpf = (valor) => {
  const d = apenasDigitos(valor);
  if (d.length !== 11 || todosIguais(d)) return false;
  const calcula = (tamanho) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(d[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return calcula(9) === Number(d[9]) && calcula(10) === Number(d[10]);
};

export const validarCnpj = (valor) => {
  const d = apenasDigitos(valor);
  if (d.length !== 14 || todosIguais(d)) return false;
  const calcula = (tamanho) => {
    const pesos = tamanho === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(d[i]) * pesos[i];
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return calcula(12) === Number(d[12]) && calcula(13) === Number(d[13]);
};

/** Para o react-hook-form: retorna true ou a mensagem de erro. */
export const validarCpfCnpj = (valor) => {
  const tamanho = apenasDigitos(valor).length;
  if (tamanho === 11) return validarCpf(valor) || "CPF inválido";
  if (tamanho === 14) return validarCnpj(valor) || "CNPJ inválido";
  return "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos)";
};

export const validarSomenteCpf = (valor) =>
  validarCpf(valor) || "CPF inválido";
