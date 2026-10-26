import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import BackButton from '../../components/BackButton';
import api from '../../services/api';
import { extrairMensagemErro } from '../../utils/errorUtils';
import './RedefinicaoSenha.css';

const RedefinicaoSenha = () => {
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const passwordsMatch = confirmPassword.length === 0 || newPassword === confirmPassword;
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!passwordsMatch) {
            toast.error('As senhas não coincidem.');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (!token) {
            toast.error('Token de segurança ausente. Por favor, clique no link do seu e-mail novamente.');
            return;
        }

        setIsSubmitting(true);

        try {
            await api.post('/auth/reset-password', {
                token: token,
                newPassword: newPassword
            });

            toast.success('Senha redefinida com sucesso! Faça login para continuar.');
            navigate('/login');

        } catch (error) {
            console.error('Erro ao redefinir a senha:', error);
            toast.error(extrairMensagemErro(error, 'Ocorreu um erro. Seu link pode ter expirado, solicite um novo.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="redefinicao-senha-container">
            <div className="redefinicao-senha-card">
                <BackButton to="/login" label="Voltar para o login" />
                <div className="redefinicao-header-text">
                    <h2>Criar Nova Senha</h2>
                    <p>Digite sua nova senha abaixo para recuperar o acesso à sua conta.</p>
                </div>

                <form onSubmit={handleSubmit} className="redefinicao-form">
                    <div className="input-group">
                        <label>Nova Senha</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Digite a nova senha"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                disabled={isSubmitting}
                                required
                            />
                            <button
                                type="button"
                                className="btn-toggle-password"
                                onClick={togglePasswordVisibility}
                                tabIndex="-1"
                            >
                                <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Confirmar Nova Senha</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Repita a nova senha"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isSubmitting}
                                required
                                className={!passwordsMatch ? 'input-error-border' : ''}
                            />
                            <button
                                type="button"
                                className="btn-toggle-password"
                                onClick={togglePasswordVisibility}
                                tabIndex="-1"
                            >
                                <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                            </button>
                        </div>
                        {!passwordsMatch && (
                            <span className="error-text-live">As senhas não coincidem.</span>
                        )}
                    </div>

                    <div className="btn-container">
                        <button
                            type="submit"
                            className="btn-redefinir-submit"
                            disabled={isSubmitting || !passwordsMatch}
                        >
                            {isSubmitting ? 'Salvando...' : 'Salvar Nova Senha'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RedefinicaoSenha;