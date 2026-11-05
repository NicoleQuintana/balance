import { useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  aFecha, corto, DIAS, diaSemana, diasDelRango, enRango, fmtNum, hoyISO,
  mejorHorario, nombreGasto, num, pesos, totalGastos, fechaCorta, rangoMes, rangoSemana, resumenEstaciones, sumarDias, sumarMeses,
  totalizar, usoPersonal,
} from '../lib/calc'
import { Dato, Icono, Plataforma, Segmentos } from '../components/ui'

const C = {
  verde: '#34d399', rojo: '#f87171', gris: '#a1a1aa', grilla: '#26262b',
  uber: '#f4f4f5', didi: '#ff7a1a',
}
const tooltip = {
  contentStyle: { background: '#1c1c20', border: '1px solid #2e2e34', borderRadius: 10, color: '#f4f4f5' },
  itemStyle: { color: '#f4f4f5' },
  labelStyle: { color: '#a1a1aa' },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
  formatter: (v) => pesos(v),
}
const eje = { stroke: '#71717a', fontSize: 11, tickLine: false, axisLine: false }

function etiquetaPeriodo(modo, r) {
  if (modo === 'mes') {
    const t = aFecha(r.desde).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    return t.charAt(0).toUpperCase() + t.slice(1)
  }
  const op = { day: 'numeric', month: 'short' }
  return `${aFecha(r.desde).toLocaleDateString('es-AR', op)} – ${aFecha(r.hasta).toLocaleDateString('es-AR', op)}`
}

export default function Reportes({ jornadas, cargas, gastos, ctx }) {
  const [modo, setModo] = useState('semana')
  const [ancla, setAncla] = useState(hoyISO())
  const rango = modo === 'semana' ? rangoSemana(ancla) : rangoMes(ancla)
  const mover = (n) => setAncla(modo === 'semana' ? sumarDias(ancla, 7 * n) : sumarMeses(ancla, n))
  const esActual = enRango(hoyISO(), rango)

  const delPeriodo = jornadas.filter((j) => enRango(j.fecha, rango))
  const t = totalizar(delPeriodo, ctx)
  const gastosPeriodo = gastos
    .filter((g) => enRango(g.fecha, rango))
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
  const gAuto = totalGastos(gastosPeriodo)
  const quedaFinal = t.ganancia - gAuto

  const porDia = diasDelRango(rango).map((d) => ({
    nombre: modo === 'semana' ? DIAS[diaSemana(d)] : String(aFecha(d).getDate()),
    ganancia: totalizar(delPeriodo.filter((j) => j.fecha === d), ctx).ganancia,
  }))

  const balance = [
    { nombre: 'Ingresos', valor: t.ingresos, color: C.gris },
    { nombre: 'Nafta', valor: t.nafta, color: C.rojo },
    { nombre: 'Peajes', valor: t.peajes, color: C.rojo },
    ...(gAuto > 0 ? [{ nombre: 'Auto', valor: gAuto, color: C.rojo }] : []),
    { nombre: 'Ganancia', valor: t.ganancia, color: t.ganancia < 0 ? C.rojo : C.verde },
  ]

  const plataformas = ['Uber', 'Didi'].map((p) => ({
    nombre: p, ...totalizar(delPeriodo.filter((j) => j.plataforma === p), ctx),
  }))
  const torta = plataformas.filter((p) => p.ingresos > 0)

  const horario = mejorHorario(jornadas, ctx)
  const hayHorario = horario.porDia.some((d) => d.horas > 0)
  const franjas = horario.porFranja.filter((f) => f.horas > 0).sort((a, b) => b.porHora - a.porHora)
  const estaciones = resumenEstaciones(cargas)
  const personal = usoPersonal(jornadas, cargas, ctx)

  return (
    <section className="pagina">
      <header className="cabecera">
        <h1>Reportes</h1>
      </header>

      <Segmentos
        opciones={[{ valor: 'semana', etiqueta: 'Semana' }, { valor: 'mes', etiqueta: 'Mes' }]}
        valor={modo}
        onCambio={(m) => { setModo(m); setAncla(hoyISO()) }}
      />

      <div className="navegador">
        <button aria-label="Anterior" onClick={() => mover(-1)}><Icono nombre="izq" /></button>
        <span>{etiquetaPeriodo(modo, rango)}</span>
        <button aria-label="Siguiente" onClick={() => mover(1)} disabled={esActual}><Icono nombre="der" /></button>
      </div>

      {delPeriodo.length === 0 ? (
        gastosPeriodo.length === 0 && <p className="vacio">No hay jornadas en este período.</p>
      ) : (
        <>
          <div className="tarjeta">
            <span className="tarjeta-titulo">Ganancia limpia</span>
            <p className={`monto-medio ${t.ganancia < 0 ? 'rojo' : 'verde'}`}>{pesos(t.ganancia)}</p>
            <div className="grilla-datos">
              <Dato etiqueta="Ingresos" valor={pesos(t.ingresos)} />
              <Dato etiqueta="Nafta" valor={pesos(t.nafta)} tono="rojo" />
              <Dato etiqueta="Peajes" valor={pesos(t.peajes)} tono="rojo" />
              <Dato etiqueta="Por hora" valor={pesos(t.porHora)} />
              <Dato etiqueta="Horas" valor={fmtNum(t.horas)} />
              <Dato etiqueta="Km" valor={fmtNum(t.km, 0)} />
              <Dato etiqueta="En efectivo" valor={pesos(t.efectivo)} />
              <Dato etiqueta="Por la app" valor={pesos(t.app + t.propinas)} />
            </div>
          </div>

          <div className="tarjeta">
            <span className="tarjeta-titulo">Ganancia por día</span>
            <div className="grafico">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={porDia} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={C.grilla} />
                  <XAxis dataKey="nombre" {...eje} interval={modo === 'mes' ? 4 : 0} />
                  <YAxis {...eje} tickFormatter={corto} width={52} />
                  <Tooltip {...tooltip} />
                  <Bar dataKey="ganancia" name="Ganancia" radius={[4, 4, 0, 0]} maxBarSize={28}>
                    {porDia.map((d) => <Cell key={d.nombre} fill={d.ganancia < 0 ? C.rojo : C.verde} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="tarjeta">
            <span className="tarjeta-titulo">Ingresos y gastos</span>
            <div className="grafico">
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={balance} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={C.grilla} />
                  <XAxis dataKey="nombre" {...eje} />
                  <YAxis {...eje} tickFormatter={corto} width={52} />
                  <Tooltip {...tooltip} />
                  <Bar dataKey="valor" name="Monto" radius={[4, 4, 0, 0]} maxBarSize={44}>
                    {balance.map((b) => <Cell key={b.nombre} fill={b.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="tarjeta">
            <span className="tarjeta-titulo">Uber vs. Didi</span>
            {torta.length > 0 && (
              <div className="grafico">
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={torta} dataKey="ingresos" nameKey="nombre" innerRadius={48} outerRadius={72}
                      paddingAngle={torta.length > 1 ? 3 : 0} stroke="none">
                      {torta.map((p) => <Cell key={p.nombre} fill={p.nombre === 'Didi' ? C.didi : C.uber} />)}
                    </Pie>
                    <Tooltip {...tooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <table className="tabla">
              <thead>
                <tr><th></th><th>Ingresos</th><th>Ganancia</th><th>Por hora</th></tr>
              </thead>
              <tbody>
                {plataformas.map((p) => (
                  <tr key={p.nombre}>
                    <td><Plataforma nombre={p.nombre} chica /></td>
                    <td>{pesos(p.ingresos)}</td>
                    <td className={p.ganancia < 0 ? 'rojo' : ''}>{pesos(p.ganancia)}</td>
                    <td>{p.horas > 0 ? pesos(p.porHora) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {gastosPeriodo.length > 0 && (
        <div className="tarjeta">
          <span className="tarjeta-titulo">Gastos del auto</span>
          <ul className="ranking">
            {gastosPeriodo.map((g) => (
              <li key={g.id}>
                <span>
                  {nombreGasto(g.tipo)}{g.detalle ? ` · ${g.detalle}` : ''}
                  <span className="tenue chico"> · {fechaCorta(g.fecha)}</span>
                </span>
                <span className="rojo">−{pesos(num(g.monto))}</span>
              </li>
            ))}
          </ul>
          <div className="grilla-datos">
            <Dato etiqueta="Ganancia limpia" valor={pesos(t.ganancia)} tono={t.ganancia < 0 ? 'rojo' : 'verde'} />
            <Dato etiqueta="Gastos del auto" valor={pesos(gAuto)} tono="rojo" />
          </div>
          <div className="fila-entre">
            <span className="tarjeta-titulo">Te queda después de todo</span>
            <span className={`monto-chico ${quedaFinal < 0 ? 'rojo' : 'verde'}`}>{pesos(quedaFinal)}</span>
          </div>
          <p className="tenue chico">
            {t.ganancia <= 0
              ? 'En este período no hubo ganancia para cubrir estos gastos.'
              : quedaFinal >= 0
                ? 'Lo que ganaste haciendo Uber/Didi cubrió todos los gastos del auto. 🙌'
                : `Haciendo Uber/Didi cubriste el ${fmtNum((t.ganancia / gAuto) * 100, 0)}% de los gastos del auto.`}
          </p>
        </div>
      )}

      <h2 className="subtitulo">Desde que empezaste</h2>

      {hayHorario && (
        <div className="tarjeta">
          <span className="tarjeta-titulo">Mejor horario (ganancia por hora)</span>
          <div className="grafico">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={horario.porDia} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={C.grilla} />
                <XAxis dataKey="nombre" {...eje} />
                <YAxis {...eje} tickFormatter={corto} width={52} />
                <Tooltip {...tooltip} />
                <Bar dataKey="porHora" name="Por hora" fill={C.gris} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {franjas.length > 0 && (
            <ul className="ranking">
              {franjas.map((f, i) => (
                <li key={f.nombre}>
                  <span>{i === 0 ? '★ ' : ''}{f.nombre}</span>
                  <span className={i === 0 ? 'verde' : ''}>{pesos(f.porHora)}/h</span>
                </li>
              ))}
            </ul>
          )}
          {franjas.length === 0 && <p className="tenue chico">Cargá la hora de inicio para ver qué franja te rinde más.</p>}
        </div>
      )}

      {personal && (
        <div className="tarjeta">
          <span className="tarjeta-titulo">Uso del auto</span>
          <div className="grilla-datos">
            <Dato etiqueta="Km trabajando" valor={fmtNum(personal.trabajo, 0)} />
            <Dato etiqueta="Km personales" valor={fmtNum(personal.personal, 0)} />
            <Dato etiqueta="Costo personal" valor={pesos(personal.costo)} tono="rojo" />
          </div>
          <p className="tenue chico">Lo que te cuestan en nafta los viajes al laburo y demás, según tus registros.</p>
        </div>
      )}

      {estaciones.length > 0 && (
        <div className="tarjeta">
          <span className="tarjeta-titulo">Estaciones</span>
          <table className="tabla">
            <thead><tr><th>Estación</th><th>Veces</th><th>$ por litro</th></tr></thead>
            <tbody>
              {estaciones.map((e) => (
                <tr key={e.nombre}><td>{e.nombre}</td><td>{e.veces}</td><td>{pesos(e.precioLitro)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!hayHorario && !personal && estaciones.length === 0 && (
        <p className="vacio">A medida que cargues datos, acá vas a ver tu mejor horario, el uso del auto y las estaciones.</p>
      )}

    </section>
  )
}
