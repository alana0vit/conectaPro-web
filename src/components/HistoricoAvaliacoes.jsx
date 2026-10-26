import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUtils';
import './HistoricoAvaliacoes.css';

const ITENS_POR_PAGINA = 10;

// O back devolve os nomes dos arquivos em imgUrl; monta as URLs para exibir.
const fotosDaAvaliacao = (av) =>
  (Array.isArray(av.imgUrl) ? av.imgUrl : []).map(getImageUrl).filter(Boolean);

function HistoricoAvaliacoes({ profissionalId, profissionalNome, onClose }) {
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroEstrelas, setFiltroEstrelas] = useState('TODAS');
  const [paginaAtual, setPaginaAtual] = useState(1);

  useEffect(() => {
    if (!profissionalId) return;

    const buscar = async () => {
      try {
        const res = await api.get(`/api/rating/user/${profissionalId}`);
        setAvaliacoes(Array.isArray(res.data) ? res.data : []);
      } catch {
        toast.error('Não foi possível carregar as avaliações.');
      } finally {
        setCarregando(false);
      }
    };

    buscar();
  }, [profissionalId]);

  const media = avaliacoes.length > 0
    ? (avaliacoes.reduce((sum, a) => sum + (a.points || 0), 0) / avaliacoes.length).toFixed(1)
    : null;

  const avaliacoesFiltradas = useMemo(() => {
    if (filtroEstrelas === 'TODAS') return avaliacoes;
    const notaAlvo = Number(filtroEstrelas);
    return avaliacoes.filter((a) => a.points === notaAlvo);
  }, [avaliacoes, filtroEstrelas]);

  const avaliacoesVisiveis = avaliacoesFiltradas.slice(0, paginaAtual * ITENS_POR_PAGINA);
  const temMais = avaliacoesVisiveis.length < avaliacoesFiltradas.length;

  const handleFiltroChange = (valor) => {
    setFiltroEstrelas(valor);
    setPaginaAtual(1);
  };

  return (
    <div className="historico-overlay" onClick={onClose}>
      <div className="historico-modal" onClick={(e) => e.stopPropagation()}>

        <div className="historico-modal-header">
          <h3>Avaliações — {profissionalNome}</h3>
          <button onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>

        {media && (
          <div className="historico-resumo">
            <span className="historico-nota-grande">{media}</span>
            <div>
              <div className="historico-estrelas-row">
                {[1, 2, 3, 4, 5].map((s) => (
                  <i key={s} className={`bi ${s <= Math.round(Number(media)) ? 'bi-star-fill' : 'bi-star'}`}></i>
                ))}
              </div>
              <div className="historico-total-label">{avaliacoes.length} {avaliacoes.length === 1 ? 'avaliação' : 'avaliações'}</div>
            </div>
          </div>
        )}

        {avaliacoes.length > 0 && (
          <div className="historico-filtro-row">
            <label htmlFor="filtro-estrelas-historico">Filtrar por nota</label>
            <select
              id="filtro-estrelas-historico"
              value={filtroEstrelas}
              onChange={(e) => handleFiltroChange(e.target.value)}
            >
              <option value="TODAS">Todas as notas</option>
              <option value="5">5 estrelas</option>
              <option value="4">4 estrelas</option>
              <option value="3">3 estrelas</option>
              <option value="2">2 estrelas</option>
              <option value="1">1 estrela</option>
            </select>
          </div>
        )}

        <div className="historico-lista">
          {carregando ? (
            <div className="historico-estado">
              <i className="bi bi-hourglass-split"></i>
              <p>Carregando avaliações...</p>
            </div>
          ) : avaliacoes.length === 0 ? (
            <div className="historico-estado">
              <i className="bi bi-chat-square"></i>
              <p>Este profissional ainda não recebeu avaliações.</p>
            </div>
          ) : avaliacoesFiltradas.length === 0 ? (
            <div className="historico-estado">
              <i className="bi bi-filter-circle"></i>
              <p>Nenhuma avaliação encontrada com esse filtro.</p>
            </div>
          ) : (
            <>
              {avaliacoesVisiveis.map((av, i) => (
                <div key={av.id ?? i} className="historico-item">
                  <div className="historico-item-header">
                    <span>
                      {av.anonymous
                        ? <span className="historico-anonimo">Avaliador anônimo</span>
                        : <span className="historico-avaliador">{av.evaluatingPerson?.name || 'Cliente'}</span>
                      }
                    </span>
                    <div className="historico-stars">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <i key={s} className={`bi bi-star-fill ${s > av.points ? 'vazia' : ''}`}></i>
                      ))}
                    </div>
                  </div>

                  {av.description && (
                    <p className="historico-comentario">{av.description}</p>
                  )}

                  {fotosDaAvaliacao(av).length > 0 && (
                    <div className="historico-fotos">
                      {fotosDaAvaliacao(av).map((url, j) => (
                        <a key={j} href={url} target="_blank" rel="noreferrer">
                          <img src={url} alt={`Foto ${j + 1}`} loading="lazy" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {temMais && (
                <button
                  className="historico-btn-carregar-mais"
                  onClick={() => setPaginaAtual((p) => p + 1)}
                >
                  Carregar mais avaliações
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}

export default HistoricoAvaliacoes;