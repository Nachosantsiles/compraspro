import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // ── EMPRESAS ─────────────────────────────────────────────────────

  // Tomalar
  const tomalar = await prisma.empresa.upsert({
    where: { id: "tomalar" },
    update: {},
    create: { id: "tomalar", nombre: "Tomalar", tipo: "industrial", color: "#185FA5", estructura: "departamentos" },
  });

  // Seville Cazorla
  const seville = await prisma.empresa.upsert({
    where: { id: "seville_cazorla" },
    update: {},
    create: { id: "seville_cazorla", nombre: "Seville Cazorla", tipo: "industrial", color: "#3B6D11", estructura: "departamentos" },
  });

  // Fincas Grupo Cazorla
  const fincas = await prisma.empresa.upsert({
    where: { id: "fincas_grupo_cazorla" },
    update: {},
    create: { id: "fincas_grupo_cazorla", nombre: "Fincas Grupo Cazorla", tipo: "agropecuario", color: "#854F0B", estructura: "finca_departamento_tipo_subcategoria" },
  });

  console.log("✅ Empresas creadas");

  // ── DEPARTAMENTOS Y CENTROS DE COSTO: TOMALAR ────────────────────

  const tomalarDepts = [
    {
      codigo: "PRO", nombre: "PRODUCCION",
      cc: [
        { codigo: "PRO-01", descripcion: "Materia prima e insumos productivos" },
        { codigo: "PRO-02", descripcion: "Mantenimiento de linea de produccion" },
        { codigo: "PRO-03", descripcion: "Embalaje y packaging" },
        { codigo: "PRO-04", descripcion: "Herramientas y equipos de planta" },
        { codigo: "PRO-05", descripcion: "Seguridad e higiene industrial" },
        { codigo: "PRO-06", descripcion: "Otros gastos de produccion" },
      ],
    },
    {
      codigo: "MAN", nombre: "MANTENIMIENTO",
      cc: [
        { codigo: "MAN-01", descripcion: "Repuestos y materiales" },
        { codigo: "MAN-02", descripcion: "Herramientas y equipos" },
        { codigo: "MAN-03", descripcion: "Servicios externos de mantenimiento" },
        { codigo: "MAN-04", descripcion: "Lubricantes y consumibles" },
        { codigo: "MAN-05", descripcion: "Instalaciones y obra civil" },
      ],
    },
    {
      codigo: "CAL", nombre: "CALIDAD",
      cc: [
        { codigo: "CAL-01", descripcion: "Equipos de laboratorio y medicion" },
        { codigo: "CAL-02", descripcion: "Insumos y reactivos" },
        { codigo: "CAL-03", descripcion: "Certificaciones y auditorias" },
        { codigo: "CAL-04", descripcion: "Indumentaria y EPP de calidad" },
      ],
    },
    {
      codigo: "ADM", nombre: "ADMINISTRACION",
      cc: [
        { codigo: "ADM-01", descripcion: "Papeleria y utiles" },
        { codigo: "ADM-02", descripcion: "Tecnologia e informatica" },
        { codigo: "ADM-03", descripcion: "Servicios generales" },
        { codigo: "ADM-04", descripcion: "Mobiliario y equipamiento" },
        { codigo: "ADM-05", descripcion: "Gastos de representacion" },
      ],
    },
    {
      codigo: "COM", nombre: "COMERCIAL",
      cc: [
        { codigo: "COM-01", descripcion: "Material de marketing y publicidad" },
        { codigo: "COM-02", descripcion: "Gastos de viaje y estadias" },
        { codigo: "COM-03", descripcion: "Muestras y degustaciones" },
        { codigo: "COM-04", descripcion: "Arrendamiento vehiculos" },
        { codigo: "COM-05", descripcion: "Gastos de comidas" },
      ],
    },
  ];

  for (const dept of tomalarDepts) {
    const d = await prisma.departamento.upsert({
      where: { codigo_empresaId: { codigo: dept.codigo, empresaId: tomalar.id } },
      update: {},
      create: { codigo: dept.codigo, nombre: dept.nombre, empresaId: tomalar.id },
    });
    for (const cc of dept.cc) {
      await prisma.centroCosto.upsert({
        where: { codigo: cc.codigo },
        update: {},
        create: { codigo: cc.codigo, descripcion: cc.descripcion, departamentoId: d.id },
      });
    }
  }

  console.log("✅ Departamentos y CC Tomalar creados");

  // ── DEPARTAMENTOS Y CENTROS DE COSTO: SEVILLE CAZORLA ────────────

  const sevilleDepts = [
    {
      codigo: "PRO00", nombre: "PRODUCCION",
      cc: [
        { codigo: "PRO00-01", descripcion: "Arrendamiento coches otros departamentos" },
        { codigo: "PRO00-02", descripcion: "Gastos comidas" },
        { codigo: "PRO00-03", descripcion: "Materia prima e insumos" },
        { codigo: "PRO00-04", descripcion: "Maquinaria y equipos de planta" },
        { codigo: "PRO00-05", descripcion: "Mantenimiento de equipos" },
        { codigo: "PRO00-06", descripcion: "Embalaje y etiquetado" },
        { codigo: "PRO00-07", descripcion: "Seguridad e higiene" },
        { codigo: "PRO00-08", descripcion: "Otros" },
      ],
    },
    {
      codigo: "MAN00", nombre: "MANTENIMIENTO",
      cc: [
        { codigo: "MAN00-01", descripcion: "Repuestos y materiales" },
        { codigo: "MAN00-02", descripcion: "Herramientas" },
        { codigo: "MAN00-03", descripcion: "Servicios externos" },
        { codigo: "MAN00-04", descripcion: "Lubricantes y consumibles" },
        { codigo: "MAN00-05", descripcion: "Obras e instalaciones" },
      ],
    },
    {
      codigo: "CAL00", nombre: "CALIDAD",
      cc: [
        { codigo: "CAL00-01", descripcion: "Insumos de laboratorio" },
        { codigo: "CAL00-02", descripcion: "Equipos de medicion" },
        { codigo: "CAL00-03", descripcion: "EPP y vestimenta" },
        { codigo: "CAL00-04", descripcion: "Certificaciones" },
      ],
    },
    {
      codigo: "ADM00", nombre: "ADMINISTRACION",
      cc: [
        { codigo: "ADM00-01", descripcion: "Papeleria y utiles" },
        { codigo: "ADM00-02", descripcion: "Tecnologia e informatica" },
        { codigo: "ADM00-03", descripcion: "Servicios generales" },
        { codigo: "ADM00-04", descripcion: "Gastos financieros" },
      ],
    },
    {
      codigo: "RRHH00", nombre: "RECURSOS_HUMANOS",
      cc: [
        { codigo: "RRHH00-01", descripcion: "Capacitacion y formacion" },
        { codigo: "RRHH00-02", descripcion: "Uniformes y EPP" },
        { codigo: "RRHH00-03", descripcion: "Bienestar y beneficios" },
        { codigo: "RRHH00-04", descripcion: "Seleccion y contratacion" },
      ],
    },
    {
      codigo: "COM00", nombre: "COMERCIAL",
      cc: [
        { codigo: "COM00-01", descripcion: "Marketing y publicidad" },
        { codigo: "COM00-02", descripcion: "Viajes y representacion" },
        { codigo: "COM00-03", descripcion: "Muestras y degustaciones" },
        { codigo: "COM00-04", descripcion: "Arrendamiento vehiculos" },
      ],
    },
    {
      codigo: "CON00", nombre: "CONSTRUCCIONES",
      cc: [
        { codigo: "CON00-01", descripcion: "Materiales de construccion" },
        { codigo: "CON00-02", descripcion: "Equipos y maquinaria de obra" },
        { codigo: "CON00-03", descripcion: "Servicios de construccion" },
        { codigo: "CON00-04", descripcion: "Instalaciones electricas y sanitarias" },
      ],
    },
    {
      codigo: "ACT00", nombre: "NUEVOS_ACTIVOS",
      cc: [
        { codigo: "ACT00-01", descripcion: "Maquinaria y equipos nuevos" },
        { codigo: "ACT00-02", descripcion: "Vehiculos y rodados" },
        { codigo: "ACT00-03", descripcion: "Mobiliario y equipamiento" },
        { codigo: "ACT00-04", descripcion: "Tecnologia e informatica" },
        { codigo: "ACT00-05", descripcion: "Instalaciones y mejoras" },
      ],
    },
  ];

  for (const dept of sevilleDepts) {
    const d = await prisma.departamento.upsert({
      where: { codigo_empresaId: { codigo: dept.codigo, empresaId: seville.id } },
      update: {},
      create: { codigo: dept.codigo, nombre: dept.nombre, empresaId: seville.id },
    });
    for (const cc of dept.cc) {
      await prisma.centroCosto.upsert({
        where: { codigo: cc.codigo },
        update: {},
        create: { codigo: cc.codigo, descripcion: cc.descripcion, departamentoId: d.id },
      });
    }
  }

  console.log("✅ Departamentos y CC Seville Cazorla creados");

  // ── FINCAS ────────────────────────────────────────────────────────

  const fincasData = [
    { id: "mission_argentina", nombre: "MISSION ARGENTINA" },
    { id: "san_gabriel", nombre: "SAN GABRIEL" },
    { id: "yuchan", nombre: "YUCHAN" },
    { id: "ardim", nombre: "ARDIM" },
    { id: "capellans", nombre: "CAPELLANS" },
    { id: "altea_agro", nombre: "ALTEA AGRO" },
  ];

  for (const f of fincasData) {
    await prisma.finca.upsert({
      where: { id: f.id },
      update: {},
      create: { id: f.id, nombre: f.nombre, empresaId: fincas.id },
    });
  }

  console.log("✅ Fincas creadas");

  // ── CENTROS DE COSTO FINCAS ───────────────────────────────────────

  const ccFincasData = [
    // GASTOS > GASTOS DE PRODUCCION
    { tipo: "GASTOS", categoria: "GASTOS_DE_PRODUCCION", subcategoria: "GASTOS DE PLANTACION", descripcion: "Gastos de Plantacion" },
    { tipo: "GASTOS", categoria: "GASTOS_DE_PRODUCCION", subcategoria: "GASTOS DE COSECHA", descripcion: "Gastos de Cosecha" },
    { tipo: "GASTOS", categoria: "GASTOS_DE_PRODUCCION", subcategoria: "GASTOS DE PODA", descripcion: "Gastos de Poda" },
    // GASTOS > COMBUSTIBLES Y LUBRICANTES
    { tipo: "GASTOS", categoria: "COMBUSTIBLES_Y_LUBRICANTES", subcategoria: "COMBUSTIBLES TRACTORES (GASOIL PARA MAQUINARIAS)", descripcion: "Combustibles Tractores" },
    { tipo: "GASTOS", categoria: "COMBUSTIBLES_Y_LUBRICANTES", subcategoria: "COMBUSTIBLES VEHICULOS (NAFTA Y GASOIL PARA CAMIONETAS)", descripcion: "Combustibles Vehiculos" },
    { tipo: "GASTOS", categoria: "COMBUSTIBLES_Y_LUBRICANTES", subcategoria: "LUBRICANTES", descripcion: "Lubricantes" },
    { tipo: "GASTOS", categoria: "COMBUSTIBLES_Y_LUBRICANTES", subcategoria: "NAFTA PARA MOTOS", descripcion: "Nafta para Motos" },
    // GASTOS > MANTENIMIENTOS
    { tipo: "GASTOS", categoria: "MANTENIMIENTOS", subcategoria: "MAQUINARIA", descripcion: "Mantenimiento Maquinaria" },
    { tipo: "GASTOS", categoria: "MANTENIMIENTOS", subcategoria: "RODADOS", descripcion: "Mantenimiento Rodados" },
    { tipo: "GASTOS", categoria: "MANTENIMIENTOS", subcategoria: "INSTALACIONES", descripcion: "Mantenimiento Instalaciones" },
    { tipo: "GASTOS", categoria: "MANTENIMIENTOS", subcategoria: "SISTEMA DE RIEGO", descripcion: "Mantenimiento Sistema de Riego" },
    { tipo: "GASTOS", categoria: "MANTENIMIENTOS", subcategoria: "RED TENDIDO ELECTRICO", descripcion: "Mantenimiento Red Tendido Electrico" },
    { tipo: "GASTOS", categoria: "MANTENIMIENTOS", subcategoria: "GASTOS DE TALLER", descripcion: "Gastos de Taller" },
    // GASTOS > AGROQUIMICOS
    { tipo: "GASTOS", categoria: "AGROQUIMICOS", subcategoria: "FERTILIZANTES", descripcion: "Fertilizantes" },
    { tipo: "GASTOS", categoria: "AGROQUIMICOS", subcategoria: "FUNGICIDAS", descripcion: "Fungicidas" },
    { tipo: "GASTOS", categoria: "AGROQUIMICOS", subcategoria: "INSECTICIDAS", descripcion: "Insecticidas" },
    { tipo: "GASTOS", categoria: "AGROQUIMICOS", subcategoria: "HERBICIDAS", descripcion: "Herbicidas" },
    { tipo: "GASTOS", categoria: "AGROQUIMICOS", subcategoria: "BACTERICIDAS", descripcion: "Bactericidas" },
    { tipo: "GASTOS", categoria: "AGROQUIMICOS", subcategoria: "OTROS", descripcion: "Agroquimicos Otros" },
    // GASTOS > GENERALES Y ADMINISTRATIVOS
    { tipo: "GASTOS", categoria: "GENERALES_Y_ADMINISTRATIVOS", subcategoria: "FLETES Y ACARREOS", descripcion: "Fletes y Acarreos" },
    { tipo: "GASTOS", categoria: "GENERALES_Y_ADMINISTRATIVOS", subcategoria: "GASTOS DE VIAJE Y ESTADIAS", descripcion: "Gastos de Viaje y Estadias" },
    { tipo: "GASTOS", categoria: "GENERALES_Y_ADMINISTRATIVOS", subcategoria: "PAPELERIA Y UTILES", descripcion: "Papeleria y Utiles" },
    { tipo: "GASTOS", categoria: "GENERALES_Y_ADMINISTRATIVOS", subcategoria: "ROPA Y EQUIPO DE TRABAJO", descripcion: "Ropa y Equipo de Trabajo" },
    { tipo: "GASTOS", categoria: "GENERALES_Y_ADMINISTRATIVOS", subcategoria: "PRODUCTOS DE LIMPIEZA", descripcion: "Productos de Limpieza" },
    { tipo: "GASTOS", categoria: "GENERALES_Y_ADMINISTRATIVOS", subcategoria: "GASTOS GENERALES DE ADMINISTRACION", descripcion: "Gastos Generales de Administracion" },
    // INVERSIONES > CONSTRUCCIONES
    { tipo: "INVERSIONES", categoria: "CONSTRUCCIONES", subcategoria: "DEPOSITO", descripcion: "Deposito" },
    { tipo: "INVERSIONES", categoria: "CONSTRUCCIONES", subcategoria: "CONSTRUCCIONES", descripcion: "Construcciones" },
    { tipo: "INVERSIONES", categoria: "CONSTRUCCIONES", subcategoria: "GALPON", descripcion: "Galpon" },
    { tipo: "INVERSIONES", categoria: "CONSTRUCCIONES", subcategoria: "CAMPAMENTOS COSECHEROS", descripcion: "Campamentos Cosecheros" },
    { tipo: "INVERSIONES", categoria: "CONSTRUCCIONES", subcategoria: "CASA DEL PERSONAL", descripcion: "Casa del Personal" },
    { tipo: "INVERSIONES", categoria: "CONSTRUCCIONES", subcategoria: "CASILLA DE RIEGO", descripcion: "Casilla de Riego" },
    { tipo: "INVERSIONES", categoria: "CONSTRUCCIONES", subcategoria: "VIVERO", descripcion: "Vivero" },
    { tipo: "INVERSIONES", categoria: "CONSTRUCCIONES", subcategoria: "OFICINAS", descripcion: "Oficinas" },
    // INVERSIONES > PLANTACIONES
    { tipo: "INVERSIONES", categoria: "PLANTACIONES", subcategoria: "PLANTACION DE OLIVO", descripcion: "Plantacion de Olivo" },
    { tipo: "INVERSIONES", categoria: "PLANTACIONES", subcategoria: "ORNAMENTALES", descripcion: "Ornamentales" },
    // INVERSIONES > HERRAMIENTAS E IMPLEMENTOS
    { tipo: "INVERSIONES", categoria: "HERRAMIENTAS_E_IMPLEMENTOS", subcategoria: "HERRAMIENTAS", descripcion: "Herramientas" },
    { tipo: "INVERSIONES", categoria: "HERRAMIENTAS_E_IMPLEMENTOS", subcategoria: "IMPLEMENTOS", descripcion: "Implementos" },
    // INVERSIONES > PERFORACIONES Y SISTEMAS DE RIEGO
    { tipo: "INVERSIONES", categoria: "PERFORACIONES_Y_SISTEMAS_DE_RIEGO", subcategoria: "SISTEMA DE RIEGO OLIVO", descripcion: "Sistema de Riego Olivo" },
    { tipo: "INVERSIONES", categoria: "PERFORACIONES_Y_SISTEMAS_DE_RIEGO", subcategoria: "SISTEMA DE RIEGO DE TOMATE", descripcion: "Sistema de Riego de Tomate" },
    { tipo: "INVERSIONES", categoria: "PERFORACIONES_Y_SISTEMAS_DE_RIEGO", subcategoria: "PERFORACIONES", descripcion: "Perforaciones" },
    { tipo: "INVERSIONES", categoria: "PERFORACIONES_Y_SISTEMAS_DE_RIEGO", subcategoria: "EQUIPO DE RIEGO OLIVO", descripcion: "Equipo de Riego Olivo" },
    { tipo: "INVERSIONES", categoria: "PERFORACIONES_Y_SISTEMAS_DE_RIEGO", subcategoria: "EQUIPO DE RIEGO TOMATE", descripcion: "Equipo de Riego Tomate" },
    // INVERSIONES sin subcategorias
    { tipo: "INVERSIONES", categoria: "RED_DE_TENDIDO_ELECTRICO", subcategoria: null, descripcion: "Red de Tendido Electrico" },
    { tipo: "INVERSIONES", categoria: "MAQUINARIA", subcategoria: null, descripcion: "Maquinaria" },
    { tipo: "INVERSIONES", categoria: "MUEBLES_Y_UTILES", subcategoria: null, descripcion: "Muebles y Utiles" },
    { tipo: "INVERSIONES", categoria: "RODADOS", subcategoria: null, descripcion: "Rodados" },
    { tipo: "INVERSIONES", categoria: "BOMBAS_Y_TABLEROS", subcategoria: null, descripcion: "Bombas y Tableros" },
    { tipo: "INVERSIONES", categoria: "CORTINAS_Y_ALAMBRADOS", subcategoria: null, descripcion: "Cortinas y Alambrados" },
    { tipo: "INVERSIONES", categoria: "INSTALACIONES", subcategoria: null, descripcion: "Instalaciones" },
  ];

  for (const cc of ccFincasData) {
    await prisma.centroCostoFinca.upsert({
      where: { id: `${cc.tipo}_${cc.categoria}_${cc.subcategoria ?? "NULL"}` },
      update: {},
      create: {
        id: `${cc.tipo}_${cc.categoria}_${cc.subcategoria ?? "NULL"}`,
        tipo: cc.tipo,
        categoria: cc.categoria,
        subcategoria: cc.subcategoria,
        descripcion: cc.descripcion,
      },
    });
  }

  console.log("✅ Centros de costo de Fincas creados");

  // ── UNIDADES DE MEDIDA ────────────────────────────────────────────

  const unidadesBase = [
    "unid", "kg", "g", "tn",
    "L", "mL",
    "m", "m²", "mm",
    "caja", "bolsa", "rollo", "par", "juego", "servicio",
  ];

  for (const nombre of unidadesBase) {
    await prisma.unidadMedida.upsert({
      where: { nombre },
      update: {},
      create: { nombre, activo: true },
    });
  }

  console.log("✅ Unidades de medida creadas");

  // ── CATEGORÍAS Y SUBCATEGORÍAS ────────────────────────────────────

  const categoriasData = [
    // ── FÁBRICA ───────────────────────────────────────────────────────
    {
      nombre: "Insumos Químicos", tipo: "fabrica",
      subs: ["Ácidos y bases", "Solventes", "Aditivos alimentarios", "Productos de laboratorio", "Otros químicos"],
    },
    {
      nombre: "Repuestos de Maquinaria", tipo: "fabrica",
      subs: ["Rodamientos y bujes", "Correas y cadenas", "Filtros", "Válvulas y accesorios", "Elementos de sujeción", "Otros repuestos"],
    },
    {
      nombre: "Materiales de Oficina", tipo: "fabrica",
      subs: ["Papelería y útiles", "Cartuchos e impresión", "Insumos informáticos", "Otros materiales de oficina"],
    },
    {
      nombre: "Material Auxiliar de Producción", tipo: "fabrica",
      subs: ["Embalaje y packaging", "Etiquetas y rótulos", "Film y zuncho", "Pallets y tarimas", "Otros auxiliares"],
    },
    {
      nombre: "Materiales de Limpieza", tipo: "fabrica",
      subs: ["Productos de limpieza", "Descartables e higiene", "Equipos de limpieza"],
    },
    {
      nombre: "Seguridad e Higiene", tipo: "fabrica",
      subs: ["EPP (casco, guantes, etc.)", "Señalización", "Botiquín y primeros auxilios", "Extintores y equipos contra incendio"],
    },
    {
      nombre: "Servicios y Mantenimiento", tipo: "fabrica",
      subs: ["Servicio técnico externo", "Calibración de equipos", "Reparaciones civiles y edilicias", "Otros servicios"],
    },
    // ── FINCA ─────────────────────────────────────────────────────────
    {
      nombre: "Agroquímicos", tipo: "finca",
      subs: ["Fungicidas", "Insecticidas", "Herbicidas", "Bactericidas", "Acaricidas", "Coadyuvantes", "Otros agroquímicos"],
    },
    {
      nombre: "Fertilizantes", tipo: "finca",
      subs: ["Fertilizantes foliares", "Fertilizantes edáficos", "Enmiendas y correctores", "Otros fertilizantes"],
    },
    {
      nombre: "Repuestos Maquinaria Agrícola", tipo: "finca",
      subs: ["Repuestos de tractores", "Repuestos de implementos", "Filtros agrícolas", "Otros repuestos agrícolas"],
    },
    {
      nombre: "Herramientas", tipo: "finca",
      subs: ["Herramientas manuales", "Herramientas eléctricas", "Herramientas de corte y poda", "Otras herramientas"],
    },
    {
      nombre: "Materiales de Oficina", tipo: "finca",
      subs: ["Papelería y útiles", "Insumos informáticos", "Otros materiales de oficina"],
    },
    {
      nombre: "Materiales de Limpieza", tipo: "finca",
      subs: ["Productos de limpieza", "Descartables e higiene"],
    },
    {
      nombre: "Seguridad e Higiene", tipo: "finca",
      subs: ["EPP (casco, guantes, etc.)", "Señalización", "Botiquín y primeros auxilios", "Extintores y equipos contra incendio"],
    },
    {
      nombre: "Combustibles y Lubricantes", tipo: "finca",
      subs: ["Gasoil", "Nafta", "Lubricantes y aceites", "Otros combustibles"],
    },
    // ── TODAS ─────────────────────────────────────────────────────────
    {
      nombre: "Materiales de Construcción", tipo: "todas",
      subs: [
        "Cemento y adhesivos", "Áridos", "Ladrillos y bloques",
        "Hierro y acero", "Caños y tuberías", "Cables y electricidad",
        "Pintura y revestimientos", "Aberturas y vidrios", "Otros materiales de construcción",
      ],
    },
  ];

  for (const cat of categoriasData) {
    const categoria = await prisma.categoria.upsert({
      where: { id: `cat_${cat.tipo}_${cat.nombre.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}` },
      update: {},
      create: {
        id: `cat_${cat.tipo}_${cat.nombre.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}`,
        nombre: cat.nombre,
        tipo: cat.tipo,
        activo: true,
      },
    });
    for (const subNombre of cat.subs) {
      await prisma.subCategoria.upsert({
        where: { id: `sub_${categoria.id}_${subNombre.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}` },
        update: {},
        create: {
          id: `sub_${categoria.id}_${subNombre.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}`,
          nombre: subNombre,
          categoriaId: categoria.id,
          activo: true,
        },
      });
    }
  }

  console.log("✅ Categorías y subcategorías creadas");

  // ── PRESENTACIONES POR SUBCATEGORÍA ──────────────────────────────
  // Helper para generar IDs determinísticos (igual que categorías/subs)
  function slugify(s: string) {
    return s.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  }

  // [categoriaNombre, categoríaTipo, subcategoriaNombre, [presentaciones]]
  const presData: [string, string, string, string[]][] = [
    // INSUMOS QUÍMICOS
    ["Insumos Químicos", "fabrica", "Ácidos y bases",          ["Bidón 5L", "Bidón 20L", "Tambor 200L", "Frasco 1L"]],
    ["Insumos Químicos", "fabrica", "Solventes",               ["Bidón 5L", "Bidón 20L", "Tambor 200L", "Frasco 500mL"]],
    ["Insumos Químicos", "fabrica", "Aditivos alimentarios",   ["Bolsa 25kg", "Bolsa 1kg", "Bidón 5L", "Bidón 20L"]],
    ["Insumos Químicos", "fabrica", "Productos de laboratorio",["Frasco 100mL", "Frasco 500mL", "Frasco 1L", "Caja 100u"]],
    // REPUESTOS MAQUINARIA
    ["Repuestos de Maquinaria", "fabrica", "Rodamientos y bujes",     ["Unidad", "Par", "Caja 10u", "Kit"]],
    ["Repuestos de Maquinaria", "fabrica", "Correas y cadenas",       ["Unidad", "Metro", "Rollo 5m"]],
    ["Repuestos de Maquinaria", "fabrica", "Filtros",                 ["Unidad", "Caja 6u", "Caja 12u"]],
    ["Repuestos de Maquinaria", "fabrica", "Válvulas y accesorios",   ["Unidad", "Par", "Juego"]],
    ["Repuestos de Maquinaria", "fabrica", "Elementos de sujeción",   ["Caja 100u", "Bolsa 50u", "Unidad"]],
    // MATERIALES DE OFICINA (fábrica)
    ["Materiales de Oficina", "fabrica", "Papelería y útiles",       ["Resma 500h", "Caja 12u", "Unidad", "Pack x10"]],
    ["Materiales de Oficina", "fabrica", "Cartuchos e impresión",    ["Unidad", "Pack x2", "Caja 4u"]],
    ["Materiales de Oficina", "fabrica", "Insumos informáticos",     ["Unidad", "Caja", "Pack x5"]],
    // MATERIAL AUXILIAR DE PRODUCCIÓN
    ["Material Auxiliar de Producción", "fabrica", "Embalaje y packaging", ["Caja 100u", "Rollo", "Paquete 500u"]],
    ["Material Auxiliar de Producción", "fabrica", "Etiquetas y rótulos",  ["Rollo 1000u", "Rollo 500u", "Caja"]],
    ["Material Auxiliar de Producción", "fabrica", "Film y zuncho",        ["Rollo", "Caja 6 rollos"]],
    ["Material Auxiliar de Producción", "fabrica", "Pallets y tarimas",    ["Unidad", "Lote 10u"]],
    // MATERIALES DE LIMPIEZA (fábrica)
    ["Materiales de Limpieza", "fabrica", "Productos de limpieza",   ["Bidón 5L", "Bidón 20L", "Bolsa 5kg", "Unidad"]],
    ["Materiales de Limpieza", "fabrica", "Descartables e higiene",  ["Caja 100u", "Pack 50u", "Rollo"]],
    // SEGURIDAD E HIGIENE (fábrica)
    ["Seguridad e Higiene", "fabrica", "EPP (casco, guantes, etc.)", ["Unidad", "Par", "Caja 12u", "Bolsa 100u"]],
    ["Seguridad e Higiene", "fabrica", "Señalización",               ["Unidad", "Lote 10u"]],
    ["Seguridad e Higiene", "fabrica", "Botiquín y primeros auxilios",["Unidad", "Kit", "Caja"]],
    // AGROQUÍMICOS
    ["Agroquímicos", "finca", "Fungicidas",      ["Bolsa 1kg", "Bolsa 5kg", "Bidón 1L", "Bidón 5L", "Caja 12x1L"]],
    ["Agroquímicos", "finca", "Insecticidas",    ["Bolsa 1kg", "Bidón 1L", "Bidón 5L", "Caja 12x1L"]],
    ["Agroquímicos", "finca", "Herbicidas",      ["Bidón 1L", "Bidón 5L", "Bidón 20L", "Bolsa 5kg"]],
    ["Agroquímicos", "finca", "Bactericidas",    ["Bidón 1L", "Bidón 5L", "Bolsa 1kg"]],
    ["Agroquímicos", "finca", "Acaricidas",      ["Bidón 1L", "Bidón 5L", "Bolsa 1kg"]],
    ["Agroquímicos", "finca", "Coadyuvantes",    ["Bidón 5L", "Bidón 20L", "Tambor 200L"]],
    // FERTILIZANTES
    ["Fertilizantes", "finca", "Fertilizantes foliares",  ["Bidón 1L", "Bidón 5L", "Bidón 20L", "Bolsa 1kg"]],
    ["Fertilizantes", "finca", "Fertilizantes edáficos",  ["Bolsa 25kg", "Bolsa 50kg", "Big Bag 500kg", "Big Bag 1tn"]],
    ["Fertilizantes", "finca", "Enmiendas y correctores", ["Bolsa 25kg", "Bolsa 50kg", "Big Bag 500kg"]],
    // REPUESTOS MAQUINARIA AGRÍCOLA
    ["Repuestos Maquinaria Agrícola", "finca", "Repuestos de tractores",    ["Unidad", "Par", "Kit", "Caja"]],
    ["Repuestos Maquinaria Agrícola", "finca", "Repuestos de implementos",  ["Unidad", "Par", "Juego"]],
    ["Repuestos Maquinaria Agrícola", "finca", "Filtros agrícolas",         ["Unidad", "Caja 6u", "Caja 12u"]],
    // HERRAMIENTAS
    ["Herramientas", "finca", "Herramientas manuales",          ["Unidad", "Par", "Juego", "Caja"]],
    ["Herramientas", "finca", "Herramientas eléctricas",        ["Unidad", "Kit"]],
    ["Herramientas", "finca", "Herramientas de corte y poda",   ["Unidad", "Par", "Caja 6u"]],
    // COMBUSTIBLES Y LUBRICANTES
    ["Combustibles y Lubricantes", "finca", "Gasoil",               ["Litros (carga cisterna)", "Bidón 20L", "Tambor 200L"]],
    ["Combustibles y Lubricantes", "finca", "Lubricantes y aceites",["Bidón 4L", "Bidón 20L", "Tambor 200L"]],
    // MATERIALES DE CONSTRUCCIÓN
    ["Materiales de Construcción", "todas", "Cemento y adhesivos",        ["Bolsa 25kg", "Bolsa 50kg", "Balde 20kg"]],
    ["Materiales de Construcción", "todas", "Hierro y acero",             ["Barra 6m", "Malla 6x2.4m", "Kg", "Ton"]],
    ["Materiales de Construcción", "todas", "Caños y tuberías",           ["Metro", "Barra 6m", "Unidad"]],
    ["Materiales de Construcción", "todas", "Cables y electricidad",      ["Metro", "Rollo 100m", "Rollo 50m"]],
    ["Materiales de Construcción", "todas", "Pintura y revestimientos",   ["Lata 4L", "Lata 20L", "Balde 20kg"]],
    // MATERIALES DE OFICINA (finca)
    ["Materiales de Oficina", "finca", "Papelería y útiles",    ["Resma 500h", "Caja 12u", "Unidad"]],
    ["Materiales de Oficina", "finca", "Insumos informáticos",  ["Unidad", "Caja"]],
    // MATERIALES DE LIMPIEZA (finca)
    ["Materiales de Limpieza", "finca", "Productos de limpieza",  ["Bidón 5L", "Bidón 20L", "Bolsa 5kg"]],
    ["Materiales de Limpieza", "finca", "Descartables e higiene", ["Caja 100u", "Pack 50u", "Rollo"]],
    // SEGURIDAD E HIGIENE (finca)
    ["Seguridad e Higiene", "finca", "EPP (casco, guantes, etc.)", ["Unidad", "Par", "Caja 12u"]],
    ["Seguridad e Higiene", "finca", "Botiquín y primeros auxilios", ["Unidad", "Kit", "Caja"]],
  ];

  for (const [catNombre, catTipo, subNombre, presentaciones] of presData) {
    const catId = `cat_${catTipo}_${slugify(catNombre)}`;
    const subId = `sub_${catId}_${slugify(subNombre)}`;
    for (const presNombre of presentaciones) {
      const presId = `pres_${subId}_${slugify(presNombre)}`;
      await prisma.presentacion.upsert({
        where: { id: presId },
        update: {},
        create: { id: presId, nombre: presNombre, subCategoriaId: subId, activo: true },
      });
    }
  }

  console.log("✅ Presentaciones creadas");

  // ── USUARIOS DEMO ─────────────────────────────────────────────────

  const passwordHash = await bcrypt.hash("compras2024", 10);

  const usuarios = [
    { email: "admin@cazorla.com", nombre: "Admin", apellido: "Sistema", rol: "admin" as const, empresaId: null },
    { email: "tecnico@tomalar.com", nombre: "Carlos", apellido: "Fernandez", rol: "tecnico" as const, empresaId: "tomalar" },
    { email: "comprador@cazorla.com", nombre: "Maria", apellido: "Lopez", rol: "comprador" as const, empresaId: null },
    { email: "finanzas@cazorla.com", nombre: "Roberto", apellido: "Perez", rol: "finanzas" as const, empresaId: null },
    { email: "almacen@tomalar.com", nombre: "Lucas", apellido: "Garcia", rol: "almacen" as const, empresaId: "tomalar" },
    { email: "tecnico@seville.com", nombre: "Ana", apellido: "Martinez", rol: "tecnico" as const, empresaId: "seville_cazorla" },
    { email: "almacen@seville.com", nombre: "Jorge", apellido: "Ruiz", rol: "almacen" as const, empresaId: "seville_cazorla" },
    { email: "tecnico@fincas.com", nombre: "Diego", apellido: "Gomez", rol: "tecnico" as const, empresaId: "fincas_grupo_cazorla" },
  ];

  for (const u of usuarios) {
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        nombre: u.nombre,
        apellido: u.apellido,
        password: passwordHash,
        rol: u.rol,
        empresaId: u.empresaId,
        activo: true,
      },
    });
  }

  console.log("✅ Usuarios demo creados");

  // ── PROVEEDORES DEMO ──────────────────────────────────────────────

  const proveedoresData = [
    { nombre: "Distribuidora El Norte SA", cuit: "30-12345678-9", email: "ventas@elnorte.com", telefono: "0800-555-1234" },
    { nombre: "Insumos Industriales SRL", cuit: "30-98765432-1", email: "compras@insumosindustriales.com", telefono: "011-4567-8901" },
    { nombre: "Agroquimica del Sol SA", cuit: "30-11223344-5", email: "ventas@agroquimicadelsol.com", telefono: "0264-456-7890" },
    { nombre: "Tecno Equipos SA", cuit: "30-55443322-1", email: "ventas@tecnoequipos.com.ar", telefono: "011-3456-7890" },
    { nombre: "Ferreteria Central SRL", cuit: "30-66778899-0", email: "info@ferreteriacentral.com", telefono: "011-2345-6789" },
    { nombre: "Servicios Generales SA", cuit: "30-44332211-8", email: "servicios@sgsa.com.ar", telefono: "011-9876-5432" },
  ];

  for (const p of proveedoresData) {
    await prisma.proveedor.upsert({
      where: { cuit: p.cuit },
      update: {},
      create: p,
    });
  }

  console.log("✅ Proveedores demo creados");

  console.log("\n🎉 Seed completado exitosamente!");
  console.log("\n📋 Credenciales de acceso:");
  console.log("  admin@cazorla.com       → Admin (acceso total)");
  console.log("  tecnico@tomalar.com     → Tecnico Tomalar");
  console.log("  comprador@cazorla.com   → Comprador");
  console.log("  finanzas@cazorla.com    → Finanzas");
  console.log("  almacen@tomalar.com     → Almacen Tomalar");
  console.log("  Contraseña: compras2024");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
