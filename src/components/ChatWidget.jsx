import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./ChatWidget.css";

const LIMITE_MENSAGEM = 500;

// O backend aceita no máximo 6 mensagens de histórico, cada uma com até 1000 caracteres.
const MAX_HISTORICO = 6;
const MAX_CONTEUDO = 1000;

// Perguntas verificadas contra o índice BM25 do backend: todas pontuam bem
// acima do corte (chat.min-score) e casam com o guia correto.
const SUGESTOES = [
  "Meu chuveiro queimou",
  "Quanto custa assinar um plano?",
  "O que é o selo verificado?",
];

// Mostradas quando o bot não encontra resposta, para o usuário não ficar sem saída.
const SUGESTOES_ALTERNATIVAS = [
  "Tenho um vazamento na pia",
  "Quanto é a taxa da plataforma?",
  "Quando recebo o contato do profissional?",
];

const MENSAGEM_INICIAL = {
  autor: "assistant",
  texto:
    "Oi! Sou o assistente do ConectaPro. Posso explicar como a plataforma funciona ou indicar o tipo de profissional certo para o seu problema.",
};

function ChatWidget() {
  const navigate = useNavigate();

  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState([MENSAGEM_INICIAL]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const fimDaListaRef = useRef(null);
  const inputRef = useRef(null);
  const categoriasRef = useRef(null);

  // Rola para a última mensagem sempre que a conversa cresce.
  useEffect(() => {
    if (aberto) {
      fimDaListaRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [mensagens, aberto, enviando]);

  useEffect(() => {
    if (aberto) inputRef.current?.focus();
  }, [aberto]);

  // Fecha com ESC.
  useEffect(() => {
    if (!aberto) return undefined;
    const aoTeclar = (e) => {
      if (e.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  // O chat devolve o NOME da categoria, mas a lista de profissionais filtra por id.
  // Busca a lista uma única vez e guarda em memória.
  const resolverCategoriaId = async (nome) => {
    if (!nome) return null;
    try {
      if (!categoriasRef.current) {
        const resposta = await api.get("/api/category");
        categoriasRef.current = Array.isArray(resposta.data) ? resposta.data : [];
      }
      const alvo = nome.trim().toLowerCase();
      const encontrada = categoriasRef.current.find(
        (c) => String(c.name || "").trim().toLowerCase() === alvo
      );
      return encontrada?.id ?? null;
    } catch {
      return null;
    }
  };

  const irParaCategoria = async (nome) => {
    const categoryId = await resolverCategoriaId(nome);
    setAberto(false);
    // Sem id, ainda vale levar para a lista: o usuário filtra manualmente.
    navigate("/lista-profissionais", {
      state: categoryId ? { categoryId: String(categoryId) } : undefined,
    });
  };

  const montarHistorico = (listaAtual) =>
    listaAtual
      .filter((m) => m.texto && !m.erro)
      .slice(-MAX_HISTORICO)
      .map((m) => ({
        role: m.autor === "user" ? "user" : "assistant",
        content: m.texto.slice(0, MAX_CONTEUDO),
      }));

  const enviar = async (perguntaBruta) => {
    const pergunta = String(perguntaBruta || "").trim();
    if (!pergunta || enviando) return;

    const comPergunta = [...mensagens, { autor: "user", texto: pergunta }];
    setMensagens(comPergunta);
    setTexto("");
    setEnviando(true);

    try {
      const resposta = await api.post("/api/chat", {
        message: pergunta.slice(0, LIMITE_MENSAGEM),
        // O histórico não inclui a pergunta atual, que vai em "message".
        history: montarHistorico(mensagens),
      });

      const { answer, suggestedCategory, sources, found } = resposta.data || {};

      setMensagens((atuais) => [
        ...atuais,
        {
          autor: "assistant",
          texto: answer || "Não consegui formular uma resposta agora.",
          categoria: found ? suggestedCategory || null : null,
          fontes: found && Array.isArray(sources) ? sources : [],
          semResposta: !found,
        },
      ]);
    } catch (error) {
      const status = error?.response?.status;

      // O backend devolve a mensagem certa no 429 (limite por cliente ou limite do dia).
      const textoErro =
        status === 429
          ? error?.response?.data?.message ||
            "Muitas perguntas em pouco tempo. Tente novamente mais tarde."
          : "Não consegui falar com o assistente agora. Verifique sua conexão e tente de novo.";

      setMensagens((atuais) => [
        ...atuais,
        { autor: "assistant", texto: textoErro, erro: true },
      ]);
    } finally {
      setEnviando(false);
    }
  };

  const aoSubmeter = (e) => {
    e.preventDefault();
    enviar(texto);
  };

  const recomecar = () => {
    setMensagens([MENSAGEM_INICIAL]);
    setTexto("");
    inputRef.current?.focus();
  };

  const ultima = mensagens[mensagens.length - 1];
  const conversaIniciada = mensagens.length > 1;

  // As sugestões aparecem no início e sempre que o bot não souber responder,
  // para o usuário nunca ficar sem um caminho adiante.
  const semSaida = Boolean(ultima?.semResposta || ultima?.erro);
  const mostrarSugestoes = !enviando && (!conversaIniciada || semSaida);
  const sugestoesAtuais = semSaida ? SUGESTOES_ALTERNATIVAS : SUGESTOES;

  return (
    <>
      <button
        type="button"
        className={`chat-bolha${aberto ? " aberta" : ""}`}
        onClick={() => setAberto((v) => !v)}
        aria-label={aberto ? "Fechar assistente" : "Abrir assistente"}
        aria-expanded={aberto}
      >
        <i className={`bi ${aberto ? "bi-x-lg" : "bi-chat-dots-fill"}`}></i>
      </button>

      {aberto && (
        <section className="chat-painel" role="dialog" aria-label="Assistente ConectaPro">
          <header className="chat-cabecalho">
            <div className="chat-cabecalho-info">
              <span className="chat-avatar" aria-hidden="true">
                <i className="bi bi-robot"></i>
              </span>
              <div>
                <strong>Assistente ConectaPro</strong>
                <small>Tire dúvidas ou descubra o profissional certo</small>
              </div>
            </div>
            <div className="chat-acoes">
              {conversaIniciada && (
                <button
                  type="button"
                  className="chat-acao"
                  onClick={recomecar}
                  title="Começar uma nova conversa"
                  aria-label="Nova conversa"
                >
                  <i className="bi bi-arrow-counterclockwise"></i>
                </button>
              )}
              <button
                type="button"
                className="chat-acao"
                onClick={() => setAberto(false)}
                aria-label="Fechar"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </header>

          <div className="chat-mensagens">
            {mensagens.map((m, i) => (
              <div
                key={i}
                className={`chat-balao ${m.autor === "user" ? "do-usuario" : "do-bot"}${
                  m.erro ? " com-erro" : ""
                }`}
              >
                <p>{m.texto}</p>

                {m.categoria && (
                  <button
                    type="button"
                    className="chat-cta"
                    onClick={() => irParaCategoria(m.categoria)}
                  >
                    <i className="bi bi-search"></i>
                    Ver {m.categoria.toLowerCase()}s disponíveis
                  </button>
                )}

                {m.fontes?.length > 0 && (
                  <span className="chat-fontes">Baseado em: {m.fontes.join(" · ")}</span>
                )}
              </div>
            ))}

            {mostrarSugestoes && (
              <div className="chat-sugestoes">
                {semSaida && (
                  <span className="chat-sugestoes-titulo">Tente uma destas:</span>
                )}
                {sugestoesAtuais.map((s) => (
                  <button key={s} type="button" onClick={() => enviar(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {enviando && (
              <div className="chat-balao do-bot chat-digitando" aria-live="polite">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}

            <div ref={fimDaListaRef} />
          </div>

          <form className="chat-entrada" onSubmit={aoSubmeter}>
            <input
              ref={inputRef}
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escreva sua dúvida..."
              maxLength={LIMITE_MENSAGEM}
              disabled={enviando}
            />
            <button
              type="submit"
              disabled={enviando || !texto.trim()}
              aria-label="Enviar mensagem"
            >
              <i className="bi bi-send-fill"></i>
            </button>
          </form>

          <small className="chat-aviso">
            Respostas automáticas. Para falar com uma pessoa, use o Fale Conosco.
          </small>
        </section>
      )}
    </>
  );
}

export default ChatWidget;