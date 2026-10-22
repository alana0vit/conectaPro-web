import './DemandInfoBadges.css';

function formatarMoeda(valor) {
  if (valor == null || valor === '') return 'Não informado';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function formatarData(data) {
  if (!data) return 'Não informada';
  // Aceita ISO (2026-07-15) ou formatos com hora (2026-07-15T00:00:00)
  const d = new Date(data);
  if (isNaN(d.getTime())) return 'Não informada';
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function formatarEndereco(addressId) {
  if (!addressId) return null;
  const partes = [
    addressId.street,
    addressId.number,
    addressId.neighborhood,
    addressId.city,
  ].filter(Boolean);
  return partes.length > 0 ? partes.join(', ') : null;
}

function DemandInfoBadges({ demanda }) {
  const endereco = formatarEndereco(demanda?.addressId);

  return (
    <div className="demand-info-badges">
      {demanda?.categoryId?.name && (
        <span className="demand-category-tag">
          <i className="bi bi-tag-fill"></i>
          {demanda.categoryId.name}
        </span>
      )}

      {demanda?.code && (
        <span className="demand-code-tag">
          <i className="bi bi-hash"></i>
          {demanda.code}
        </span>
      )}

      <div className="demand-meta-row">
        <span className={`demand-meta-item ${!demanda?.suggestedValue ? 'empty' : ''}`}>
          <i className="bi bi-cash-coin"></i>
          {formatarMoeda(demanda?.suggestedValue)}
        </span>
        <span className={`demand-meta-item ${!demanda?.suggestedDate ? 'empty' : ''}`}>
          <i className="bi bi-calendar3"></i>
          {formatarData(demanda?.suggestedDate)}
        </span>
      </div>

      {endereco && (
        <span className="demand-address-line">
          <i className="bi bi-geo-alt"></i>
          {endereco}
        </span>
      )}
    </div>
  );
}

export default DemandInfoBadges;
