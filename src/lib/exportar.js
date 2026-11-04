import { calcularJornada, hoyISO, num } from './calc'

const porFecha = (a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0)

export async function exportarExcel(jornadas, cargas, ctx) {
  const XLSX = await import('xlsx')

  const filasJornadas = [...jornadas].sort(porFecha).map((j) => {
    const r = calcularJornada(j, ctx)
    return {
      Fecha: j.fecha,
      Plataforma: j.plataforma,
      'Hora de inicio': j.horaInicio || '',
      Horas: r.horas,
      'Km inicio': num(j.kmInicio),
      'Km fin': num(j.kmFin),
      'Km trabajados': r.km,
      Efectivo: r.efectivo,
      'App / tarjeta': r.app,
      Propinas: r.propinas,
      Peajes: r.peajes,
      'Nafta (estimada)': Math.round(r.nafta),
      'Ganancia limpia': Math.round(r.ganancia),
      'Ganancia por hora': Math.round(r.porHora),
    }
  })

  const filasNafta = [...cargas].sort(porFecha).map((c) => ({
    Fecha: c.fecha,
    Estación: c.estacion || '',
    Litros: num(c.litros),
    Monto: num(c.monto),
    'Precio por litro': num(c.litros) > 0 ? Math.round(num(c.monto) / num(c.litros)) : '',
    Cuentakilómetros: num(c.kmOdometro),
  }))

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(filasJornadas), 'Jornadas')
  XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(filasNafta), 'Nafta')
  XLSX.writeFile(libro, `balance-${hoyISO()}.xlsx`)
}
