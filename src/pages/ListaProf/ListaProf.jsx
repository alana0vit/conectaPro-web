import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import imagemBusca from "../../assets/ImgLista1.jpg";
import api from "../../services/api";
import HistoricoAvaliacoes from "../../components/HistoricoAvaliacoes";
import { getImageUrl } from "../../utils/imageUtils";
import "./ListaProf.css";

const INTERVALO_REFRESH = 30_000;
const ITENS_POR_PAGINA = 5;

function ListaProf() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profissionais, setProfissionais] = useState([]);
  const [termoBusca, setTermoBusca] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [filtroEstrelas, setFiltroEstrelas] = useState("TODOS");
  const reassignDemandId = location.state?.reassignDemandId || null;
  const [raioKm, setRaioKm] = useState(20);
  const [modalAvaliacoes, setModalAvaliacoes] = useState(null);
  const [fotoExpandida, setFotoExpandida] = useState(null);
  const ultimosFiltrosRef = useRef({});

  const [paginaAtual, setPaginaAtual] = useState(1);
  const [usandoLocalizacao, setUsandoLocalizacao] = useState(false);

  const buscarProfissionais = async (filtros = {}) => {
    ultimosFiltrosRef.current = filtros;

    try {
      let response;
      const temFiltros = Object.values(filtros).some(
        (v) => v !== undefined && v !== "",
      );

      if (temFiltros) {
        response = await api.get("/api/user/search", { params: filtros });
      } else {
        response = await api.get("/api/user");
      }

      const apenasProfissionais = response.data.filter(
        (u) => u.userType === "PROFESSIONAL",
      );

      setProfissionais(apenasProfissionais);
    } catch (error) {
      console.error("Erro ao buscar profissionais:", error);
    }
  };

  useEffect(() => {
    buscarProfissionais();
    api.get("/api/category")
      .then((res) => setCategorias(res.data))
      .catch((err) => console.error(err));
  }, []);

  const lidarComBusca = (e) => {
    // Previne o comportamento padrão do form (recarregar a página) se a função for chamada por ele.
    if (e && e.preventDefault) e.preventDefault();

    if (usandoLocalizacao) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          buscarProfissionais({
            name: termoBusca,
            categoryId: categoriaSelecionada || undefined,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            radiusKm: raioKm,
          });
        }, (error) => {
          console.error("Erro geolocalização:", error);
          toast.error("Não foi possível obter sua localização. Busca realizada sem GPS.");
          // Se der erro, busca sem localização para não quebrar a tela.
          buscarProfissionais({
            name: termoBusca,
            categoryId: categoriaSelecionada || undefined,
          });
          setUsandoLocalizacao(false); // Desativa o visual do GPS
        },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
      } else {
        toast.error("A geolocalização não é suportada pelo seu navegador.");
        buscarProfissionais({
          name: termoBusca,
          categoryId: categoriaSelecionada || undefined,
        });
        setUsandoLocalizacao(false);
      }
    } else {
      // Busca normal por texto e categoria.
      buscarProfissionais({
        name: termoBusca,
        categoryId: categoriaSelecionada || undefined,
      });
    }
  };

  // --- NOVO USEEFFECT (AUTO-FILTRO DO JÃO PEDRO) ---
  // Este useEffect vigia as mudanças nos filtros.
  // Quando a categoria, as estrelas, o raio ou o GPS mudarem, ele dispara a busca automaticamente.
  // IMPORTANTE: 'termoBusca' (o texto digitado) foi excluído propositalmente para não fazer uma chamada
  // à API a cada letra digitada, o que derrubaria o servidor. A busca por texto ainda depende do botão/Enter.
  useEffect(() => {
    // Chamamos o lidarComBusca sem evento (undefined), e ele usa os estados atuais.
    lidarComBusca();
  }, [categoriaSelecionada, filtroEstrelas, raioKm, usandoLocalizacao]);
  // ------------------------------------

  useEffect(() => {
    const id = setInterval(() => {
      // Na atualização periódica, usamos os últimos filtros que foram usados ativamente.
      buscarProfissionais(ultimosFiltrosRef.current);
    }, INTERVALO_REFRESH);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setPaginaAtual(1);
  }, [termoBusca, categoriaSelecionada, filtroEstrelas, raioKm, usandoLocalizacao]);

  const alternarLocalizacao = () => {
    if (usandoLocalizacao) {
      setUsandoLocalizacao(false);
      // A busca automática é disparada pelo useEffect quando 'usandoLocalizacao' muda.
    } else {
      if (!navigator.geolocation) {
        toast.error("A geolocalização não é suportada pelo seu navegador.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          setUsandoLocalizacao(true);
          // A busca será disparada pelo useEffect quando o estado 'usandoLocalizacao' for atualizado.
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
          toast.error("Não foi possível obter sua localização. Verifique as permissões do seu navegador.");
          setUsandoLocalizacao(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  };

  const lidarComSelecaoProfissional = async (professionalId) => {
    if (reassignDemandId) {
      try {
        await api.patch(`/api/demand/${reassignDemandId}/reassign`, {
          professionalId: professionalId,
        });
        toast.success("Demanda reatribuída com sucesso!");
        navigate("/dashboard-cliente");
      } catch (error) {
        console.error("Erro ao reatribuir demanda:", error);
        toast.error("Erro ao reatribuir este chamado. Tente novamente.");
      }
    } else {
      navigate("/solicitar-servico", {
        state: { professionalIdSelecionado: professionalId },
      });
    }
  };

  const profissionaisFiltrados = profissionais
    .filter((prof) => {
      const matchesTexto = prof.name.toLowerCase().includes(termoBusca.toLowerCase());
      if (!matchesTexto) return false;
      if (filtroEstrelas === "5") return prof.rating !== null && prof.rating !== undefined && prof.rating >= 5.0;
      if (filtroEstrelas === "4PLUS") return prof.rating !== null && prof.rating !== undefined && prof.rating >= 4.0;
      if (filtroEstrelas === "3PLUS") return prof.rating !== null && prof.rating !== undefined && prof.rating >= 3.0;
      return true;
    })
    .sort((a, b) => {
      const notaA = a.rating !== null && a.rating !== undefined ? a.rating : -1;
      const notaB = b.rating !== null && b.rating !== undefined ? b.rating : -1;
      return notaB - notaA;
    });

  const indexUltimoProfissional = paginaAtual * ITENS_POR_PAGINA;
  const indexPrimeiroProfissional = indexUltimoProfissional - ITENS_POR_PAGINA;
  const profissionaisPaginados = profissionaisFiltrados.slice(indexPrimeiroProfissional, indexUltimoProfissional);
  const totalPaginas = Math.ceil(profissionaisFiltrados.length / ITENS_POR_PAGINA);

  const renderizarEstrelas = (rating) => {
    if (rating === null || rating === undefined) {
      return <span className="total-avaliacoes">Sem avaliação</span>;
    }
    const notaArredondada = Math.round(rating);
    return (
      <div className="estrelas-container" title={`${rating.toFixed(1)} estrelas`}>
        {[1, 2, 3, 4, 5].map((estrela) => (
          <i
            key={estrela}
            className={`bi bi-star${estrela <= notaArredondada ? '-fill' : ''}`}
            style={{ color: '#f59e0b', fontSize: '14px' }}
          ></i>
        ))}
        <strong style={{ marginLeft: '6px', fontSize: '15px' }}>{rating.toFixed(1)}</strong>
      </div>
    );
  };

  const renderizarEstrelasFiltro = (quantidade) => {
    return (
      <span className="estrelas-filtro">
        {[1, 2, 3, 4, 5].map((estrela) => (
          <i key={estrela} className={`bi bi-star${estrela <= quantidade ? '-fill' : ''}`}></i>
        ))}
      </span>
    );
  };

  return (
    <div className="pagina-lista-profissionais">
      {reassignDemandId && (
        <div style={{ background: "#d4edda", color: "#155724", padding: "12px", textAlign: "center", fontWeight: "600", borderBottom: "1px solid #c3e6cb" }}>
          <i className="bi bi-info-circle-fill"></i> Modo de Reatribuição Ativo: Escolha um novo profissional abaixo para assumir o seu chamado recusado.
        </div>
      )}

      <section className="topo-busca-dividido">
        {/* Adicionada a classe 'container-alinhado' para alinhamento perfeito com o grid */}
        <div className="container-alinhado conteudo-topo-busca">
          <div className="lado-esquerdo-busca">
            <h1 className="titulo-principal-lista">
              Encontre o<br />
              <span className="sublinhado-azul-transparente">talento certo!</span>
            </h1>
            <p className="subtitulo-lista-detalhado">
              Explore nossa rede de profissionais qualificados prontos para realizar o seu projeto.
            </p>

            <form className="barra-pesquisa-lista" onSubmit={lidarComBusca}>
              <i className="bi bi-search"></i>
              <input
                type="text"
                placeholder="O que você está procurando? (Ex: Eletricista)"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
              />
              <button type="submit" className="btn-buscar-lista">Buscar</button>
            </form>
          </div>

          <div className="lado-direito-imagem">
            <img src={imagemBusca} alt="Busca Profissionais" className="imagem-hero-lista" />
          </div>
        </div>
      </section>

      <section className="conteudo-principal-duas-colunas">
        <div className="container-alinhado layout-grid-principal">

          <aside className="sidebar-filtros">
            <h3 className="titulo-sidebar">Filtros</h3>

            <div className="grupo-filtro">
              <label>Categoria</label>
              <select
                className="select-sidebar"
                value={categoriaSelecionada}
                // O onChange apenas altera o estado. O useEffect vigia essa mudança e dispara a busca.
                onChange={(e) => setCategoriaSelecionada(e.target.value)}
              >
                <option value="">Todas categorias</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="grupo-filtro">
              <label>Avaliação</label>
              <div className="filtro-estrelas-radio">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="rating"
                    value="TODOS"
                    checked={filtroEstrelas === "TODOS"}
                    // O onChange apenas altera o estado. O useEffect vigia essa mudança e dispara a busca.
                    onChange={(e) => setFiltroEstrelas(e.target.value)}
                  />
                  Qualquer nota
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="rating"
                    value="5"
                    checked={filtroEstrelas === "5"}
                    onChange={(e) => setFiltroEstrelas(e.target.value)}
                  />
                  5 {renderizarEstrelasFiltro(5)}
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="rating"
                    value="4PLUS"
                    checked={filtroEstrelas === "4PLUS"}
                    onChange={(e) => setFiltroEstrelas(e.target.value)}
                  />
                  4+ {renderizarEstrelasFiltro(4)}
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="rating"
                    value="3PLUS"
                    checked={filtroEstrelas === "3PLUS"}
                    onChange={(e) => setFiltroEstrelas(e.target.value)}
                  />
                  3+ {renderizarEstrelasFiltro(3)}
                </label>
              </div>
            </div>

            <div className="grupo-filtro">
              <label>Localização</label>
              <select
                className="select-sidebar"
                value={raioKm}
                // O onChange apenas altera o estado. O useEffect vigia essa mudança e dispara a busca.
                onChange={(e) => setRaioKm(Number(e.target.value))}
              >
                <option value={5}>Até 5 km</option>
                <option value={10}>Até 10 km</option>
                <option value={20}>Até 20 km</option>
                <option value={50}>Até 50 km</option>
              </select>

              <button
                type="button"
                className={`btn-localizacao-sidebar ${usandoLocalizacao ? 'ativo' : ''}`}
                onClick={alternarLocalizacao}
              >
                <i className="bi bi-geo-alt-fill"></i> {usandoLocalizacao ? "Desativar GPS" : "Perto de mim"}
              </button>
            </div>
          </aside>

          <main className="area-resultados">
            <div className="cabecalho-resultados">
              <h2 className="titulo-sessao">
                Profissionais Disponíveis ({profissionaisFiltrados.length})
              </h2>
            </div>

            {profissionaisFiltrados.length === 0 ? (
              <div className="estado-vazio">
                <p>Nenhum profissional encontrado para os filtros selecionados.</p>
              </div>
            ) : (
              <>
                <div className="lista-horizontal-profissionais">
                  {profissionaisPaginados.map((prof) => {
                    const fotoUrl = getImageUrl(prof.photo);
                    const localizacao = prof.adresses && prof.adresses.length > 0
                      ? `${prof.adresses[0].neighborhood}, ${prof.adresses[0].city}`
                      : "Local não informado";

                    return (
                      <div key={prof.id} className="cartao-horizontal">

                        <div className="cartao-horizontal-info">
                          <div className="avatar-horizontal">
                            {fotoUrl ? (
                              <img
                                src={fotoUrl}
                                alt={prof.name}
                                // Evento de clique adicionado para abrir o modal grandão com a foto
                                onClick={() => setFotoExpandida(fotoUrl)}
                                style={{ cursor: "pointer" }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <span style={{ display: fotoUrl ? 'none' : 'flex' }}>
                              {prof.name ? prof.name.charAt(0).toUpperCase() : "U"}
                            </span>
                          </div>

                          <div className="dados-prof-horizontal">
                            <h3 className="nome-profissional">{prof.name}</h3>

                            <p className="localizacao-prof">
                              <i className="bi bi-geo-alt"></i> {localizacao}
                            </p>

                            {prof.categories && prof.categories.length > 0 ? (
                              <p className="especialidade-cartao">
                                {prof.categories.map((c) => c.name).join(" • ")}
                              </p>
                            ) : (
                              <p className="especialidade-cartao especialidade-vazia">
                                Especialidade não informada
                              </p>
                            )}

                            <div className="avaliacao-profissional">
                              {renderizarEstrelas(prof.rating)}
                            </div>
                          </div>
                        </div>

                        <div className="cartao-horizontal-acoes">
                          <button
                            className="btn-ver-avaliacoes-horizontal"
                            onClick={() => setModalAvaliacoes({ id: prof.id, nome: prof.name })}
                          >
                            <i className="bi bi-chat-square-text"></i> Avaliações
                          </button>

                          <button
                            className="btn-ponto-cartao-horizontal"
                            style={{
                              backgroundColor: reassignDemandId ? "#28a745" : "",
                              color: reassignDemandId ? "#fff" : "",
                            }}
                            onClick={() => lidarComSelecaoProfissional(prof.id)}
                          >
                            {reassignDemandId ? "Reatribuir" : "Solicitar Serviço"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPaginas > 1 && (
                  <div className="paginacao-container">

                    <button
                      className="btn-pagina"
                      onClick={() => {
                        setPaginaAtual((prev) => Math.max(prev - 1, 1));
                        window.scrollTo({ top: 400, behavior: "smooth" });
                      }}
                      disabled={paginaAtual === 1}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>

                    {Array.from({ length: totalPaginas }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => {
                          setPaginaAtual(i + 1);
                          window.scrollTo({ top: 400, behavior: "smooth" });
                        }}
                        className={`btn-pagina ${paginaAtual === i + 1 ? "pagina-ativa" : ""}`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      className="btn-pagina"
                      onClick={() => {
                        setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas));
                        window.scrollTo({ top: 400, behavior: "smooth" });
                      }}
                      disabled={paginaAtual === totalPaginas}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>

                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </section>

      {modalAvaliacoes && (
        <HistoricoAvaliacoes
          profissionalId={modalAvaliacoes.id}
          profissionalNome={modalAvaliacoes.nome}
          onClose={() => {
            setModalAvaliacoes(null);
            // Ao fechar, podemos opcionalmente re-buscar os profissionais caso a avaliação altere a nota
            // buscarProfissionais(ultimosFiltrosRef.current);
          }}
        />
      )}

      {/* Estrutura do Modal para exibição da foto grandona na tela */}
      {fotoExpandida && (
        // O overlay fecha o modal se você clicar no fundo escuro
        <div className="modal-foto-overlay" onClick={() => setFotoExpandida(null)}>
          <div className="modal-foto-content" onClick={(e) => e.stopPropagation()}> {/* Impede que clique na foto feche o modal */}
            <button className="btn-fechar-foto" onClick={() => setFotoExpandida(null)}>
              <i className="bi bi-x-lg"></i>
            </button>
            <img src={fotoExpandida} alt="Foto do Profissional Expandida" className="foto-ampliada" />
          </div>
        </div>
      )}
    </div>
  );
}

export default ListaProf;