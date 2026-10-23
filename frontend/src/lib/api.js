import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
export const WS_URL = `${process.env.REACT_APP_BACKEND_URL.replace(/^http/, "ws")}/api/ws/chat`;

const api = axios.create({ baseURL: API, withCredentials: true });
// Autentificarea admin se face exclusiv prin cookie httpOnly — fără token în localStorage.

export function formatApiError(e) {
  const detail = e?.response?.data?.detail;
  if (detail == null) return e?.message || "Ceva nu a mers. Încearcă din nou.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((x) => x?.msg || JSON.stringify(x)).join(" ");
  return String(detail);
}

export function mediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${process.env.REACT_APP_BACKEND_URL}${url}`;
}

export function getSid() {
  let s = sessionStorage.getItem("bioxic_radio_sid");
  if (!s) {
    s = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("bioxic_radio_sid", s);
  }
  return s;
}

export default api;
