import { useState } from 'react'
import { fmtNum, hoyISO, num, TIPOS_GASTO } from '../lib/calc'
import { Campo, Segmentos } from '../components/ui'

const VACIO = { fecha: '', tipo: 'Service', detalle: '', monto: '', kmOdometro: '' }

const PISTAS = {
  Service: 'Ej: service de los 10.000 km',
  Aceite: 'Ej: aceite y filtro',
  Repuesto: 'Ej: cubierta, lámpara, escobillas',
  Otro: 'Ej: lavado, patente, VTV',
}

export default function FormGasto({ inicial, kmAct, onGuardar, onCancelar }) {
  const [f, setF] = useState(() =>
    inicial
      ? Object.fromEntries(Object.entries({ ...VACIO, ...inicial }).map(([k, v]) => [k, v === 0 ? '' : String(v ?? '')]))
      : { ...VACIO, fecha: hoyISO() })
  const [errores, setErrores] = useState({})
  const cambiar = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const esMantenimiento = f.tipo === 'Service' || f.tipo === 'Aceite'

  const enviar = (e) => {
    e.preventDefault()
    const err = {}
    if (!f.fecha) err.fecha = 'Poné la fecha'
    if (!num(f.monto)) err.monto = '¿Cuánto pagaste?'
    setErrores(err)
    if (Object.keys(err).length) return
    const datos = {
      fecha: f.fecha,
      tipo: f.tipo,
      detalle: f.detalle.trim(),
      monto: num(f.monto),
      kmOdometro: num(f.kmOdometro),
    }
    if (inicial?.id) datos.id = inicial.id
    onGuardar(datos)
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <Segmentos opciones={TIPOS_GASTO} valor={f.tipo} onCambio={(v) => setF((x) => ({ ...x, tipo: v }))} />
      <Campo etiqueta="Fecha" type="date" value={f.fecha} onChange={cambiar('fecha')} error={errores.fecha} />
      <Campo etiqueta="Detalle" placeholder={PISTAS[f.tipo]} autoComplete="off"
        value={f.detalle} onChange={cambiar('detalle')} ayuda="Opcional" />
      <Campo etiqueta="Pagaste" inputMode="decimal" prefijo="$" value={f.monto}
        onChange={cambiar('monto')} error={errores.monto} />
      <Campo etiqueta="Cuentakilómetros" inputMode="numeric" sufijo="km"
        placeholder={kmAct ? fmtNum(kmAct, 0) : ''} value={f.kmOdometro} onChange={cambiar('kmOdometro')}
        ayuda={esMantenimiento
          ? 'Si lo ponés, queda anotado como el último y se recalcula el próximo.'
          : 'Opcional'} />

      <div className="botones">
        {inicial && <button type="button" className="btn-secundario" onClick={onCancelar}>Cancelar</button>}
        <button type="submit" className="btn-primario">{inicial ? 'Guardar cambios' : 'Guardar gasto'}</button>
      </div>
    </form>
  )
}
