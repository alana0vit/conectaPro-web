// Datas no fuso do usuário (toISOString() usa UTC e vira "amanhã" à noite no Brasil).

const doisDigitos = (n) => String(n).padStart(2, "0");

export const paraInputDate = (data) =>
  `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;

export const hojeISO = () => paraInputDate(new Date());

export const IDADE_MINIMA = 18;

/** Maior data de nascimento permitida (quem faz 18 anos hoje). */
export const maxNascimentoISO = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - IDADE_MINIMA);
  return paraInputDate(d);
};

export const MIN_NASCIMENTO_ISO = "1900-01-01";

/** Validador do react-hook-form para <input type="date"> de nascimento. */
export const validarNascimento = (valor) => {
  if (!valor) return "Informe a data de nascimento";
  if (valor < MIN_NASCIMENTO_ISO) return "Data de nascimento inválida";
  if (valor > maxNascimentoISO()) return `É necessário ter ${IDADE_MINIMA} anos ou mais`;
  return true;
};
