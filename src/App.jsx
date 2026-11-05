import { useEffect, useMemo, useState } from 'react'
import { crearContexto, kmActual, num } from './lib/calc'
import { borrar, guardar, mensajeError, useAjustes, useAuth, useColeccion } from './lib/store'
import { Campo, Icono } from './components/ui'
import Inicio from './pages/Inicio'
import FormJornada from './pages/FormJornada'
import Gastos from './pages/Gastos'
import Reportes from './pages/Reportes'
import Ajustes from './pages/Ajustes'

const PESTANAS = [
  { id: 'inicio', etiqueta: 'Inicio' },
  { id: 'jornada', etiqueta: 'Jornada' },
  { id: 'gastos', etiqueta: 'Gastos', icono: 'nafta' },
  { id: 'reportes', etiqueta: 'Reportes' },
  { id: 'ajustes', etiqueta: 'Ajustes' },
]

function Login({ auth }) {
  const [modo, setModo] = useState('entrar') // 'entrar' | 'crear'
  const [mail, setMail] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    setAviso('')
    setEnviando(true)
    try {
      if (modo === 'crear') await auth.registrar(mail, clave)
      else await auth.entrar(mail, clave)
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setEnviando(false)
    }
  }

  const recuperar = async () => {
    setError('')
    setAviso('')
    if (!mail.trim()) return setError('Escribí tu mail arriba y tocá de nuevo.')
    try {
      await auth.recuperar(mail)
      setAviso('Te mandamos un mail para cambiar la contraseña. Fijate también en spam.')
    } catch (err) {
      setError(mensajeError(err))
    }
  }

  return (
    <div className="login">
      <img src="/icon.svg" alt="" width="72" height="72" />
      <h1>Balance</h1>
      <p className="tenue">Lo que ganás y lo que gastás haciendo Uber y Didi.</p>

      <form className="login-form" onSubmit={enviar} noValidate>
        <Campo etiqueta="Mail" type="email" autoComplete="email" inputMode="email"
          value={mail} onChange={(e) => setMail(e.target.value)} />
        <Campo etiqueta="Contraseña" type="password"
          autoComplete={modo === 'crear' ? 'new-password' : 'current-password'}
          ayuda={modo === 'crear' ? 'Al menos 6 caracteres.' : undefined}
          value={clave} onChange={(e) => setClave(e.target.value)} />
        {error && <p className="rojo chico">{error}</p>}
        {aviso && <p className="verde chico">{aviso}</p>}
        <button type="submit" className="btn-primario" disabled={enviando}>
          {enviando ? 'Un segundo…' : modo === 'crear' ? 'Crear cuenta' : 'Entrar'}
        </button>
      </form>

      <button className="btn-texto" onClick={() => { setModo(modo === 'crear' ? 'entrar' : 'crear'); setError(''); setAviso('') }}>
        {modo === 'crear' ? 'Ya tengo cuenta' : 'Es la primera vez: crear cuenta'}
      </button>
      {modo === 'entrar' && (
        <button className="btn-texto tenue" onClick={recuperar}>Me olvidé la contraseña</button>
      )}
    </div>
  )
}

function Principal({ auth }) {
  const { user } = auth
  const jornadas = useColeccion(user, 'jornadas')
  const cargas = useColeccion(user, 'cargas')
  const gastos = useColeccion(user, 'gastos')
  const [ajustes, guardarAjustes] = useAjustes(user)
  const [pestana, setPestana] = useState('inicio')
  const [edicion, setEdicion] = useState(null)
  const [mensaje, setMensaje] = useState('')

  const ctx = useMemo(() => crearContexto(cargas, ajustes), [cargas, ajustes])
  const kmAct = useMemo(() => kmActual(jornadas, cargas, gastos), [jornadas, cargas, gastos])

  useEffect(() => {
    if (!mensaje) return
    const t = setTimeout(() => setMensaje(''), 2200)
    return () => clearTimeout(t)
  }, [mensaje])

  useEffect(() => { window.scrollTo(0, 0) }, [pestana])

  const irA = (id) => { setEdicion(null); setPestana(id) }
  const pestanaDe = (tipo) => (tipo === 'jornada' ? 'jornada' : 'gastos')
  const editar = (tipo, datos) => { setEdicion({ tipo, datos }); setPestana(pestanaDe(tipo)) }
  const coleccion = (tipo) => ({ jornada: 'jornadas', nafta: 'cargas', gasto: 'gastos' })[tipo]
  const MENSAJES = { jornada: 'Jornada guardada', nafta: 'Carga guardada', gasto: 'Gasto guardado' }

  const alGuardar = (tipo) => (datos) => {
    guardar(user, coleccion(tipo), datos)
    // Un service o cambio de aceite con kilometraje queda anotado como el último.
    const km = num(datos.kmOdometro)
    if (tipo === 'gasto' && km && (datos.tipo === 'Service' || datos.tipo === 'Aceite')
      && km >= num(ajustes[`kmUltimo${datos.tipo}`])) {
      guardarAjustes({ [`kmUltimo${datos.tipo}`]: km })
    }
    setMensaje(datos.id ? 'Cambios guardados' : MENSAJES[tipo])
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
          <Inicio jornadas={jornadas} cargas={cargas} gastos={gastos} ajustes={ajustes} ctx={ctx} kmAct={kmAct}
            onEditar={editar} onBorrar={alBorrar} />
        )}
        {pestana === 'jornada' && (
          <FormJornada key={claveForm('jornada')} inicial={inicial('jornada')} ctx={ctx} kmAct={kmAct}
            onGuardar={alGuardar('jornada')} onCancelar={() => irA('inicio')} />
        )}
        {pestana === 'gastos' && (
          <Gastos key={edicion?.datos?.id ?? 'nuevo'} edicion={edicion?.tipo !== 'jornada' ? edicion : null}
            cargas={cargas} kmAct={kmAct} onGuardar={alGuardar} onCancelar={() => irA('inicio')} />
        )}
        {pestana === 'reportes' && <Reportes jornadas={jornadas} cargas={cargas} gastos={gastos} ctx={ctx} />}
        {pestana === 'ajustes' && (
          <Ajustes key={JSON.stringify(ajustes)} ajustes={ajustes} guardarAjustes={guardarAjustes} jornadas={jornadas} cargas={cargas} gastos={gastos}
            ctx={ctx} kmAct={kmAct} auth={auth} avisar={setMensaje} />
        )}
      </main>

      {mensaje && <div className="toast" role="status">{mensaje}</div>}

      <nav className="nav">
        {PESTANAS.map((p) => (
          <button key={p.id} className={pestana === p.id ? 'activo' : ''} onClick={() => irA(p.id)}
            aria-current={pestana === p.id ? 'page' : undefined}>
            <Icono nombre={p.icono ?? p.id} />
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
  if (!auth.user) return <Login auth={auth} />
  return <Principal auth={auth} />
}
