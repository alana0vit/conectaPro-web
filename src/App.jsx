import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Cadastro from "./pages/Cadastro/Cadastro";
import DashboardCliente from "./pages/DashboardCliente/DashboardCliente";
import DashboardProfissional from './pages/DashboardProfissional/DashboardProfissional';
import EditarPerfil from "./pages/EditarPerfil/EditarPerfil";
import EsqueceuSenha from "./pages/EsqueceuSenha/EsqueceuSenha";
import FaleConosco from "./pages/FaleConosco/FaleConosco";
import FAQ from "./pages/FAQ/FAQ";
import Home from "./pages/Home/Home";
import ListaProf from "./pages/ListaProf/ListaProf";
import Login from "./pages/Login/Login";
import SolicServico from "./pages/SolicServico/SolicServico";
import TermosDeUso from "./pages/TermosDeUso/TermosDeUso";
import DetalhesSolicitacao from "./pages/DetalhesSolicitacao/DetalhesSolicitacao";
import EditarDemanda from "./pages/EditarDemanda/EditarDemanda";
import RedefinicaoSenha from "./pages/RedefinicaoSenha/RedefinicaoSenha";
import Planos from "./pages/Planos/Planos";

const RotaPrivadaCliente = ({ children }) => {
  const userStorage = localStorage.getItem("@ConectaPro:user");
  const user = userStorage ? JSON.parse(userStorage) : null;
  
  if (!user || user.userType !== "CLIENT") return <Navigate to="/login" />;
  return children;
};

const RotaPrivadaProfissional = ({ children }) => {
  const userStorage = localStorage.getItem("@ConectaPro:user");
  const user = userStorage ? JSON.parse(userStorage) : null;
  
  if (!user || user.userType !== "PROFESSIONAL") return <Navigate to="/login" />;
  return children;
};

const RotaPrivadaGeral = ({ children }) => {
  const userStorage = localStorage.getItem("@ConectaPro:user");
  const user = userStorage ? JSON.parse(userStorage) : null;
  
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Header />
      
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/fale-conosco" element={<FaleConosco />} />
        <Route path="/esqueceu-senha" element={<EsqueceuSenha />} />
        <Route path="/termos-de-uso" element={<TermosDeUso />} />
        <Route path="/reset-password" element={<RedefinicaoSenha />} />
        <Route path="/planos" element={<Planos />} />

        <Route path="/dashboard-cliente" element={<RotaPrivadaCliente><DashboardCliente /></RotaPrivadaCliente>} />
        <Route path="/lista-profissionais" element={<RotaPrivadaCliente><ListaProf /></RotaPrivadaCliente>} />
        <Route path="/solicitar-servico" element={<RotaPrivadaCliente><SolicServico /></RotaPrivadaCliente>} />
        <Route path="/detalhes-solicitacao" element={<RotaPrivadaCliente><DetalhesSolicitacao /></RotaPrivadaCliente>} />
        <Route path="/editar-demanda/:id" element={<RotaPrivadaCliente><EditarDemanda /></RotaPrivadaCliente>} />

        <Route path="/dashboard-profissional" element={<RotaPrivadaProfissional><DashboardProfissional /></RotaPrivadaProfissional>} />

        <Route path="/editar-perfil" element={<RotaPrivadaGeral><EditarPerfil /></RotaPrivadaGeral>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <Footer />

      <ToastContainer 
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </BrowserRouter>
  );
}

export default App;
