import type { Supplier } from "@/types";

// City-level coordinates for mapped suppliers [lon, lat].
// Shared by GeoRiskMap (pin placement) and live-event API routes (proximity matching).
export const SUPPLIER_COORDS: Record<string, [number, number]> = {
  // Governed WB suppliers
  sit: [11.88, 45.41],   gru: [9.65, 56.37],   dan: [9.75, 55.07],
  gfp: [8.63, 47.70],    dbs: [7.01, 51.46],   ebm: [9.87, 49.35],
  aal: [5.17, 52.03],
  // Governed US suppliers
  sen: [-71.28, 41.94],
  flx: [103.82, 1.35],   zhp: [114.06, 22.55], hay: [-86.13, 40.49],
  eme: [-90.44, 38.68],  phn: [-81.53, 41.24], hon: [-80.84, 35.23],
  xpo: [-73.19, 41.18],  mog: [-78.63, 42.88],
  // Extra WB suppliers — city-level
  wil: [7.47, 51.51],    bel: [8.84, 47.30],   imi: [11.97, 57.71],
  cal: [8.40, 45.63],    rfl: [7.89, 51.76],   ovn: [8.49, 51.36],
  ork: [-2.17, 43.05],   cmp: [2.49, 47.10],   rha: [12.04, 50.25],
  upo: [25.03, 60.29],   wav: [6.09, 52.52],   nrm: [8.84, 50.15],
  bwt: [13.35, 47.86],   fnx: [-0.60, 51.50],  flu: [5.20, 52.38],
  san: [7.22, 51.54],    gfc: [8.41, 45.76],   pgy: [-1.13, 53.52],
  jgu: [-0.47, 51.51],   hzr: [16.37, 48.21],  sch: [2.19, 48.88],
  abb: [8.31, 47.47],    sbt: [8.52, 47.17],   hon_eu: [-0.75, 51.42],
  zeh: [8.09, 47.36],    wtt: [2.33, 48.87],   rth: [8.57, 50.86],
  pnx: [7.49, 47.47],    kst: [9.93, 56.04],   dfp: [9.59, 54.91],
  tcs: [4.83, 45.75],    ecl: [13.93, 56.84],  itw: [9.02, 48.68],
  tkf: [9.18, 48.78],    sps: [-0.40, 51.66],  bko: [6.08, 50.78],
  spr: [5.39, 51.51],    lds: [9.49, 51.31],   vmx: [23.76, 61.50],
  kmd: [7.15, 51.27],    tos: [-1.79, 51.56],  dhl_eu: [7.10, 50.73],
  // Extra US suppliers — city-level
  ttc: [-71.41, 41.82],  amk: [-75.44, 40.04],  rpr: [-82.54, 27.34],
  itx: [-87.82, 42.07],  rpm: [-81.86, 41.14],  kwn: [-83.74, 42.28],
  crs: [-80.83, 35.50],  clx: [-111.93, 33.49], wst: [-75.66, 40.03],
  grc: [-93.26, 44.98],  wfw: [-71.13, 42.69],  eby: [-79.62, 40.33],
  rxi: [-87.91, 43.04],  tri: [-122.04, 37.37], cvi: [-76.82, 39.12],
  mkf: [-87.63, 41.88],  bdn: [-94.39, 35.39],  brs: [-72.94, 41.67],
  esb: [-122.20, 47.61], lbo: [-72.52, 41.78],  csp: [-82.45, 38.42],
  npc: [-82.35, 36.31],  pxi: [-117.82, 33.68], awi: [-78.18, 39.19],
  sxc: [-88.08, 41.79],  mxm: [-81.44, 41.52],  kmt: [-79.38, 40.32],
  hxl: [-73.54, 41.05],  trx: [-83.25, 42.59],  lxt: [-2.24, 53.48],
  azz: [-97.33, 32.72],  gff: [-73.55, 40.79],  gxo: [-73.63, 41.02],
  chr: [-93.47, 44.85],  uft: [-71.17, 42.56],  bwxt: [-79.14, 37.41],
  gcf: [-114.31, 48.20], wkc: [-79.99, 40.44],  hub: [-73.08, 41.32],
  cts: [-88.09, 41.78],  kic: [-95.37, 29.76],
};

// Country code → center coordinates fallback [lon, lat]
export const COUNTRY_COORDS: Record<string, [number, number]> = {
  GB: [-2.0,   54.0],  DE: [10.45,  51.17], IT: [12.57, 41.87],
  NL: [5.29,   52.13], DK: [9.50,   56.26], CH: [8.23,  46.82],
  FR: [2.21,   46.23], ES: [-3.75,  40.46], PL: [19.15, 51.92],
  CN: [104.19, 35.86], JP: [138.25, 36.20], US: [-95.71, 37.09],
  KR: [127.77, 35.91], IN: [78.96,  20.59], BR: [-51.93, -14.24],
  MX: [-102.55, 23.63], CA: [-106.35, 56.13], AU: [133.78, -25.27],
  SE: [18.64,  60.13], NO: [8.47,   60.47], FI: [25.75, 61.92],
  AT: [14.55,  47.52], BE: [4.47,   50.50], CZ: [15.47, 49.82],
  TR: [35.24,  38.96], TW: [120.96, 23.70], SG: [103.82,  1.35],
  RO: [24.97,  45.94], PT: [-8.22,  39.40], HU: [19.50, 47.16],
};

export function supplierCoords(s: Supplier): [number, number] | null {
  if (SUPPLIER_COORDS[s.id]) return SUPPLIER_COORDS[s.id];
  if (s.countryCode && COUNTRY_COORDS[s.countryCode]) return COUNTRY_COORDS[s.countryCode];
  return null;
}

// Great-circle distance in km between [lon, lat] pairs
export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
