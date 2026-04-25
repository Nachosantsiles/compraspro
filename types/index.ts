// ─── ENUMS ───────────────────────────────────────────────────────────

export type RolEnum = "admin" | "tecnico" | "finanzas" | "comprador" | "almacen";

export type UrgenciaEnum = "Normal" | "Alta" | "Critica";

export type EstadoPedido =
  | "pendiente_autec"
  | "aprobado_autec"
  | "rechazado_autec"
  | "pendiente_cotizacion"
  | "cotizacion_completa"
  | "pendiente_autfin"
  | "aprobado_autfin"
  | "rechazado_autfin"
  | "oc_generada";

export type EstadoOPI =
  | "pendiente_cotizacion"
  | "cotizacion_completa"
  | "pendiente_autfin"
  | "aprobada_autfin"
  | "rechazada_autfin"
  | "oc_generada";

export type EstadoAutTec = "pendiente" | "aprobada" | "rechazada";
export type EstadoAutFin = "pendiente" | "aprobada" | "rechazada";
export type EstadoCotiz = "pendiente" | "recibida" | "seleccionada" | "rechazada";
export type EstadoOC = "borrador" | "emitida" | "recibida_parcial" | "recibida" | "cancelada";
export type EstadoFactura = "pendiente" | "pagada" | "vencida" | "pagada_parcial";
export type EstadoRecepcion = "pendiente_control" | "aprobada" | "con_diferencias" | "bloqueada";
export type EstadoReclamo =
  | "abierto"
  | "enviado"
  | "en_negociacion"
  | "resuelto"
  | "cerrado_sin_resolucion";

export type ResolucionReclamo = "reposicion" | "nota_de_credito" | "baja_item";

// ─── USUARIOS ────────────────────────────────────────────────────────

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: RolEnum;
  empresaId?: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsuarioConEmpresa extends Usuario {
  empresa?: Empresa | null;
}

// ─── EMPRESAS ────────────────────────────────────────────────────────

export type TipoEmpresa = "industrial" | "agropecuario";
export type EstructuraEmpresa = "departamentos" | "finca_departamento_tipo_subcategoria";

export interface Empresa {
  id: string;
  nombre: string;
  tipo: TipoEmpresa;
  color: string;
  estructura: EstructuraEmpresa;
  departamentos?: Departamento[];
  fincas?: Finca[];
}

export interface Departamento {
  id: string;
  codigo: string;
  nombre: string;
  empresaId: string;
  centrosCosto?: CentroCosto[];
}

export interface CentroCosto {
  id: string;
  codigo: string;
  descripcion: string;
  departamentoId: string;
  departamento?: Departamento;
}

export interface Finca {
  id: string;
  nombre: string;
  empresaId: string;
  empresa?: Empresa;
}

export interface CentroCostoFinca {
  id: string;
  tipo: "GASTOS" | "INVERSIONES";
  categoria: string;
  subcategoria?: string | null;
  descripcion: string;
}

// ─── PROVEEDORES ─────────────────────────────────────────────────────

export interface Proveedor {
  id: string;
  nombre: string;
  cuit?: string | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── PEDIDOS ─────────────────────────────────────────────────────────

export interface ItemPedido {
  id: string;
  pedidoId: string;
  cantidad: number;
  unidadMedida: string;
  descripcion: string;
  marca?: string | null;
  orden: number;
}

export interface Pedido {
  id: string;
  numero: string;
  empresaId: string;
  fincaId?: string | null;
  ccId?: string | null;
  ccFincaId?: string | null;
  solicitante: string;
  descripcion: string;
  urgencia: UrgenciaEnum;
  estado: EstadoPedido;
  creadorId: string;
  createdAt: Date;
  updatedAt: Date;
  items?: ItemPedido[];
  empresa?: Empresa;
  finca?: Finca | null;
  centroCosto?: CentroCosto | null;
  centroCostoFinca?: CentroCostoFinca | null;
  creador?: Usuario;
  autTecnica?: AutorizacionTec | null;
  opi?: OPI | null;
}

// ─── AUTORIZACIÓN TÉCNICA ────────────────────────────────────────────

export interface AutorizacionTec {
  id: string;
  pedidoId: string;
  aprobadorId?: string | null;
  estado: EstadoAutTec;
  comentario?: string | null;
  fecha?: Date | null;
  createdAt: Date;
  pedido?: Pedido;
  aprobador?: Usuario | null;
}

// ─── OPI ─────────────────────────────────────────────────────────────

export interface ItemOPI {
  id: string;
  opiId: string;
  itemPedidoId?: string | null;
  cantidad: number;
  unidadMedida: string;
  descripcion: string;
  marca?: string | null;
  orden: number;
  itemsCot?: ItemCotizacion[];
}

export interface OPI {
  id: string;
  numero: string;
  pedidoId: string;
  empresaId: string;
  fincaId?: string | null;
  ccId?: string | null;
  ccFincaId?: string | null;
  solicitante: string;
  descripcion: string;
  observaciones?: string | null;
  urgencia: UrgenciaEnum;
  estado: EstadoOPI;
  creadorId: string;
  createdAt: Date;
  updatedAt: Date;
  items?: ItemOPI[];
  empresa?: Empresa;
  finca?: Finca | null;
  centroCosto?: CentroCosto | null;
  centroCostoFinca?: CentroCostoFinca | null;
  creador?: Usuario;
  cotizaciones?: Cotizacion[];
  autFinanciera?: AutorizacionFin | null;
  ordenCompra?: OrdenCompra | null;
}

// ─── COTIZACIONES ────────────────────────────────────────────────────

export interface ItemCotizacion {
  id: string;
  cotizacionId: string;
  itemOPIId: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
  observaciones?: string | null;
  itemOPI?: ItemOPI;
}

export interface Cotizacion {
  id: string;
  numero: string;
  opiId: string;
  proveedorId: string;
  creadorId: string;
  estado: EstadoCotiz;
  seleccionada: boolean;
  condiciones?: string | null;
  validezDias?: number | null;
  moneda: string;
  total: number;
  observaciones?: string | null;
  createdAt: Date;
  updatedAt: Date;
  opi?: OPI;
  proveedor?: Proveedor;
  creador?: Usuario;
  items?: ItemCotizacion[];
}

// ─── AUTORIZACIÓN FINANCIERA ─────────────────────────────────────────

export interface AutorizacionFin {
  id: string;
  opiId: string;
  aprobadorId?: string | null;
  estado: EstadoAutFin;
  comentario?: string | null;
  fecha?: Date | null;
  createdAt: Date;
  opi?: OPI;
  aprobador?: Usuario | null;
}

// ─── ÓRDENES DE COMPRA ───────────────────────────────────────────────

export interface ItemOC {
  id: string;
  ocId: string;
  descripcion: string;
  cantidad: number;
  unidadMedida: string;
  precioUnitario: number;
  subtotal: number;
  cantRecibida: number;
  orden: number;
}

export interface OrdenCompra {
  id: string;
  numero: string;
  opiId: string;
  proveedorId: string;
  estado: EstadoOC;
  moneda: string;
  total: number;
  condiciones?: string | null;
  plazoEntrega?: string | null;
  observaciones?: string | null;
  emitidaAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  opi?: OPI;
  proveedor?: Proveedor;
  items?: ItemOC[];
  facturas?: Factura[];
  recepciones?: Recepcion[];
}

// ─── FACTURAS ────────────────────────────────────────────────────────

export interface Factura {
  id: string;
  numero: string;
  tipo: string;
  ocId: string;
  proveedorId: string;
  estado: EstadoFactura;
  moneda: string;
  subtotal: number;
  iva: number;
  total: number;
  fechaEmision: Date;
  fechaVto?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  oc?: OrdenCompra;
  proveedor?: Proveedor;
  pagos?: PagoFactura[];
}

// ─── PAGOS ───────────────────────────────────────────────────────────

export interface PagoFactura {
  id: string;
  pagoId: string;
  facturaId: string;
  monto: number;
  pago?: Pago;
  factura?: Factura;
}

export interface Pago {
  id: string;
  numero: string;
  creadorId: string;
  medio: string;
  moneda: string;
  total: number;
  fecha: Date;
  referencia?: string | null;
  observaciones?: string | null;
  createdAt: Date;
  creador?: Usuario;
  facturas?: PagoFactura[];
}

// ─── RECEPCIONES ─────────────────────────────────────────────────────

export type EstadoItemRecepcion = "ok" | "diferencia" | "faltante" | "exceso";

export interface ItemRecepcion {
  id: string;
  recepcionId: string;
  itemOCId: string;
  cantPedida: number;
  cantRecibida: number;
  diferencia: number;
  estado: EstadoItemRecepcion;
  observaciones?: string | null;
  itemOC?: ItemOC;
}

export interface Recepcion {
  id: string;
  numero: string;
  ocId: string;
  creadorId: string;
  estado: EstadoRecepcion;
  fechaRecepcion: Date;
  observaciones?: string | null;
  createdAt: Date;
  updatedAt: Date;
  oc?: OrdenCompra;
  creador?: Usuario;
  items?: ItemRecepcion[];
  reclamos?: Reclamo[];
}

// ─── RECLAMOS ────────────────────────────────────────────────────────

export interface Reclamo {
  id: string;
  numero: string;
  recepcionId: string;
  proveedorId: string;
  creadorId: string;
  estado: EstadoReclamo;
  motivo: string;
  descripcion?: string | null;
  resolucion?: ResolucionReclamo | null;
  notaCredito?: number | null;
  fechaEnvio?: Date | null;
  fechaRespuesta?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  recepcion?: Recepcion;
  proveedor?: Proveedor;
  creador?: Usuario;
}

// ─── STOCK ───────────────────────────────────────────────────────────

export type TipoMovimiento = "entrada" | "salida" | "ajuste";

export interface Articulo {
  id: string;
  codigo: string;
  descripcion: string;
  unidadMedida: string;
  stockActual: number;
  stockMinimo: number;
  stockMaximo?: number | null;
  ubicacion?: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  movimientos?: MovimientoStock[];
}

export interface MovimientoStock {
  id: string;
  articuloId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  saldoPost: number;
  referencia?: string | null;
  descripcion?: string | null;
  fecha: Date;
  createdAt: Date;
  articulo?: Articulo;
}

// ─── FORMULARIO OPI ──────────────────────────────────────────────────

export type UnidadMedida =
  | "unidad"
  | "kg"
  | "litro"
  | "metro"
  | "caja"
  | "bolsa"
  | "rollo"
  | "pallet"
  | "servicio"
  | "ml"
  | "par"
  | "juego";

export interface ItemFormOPI {
  cantidad: number;
  unidadMedida: UnidadMedida;
  descripcion: string;
  marca?: string;
}

export interface FormOPIBase {
  solicitante: string;
  fecha: string;
  descripcion: string;
  observaciones?: string;
  urgencia?: UrgenciaEnum;
  items: ItemFormOPI[];
}

export interface FormOPITomalar extends FormOPIBase {
  empresaId: "tomalar";
  departamentoId: string;
  ccId: string;
}

export interface FormOPISeville extends FormOPIBase {
  empresaId: "seville_cazorla";
  departamentoId: string;
  ccId: string;
}

export interface FormOPIFincas extends FormOPIBase {
  empresaId: "fincas_grupo_cazorla";
  fincaId: string;
  departamento: string;
  tipoImputacion: "GASTOS" | "INVERSIONES";
  categoria: string;
  subcategoria?: string;
}

export type FormOPI = FormOPITomalar | FormOPISeville | FormOPIFincas;

// ─── FLUJO / PIPELINE ─────────────────────────────────────────────────

export type EtapaFlujo =
  | "pedido"
  | "autorizacion_tecnica"
  | "opi"
  | "cotizaciones"
  | "autorizacion_financiera"
  | "orden_de_compra"
  | "factura"
  | "pago"
  | "recepcion_control"
  | "stock";

export interface EtapaFlujoInfo {
  id: EtapaFlujo;
  label: string;
  descripcion: string;
  rolesRequeridos: RolEnum[];
}

// ─── NOTIFICACIONES ──────────────────────────────────────────────────

export type EventoNotificacion =
  | "opi_pendiente_autec"
  | "autec_aprobada"
  | "cotizaciones_completas"
  | "autfin_aprobada"
  | "autfin_rechazada"
  | "oc_emitida"
  | "recepcion_con_diferencias"
  | "reclamo_sin_respuesta"
  | "stock_bajo_minimo"
  | "factura_por_vencer";

export interface Notificacion {
  id: string;
  evento: EventoNotificacion;
  titulo: string;
  mensaje: string;
  leida: boolean;
  usuarioId: string;
  referenciaId?: string;
  referenciaEntidad?: string;
  createdAt: Date;
}

// ─── PERMISOS ────────────────────────────────────────────────────────

export type Permiso =
  | "*"
  | "pedidos.crear"
  | "pedidos.ver"
  | "opi.crear"
  | "opi.ver"
  | "autorizacion_tecnica.aprobar"
  | "autorizacion_tecnica.rechazar"
  | "cotizaciones.crear"
  | "cotizaciones.ver"
  | "cotizaciones.seleccionar"
  | "autorizacion_financiera.aprobar"
  | "autorizacion_financiera.rechazar"
  | "oc.ver"
  | "oc.crear_manual"
  | "pagos.crear"
  | "pagos.ver"
  | "facturas.ver"
  | "cuentacorriente.ver"
  | "recepcion.crear"
  | "recepcion.ver"
  | "stock.ver"
  | "stock.ajustar"
  | "reclamos.ver"
  | "reclamos.enviar";

export interface RolInfo {
  id: RolEnum;
  nombre: string;
  permisos: Permiso[];
  descripcion: string;
}
