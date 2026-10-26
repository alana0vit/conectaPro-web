import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

/**
 * O checkout (simulado ou real) devolve o usuário ao site com ?pagamento=aprovado|recusado
 * (e &tipo=assinatura|demanda). Este hook mostra o aviso, limpa a URL e chama `onRetorno`
 * para a tela recarregar os dados.
 */
export default function usePagamentoRetorno(onRetorno) {
  const [params, setParams] = useSearchParams();
  const tratado = useRef(false);

  useEffect(() => {
    const status = params.get('pagamento');
    if (!status || tratado.current) return;
    tratado.current = true;

    const tipo = params.get('tipo');
    if (status === 'aprovado') {
      toast.success(
        tipo === 'assinatura'
          ? 'Pagamento aprovado! Seu plano foi ativado.'
          : 'Pagamento aprovado! O contato do profissional foi liberado.'
      );
    } else {
      toast.warn('Pagamento não concluído. Você pode tentar novamente quando quiser.');
    }

    onRetorno?.(status, tipo);

    const proximos = new URLSearchParams(params);
    proximos.delete('pagamento');
    proximos.delete('tipo');
    setParams(proximos, { replace: true });
  }, [params, setParams, onRetorno]);
}
