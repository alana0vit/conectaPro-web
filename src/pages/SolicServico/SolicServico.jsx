import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import BackButton from '../../components/BackButton';
import api from '../../services/api';
import { extrairMensagemErro } from '../../utils/errorUtils';
import { hojeISO, paraInputDate } from '../../utils/dateUtils';
import { mesclarImagens } from '../../utils/uploadUtils';
import './SolicServico.css';

function SolicServico() {
  const navigate = useNavigate();
  const location = useLocation();

  const professionalId = location.state?.professionalIdSelecionado;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [addressId, setAddressId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [suggestedValue, setSuggestedValue] = useState('');
  const [suggestedDate, setSuggestedDate] = useState('');
  const [imagens, setImagens] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [profName, setProfName] = useState('');

  const userStorage = localStorage.getItem('@ConectaPro:user');
  const usuarioLogado = userStorage ? JSON.parse(userStorage) : null;
  const clientId = usuarioLogado?.id;

  const hoje = hojeISO();
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxDateStr = paraInputDate(maxDate);

  // Soma as novas fotos às já escolhidas (antes, escolher de novo apagava as anteriores).
  const adicionarImagens = (e) => {
    const novas = Array.from(e.target.files || []);
    e.target.value = ''; // permite escolher o mesmo arquivo de novo depois de remover
    if (novas.length === 0) return;

    const { lista, avisos } = mesclarImagens(imagens, novas, { max: 5 });
    avisos.forEach((aviso) => toast.warn(aviso));
    setImagens(lista);
    setPreviews((antigos) => {
      antigos.forEach((src) => URL.revokeObjectURL(src));
      return lista.map((f) => URL.createObjectURL(f));
    });
  };

  useEffect(() => {
    const carregarDados = async () => {
      if (!clientId) return;
      try {
        const [addrRes, catRes, profRes] = await Promise.all([
          api.get(`/api/user/${clientId}/addresses`),
          api.get('/api/category'),
          professionalId
            ? api.get(`/api/user/${professionalId}`)
            : Promise.resolve({ data: { name: '', categories: [] } }),
        ]);
        setAddresses(addrRes.data);
        if (addrRes.data.length > 0) setAddressId(addrRes.data[0].id);
        setCategorias(catRes.data);
        setProfName(profRes.data.name);

        const primeiraCategoria = profRes.data.categories?.[0];
        if (primeiraCategoria) {
          setCategoryId(primeiraCategoria.id);
        } else if (catRes.data.length > 0) {
          setCategoryId(catRes.data[0].id);
        }
      } catch (error) {
        console.error('Erro ao carregar dados', error);
      }
    };
    carregarDados();
  }, [clientId, professionalId]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !addressId || !categoryId) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    if (suggestedDate) {
      const dataSelecionada = new Date(suggestedDate + 'T00:00:00');
      const hojeDate = new Date(hoje + 'T00:00:00');
      const maxDateObj = new Date(maxDateStr + 'T00:00:00');

      if (dataSelecionada <= hojeDate) {
        toast.error('A data sugerida deve ser futura.');
        return;
      }
      if (dataSelecionada > maxDateObj) {
        toast.error('A data sugerida não pode ultrapassar 1 ano a partir de hoje.');
        return;
      }
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('addressId', addressId);
    formData.append('categoryId', categoryId);
    formData.append('clientId', clientId);
    formData.append('professionalId', professionalId);
    if (suggestedValue) formData.append('suggestedValue', suggestedValue);
    if (suggestedDate) formData.append('suggestedDate', suggestedDate);
    if (imagens.length > 0) {
      imagens.forEach((img) => formData.append('imagens', img));
    }

    try {
      await api.post('/api/demand', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Solicitação enviada com sucesso!');
      navigate('/dashboard-cliente');
    } catch (error) {
      console.error('Erro ao criar demanda:', error);
      toast.error(extrairMensagemErro(error, 'Erro ao enviar solicitação.'));
      setIsSubmitting(false);
    }
  };

  if (!professionalId) {
    return (
      <div className="solic-container">
        <div className="solic-card" style={{ textAlign: 'center' }}>
          <h2>Nenhum profissional selecionado</h2>
          <p>Escolha um profissional na lista para enviar uma solicitação.</p>
          <button
            type="button"
            className="btn-enviar-solic"
            onClick={() => navigate('/lista-profissionais')}
          >
            Ver profissionais
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="solic-container">
      <div className="solic-card">
        <BackButton fallback="/lista-profissionais" />

        <div className="solic-header-text">
          <h2>Solicitar Serviço</h2>
          {profName ? (
            <p>Formulário de demanda para {profName}.</p>
          ) : (
            <p>Mantenha seus dados atualizados.</p>
          )}
        </div>

        <form onSubmit={onSubmit} className="solic-form">
          <div className="form-grid-layout">

            {/* Coluna Esquerda */}
            <div className="form-column">
              <div className="input-group">
                <label>Título da demanda*</label>
                <input
                  type="text"
                  placeholder="Ex: Conserto de torneira"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="input-group">
                <label>Categoria (definida pelo profissional)</label>
                <select value={categoryId} disabled>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Descrição *</label>
                <textarea
                  rows="6"
                  placeholder="Descreva o serviço detalhadamente..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-column">
              <div className="input-group">
                <label>Endereço *</label>
                <select value={addressId} onChange={(e) => setAddressId(e.target.value)} disabled={isSubmitting}>
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.street}, {a.number} - {a.neighborhood}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Valor máximo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Opcional"
                  value={suggestedValue}
                  onChange={(e) => setSuggestedValue(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="input-group">
                <label>Data sugerida</label>
                <input
                  type="date"
                  value={suggestedDate}
                  min={hoje}
                  max={maxDateStr}
                  onChange={(e) => setSuggestedDate(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="input-group upload-group">
                <label>Anexar Imagens (opcional)</label>
                <input
                  type="file"
                  id="imagemDemanda"
                  accept="image/*"
                  multiple
                  onChange={adicionarImagens}
                  disabled={isSubmitting}
                />
                {previews.length > 0 && (
                  <div className="preview-imagens">
                    {previews.map((src, i) => (
                      <div key={i} className="preview-item">
                        <img src={src} alt={`Preview ${i + 1}`} />
                        <button
                          type="button"
                          className="preview-remove"
                          onClick={() => {
                            URL.revokeObjectURL(previews[i]);
                            setImagens(imagens.filter((_, idx) => idx !== i));
                            setPreviews(previews.filter((_, idx) => idx !== i));
                          }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
                {previews.length > 0 && (
                  <p className="preview-count">
                    <i className="bi bi-images"></i> {previews.length} de 5 imagens (até 5 MB cada)
                  </p>
                )}
              </div>
            </div>

          </div>

          <div className="form-divider"></div>

          <div className="btn-container">
            <button
              type="submit"
              className="btn-enviar-solic"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SolicServico;