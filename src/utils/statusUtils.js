const STATUS_MAP = {
  ABERTO: { labelProfissional: 'Novo', labelCliente: 'Aguardando Resposta', classe: 'opened' },
  AGUARDANDO_PAGAMENTO: { labelProfissional: 'Aguardando Pagamento', labelCliente: 'Pagamento Pendente', classe: 'payment_pending' },
  AGUARDANDO: { labelProfissional: 'Em Andamento', labelCliente: 'Em Andamento', classe: 'in_waiting' },
  FECHADO: { labelProfissional: 'Finalizado', labelCliente: 'Concluída', classe: 'closed' },
  REJEITADO: { labelProfissional: 'Recusado', labelCliente: 'Recusada', classe: 'rejected' },
  EXPIRADO: { labelProfissional: 'Expirada', labelCliente: 'Expirada', classe: 'rejected' },
};

export function contatoLiberado(status) {
  const s = String(status || '').toUpperCase();
  return s === 'AGUARDANDO' || s === 'FECHADO';
}

export function traduzirStatus(status) {
  const entry = STATUS_MAP[String(status || '').toUpperCase()];
  return entry ? entry.labelProfissional : String(status || '');
}

export function traduzirStatusProfissional(status) {
  const entry = STATUS_MAP[String(status || '').toUpperCase()];
  return entry ? entry.labelProfissional : String(status || '');
}

export function traduzirStatusCliente(status) {
  const entry = STATUS_MAP[String(status || '').toUpperCase()];
  return entry ? entry.labelCliente : String(status || '');
}

export function getStatusClass(status) {
  const entry = STATUS_MAP[String(status || '').toUpperCase()];
  return entry ? entry.classe : 'opened';
}
