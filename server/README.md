# Hidrocampo — servidor en Hostinger (MySQL)

Este servidor conecta la app Hidrocampo con una base de datos MySQL,
pensado para desplegarse en el hosting de Hostinger (plan Unlimited o
superior, con la funcion "Node.js Web Apps"). Tambien puede correr en
cualquier otro hosting que soporte Node.js + MySQL, o en tu propia
laptop para pruebas.

**Importante:** las sesiones de inicio de sesion se guardan en memoria
del servidor -- si el hosting reinicia la app (Hostinger a veces lo hace
por inactividad), todos tendran que volver a iniciar sesion. Para un uso
mas serio a futuro, esto se puede cambiar a sesiones persistentes (tarea
para el ingeniero de sistemas).

## Paso 1 -- Crear la base de datos MySQL en Hostinger

1. En hPanel, ve a **Bases de datos > Bases de datos MySQL**.
2. Crea una base de datos nueva (anota el nombre que te da Hostinger,
   suele venir con un prefijo como `u123456789_hidrocampo`).
3. Crea un usuario para esa base (anota usuario y contrasena) y
   asignalo con todos los privilegios sobre la base que creaste.
4. Anota tambien el **host** de la base de datos -- en Hostinger casi
   siempre es `localhost` si tu app y tu base de datos estan en el mismo
   plan, pero confirmalo en la misma pantalla de hPanel.

## Paso 2 -- Crear las tablas

1. En hPanel, abre **phpMyAdmin** (esta en la misma seccion de Bases de
   datos) y entra a la base de datos que creaste.
2. Ve a la pestana **SQL** y pega el contenido del archivo `schema.sql`
   (incluido aqui) -- pero **antes de ejecutarlo**, borra o comenta las
   dos primeras lineas (`CREATE DATABASE ...` y `USE hidrocampo;`),
   porque Hostinger ya te dio la base de datos con su propio nombre; solo
   necesitas las sentencias `CREATE TABLE` de ahi para abajo.
3. Ejecuta (botón "Continuar" / "Go"). Deberian aparecer 5 tablas:
   `Usuarios`, `Pozos`, `Manantiales`, `CalidadAgua`, `PuntosGeologicos`.

## Paso 3 -- Desplegar la aplicacion Node.js

En hPanel, ve a **Sitios web > Node.js** (o el boton "Empezar ya" que
viste en la pantalla de apps Node.js):

- **Opcion A -- GitHub (recomendada, se actualiza sola):** conecta el
  repositorio donde subes Hidrocampo. Importante: sube TODA la carpeta
  `hidrocampo-server/` a GitHub (no solo el `index.html`), porque esta
  carpeta es la aplicacion Node.js real (tiene `package.json`,
  `server.js`, etc.) -- el `index.html` solo debe ir en el archivo
  `hidrocampo-web.zip`, en un repositorio o carpeta *distinta*, para
  GitHub Pages.
- **Opcion B -- Subir ZIP:** comprime el contenido de esta carpeta
  (`hidrocampo-server`, con `package.json` en la raiz del zip, no dentro
  de una subcarpeta) y subelo con "Subir archivos de la app".

## Paso 4 -- Variables de entorno

En la configuracion de la app Node.js dentro de hPanel, busca la seccion
de variables de entorno y agrega (con tus datos reales del Paso 1):

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u123456789_hidrocampo
DB_USER=u123456789_hidrocampo_app
DB_PASSWORD=tu_clave_real
```

Y si quieres usar las funciones de IA del boton Inteligencia:

```
ANTHROPIC_API_KEY=tu_clave_de_console.anthropic.com
```

Hostinger asigna el puerto (`PORT`) automaticamente para estas apps,
normalmente no hace falta que lo configures tu.

## Paso 5 -- Iniciar y probar

Dale a "Deploy" / "Desplegar". Cuando el estado diga "Running", copia la
URL que te da Hostinger para tu app.

En la app Hidrocampo, ve a **Cuenta** -> elige **"Servidor local (mi
red)"** (el nombre quedo asi de una version anterior, pero funciona
igual para cualquier servidor propio, incluido este de Hostinger) ->
pon la URL que te dio Hostinger -> "Guardar y conectar" -> crea tu
cuenta con correo y contrasena, y ya puedes capturar y sincronizar.

## Sobre Power BI

Power BI Desktop tiene un conector nativo para MySQL ("Obtener datos" >
"Base de datos MySQL"). Como cada tipo de punto vive en su propia tabla
con columnas reales (`Pozos`, `Manantiales`, `CalidadAgua`,
`PuntosGeologicos`), puedes conectarte directo sin transformar nada.

## Nota tecnica: de SQL Server a MySQL

Este servidor originalmente se penso para SQL Server (uso en red local
con Windows). Se adapto completo a MySQL para que funcione en Hostinger:
otra libreria de conexion (`mysql2` en vez de `mssql`), otra sintaxis
SQL, y una columna renombrada (`Precision` -> `GpsPrecision`, porque
`Precision` es una palabra reservada en MySQL). Se probo de punta a
punta contra una base MySQL real antes de entregarse -- registro,
login, guardado de los 4 tipos de punto, y cambio de contrasena.
