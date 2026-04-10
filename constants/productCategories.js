export const PRODUCT_CATEGORIES = [
  { key: "epices", label: "Épices", icon: "whatshot", emoji: "🌶️" },
  { key: "cereales", label: "Céréales", icon: "grass", emoji: "🌾" },
  { key: "tubercules", label: "Tubercules", icon: "agriculture", emoji: "🍠" },
  { key: "legumes", label: "Légumes", icon: "eco", emoji: "🥬" },
  { key: "fruits", label: "Fruits", icon: "apple", emoji: "🍍" },
  {
    key: "poissons",
    label: "Poissons",
    icon: "set-meal",
    emoji: "🐟",
  },
  {
    key: "viandes",
    label: "Viandes",
    icon: "restaurant",
    emoji: "🍖",
  },
  {
    key: "volailles",
    label: "Volailles",
    icon: "egg",
    emoji: "🍗",
  },
  {
    key: "surgeles",
    label: "Surgelés",
    icon: "ac-unit",
    emoji: "🧊",
  },
  {
    key: "huiles",
    label: "Huiles",
    icon: "opacity",
    emoji: "🫗",
  },
  {
    key: "farines",
    label: "Farines",
    icon: "grain",
    emoji: "🥣",
  },
  {
    key: "legumineuses",
    label: "Légumineuses",
    icon: "spa",
    emoji: "🫘",
  },
  {
    key: "sauces",
    label: "Sauces",
    icon: "soup-kitchen",
    emoji: "🍲",
  },
  {
    key: "pates",
    label: "Pâtes",
    icon: "ramen-dining",
    emoji: "🍜",
  },
  {
    key: "conserves",
    label: "Conserves",
    icon: "inventory-2",
    emoji: "🥫",
  },
  {
    key: "boissons",
    label: "Boissons",
    icon: "local-drink",
    emoji: "🥤",
  },
  {
    key: "snacks",
    label: "Snacks",
    icon: "cookie",
    emoji: "🍪",
  },
  {
    key: "produits_laitiers",
    label: "Produits laitiers",
    icon: "local-cafe",
    emoji: "🥛",
  },
  {
    key: "boulangerie",
    label: "Boulangerie",
    icon: "bakery-dining",
    emoji: "🍞",
  },
  {
    key: "autres",
    label: "Autres",
    icon: "category",
    emoji: "📦",
  },
];

export const HOME_CATEGORIES = [
  { key: "all", label: "Tout", emoji: null },
  ...PRODUCT_CATEGORIES.map((cat) => ({
    key: cat.key,
    label: cat.label,
    emoji: cat.emoji,
  })),
];

export const CATEGORY_ORDER = PRODUCT_CATEGORIES.map((cat) => cat.label);
export const CATEGORY_LABELS = PRODUCT_CATEGORIES.map((cat) => cat.label);

export const CATEGORY_LABEL_TO_KEY = PRODUCT_CATEGORIES.reduce((acc, cat) => {
  acc[cat.label] = cat.key;
  return acc;
}, {});
