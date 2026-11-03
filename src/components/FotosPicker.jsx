import { useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-toastify';
import { mesclarImagens } from '../utils/uploadUtils';
import './FotosPicker.css';

/**
 * Seleção de várias fotos com pré-visualização. Cada seleção SOMA às anteriores.
 * `arquivos` e `onChange` são controlados pela tela (lista de File).
 */
function FotosPicker({ arquivos, onChange, max = 3, maxMb = 5, disabled = false, rotulo = 'Adicionar fotos' }) {
  const inputRef = useRef(null);
  const previews = useMemo(() => arquivos.map((f) => URL.createObjectURL(f)), [arquivos]);

  useEffect(() => () => previews.forEach((src) => URL.revokeObjectURL(src)), [previews]);

  const aoEscolher = (e) => {
    const novas = Array.from(e.target.files || []);
    e.target.value = '';
    if (novas.length === 0) return;
    const { lista, avisos } = mesclarImagens(arquivos, novas, { max, maxMb });
    avisos.forEach((aviso) => toast.warn(aviso));
    onChange(lista);
  };

  return (
    <div className="fotos-picker">
      <div className="fotos-picker-grid">
        {previews.map((src, i) => (
          <div className="fotos-picker-item" key={src}>
            <img src={src} alt={`Foto ${i + 1}`} />
            <button
              type="button"
              aria-label={`Remover foto ${i + 1}`}
              disabled={disabled}
              onClick={() => onChange(arquivos.filter((_, idx) => idx !== i))}
            >
              <i className="bi bi-x"></i>
            </button>
          </div>
        ))}

        {arquivos.length < max && (
          <button
            type="button"
            className="fotos-picker-add"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            <i className="bi bi-camera"></i>
            <span>{rotulo}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={aoEscolher}
      />
      <small className="fotos-picker-ajuda">
        {arquivos.length} de {max} fotos · até {maxMb} MB cada
      </small>
    </div>
  );
}

export default FotosPicker;
