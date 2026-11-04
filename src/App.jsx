import { useEffect, useMemo, useState } from 'react'
import { crearContexto, kmActual } from './lib/calc'
import { borrar, guardar, useAjustes, useAuth, useColeccion } from './lib/store'
import { Icono } from './components/ui'
import Inicio from './pages/Inicio'
import FormJornada from './pages/FormJornada'
import FormNafta from './pages/FormNafta'
import Reportes from './pages/Reportes'
import Ajustes from './pages/Ajustes'

const PESTANAS = [
  { id: 'inicio', etiqueta: 'Inicio' },
  { id: 'jornada', etiqueta: 'Jornada' },
  { id: 'nafta', etiqueta: 'Nafta' },
  { id: 'reportes', etiqueta: 'Reportes' },
  { id: 'ajustes', etiqueta: 'Ajustes' },
]

function Login({ onEntrar }) {
  const [error, setError] = useState('')
  const entrar = async () => {
    setError('')
    try { await onEntrar() } catch (e) { setError('No se pudo entrar. Probá de nuevo.'); console.error(e) }
  }
  return (
    <div className="login">
      <img src="/icon.svg" alt="" width="72" height="72" />
      <h1>Balance</h1>
      <p className="tenue">Lo que ganás y lo que gastás haciendo Uber y Didi.</p>
      <button className="btn-primario" onClick={entrar}>Entrar con Google</button>
      {error && <p className="rojo chico">{error}</p>}
    </div>
  )
}

function Principal({ auth }) {
  const { user } = auth
  const jornadas = useColeccion(user, 'jornadas')
  const cargas = useColeccion(user, 'cargas')
  const [ajustes, guardarAjustes] = useAjustes(user)
  const [pestana, setPestana] = useState('inicio')
  const [edicion, setEdicion] = useState(null)
  const [mensaje, setMensaje] = useState('')

  const ctx = useMemo(() => crearContexto(cargas, ajustes), [cargas, ajustes])
  const kmAct = useMemo(() => kmActual(jornadas, cargas), [jornadas, cargas])

  useEffect(() => {
    if (!mensaje) return
    const t = setTimeout(() => setMensaje(''), 2200)
    return () => clearTimeout(t)
  }, [mensaje])

  useEffect(() => { window.scrollTo(0, 0) }, [pestana])

  const irA = (id) => { setEdicion(null); setPestana(id) }
  const editar = (tipo, datos) => { setEdicion({ tipo, datos }); setPestana(tipo) }
  const coleccion = (tipo) => (tipo === 'jornada' ? 'jornadas' : 'cargas')

  const alGuardar = (tipo) => (datos) => {
    guardar(user, coleccion(tipo), datos)
    setMensaje(datos.id ? 'Cambios guardados' : tipo === 'jornada' ? 'Jornada guardada' : 'Carga guardada')
    irA('inicio')
  }
  const alBorrar = (tipo, datos) => {
    if (window.confirm(`¿Borrar este registro del ${datos.fecha}?`)) {
      borrar(user, coleccion(tipo), datos.id)
      setMensaje('Borrado')
    }
  }

  const inicial = (tipo) => (edicion?.tipo === tipo ? edicion.datos : null)
  const claveForm = (tipo) => inicial(tipo)?.id ?? 'nuevo'

  return (
    <div className="app">
      <main>
        {pestana === 'inicio' && (
          <Inicio jornadas={jornadas} cargas={cargas} ajustes={ajustes} ctx={ctx} kmAct={kmAct}
            onEditar={editar} onBorrar={alBorrar} />
        )}
        {pestana === 'jornada' && (
          <FormJornada key={claveForm('jornada')} inicial={inicial('jornada')} ctx={ctx} kmAct={kmAct}
            onGuardar={alGuardar('jornada')} onCancelar={() => irA('inicio')} />
        )}
        {pestana === 'nafta' && (
          <FormNafta key={claveForm('nafta')} inicial={inicial('nafta')} cargas={cargas} kmAct={kmAct}
            onGuardar={alGuardar('nafta')} onCancelar={() => irA('inicio')} />
        )}
        {pestana === 'reportes' && <Reportes jornadas={jornadas} cargas={cargas} ctx={ctx} />}
        {pestana === 'ajustes' && (
          <Ajustes key={JSON.stringify(ajustes)} ajustes={ajustes} guardarAjustes={guardarAjustes} jornadas={jornadas} cargas={cargas}
            ctx={ctx} kmAct={kmAct} auth={auth} avisar={setMensaje} />
        )}
      </main>

      {mensaje && <div className="toast" role="status">{mensaje}</div>}

      <nav className="nav">
        {PESTANAS.map((p) => (
          <button key={p.id} className={pestana === p.id ? 'activo' : ''} onClick={() => irA(p.id)}
            aria-current={pestana === p.id ? 'page' : undefined}>
            <Icono nombre={p.id} />
            <span>{p.etiqueta}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default function App() {
  const auth = useAuth()
  if (auth.cargando) return <div className="login"><div className="spinner" /></div>
  if (!auth.user) return <Login onEntrar={auth.entrar} />
  return <Principal auth={auth} />
}
