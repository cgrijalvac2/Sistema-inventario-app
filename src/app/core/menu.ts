// Opciones del menú lateral. Cada opción indica qué permisos la muestran
// (los permisos vienen del login y se asignan a cada rol en Seguridad > Roles)
export interface OpcionMenu {
  texto: string;
  icono: string;
  ruta: string;
  permisos: string[];
}

export interface SeccionMenu {
  titulo: string;
  opciones: OpcionMenu[];
}

export const MENU: SeccionMenu[] = [
  {
    titulo: 'Principal',
    opciones: [
      { texto: 'Inicio', icono: 'space_dashboard', ruta: '/inicio', permisos: [] },
    ]
  },
  {
    titulo: 'Movimientos',
    opciones: [
      { texto: 'Ventas', icono: 'point_of_sale', ruta: '/movimientos/ventas', permisos: ['VENTAS', 'REPORTES'] },
      { texto: 'Compras', icono: 'shopping_cart', ruta: '/movimientos/compras', permisos: ['COMPRAS', 'REPORTES'] },
      { texto: 'Órdenes de compra', icono: 'assignment', ruta: '/movimientos/ordenes-compra', permisos: ['COMPRAS'] },
      { texto: 'Notas a clientes', icono: 'receipt_long', ruta: '/movimientos/notas-clientes', permisos: ['VENTAS'] },
      { texto: 'Notas de proveedores', icono: 'request_quote', ruta: '/movimientos/notas-proveedores', permisos: ['COMPRAS'] },
      { texto: 'Ajustes de inventario', icono: 'tune', ruta: '/movimientos/ajuste', permisos: ['AJUSTES'] },
      { texto: 'Transferencias', icono: 'local_shipping', ruta: '/movimientos/transferencias', permisos: ['TRANSFERENCIAS'] },
      { texto: 'Documentos', icono: 'folder_open', ruta: '/movimientos/documentos', permisos: ['VENTAS', 'COMPRAS', 'AJUSTES', 'REPORTES'] },
    ]
  },
  {
    titulo: 'Consultas y reportes',
    opciones: [
      { texto: 'Existencias', icono: 'inventory', ruta: '/reportes/existencias', permisos: ['REPORTES'] },
      { texto: 'Reportería general', icono: 'timeline', ruta: '/reportes/kardex', permisos: ['REPORTES'] },
      { texto: 'Entradas y salidas', icono: 'swap_vert', ruta: '/reportes/movimientos', permisos: ['REPORTES'] },
    ]
  },
  {
    titulo: 'Catálogos',
    opciones: [
      { texto: 'Productos', icono: 'inventory_2', ruta: '/catalogos/productos', permisos: ['CATALOGOS'] },
      { texto: 'Productos por almacén', icono: 'add_business', ruta: '/catalogos/productos-almacen', permisos: ['CATALOGOS'] },
      { texto: 'Categorías', icono: 'category', ruta: '/catalogos/categorias', permisos: ['CATALOGOS'] },
      { texto: 'Unidades de medida', icono: 'straighten', ruta: '/catalogos/unidades', permisos: ['CATALOGOS'] },
      { texto: 'Clientes', icono: 'groups', ruta: '/catalogos/clientes', permisos: ['CATALOGOS'] },
      { texto: 'Proveedores', icono: 'storefront', ruta: '/catalogos/proveedores', permisos: ['CATALOGOS'] },
      { texto: 'Almacenes', icono: 'warehouse', ruta: '/catalogos/almacenes', permisos: ['CATALOGOS'] },
      { texto: 'Motivos de ajuste', icono: 'label', ruta: '/catalogos/motivos', permisos: ['CATALOGOS'] },
    ]
  },
  {
    titulo: 'Seguridad',
    opciones: [
      { texto: 'Usuarios', icono: 'manage_accounts', ruta: '/seguridad/usuarios', permisos: ['SEGURIDAD'] },
      { texto: 'Roles', icono: 'admin_panel_settings', ruta: '/seguridad/roles', permisos: ['SEGURIDAD'] },
      { texto: 'Permisos', icono: 'key', ruta: '/seguridad/permisos', permisos: ['SEGURIDAD'] },
      { texto: 'Roles y permisos', icono: 'rule_settings', ruta: '/seguridad/rol-permisos', permisos: ['SEGURIDAD'] },
    ]
  },
  {
    titulo: 'Configuración',
    opciones: [
      { texto: 'Parámetros del sistema', icono: 'settings', ruta: '/configuracion/parametros', permisos: ['CONFIGURACION'] },
      { texto: 'Correlativos', icono: 'pin', ruta: '/configuracion/correlativos', permisos: ['CONFIGURACION'] },
      { texto: 'Tipos de transacción', icono: 'rule', ruta: '/configuracion/tipos-transaccion', permisos: ['CONFIGURACION'] },
    ]
  },
];
