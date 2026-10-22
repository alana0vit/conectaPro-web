import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";
import { extrairMensagemErro } from "../../utils/errorUtils";
import { getImageUrl } from "../../utils/imageUtils";
import "./EditarDemanda.css";

const hojeStr = () => new Date().toISOString().split("T")[0];

const maxDataStr = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
};

// O backend devolve LocalDate como "2026-11-20"; normaliza qualquer outro formato
// para o que o <input type="date"> espera.
const paraInputDate = (valor) => {
  if (!valor) return "";
  if (typeof valor === "string") return valor.slice(0, 10);
  return "";
};

function EditarDemanda() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [suggestedValue, setSuggestedValue] = useState("");
  const [suggestedDate, setSuggestedDate] = useState("");
  const [addressId, setAddressId] = useState("");

  const [original, setOriginal] = useState(null);
  const [enderecos, setEnderecos] = useState([]);
  const [fotos, setFotos] = useState([]);
  // Fotos que o usuário marcou para remover. A exclusão só acontece no "Salvar",
  // porque apagar do R2 é irreversível e a tela tem botão de cancelar.
  const [fotosRemovidas, setFotosRemovidas] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const userStorage = localStorage.getItem("@ConectaPro:user");
  const usuarioLogado =
    userStorage && userStorage !== "undefined" ? JSON.parse(userStorage) : null;
  const clientId = usuarioLogado?.id;

  const hoje = hojeStr();
  const maxData = maxDataStr();

  useEffect(() => {
    const carregar = async () => {
      if (!id) return;
      try {
        setCarregando(true);

        const [demandaRes, enderecosRes] = await Promise.all([
          api.get(`/api/demand/user/${id}`),
          clientId
            ? api.get(`/api/user/${clientId}/addresses`)
            : Promise.resolve({ data: [] }),
        ]);

        const demanda = demandaRes.data;

        // Só demandas ABERTAS podem ser editadas (o backend recusa as demais).
        if (String(demanda?.demandStatus || "").toUpperCase() !== "ABERTO") {
          toast.warning(
            "Esta solicitação já foi aceita ou finalizada e não pode mais ser editada."
          );
          navigate("/dashboard-cliente");
          return;
        }

        setOriginal(demanda);
        setTitle(demanda.title || "");
        setDescription(demanda.description || "");
        setSuggestedValue(
          demanda.suggestedValue === null || demanda.suggestedValue === undefined
            ? ""
            : String(demanda.suggestedValue)
        );
        setSuggestedDate(paraInputDate(demanda.suggestedDate));
        setAddressId(demanda.addressId?.id ? String(demanda.addressId.id) : "");
        setFotos(Array.isArray(demanda.imgUrl) ? demanda.imgUrl.filter(Boolean) : []);

        setEnderecos(Array.isArray(enderecosRes.data) ? enderecosRes.data : []);
      } catch (error) {
        console.error("Erro ao carregar dados da demanda:", error);
        toast.error(
          extrairMensagemErro(error, "Falha ao carregar os dados para edição.")
        );
        navigate("/dashboard-cliente");
      } finally {
        setCarregando(false);
      }
    };

    carregar();
  }, [id, clientId, navigate]);

  const marcarRemocao = (nomeArquivo) => {
    setFotosRemovidas((atuais) =>
      atuais.includes(nomeArquivo) ? atuais : [...atuais, nomeArquivo]
    );
  };

  const desfazerRemocao = (nomeArquivo) => {
    setFotosRemovidas((atuais) => atuais.filter((f) => f !== nomeArquivo));
  };

  const validar = () => {
    if (!title.trim() || !description.trim()) {
      toast.warning("Título e descrição são obrigatórios.");
      return false;
    }

    if (suggestedValue !== "") {
      const valor = Number(String(suggestedValue).replace(",", "."));
      if (!Number.isFinite(valor) || valor <= 0) {
        toast.warning("Informe um valor máximo válido.");
        return false;
      }
    }

    // Só valida a data quando ela foi alterada: uma demanda antiga pode ter
    // uma data que já passou, e isso não deve travar a edição do título.
    const dataOriginal = paraInputDate(original?.suggestedDate);
    if (suggestedDate && suggestedDate !== dataOriginal) {
      const escolhida = new Date(`${suggestedDate}T00:00:00`);
      if (escolhida <= new Date(`${hoje}T00:00:00`)) {
        toast.warning("A data sugerida deve ser futura.");
        return false;
      }
      if (escolhida > new Date(`${maxData}T00:00:00`)) {
        toast.warning("A data sugerida não pode ultrapassar 1 ano a partir de hoje.");
        return false;
      }
    }

    return true;
  };

  const lidarComSubmissao = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    const formData = new FormData();

    // O PATCH do backend é parcial: campo ausente não é alterado.
    // Por isso só enviamos o que realmente mudou.
    if (title.trim() !== (original?.title || "")) {
      formData.append("title", title.trim());
    }
    if (description.trim() !== (original?.description || "")) {
      formData.append("description", description.trim());
    }

    const valorOriginal =
      original?.suggestedValue === null || original?.suggestedValue === undefined
        ? ""
        : String(original.suggestedValue);
    if (suggestedValue !== "" && suggestedValue !== valorOriginal) {
      formData.append("suggestedValue", String(suggestedValue).replace(",", "."));
    }

    if (suggestedDate && suggestedDate !== paraInputDate(original?.suggestedDate)) {
      formData.append("suggestedDate", suggestedDate);
    }

    const enderecoOriginal = original?.addressId?.id
      ? String(original.addressId.id)
      : "";
    if (addressId && addressId !== enderecoOriginal) {
      formData.append("addressId", addressId);
    }

    const temCampoAlterado = [...formData.keys()].length > 0;

    // Nem campo alterado, nem foto marcada — evita requisição inútil.
    if (!temCampoAlterado && fotosRemovidas.length === 0) {
      toast.info("Nenhuma alteração para salvar.");
      return;
    }

    setSalvando(true);

    // As remoções vão primeiro, uma a uma (o endpoint é por arquivo).
    // Se alguma falhar, para aqui e não mexe no resto.
    for (const nomeArquivo of fotosRemovidas) {
      try {
        await api.delete(
          `/api/demand/${id}/images/${encodeURIComponent(nomeArquivo)}`
        );
        setFotos((atuais) => atuais.filter((f) => f !== nomeArquivo));
        setFotosRemovidas((atuais) => atuais.filter((f) => f !== nomeArquivo));
      } catch (error) {
        console.error("Erro ao remover foto:", error);
        toast.error(
          extrairMensagemErro(
            error,
            "Não foi possível remover uma das fotos. As demais alterações não foram salvas."
          )
        );
        setSalvando(false);
        return;
      }
    }

    if (!temCampoAlterado) {
      toast.success("Fotos removidas.");
      navigate("/dashboard-cliente");
      return;
    }

    try {
      await api.patch(`/api/demand/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Solicitação atualizada com sucesso!");
      navigate("/dashboard-cliente");
    } catch (error) {
      console.error("Erro ao atualizar demanda:", error);
      toast.error(
        extrairMensagemErro(error, "Ocorreu um erro ao salvar as alterações.")
      );
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div style={{ textAlign: "center", padding: "50px", color: "#666" }}>
        <p>A carregar dados da solicitação...</p>
      </div>
    );
  }

  return (
    <div className="secao-servicos-cinza" style={{ minHeight: "100vh", padding: "40px 20px" }}>
      <div className="editar-demanda-card">

        <div className="editar-demanda-header">
          <h2>Editar Solicitação</h2>
          <p>Altere os detalhes abaixo para atualizar o escopo do seu chamado.</p>
          {original?.code && (
            <span className="editar-demanda-codigo">
              <i className="bi bi-hash"></i>{original.code}
            </span>
          )}
        </div>

        <form onSubmit={lidarComSubmissao} className="editar-demanda-form">

          <div className="editar-demanda-campo">
            <label>Título do Serviço *</label>
            <input
              type="text"
              placeholder="Ex: Troca de fiação do chuveiro"
              value={title}
              maxLength={100}
              onChange={(e) => setTitle(e.target.value)}
              disabled={salvando}
              required
            />
          </div>

          <div className="editar-demanda-campo">
            <label>Descrição Detalhada do Problema *</label>
            <textarea
              rows="6"
              placeholder="Descreva aqui o que precisa ser feito de forma clara..."
              value={description}
              maxLength={500}
              onChange={(e) => setDescription(e.target.value)}
              disabled={salvando}
              required
            />
            <small className="editar-demanda-contador">
              {description.length}/500
            </small>
          </div>

          <div className="editar-demanda-linha">
            <div className="editar-demanda-campo">
              <label>Valor máximo (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Opcional"
                value={suggestedValue}
                onChange={(e) => setSuggestedValue(e.target.value)}
                disabled={salvando}
              />
            </div>

            <div className="editar-demanda-campo">
              <label>Data sugerida</label>
              <input
                type="date"
                value={suggestedDate}
                min={hoje}
                max={maxData}
                onChange={(e) => setSuggestedDate(e.target.value)}
                disabled={salvando}
              />
            </div>
          </div>

          <div className="editar-demanda-campo">
            <label>Endereço do serviço</label>
            <select
              value={addressId}
              onChange={(e) => setAddressId(e.target.value)}
              disabled={salvando || enderecos.length === 0}
            >
              {enderecos.length === 0 && (
                <option value="">Nenhum endereço cadastrado</option>
              )}
              {enderecos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.street}, {a.number} - {a.neighborhood}
                </option>
              ))}
            </select>
          </div>

          <div className="editar-demanda-campo">
            <label>Categoria</label>
            <input
              type="text"
              value={original?.categoryId?.name || "—"}
              disabled
              readOnly
            />
            <small className="editar-demanda-ajuda">
              A categoria é definida pelo profissional escolhido e não pode ser alterada aqui.
            </small>
          </div>

          {fotos.length > 0 && (
            <div className="editar-demanda-campo">
              <label>Fotos anexadas ({fotos.length})</label>
              <div className="editar-demanda-fotos">
                {fotos.map((nome) => {
                  const marcada = fotosRemovidas.includes(nome);
                  return (
                    <div
                      key={nome}
                      className={`editar-demanda-foto${marcada ? " marcada" : ""}`}
                    >
                      <img src={getImageUrl(nome)} alt="Foto da solicitação" />
                      <button
                        type="button"
                        className="editar-demanda-foto-remover"
                        title={marcada ? "Manter esta foto" : "Marcar para remoção"}
                        onClick={() =>
                          marcada ? desfazerRemocao(nome) : marcarRemocao(nome)
                        }
                        disabled={salvando}
                      >
                        {marcada ? "↺" : "×"}
                      </button>
                    </div>
                  );
                })}
              </div>
              <small className="editar-demanda-ajuda">
                {fotosRemovidas.length > 0 ? (
                  <>
                    {fotosRemovidas.length} foto
                    {fotosRemovidas.length > 1 ? "s" : ""} será
                    {fotosRemovidas.length > 1 ? "ão" : ""} removida
                    {fotosRemovidas.length > 1 ? "s" : ""} ao salvar. Clique em ↺
                    para manter, ou em Cancelar para descartar tudo.
                  </>
                ) : (
                  "Clique no × para marcar uma foto para remoção. Ela só é apagada quando você salvar."
                )}
              </small>
            </div>
          )}

          <div className="editar-demanda-acoes">
            <button
              type="button"
              className="editar-demanda-btn-cancelar"
              onClick={() => navigate("/dashboard-cliente")}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="editar-demanda-btn-salvar"
              disabled={salvando}
            >
              {salvando ? "A salvar alterações..." : "Salvar Alterações"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default EditarDemanda;