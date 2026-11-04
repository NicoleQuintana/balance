import { useMemo, useState } from 'react'
import { fmtNum, hoyISO, num, pesos } from '../lib/calc'
import { Campo } from '../components/ui'

const VACIA = { fecha: '', litros: '', monto: '', kmOdometro: '', estacion: '' }

export default function FormNafta({ inicial, cargas, kmAct, onGuardar, onCancelar }) {
  const [f, setF] = useState(() =>
    inicial
      ? Object.fromEntries(Object.entries({ ...VACIA, ...inicial }).map(([k, v]) => [k, v === 0 ? '' : String(v ?? '')]))
      : { ...VACIA, fecha: hoyISO() })
  const [errores, setErrores] = useState({})
  const cambiar = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const estaciones = useMemo(
    () => [...new Set(cargas.map((c) => (c.estacion || '').trim()).filter(Boolean))],
    [cargas],
  )
  const precioLitro = num(f.litros) > 0 ? num(f.monto) / num(f.litros) : 0

  const enviar = (e) => {
    e.preventDefault()
    const err = {}
    if (!f.fecha) err.fecha = 'Poné la fecha'
    if (!num(f.litros)) err.litros = '¿Cuántos litros cargaste?'
    if (!num(f.monto)) err.monto = '¿Cuánto pagaste?'
    if (!num(f.kmOdometro)) err.kmOdometro = 'Lo necesito para calcular el consumo'
    setErrores(err)
    if (Object.keys(err).length) return
    const datos = {
      fecha: f.fecha,
      litros: num(f.litros),
      monto: num(f.monto),
      kmOdometro: num(f.kmOdometro),
      estacion: f.estacion.trim(),
    }
    if (inicial?.id) datos.id = inicial.id
    onGuardar(datos)
  }

  return (
    <section className="pagina">
      <header className="cabecera">
        <h1>{inicial ? 'Editar carga' : 'Cargar nafta'}</h1>
        <p className="tenue">Los datos están en el ticket.</p>
      </header>

      <form className="formulario" onSubmit={enviar} noValidate>
        <Campo etiqueta="Fecha" type="date" value={f.fecha} onChange={cambiar('fecha')} error={errores.fecha} />
        <div className="dos-col">
          <Campo etiqueta="Litros" inputMode="decimal" sufijo="l" value={f.litros} onChange={cambiar('litros')} error={errores.litros} />
          <Campo etiqueta="Pagaste" inputMode="decimal" prefijo="$" value={f.monto} onChange={cambiar('monto')} error={errores.monto} />
        </div>
        <Campo etiqueta="Cuentakilómetros" inputMode="numeric" sufijo="km"
          placeholder={kmAct ? fmtNum(kmAct, 0) : ''} value={f.kmOdometro}
          onChange={cambiar('kmOdometro')} error={errores.kmOdometro}
          ayuda="Si llenás el tanque cada vez, el consumo sale más preciso." />
        <Campo etiqueta="Estación" list="estaciones" placeholder="Opcional" autoComplete="off"
          value={f.estacion} onChange={cambiar('estacion')} />
        <datalist id="estaciones">
          {estaciones.map((e) => <option key={e} value={e} />)}
        </datalist>

        {precioLitro > 0 && (
          <p className="tenue">Te salió <b className="blanco">{pesos(precioLitro)}</b> el litro.</p>
        )}

        <div className="botones">
          {inicial && <button type="button" className="btn-secundario" onClick={onCancelar}>Cancelar</button>}
          <button type="submit" className="btn-primario">{inicial ? 'Guardar cambios' : 'Guardar carga'}</button>
        </div>
      </form>
    </section>
  )
}
