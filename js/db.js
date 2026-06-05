// Molinera Local-First Database Manager

const STORAGE_KEY = "molinera_local_db";

const INITIAL_STATE = {
  version: "1.2.0",
  onboarding_completed: true,
  access_code_validated: false,
  access_role: null,
  ultimo_cambio: "",
  perfil_raiz: {
    fecha_nacimiento: null,
    ciclo: { tipo_seguimiento: null, estado_biologico: "no_especificado", duracion_promedio_ciclo: null, historial_csv_cargado: false, historial_resumen: null, fase_actual: "menstrual" },
    perfil_mtc: { day_master: "", elemento_dominante: "", elemento_deficiente: "", patron_fisiologico: "" },
    reglas_nutricionales: { allergies: [], intolerances: [], filosofia_alimenticia: "ninguna", objetivos: [] },
    limites_energia: { tiempo_maximo_batch_cooking_minutos: 120 }
  },
  taller: {
    maquinaria: [
      { id: "hornilla", name: "Hornilla de Inducción", desc: "4 zonas activas", category: "coccion", owned: false },
      { id: "airfryer", name: "Airfryer Pro", desc: "Capacidad XL", category: "coccion", owned: false },
      { id: "horno", name: "Horno Convencional", desc: "Hasta 250°C", category: "coccion", owned: false },
      { id: "olla_presion_lenta", name: "Olla de Presión / Lenta", desc: "Eléctrica multiusos", category: "coccion", owned: false },
      { id: "licuadora_alta_potencia", name: "Licuadora Alta Potencia", desc: "Para batidos y salsas", category: "procesamiento", owned: false },
      { id: "procesador_alimentos", name: "Procesador de Alimentos", desc: "Rallado y picado", category: "procesamiento", owned: false }
    ],
    utensilios: [
      { id: "olla_grande", name: "Olla Grande", desc: "Para caldos y pastas", category: "ollas_sartenes", owned: false },
      { id: "sarten_antiadherente", name: "Sartén Antiadherente", desc: "Mediana multiusos", category: "ollas_sartenes", owned: false },
      { id: "tabla_picar", name: "Tabla de Picar", desc: "Madera o plástico", category: "cuchillos_corte", owned: false },
      { id: "colador", name: "Colador / Pasapuré", desc: "Malla fina de acero", category: "herramientas", owned: false },
      { id: "balanza_cocina", name: "Balanza de Cocina", desc: "Precisión en gramos", category: "medicion", owned: false },
      { id: "rallador", name: "Rallador de Queso/Verduras", desc: "Multiusos 4 caras", category: "cuchillos_corte", owned: false }
    ],
    almacenamiento: [
      { id: "vidrio_hermetico", name: "Vidrio Hermético", desc: "Capacidad: 2.5L", category: "grandes", count: 0 },
      { id: "contenedor_cereal", name: "Contenedor Cereal", desc: "Capacidad: 3L", category: "grandes", count: 0 },
      { id: "bowls_mezcladores", name: "Bowls Mezcladores", desc: "Capacidad: 4L", category: "grandes", count: 0 },
      { id: "tupperware_prep", name: "Tupperware Prep", desc: "Capacidad: 1L", category: "medianos", count: 0 },
      { id: "frascos_mason", name: "Frascos Mason", desc: "Capacidad: 600ml", category: "medianos", count: 0 },
      { id: "bolsas_reutilizables", name: "Bolsas Reutilizables", desc: "Capacidad: 750ml", category: "medianos", count: 0 },
      { id: "especieros", name: "Especieros", desc: "Capacidad: 150ml", category: "pequenos", count: 0 },
      { id: "salseros", name: "Salseros", desc: "Capacidad: 200ml", category: "pequenos", count: 0 }
    ]
  },
  despensa_viva: {
    alacena_maestra: [],
    alacena: {}
  },
  ejecucion: {
    tipo_planificacion: "semanal",
    rescate_perecederos: ""
  }
};

const DB = {
  load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return this.save(INITIAL_STATE);
      }
      const parsed = JSON.parse(data);
      
      // Bump version to 1.2.0 to force schema migrations safely
      if (parsed.version !== "1.2.0") {
        console.log("Migrando base de datos local a versión 1.2.0");
        parsed.version = "1.2.0";
        const upgraded = this._mergeWithDefaults(parsed, INITIAL_STATE);
        this._migrateCategories(upgraded);
        return this.save(upgraded);
      }
      
      const merged = this._mergeWithDefaults(parsed, INITIAL_STATE);
      this._migrateCategories(merged);
      return merged;
    } catch (e) {
      console.error("Error loading database:", e);
      return INITIAL_STATE;
    }
  },

  save(state) {
    try {
      state.ultimo_cambio = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state, null, 2));
      return state;
    } catch (e) {
      console.error("Error saving database:", e);
      return state;
    }
  },

  reset() {
    localStorage.removeItem(STORAGE_KEY);
    return INITIAL_STATE;
  },

  exportToFile(state) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `molinera_respaldo_db_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  validateAndImport(jsonString, currentAccess = { access_code_validated: true, access_role: "creadora" }) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.taller || !parsed.despensa_viva) {
        throw new Error("Estructura de Molinera inválida.");
      }
      
      // Preserve access role to prevent logout after import
      parsed.access_code_validated = currentAccess.access_code_validated;
      parsed.access_role = currentAccess.access_role;
      
      // Enforce 1.2.0 arrays migrations
      parsed.version = "1.2.0";
      const merged = this._mergeWithDefaults(parsed, INITIAL_STATE);
      this._migrateCategories(merged);
      this.save(merged);
      return { success: true, state: merged };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  _migrateCategories(state) {
    if (state && state.taller) {
      if (state.taller.maquinaria) {
        const machCats = {
          hornilla: "coccion",
          airfryer: "coccion",
          horno: "coccion",
          olla_presion_lenta: "coccion",
          licuadora_alta_potencia: "procesamiento",
          procesador_alimentos: "procesamiento"
        };
        state.taller.maquinaria.forEach(item => {
          if (!item.category) {
            item.category = machCats[item.id] || "otros";
          }
        });
      }
      if (state.taller.utensilios) {
        const utenCats = {
          olla_grande: "ollas_sartenes",
          sarten_antiadherente: "ollas_sartenes",
          tabla_picar: "cuchillos_corte",
          colador: "herramientas",
          balanza_cocina: "medicion",
          rallador: "cuchillos_corte"
        };
        state.taller.utensilios.forEach(item => {
          if (!item.category) {
            item.category = utenCats[item.id] || "otros";
          }
        });
      }
    }
  },

  _mergeWithDefaults(target, source) {
    const output = Object.assign({}, source);
    if (target && typeof target === 'object') {
      Object.keys(target).forEach(key => {
        if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
          output[key] = this._mergeWithDefaults(target[key], source[key] || {});
        } else {
          output[key] = target[key];
        }
      });
    }
    return output;
  }
};
