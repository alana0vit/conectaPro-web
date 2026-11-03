import emailjs from '@emailjs/browser';
import { useState } from 'react';
import { toast } from 'react-toastify';
import ilustracaoImg from '../../assets/imgfaleconosco.jpg';
import BackButton from '../../components/BackButton';
import './FaleConosco.css';

function FaleConosco() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    motivo: '',
    mensagem: ''
  });

  const [enviando, setEnviando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (enviando) return;

    setEnviando(true);

    const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    const templateParams = {
      nome: formData.nome,
      email: formData.email,
      motivo: formData.motivo,
      mensagem: formData.mensagem
    };

    emailjs.send(serviceID, templateID, templateParams, publicKey)
      .then(() => {
        toast.success("Mensagem enviada com sucesso! Logo entraremos em contato.");
        setFormData({ nome: '', email: '', motivo: '', mensagem: '' });
      })
      .catch((err) => {
        console.error('ERRO:', err);
        toast.error("Ocorreu um erro ao enviar. Tente novamente.");
      })
      .finally(() => {
        setEnviando(false);
      });
  };

  return (
    <div className="pagina-fale-conosco">
      <div className="cartao-fale-conosco">
        
        <div className="secao-visual-contato">
          <BackButton fallback="/" />
          <p className="etiqueta-contato">ESTAMOS AQUI PARA TE AJUDAR!</p>
          <h1 className="titulo-contato">Atendimento ao Cliente e Suporte</h1>
          <p className="texto-contato">
            Se você precisa de ajuda, quer esclarecer alguma informação ou deseja enviar uma 
            sugestão para melhorarmos a plataforma, envie sua mensagem. Nossa equipe 
            analisará seu contato com atenção e retornará o mais rápido possível.
          </p>
          <div className="container-imagem-contato">
             <img src={ilustracaoImg} alt="Suporte ConectaPRO" />
          </div>
        </div>

        <div className="secao-formulario-contato">
          <form onSubmit={handleSubmit}>
            <div className="campo-entrada-contato">
              <label>Nome</label>
              <input 
                type="text" 
                name="nome"
                placeholder="Digite seu nome" 
                value={formData.nome}
                onChange={handleChange}
                required
              />
            </div>

            <div className="campo-entrada-contato">
              <label>E-mail</label>
              <input 
                type="email" 
                name="email"
                placeholder="Digite seu e-mail" 
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="campo-entrada-contato">
              <label>Motivo do contato</label>
              <select 
                name="motivo"
                value={formData.motivo}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Selecione um motivo</option>
                <option value="duvida">Dúvida Geral</option>
                <option value="suporte">Suporte Técnico</option>
                <option value="sugestao">Sugestão</option>
              </select>
            </div>

            <div className="campo-entrada-contato">
              <label>Mensagem</label>
              <textarea 
                name="mensagem"
                placeholder="Digite sua mensagem"
                value={formData.mensagem}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="botao-contato" 
              disabled={enviando}
              style={{ opacity: enviando ? 0.7 : 1, cursor: enviando ? 'not-allowed' : 'pointer' }}
            >
              {enviando ? "Enviando..." : "Enviar"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default FaleConosco;