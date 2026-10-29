import { ConfigMantenimiento } from '../../shared/mantenimiento/mantenimiento.models';

// Cada mantenimiento se describe aquí: columnas de la tabla y campos del formulario.
// El componente shared/mantenimiento hace el resto (listar, crear, editar, activar/desactivar).

const productos: ConfigMantenimiento = {
  titulo: 'Productos',
  subtitulo: 'Catálogo de productos, precios y costo promedio',
  icono: 'inventory_2',
  url: 'Productos',
  id: 'ID_Producto',
  nombreSingular: 'producto',
  estado: 'patch',
  busqueda: ['CodigoProducto', 'NombreProducto', 'NombreCategoria'],
  columnas: [
    { campo: 'CodigoProducto', titulo: 'Código', destacado: true },
    { campo: 'NombreProducto', titulo: 'Producto' },
    { campo: 'NombreCategoria', titulo: 'Categoría' },
    { campo: 'UnidadMedida', titulo: 'Unidad' },
    { campo: 'Costo', titulo: 'Costo prom.', tipo: 'moneda' },
    { campo: 'Precio', titulo: 'Precio', tipo: 'moneda' },
    { campo: 'StockTotal', titulo: 'Existencia', tipo: 'numero' },
    { campo: 'Estado', titulo: 'Estado', tipo: 'estado' },
  ],
  campos: [
    { nombre: 'CodigoProducto', etiqueta: 'Código', tipo: 'texto', requerido: true, maxLength: 50, mayusculas: true },
    { nombre: 'NombreProducto', etiqueta: 'Nombre', tipo: 'texto', requerido: true, maxLength: 150 },
    { nombre: 'ID_Categoria', etiqueta: 'Categoría', tipo: 'select', requerido: true,
      opciones: { url: 'Categorias?soloActivos=true', valor: 'ID_Categoria', texto: 'NombreCategoria' } },
    { nombre: 'ID_UnidadMedida', etiqueta: 'Unidad de medida', tipo: 'select', requerido: true,
      opciones: { url: 'UnidadesMedida?soloActivos=true', valor: 'ID_UnidadMedida', texto: 'Nombre' } },
    { nombre: 'Costo', etiqueta: 'Costo inicial', tipo: 'decimal', soloCrear: true, valorDefecto: 0,
      ayuda: 'Después lo recalculan las compras (costo promedio)' },
    { nombre: 'Precio', etiqueta: 'Precio de venta', tipo: 'decimal', requerido: true, valorDefecto: 0 },
    { nombre: 'Descripcion', etiqueta: 'Descripción', tipo: 'textarea', maxLength: 255 },
  ],
};

const categorias: ConfigMantenimiento = {
  titulo: 'Categorías',
  subtitulo: 'Agrupación de los productos',
  icono: 'category',
  url: 'Categorias',
  id: 'ID_Categoria',
  nombreSingular: 'categoría',
  estado: 'put',
  anchoDialogo: '520px',
  busqueda: ['NombreCategoria', 'DescripcionCategoria'],
  columnas: [
    { campo: 'NombreCategoria', titulo: 'Nombre', destacado: true },
    { campo: 'DescripcionCategoria', titulo: 'Descripción' },
    { campo: 'Estado', titulo: 'Estado', tipo: 'estado' },
  ],
  campos: [
    { nombre: 'NombreCategoria', etiqueta: 'Nombre', tipo: 'texto', requerido: true, maxLength: 100, ancho: 'completo' },
    { nombre: 'DescripcionCategoria', etiqueta: 'Descripción', tipo: 'textarea', maxLength: 255 },
  ],
};

const unidades: ConfigMantenimiento = {
  titulo: 'Unidades de medida',
  subtitulo: 'Unidad, caja, libra, galón...',
  icono: 'straighten',
  url: 'UnidadesMedida',
  id: 'ID_UnidadMedida',
  nombreSingular: 'unidad de medida',
  estado: 'put',
  anchoDialogo: '520px',
  busqueda: ['Nombre', 'Abreviatura'],
  columnas: [
    { campo: 'Nombre', titulo: 'Nombre', destacado: true },
    { campo: 'Abreviatura', titulo: 'Abreviatura' },
    { campo: 'Estado', titulo: 'Estado', tipo: 'estado' },
  ],
  campos: [
    { nombre: 'Nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, maxLength: 50 },
    { nombre: 'Abreviatura', etiqueta: 'Abreviatura', tipo: 'texto', requerido: true, maxLength: 10, mayusculas: true },
  ],
};

const clientes: ConfigMantenimiento = {
  titulo: 'Clientes',
  subtitulo: 'Personas y empresas a las que se vende',
  icono: 'groups',
  url: 'Clientes',
  id: 'ID_Cliente',
  nombreSingular: 'cliente',
  estado: 'patch',
  busqueda: ['Nombre', 'NIT', 'Telefono', 'CorreoElectronico'],
  columnas: [
    { campo: 'Nombre', titulo: 'Nombre', destacado: true },
    { campo: 'NIT', titulo: 'NIT' },
    { campo: 'Telefono', titulo: 'Teléfono' },
    { campo: 'CorreoElectronico', titulo: 'Correo' },
    { campo: 'Estado', titulo: 'Estado', tipo: 'estado' },
  ],
  campos: [
    { nombre: 'Nombre', etiqueta: 'Nombre o razón social', tipo: 'texto', requerido: true, maxLength: 150, ancho: 'completo' },
    { nombre: 'NIT', etiqueta: 'NIT', tipo: 'texto', requerido: true, maxLength: 20, mayusculas: true, valorDefecto: 'CF',
      ayuda: 'CF = consumidor final' },
    { nombre: 'Telefono', etiqueta: 'Teléfono', tipo: 'texto', maxLength: 50 },
    { nombre: 'CorreoElectronico', etiqueta: 'Correo electrónico', tipo: 'email', maxLength: 100, ancho: 'completo' },
    { nombre: 'Direccion', etiqueta: 'Dirección', tipo: 'textarea', maxLength: 255 },
  ],
};

const proveedores: ConfigMantenimiento = {
  titulo: 'Proveedores',
  subtitulo: 'Empresas a las que se compra',
  icono: 'storefront',
  url: 'Proveedores',
  id: 'ID_Proveedor',
  nombreSingular: 'proveedor',
  estado: 'patch',
  busqueda: ['Nombre', 'NIT', 'Telefono', 'CorreoElectronico'],
  columnas: [
    { campo: 'Nombre', titulo: 'Nombre', destacado: true },
    { campo: 'NIT', titulo: 'NIT' },
    { campo: 'Telefono', titulo: 'Teléfono' },
    { campo: 'CorreoElectronico', titulo: 'Correo' },
    { campo: 'DiasCredito', titulo: 'Días crédito', tipo: 'numero' },
    { campo: 'Estado', titulo: 'Estado', tipo: 'estado' },
  ],
  campos: [
    { nombre: 'Nombre', etiqueta: 'Nombre o razón social', tipo: 'texto', requerido: true, maxLength: 150, ancho: 'completo' },
    { nombre: 'NIT', etiqueta: 'NIT', tipo: 'texto', requerido: true, maxLength: 20, mayusculas: true },
    { nombre: 'DiasCredito', etiqueta: 'Días de crédito', tipo: 'numero', valorDefecto: 0 },
    { nombre: 'Telefono', etiqueta: 'Teléfono', tipo: 'texto', maxLength: 50 },
    { nombre: 'CorreoElectronico', etiqueta: 'Correo electrónico', tipo: 'email', maxLength: 100 },
    { nombre: 'Direccion', etiqueta: 'Dirección', tipo: 'textarea', maxLength: 255 },
  ],
};

const almacenes: ConfigMantenimiento = {
  titulo: 'Almacenes',
  subtitulo: 'Bodegas y sucursales donde se guarda la mercadería',
  icono: 'warehouse',
  url: 'Almacenes',
  id: 'ID_Almacen',
  nombreSingular: 'almacén',
  estado: 'put',
  busqueda: ['Codigo', 'Nombre', 'Direccion'],
  columnas: [
    { campo: 'Codigo', titulo: 'Código', destacado: true },
    { campo: 'Nombre', titulo: 'Nombre' },
    { campo: 'Direccion', titulo: 'Dirección' },
    { campo: 'Estado', titulo: 'Estado', tipo: 'estado' },
  ],
  campos: [
    { nombre: 'Codigo', etiqueta: 'Código', tipo: 'texto', requerido: true, maxLength: 20, mayusculas: true },
    { nombre: 'Nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, maxLength: 100 },
    { nombre: 'Direccion', etiqueta: 'Dirección', tipo: 'texto', maxLength: 255, ancho: 'completo' },
    { nombre: 'Descripcion', etiqueta: 'Descripción', tipo: 'textarea', maxLength: 255 },
  ],
};

const motivos: ConfigMantenimiento = {
  titulo: 'Motivos de ajuste',
  subtitulo: 'Razones para ajustar el inventario (vencido, dañado, conteo...)',
  icono: 'label',
  url: 'MotivosAjuste',
  id: 'ID_Motivo',
  nombreSingular: 'motivo',
  estado: 'put',
  anchoDialogo: '480px',
  busqueda: ['Descripcion'],
  columnas: [
    { campo: 'Descripcion', titulo: 'Descripción', destacado: true },
    { campo: 'Estado', titulo: 'Estado', tipo: 'estado' },
  ],
  campos: [
    { nombre: 'Descripcion', etiqueta: 'Descripción', tipo: 'texto', requerido: true, maxLength: 100, ancho: 'completo' },
  ],
};

const usuarios: ConfigMantenimiento = {
  titulo: 'Usuarios',
  subtitulo: 'Personas que pueden entrar al sistema, su rol y sus almacenes',
  icono: 'manage_accounts',
  url: 'Usuarios',
  id: 'ID_Usuario',
  nombreSingular: 'usuario',
  estado: 'patch',
  busqueda: ['NombreCompleto', 'CorreoElectronico', 'NombreRol'],
  columnas: [
    { campo: 'NombreCompleto', titulo: 'Nombre', destacado: true },
    { campo: 'CorreoElectronico', titulo: 'Correo' },
    { campo: 'NombreRol', titulo: 'Rol', tipo: 'chip', clase: () => 'info' },
    { campo: 'Almacenes', titulo: 'Almacenes', tipo: 'lista', listaCampo: 'Nombre' },
    { campo: 'UltimoAcceso', titulo: 'Último acceso', tipo: 'fecha' },
    { campo: 'Estado', titulo: 'Estado', tipo: 'estado' },
  ],
  campos: [
    { nombre: 'NombreCompleto', etiqueta: 'Nombre completo', tipo: 'texto', requerido: true, maxLength: 150, ancho: 'completo' },
    { nombre: 'CorreoElectronico', etiqueta: 'Correo electrónico', tipo: 'email', requerido: true, maxLength: 100 },
    { nombre: 'Password', etiqueta: 'Contraseña', tipo: 'password', requeridoAlCrear: true, minLength: 8,
      ayuda: 'Mínimo 8 caracteres. Al editar, déjela vacía para no cambiarla' },
    { nombre: 'ID_Rol', etiqueta: 'Rol', tipo: 'select', requerido: true,
      opciones: { url: 'Roles', valor: 'ID_Rol', texto: 'NombreRol' } },
    { nombre: 'Almacenes', etiqueta: 'Almacenes asignados', tipo: 'multiselect',
      opciones: { url: 'Almacenes?soloActivos=true', valor: 'ID_Almacen', texto: 'Nombre' },
      valorInicial: fila => (fila.Almacenes ?? []).map((a: any) => a.ID_Almacen),
      ayuda: 'El Administrador puede trabajar en todos aunque no se le asignen' },
  ],
};

const roles: ConfigMantenimiento = {
  titulo: 'Roles',
  subtitulo: 'Perfiles de acceso y las opciones del menú que puede usar cada uno',
  icono: 'admin_panel_settings',
  url: 'Roles',
  id: 'ID_Rol',
  nombreSingular: 'rol',
  estado: 'patch',
  busqueda: ['NombreRol', 'Descripcion'],
  columnas: [
    { campo: 'NombreRol', titulo: 'Rol', destacado: true },
    { campo: 'Descripcion', titulo: 'Descripción' },
    { campo: 'Permisos', titulo: 'Permisos', tipo: 'lista', listaCampo: 'Codigo' },
    { campo: 'Estado', titulo: 'Estado', tipo: 'estado' },
  ],
  campos: [
    { nombre: 'NombreRol', etiqueta: 'Nombre del rol', tipo: 'texto', requerido: true, maxLength: 50, ancho: 'completo' },
    { nombre: 'Descripcion', etiqueta: 'Descripción', tipo: 'texto', maxLength: 255, ancho: 'completo' },
    { nombre: 'Permisos', etiqueta: 'Permisos', tipo: 'multiselect', requerido: true,
      opciones: { url: 'Permisos?soloActivos=true', valor: 'ID_Permiso', texto: 'Nombre' },
      valorInicial: fila => (fila.Permisos ?? []).map((p: any) => p.ID_Permiso) },
  ],
};

const permisos: ConfigMantenimiento = {
  titulo: 'Permisos',
  subtitulo: 'Cada permiso habilita una parte del menú',
  icono: 'key',
  url: 'Permisos',
  id: 'ID_Permiso',
  nombreSingular: 'permiso',
  estado: 'put',
  busqueda: ['Codigo', 'Nombre', 'Descripcion'],
  columnas: [
    { campo: 'Codigo', titulo: 'Código', tipo: 'chip', clase: () => 'primario' },
    { campo: 'Nombre', titulo: 'Nombre' },
    { campo: 'Descripcion', titulo: 'Descripción' },
    { campo: 'Estado', titulo: 'Estado', tipo: 'estado' },
  ],
  campos: [
    { nombre: 'Codigo', etiqueta: 'Código', tipo: 'texto', requerido: true, maxLength: 50, mayusculas: true },
    { nombre: 'Nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, maxLength: 100 },
    { nombre: 'Descripcion', etiqueta: 'Descripción', tipo: 'textarea', maxLength: 255 },
  ],
};

const parametros: ConfigMantenimiento = {
  titulo: 'Parámetros del sistema',
  subtitulo: 'Valores de configuración. Un parámetro de almacén tiene prioridad sobre el global',
  icono: 'settings',
  url: 'ParametrosSistema',
  id: 'ID_Parametro',
  nombreSingular: 'parámetro',
  estado: 'put',
  busqueda: ['Clave', 'Valor', 'Descripcion'],
  columnas: [
    { campo: 'Clave', titulo: 'Clave', tipo: 'chip', clase: () => 'primario' },
    { campo: 'Valor', titulo: 'Valor', destacado: true },
    { campo: 'ID_Almacen', titulo: 'Aplica a', tipo: 'opcion' },
    { campo: 'Descripcion', titulo: 'Descripción' },
    { campo: 'FechaModificacion', titulo: 'Modificado', tipo: 'fecha' },
    { campo: 'Estado', titulo: 'Estado', tipo: 'estado' },
  ],
  campos: [
    { nombre: 'Clave', etiqueta: 'Clave', tipo: 'texto', requerido: true, maxLength: 50, mayusculas: true,
      ayuda: 'Ej: IVA_PORCENTAJE, MONEDA, NOMBRE_EMPRESA' },
    { nombre: 'Valor', etiqueta: 'Valor', tipo: 'texto', requerido: true, maxLength: 255 },
    { nombre: 'ID_Almacen', etiqueta: 'Aplica a', tipo: 'select', ancho: 'completo', valorDefecto: null,
      opciones: { url: 'Almacenes?soloActivos=true', valor: 'ID_Almacen', texto: 'Nombre', vacio: 'Todos los almacenes (global)' } },
    { nombre: 'Descripcion', etiqueta: 'Descripción', tipo: 'textarea', maxLength: 255 },
  ],
};

const correlativos: ConfigMantenimiento = {
  titulo: 'Correlativos',
  subtitulo: 'Numeración automática de cada tipo de documento',
  icono: 'pin',
  url: 'Correlativos',
  id: 'ID_Correlativo',
  nombreSingular: 'correlativo',
  estado: 'ninguno',
  permiteCrear: false,
  anchoDialogo: '520px',
  busqueda: ['Clave', 'Prefijo'],
  columnas: [
    { campo: 'Clave', titulo: 'Documento', destacado: true },
    { campo: 'Prefijo', titulo: 'Prefijo', tipo: 'chip', clase: () => 'primario' },
    { campo: 'UltimoNumero', titulo: 'Último número', tipo: 'numero' },
    { campo: 'Siguiente', titulo: 'Siguiente documento',
      formato: f => `${f.Prefijo}-${String(f.UltimoNumero + 1).padStart(6, '0')}` },
    { campo: 'Estado', titulo: 'Estado', tipo: 'estado' },
  ],
  campos: [
    { nombre: 'Clave', etiqueta: 'Documento', tipo: 'texto', deshabilitadoAlEditar: true, ancho: 'completo' },
    { nombre: 'Prefijo', etiqueta: 'Prefijo', tipo: 'texto', requerido: true, maxLength: 10, mayusculas: true },
    { nombre: 'UltimoNumero', etiqueta: 'Último número usado', tipo: 'numero', requerido: true },
    { nombre: 'Estado', etiqueta: 'Activo', tipo: 'checkbox' },
  ],
};

const tiposTransaccion: ConfigMantenimiento = {
  titulo: 'Tipos de transacción',
  subtitulo: 'Cómo afecta cada documento al inventario (solo se puede cambiar nombre, descripción y estado)',
  icono: 'rule',
  url: 'TiposTransaccion',
  id: 'ID_TipoTransaccion',
  nombreSingular: 'tipo de transacción',
  estado: 'ninguno',
  permiteCrear: false,
  busqueda: ['Codigo', 'Nombre', 'Descripcion'],
  columnas: [
    { campo: 'Codigo', titulo: 'Código', destacado: true },
    { campo: 'Nombre', titulo: 'Nombre' },
    { campo: 'Factor_Kardex', titulo: 'Inventario', tipo: 'chip',
      formato: f => (f.Factor_Kardex > 0 ? 'Entrada' : f.Factor_Kardex < 0 ? 'Salida' : 'No mueve'),
      clase: f => (f.Factor_Kardex > 0 ? 'exito' : f.Factor_Kardex < 0 ? 'peligro' : '') },
    { campo: 'TipoTercero', titulo: 'Dirigido a', formato: f => ({ CLIENTE: 'Cliente', PROVEEDOR: 'Proveedor' } as any)[f.TipoTercero] ?? '—' },
    { campo: 'Descripcion', titulo: 'Descripción' },
    { campo: 'Estado', titulo: 'Estado', tipo: 'estado' },
  ],
  campos: [
    { nombre: 'Codigo', etiqueta: 'Código', tipo: 'texto', deshabilitadoAlEditar: true },
    { nombre: 'Nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, maxLength: 50 },
    { nombre: 'Descripcion', etiqueta: 'Descripción', tipo: 'textarea', maxLength: 255 },
    { nombre: 'Estado', etiqueta: 'Activo', tipo: 'checkbox' },
  ],
};

export const CONFIGURACIONES = {
  productos, categorias, unidades, clientes, proveedores, almacenes, motivos,
  usuarios, roles, permisos, parametros, correlativos, tiposTransaccion,
};
