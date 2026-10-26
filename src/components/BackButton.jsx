import { useNavigate } from 'react-router-dom';
import './BackButton.css';

/**
 * Botão "Voltar". Com `to`, vai para essa rota; sem `to`, volta no histórico
 * (ou para `fallback` se a pessoa abriu a página direto, sem histórico).
 * Com `onClick`, executa a função (ex.: voltar uma etapa dentro da mesma tela).
 */
const BackButton = ({ to, fallback = '/', onClick, label = 'Voltar', className = '' }) => {
  const navigate = useNavigate();

  const voltar = () => {
    if (onClick) return onClick();
    if (to) return navigate(to);
    if (window.history.state?.idx > 0) return navigate(-1);
    return navigate(fallback);
  };

  return (
    <button type="button" className={`btn-voltar ${className}`} onClick={voltar}>
      <i className="bi bi-arrow-left"></i> {label}
    </button>
  );
};

export default BackButton;
