# Balance Uber/Didi

Web app para el celu (PWA) para registrar lo que gano y lo que gasto haciendo Uber y Didi.
React + Vite, Firebase (datos y login) y Recharts (gráficos).

## Probarla ya, sin instalar nada (StackBlitz)

1. Descomprimí el zip.
2. En GitHub, creá un repositorio nuevo (por ejemplo `balance-uber`), tocá **"uploading an existing file"**
   y arrastrá **el contenido** de la carpeta (no la carpeta entera). Confirmá con **Commit changes**.
3. Abrí `https://stackblitz.com/github/TU_USUARIO/balance-uber`. Instala todo solo y te muestra la app.

Sin configurar Firebase, la app arranca en **modo local**: guarda los datos solo en ese navegador.
Sirve para probarla y ajustar cosas; para usarla de verdad en el iPhone, configurá Firebase.

## Pasarla a Firebase (datos en la nube y login con Google)

1. En la consola de Firebase, creá el proyecto y activá **Firestore** y **Authentication → Google**.
2. Registrá una app web y copiá los valores de configuración.
3. Copiá `.env.example` como `.env` y completalo (en Vercel, cargalos en **Environment Variables**).
4. En **Firestore → Reglas**, pegá el contenido de `firestore.rules`.
5. En **Authentication → Settings → Dominios autorizados**, agregá la dirección de Vercel.

Apenas hay datos de Firebase, la app pide entrar con Google y guarda todo en la nube, también sin señal
(se sincroniza sola cuando vuelve internet).

## Publicarla (Vercel)

En vercel.com → **Add New Project** → elegí el repositorio → cargá las variables del `.env` → **Deploy**.
Cada cambio que subas a GitHub se publica solo.

## Logos

Poné los archivos en `public/logos/uber.png` y `public/logos/didi.png`. Si no están, la app muestra
el nombre con el color de cada plataforma.

## Qué hace

- **Jornada:** plataforma, fecha, hora de inicio, horas, cuentakilómetros al arrancar y al terminar,
  cobro en efectivo y por app/tarjeta, propinas y peajes. Calcula la nafta usada y la ganancia limpia.
- **Nafta:** fecha, litros, monto, cuentakilómetros y estación (opcional). Con dos cargas calcula
  el consumo real del auto (km/l) y el costo por km.
- **Inicio:** ganancia de la semana, meta semanal, avisos de service y cambio de aceite, últimos registros
  (con editar y borrar).
- **Reportes:** semana o mes, con ganancia por día, ingresos y gastos, Uber vs. Didi, mejor horario,
  uso personal del auto y estaciones.
- **Ajustes:** meta, consumo estimado, mantenimiento y exportar a Excel.

## Pendiente

- **Recordatorio a la noche (notificación):** necesita una función programada que mande el aviso
  (por ejemplo, un cron de Vercel + Firebase Cloud Messaging). Queda para la segunda etapa.

## Estructura

```
src/
  lib/calc.js      cálculos (ganancia, consumo, reportes, mantenimiento)
  lib/store.js     datos: Firebase o modo local
  lib/firebase.js  conexión con Firebase
  lib/exportar.js  Excel
  pages/           Inicio, FormJornada, FormNafta, Reportes, Ajustes
  components/ui.jsx
```
