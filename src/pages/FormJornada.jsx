import { useState } from 'react'
import { calcularJornada, fmtNum, hoyISO, num, pesos } from '../lib/calc'
import { Campo, Dato, Segmentos } from '../components/ui'

const NUMERICOS = ['horas', 'kmInicio', 'kmFin', 'efectivo', 'app', 'propinas', 'peajes']
const VACIA = {
  fecha: '', plataforma: 'Uber', horaInicio: '', horas: '', kmInicio: '', kmFin: '',
  efectivo: '', app: '', propinas: '', peajes: '',
}

export default function FormJornada({ inicial, ctx, kmAct, onGuardar, onCancelar }) {
  const [f, setF] = useState(() =>
    inicial
      ? Object.fromEntries(Object.entries({ ...VACIA, ...inicial }).map(([k, v]) => [k, v === 0 ? '' : String(v ?? '')]))
      : { ...VACIA, fecha: hoyISO() })
  const [errores, setErrores] = useState({})
  const cambiar = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const r = calcularJornada(f, ctx)

  const enviar = (e) => {
    e.preventDefault()
    const err = {}
    if (!f.fecha) err.fecha = 'Poné la fecha'
    if (!num(f.kmInicio)) err.kmInicio = 'Anotá el cuentakilómetros al arrancar'
    if (!num(f.kmFin)) err.kmFin = 'Anotá el cuentakilómetros al terminar'
    else if (num(f.kmFin) < num(f.kmInicio)) err.kmFin = 'Tiene que ser mayor que el de inicio'
    if (!num(f.horas)) err.horas = '¿Cuántas horas estuviste conectada?'
    setErrores(err)
    if (Object.keys(err).length) return
    const datos = { ...f }
    for (const k of NUMERICOS) datos[k] = num(f[k])
    if (inicial?.id) datos.id = inicial.id
    onGuardar(datos)
  }

  return (
    <section className="pagina">
      <header className="cabecera">
        <h1>{inicial ? 'Editar jornada' : 'Cargar jornada'}</h1>
        <p className="tenue">El resumen del día, cuando terminás de trabajar.</p>
      </header>

      <form className="formulario" onSubmit={enviar} noValidate>
        <Segmentos
          opciones={[{ valor: 'Uber', etiqueta: 'Uber' }, { valor: 'Didi', etiqueta: 'Didi' }]}
          valor={f.plataforma}
          onCambio={(v) => setF((x) => ({ ...x, plataforma: v }))}
        />

        <div className="dos-col">
          <Campo etiqueta="Fecha" type="date" value={f.fecha} onChange={cambiar('fecha')} error={errores.fecha} />
          <Campo etiqueta="Hora de inicio" type="time" value={f.horaInicio} onChange={cambiar('horaInicio')} ayuda="Opcional" />
        </div>

        <Campo etiqueta="Horas conectada" inputMode="decimal" placeholder="3,5" sufijo="h"
          value={f.horas} onChange={cambiar('horas')} error={errores.horas} />

        <fieldset>
          <legend>Cuentakilómetros</legend>
          <div className="dos-col">
            <Campo etiqueta="Al arrancar" inputMode="numeric" sufijo="km"
              placeholder={kmAct ? fmtNum(kmAct, 0) : ''} value={f.kmInicio}
              onChange={cambiar('kmInicio')} error={errores.kmInicio} />
            <Campo etiqueta="Al terminar" inputMode="numeric" sufijo="km"
              value={f.kmFin} onChange={cambiar('kmFin')} error={errores.kmFin} />
          </div>
        </fieldset>

        <fieldset>
          <legend>Lo que cobraste (neto)</legend>
          <div className="dos-col">
            <Campo etiqueta="En efectivo" inputMode="decimal" prefijo="$" value={f.efectivo} onChange={cambiar('efectivo')} />
            <Campo etiqueta="App / tarjeta" inputMode="decimal" prefijo="$" value={f.app} onChange={cambiar('app')} />
          </div>
          <div className="dos-col">
            <Campo etiqueta="Propinas" inputMode="decimal" prefijo="$" value={f.propinas} onChange={cambiar('propinas')} />
            <Campo etiqueta="Peajes" inputMode="decimal" prefijo="$" value={f.peajes} onChange={cambiar('peajes')} />
          </div>
        </fieldset>

        <div className="tarjeta resumen-previo">
          <div className="grilla-datos">
            <Dato etiqueta="Km trabajados" valor={fmtNum(r.km, 0)} />
            <Dato etiqueta="Nafta usada" valor={pesos(r.nafta)} tono={r.nafta > 0 ? 'rojo' : ''} />
            <Dato etiqueta="Ganancia limpia" valor={pesos(r.ganancia)} tono={r.ganancia < 0 ? 'rojo' : 'verde'} />
            <Dato etiqueta="Por hora" valor={pesos(r.porHora)} />
          </div>
          {!ctx.rend.kmPorLitro && (
            <p className="tenue chico">Todavía no hay consumo calculado, así que la nafta da $0. Cargá nafta o poné un consumo estimado en Ajustes.</p>
          )}
        </div>

        <div className="botones">
          {inicial && <button type="button" className="btn-secundario" onClick={onCancelar}>Cancelar</button>}
          <button type="submit" className="btn-primario">{inicial ? 'Guardar cambios' : 'Guardar jornada'}</button>
        </div>
      </form>
    </section>
  )
}
