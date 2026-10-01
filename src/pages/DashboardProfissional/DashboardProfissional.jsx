import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";
import DetalhesSolicitacao from "../DetalhesSolicitacao/DetalhesSolicitacao";
import { traduzirStatus, getStatusClass } from "../../utils/statusUtils";
import DemandInfoBadges from "../../components/DemandInfoBadges";
import DemandFotos from '../../components/DemandFotos';
import "./DashboardProfissional.css";

const INTERVALO_REFRESH = 30_000;

function DashboardProfissional() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState("NOVO");
  const [pedidoDetalhado, setPedidoDetalhado] = useState(null);
  const [buscaTexto, setBuscaTexto] = useState('');
  const [dadosPerfil, setDadosPerfil] = useState(null);
  const [aceite, setAceite] = useState({ visivel: false, pedidoId: null, valor: "" });

  const [confirmacao, setConfirmacao] = useState({
    visivel: false,
    pedidoId: null,
    novoStatus: null,
    tituloAcao: ""
  });

  const userStorage = localStorage.getItem("@ConectaPro:user");
  const usuarioLogado =
    userStorage && userStorage !== "undefined" ? JSON.parse(userStorage) : null;
  const profesionalId = usuarioLogado?.id;

  const buscarPedidos = async (silencioso = false) => {
    if (!profesionalId) return null;

    try {
      if (!silencioso) setLoading(true);
      const response = await api.get("/api/demand/user");

      const meusPedidos = response.data
        .filter((d) => {
          const idProf = d.professionalId?.id || d.professionalId;
          return Number(idProf) === Number(profesionalId);
        })
        .sort((a, b) => b.id - a.id);

      setPedidos(meusPedidos);

      const resPerfil = await api.get(`/api/user/${profesionalId}`);
      setDadosPerfil(resPerfil.data);

      return meusPedidos;
    } catch (err) {
      console.error("Erro ao carregar demandas ou reputação:", err);
      if (!silencioso) toast.error("Erro ao carregar as solicitações.");
      return null;
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  useEffect(() => {
    buscarPedidos();
  }, [profesionalId]);

  useEffect(() => {
    if (!profesionalId) return;
    const id = setInterval(() => buscarPedidos(true), INTERVALO_REFRESH);
    return () => clearInterval(id);
  }, []);

  const abrirAceite = (e, pedido) => {
    e.stopPropagation();
    setPedidoDetalhado(null);
    setAceite({
      visivel: true,
      pedidoId: pedido.id,
      valor: pedido.suggestedValue != null ? String(pedido.suggestedValue) : ""
    });
  };

  const confirmarAceite = async (e) => {
    e.preventDefault();
    const valor = Number(String(aceite.valor).replace(",", "."));
    if (!aceite.pedidoId || !Number.isFinite(valor) || valor <= 0) {
      toast.error("Informe um valor final válido para o serviço.");
      return;
    }

    try {
      await api.patch(`/api/demand/${aceite.pedidoId}/accept`, { finalValue: valor });
      toast.success("Serviço aceito. O cliente foi encaminhado para o pagamento.");
      setAceite({ visivel: false, pedidoId: null, valor: "" });
      await buscarPedidos();
    } catch (error) {
      toast.error(error.response?.data || "Não foi possível aceitar a demanda.");
    }
  };

  const processarAtualizacaoStatus = async (pedidoId, novoStatus) => {
    try {
      await api.patch(`/api/demand/${pedidoId}/status`, { status: novoStatus });

      if (novoStatus === "AGUARDANDO") toast.success("Serviço aceito! Dados de contato liberados.");
      else if (novoStatus === "FECHADO") toast.info("Serviço finalizado.");
      else if (novoStatus === "REJEITADO") toast.warn("Serviço recusado.");

      const listaAtualizada = await buscarPedidos();

      if (pedidoDetalhado && listaAtualizada) {
        const pedidoFresquinho = listaAtualizada.find(p => p.id === pedidoId);
        setPedidoDetalhado(pedidoFresquinho || null);
      }
    } catch (error) {
      console.error("Erro ao atualizar o status:", error);
      const msgErro = error.response?.data?.message || error.response?.data || "Falha ao atualizar o status do pedido.";
      toast.error(`Erro: ${msgErro}`);
    }
  };

  const solicitarConfirmacao = (e, pedidoId, novoStatus, acaoTexto) => {
    e.stopPropagation();
    setConfirmacao({ visivel: true, pedidoId, novoStatus, tituloAcao: acaoTexto });
  };

  const executarAcaoConfirmada = () => {
    processarAtualizacaoStatus(confirmacao.pedidoId, confirmacao.novoStatus);
    setConfirmacao({ visivel: false, pedidoId: null, novoStatus: null, tituloAcao: "" });
  };

  const pedidosFiltrados = pedidos.filter((p) => {
    const s = String(p.demandStatus || '').toUpperCase();
    const matchesTexto = p.title.toLowerCase().includes(buscaTexto.toLowerCase());

    if (!matchesTexto) return false;

    if (abaAtiva === "NOVO") return s === "ABERTO";
    if (abaAtiva === "PAGAMENTO") return s === "AGUARDANDO_PAGAMENTO";
    if (abaAtiva === "ANDAMENTO") return s === "AGUARDANDO";
    if (abaAtiva === "FINALIZADO") return s === "FECHADO" || s === "REJEITADO" || s === "EXPIRADO";
    return true;
  });

  const contagem = (statusAlvo) => {
    return pedidos.filter((p) => {
      const s = String(p.demandStatus || '').toUpperCase();
      if (statusAlvo === "ABERTO") return s === "ABERTO";
      if (statusAlvo === "PAGAMENTO") return s === "AGUARDANDO_PAGAMENTO";
      if (statusAlvo === "AGUARDANDO") return s === "AGUARDANDO";
      if (statusAlvo === "FINALIZADO") return s === "FECHADO" || s === "REJEITADO" || s === "EXPIRADO";
      return false;
    }).length;
  };

  return (
    <div className="dash-prof-bg">
      <div className="dash-prof-container">
        <header className="dash-prof-header">
          <div className="welcome-box">
            <h1>Painel de Controle</h1>
            <p>Olá, <strong>{usuarioLogado?.name}</strong>. Veja como está sua agenda.</p>

            {dadosPerfil && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '6px 14px', borderRadius: '50px', width: 'fit-content', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <i className="bi bi-star-fill" style={{ color: dadosPerfil.rating ? '#ffc107' : '#ccc' }}></i>
                  <span style={{ fontSize: '14px', color: '#333', fontWeight: '700' }}>
                    Sua Reputação: {dadosPerfil.rating !== null && dadosPerfil.rating !== undefined ? dadosPerfil.rating.toFixed(1) : "Sem avaliação"}
                  </span>
                </div>
                {dadosPerfil.verified && (
                  <span style={{ background:'#eaf3ff', color:'#2563eb', padding:'6px 12px', borderRadius:'50px', fontSize:'13px', fontWeight:800 }}>
                    <i className="bi bi-patch-check-fill"></i> {dadosPerfil.activePlanName || 'Verificado'}
                  </span>
                )}
                <button type="button" onClick={() => navigate('/planos')} style={{ border:'0', background:'#111827', color:'#fff', padding:'7px 13px', borderRadius:'50px', fontWeight:700, cursor:'pointer' }}>
                  <i className="bi bi-award"></i> {dadosPerfil.verified ? 'Gerenciar plano' : 'Ver planos'}
                </button>
              </div>
            )}
          </div>
          <button className="btn-config" onClick={() => navigate("/editar-perfil")}>
            <i className="bi bi-gear-wide-connected"></i> Ajustes
          </button>
        </header>

        <section className="stats-cards">
          <div
            className={`stat-card new ${abaAtiva === "NOVO" ? "stat-active" : ""}`}
            onClick={() => setAbaAtiva("NOVO")}
            style={{ cursor: "pointer" }}
          >
            <h3>{contagem("ABERTO")}</h3>
            <span>Novas Solicitações</span>
          </div>
          <div
            className={`stat-card active ${abaAtiva === "PAGAMENTO" ? "stat-active" : ""}`}
            onClick={() => setAbaAtiva("PAGAMENTO")}
            style={{ cursor: "pointer" }}
          >
            <h3>{contagem("PAGAMENTO")}</h3>
            <span>Aguardando Pagamento</span>
          </div>
          <div
            className={`stat-card active ${abaAtiva === "ANDAMENTO" ? "stat-active" : ""}`}
            onClick={() => setAbaAtiva("ANDAMENTO")}
            style={{ cursor: "pointer" }}
          >
            <h3>{contagem("AGUARDANDO")}</h3>
            <span>Em Andamento</span>
          </div>
          <div
            className={`stat-card total ${abaAtiva === "FINALIZADO" ? "stat-active" : ""}`}
            onClick={() => setAbaAtiva("FINALIZADO")}
            style={{ cursor: "pointer" }}
          >
            <h3>{contagem("FINALIZADO")}</h3>
            <span>Finalizados</span>
          </div>
        </section>

        <section className="list-section">
          <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <h2>Fluxo de Demandas</h2>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, maxWidth: '450px', marginLeft: 'auto' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}></i>
                <input
                  type="text"
                  placeholder="Filtrar por título..."
                  value={buscaTexto}
                  onChange={(e) => setBuscaTexto(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 35px', borderRadius: '50px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', background: '#fff' }}
                />
              </div>

              <button className="btn-refresh" style={{ height: '38px', width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={buscarPedidos} disabled={loading}>
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>

          <div className="tabs-container">
            <button className={`tab-btn ${abaAtiva === "NOVO" ? "active" : ""}`} onClick={() => setAbaAtiva("NOVO")}>
              Novas <span className="tab-count">{contagem("ABERTO")}</span>
            </button>
            <button className={`tab-btn ${abaAtiva === "PAGAMENTO" ? "active" : ""}`} onClick={() => setAbaAtiva("PAGAMENTO")}>
              Pagamento <span className="tab-count">{contagem("PAGAMENTO")}</span>
            </button>
            <button className={`tab-btn ${abaAtiva === "ANDAMENTO" ? "active" : ""}`} onClick={() => setAbaAtiva("ANDAMENTO")}>
              Em Andamento <span className="tab-count">{contagem("AGUARDANDO")}</span>
            </button>
            <button className={`tab-btn ${abaAtiva === "FINALIZADO" ? "active" : ""}`} onClick={() => setAbaAtiva("FINALIZADO")}>
              Finalizadas <span className="tab-count">{contagem("FINALIZADO")}</span>
            </button>
          </div>

          {loading ? (
            <p className="msg-info">Buscando serviços...</p>
          ) : pedidosFiltrados.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-inbox"></i>
              <p>Nenhuma demanda encontrada.</p>
            </div>
          ) : (
            <div className="requests-grid">
              {pedidosFiltrados.map((p) => {
                const estiloStatus = getStatusClass(p.demandStatus);

                return (
                  <div
                    key={p.id}
                    className={`request-card status-${estiloStatus}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setPedidoDetalhado(p)}
                  >
                    <div className="card-body">
                      <span className={`status-badge-real ${estiloStatus}`}>
                        {traduzirStatus(p.demandStatus)}
                      </span>
                      <h4 style={{ marginTop: '15px' }}>{p.title}</h4>
                      <p className="client-name"><i className="bi bi-person"></i> {p.clientId?.name || "Cliente"}</p>
                      <DemandInfoBadges demanda={p} />
                      <DemandFotos demanda={p} modo="indicador" />
                    </div>

                    {(["ABERTO", "AGUARDANDO_PAGAMENTO", "AGUARDANDO"].includes(String(p.demandStatus).toUpperCase())) && (
                      <div className="card-footer" onClick={(e) => e.stopPropagation()}>
                        {String(p.demandStatus).toUpperCase() === "ABERTO" && (
                          <>
                            <button className="btn-action accept" onClick={(e) => abrirAceite(e, p)}>
                              <i className="bi bi-check-lg"></i> Aceitar
                            </button>
                            <button className="btn-action decline" onClick={(e) => solicitarConfirmacao(e, p.id, "REJEITADO", "recusar esta solicitação de serviço")}>
                              <i className="bi bi-x-lg"></i> Recusar
                            </button>
                          </>
                        )}
                        {String(p.demandStatus).toUpperCase() === "AGUARDANDO_PAGAMENTO" && (
                          <button className="btn-action details" style={{ width: "100%" }} onClick={() => setPedidoDetalhado(p)}>
                            <i className="bi bi-hourglass-split"></i> Aguardando pagamento do cliente
                          </button>
                        )}
                        {String(p.demandStatus).toUpperCase() === "AGUARDANDO" && (
                          <button className="btn-action details" style={{ width: "100%" }} onClick={() => setPedidoDetalhado(p)}>
                            <i className="bi bi-eye"></i> Ver detalhes
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {pedidoDetalhado && (
        <div className="modal-overlay" onClick={() => setPedidoDetalhado(null)}>
          <div className="modal-container" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <h3 className="modal-title" style={{ margin: 0, color: '#111' }}>Descrição Completa da Demanda</h3>
              <button className="btn-cancelar" style={{ padding: '5px 10px', borderRadius: '50%' }} onClick={() => setPedidoDetalhado(null)}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#888' }}>SERVIÇO SOLICITADO</label>
                <p style={{ fontSize: '18px', fontWeight: '700', color: '#111', margin: '2px 0 0 0' }}>{pedidoDetalhado.title}</p>
                <DemandInfoBadges demanda={pedidoDetalhado} />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#888' }}>DESCRIÇÃO COMPLETA DO PROBLEMA</label>
                <div style={{ fontSize: '14px', color: '#222', background: '#f8f9fa', padding: '15px', borderRadius: '10px', marginTop: '4px', lineHeight: '1.6' }}>
                  {pedidoDetalhado.description}
                </div>
                <DemandFotos demanda={pedidoDetalhado} modo="galeria" />
              </div>

              <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                {String(pedidoDetalhado.demandStatus).toUpperCase() === 'ABERTO' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-action accept" style={{ flex: 1 }} onClick={(e) => abrirAceite(e, pedidoDetalhado)}>Aceitar Serviço</button>
                    <button className="btn-action decline" style={{ flex: 1 }} onClick={(e) => { setPedidoDetalhado(null); solicitarConfirmacao(e, pedidoDetalhado.id, "REJEITADO", "recusar esta solicitação de serviço"); }}>Recusar</button>
                  </div>
                )}

                {String(pedidoDetalhado.demandStatus).toUpperCase() === 'AGUARDANDO' && (
                  <>
                    <DetalhesSolicitacao demanda={pedidoDetalhado} modo="PROFISSIONAL" />
                    <button
                      className="btn-action finish"
                      style={{ width: "100%", marginTop: "12px" }}
                      onClick={(e) => { setPedidoDetalhado(null); solicitarConfirmacao(e, pedidoDetalhado.id, "FECHADO", "finalizar este serviço de vez"); }}
                    >
                      <i className="bi bi-check2-circle"></i> Finalizar Serviço
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {aceite.visivel && (
        <div className="modal-overlay" style={{ zIndex: 1090 }}>
          <div className="modal-container" style={{ maxWidth: '430px', padding: '26px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Aceitar serviço</h3>
            <p style={{ color:'#64748b', fontSize:'14px', lineHeight:1.5 }}>
              Defina o valor final que será apresentado ao cliente no checkout.
            </p>
            <form onSubmit={confirmarAceite}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:700, marginBottom:6 }}>Valor final (R$)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={aceite.valor}
                onChange={(e) => setAceite(prev => ({ ...prev, valor: e.target.value }))}
                autoFocus
                style={{ width:'100%', boxSizing:'border-box', padding:'12px', border:'1px solid #dbe2ea', borderRadius:10, fontSize:16 }}
              />
              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                <button type="button" className="btn-cancelar" style={{ flex:1, padding:11 }} onClick={() => setAceite({ visivel:false, pedidoId:null, valor:"" })}>Cancelar</button>
                <button type="submit" className="btn-confirmar" style={{ flex:1, padding:11 }}>Aceitar e enviar para pagamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmacao.visivel && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-container" style={{ maxWidth: '400px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', color: '#ffc107', marginBottom: '10px' }}>
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#111', fontWeight: '700' }}>Confirmar Ação</h3>
            <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Você tem certeza de que deseja <strong>{confirmacao.tituloAcao}</strong>? Essa operação alterará o andamento do chamado.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                className="btn-cancelar"
                style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: '600', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                onClick={() => setConfirmacao({ visivel: false, pedidoId: null, novoStatus: null, tituloAcao: "" })}
              >
                Cancelar
              </button>
              <button
                className="btn-confirmar"
                style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: '700', background: '#0066ff', color: '#fff', border: 'none', cursor: 'pointer' }}
                onClick={executarAcaoConfirmada}
              >
                Sim, Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardProfissional;