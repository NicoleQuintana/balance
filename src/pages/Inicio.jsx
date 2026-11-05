import { useState } from 'react'
import {
  calcularJornada, enRango, estadoMantenimiento, fechaCorta, fmtNum, ganadoDesde, hoyISO,
  nombreGasto, num, pesos, rangoSemana, totalizar,
} from '../lib/calc'
import { Dato, Icono, Plataforma } from '../components/ui'

function AvisoInstalar() {
  const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const instalada = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone
  const [oculto, setOculto] = useState(() => {
    try { return localStorage.getItem('balance:avisoInstalar') === 'no' } catch { return false }
  })
  if (!esIOS || instalada || oculto) return null
  const cerrar = () => {
    try { localStorage.setItem('balance:avisoInstalar', 'no') } catch { /* nada */ }
    setOculto(true)
  }
  return (
    <div className="aviso">
      <Icono nombre="compartir" tam={20} />
      <p>Para instalarla: tocá <b>Compartir</b> en Safari y elegí <b>Agregar a pantalla de inicio</b>.</p>
      <button className="btn-texto" onClick={cerrar}>Listo</button>
    </div>
  )
}

export default function Inicio({ jornadas, cargas, gastos, ajustes, ctx, kmAct, onEditar, onBorrar }) {
  const hoy = hoyISO()
  const semana = rangoSemana(hoy)
  const t = totalizar(jornadas.filter((j) => enRango(j.fecha, semana)), ctx)
  const meta = num(ajustes.metaSemanal)
  const avance = meta > 0 ? Math.min(100, Math.max(0, (t.ganancia / meta) * 100)) : 0
  const mantenimiento = estadoMantenimiento(ajustes, kmAct).filter((m) => m.configurado)

  const registros = [
    ...jornadas.map((j) => ({ tipo: 'jornada', datos: j })),
    ...cargas.map((c) => ({ tipo: 'nafta', datos: c })),
    ...gastos.map((g) => ({ tipo: 'gasto', datos: g })),
  ]
    .sort((a, b) =>
      a.datos.fecha === b.datos.fecha
        ? (b.datos.actualizado ?? 0) - (a.datos.actualizado ?? 0)
        : a.datos.fecha < b.datos.fecha ? 1 : -1)
    .slice(0, 10)

  return (
    <section className="pagina">
      <header className="cabecera">
        <p className="sobretitulo">Esta semana</p>
        <h1 className={`monto-grande ${t.ganancia < 0 ? 'rojo' : 'verde'}`}>{pesos(t.ganancia)}</h1>
        <p className="tenue">ganancia limpia · {t.cantidad} {t.cantidad === 1 ? 'jornada' : 'jornadas'}</p>
      </header>

      <AvisoInstalar />

      {meta > 0 && (
        <div className="tarjeta">
          <div className="fila-entre">
            <span className="tarjeta-titulo">Meta semanal</span>
            <span className="tenue">{pesos(meta)}</span>
          </div>
          <div className="barra"><div className="barra-relleno" style={{ width: `${avance}%` }} /></div>
          <p className="tenue chico">
            {t.ganancia >= meta ? '¡Meta cumplida!' : `Te faltan ${pesos(meta - t.ganancia)}`}
          </p>
        </div>
      )}

      <div className="grilla-datos">
        <Dato etiqueta="Ingresos" valor={pesos(t.ingresos)} />
        <Dato etiqueta="Gastos" valor={pesos(t.gastos)} tono={t.gastos > 0 ? 'rojo' : ''} />
        <Dato etiqueta="Horas" valor={fmtNum(t.horas)} />
        <Dato etiqueta="Por hora" valor={pesos(t.porHora)} />
      </div>

      {mantenimiento.length > 0 && (
        <div className="tarjeta">
          <span className="tarjeta-titulo">Mantenimiento</span>
          {mantenimiento.map((m) => {
            const ganado = ganadoDesde(jornadas, ctx, m.ultimo)
            const cubre = m.costo > 0 ? Math.min(100, Math.max(0, (ganado / m.costo) * 100)) : 0
            return (
              <div key={m.clave} className="mant">
                <div className="fila-entre">
                  <span className={`mant-nombre ${m.estado === 'vencido' ? 'rojo' : ''}`}>
                    {m.estado !== 'ok' && <Icono nombre="alerta" tam={16} />}
                    {m.nombre}
                  </span>
                  <span className={`chico ${m.estado === 'vencido' ? 'rojo' : 'tenue'}`}>
                    {m.estado === 'vencido'
                      ? `vencido hace ${fmtNum(-m.faltan, 0)} km`
                      : `en ${fmtNum(m.faltan, 0)} km`}
                  </span>
                </div>
                {m.costo > 0 && (
                  <>
                    <div className="barra"><div className="barra-relleno" style={{ width: `${cubre}%` }} /></div>
                    <p className="tenue chico">
                      {cubre >= 100
                        ? `¡Ya lo cubriste! Ganaste ${pesos(ganado)} desde el último (sale ~${pesos(m.costo)}).`
                        : `Ganaste ${pesos(Math.max(0, ganado))} de los ~${pesos(m.costo)} que sale.`}
                    </p>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="tarjeta">
        <span className="tarjeta-titulo">Consumo del auto</span>
        {ctx.rend.kmPorLitro ? (
          <p className="consumo">
            <b>{fmtNum(ctx.rend.kmPorLitro)} km/l</b>
            <span className="tenue"> · {pesos(ctx.costoKm(hoy))} por km
              {ctx.rend.fuente === 'manual' && ' (estimado en Ajustes)'}</span>
          </p>
        ) : (
          <p className="tenue chico">
            Cargá nafta al menos dos veces, con el cuentakilómetros, y la app calcula el consumo real.
            Mientras tanto podés poner uno estimado en Ajustes.
          </p>
        )}
      </div>

      <h2 className="subtitulo">Últimos registros</h2>
      {registros.length === 0 ? (
        <p className="vacio">Todavía no cargaste nada. Arrancá por la nafta o por tu primera jornada.</p>
      ) : (
        <ul className="lista">
          {registros.map(({ tipo, datos }) => {
            const r = tipo === 'jornada' ? calcularJornada(datos, ctx) : null
            return (
              <li key={`${tipo}-${datos.id}`} className="item">
                <div className="item-info">
                  <div className="item-linea">
                    {tipo === 'jornada'
                      ? <Plataforma nombre={datos.plataforma} chica />
                      : <span className="etiqueta-nafta">{tipo === 'nafta' ? 'Nafta' : 'Auto'}</span>}
                    <span className="tenue chico">{fechaCorta(datos.fecha)}</span>
                  </div>
                  <span className="tenue chico">
                    {tipo === 'jornada'
                      ? `${fmtNum(r.km, 0)} km · ${fmtNum(r.horas)} h`
                      : tipo === 'nafta'
                        ? `${fmtNum(num(datos.litros))} l${datos.estacion ? ` · ${datos.estacion}` : ''}`
                        : `${nombreGasto(datos.tipo)}${datos.detalle ? ` · ${datos.detalle}` : ''}`}
                  </span>
                </div>
                <span className={`item-monto ${tipo !== 'jornada' || r.ganancia < 0 ? 'rojo' : 'verde'}`}>
                  {tipo === 'jornada' ? pesos(r.ganancia) : `−${pesos(num(datos.monto))}`}
                </span>
                <div className="item-acciones">
                  <button aria-label="Editar" onClick={() => onEditar(tipo, datos)}><Icono nombre="editar" tam={18} /></button>
                  <button aria-label="Borrar" onClick={() => onBorrar(tipo, datos)}><Icono nombre="borrar" tam={18} /></button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
