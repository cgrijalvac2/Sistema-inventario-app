// Configuración que describe un mantenimiento (CRUD): qué columnas mostrar y qué campos pedir.
// Con esto un solo componente sirve para productos, clientes, usuarios, roles, etc.

export type TipoCampo =
  | 'texto' | 'numero' | 'decimal' | 'email' | 'password' | 'textarea' | 'select' | 'multiselect' | 'checkbox';

export interface Opcion {
  valor: unknown;
  texto: string;
}

export interface CampoMantenimiento {
  nombre: string;                 // propiedad del DTO (ej: NombreProducto)
  etiqueta: string;
  tipo: TipoCampo;
  requerido?: boolean;
  requeridoAlCrear?: boolean;     // ej: la contraseña solo es obligatoria al crear
  maxLength?: number;
  minLength?: number;
  mayusculas?: boolean;
  ancho?: 'medio' | 'completo';   // en la rejilla de 2 columnas
  ayuda?: string;
  soloCrear?: boolean;            // no se muestra al editar
  soloEditar?: boolean;           // no se muestra al crear
  deshabilitadoAlEditar?: boolean;
  valorDefecto?: unknown;
  // Opciones de un select: se cargan de la API
  opciones?: { url: string; valor: string; texto: string; vacio?: string };
  // Cómo leer el valor de la fila al editar (ej: Almacenes [{ID_Almacen...}] -> [1, 2])
  valorInicial?: (fila: any) => unknown;
}

export type TipoColumna = 'texto' | 'moneda' | 'numero' | 'fecha' | 'estado' | 'lista' | 'opcion' | 'chip';

export interface ColumnaMantenimiento {
  campo: string;
  titulo: string;
  tipo?: TipoColumna;
  listaCampo?: string;                        // tipo 'lista': propiedad a mostrar de cada elemento
  opcionDe?: string;                          // tipo 'opcion': nombre del campo con las opciones
  formato?: (fila: any) => string;            // tipo 'chip' o texto personalizado
  clase?: (fila: any) => string;              // tipo 'chip': exito | peligro | alerta | info | primario
  destacado?: boolean;                        // texto en negrita
}

export interface ConfigMantenimiento {
  titulo: string;
  subtitulo: string;
  icono: string;
  url: string;                    // ruta de la API (ej: 'Productos')
  id: string;                     // nombre de la llave (ej: 'ID_Producto')
  nombreSingular: string;         // para los mensajes (ej: 'producto')
  columnas: ColumnaMantenimiento[];
  campos: CampoMantenimiento[];
  busqueda: string[];             // propiedades en las que busca el cuadro de búsqueda
  permiteCrear?: boolean;         // por defecto true
  // Cómo se activa/desactiva: 'patch' = DELETE + PATCH /activar, 'put' = DELETE + PUT con Estado, 'ninguno' = no se puede
  estado: 'patch' | 'put' | 'ninguno';
  anchoDialogo?: string;
}
