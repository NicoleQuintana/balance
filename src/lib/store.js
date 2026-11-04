import { useCallback, useEffect, useState } from 'react'
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { auth, db, firebaseActivo, googleProvider } from './firebase'

export const AJUSTES_BASE = {
  metaSemanal: 0,
  kmPorLitroManual: 0,
  kmUltimoService: 0,
  intervaloService: 10000,
  kmUltimoAceite: 0,
  intervaloAceite: 10000,
}

/* ---------- Modo local (sin Firebase) ---------- */

const bus = new EventTarget()
const clave = (nombre) => `balance:${nombre}`

function leerLocal(nombre, porDefecto) {
  try {
    const v = localStorage.getItem(clave(nombre))
    return v ? JSON.parse(v) : porDefecto
  } catch {
    return porDefecto
  }
}

function escribirLocal(nombre, valor) {
  try {
    localStorage.setItem(clave(nombre), JSON.stringify(valor))
  } catch (e) {
    console.error('No se pudo guardar en este navegador', e)
  }
  bus.dispatchEvent(new Event(nombre))
}

const nuevoId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`

/* ---------- Sesión ---------- */

export function useAuth() {
  const [estado, setEstado] = useState(() =>
    firebaseActivo
      ? { user: null, cargando: true }
      : { user: { uid: 'local', displayName: null, email: null }, cargando: false },
  )

  useEffect(() => {
    if (!firebaseActivo) return
    getRedirectResult(auth).catch((e) => console.error(e))
    return onAuthStateChanged(auth, (user) => setEstado({ user, cargando: false }))
  }, [])

  const entrar = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      const usarRedirect = [
        'auth/popup-blocked',
        'auth/operation-not-supported-in-this-environment',
        'auth/cancelled-popup-request',
      ]
      if (usarRedirect.includes(e?.code)) await signInWithRedirect(auth, googleProvider)
      else if (e?.code !== 'auth/popup-closed-by-user') throw e
    }
  }, [])

  const salir = useCallback(() => (firebaseActivo ? signOut(auth) : null), [])

  return { ...estado, entrar, salir }
}

/* ---------- Datos ---------- */

export function useColeccion(user, nombre) {
  const [items, setItems] = useState([])
  const uid = user?.uid

  useEffect(() => {
    if (!uid) {
      setItems([])
      return
    }
    if (!firebaseActivo) {
      const cargar = () => setItems(leerLocal(nombre, []))
      cargar()
      bus.addEventListener(nombre, cargar)
      return () => bus.removeEventListener(nombre, cargar)
    }
    return onSnapshot(
      collection(db, 'users', uid, nombre),
      (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error(err),
    )
  }, [uid, nombre])

  return items
}

// No se espera (await) la escritura a propósito: sin señal, Firestore la guarda
// en el celu al instante y la sube sola cuando vuelve internet.
export function guardar(user, nombre, datos) {
  const { id, ...resto } = datos
  const registro = { ...resto, actualizado: Date.now() }

  if (!firebaseActivo) {
    const lista = leerLocal(nombre, [])
    const nueva = id
      ? lista.map((x) => (x.id === id ? { ...registro, id } : x))
      : [...lista, { ...registro, id: nuevoId() }]
    escribirLocal(nombre, nueva)
    return
  }
  const ref = id
    ? doc(db, 'users', user.uid, nombre, id)
    : doc(collection(db, 'users', user.uid, nombre))
  setDoc(ref, registro).catch((e) => console.error(e))
}

export function borrar(user, nombre, id) {
  if (!firebaseActivo) {
    escribirLocal(
      nombre,
      leerLocal(nombre, []).filter((x) => x.id !== id),
    )
    return
  }
  deleteDoc(doc(db, 'users', user.uid, nombre, id)).catch((e) => console.error(e))
}

export function useAjustes(user) {
  const [ajustes, setAjustes] = useState(AJUSTES_BASE)
  const uid = user?.uid

  useEffect(() => {
    if (!uid) return
    if (!firebaseActivo) {
      const cargar = () => setAjustes({ ...AJUSTES_BASE, ...leerLocal('ajustes', {}) })
      cargar()
      bus.addEventListener('ajustes', cargar)
      return () => bus.removeEventListener('ajustes', cargar)
    }
    return onSnapshot(
      doc(db, 'users', uid, 'config', 'ajustes'),
      (s) => setAjustes({ ...AJUSTES_BASE, ...(s.data() ?? {}) }),
      (err) => console.error(err),
    )
  }, [uid])

  const guardarAjustes = useCallback(
    (cambios) => {
      if (!firebaseActivo) {
        escribirLocal('ajustes', { ...leerLocal('ajustes', {}), ...cambios })
        return
      }
      setDoc(doc(db, 'users', uid, 'config', 'ajustes'), cambios, { merge: true }).catch((e) =>
        console.error(e),
      )
    },
    [uid],
  )

  return [ajustes, guardarAjustes]
}
