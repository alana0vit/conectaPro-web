import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getImageUrl } from "../utils/imageUtils";
import "./MapaProfissionais.css";

// Jaboatão dos Guararapes — usado só quando não há GPS nem profissional com coordenada.
const CENTRO_PADRAO = [-8.1127, -35.0148];
const ZOOM_PADRAO = 12;

const COR_PLANO = {
  Ouro: "#d4a017",
  Prata: "#8d99ae",
  Bronze: "#a96a3c",
};

// Pino desenhado em HTML: evita o problema clássico dos ícones do Leaflet com bundlers
// (as imagens padrão quebram no build do Vite) e ainda permite colorir por plano.
const criarPino = (plano, verificado) => {
  const cor = COR_PLANO[plano] || (verificado ? "#0066ff" : "#64748b");
  return L.divIcon({
    className: "mapa-pino-wrapper",
    html: `<span class="mapa-pino" style="background:${cor}">
             <i class="bi bi-person-fill"></i>
           </span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

const iconeUsuario = L.divIcon({
  className: "mapa-pino-wrapper",
  html: `<span class="mapa-pino-usuario"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

/** Reenquadra o mapa quando o conjunto de pontos muda. */
function AjustarEnquadramento({ pontos, posicaoUsuario }) {
  const map = useMap();
  const jaAjustouRef = useRef(false);

  useEffect(() => {
    const coords = pontos.map((p) => [p.latitude, p.longitude]);
    if (posicaoUsuario) {
      coords.push([posicaoUsuario.latitude, posicaoUsuario.longitude]);
    }

    if (coords.length === 0) return;

    if (coords.length === 1) {
      map.setView(coords[0], 14);
      return;
    }

    map.fitBounds(L.latLngBounds(coords), { padding: [40, 40], maxZoom: 15 });
    jaAjustouRef.current = true;
  }, [pontos, posicaoUsuario, map]);

  return null;
}

const estrelas = (nota) => {
  if (nota === null || nota === undefined) return "Sem avaliações";
  return `${Number(nota).toFixed(1)} ★`;
};

function MapaProfissionais({
  profissionais = [],
  posicaoUsuario = null,
  onSelecionar,
  rotuloAcao = "Solicitar serviço",
}) {
  // O backend devolve um profissional com N endereços; o mapa precisa de um pino por endereço.
  const pontos = useMemo(() => {
    const lista = [];
    profissionais.forEach((prof) => {
      (prof.locations || []).forEach((loc) => {
        if (loc.latitude === null || loc.longitude === null) return;
        lista.push({
          chave: `${prof.id}-${loc.addressId}`,
          profissional: prof,
          latitude: loc.latitude,
          longitude: loc.longitude,
          bairro: loc.neighborhood,
          cidade: loc.city,
          estado: loc.state,
          distanciaKm: loc.distanceKm,
        });
      });
    });
    return lista;
  }, [profissionais]);

  const semCoordenada = profissionais.length > 0 && pontos.length === 0;

  const centroInicial = pontos.length
    ? [pontos[0].latitude, pontos[0].longitude]
    : posicaoUsuario
      ? [posicaoUsuario.latitude, posicaoUsuario.longitude]
      : CENTRO_PADRAO;

  return (
    <div className="mapa-wrapper">
      {semCoordenada && (
        <div className="mapa-aviso">
          <i className="bi bi-exclamation-circle"></i>
          Os profissionais encontrados ainda não têm endereço localizado no mapa.
          Use a visualização em lista para vê-los.
        </div>
      )}

      {!semCoordenada && profissionais.length === 0 && (
        <div className="mapa-aviso">
          <i className="bi bi-search"></i>
          Nenhum profissional encontrado com os filtros atuais.
        </div>
      )}

      <MapContainer
        center={centroInicial}
        zoom={ZOOM_PADRAO}
        scrollWheelZoom
        className="mapa-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <AjustarEnquadramento pontos={pontos} posicaoUsuario={posicaoUsuario} />

        {posicaoUsuario && (
          <Marker
            position={[posicaoUsuario.latitude, posicaoUsuario.longitude]}
            icon={iconeUsuario}
          >
            <Popup>Você está aqui</Popup>
          </Marker>
        )}

        {pontos.map((ponto) => {
          const prof = ponto.profissional;
          return (
            <Marker
              key={ponto.chave}
              position={[ponto.latitude, ponto.longitude]}
              icon={criarPino(prof.activePlanName, prof.verified)}
            >
              <Popup>
                <div className="mapa-popup">
                  <div className="mapa-popup-topo">
                    {prof.photo ? (
                      <img
                        src={getImageUrl(prof.photo)}
                        alt={prof.name}
                        className="mapa-popup-foto"
                      />
                    ) : (
                      <span className="mapa-popup-foto mapa-popup-foto-vazia">
                        <i className="bi bi-person"></i>
                      </span>
                    )}
                    <div className="mapa-popup-identificacao">
                      <strong>
                        {prof.name}
                        {prof.verified && (
                          <i
                            className="bi bi-patch-check-fill mapa-popup-selo"
                            title="Profissional verificado"
                          ></i>
                        )}
                      </strong>
                      <span className="mapa-popup-nota">{estrelas(prof.rating)}</span>
                    </div>
                  </div>

                  {prof.activePlanName && (
                    <span
                      className="mapa-popup-plano"
                      style={{ background: COR_PLANO[prof.activePlanName] || "#64748b" }}
                    >
                      Plano {prof.activePlanName}
                    </span>
                  )}

                  {prof.categories?.length > 0 && (
                    <p className="mapa-popup-categorias">
                      {prof.categories.map((c) => c.name).join(" · ")}
                    </p>
                  )}

                  <p className="mapa-popup-local">
                    <i className="bi bi-geo-alt"></i>
                    {[ponto.bairro, ponto.cidade, ponto.estado].filter(Boolean).join(", ")}
                    {ponto.distanciaKm !== null && ponto.distanciaKm !== undefined && (
                      <span className="mapa-popup-distancia">
                        {" "}
                        · {ponto.distanciaKm.toFixed(1)} km
                      </span>
                    )}
                  </p>

                  <button
                    type="button"
                    className="mapa-popup-botao"
                    onClick={() => onSelecionar?.(prof.id)}
                  >
                    {rotuloAcao}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <p className="mapa-rodape">
        <i className="bi bi-shield-lock"></i>
        As posições são aproximadas (precisão de ~110 m) para preservar a privacidade dos
        profissionais. O endereço exato só é liberado após o aceite e o pagamento da demanda.
      </p>
    </div>
  );
}

export default MapaProfissionais;