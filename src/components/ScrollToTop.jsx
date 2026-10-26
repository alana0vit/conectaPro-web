import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Ao trocar de rota, volta para o topo da página (ex.: sair/logout não deixa no rodapé). */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
