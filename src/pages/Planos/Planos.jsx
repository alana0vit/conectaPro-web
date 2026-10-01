import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";
import "./Planos.css";

const moeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Planos() {
  const navigate = useNavigate();
  const [planos, setPlanos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [contratando, setContratando] = useState(null);

  const userStorage = localStorage.getItem("@ConectaPro:user");
  const usuario = userStorage && userStorage !== "undefined" ? JSON.parse(userStorage) : null;

  useEffect(() => {
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

    try {
      setContratando(plan.id);
      const res = await api.post(`/api/subscriptions/professional/${usuario.id}/plan/${plan.id}/checkout`);
      const checkoutUrl = res.data?.checkoutUrl;
      if (!checkoutUrl) throw new Error("Checkout não retornado.");
      window.location.href = checkoutUrl.startsWith("http") ? checkoutUrl : `${import.meta.env.VITE_API_URL || "http://localhost:8080"}${checkoutUrl}`;
    } catch (error) {
      toast.error(error.response?.data || "Não foi possível iniciar a contratação.");
      setContratando(null);
    }
  };

  return (
    <div className="planos-page">
      <section className="planos-hero">
        <span className="planos-kicker">VERIFICAÇÃO CONECTAPRO</span>
        <h1>Escolha seu plano profissional</h1>
        <p>Tenha selo de verificado, mais prioridade na busca e condições diferentes de taxa por plano.</p>
      </section>

      {carregando ? (
        <div className="planos-loading">Carregando planos...</div>
      ) : (
        <div className="planos-grid">
          {planos.map((plan) => (
            <article className={`plano-card plano-${String(plan.name).toLowerCase()}`} key={plan.id}>
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

              <button onClick={() => contratar(plan)} disabled={contratando !== null}>
                {contratando === plan.id ? "Abrindo checkout..." : "Contratar plano"}
              </button>
            </article>
          ))}
        </div>
      )}

      <p className="planos-footnote">
        O pagamento é realizado pelo checkout da ConectaPro. A assinatura só é ativada após a aprovação do pagamento.
      </p>
    </div>
  );
}

export default Planos;
