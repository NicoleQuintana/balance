/* ---------- Números y formato ---------- */

export function num(v) {
  if (v === null || v === undefined || v === '') return 0
  const x = Number(String(v).replace(',', '.'))
  return Number.isFinite(x) ? x : 0
}

const fmtPesos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})
export const pesos = (v) => fmtPesos.format(Math.round(v || 0))
export const fmtNum = (v, dec = 1) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: dec }).format(v || 0)
export const corto = (v) => (Math.abs(v) >= 1000 ? `${fmtNum(v / 1000, 0)}k` : fmtNum(v, 0))

/* ---------- Fechas (siempre "AAAA-MM-DD", hora local) ---------- */

export function aFecha(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export function aISO(date) {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}
export const hoyISO = () => aISO(new Date())
export function sumarDias(iso, n) {
  const d = aFecha(iso)
  d.setDate(d.getDate() + n)
  return aISO(d)
}
export function sumarMeses(iso, n) {
  const d = aFecha(iso)
  return aISO(new Date(d.getFullYear(), d.getMonth() + n, 1))
}
export const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
export const diaSemana = (iso) => (aFecha(iso).getDay() + 6) % 7 // lunes = 0

export function rangoSemana(iso) {
  const desde = sumarDias(iso, -diaSemana(iso))
  return { desde, hasta: sumarDias(desde, 6) }
}
export function rangoMes(iso) {
  const d = aFecha(iso)
  return {
    desde: aISO(new Date(d.getFullYear(), d.getMonth(), 1)),
    hasta: aISO(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
  }
}
export const enRango = (iso, r) => iso >= r.desde && iso <= r.hasta
export function diasDelRango(r) {
  const dias = []
  for (let d = r.desde; d <= r.hasta; d = sumarDias(d, 1)) dias.push(d)
  return dias
}
export const fechaCorta = (iso) =>
  aFecha(iso).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })

/* ---------- Nafta ---------- */

// Consumo real con el método de tanque a tanque: km entre la primera y la última
// carga, dividido los litros cargados después de la primera.
export function rendimiento(cargas, ajustes) {
  const ord = cargas
    .filter((c) => num(c.kmOdometro) > 0)
    .sort((a, b) => num(a.kmOdometro) - num(b.kmOdometro))
  if (ord.length >= 2) {
    const km = num(ord.at(-1).kmOdometro) - num(ord[0].kmOdometro)
    const litros = ord.slice(1).reduce((s, c) => s + num(c.litros), 0)
    if (km > 0 && litros > 0) return { kmPorLitro: km / litros, fuente: 'real' }
  }
  const manual = num(ajustes?.kmPorLitroManual)
  if (manual > 0) return { kmPorLitro: manual, fuente: 'manual' }
  return { kmPorLitro: null, fuente: null }
}

// Precio por litro de la última carga hecha hasta esa fecha.
export function precioLitroEn(cargas, iso) {
  const validas = cargas
    .filter((c) => num(c.litros) > 0 && num(c.monto) > 0)
    .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0))
  if (!validas.length) return null
  let elegida = validas[0]
  for (const c of validas) if (c.fecha <= iso) elegida = c
  return num(elegida.monto) / num(elegida.litros)
}

export function crearContexto(cargas, ajustes) {
  const rend = rendimiento(cargas, ajustes)
  const costoKm = (iso) => {
    const precio = precioLitroEn(cargas, iso)
    return precio && rend.kmPorLitro ? precio / rend.kmPorLitro : 0
  }
  return { rend, costoKm }
}

/* ---------- Jornadas ---------- */

export function calcularJornada(j, ctx) {
  const km = Math.max(0, num(j.kmFin) - num(j.kmInicio))
  const efectivo = num(j.efectivo)
  const app = num(j.app)
  const propinas = num(j.propinas)
  const peajes = num(j.peajes)
  const horas = num(j.horas)
  const ingresos = efectivo + app + propinas
  const nafta = km * ctx.costoKm(j.fecha || hoyISO())
  const ganancia = ingresos - peajes - nafta
  return {
    km, efectivo, app, propinas, peajes, horas, ingresos, nafta, ganancia,
    porHora: horas > 0 ? ganancia / horas : 0,
  }
}

export function totalizar(jornadas, ctx) {
  const t = { km: 0, efectivo: 0, app: 0, propinas: 0, peajes: 0, horas: 0, ingresos: 0, nafta: 0, ganancia: 0 }
  for (const j of jornadas) {
    const r = calcularJornada(j, ctx)
    for (const k of Object.keys(t)) t[k] += r[k]
  }
  return {
    ...t,
    cantidad: jornadas.length,
    gastos: t.nafta + t.peajes,
    porHora: t.horas > 0 ? t.ganancia / t.horas : 0,
  }
}

/* ---------- Mejor horario ---------- */

export const FRANJAS = ['Mañana', 'Tarde', 'Noche', 'Madrugada']
export function franja(hora) {
  if (!hora) return null
  const h = Number(hora.split(':')[0])
  if (h < 6) return 'Madrugada'
  if (h < 12) return 'Mañana'
  if (h < 18) return 'Tarde'
  return 'Noche'
}

export function mejorHorario(jornadas, ctx) {
  const porDia = DIAS.map((nombre) => ({ nombre, ganancia: 0, horas: 0 }))
  const porFranja = FRANJAS.map((nombre) => ({ nombre, ganancia: 0, horas: 0 }))
  for (const j of jornadas) {
    const r = calcularJornada(j, ctx)
    if (r.horas <= 0) continue
    const d = porDia[diaSemana(j.fecha)]
    d.ganancia += r.ganancia
    d.horas += r.horas
    const f = porFranja.find((x) => x.nombre === franja(j.horaInicio))
    if (f) {
      f.ganancia += r.ganancia
      f.horas += r.horas
    }
  }
  const cerrar = (arr) => arr.map((x) => ({ ...x, porHora: x.horas > 0 ? x.ganancia / x.horas : 0 }))
  return { porDia: cerrar(porDia), porFranja: cerrar(porFranja) }
}

/* ---------- Kilometraje, uso personal y mantenimiento ---------- */

function lecturas(jornadas, cargas) {
  return [
    ...jornadas.flatMap((j) => [num(j.kmInicio), num(j.kmFin)]),
    ...cargas.map((c) => num(c.kmOdometro)),
  ].filter((v) => v > 0)
}

export const kmActual = (jornadas, cargas) => Math.max(0, ...lecturas(jornadas, cargas))

export function usoPersonal(jornadas, cargas, ctx) {
  const l = lecturas(jornadas, cargas)
  if (l.length < 2) return null
  const total = Math.max(...l) - Math.min(...l)
  const trabajo = jornadas.reduce((s, j) => s + Math.max(0, num(j.kmFin) - num(j.kmInicio)), 0)
  const personal = Math.max(0, total - trabajo)
  return { total, trabajo, personal, costo: personal * ctx.costoKm(hoyISO()) }
}

export function estadoMantenimiento(ajustes, km) {
  return [
    { clave: 'Service', nombre: 'Service', ultimo: ajustes.kmUltimoService, intervalo: ajustes.intervaloService },
    { clave: 'Aceite', nombre: 'Cambio de aceite', ultimo: ajustes.kmUltimoAceite, intervalo: ajustes.intervaloAceite },
  ].map((m) => {
    const ultimo = num(m.ultimo)
    const intervalo = num(m.intervalo)
    if (!ultimo || !intervalo) return { ...m, configurado: false }
    const proximo = ultimo + intervalo
    const faltan = proximo - km
    const estado = faltan <= 0 ? 'vencido' : faltan <= 1000 ? 'pronto' : 'ok'
    return { ...m, configurado: true, proximo, faltan, estado }
  })
}

/* ---------- Estaciones ---------- */

export function resumenEstaciones(cargas) {
  const mapa = new Map()
  for (const c of cargas) {
    const nombre = (c.estacion || '').trim()
    if (!nombre) continue
    const e = mapa.get(nombre.toLowerCase()) ?? { nombre, veces: 0, litros: 0, monto: 0 }
    e.veces += 1
    e.litros += num(c.litros)
    e.monto += num(c.monto)
    mapa.set(nombre.toLowerCase(), e)
  }
  return [...mapa.values()]
    .map((e) => ({ ...e, precioLitro: e.litros > 0 ? e.monto / e.litros : 0 }))
    .sort((a, b) => b.veces - a.veces)
}
