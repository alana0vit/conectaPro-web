import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import BackButton from "../../components/BackButton";
import api from "../../services/api";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();
  
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/auth/login', data);
      const { token, id, name, userType } = response.data;

      localStorage.setItem('@ConectaPro:user', JSON.stringify({ id, name, userType, token }));
      
      toast.success(`Bem-vindo(a) de volta, ${name}!`);

      if (userType === 'CLIENT') {
        navigate('/dashboard-cliente'); 
      } else if (userType === 'PROFESSIONAL') {
        navigate('/dashboard-profissional'); 
      } else {
        navigate('/');
      }

    } catch (error) {
      console.error("Erro na autenticação:", error);
      const mensagemErro = error.response?.data || "E-mail ou senha incorretos.";
      toast.error(mensagemErro);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <BackButton to="/" label="Voltar para o início" />
        <h2>Login</h2>
        <p>Acesse sua conta para gerenciar seus serviços.</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="input-group">
            <label>E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              {...register("email", { required: "O e-mail é obrigatório" })}
            />
          </div>

          <div className="input-group">
            <label>Senha</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="********"
                {...register("password", { required: "A senha é obrigatória" })}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                    <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                    <line x1="2" y1="2" x2="22" y2="22"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" /> Lembrar de mim
            </label>
            <Link to="/esqueceu-senha">Esqueceu a senha?</Link>
          </div>

          <button type="submit" className="btn-login-submit">
            Entrar
          </button>
        </form>

        <div className="login-footer">
          <span>
            Ainda não tem conta? <Link to="/cadastro">Cadastre-se</Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;