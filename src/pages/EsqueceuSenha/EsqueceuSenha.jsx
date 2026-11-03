import { useState } from 'react'; 
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify'; 
import BackButton from '../../components/BackButton';
import api from '../../services/api';
import { extrairMensagemErro } from '../../utils/errorUtils';
import './EsqueceuSenha.css';

const EsqueceuSenha = () => {
  const [email, setEmail] = useState(''); 
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      
      await api.post('/auth/forgot-password', { email: email.trim() });

      // O servidor responde igual exista o e-mail ou não (segurança): a mensagem também é neutra.
      toast.success('Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha em instantes. Confira também o spam.');
      setEmail('');
    } catch (error) {
      toast.error(extrairMensagemErro(error, 'Não foi possível enviar o e-mail agora. Tente novamente em instantes.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="esqueceu-senha-container">
      <div className="esqueceu-senha-card">
        <BackButton to="/login" label="Voltar para o login" />
        <h2>Recuperar Senha</h2>
        <p>Digite seu e-mail abaixo. Enviaremos um link para você definir uma nova senha.</p>

        {/* 6. Chame a função handleSubmit aqui */}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-esqueceu-submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
          </button>
        </form>

        <div className="esqueceu-senha-footer">
          <span>
            Lembrou da senha? <Link to="/login">Voltar para o login</Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default EsqueceuSenha;