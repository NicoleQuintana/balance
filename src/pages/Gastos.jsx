import { useState } from 'react'
import { Segmentos } from '../components/ui'
import FormNafta from './FormNafta'
import FormGasto from './FormGasto'

// Pestaña "Gastos": nafta o gastos del auto (service, aceite, repuestos…).
export default function Gastos({ edicion, cargas, kmAct, onGuardar, onCancelar }) {
  const [tipo, setTipo] = useState(edicion?.tipo === 'gasto' ? 'gasto' : 'nafta')
  const inicial = edicion?.tipo === tipo ? edicion.datos : null
  const editando = Boolean(edicion)

  return (
    <section className="pagina">
      <header className="cabecera">
        <h1>{editando ? 'Editar gasto' : 'Cargar gasto'}</h1>
        <p className="tenue">
          {tipo === 'nafta' ? 'Los datos están en el ticket.' : 'Service, aceite, repuestos o lo que le hagas al auto.'}
        </p>
      </header>

      {!editando && (
        <Segmentos
          opciones={[{ valor: 'nafta', etiqueta: 'Nafta' }, { valor: 'gasto', etiqueta: 'Auto' }]}
          valor={tipo}
          onCambio={setTipo}
        />
      )}

      {tipo === 'nafta' ? (
        <FormNafta key={inicial?.id ?? 'nueva'} inicial={inicial} cargas={cargas} kmAct={kmAct}
          onGuardar={onGuardar('nafta')} onCancelar={onCancelar} />
      ) : (
        <FormGasto key={inicial?.id ?? 'nuevo'} inicial={inicial} kmAct={kmAct}
          onGuardar={onGuardar('gasto')} onCancelar={onCancelar} />
      )}
    </section>
  )
}
