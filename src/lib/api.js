import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const http = axios.create({ baseURL: API });

export const fetchStatus = async () => (await http.get("/status")).data;
export const fetchOptions = async () => (await http.get("/filters/options")).data;
export const fetchItl = async (level, itl1 = [], itl2 = []) => {
  const params = new URLSearchParams();
  params.append("level", level);
  (itl1 || []).forEach((v) => params.append("itl1", v));
  (itl2 || []).forEach((v) => params.append("itl2", v));
  return (await http.get("/filters/itl", { params })).data;
};
export const fetchValues = async (field, q, limit = 50) =>
  (await http.get("/filters/values", { params: { field, q: q || undefined, limit } })).data;
export const fetchCompare = async (dimension, names) =>
  (await http.post("/compare", { dimension, names })).data;
export const fetchOverlapLeaderboard = async (dimension, name, top = 15) =>
  (await http.post("/overlap-leaderboard", { dimension, name, top })).data;
export const fetchAnalytics = async (filters) => (await http.post("/analytics", filters)).data;
export const fetchFastestGrowth = async (filters, params) =>
  (await http.post("/fastest-growth", filters, { params })).data;
export const fetchGrowthDrivers = async (payload) =>
  (await http.post("/growth-drivers", payload)).data;
export const exportGrowthCsv = async (filters, params) => {
  const res = await http.post("/fastest-growth/export", filters, { params, responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  const disp = res.headers["content-disposition"] || "";
  const m = disp.match(/filename="?([^"]+)"?/);
  a.download = m ? m[1] : "growth.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};
export const fetchMap = async (filters) => (await http.post("/map", filters)).data;
export const fetchTable = async (filters, page, pageSize, sortBy, sortDir) =>
  (await http.post("/table", filters, { params: { page, page_size: pageSize, sort_by: sortBy, sort_dir: sortDir } })).data;
export const runSync = async () => (await http.post("/admin/sync")).data;

export const exportCsv = async (filters) => {
  const res = await http.post("/export", filters, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  const disp = res.headers["content-disposition"] || "";
  const match = disp.match(/filename="?([^"]+)"?/);
  a.download = match ? match[1] : "vacancies.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};
