import { useState } from 'react'
import { estadoMantenimiento, fmtNum, num } from '../lib/calc'
import { exportarExcel } from '../lib/exportar'
import { firebaseActivo } from '../lib/firebase'
import { Campo } from '../components/ui'

const CAMPOS = ['metaSemanal', 'kmPorLitroManual', 'kmUltimoService', 'intervaloService', 'kmUltimoAceite', 'intervaloAceite', 'costoService', 'costoAceite']

export default function Ajustes({ ajustes, guardarAjustes, jornadas, cargas, gastos, ctx, kmAct, auth, avisar }) {
  const [f, setF] = useState(() =>
    Object.fromEntries(CAMPOS.map((k) => [k, num(ajustes[k]) ? String(ajustes[k]) : ''])))
  const [exportando, setExportando] = useState(false)
  const cambiar = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const mant = estadoMantenimiento(ajustes, kmAct)

  const guardar = (e) => {
    e.preventDefault()
    guardarAjustes(Object.fromEntries(CAMPOS.map((k) => [k, num(f[k])])))
    avisar('Ajustes guardados')
  }

  const hechoHoy = (clave) => {
    const k = `kmUltimo${clave}`
    setF((x) => ({ ...x, [k]: String(kmAct) }))
    guardarAjustes({ [k]: kmAct })
    avisar('Anotado')
  }

  const exportar = async () => {
    setExportando(true)
    try { await exportarExcel(jornadas, cargas, gastos, ctx) } finally { setExportando(false) }
  }

  return (
    <section className="pagina">
      <header className="cabecera"><h1>Ajustes</h1></header>

      <form className="formulario" onSubmit={guardar} noValidate>
        <fieldset>
          <legend>Objetivo</legend>
          <Campo etiqueta="Meta de ganancia semanal" inputMode="decimal" prefijo="$"
            value={f.metaSemanal} onChange={cambiar('metaSemanal')} ayuda="Dejala vacía si no querés meta." />
        </fieldset>

        <fieldset>
          <legend>Consumo</legend>
          <Campo etiqueta="Consumo estimado" inputMode="decimal" sufijo="km/l"
            value={f.kmPorLitroManual} onChange={cambiar('kmPorLitroManual')}
            ayuda={ctx.rend.fuente === 'real'
              ? `Ya se usa el consumo real: ${fmtNum(ctx.rend.kmPorLitro)} km/l.`
              : 'Se usa hasta que tengas dos cargas de nafta.'} />
        </fieldset>

        <fieldset>
          <legend>Mantenimiento del Yaris</legend>
          {mant.map((m) => (
            <div key={m.clave} className="bloque-mant">
              <div className="dos-col">
                <Campo etiqueta={`Último ${m.nombre.toLowerCase()}`} inputMode="numeric" sufijo="km"
                  value={f[`kmUltimo${m.clave}`]} onChange={cambiar(`kmUltimo${m.clave}`)} />
                <Campo etiqueta="Cada" inputMode="numeric" sufijo="km"
                  value={f[`intervalo${m.clave}`]} onChange={cambiar(`intervalo${m.clave}`)} />
              </div>
              <Campo etiqueta="Costo estimado" inputMode="decimal" prefijo="$"
                value={f[`costo${m.clave}`]} onChange={cambiar(`costo${m.clave}`)}
                ayuda="Lo que te cobran en la concesionaria. Opcional." />
              <div className="fila-entre">
                <span className="tenue chico">
                  {m.configurado ? `Próximo a los ${fmtNum(m.proximo, 0)} km` : 'Sin configurar'}
                </span>
                {kmAct > 0 && (
                  <button type="button" className="btn-texto" onClick={() => hechoHoy(m.clave)}>
                    Lo hice hoy ({fmtNum(kmAct, 0)} km)
                  </button>
                )}
              </div>
            </div>
          ))}
          <p className="tenue chico">Revisá los intervalos en el manual del auto.</p>
        </fieldset>

        <button type="submit" className="btn-primario">Guardar ajustes</button>
      </form>

      <div className="tarjeta">
        <span className="tarjeta-titulo">Exportar</span>
        <p className="tenue chico">Tus jornadas, cargas de nafta y gastos del auto en una planilla de Excel.</p>
        <button className="btn-secundario" onClick={exportar} disabled={exportando || (!jornadas.length && !cargas.length && !gastos.length)}>
          {exportando ? 'Armando…' : 'Descargar Excel'}
        </button>
      </div>

      <div className="tarjeta">
        <span className="tarjeta-titulo">Cuenta</span>
        {firebaseActivo ? (
          <>
            <p className="tenue chico">Conectada como {auth.user?.email}. Tus datos se guardan en la nube.</p>
            <button className="btn-secundario" onClick={auth.salir}>Cerrar sesión</button>
          </>
        ) : (
          <p className="tenue chico">
            <b className="blanco">Modo local:</b> los datos quedan guardados solo en este navegador.
            Cuando configures Firebase, vas a entrar con tu mail y se guardan en la nube.
          </p>
        )}
      </div>
    </section>
  )
}
