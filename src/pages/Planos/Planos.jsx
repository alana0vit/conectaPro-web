import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import BackButton from "../../components/BackButton";
import api from "../../services/api";
import { extrairMensagemErro } from "../../utils/errorUtils";
import "./Planos.css";

const moeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Planos() {
  const navigate = useNavigate();
  const [planos, setPlanos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [contratando, setContratando] = useState(null);
  const [planoAtual, setPlanoAtual] = useState(null);

  const userStorage = localStorage.getItem("@ConectaPro:user");
  const usuario = userStorage && userStorage !== "undefined" ? JSON.parse(userStorage) : null;

  useEffect(() => {
    if (usuario?.userType === "PROFESSIONAL") {
      api.get(`/api/subscriptions/professional/${usuario.id}/current`)
        .then((res) => setPlanoAtual(res.status === 200 && res.data ? res.data : null))
        .catch(() => setPlanoAtual(null));
    }
    api.get("/api/subscriptions/plans")
      .then((res) => setPlanos(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast.error("Não foi possível carregar os planos."))
      .finally(() => setCarregando(false));
  }, []);

  const contratar = async (plan) => {
    if (!usuario) {
      navigate("/login");
      return;
    }
    if (usuario.userType !== "PROFESSIONAL") {
      toast.info("Os planos de verificação estão disponíveis para profissionais.");
      return;
    }

    if (planoAtual && planoAtual.planId === plan.id) {
      toast.info("Este já é o seu plano atual.");
      return;
    }

    try {
      setContratando(plan.id);
      const res = await api.post(`/api/subscriptions/professional/${usuario.id}/plan/${plan.id}/checkout`);
      const checkoutUrl = res.data?.checkoutUrl;
      if (!checkoutUrl) throw new Error("Checkout não retornado.");
      window.location.href = checkoutUrl.startsWith("http") ? checkoutUrl : `${import.meta.env.VITE_API_URL || "http://localhost:8080"}${checkoutUrl}`;
    } catch (error) {
      toast.error(extrairMensagemErro(error, "Não foi possível iniciar a contratação."));
      setContratando(null);
    }
  };

  return (
    <div className="planos-page">
      <div className="voltar-barra">
        <BackButton fallback={usuario?.userType === "PROFESSIONAL" ? "/dashboard-profissional" : "/"} />
      </div>
      <section className="planos-hero">
        <span className="planos-kicker">VERIFICAÇÃO CONECTAPRO</span>
        <h1>Escolha seu plano profissional</h1>
        <p>Tenha selo de verificado, mais prioridade na busca e condições diferentes de taxa por plano.</p>
      </section>

      {carregando ? (
        <div className="planos-loading">Carregando planos...</div>
      ) : (
        <div className="planos-grid">
          {planos.map((plan) => {
            const ehAtual = planoAtual?.planId === plan.id;
            return (
            <article className={`plano-card plano-${String(plan.name).toLowerCase()} ${ehAtual ? "plano-atual" : ""}`} key={plan.id}>
              {ehAtual && <span className="plano-atual-tag">Plano atual</span>}
              <div className="plano-header">
                <span className="plano-badge">{plan.badgeLabel}</span>
                <h2>{plan.name}</h2>
                <p>{plan.description}</p>
              </div>

              <div className="plano-price">
                <strong>{moeda(plan.price)}</strong>
                <span>/ {plan.durationDays === 30 ? "mês" : `${plan.durationDays} dias`}</span>
              </div>

              <ul>
                <li><i className="bi bi-patch-check-fill"></i> Selo {plan.badgeLabel}</li>
                <li><i className="bi bi-sort-up"></i> Prioridade {plan.priorityWeight} na busca</li>
                <li><i className="bi bi-percent"></i> Taxa nas demandas: {(Number(plan.platformFeePercentage) * 100).toFixed(0)}%</li>
              </ul>

              {ehAtual && planoAtual.expiresAt && (
                <p className="plano-validade">
                  Válido até {new Date(planoAtual.expiresAt).toLocaleDateString("pt-BR")}
                </p>
              )}

              <button onClick={() => contratar(plan)} disabled={contratando !== null || ehAtual}>
                {ehAtual
                  ? "Plano contratado"
                  : contratando === plan.id
                    ? "Abrindo checkout..."
                    : planoAtual ? "Trocar para este plano" : "Contratar plano"}
              </button>
            </article>
            );
          })}
        </div>
      )}

      <p className="planos-footnote">
        O pagamento é realizado pelo checkout da ConectaPro. A assinatura só é ativada após a aprovação do pagamento.
      </p>
    </div>
  );
}

export default Planos;
