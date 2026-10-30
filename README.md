# Sistema de Inventarios – Frontend

Angular 21 + Angular Material. Consume la API de `../SistemaInventarioSolution`.

## Cómo ejecutarlo

1. Iniciar la API en Visual Studio (F5).
2. En esta carpeta:
   ```
   npm install
   npm start
   ```
3. Abrir http://localhost:4200 e ingresar con **admin@inventario.com / Admin123!**

### Conexión con la API

Angular no llama directo al puerto de la API: todo lo que empieza con `/api` lo redirige el **proxy**
(`proxy.conf.js`). Así no hay problemas de CORS.

- Por defecto apunta a `https://localhost:44329` (perfil **IIS Express** de Visual Studio).
- Si la API se ejecuta con el perfil **http**, cambiar en `proxy.conf.js` a `http://localhost:5191`
  (o ver el puerto en la ventana de la API y ponerlo ahí). Hay que reiniciar `npm start` después del cambio.

## Estructura

```
src/app/
├── core/                       Lo que usa toda la aplicación
│   ├── models/modelos.ts       Interfaces con la misma forma que los DTOs de la API
│   ├── services/
│   │   ├── api.service.ts      Única puerta hacia la API (get, post, put, patch, delete)
│   │   ├── auth.service.ts     Sesión, permisos y almacén actual (se guardan en localStorage)
│   │   └── notificacion.service.ts  Mensajes de éxito y error
│   ├── interceptors/error.interceptor.ts   Muestra el mensaje de error que devuelve la API (los THROW de los SP)
│   ├── guards/auth.guard.ts    No deja entrar sin sesión ni a pantallas sin permiso
│   ├── pipes/formato.pipes.ts  | moneda (Q1,250.00), | numero, | fecha
│   └── menu.ts                 Opciones del menú y el permiso que necesita cada una
├── layout/                     Menú lateral + barra superior (almacén actual y usuario)
├── shared/
│   ├── mantenimiento/          CRUD genérico: tabla + búsqueda + formulario en diálogo
│   ├── buscador-producto/      Autocompletar de productos (código o nombre, muestra existencia)
│   ├── confirmar-dialog/       Confirmaciones (desactivar, anular, rechazar...)
│   └── exportar-csv.ts         Exportar tablas a Excel
└── pages/
    ├── login/
    ├── dashboard/              Indicadores, ventas de 7 días, más vendidos y stock bajo
    ├── mantenimientos/configuraciones.ts   Columnas y campos de los 13 mantenimientos
    ├── catalogos/productos-almacen/        Qué productos maneja cada almacén (tabla InventarioAlmacen)
    ├── seguridad/rol-permisos/             Matriz de permisos por rol (tabla RolPermiso)
    ├── movimientos/
    │   ├── ventas-compras/     Módulos Ventas y Compras: listado, totales del período y "Nueva" en un modal
    │   ├── documento-form/     Formulario de venta, compra, notas y ajustes (página o modal, un solo componente)
    │   ├── documentos/         Historial de documentos, detalle y anulación
    │   ├── ordenes-compra/     Listado, detalle, cancelar y recibir
    │   ├── orden-compra-form/  Crear y editar órdenes
    │   ├── transferencias/     Por recibir / enviadas, recibir y rechazar
    │   └── transferencia-form/
    └── reportes/
        ├── existencias/        Existencias por almacén, alertas y límites de stock
        ├── kardex/             Historial de un producto con saldos
        └── movimientos/        Registro de entradas y salidas
```

## Mantenimientos

Los 13 mantenimientos (productos, categorías, unidades, clientes, proveedores, almacenes, motivos, usuarios,
roles, permisos, parámetros, correlativos y tipos de transacción) usan **el mismo componente**
`shared/mantenimiento`. Cada uno solo se describe en `pages/mantenimientos/configuraciones.ts`:

```ts
const categorias: ConfigMantenimiento = {
  titulo: 'Categorías',
  url: 'Categorias',              // ruta de la API
  id: 'ID_Categoria',
  estado: 'put',                  // cómo se reactiva
  columnas: [ { campo: 'NombreCategoria', titulo: 'Nombre' }, { campo: 'Estado', titulo: 'Estado', tipo: 'estado' } ],
  campos:   [ { nombre: 'NombreCategoria', etiqueta: 'Nombre', tipo: 'texto', requerido: true, maxLength: 100 } ],
  ...
};
```

Para agregar un mantenimiento nuevo: crear su configuración, agregar la ruta en `app.routes.ts` y la opción en `core/menu.ts`.

## Permisos y menú

Al iniciar sesión la API devuelve los permisos del rol. El menú solo muestra las opciones permitidas y las rutas
están protegidas con `permisoGuard`:

| Permiso | Opciones |
|---|---|
| VENTAS | Ventas (listado y nueva venta), notas a clientes |
| COMPRAS | Compras (listado y nueva compra), órdenes de compra, notas de proveedores |
| AJUSTES | Ajustes de inventario |
| TRANSFERENCIAS | Transferencias |
| REPORTES | Existencias, kardex, entradas y salidas; también ve los listados de Ventas y Compras |
| CATALOGOS | Productos, productos por almacén, categorías, unidades, clientes, proveedores, almacenes, motivos |
| SEGURIDAD | Usuarios, roles, permisos, roles y permisos |
| CONFIGURACION | Parámetros, correlativos, tipos de transacción |

## Almacén actual

El selector de la barra superior define en qué almacén se registran los movimientos. El Administrador ve todos los
almacenes; los demás usuarios solo los que tienen asignados en Seguridad → Usuarios.
