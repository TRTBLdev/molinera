// Pre-configured catalog of common ingredients for the Master Pantry

const INGREDIENTS_CATALOG = [
  // Proteínas
  { id: "huevos", name: "Huevos", category: "proteinas" },
  { id: "pechuga_pollo", name: "Pechuga de Pollo", category: "proteinas" },
  { id: "carne_molida", name: "Carne Molida", category: "proteinas" },
  { id: "salmon", name: "Salmón", category: "proteinas" },
  { id: "lentejas", name: "Lentejas", category: "proteinas" },
  { id: "garbanzos", name: "Garbanzos", category: "proteinas" },
  { id: "atun_lata", name: "Atún en lata", category: "proteinas" },
  { id: "tofu", name: "Tofu", category: "proteinas" },

  // Carbohidratos
  { id: "arroz", name: "Arroz", category: "carbohidratos" },
  { id: "avena", name: "Avena", category: "carbohidratos" },
  { id: "harina_pan", name: "Harina PAN", category: "carbohidratos" },
  { id: "pasta", name: "Pasta", category: "carbohidratos" },
  { id: "quinoa", name: "Quinoa", category: "carbohidratos" },
  { id: "camote", name: "Camote / Batata", category: "carbohidratos" },
  { id: "papa", name: "Papa", category: "carbohidratos" },

  // Grasas y Aceites
  { id: "aceite_oliva", name: "Aceite de Oliva", category: "grasas" },
  { id: "aguacate", name: "Aguacate", category: "grasas" },
  { id: "almendras", name: "Almendras", category: "grasas" },
  { id: "mantequilla_mani", name: "Mantequilla de maní", category: "grasas" },
  { id: "semillas_chia", name: "Semillas de Chía", category: "grasas" },
  { id: "nueces", name: "Nueces", category: "grasas" },

  // Vegetales y Frutas
  { id: "cebolla", name: "Cebolla", category: "vegetales" },
  { id: "ajo", name: "Ajo", category: "vegetales" },
  { id: "tomate", name: "Tomate", category: "vegetales" },
  { id: "espinaca", name: "Espinaca", category: "vegetales" },
  { id: "zanahoria", name: "Zanahoria", category: "vegetales" },
  { id: "brocoli", name: "Brócoli", category: "vegetales" },
  { id: "limon", name: "Limón", category: "vegetales" },
  { id: "calabacin", name: "Calabacín", category: "vegetales" },
  { id: "platano", name: "Plátano / Banano", category: "vegetales" },

  // Básicos de Despensa
  { id: "leche", name: "Leche", category: "despensa" },
  { id: "leche_almendras", name: "Leche de Almendras", category: "despensa" },
  { id: "queso", name: "Queso", category: "despensa" },
  { id: "yogur_griego", name: "Yogur Griego", category: "despensa" },
  { id: "levadura_nutricional", name: "Levadura Nutricional", category: "despensa" },

  // Especies y Salsas
  { id: "sal", name: "Sal", category: "condimentos" },
  { id: "pimienta_negra", name: "Pimienta Negra", category: "condimentos" },
  { id: "curcuma", name: "Cúrcuma", category: "condimentos" },
  { id: "jengibre", name: "Jengibre", category: "condimentos" },
  { id: "oregano", name: "Orégano", category: "condimentos" },
  { id: "vinagre_manzana", name: "Vinagre de Manzana", category: "condimentos" },
  { id: "salsa_soya", name: "Salsa de Soya", category: "condimentos" }
];

const CATEGORY_LABELS = {
  proteinas: "Proteínas (Carnes, Legumbres, Huevos)",
  carbohidratos: "Carbohidratos (Granos, Harinas, Tubérculos)",
  grasas: "Grasas y Aceites (Semillas, Frutos Secos)",
  vegetales: "Vegetales y Frutas",
  despensa: "Básicos de Despensa (Lácteos y Alternativas)",
  condimentos: "Especias, Hierbas y Condimentos"
};
