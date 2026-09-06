const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
const SERVER_URL = API_URL.replace(/\/api\/v\d+$/, "");

export function getMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SERVER_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
