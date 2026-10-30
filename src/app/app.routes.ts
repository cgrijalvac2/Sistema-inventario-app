import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { authGuard, loginGuard, permisoGuard } from './core/guards/auth.guard';
import { CONFIGURACIONES } from './pages/mantenimientos/configuraciones';

// Las pantallas se cargan solo cuando se visitan (loadComponent) para que la app inicie rápido
const mantenimiento = () => import('./shared/mantenimiento/mantenimiento').then(m => m.Mantenimiento);
const documentoForm = () => import('./pages/movimientos/documento-form/documento-form').then(m => m.DocumentoForm);
const ventasCompras = () => import('./pages/movimientos/ventas-compras/ventas-compras').then(m => m.VentasCompras);

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('./pages/login/login').then(m => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/layout').then(m => m.Layout),
    canActivateChild: [permisoGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      { path: 'inicio', title: 'Inicio', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) },

      // ---------- Movimientos ----------
      // Módulos de ventas y compras: listado + registrar en un modal
      { path: 'movimientos/ventas', title: 'Ventas', loadComponent: ventasCompras, data: { tipo: 'VENTA', permisos: ['VENTAS', 'REPORTES'] } },
      { path: 'movimientos/compras', title: 'Compras', loadComponent: ventasCompras, data: { tipo: 'COMPRA', permisos: ['COMPRAS', 'REPORTES'] } },
      // Rutas anteriores: llevan al módulo y abren el modal (?nueva=1, o ?orden=5 al recibir una orden de compra)
      { path: 'movimientos/venta', redirectTo: ({ queryParams }) => inject(Router).createUrlTree(['/movimientos/ventas'], { queryParams: { nueva: 1, ...queryParams } }) },
      { path: 'movimientos/compra', redirectTo: ({ queryParams }) => inject(Router).createUrlTree(['/movimientos/compras'], { queryParams: { nueva: 1, ...queryParams } }) },
      { path: 'movimientos/notas-clientes', title: 'Notas a clientes', loadComponent: documentoForm, data: { modo: 'NOTA_CLIENTE', permisos: ['VENTAS'] } },
      { path: 'movimientos/notas-proveedores', title: 'Notas de proveedores', loadComponent: documentoForm, data: { modo: 'NOTA_PROVEEDOR', permisos: ['COMPRAS'] } },
      { path: 'movimientos/ajuste', title: 'Ajuste de inventario', loadComponent: documentoForm, data: { modo: 'AJUSTE', permisos: ['AJUSTES'] } },
      {
        path: 'movimientos/documentos', title: 'Documentos', data: { permisos: ['VENTAS', 'COMPRAS', 'AJUSTES', 'REPORTES'] },
        loadComponent: () => import('./pages/movimientos/documentos/documentos').then(m => m.Documentos),
      },
      {
        path: 'movimientos/ordenes-compra', title: 'Órdenes de compra', data: { permisos: ['COMPRAS'] },
        loadComponent: () => import('./pages/movimientos/ordenes-compra/ordenes-compra').then(m => m.OrdenesCompra),
      },
      {
        path: 'movimientos/ordenes-compra/nueva', title: 'Nueva orden de compra', data: { permisos: ['COMPRAS'] },
        loadComponent: () => import('./pages/movimientos/orden-compra-form/orden-compra-form').then(m => m.OrdenCompraForm),
      },
      {
        path: 'movimientos/ordenes-compra/:id', title: 'Editar orden de compra', data: { permisos: ['COMPRAS'] },
        loadComponent: () => import('./pages/movimientos/orden-compra-form/orden-compra-form').then(m => m.OrdenCompraForm),
      },
      {
        path: 'movimientos/transferencias', title: 'Transferencias', data: { permisos: ['TRANSFERENCIAS'] },
        loadComponent: () => import('./pages/movimientos/transferencias/transferencias').then(m => m.Transferencias),
      },
      {
        path: 'movimientos/transferencias/nueva', title: 'Nueva transferencia', data: { permisos: ['TRANSFERENCIAS'] },
        loadComponent: () => import('./pages/movimientos/transferencia-form/transferencia-form').then(m => m.TransferenciaForm),
      },

      // ---------- Reportes ----------
      {
        path: 'reportes/existencias', title: 'Existencias', data: { permisos: ['REPORTES'] },
        loadComponent: () => import('./pages/reportes/existencias/existencias').then(m => m.Existencias),
      },
      {
        path: 'reportes/kardex', title: 'Kardex', data: { permisos: ['REPORTES'] },
        loadComponent: () => import('./pages/reportes/kardex/kardex').then(m => m.Kardex),
      },
      {
        path: 'reportes/movimientos', title: 'Entradas y salidas', data: { permisos: ['REPORTES'] },
        loadComponent: () => import('./pages/reportes/movimientos/movimientos').then(m => m.Movimientos),
      },

      // ---------- Mantenimientos (todos usan el mismo componente con distinta configuración) ----------
      { path: 'catalogos/productos', title: 'Productos', loadComponent: mantenimiento, data: { config: CONFIGURACIONES.productos, permisos: ['CATALOGOS'] } },
      {
        path: 'catalogos/productos-almacen', title: 'Productos por almacén', data: { permisos: ['CATALOGOS'] },
        loadComponent: () => import('./pages/catalogos/productos-almacen/productos-almacen').then(m => m.ProductosAlmacen),
      },
      { path: 'catalogos/categorias', title: 'Categorías', loadComponent: mantenimiento, data: { config: CONFIGURACIONES.categorias, permisos: ['CATALOGOS'] } },
      { path: 'catalogos/unidades', title: 'Unidades de medida', loadComponent: mantenimiento, data: { config: CONFIGURACIONES.unidades, permisos: ['CATALOGOS'] } },
      { path: 'catalogos/clientes', title: 'Clientes', loadComponent: mantenimiento, data: { config: CONFIGURACIONES.clientes, permisos: ['CATALOGOS'] } },
      { path: 'catalogos/proveedores', title: 'Proveedores', loadComponent: mantenimiento, data: { config: CONFIGURACIONES.proveedores, permisos: ['CATALOGOS'] } },
      { path: 'catalogos/almacenes', title: 'Almacenes', loadComponent: mantenimiento, data: { config: CONFIGURACIONES.almacenes, permisos: ['CATALOGOS'] } },
      { path: 'catalogos/motivos', title: 'Motivos de ajuste', loadComponent: mantenimiento, data: { config: CONFIGURACIONES.motivos, permisos: ['CATALOGOS'] } },
      { path: 'seguridad/usuarios', title: 'Usuarios', loadComponent: mantenimiento, data: { config: CONFIGURACIONES.usuarios, permisos: ['SEGURIDAD'] } },
      { path: 'seguridad/roles', title: 'Roles', loadComponent: mantenimiento, data: { config: CONFIGURACIONES.roles, permisos: ['SEGURIDAD'] } },
      {
        path: 'seguridad/rol-permisos', title: 'Roles y permisos', data: { permisos: ['SEGURIDAD'] },
        loadComponent: () => import('./pages/seguridad/rol-permisos/rol-permisos').then(m => m.RolPermisos),
      },
      { path: 'seguridad/permisos', title: 'Permisos', loadComponent: mantenimiento, data: { config: CONFIGURACIONES.permisos, permisos: ['SEGURIDAD'] } },
      { path: 'configuracion/parametros', title: 'Parámetros del sistema', loadComponent: mantenimiento, data: { config: CONFIGURACIONES.parametros, permisos: ['CONFIGURACION'] } },
      { path: 'configuracion/correlativos', title: 'Correlativos', loadComponent: mantenimiento, data: { config: CONFIGURACIONES.correlativos, permisos: ['CONFIGURACION'] } },
      { path: 'configuracion/tipos-transaccion', title: 'Tipos de transacción', loadComponent: mantenimiento, data: { config: CONFIGURACIONES.tiposTransaccion, permisos: ['CONFIGURACION'] } },
    ]
  },
  { path: '**', redirectTo: '' },
];
