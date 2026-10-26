import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import './Header.css';

const Header = () => {
    const navigate = useNavigate();

    const userStorage = localStorage.getItem('@ConectaPro:user');
    const user = userStorage ? JSON.parse(userStorage) : null;

    const fazerLogout = () => {
        localStorage.removeItem('@ConectaPro:user');
        // replace: o botão "voltar" do navegador não leva de volta a uma tela logada.
        navigate('/', { replace: true });
    };

    return (
        <header className="header">
            <div className="header-container">
                <Link to="/">
                    <img src={logo} alt="ConectaPro Logo" className="logo-img" />
                </Link>

                <nav className="header-nav">
                    <Link to="/faq" className="nav-link">FAQ</Link>

                    {user ? (
                        <div className="user-menu">
                            {user.userType === 'CLIENT' && (
                                <Link to="/lista-profissionais" className="nav-link">
                                    Serviços
                                </Link>
                            )}

                            {user.userType === 'PROFESSIONAL' && (
                                <Link to="/planos" className="nav-link">
                                    Planos
                                </Link>
                            )}

                            <Link
                                to={user.userType === 'CLIENT' ? "/dashboard-cliente" : "/dashboard-profissional"}
                                className="nav-link"
                            >
                                Meu Painel
                            </Link>

                            <span className="user-greeting">Olá, {user.name.split(' ')[0]}</span>
                            <button onClick={fazerLogout} className="btn-logout">Sair</button>
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/login" className="btn-login">Entrar</Link>
                            <Link to="/cadastro" className="btn-cadastro">Cadastre-se</Link>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;