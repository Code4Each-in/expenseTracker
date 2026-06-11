export const APP_NAME = "Family Expense Tracker";

// Category names must match DB seed values exactly
export const CATEGORY_NAMES = [
  "Food",
  "Fuel",
  "Medical",
  "Shopping",
  "Blinkit",
  "Utilities",
  "Education",
  "Travel",
  "Entertainment",
  "Other",
] as const;

export type CategoryName = (typeof CATEGORY_NAMES)[number];

// Maps category name → Claude-recognised aliases for AI parsing
export const CATEGORY_ALIASES: Record<string, CategoryName> = {
  // Food
  food: "Food",
  grocery: "Food",
  groceries: "Food",
  vegetables: "Food",
  fruit: "Food",
  milk: "Food",
  restaurant: "Food",
  eating: "Food",
  breakfast: "Food",
  lunch: "Food",
  dinner: "Food",
  snack: "Food",

  // Fuel
  fuel: "Fuel",
  petrol: "Fuel",
  diesel: "Fuel",
  gas: "Fuel",

  // Medical
  medical: "Medical",
  medicine: "Medical",
  medicines: "Medical",
  pharmacy: "Medical",
  doctor: "Medical",
  hospital: "Medical",
  health: "Medical",
  healthcare: "Medical",

  // Shopping
  shopping: "Shopping",
  clothes: "Shopping",
  clothing: "Shopping",
  apparel: "Shopping",

  // Blinkit
  blinkit: "Blinkit",
  "quick commerce": "Blinkit",
  "quick delivery": "Blinkit",
  "instant delivery": "Blinkit",
  "grocery delivery": "Blinkit",
  zepto: "Blinkit",
  instamart: "Blinkit",
  swiggy: "Blinkit",

  // Utilities
  utilities: "Utilities",
  electricity: "Utilities",
  water: "Utilities",
  internet: "Utilities",
  phone: "Utilities",
  mobile: "Utilities",
  recharge: "Utilities",
  bill: "Utilities",

  // Education
  education: "Education",
  school: "Education",
  college: "Education",
  fees: "Education",
  tuition: "Education",
  books: "Education",
  stationery: "Education",

  // Travel
  travel: "Travel",
  transport: "Travel",
  taxi: "Travel",
  auto: "Travel",
  bus: "Travel",
  train: "Travel",
  flight: "Travel",
  uber: "Travel",
  ola: "Travel",

  // Entertainment
  entertainment: "Entertainment",
  movies: "Entertainment",
  movie: "Entertainment",
  cinema: "Entertainment",
  games: "Entertainment",
  outing: "Entertainment",

  // Other
  other: "Other",
};

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: "LayoutDashboard" },
  { href: "/add", label: "Add", icon: "PlusCircle" },
  { href: "/expenses", label: "History", icon: "Receipt" },
  { href: "/reports", label: "Reports", icon: "BarChart2" },
  { href: "/profile", label: "Profile", icon: "User" },
] as const;
