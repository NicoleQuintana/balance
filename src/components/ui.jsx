import { useState } from 'react'

/* Íconos propios, trazos simples */
const trazos = {
  inicio: 'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  jornada: 'M12 5v14M5 12h14',
  nafta: 'M4 20V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15M3 20h12M6 8h6M14 9h2.5a1.5 1.5 0 0 1 1.5 1.5V17a1.5 1.5 0 0 0 3 0V9l-3-3',
  reportes: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  ajustes:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  izq: 'M15 18l-6-6 6-6',
  der: 'M9 18l6-6-6-6',
  borrar: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  editar: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  alerta: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  compartir: 'M12 15V3M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7',
}

export function Icono({ nombre, tam = 22 }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={trazos[nombre]} />
    </svg>
  )
}

/* Plataforma: muestra el logo si ponés el archivo en public/logos/, si no, el nombre con su color */
export function Plataforma({ nombre, chica = false }) {
  const [hayLogo, setHayLogo] = useState(true)
  const clase = nombre === 'Didi' ? 'didi' : 'uber'
  return (
    <span className={`plat plat-${clase} ${chica ? 'plat-chica' : ''}`}>
      {hayLogo && (
        <img src={`/logos/${clase}.png`} alt="" onError={() => setHayLogo(false)} />
      )}
      {nombre}
    </span>
  )
}

export function Campo({ etiqueta, ayuda, prefijo, sufijo, error, ...props }) {
  return (
    <label className={`campo ${error ? 'campo-error' : ''}`}>
      <span className="campo-etiqueta">{etiqueta}</span>
      <span className="campo-caja">
        {prefijo && <span className="campo-afijo">{prefijo}</span>}
        <input {...props} />
        {sufijo && <span className="campo-afijo">{sufijo}</span>}
      </span>
      {error ? <span className="campo-msj error">{error}</span> : ayuda && <span className="campo-msj">{ayuda}</span>}
    </label>
  )
}

export function Dato({ etiqueta, valor, tono }) {
  return (
    <div className="dato">
      <span className="dato-etiqueta">{etiqueta}</span>
      <span className={`dato-valor ${tono ?? ''}`}>{valor}</span>
    </div>
  )
}

export function Segmentos({ opciones, valor, onCambio }) {
  return (
    <div className="segmentos" role="radiogroup">
      {opciones.map((o) => (
        <button key={o.valor} type="button" role="radio" aria-checked={valor === o.valor}
          className={valor === o.valor ? 'activo' : ''} onClick={() => onCambio(o.valor)}>
          {o.etiqueta}
        </button>
      ))}
    </div>
  )
}
