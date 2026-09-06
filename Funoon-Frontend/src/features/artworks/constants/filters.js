import {
  CATEGORIES,
  PAINT_TYPES,
  CANVAS_THICKNESS_OPTIONS,
  DIMENSION_TYPES,
} from "../../artist/config/categories";

export { CATEGORIES, PAINT_TYPES, CANVAS_THICKNESS_OPTIONS, DIMENSION_TYPES };

export const SORT_OPTIONS = [
  { value: "newest", label: "الأحدث" },
  { value: "price_asc", label: "السعر: من الأقل" },
  { value: "price_desc", label: "السعر: من الأعلى" },
  { value: "popular", label: "الأكثر شعبية" },
  { value: "most_viewed", label: "الأكثر مشاهدة" },
];

export const AVAILABILITY_OPTIONS = [
  { value: "available", label: "متاح فقط", default: true },
  { value: "all", label: "الكل (متاح ومباع)" },
  { value: "sold", label: "مباع فقط" },
];

export const SIZE_OPTIONS = [
  { value: "small", label: "صغير", description: "أقل من 30 سم" },
  { value: "medium", label: "متوسط", description: "30 - 60 سم" },
  { value: "large", label: "كبير", description: "60 - 100 سم" },
  { value: "giant", label: "ضخم", description: "أكثر من 100 سم" },
];

export const PRICE_RANGES = [
  { value: "0-1000", label: "أقل من 1,000 ر.س", min: 0, max: 1000 },
  { value: "1000-2500", label: "1,000 - 2,500 ر.س", min: 1000, max: 2500 },
  { value: "2500-4000", label: "2,500 - 4,000 ر.س", min: 2500, max: 4000 },
  { value: "4000-5000", label: "4,000 - 5,000 ر.س", min: 4000, max: 5000 },
];

export const DEFAULT_FILTERS = {
  sort: "newest",
  availability: "available",
  page: 1,
  limit: 12,
  category: [],
  medium: [],
  paintType: [],
  canvasThickness: [],
  dimensionType: [],
  city: [],
  size: [],
  tags: [],
  minPrice: null,
  maxPrice: null,
  search: "",
  verifiedArtists: false,
};
