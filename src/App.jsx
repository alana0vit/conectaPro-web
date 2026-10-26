import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";
import ScrollToTop from "./components/ScrollToTop";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Cadastro = lazy(() => import("./pages/Cadastro/Cadastro"));
const DashboardCliente = lazy(() => import("./pages/DashboardCliente/DashboardCliente"));
const DashboardProfissional = lazy(() => import("./pages/DashboardProfissional/DashboardProfissional"));
const EditarPerfil = lazy(() => import("./pages/EditarPerfil/EditarPerfil"));
const EsqueceuSenha = lazy(() => import("./pages/EsqueceuSenha/EsqueceuSenha"));
const FaleConosco = lazy(() => import("./pages/FaleConosco/FaleConosco"));
const FAQ = lazy(() => import("./pages/FAQ/FAQ"));
import Home from "./pages/Home/Home";
const ListaProf = lazy(() => import("./pages/ListaProf/ListaProf"));
const Login = lazy(() => import("./pages/Login/Login"));
const SolicServico = lazy(() => import("./pages/SolicServico/SolicServico"));
const TermosDeUso = lazy(() => import("./pages/TermosDeUso/TermosDeUso"));
const DetalhesSolicitacao = lazy(() => import("./pages/DetalhesSolicitacao/DetalhesSolicitacao"));
const EditarDemanda = lazy(() => import("./pages/EditarDemanda/EditarDemanda"));
const RedefinicaoSenha = lazy(() => import("./pages/RedefinicaoSenha/RedefinicaoSenha"));
const Planos = lazy(() => import("./pages/Planos/Planos"));

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
      <ScrollToTop />
      <Header />

      <Suspense fallback={<div className="pagina-carregando">Carregando...</div>}>
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
      </Suspense>

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
