import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import './FAQ.css';

const faqData = [
    {
        pergunta: "Como encontro um profissional na minha região?",
        resposta: "Basta acessar nosso catálogo na página inicial, buscar pela sua cidade e escolher a categoria do serviço desejado."
    },
    {
        pergunta: "O cadastro é pago?",
        resposta: "Não! O cadastro é totalmente gratuito tanto para clientes quanto para profissionais."
    },
    {
        pergunta: "Como entro em contato com o profissional?",
        resposta: "Após você realizar um pedido no perfil do profissional, ele receberá uma notificação. Se ele aceitar, o WhatsApp dele será liberado para você."
    }
];

const FAQ = () => {
    const navigate = useNavigate();
    const [perguntaAtiva, setPerguntaAtiva] = useState(null);

    const togglePergunta = (index) => {
        if (perguntaAtiva === index) {
            setPerguntaAtiva(null);
        } else {
            setPerguntaAtiva(index); 
        }
    };

    return (
        <div className="faq-container">
            <BackButton fallback="/" />
            <div className="faq-header">
                <h2>Perguntas Frequentes</h2>
                <p>Tire suas dúvidas sobre como o ConectaPro funciona.</p>
            </div>

            <div className="faq-list">
                {faqData.map((item, index) => (
                    <div 
                        key={index} 
                        className={`faq-item ${perguntaAtiva === index ? 'ativo' : ''}`}
                        onClick={() => togglePergunta(index)}
                    >
                        <div className="faq-pergunta">
                            <h3>{item.pergunta}</h3>
                            <i className={`bi ${perguntaAtiva === index ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                        </div>
                        
                        {perguntaAtiva === index && (
                            <div className="faq-resposta">
                                <p>{item.resposta}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="faq-cta">
                <p>Ainda tem dúvidas? Mande uma mensagem e lhe retornaremos!</p>
                <button className="btn-action" onClick={() => navigate('/fale-conosco')}>
                    Atendimento ao Cliente 
                </button>
            </div>
        </div>
    );
};

export default FAQ;