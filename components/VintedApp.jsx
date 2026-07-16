"use client";
import React, { useState, useMemo, useEffect, useRef, useContext, createContext, useCallback } from "react";
import {
  LayoutDashboard, Search, Bell, Users, TrendingUp, Calculator,
  Package, Sparkles, Flame, CheckCircle2, AlertTriangle, XCircle,
  Clock, Percent, Euro, BarChart3, Filter, Plus, Trash2, ChevronRight,
  Download, Zap, ShieldCheck, ArrowUp, ArrowDown, Star,
  Activity, Radar, Wallet, Mic, MicOff, Send, X, MessageSquare, Volume2,
  VolumeX, RefreshCw, Target, ShieldAlert, TrendingDown, Gauge,
  Camera, Wand2, Scissors, SlidersHorizontal, UploadCloud, ImagePlus,
  Layers, Loader2, Clipboard, Maximize2, Heart, History, Command, ShoppingCart, Award, Copy, Scale
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell
} from "recharts";

/* ============================== UTILITIES ============================== */

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function euro(n) { return Math.round(n).toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }); }
function euro2(n) { return n.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }); }
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function pick(rnd, arr) { return arr[Math.floor(rnd() * arr.length)]; }
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function greetingByHour() {
  const h = new Date().getHours();
  if (h < 6) return "Buonanotte";
  if (h < 13) return "Buongiorno";
  if (h < 18) return "Buon pomeriggio";
  return "Buonasera";
}
function placeholderPhoto(seed, label) {
  const hue = ((seed % 360) + 360) % 360;
  const hue2 = (hue + 42) % 360;
  const initials = (label || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0%' stop-color='hsl(${hue},55%,32%)'/>` +
    `<stop offset='100%' stop-color='hsl(${hue2},50%,16%)'/>` +
    `</linearGradient></defs>` +
    `<rect width='400' height='300' fill='url(#g)'/>` +
    `<text x='50%' y='50%' font-family='Space Grotesk, sans-serif' font-size='64' font-weight='700' fill='white' fill-opacity='0.35' text-anchor='middle' dominant-baseline='middle'>${initials}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const BRANDS = ["Nike", "Adidas", "Stone Island", "Supreme", "The North Face", "Carhartt WIP", "Ralph Lauren", "Levi's", "New Balance", "Jordan", "Vintage Anni '90"];
const CATEGORIES = ["Sneakers", "Streetwear", "Vintage", "Maglie da calcio", "Giacche", "Felpe", "Accessori"];
const SIZES = ["XS", "S", "M", "L", "XL", "38", "40", "42", "44", "46"];
const COLORS_LIST = ["Nero", "Bianco", "Blu", "Verde", "Grigio", "Beige", "Rosso"];
const CONDITIONS = ["Nuovo con etichetta", "Ottimo", "Buono", "Discreto"];
const COUNTRIES = ["Italia", "Francia", "Germania", "Spagna", "Paesi Bassi", "Belgio"];
const MATERIALS = ["Cotone", "Poliestere", "Lana", "Nylon", "Denim", "Pelle", "Misto cotone"];
const SELLER_NAMES = ["vintage_hub", "streetstyle82", "closet_deals", "milanoresell", "euro_kicks", "retro_wardrobe", "napoli_thrift", "urbanarchive", "sneakhouse", "wardrobe_flip"];
const BRAND_TIER = {
  "Stone Island": 2.4, "Supreme": 2.6, "Jordan": 1.9, "Nike": 1.3, "Adidas": 1.25,
  "The North Face": 1.6, "Carhartt WIP": 1.4, "Ralph Lauren": 1.35, "Levi's": 1.1,
  "New Balance": 1.2, "Vintage Anni '90": 1.5,
};

function matchBrand(query) {
  if (!query) return null;
  const q = query.toLowerCase();
  return BRANDS.find((b) => q.includes(b.toLowerCase().split(" ")[0])) || null;
}
function badgeForScore(score) {
  if (score >= 85) return { label: "Compra subito", icon: "🔥", cls: "badge-fire" };
  if (score >= 70) return { label: "Buona occasione", icon: "✅", cls: "badge-good" };
  if (score >= 50) return { label: "Rischio medio", icon: "⚠️", cls: "badge-warn" };
  return { label: "Non conviene", icon: "❌", cls: "badge-bad" };
}
function riskForScore(score) {
  if (score >= 75) return "Basso";
  if (score >= 50) return "Medio";
  return "Alto";
}

function generateResults(query, count = 9) {
  const seed = hashCode((query || "streetwear").toLowerCase().trim());
  const rnd = mulberry32(seed);
  const forcedBrand = matchBrand(query);
  const items = [];
  for (let i = 0; i < count; i++) {
    const brand = forcedBrand || pick(rnd, BRANDS);
    const tier = BRAND_TIER[brand] || 1.3;
    const basePrice = 15 + Math.floor(rnd() * 90);
    const price = Math.round(basePrice * (0.85 + rnd() * 0.3));
    const marketAvg = Math.round(price * (0.95 + rnd() * 0.35));
    const resaleAvg = Math.round(marketAvg * tier * (0.9 + rnd() * 0.35));
    const shippingCost = 5 + Math.floor(rnd() * 4);
    const profit = Math.round(resaleAvg - price - shippingCost);
    const roi = Math.round((profit / price) * 1000) / 10;
    const demandRoll = rnd();
    const demand = demandRoll > 0.62 ? "Alta" : demandRoll > 0.3 ? "Media" : "Bassa";
    const compRoll = rnd();
    const competition = compRoll > 0.6 ? "Alta" : compRoll > 0.3 ? "Media" : "Bassa";
    const saleTime = demand === "Alta" ? 3 + Math.floor(rnd() * 8)
      : demand === "Media" ? 10 + Math.floor(rnd() * 16)
      : 25 + Math.floor(rnd() * 35);
    let score = 50;
    score += Math.min(30, roi / 3);
    score += demand === "Alta" ? 12 : demand === "Media" ? 4 : -8;
    score -= competition === "Alta" ? 10 : competition === "Media" ? 2 : -6;
    score -= saleTime > 30 ? 8 : 0;
    score = clamp(Math.round(score + (rnd() * 10 - 5)), 5, 98);
    const badge = badgeForScore(score);
    const sellProbability = clamp(Math.round(40 + (demand === "Alta" ? 30 : demand === "Media" ? 12 : -10) - (competition === "Alta" ? 12 : 0) + score * 0.2), 5, 98);
    const idealPrice = Math.round((marketAvg + resaleAvg) / 2 * 0.93);
    const material = pick(rnd, MATERIALS);
    const year = 1994 + Math.floor(rnd() * 31);
    const limitedEdition = rnd() > 0.78;
    const seller = pick(rnd, SELLER_NAMES) + Math.floor(rnd() * 90);
    const sellerReviews = 8 + Math.floor(rnd() * 480);
    const condition = pick(rnd, CONDITIONS);
    const priceHistory = Array.from({ length: 8 }, (_, h) => Math.round(marketAvg * (0.88 + h * 0.02 + (rnd() - 0.5) * 0.05)));
    const strengths = [];
    const weaknesses = [];
    if (roi > 55) strengths.push("Margine ampio rispetto al prezzo di mercato");
    if (demand === "Alta") strengths.push("Domanda elevata per questo brand/categoria");
    if (competition === "Bassa") strengths.push("Bassa concorrenza tra venditori");
    if (limitedEdition) strengths.push("Edizione limitata: valore percepito più alto");
    if (strengths.length === 0) strengths.push("Prezzo in linea con il valore reale di mercato");
    if (competition === "Alta") weaknesses.push("Molti venditori propongono articoli simili");
    if (demand === "Bassa") weaknesses.push("Domanda contenuta: vendita potenzialmente lenta");
    if (condition === "Discreto") weaknesses.push("Condizioni dichiarate non ottimali");
    if (saleTime > 25) weaknesses.push("Tempo di vendita stimato superiore alla media");
    if (weaknesses.length === 0) weaknesses.push("Nessuna debolezza significativa rilevata");
    const buyStrategy = price <= idealPrice ? "Acquista ora: il prezzo richiesto è già sotto il valore ideale stimato." : `Prova a negoziare verso ${euro2(idealPrice)} prima di acquistare.`;
    const sellStrategy = demand === "Alta" ? "Vendita rapida: proponi un prezzo vicino al valore di mercato." : "Punta su un prezzo leggermente competitivo per accelerare la vendita.";
    items.push({
      id: `${seed}-${i}`,
      title: `${brand} ${pick(rnd, CATEGORIES)} ${pick(rnd, ["'90", "'00", "Retro", "Icon", "Classic", "Edition"])}`,
      brand, category: pick(rnd, CATEGORIES), size: pick(rnd, SIZES),
      color: pick(rnd, COLORS_LIST), condition,
      country: pick(rnd, COUNTRIES), material, year, limitedEdition, seller, sellerReviews, priceHistory,
      strengths, weaknesses, buyStrategy, sellStrategy,
      price, marketAvg, resaleAvg, shippingCost, profit, roi, demand, competition,
      saleTime, score, badge, sellProbability, idealPrice, risk: riskForScore(score),
      photo: placeholderPhoto(seed + i, brand),
    });
  }
  return items.sort((a, b) => b.score - a.score);
}

function generateSellers(seedBase, count = 8) {
  const rnd = mulberry32(hashCode(seedBase + "-sellers"));
  const names = ["vintage_hub", "streetstyle82", "closet_deals", "milanoresell", "euro_kicks", "retro_wardrobe", "napoli_thrift", "urbanarchive", "sneakhouse", "wardrobe_flip"];
  return Array.from({ length: count }, (_, i) => {
    const reviews = 20 + Math.floor(rnd() * 900);
    const reliability = Math.round(60 + rnd() * 39);
    const responseTime = 1 + Math.floor(rnd() * 24);
    const freq = Math.round(1 + rnd() * 9);
    const aiScore = clamp(Math.round(reliability * 0.6 + (freq * 3) + (reviews > 300 ? 8 : 0) - responseTime * 0.3), 10, 99);
    return { id: i, name: names[i % names.length] + (i > 9 ? i : ""), reviews, reliability, responseTime, freq, aiScore };
  }).sort((a, b) => b.aiScore - a.aiScore);
}

function genTrend(days, seedKey) {
  const rnd = mulberry32(hashCode(seedKey + days));
  const points = [];
  let val = 40 + rnd() * 20;
  const step = days === 30 ? 1 : days === 90 ? 4 : 15;
  for (let d = 0; d <= days; d += step) {
    val += (rnd() - 0.45) * 3.2;
    val = Math.max(10, val);
    points.push({ day: `G${d}`, prezzo: Math.round(val * 1.4), venditaGiorni: Math.round(8 + Math.abs(Math.sin(d)) * 12) });
  }
  return points;
}

const PROFIT_TREND = Array.from({ length: 12 }, (_, i) => {
  const rnd = mulberry32(i * 977 + 42);
  return { mese: ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"][i], profitto: Math.round(320 + i * 65 + rnd() * 180) };
});
const TOP_BRANDS_DATA = BRANDS.slice(0, 8).map((b) => {
  const rnd = mulberry32(hashCode(b) + 7);
  return { brand: b.length > 12 ? b.slice(0, 11) + "." : b, fullBrand: b, domanda: Math.round(40 + rnd() * 58) };
}).sort((a, b) => b.domanda - a.domanda);
const CATEGORY_SPLIT = CATEGORIES.map((c) => {
  const rnd = mulberry32(hashCode(c) + 3);
  return { name: c, value: Math.round(8 + rnd() * 22) };
}).sort((a, b) => b.value - a.value);
const PIE_COLORS = ["#00e28a", "#3b82f6", "#f5b93d", "#8b7bff", "#ff5470", "#22c1c3", "#e879f9"];
const HEATMAP_BRANDS = BRANDS.slice(0, 6);
const HEATMAP_CATS = CATEGORIES.slice(0, 6);
const HEATMAP_DATA = HEATMAP_BRANDS.map((b) => HEATMAP_CATS.map((c) => Math.round(18 + mulberry32(hashCode(b + c))() * 78)));
const LIVE_DEALS_FEED = [
  "🔥 Stone Island giubbotto badge — profitto stimato €142 (ROI 96%)",
  "✅ Nike Air Max '97 taglia 42 — profitto stimato €38 (ROI 61%)",
  "🔥 Supreme box logo felpa — profitto stimato €210 (ROI 130%)",
  "⚠️ Adidas Originals track top — profitto stimato €14 (ROI 22%)",
  "✅ Ralph Lauren maglione vintage — profitto stimato €29 (ROI 58%)",
  "🔥 Jordan 4 Retro — profitto stimato €95 (ROI 88%)",
  "✅ Carhartt WIP giacca detroit — profitto stimato €41 (ROI 65%)",
  "⚠️ Levi's 501 vintage — profitto stimato €9 (ROI 19%)",
  "🔥 Maglia calcio vintage anni '90 — profitto stimato €58 (ROI 105%)",
];
const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "search", label: "Ricerca AI", icon: Search },
  { key: "insights", label: "AI Insights", icon: Sparkles },
  { key: "alerts", label: "Alert", icon: Bell },
  { key: "sellers", label: "Venditori", icon: Users },
  { key: "market", label: "Mercato", icon: TrendingUp },
  { key: "calculator", label: "Calcolatore", icon: Calculator },
  { key: "inventory", label: "Inventario", icon: Package },
  { key: "listing", label: "AI Listing", icon: Sparkles },
  { key: "photostudio", label: "AI Photo Studio", icon: Camera },
  { key: "negotiation", label: "Negoziazione AI", icon: Scale },
  { key: "chatanalyzer", label: "Chat Analyzer", icon: MessageSquare },
  { key: "trendhunter", label: "Trend & Restock", icon: Radar },
];

const HIGHLIGHT_KEYS = [
  "kpi-profit", "kpi-roi", "kpi-today", "kpi-monitored", "kpi-monthly",
  "chart-trend", "chart-brands", "chart-market-price", "chart-market-time",
  "chart-category", "search-results", "insights-panel",
];

/* ============================== SPEECH ============================== */

function estimateMs(text) {
  const words = (text || "").split(/\s+/).filter(Boolean).length;
  return clamp(words * 340, 900, 9000);
}
function getItalianVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const all = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
  const italian = all.filter((v) => v.lang && v.lang.toLowerCase().startsWith("it"));
  return italian.length ? italian : all;
}
function scoreVoiceQuality(v) {
  const n = (v.name || "").toLowerCase();
  let score = 0;
  if (v.lang && v.lang.toLowerCase().startsWith("it")) score += 50;
  if (!v.localService) score += 20; // cloud/neural voices are usually online
  if (/neural|premium|enhanced|naturale|wavenet|online/.test(n)) score += 30;
  if (/google/.test(n)) score += 18;
  if (/(elsa|federica|alice|luca|paolo|cosimo|giorgio)/.test(n)) score += 12;
  if (/microsoft/.test(n)) score += 8;
  if (/compact|espeak|robot/.test(n)) score -= 25;
  return score;
}
function pickBestItalianVoice(voices) {
  if (!voices.length) return null;
  return [...voices].sort((a, b) => scoreVoiceQuality(b) - scoreVoiceQuality(a))[0];
}
function speakBeat(text, voiceEnabled, setSpeaking, voiceURI) {
  return new Promise((resolve) => {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      const t = setTimeout(resolve, estimateMs(text));
      return () => clearTimeout(t);
    }
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const all = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
      const chosen = (voiceURI && all.find((v) => v.voiceURI === voiceURI)) || pickBestItalianVoice(getItalianVoices());
      if (chosen) { u.voice = chosen; u.lang = chosen.lang || "it-IT"; } else { u.lang = "it-IT"; }
      u.rate = 0.97; u.pitch = 1.02; u.volume = 1;
      let done = false;
      const finish = () => { if (!done) { done = true; setSpeaking(false); resolve(); } };
      u.onend = finish; u.onerror = finish;
      setSpeaking(true);
      window.speechSynthesis.speak(u);
      setTimeout(finish, estimateMs(text) + 3000);
    } catch (e) {
      setSpeaking(false);
      setTimeout(resolve, estimateMs(text));
    }
  });
}
function recognizeOnce() {
  return new Promise((resolve, reject) => {
    const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) { reject(new Error("unsupported")); return; }
    try {
      const rec = new SR();
      rec.lang = "it-IT"; rec.interimResults = false; rec.maxAlternatives = 1;
      rec.onresult = (e) => resolve(e.results[0][0].transcript);
      rec.onerror = (e) => reject(new Error(e.error || "speech-error"));
      rec.start();
    } catch (e) { reject(e); }
  });
}
function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
}

async function callClaudePhrase(kind, facts, question) {
  const system = `Sei un AI Market Analyst per una piattaforma di reselling su Vinted. Parli come un analista finanziario professionista: diretto, sicuro, frasi brevi e dichiarative in italiano, mai colloquiale come un chatbot generico. Riceverai fatti numerici gia calcolati: usa SOLO quei numeri, non inventarne altri e non aggiungere cifre nuove. Rispondi ESCLUSIVAMENTE con un oggetto JSON valido, senza testo fuori dal JSON, in questa forma esatta: {"beats":[{"text":"frase breve","highlight":"una-chiave-o-null"}]}. Chiavi di evidenziazione valide: ${HIGHLIGHT_KEYS.join(", ")}. Genera da 2 a 5 beats, ciascuno di massimo 22 parole.`;
  const userMsg = JSON.stringify({ tipo: kind, domanda: question || null, fatti: facts });
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 700, system, messages: [{ role: "user", content: userMsg }] }),
  });
  if (!resp.ok) throw new Error("api-error");
  const data = await resp.json();
  const textBlock = (data.content || []).find((c) => c.type === "text");
  if (!textBlock) throw new Error("no-text");
  let clean = textBlock.text.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(clean);
  if (!parsed.beats || !Array.isArray(parsed.beats) || !parsed.beats.length) throw new Error("bad-shape");
  return parsed;
}

/* ============================== LOCAL ANALYST PLANS ============================== */

function buildBriefingPlan(facts, userName) {
  const hello = greetingByHour();
  const beats = [
    { text: `${hello}${userName ? ", " + userName : ""}.`, highlight: null },
    { text: `Ho analizzato ${facts.totalListings.toLocaleString("it-IT")} inserzioni attive sul mercato.`, highlight: "kpi-monitored" },
    { text: `Oggi ho individuato ${facts.dealsToday} occasioni con ROI superiore al 70 per cento.`, highlight: "kpi-today" },
    { text: `Il profitto stimato è variato del ${facts.profitDelta >= 0 ? "+" : ""}${facts.profitDelta}% rispetto al periodo precedente.`, highlight: "kpi-profit" },
    { text: `${facts.topGrowthBrand} è il brand con la crescita maggiore in questo momento.`, highlight: "chart-brands" },
    { text: `Ti consiglio di controllare ${facts.suggestionCategory}: margini interessanti e concorrenza ancora contenuta.`, highlight: "search-results" },
  ];
  return { beats, navigateTo: null, sideEffect: null, facts };
}

function buildChartPlan(chartId, extra) {
  let beats = [];
  if (chartId === "chart-trend") {
    beats = [
      { text: `Il profitto mensile mostra un trend del ${extra.changePct >= 0 ? "+" : ""}${extra.changePct}% da inizio periodo.`, highlight: "chart-trend" },
      { text: extra.changePct >= 0 ? "La crescita è sostenuta da un aumento delle occasioni ad alto ROI individuate ogni settimana." : "Il rallentamento è legato a una maggiore concorrenza nelle categorie principali.", highlight: "chart-trend" },
    ];
  } else if (chartId === "chart-brands") {
    beats = [
      { text: `${extra.topBrand} guida la domanda con un indice di ${extra.topValue} su 100.`, highlight: "chart-brands" },
      { text: `Il distacco dal secondo brand è di ${extra.gap} punti: un segnale di forte preferenza del mercato.`, highlight: "chart-brands" },
    ];
  } else if (chartId === "chart-market-price") {
    beats = [
      { text: `Negli ultimi ${extra.range} giorni il prezzo medio è ${extra.changePct >= 0 ? "aumentato" : "diminuito"} del ${Math.abs(extra.changePct)}%.`, highlight: "chart-market-price" },
      { text: extra.changePct >= 0 ? "Questo è coerente con un aumento della domanda e una riduzione dell'offerta disponibile." : "La discesa suggerisce un'offerta più ampia rispetto alla domanda attuale.", highlight: "chart-market-price" },
      { text: extra.changePct >= 0 ? "Se il trend continua, il prezzo medio potrebbe aumentare ancora nelle prossime settimane." : "Potrebbe essere il momento giusto per acquistare prima di una possibile ripresa dei prezzi.", highlight: "chart-market-price" },
    ];
  } else if (chartId === "chart-market-time") {
    beats = [
      { text: `Il tempo medio di vendita in questo periodo è di ${extra.avgDays} giorni.`, highlight: "chart-market-time" },
      { text: extra.avgDays < 15 ? "Un valore basso indica un mercato liquido, con occasioni che si esauriscono in fretta." : "Un valore elevato suggerisce di puntare su prezzi più competitivi per accelerare la vendita.", highlight: "chart-market-time" },
    ];
  } else if (chartId === "chart-category") {
    beats = [
      { text: `${extra.topCategory} rappresenta la quota maggiore del mercato monitorato, con circa il ${extra.topShare}% degli annunci.`, highlight: "chart-category" },
      { text: `${extra.lowCategory} resta la categoria più marginale: tempi di vendita mediamente più lunghi.`, highlight: "chart-category" },
    ];
  } else {
    beats = [{ text: "Ho analizzato il grafico selezionato: i valori restano in linea con la media storica.", highlight: chartId }];
  }
  return { beats, navigateTo: null, sideEffect: null, facts: extra, selfHighlight: chartId };
}

function buildAnswerPlan(question, ctx) {
  const q = question.toLowerCase();
  let beats = []; let navigateTo = null; let sideEffect = null;

  if (q.includes("miglior affare") || (q.includes("affare") && q.includes("oggi"))) {
    const d = ctx.bestDeal;
    beats = [
      { text: `Il miglior affare individuato oggi è ${d.title}, proposto a ${euro2(d.price)}.`, highlight: "search-results" },
      { text: `Profitto stimato di ${euro2(d.profit)}, ROI del ${d.roi}% e punteggio AI di ${d.score} su 100.`, highlight: "search-results" },
    ];
    navigateTo = "search"; sideEffect = { type: "searchQuery", value: d.brand };
  } else if (q.includes("maglie") && q.includes("nike")) {
    beats = [{ text: "Ecco le migliori occasioni Nike disponibili ora, ordinate per punteggio AI.", highlight: "search-results" }];
    navigateTo = "search"; sideEffect = { type: "searchQuery", value: "Nike" };
  } else if (q.includes("profitto") && /\d/.test(q)) {
    const m = q.match(/(\d+)/); const val = m ? Number(m[1]) : 40;
    beats = [{ text: `Ho filtrato gli annunci con profitto stimato superiore a ${euro(val)}.`, highlight: "search-results" }];
    navigateTo = "search"; sideEffect = { type: "minProfit", value: val };
  } else if (q.includes("categor") && (q.includes("cresc") || q.includes("emerg"))) {
    beats = [
      { text: `A livello di categoria, ${ctx.topCategory} e Streetwear mostrano il trend più solido del momento.`, highlight: "chart-category" },
      { text: "Trovi l'analisi completa nella sezione AI Insights.", highlight: "insights-panel" },
    ];
    navigateTo = "insights";
  } else if (q.includes("sottovalutat")) {
    beats = [{ text: "Ho individuato articoli con prezzo richiesto inferiore al valore di mercato reale: margine potenziale elevato se acquistati ora.", highlight: "search-results" }];
    navigateTo = "search";
  } else if (q.includes("previsio")) {
    beats = [{ text: "Se il trend attuale prosegue, stimo un ROI medio in aumento di 2-3 punti percentuali nei prossimi 7 giorni.", highlight: "chart-trend" }];
    navigateTo = "dashboard";
  } else if (q.includes("score") || q.includes("punteggio")) {
    if (ctx.selectedItem) {
      const it = ctx.selectedItem;
      beats = [{ text: `Il punteggio di ${it.title} è ${it.score} su 100 a causa di ${it.competition === "Alta" ? "una concorrenza elevata" : "una domanda contenuta"} e un tempo di vendita stimato di ${it.saleTime} giorni.`, highlight: "search-results" }];
    } else {
      beats = [{ text: "Seleziona prima un articolo nella Ricerca AI: potrò spiegarti nel dettaglio il suo punteggio.", highlight: "search-results" }];
    }
    navigateTo = "search";
  } else if (q.includes("guadagnare") && q.includes("mese")) {
    beats = [
      { text: `In base al trend attuale, il guadagno stimato per questo mese è di circa ${euro(ctx.monthly)}.`, highlight: "kpi-monthly" },
      { text: `Un valore ${ctx.monthlyDelta >= 0 ? "in crescita" : "in calo"} del ${Math.abs(ctx.monthlyDelta)}% rispetto al mese precedente.`, highlight: "kpi-monthly" },
    ];
  } else if (q.includes("90 giorni")) {
    beats = [{ text: "Ecco il grafico degli ultimi 90 giorni, con andamento di prezzo e tempi di vendita.", highlight: "chart-market-price" }];
    navigateTo = "market"; sideEffect = { type: "marketRange", value: 90 };
  } else if (q.includes("perch") && q.includes("profitto")) {
    beats = [{ text: `Il profitto è variato del ${ctx.profitDelta >= 0 ? "+" : ""}${ctx.profitDelta}% grazie a un aumento delle occasioni ad alto ROI in categorie come Streetwear e Sneakers.`, highlight: "kpi-profit" }];
  } else if (q.includes("perch") && q.includes("roi")) {
    beats = [{ text: `Il ROI medio si attesta al ${ctx.roiAvg}%, influenzato dai prezzi di acquisto medi in salita in alcune categorie ad alta domanda.`, highlight: "kpi-roi" }];
  } else if (q.includes("cresc")) {
    beats = [{ text: `${ctx.topGrowthBrand} mostra la crescita più marcata del mercato monitorato in questo momento.`, highlight: "chart-brands" }];
  } else if (q.includes("brand") && q.includes("calo")) {
    beats = [{ text: `${ctx.worstBrand} è il brand con il calo di domanda più marcato nell'ultimo periodo.`, highlight: "chart-brands" }];
  } else {
    beats = [{ text: "Non ho abbastanza contesto per rispondere con precisione. Prova a chiedermi del profitto, del ROI, dei brand in crescita o delle occasioni migliori.", highlight: null }];
  }
  return { beats, navigateTo, sideEffect, facts: ctx, question };
}

/* ============================== AI CONTEXT / PROVIDER ============================== */

const AIContext = createContext(null);
function useAI() { return useContext(AIContext); }

function AIProvider({ children, kpis, appActions, selectedItem }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [highlight, setHighlight] = useState(null);
  const [userName, setUserName] = useState("");
  const [unread, setUnread] = useState(0);
  const [micUnsupported, setMicUnsupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const [voiceURI, setVoiceURIState] = useState("");
  const voiceURIRef = useRef("");
  useEffect(() => { voiceURIRef.current = voiceURI; }, [voiceURI]);
  const briefedRef = useRef(false);
  const selectedItemRef = useRef(selectedItem);
  const kpisRef = useRef(kpis);
  useEffect(() => { selectedItemRef.current = selectedItem; }, [selectedItem]);
  useEffect(() => { kpisRef.current = kpis; }, [kpis]);

  useEffect(() => {
    try {
      if (window.storage) {
        window.storage.get("analyst:name").then((r) => { if (r && r.value) setUserName(r.value); }).catch(() => {});
        window.storage.get("analyst:voiceURI").then((r) => { if (r && r.value) setVoiceURIState(r.value); }).catch(() => {});
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    function refresh() {
      const list = getItalianVoices();
      setVoices(list);
      if (!voiceURIRef.current && list.length) {
        const best = pickBestItalianVoice(list);
        if (best) setVoiceURIState(best.voiceURI);
      }
    }
    refresh();
    window.speechSynthesis.onvoiceschanged = refresh;
    return () => { if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  function chooseVoice(uri) {
    setVoiceURIState(uri);
    try { if (window.storage) window.storage.set("analyst:voiceURI", uri, false).catch(() => {}); } catch (e) {}
  }
  function previewVoice() {
    speakBeat("Ciao, sono il tuo AI Market Analyst. Così suona la mia voce.", true, setIsSpeaking, voiceURIRef.current);
  }

  function saveName(name) {
    setUserName(name);
    try { if (window.storage) window.storage.set("analyst:name", name, false).catch(() => {}); } catch (e) {}
  }

  function addMessage(msg) { setMessages((prev) => [...prev, msg]); }
  function updateBeats(id, beats) { setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, beats } : m))); }
  function updateActiveBeat(id, idx) { setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, activeBeat: idx } : m))); }

  function getFacts() {
    const k = kpisRef.current;
    const gap = TOP_BRANDS_DATA[0].domanda - TOP_BRANDS_DATA[1].domanda;
    return {
      totalListings: 14236,
      dealsToday: k.dealsToday, dealsDelta: k.dealsDelta,
      profitDelta: k.profitDelta, roiAvg: k.roiAvg, roiDelta: k.roiDelta,
      monthly: k.monthly, monthlyDelta: k.monthlyDelta,
      topGrowthBrand: TOP_BRANDS_DATA[0].fullBrand, topGrowthPct: gap,
      worstBrand: TOP_BRANDS_DATA[TOP_BRANDS_DATA.length - 1].fullBrand,
      topCategory: CATEGORY_SPLIT[0].name, lowCategory: CATEGORY_SPLIT[CATEGORY_SPLIT.length - 1].name,
      suggestionCategory: "le maglie da calcio vintage anni '90-2000",
    };
  }
  function getBestDeal() {
    const res = generateResults("occasioni del giorno", 9);
    return res[0];
  }

  async function runBeats(beats, msgId, selfHighlight) {
    for (let i = 0; i < beats.length; i++) {
      updateActiveBeat(msgId, i);
      setHighlight(beats[i].highlight || selfHighlight || null);
      await speakBeat(beats[i].text, voiceEnabled, setIsSpeaking, voiceURIRef.current);
    }
    updateActiveBeat(msgId, -1);
    setHighlight(null);
  }

  function applySideEffect(effect) {
    if (!effect) return;
    if (effect.type === "searchQuery") appActions.setSearchQuery(effect.value);
    if (effect.type === "minProfit") appActions.setMinProfitFilter(effect.value);
    if (effect.type === "marketRange") appActions.setMarketRange(effect.value);
  }

  async function respond(kind, plan) {
    const msgId = uid();
    addMessage({ id: msgId, role: "analyst", beats: plan.beats, activeBeat: -1, kind });
    if (!open) setUnread((u) => u + 1);
    setIsThinking(true);
    let beatsToUse = plan.beats;
    try {
      const remote = await withTimeout(callClaudePhrase(kind, plan.facts, plan.question || null), 9000);
      if (remote && remote.beats && remote.beats.length) {
        beatsToUse = remote.beats.map((b) => ({
          text: String(b.text || "").slice(0, 260),
          highlight: HIGHLIGHT_KEYS.includes(b.highlight) ? b.highlight : null,
        }));
        updateBeats(msgId, beatsToUse);
      }
    } catch (e) { /* keep local beats */ }
    setIsThinking(false);
    await runBeats(beatsToUse, msgId, plan.selfHighlight);
    if (plan.sideEffect) applySideEffect(plan.sideEffect);
    if (plan.navigateTo) appActions.goTo(plan.navigateTo);
  }

  function runBriefing(force) {
    if (briefedRef.current && !force) return;
    briefedRef.current = true;
    const facts = getFacts();
    const plan = buildBriefingPlan(facts, userName);
    respond("briefing", plan);
  }

  function analyzeChart(chartId, extra) {
    setOpen(true);
    const plan = buildChartPlan(chartId, extra);
    respond("chart", plan);
  }

  function ask(question) {
    setOpen(true);
    addMessage({ id: uid(), role: "user", text: question });
    const facts = getFacts();
    const ctx = { ...facts, bestDeal: getBestDeal(), selectedItem: selectedItemRef.current };
    const plan = buildAnswerPlan(question, ctx);
    respond("answer", plan);
  }

  async function handleMic() {
    setIsListening(true);
    try {
      const text = await recognizeOnce();
      setIsListening(false);
      if (text) ask(text);
    } catch (e) {
      setIsListening(false);
      setMicUnsupported(true);
      addMessage({ id: uid(), role: "system", text: "Microfono non disponibile in questo ambiente. Scrivi pure la tua domanda qui sotto." });
    }
  }

  function openPanel() { setOpen(true); setUnread(0); }
  function closePanel() { setOpen(false); }
  function togglePanel() { setOpen((o) => { if (!o) setUnread(0); return !o; }); }

  const value = {
    open, openPanel, closePanel, togglePanel, messages, isSpeaking, isListening, isThinking,
    voiceEnabled, setVoiceEnabled, highlight, userName, saveName, unread, micUnsupported,
    runBriefing, analyzeChart, ask, handleMic, voices, voiceURI, chooseVoice, previewVoice,
  };
  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

function AIHighlightable({ id, type = "card", onClick, className = "", style = {}, children }) {
  const ai = useAI();
  const active = ai && ai.highlight === id;
  const cls = `${className} ai-target ${type === "chart" ? "ai-chart" : "ai-card"} ${active ? "ai-active" : ""}`.trim();
  return (
    <div className={cls} style={style} onClick={onClick} data-ai-key={id}>
      {children}
      {type === "chart" && <span className="ai-chart-hint"><Sparkles size={11} /> Clicca per l'analisi AI</span>}
    </div>
  );
}

/* ============================== ORB + PANEL ============================== */

function AIOrb() {
  const ai = useAI();
  const state = ai.isSpeaking ? "speaking" : ai.isThinking ? "thinking" : ai.isListening ? "listening" : ai.open ? "open" : "idle";
  return (
    <button className={`ai-orb-wrap state-${state}`} onClick={ai.togglePanel} aria-label="AI Market Analyst">
      <span className="ai-orb-ring r1" />
      <span className="ai-orb-ring r2" />
      <span className="ai-orb-core">
        <span className="ai-orb-glow" />
      </span>
      {ai.unread > 0 && !ai.open && <span className="ai-orb-badge">{ai.unread}</span>}
    </button>
  );
}

function BeatLine({ beat, active }) {
  return <p className={`beat-line ${active ? "beat-active" : ""}`}>{beat.text}</p>;
}

function AnalystPanel() {
  const ai = useAI();
  const [text, setText] = useState("");
  const [nameInput, setNameInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [ai.messages, ai.messages.length]);

  useEffect(() => {
    if (ai.open) {
      const t = setTimeout(() => ai.runBriefing(false), 350);
      return () => clearTimeout(t);
    }
  }, [ai.open]);

  function send() {
    const q = text.trim();
    if (!q) return;
    setText("");
    ai.ask(q);
  }

  const quick = [
    "Qual è il miglior affare di oggi?",
    "Fammi vedere le migliori maglie Nike",
    "Mostrami annunci con profitto superiore a 40 euro",
    "Quali categorie stanno crescendo?",
    "Quanto posso guadagnare questo mese?",
    "Fammi vedere il grafico degli ultimi 90 giorni",
  ];

  const status = ai.isSpeaking ? "Sta parlando…" : ai.isThinking ? "Sta analizzando i dati…" : ai.isListening ? "In ascolto…" : "Pronto";

  return (
    <div className={`analyst-panel ${ai.open ? "panel-open" : ""}`}>
      <div className="analyst-header">
        <div className="analyst-header-left">
          <span className={`mini-orb state-${ai.isSpeaking ? "speaking" : ai.isThinking ? "thinking" : ai.isListening ? "listening" : "idle"}`} />
          <div>
            <div className="analyst-title">AI Market Analyst</div>
            <div className="analyst-status">{status}</div>
          </div>
        </div>
        <div className="analyst-header-right">
          <button className={`icon-toggle ${ai.voiceEnabled ? "on" : ""}`} title="Attiva/disattiva voce" onClick={() => ai.setVoiceEnabled((v) => !v)}>
            {ai.voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
          <button className="icon-toggle" onClick={ai.closePanel}><X size={15} /></button>
        </div>
      </div>

      {!ai.userName && (
        <div className="name-capture">
          <span className="muted small">Come ti chiami?</span>
          <input className="input small" value={nameInput} placeholder="Il tuo nome" onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && nameInput.trim() && ai.saveName(nameInput.trim())} />
          <button className="btn-secondary small" onClick={() => nameInput.trim() && ai.saveName(nameInput.trim())}>Salva</button>
        </div>
      )}

      {ai.voices.length > 0 && (
        <div className="voice-picker">
          <Volume2 size={13} className="muted" />
          <select className="select voice-select" value={ai.voiceURI} onChange={(e) => ai.chooseVoice(e.target.value)}>
            {ai.voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name}{v.lang ? ` (${v.lang})` : ""}</option>)}
          </select>
          <button className="btn-secondary small" onClick={ai.previewVoice}>Prova voce</button>
        </div>
      )}

      <div className="analyst-body" ref={scrollRef}>
        {ai.messages.length === 0 && (
          <div className="analyst-empty">
            <Sparkles size={20} className="blue-text" />
            <div className="muted small">Il tuo analista sta per iniziare il briefing di mercato…</div>
          </div>
        )}
        {ai.messages.map((m) => (
          <div key={m.id} className={`chat-row ${m.role}`}>
            {m.role === "user" && <div className="chat-bubble user-bubble">{m.text}</div>}
            {m.role === "system" && <div className="chat-bubble system-bubble">{m.text}</div>}
            {m.role === "analyst" && (
              <div className="chat-bubble analyst-bubble">
                {m.beats.map((b, i) => <BeatLine key={i} beat={b} active={m.activeBeat === i} />)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="quick-chips">
        {quick.map((q) => <button key={q} className="chip" onClick={() => ai.ask(q)}>{q}</button>)}
      </div>

      <div className="analyst-input-row">
        <button className={`mic-btn ${ai.isListening ? "listening" : ""}`} onClick={ai.handleMic} title="Parla con l'analista">
          {ai.isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
        <input
          className="analyst-input"
          value={text}
          placeholder="Chiedi qualcosa al tuo analista…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button className="send-btn" onClick={send}><Send size={15} /></button>
      </div>
    </div>
  );
}

/* ============================== SHARED UI ============================== */

function useAnimatedNumber(target, duration = 700) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  useEffect(() => {
    const start = prevRef.current; const startTime = performance.now();
    let raf;
    function tick(now) {
      const p = clamp((now - startTime) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(start + (target - start) * eased);
      if (p < 1) raf = requestAnimationFrame(tick); else prevRef.current = target;
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return display;
}

function GlassCard({ children, className = "", style = {} }) {
  return <div className={`glass ${className}`} style={style}>{children}</div>;
}

function KpiCard({ icon: Icon, label, rawValue, formatter, delta, accent = "green", aiKey, explainQuestion }) {
  const ai = useAI();
  const animated = useAnimatedNumber(rawValue);
  return (
    <AIHighlightable id={aiKey} type="card" className="kpi-card-wrap">
      <GlassCard className="kpi-card">
        <div className="kpi-top">
          <span className={`kpi-icon icon-${accent}`}><Icon size={18} /></span>
          <div className="kpi-top-right">
            {delta !== undefined && (
              <span className={`kpi-delta ${delta >= 0 ? "pos" : "neg"}`}>
                {delta >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}{Math.abs(delta)}%
              </span>
            )}
            {explainQuestion && (
              <button className="explain-btn" title="Chiedi all'analista" onClick={(e) => { e.stopPropagation(); ai.ask(explainQuestion); }}>?</button>
            )}
          </div>
        </div>
        <div className="kpi-value mono">{formatter(animated)}</div>
        <div className="kpi-label">{label}</div>
      </GlassCard>
    </AIHighlightable>
  );
}

function Badge({ badge }) { return <span className={`badge ${badge.cls}`}>{badge.icon} {badge.label}</span>; }
function StatPill({ label, value, tone }) { return <span className={`pill ${tone ? "tone-" + tone.toLowerCase() : ""}`}>{label}: <b>{value}</b></span>; }
function SectionTitle({ eyebrow, title, right }) {
  return (
    <div className="section-title-row">
      <div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h2 className="section-title">{title}</h2></div>
      {right}
    </div>
  );
}
function ChartTooltip({ active, payload, label, suffix }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="tt-label">{label}</div>
      {payload.map((p, i) => <div key={i} className="tt-row"><span style={{ color: p.color || p.fill }}>●</span> {p.name}: <b>{p.value}{suffix}</b></div>)}
    </div>
  );
}

function TickerTape() {
  const doubled = [...LIVE_DEALS_FEED, ...LIVE_DEALS_FEED];
  return (
    <div className="ticker-wrap">
      <div className="ticker-label"><Radar size={13} /> LIVE</div>
      <div className="ticker-track"><div className="ticker-move">{doubled.map((t, i) => <span className="ticker-item" key={i}>{t}</span>)}</div></div>
    </div>
  );
}

/* ============================== DASHBOARD ============================== */

function Dashboard({ onGo, kpis }) {
  const ai = useAI();
  function onTrendClick() {
    const first = PROFIT_TREND[0].profitto, last = PROFIT_TREND[PROFIT_TREND.length - 1].profitto;
    const changePct = Math.round(((last - first) / first) * 1000) / 10;
    ai.analyzeChart("chart-trend", { changePct });
  }
  function onBrandsClick() {
    ai.analyzeChart("chart-brands", { topBrand: TOP_BRANDS_DATA[0].fullBrand, topValue: TOP_BRANDS_DATA[0].domanda, gap: TOP_BRANDS_DATA[0].domanda - TOP_BRANDS_DATA[1].domanda });
  }
  const bestDeal = useMemo(() => generateResults("occasioni del giorno", 9)[0], []);
  const worstDeal = useMemo(() => [...generateResults("rischio elevato oggi", 9)].sort((a, b) => a.score - b.score)[0], []);
  const liveFeed = useMemo(() => generateResults("feed live opportunita", 6), []);
  const forecast = useMemo(() => {
    const last = PROFIT_TREND[PROFIT_TREND.length - 1].profitto;
    const rnd = mulberry32(777);
    return Array.from({ length: 7 }, (_, i) => ({ giorno: `+${i + 1}g`, valore: Math.round(last * (1 + (i + 1) * 0.018 + (rnd() - 0.5) * 0.012)) }));
  }, []);
  const opportunityScore = clamp(Math.round(kpis.roiAvg * 0.4 + bestDeal.score * 0.4 + Math.min(100, kpis.dealsToday * 2.2) * 0.2), 5, 99);

  return (
    <div className="page">
      <SectionTitle eyebrow="Panoramica" title="Dashboard Reseller" />
      <div className="kpi-grid">
        <KpiCard icon={Wallet} label="Profitto totale" rawValue={kpis.profitTotal} formatter={euro} delta={kpis.profitDelta} accent="green" aiKey="kpi-profit" explainQuestion="Perché oggi il profitto è aumentato?" />
        <KpiCard icon={Percent} label="ROI medio" rawValue={kpis.roiAvg} formatter={(n) => `${Math.round(n)}%`} delta={kpis.roiDelta} accent="blue" aiKey="kpi-roi" explainQuestion="Perché il ROI è cambiato?" />
        <KpiCard icon={Flame} label="Occasioni trovate oggi" rawValue={kpis.dealsToday} formatter={(n) => `${Math.round(n)}`} delta={kpis.dealsDelta} accent="green" aiKey="kpi-today" />
        <KpiCard icon={Radar} label="Articoli monitorati" rawValue={kpis.monitored} formatter={(n) => `${Math.round(n)}`} delta={kpis.monitoredDelta} accent="blue" aiKey="kpi-monitored" />
        <KpiCard icon={TrendingUp} label="Guadagno stimato mensile" rawValue={kpis.monthly} formatter={euro} delta={kpis.monthlyDelta} accent="amber" aiKey="kpi-monthly" explainQuestion="Quanto posso guadagnare questo mese?" />
      </div>

      <div className="overview-grid">
        <GlassCard className="overview-card" onClick={() => onGo("search")}>
          <div className="overview-icon icon-green"><Flame size={14} /></div>
          <div className="micro-label">Best Opportunity Today</div>
          <div className="chart-title">{bestDeal.title}</div>
          <div className="muted small">{euro2(bestDeal.price)} · profitto {euro2(bestDeal.profit)} · ROI {bestDeal.roi}%</div>
        </GlassCard>
        <GlassCard className="overview-card">
          <div className="overview-icon icon-blue"><TrendingUp size={14} /></div>
          <div className="micro-label">Best Brand Today</div>
          <div className="chart-title">{TOP_BRANDS_DATA[0].fullBrand}</div>
          <div className="muted small">Indice domanda {TOP_BRANDS_DATA[0].domanda}/100</div>
        </GlassCard>
        <GlassCard className="overview-card">
          <div className="overview-icon icon-gold"><Star size={14} /></div>
          <div className="micro-label">Best Category Today</div>
          <div className="chart-title">{CATEGORY_SPLIT[0].name}</div>
          <div className="muted small">Quota di mercato più alta monitorata</div>
        </GlassCard>
        <GlassCard className="overview-card">
          <div className="overview-icon icon-red"><TrendingDown size={14} /></div>
          <div className="micro-label">Worst Investment Today</div>
          <div className="chart-title">{worstDeal.title}</div>
          <div className="muted small">AI Score {worstDeal.score}/100 · rischio {worstDeal.risk}</div>
        </GlassCard>
      </div>

      <div className="grid-2">
        <AIHighlightable id="chart-trend" type="chart" onClick={onTrendClick}>
          <GlassCard className="chart-card">
            <div className="chart-head">
              <div><div className="eyebrow">Andamento annuale</div><div className="chart-title">Profitto mensile</div></div>
              <StatPill label="Trend" value="+ 24% YTD" tone="green" />
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={PROFIT_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e28a" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#00e28a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="mese" stroke="#5b6b78" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#5b6b78" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip suffix="€" />} />
                <Area type="monotone" dataKey="profitto" stroke="#00e28a" strokeWidth={2} fill="url(#profitGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>
        </AIHighlightable>

        <AIHighlightable id="chart-brands" type="chart" onClick={onBrandsClick}>
          <GlassCard className="chart-card">
            <div className="chart-head"><div><div className="eyebrow">Radar di mercato</div><div className="chart-title">Marche più richieste</div></div></div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={TOP_BRANDS_DATA} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" stroke="#5b6b78" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="brand" type="category" stroke="#8b9aa8" tick={{ fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip suffix="" />} />
                <Bar dataKey="domanda" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </AIHighlightable>
      </div>

      <div className="grid-3">
        <GlassCard className="score-gauge-card">
          <div className="eyebrow">Market Pulse</div>
          <div className="chart-title" style={{ marginBottom: 10 }}>Opportunity Score</div>
          <ScoreRing score={opportunityScore} />
          <div className="muted small" style={{ marginTop: 10, textAlign: "center" }}>Indice aggregato di salute del mercato oggi</div>
        </GlassCard>

        <GlassCard>
          <div className="eyebrow">AI Predictions</div>
          <div className="chart-title" style={{ marginBottom: 6 }}>Forecast prossimi 7 giorni</div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={forecast}>
              <XAxis dataKey="giorno" stroke="#5b6b78" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<ChartTooltip suffix="€" />} />
              <Line type="monotone" dataKey="valore" stroke="#d8b26a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="muted small">Proiezione basata sul trend delle ultime settimane.</div>
        </GlassCard>

        <GlassCard>
          <div className="eyebrow">Tempo reale</div>
          <div className="chart-title" style={{ marginBottom: 8 }}>Live Opportunity Feed</div>
          <div className="feed-list">
            {liveFeed.map((it) => (
              <div className="feed-item" key={it.id}>
                <Badge badge={it.badge} />
                <div className="feed-body">
                  <div className="cell-strong small">{it.brand} · {it.category}</div>
                  <div className="muted small">profitto {euro2(it.profit)} · ROI {it.roi}%</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="chart-title" style={{ marginBottom: 10 }}><Gauge size={15} /> Heatmap Brand × Categoria</div>
        <div className="heatmap-wrap">
          <div className="heatmap-grid" style={{ gridTemplateColumns: `120px repeat(${HEATMAP_CATS.length}, 1fr)` }}>
            <div />
            {HEATMAP_CATS.map((c) => <div key={c} className="heatmap-label">{c}</div>)}
            {HEATMAP_BRANDS.map((b, ri) => (
              <React.Fragment key={b}>
                <div className="heatmap-label heatmap-row-label">{b}</div>
                {HEATMAP_CATS.map((c, ci) => {
                  const v = HEATMAP_DATA[ri][ci];
                  const alpha = clamp01(v / 100);
                  return <div key={c} className="heatmap-cell" style={{ background: `rgba(20,232,160,${0.08 + alpha * 0.55})` }} title={`${b} × ${c}: ${v}/100`}>{v}</div>;
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard className="cta-strip">
        <div>
          <div className="chart-title">Pronto a trovare la prossima occasione?</div>
          <div className="muted">Lancia una ricerca AI su una marca o categoria e lascia che il sistema calcoli il punteggio di convenienza.</div>
        </div>
        <button className="btn-primary" onClick={() => onGo("search")}>Vai a Ricerca AI <ChevronRight size={16} /></button>
      </GlassCard>
    </div>
  );
}

/* ============================== RICERCA AI ============================== */

function Sparkline({ data, color = "#3b82f6", height = 40 }) {
  if (!data || data.length < 2) return null;
  const w = 200;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * height}`).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="sparkline">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}
function riskRank(r) { return r === "Basso" ? 0 : r === "Medio" ? 1 : 2; }

async function analyzeImageForSearch(file) {
  const dataUrl = await fileToDataUrl(file);
  const base64 = dataUrl.split(",")[1];
  const mediaType = file.type || "image/jpeg";
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6", max_tokens: 200,
      messages: [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
        { type: "text", text: "Guarda questo capo d'abbigliamento o accessorio. Rispondi SOLO con 2-4 parole chiave in italiano utili per cercarlo su un marketplace second-hand (marca se riconoscibile, altrimenti categoria e colore). Nessuna frase, solo le parole chiave, senza punteggiatura." },
      ] }],
    }),
  });
  if (!resp.ok) throw new Error("api-error");
  const data = await resp.json();
  const textBlock = (data.content || []).find((c) => c.type === "text");
  if (!textBlock) throw new Error("no-text");
  return textBlock.text.trim().replace(/["'.]/g, "");
}

function PredictionGrid({ item }) {
  return (
    <div className="prediction-grid">
      <div className="pred-cell"><Target size={14} className="green-text" /><div><div className="micro-label">Probabilità vendita</div><div className="mono pred-val">{item.sellProbability}%</div></div></div>
      <div className="pred-cell"><Clock size={14} className="blue-text" /><div><div className="micro-label">Tempo stimato</div><div className="mono pred-val">{item.saleTime} gg</div></div></div>
      <div className="pred-cell"><Euro size={14} className="green-text" /><div><div className="micro-label">Prezzo ideale</div><div className="mono pred-val">{euro2(item.idealPrice)}</div></div></div>
      <div className="pred-cell"><Wallet size={14} className="blue-text" /><div><div className="micro-label">Profitto stimato</div><div className="mono pred-val">{euro2(item.profit)}</div></div></div>
      <div className="pred-cell"><ShieldAlert size={14} className={item.risk === "Alto" ? "red-text" : item.risk === "Medio" ? "amber-text" : "green-text"} /><div><div className="micro-label">Rischio</div><div className="mono pred-val">{item.risk}</div></div></div>
      <div className="pred-cell"><Gauge size={14} className="blue-text" /><div><div className="micro-label">AI Score</div><div className="mono pred-val">{item.score}/100</div></div></div>
    </div>
  );
}

function AdvisorText({ item }) {
  const riskBits = [];
  if (item.competition === "Alta") riskBits.push("la concorrenza tra venditori è alta, quindi il margine potrebbe ridursi in fase di trattativa");
  if (item.demand === "Bassa") riskBits.push("la domanda attuale è bassa, il che potrebbe allungare i tempi di vendita reali");
  if (item.condition === "Discreto") riskBits.push("le condizioni dichiarate non sono ottimali, verifica le foto prima di acquistare");
  if (riskBits.length === 0) riskBits.push("nessun rischio rilevante rilevato: condizioni, domanda e concorrenza sono favorevoli");
  return (
    <div className="advisor-text">
      <p><b>Perché conviene:</b> il prezzo richiesto ({euro2(item.price)}) è inferiore al prezzo medio di mercato ({euro2(item.marketAvg)}) e al prezzo medio di rivendita ({euro2(item.resaleAvg)}), con un margine stimato del {item.roi}%.</p>
      <p><b>Motivazione completa:</b> {riskBits.join("; ")}.</p>
    </div>
  );
}

function SearchPage({ query, setQuery, minProfitFilter, setMinProfitFilter, onSelectItem }) {
  const ai = useAI();
  const [submitted, setSubmitted] = useState(query);
  const [sortBy, setSortBy] = useState("score");
  const [selected, setSelected] = useState(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [imgSearching, setImgSearching] = useState(false);
  const [imgError, setImgError] = useState("");
  const [filters, setFilters] = useState({ material: "", minYear: "", maxYear: "", limitedOnly: false, minReviews: "", minRoi: "", maxRisk: "", minSellProb: "", minPrice: "", maxPrice: "" });
  const fileInputRef = useRef(null);
  const jsonInputRef = useRef(null);
  const [importedResults, setImportedResults] = useState(null);
  const [importedAt, setImportedAt] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [liveSearchLoading, setLiveSearchLoading] = useState(false);
  const [liveSearchError, setLiveSearchError] = useState("");

  useEffect(() => { setSubmitted(query); }, [query]);

  async function handleLiveSearch() {
    const q = (submitted || query || "").trim();
    if (!q) { setLiveSearchError("Scrivi prima una marca o parola chiave nella barra di ricerca."); return; }
    setLiveSearchLoading(true);
    setLiveSearchError("");
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&pages=2&minDiscount=0.25`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Errore ${res.status}`);
      if (!data.items || data.items.length === 0) {
        setLiveSearchError(`Nessuna occasione trovata ora per "${q}". Prova un'altra marca o riprova tra poco.`);
      } else {
        applyImportedItems(data.items);
      }
    } catch (e) {
      setLiveSearchError(
        "Ricerca dal vivo non disponibile qui. Questo bottone funziona solo quando l'app gira su un vero hosting " +
        "(es. Vercel) — dentro l'anteprima di Claude la rete verso l'esterno è bloccata. Usa \"Importa dati reali\" con un file JSON nel frattempo."
      );
    } finally {
      setLiveSearchLoading(false);
    }
  }

  useEffect(() => {
    try {
      if (window.storage) {
        window.storage.get("search:history").then((r) => { if (r && r.value) setHistory(JSON.parse(r.value)); }).catch(() => {});
        window.storage.get("search:favorites").then((r) => { if (r && r.value) setFavorites(JSON.parse(r.value)); }).catch(() => {});
        window.storage.get("search:realdata").then((r) => {
          if (r && r.value) {
            const parsed = JSON.parse(r.value);
            if (parsed && Array.isArray(parsed.items)) { setImportedResults(parsed.items); setImportedAt(parsed.importedAt || null); }
          }
        }).catch(() => {});
      }
    } catch (e) {}
  }, []);

  function applyImportedItems(items) {
    if (!Array.isArray(items) || items.length === 0) { setImportError("Il file/JSON non contiene un array di articoli valido."); return; }
    const cleaned = items.filter((it) => it && typeof it.price === "number" && it.title);
    if (cleaned.length === 0) { setImportError("Nessun articolo con i campi minimi richiesti (title, price) trovato."); return; }
    const stamped = { items: cleaned, importedAt: new Date().toISOString() };
    setImportedResults(cleaned);
    setImportedAt(stamped.importedAt);
    setImportError("");
    setShowImport(false);
    setImportText("");
    try { if (window.storage) window.storage.set("search:realdata", JSON.stringify(stamped), false).catch(() => {}); } catch (e) {}
  }
  function handleImportPaste() {
    try { applyImportedItems(JSON.parse(importText)); }
    catch (e) { setImportError("JSON non valido: controlla la sintassi (es. copiato parzialmente)."); }
  }
  function handleImportFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try { applyImportedItems(JSON.parse(reader.result)); } catch (e) { setImportError("Impossibile leggere il file: non è un JSON valido."); } };
    reader.readAsText(file);
  }
  function clearImportedData() {
    setImportedResults(null); setImportedAt(null);
    try { if (window.storage) window.storage.delete("search:realdata", false).catch(() => {}); } catch (e) {}
  }

  function persistHistory(next) { setHistory(next); try { if (window.storage) window.storage.set("search:history", JSON.stringify(next), false).catch(() => {}); } catch (e) {} }
  function persistFavorites(next) { setFavorites(next); try { if (window.storage) window.storage.set("search:favorites", JSON.stringify(next), false).catch(() => {}); } catch (e) {} }

  function runSearch(q) {
    setSubmitted(q);
    setShowSuggest(false);
    const next = [q, ...history.filter((h) => h.toLowerCase() !== q.toLowerCase())].slice(0, 8);
    persistHistory(next);
  }
  function toggleFavorite(item) {
    const exists = favorites.find((f) => f.id === item.id);
    const next = exists ? favorites.filter((f) => f.id !== item.id) : [{ id: item.id, title: item.title, brand: item.brand, price: item.price, profit: item.profit, roi: item.roi, score: item.score }, ...favorites].slice(0, 20);
    persistFavorites(next);
  }
  async function handleImageFile(file) {
    if (!file) return;
    setImgSearching(true); setImgError("");
    try {
      const guess = await analyzeImageForSearch(file);
      if (guess) { setQuery(guess); runSearch(guess); } else { setImgError("Non sono riuscito a riconoscere il prodotto."); }
    } catch (e) { setImgError("Ricerca per immagine non disponibile in questo momento."); }
    setImgSearching(false);
  }

  const suggestions = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return [...BRANDS, ...CATEGORIES].filter((x) => x.toLowerCase().includes(q) && x.toLowerCase() !== q).slice(0, 6);
  }, [query]);

  const allResults = useMemo(() => {
    if (importedResults && importedResults.length > 0) {
      const q = (submitted || "").toLowerCase().trim();
      if (!q) return importedResults;
      const filtered = importedResults.filter((it) =>
        (it.title || "").toLowerCase().includes(q) || (it.brand || "").toLowerCase().includes(q)
      );
      return filtered.length > 0 ? filtered : importedResults;
    }
    return generateResults(submitted, 9);
  }, [submitted, importedResults]);
  const results = useMemo(() => {
    let arr = allResults;
    if (minProfitFilter) arr = arr.filter((r) => r.profit >= minProfitFilter);
    if (filters.material) arr = arr.filter((r) => r.material === filters.material);
    if (filters.minYear) arr = arr.filter((r) => r.year >= Number(filters.minYear));
    if (filters.maxYear) arr = arr.filter((r) => r.year <= Number(filters.maxYear));
    if (filters.limitedOnly) arr = arr.filter((r) => r.limitedEdition);
    if (filters.minReviews) arr = arr.filter((r) => r.sellerReviews >= Number(filters.minReviews));
    if (filters.minRoi) arr = arr.filter((r) => r.roi >= Number(filters.minRoi));
    if (filters.maxRisk) arr = arr.filter((r) => riskRank(r.risk) <= riskRank(filters.maxRisk));
    if (filters.minSellProb) arr = arr.filter((r) => r.sellProbability >= Number(filters.minSellProb));
    if (filters.minPrice) arr = arr.filter((r) => r.price >= Number(filters.minPrice));
    if (filters.maxPrice) arr = arr.filter((r) => r.price <= Number(filters.maxPrice));
    return arr;
  }, [allResults, minProfitFilter, filters]);
  const sorted = useMemo(() => {
    const arr = [...results];
    if (sortBy === "score") arr.sort((a, b) => b.score - a.score);
    if (sortBy === "roi") arr.sort((a, b) => b.roi - a.roi);
    if (sortBy === "profit") arr.sort((a, b) => b.profit - a.profit);
    if (sortBy === "saleTime") arr.sort((a, b) => a.saleTime - b.saleTime);
    return arr;
  }, [results, sortBy]);

  useEffect(() => {
    const first = sorted[0] || null;
    setSelected(first);
    if (first) onSelectItem(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, minProfitFilter, filters]);

  function selectItem(item) { setSelected(item); onSelectItem(item); }
  const activeFilterCount = Object.values(filters).filter((v) => v !== "" && v !== false).length;

  return (
    <div className="page">
      <SectionTitle eyebrow="Intelligenza artificiale" title="Ricerca AI" />

      <GlassCard className="search-bar" style={{ position: "relative" }}>
        <Search size={18} className="muted" />
        <input
          className="search-input" value={query}
          onChange={(e) => { setQuery(e.target.value); setShowSuggest(true); }}
          onFocus={() => setShowSuggest(true)}
          onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
          onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
          placeholder="Cerca Nike, Adidas, Stone Island, Supreme, maglie da calcio, sneakers, vintage..."
        />
        <select className="select-inline" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="score">Ordina: Punteggio AI</option>
          <option value="roi">Ordina: ROI</option>
          <option value="profit">Ordina: Profitto</option>
          <option value="saleTime">Ordina: Tempo di vendita</option>
        </select>
        <button className={`icon-toggle ${showFilters ? "on" : ""}`} title="Filtri avanzati" onClick={() => setShowFilters((v) => !v)}><SlidersHorizontal size={15} />{activeFilterCount > 0 && <span className="filter-dot" />}</button>
        <button className={`icon-toggle ${showFavorites ? "on" : ""}`} title="Preferiti" onClick={() => setShowFavorites((v) => !v)}><Heart size={15} /></button>
        <button className={`icon-toggle ${importedResults ? "on" : ""}`} title="Importa dati reali" onClick={() => setShowImport((v) => !v)}><Download size={15} /></button>
        <button className="icon-toggle" title="Cerca dal vivo su Vinted" onClick={handleLiveSearch} disabled={liveSearchLoading}>
          {liveSearchLoading ? <Loader2 size={15} className="spin" /> : <Zap size={15} />}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files && e.target.files[0] && handleImageFile(e.target.files[0])} />
        <button className="icon-toggle" title="Cerca per immagine" onClick={() => fileInputRef.current && fileInputRef.current.click()} disabled={imgSearching}>
          {imgSearching ? <Loader2 size={15} className="spin" /> : <ImagePlus size={15} />}
        </button>
        <button className="btn-primary" onClick={() => runSearch(query)}>Cerca</button>

        {showSuggest && suggestions.length > 0 && (
          <div className="suggest-dropdown">
            {suggestions.map((s) => <div key={s} className="suggest-item" onMouseDown={() => { setQuery(s); runSearch(s); }}>{s}</div>)}
          </div>
        )}
      </GlassCard>
      {imgError && <div className="muted small">{imgError}</div>}
      {liveSearchError && <div className="muted small" style={{ color: "var(--warn, #f5a623)" }}>{liveSearchError}</div>}

      {importedResults && (
        <div className="muted small" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={13} className="green-text" />
          Stai usando {importedResults.length} articoli reali importati{importedAt ? ` (${new Date(importedAt).toLocaleString("it-IT")})` : ""}.
          <button className="chip" onClick={clearImportedData}>Torna alla simulazione</button>
        </div>
      )}

      {showImport && (
        <GlassCard>
          <div className="chart-title" style={{ marginBottom: 8 }}><Download size={14} /> Importa dati reali</div>
          <div className="muted small" style={{ marginBottom: 10 }}>
            Carica qui il file JSON prodotto da <code>vinted_price_scanner.py</code> (o incolla il contenuto),
            oppure un array JSON con almeno i campi <code>title</code> e <code>price</code>. Sostituirà i risultati
            simulati con dati reali finché non lo cancelli.
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input ref={jsonInputRef} type="file" accept="application/json,.json" style={{ display: "none" }}
              onChange={(e) => e.target.files && e.target.files[0] && handleImportFile(e.target.files[0])} />
            <button className="btn-secondary" onClick={() => jsonInputRef.current && jsonInputRef.current.click()}>
              <UploadCloud size={14} /> Carica file JSON
            </button>
            {importedResults && <button className="btn-secondary" onClick={clearImportedData}><Trash2 size={14} /> Rimuovi dati importati</button>}
          </div>
          <textarea
            className="analyst-input" style={{ width: "100%", minHeight: 110, resize: "vertical" }}
            placeholder='Oppure incolla qui un array JSON, es: [{"title":"Nike Air Max 97","brand":"Nike","price":22,"marketAvg":48, ...}]'
            value={importText} onChange={(e) => setImportText(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
            <button className="btn-primary" onClick={handleImportPaste} disabled={!importText.trim()}>Importa JSON incollato</button>
            {importError && <span className="muted small red-text">{importError}</span>}
          </div>
        </GlassCard>
      )}

      {history.length > 0 && (
        <div className="history-row">
          <History size={12} className="muted" />
          {history.map((h) => <button key={h} className="chip" onClick={() => { setQuery(h); runSearch(h); }}>{h}</button>)}
        </div>
      )}

      {showFavorites && (
        <GlassCard>
          <div className="chart-title" style={{ marginBottom: 8 }}><Heart size={14} className="red-text" /> Preferiti</div>
          {favorites.length === 0 ? <div className="muted small">Nessun preferito salvato. Clicca il cuore su un risultato per aggiungerlo.</div> : (
            <div className="fav-list">
              {favorites.map((f) => (
                <div key={f.id} className="fav-item" onClick={() => { setQuery(f.brand); runSearch(f.brand); }}>
                  <div className="cell-strong small">{f.title}</div>
                  <div className="muted small">{euro2(f.price)} · profitto {euro2(f.profit)} · ROI {f.roi}% · AI {f.score}</div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {showFilters && (
        <GlassCard>
          <div className="chart-title" style={{ marginBottom: 10 }}><SlidersHorizontal size={14} /> Filtri avanzati</div>
          <div className="filter-grid">
            <LabeledSelect label="Materiale" value={filters.material} onChange={(v) => setFilters((f) => ({ ...f, material: v }))} options={MATERIALS} />
            <LabeledInput label="Anno minimo" value={filters.minYear} onChange={(v) => setFilters((f) => ({ ...f, minYear: v }))} />
            <LabeledInput label="Anno massimo" value={filters.maxYear} onChange={(v) => setFilters((f) => ({ ...f, maxYear: v }))} />
            <LabeledInput label="Prezzo minimo (€)" value={filters.minPrice} onChange={(v) => setFilters((f) => ({ ...f, minPrice: v }))} />
            <LabeledInput label="Prezzo massimo (€)" value={filters.maxPrice} onChange={(v) => setFilters((f) => ({ ...f, maxPrice: v }))} />
            <LabeledInput label="ROI minimo (%)" value={filters.minRoi} onChange={(v) => setFilters((f) => ({ ...f, minRoi: v }))} />
            <LabeledInput label="Probabilità vendita minima (%)" value={filters.minSellProb} onChange={(v) => setFilters((f) => ({ ...f, minSellProb: v }))} />
            <LabeledInput label="Recensioni venditore minime" value={filters.minReviews} onChange={(v) => setFilters((f) => ({ ...f, minReviews: v }))} />
            <LabeledSelect label="Rischio massimo" value={filters.maxRisk} onChange={(v) => setFilters((f) => ({ ...f, maxRisk: v }))} options={["Basso", "Medio", "Alto"]} />
          </div>
          <label className="enhance-row"><input type="checkbox" checked={filters.limitedOnly} onChange={(e) => setFilters((f) => ({ ...f, limitedOnly: e.target.checked }))} /> Solo edizioni limitate</label>
          <button className="btn-secondary small" style={{ marginTop: 10 }} onClick={() => setFilters({ material: "", minYear: "", maxYear: "", limitedOnly: false, minReviews: "", minRoi: "", maxRisk: "", minSellProb: "", minPrice: "", maxPrice: "" })}>Azzera filtri</button>
        </GlassCard>
      )}

      {minProfitFilter ? (
        <div className="active-filter">
          Filtro attivo: profitto ≥ {euro(minProfitFilter)}
          <button onClick={() => setMinProfitFilter(null)}><X size={12} /></button>
        </div>
      ) : null}

      <div className="results-layout">
        <AIHighlightable id="search-results" type="card" className="results-grid-wrap">
          <div className="results-grid">
            {sorted.map((item) => (
              <GlassCard key={item.id} className={`result-card ${selected && selected.id === item.id ? "result-active" : ""}`} style={{ cursor: "pointer" }}>
                <div onClick={() => selectItem(item)}>
                  {item.photo ? (
                    <div className="result-photo-wrap">
                      <img src={item.photo} alt={item.title} className="result-photo" loading="lazy"
                        onError={(e) => { e.target.style.display = "none"; e.target.parentElement.classList.add("result-photo-fallback"); }} />
                    </div>
                  ) : (
                    <div className="result-photo-wrap result-photo-fallback"><Package size={22} className="muted" /></div>
                  )}
                  <div className="result-top">
                    <span className="result-brand">{item.brand}{item.limitedEdition && <span className="gold-text"> · LTD</span>}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="fav-btn" title="Apri su Vinted" onClick={(e) => e.stopPropagation()}>
                          <ChevronRight size={13} />
                        </a>
                      )}
                      <button className="fav-btn" onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }}>
                        <Heart size={13} fill={favorites.find((f) => f.id === item.id) ? "#ff5470" : "none"} color={favorites.find((f) => f.id === item.id) ? "#ff5470" : "currentColor"} />
                      </button>
                      <Badge badge={item.badge} />
                    </div>
                  </div>
                  <div className="result-title">{item.title}</div>
                  <div className="result-meta muted">{item.size} · {item.color} · {item.material} · {item.year} · {item.condition} · {item.country}</div>
                  <div className="price-row">
                    <div className="price-block"><div className="micro-label">Richiesto</div><div className="mono price">{euro2(item.price)}</div></div>
                    <div className="price-block"><div className="micro-label">Mercato</div><div className="mono">{euro2(item.marketAvg)}</div></div>
                    <div className="price-block"><div className="micro-label">Rivendita</div><div className="mono">{euro2(item.resaleAvg)}</div></div>
                  </div>
                  <div className="stat-row">
                    <span className="stat"><Euro size={12} /> Profitto <b className="green-text">{euro2(item.profit)}</b></span>
                    <span className="stat"><Percent size={12} /> ROI <b className="blue-text">{item.roi}%</b></span>
                    <span className="stat"><Clock size={12} /> {item.saleTime}gg</span>
                  </div>
                  <div className="stat-row">
                    <StatPill label="Domanda" value={item.demand} tone={item.demand} />
                    <StatPill label="Concorrenza" value={item.competition} />
                    <span className="ai-score">AI {item.score}<span className="muted">/100</span></span>
                  </div>
                </div>
              </GlassCard>
            ))}
            {sorted.length === 0 && <div className="muted small">Nessun risultato corrisponde ai filtri attuali.</div>}
          </div>
        </AIHighlightable>

        {selected && (
          <GlassCard className="advisor-panel">
            <div className="advisor-head">
              <div><div className="eyebrow">AI Prediction Engine</div><div className="chart-title">{selected.title}</div></div>
              <Badge badge={selected.badge} />
            </div>
            <PredictionGrid item={selected} />
            <div className="micro-label" style={{ marginTop: 10 }}>Storico prezzo di mercato</div>
            <Sparkline data={selected.priceHistory} color="#3d7bff" />
            <AdvisorText item={selected} />
            <div className="sw-grid">
              <div><div className="micro-label green-text">Punti forti</div>{selected.strengths.map((s, i) => <div key={i} className="muted small">• {s}</div>)}</div>
              <div><div className="micro-label red-text">Punti deboli</div>{selected.weaknesses.map((s, i) => <div key={i} className="muted small">• {s}</div>)}</div>
            </div>
            <div className="strategy-box">
              <div className="micro-label">Strategia acquisto</div><div className="muted small">{selected.buyStrategy}</div>
              <div className="micro-label" style={{ marginTop: 6 }}>Strategia vendita</div><div className="muted small">{selected.sellStrategy}</div>
              <div className="muted small" style={{ marginTop: 6 }}>Venditore @{selected.seller} · {selected.sellerReviews} recensioni</div>
            </div>
            <div className="advisor-footer">
              <button className="btn-secondary" onClick={() => ai.ask("Perché questo prodotto ha questo punteggio AI?")}>Spiega lo score</button>
              <button className="btn-secondary"><Plus size={14} /> Aggiungi a inventario</button>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

/* ============================== AI INSIGHTS ============================== */

function InsightsPage() {
  const ai = useAI();
  const bestItems = useMemo(() => generateResults("occasioni migliori", 9).filter((i) => i.score >= 80).slice(0, 3), []);
  const flipPool = useMemo(() => generateResults("flip finder sottovalutati", 12), []);
  const flipFinder = useMemo(() => [...flipPool].sort((a, b) => (b.profit / b.price) - (a.profit / a.price))[0], [flipPool]);
  const bestTimeSeed = mulberry32(hashCode("best-time-" + new Date().toDateString()));
  const buyDay = pick(bestTimeSeed, ["domenica sera", "lunedì mattina", "mercoledì pomeriggio"]);
  const sellDay = pick(bestTimeSeed, ["venerdì sera", "sabato mattina", "domenica pomeriggio"]);

  const cards = [
    { icon: TrendingUp, tone: "green", title: "Trend in crescita", text: `${TOP_BRANDS_DATA[0].fullBrand} guida la domanda con un indice di ${TOP_BRANDS_DATA[0].domanda}/100, davanti a ${TOP_BRANDS_DATA[1].fullBrand}.`, q: "Quali categorie stanno crescendo?" },
    { icon: AlertTriangle, tone: "amber", title: "Categorie da evitare", text: `${CATEGORY_SPLIT[CATEGORY_SPLIT.length - 1].name} mostra la quota più bassa del mercato monitorato: margini ridotti nel breve periodo.`, q: "Perché il ROI è diminuito?" },
    { icon: Flame, tone: "red", title: "Migliori occasioni", text: bestItems.length ? `${bestItems.map((i) => i.title).join(", ")}.` : "Nessuna occasione top al momento.", q: "Qual è il miglior affare di oggi?" },
    { icon: Zap, tone: "gold", title: "🔥 Flip Finder", text: flipFinder ? `${flipFinder.title}: acquistalo a ${euro2(flipFinder.price)} e rivendilo a circa ${euro2(flipFinder.resaleAvg)} — margine più alto individuato oggi.` : "—", q: "Quali prodotti sono sottovalutati?" },
    { icon: Sparkles, tone: "green", title: "Categorie emergenti", text: `${CATEGORY_SPLIT[1].name} sta guadagnando terreno, con un aumento costante degli annunci ad alto punteggio.`, q: "Quali categorie stanno crescendo?" },
    { icon: Radar, tone: "blue", title: "Previsioni prossimi giorni", text: "Se il trend attuale prosegue, il ROI medio potrebbe salire di 2-3 punti percentuali nei prossimi 7 giorni.", q: "Fammi una previsione per i prossimi giorni" },
    { icon: Clock, tone: "gold", title: "Best Time to Buy / Sell", text: `Storicamente conviene acquistare la ${buyDay} (meno concorrenza) e pubblicare in vendita la ${sellDay} (picco di domanda).`, q: "Qual è il miglior affare di oggi?" },
  ];

  return (
    <div className="page">
      <SectionTitle eyebrow="Osservazioni generate dall'AI" title="AI Insights" />
      <AIHighlightable id="insights-panel" type="card">
        <div className="insights-grid">
          {cards.map((c) => (
            <GlassCard key={c.title} className="insight-card">
              <div className={`insight-icon tone-${c.tone}`}><c.icon size={16} /></div>
              <div className="chart-title" style={{ marginTop: 8 }}>{c.title}</div>
              <p className="muted small" style={{ lineHeight: 1.55 }}>{c.text}</p>
              <button className="btn-secondary small" onClick={() => ai.ask(c.q)}>Chiedi approfondimento</button>
            </GlassCard>
          ))}
        </div>
      </AIHighlightable>
    </div>
  );
}

/* ============================== ALERT ============================== */

function AlertsPage() {
  const [filters, setFilters] = useState({ brand: "", size: "", color: "", category: "", maxPrice: "", minRoi: "", minProfit: "", condition: "", country: "" });
  const [active, setActive] = useState(false);
  const feed = useMemo(() => {
    const rnd = mulberry32(hashCode(JSON.stringify(filters) + "alerts"));
    const brand = filters.brand || pick(rnd, BRANDS);
    return Array.from({ length: 6 }, (_, i) => {
      const price = 10 + Math.floor(rnd() * 80);
      const profit = Math.round(price * (0.4 + rnd() * 1.2));
      const roi = Math.round((profit / price) * 100);
      const mins = 1 + Math.floor(rnd() * 55);
      return { id: i, brand, category: filters.category || pick(rnd, CATEGORIES), price, profit, roi, mins };
    });
  }, [filters, active]);
  function update(k, v) { setFilters((f) => ({ ...f, [k]: v })); }

  return (
    <div className="page">
      <SectionTitle eyebrow="Notifiche in tempo reale" title="Alert" />
      <div className="grid-2 align-start">
        <GlassCard className="filter-card">
          <div className="chart-title" style={{ marginBottom: 12 }}><Filter size={15} /> Filtri di ricerca</div>
          <div className="filter-grid">
            <LabeledSelect label="Marca" value={filters.brand} onChange={(v) => update("brand", v)} options={BRANDS} />
            <LabeledSelect label="Taglia" value={filters.size} onChange={(v) => update("size", v)} options={SIZES} />
            <LabeledSelect label="Colore" value={filters.color} onChange={(v) => update("color", v)} options={COLORS_LIST} />
            <LabeledSelect label="Categoria" value={filters.category} onChange={(v) => update("category", v)} options={CATEGORIES} />
            <LabeledInput label="Prezzo massimo (€)" value={filters.maxPrice} onChange={(v) => update("maxPrice", v)} />
            <LabeledInput label="ROI minimo (%)" value={filters.minRoi} onChange={(v) => update("minRoi", v)} />
            <LabeledInput label="Profitto minimo (€)" value={filters.minProfit} onChange={(v) => update("minProfit", v)} />
            <LabeledSelect label="Condizione" value={filters.condition} onChange={(v) => update("condition", v)} options={CONDITIONS} />
            <LabeledSelect label="Paese" value={filters.country} onChange={(v) => update("country", v)} options={COUNTRIES} />
          </div>
          <button className="btn-primary full" onClick={() => setActive(true)}><Zap size={15} /> Attiva alert</button>
          {active && <div className="muted small" style={{ marginTop: 8 }}>Alert attivo — riceverai una notifica ad ogni nuovo annuncio compatibile.</div>}
        </GlassCard>
        <GlassCard>
          <div className="chart-title" style={{ marginBottom: 4 }}><Bell size={15} /> Notifiche recenti</div>
          <div className="muted small" style={{ marginBottom: 12 }}>Simulazione basata sui filtri impostati</div>
          <div className="alert-list">
            {feed.map((a) => (
              <div className="alert-item" key={a.id}>
                <div className="alert-icon"><Bell size={14} /></div>
                <div className="alert-body">
                  <div><b>{a.brand}</b> · {a.category} — nuovo annuncio a {euro2(a.price)}</div>
                  <div className="muted small">Profitto stimato {euro2(a.profit)} · ROI {a.roi}% · {a.mins} min fa</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
function LabeledSelect({ label, value, onChange, options }) {
  return (
    <label className="field"><span className="field-label">{label}</span>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Tutte/i</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
function LabeledInput({ label, value, onChange, type = "number", placeholder }) {
  return <label className="field"><span className="field-label">{label}</span><input className="input" type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></label>;
}
function PlainSelect({ label, value, onChange, options }) {
  return (
    <label className="field"><span className="field-label">{label}</span>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

/* ============================== VENDITORI ============================== */

function SellersPage() {
  const ai = useAI();
  const sellers = useMemo(() => generateSellers("napoli"), []);
  const avgReliability = Math.round(sellers.reduce((s, x) => s + x.reliability, 0) / sellers.length);
  const avgResponse = Math.round(sellers.reduce((s, x) => s + x.responseTime, 0) / sellers.length);
  const [myProfile, setMyProfile] = useState({ responseTime: 6, rating: 4.6, responseRate: 88 });
  const reviewThemes = [
    { label: "spedizione lenta", pct: 15, sentiment: "negative" },
    { label: "capo come descritto", pct: 42, sentiment: "positive" },
    { label: "imballaggio curato", pct: 28, sentiment: "positive" },
    { label: "risposta rapida ai messaggi", pct: 22, sentiment: "positive" },
  ];
  return (
    <div className="page">
      <SectionTitle eyebrow="Affidabilità venditori" title="Analisi del venditore" />

      <div className="grid-2 align-start">
        <GlassCard>
          <div className="chart-title" style={{ marginBottom: 10 }}><Award size={15} /> Il tuo Benchmark</div>
          <div className="filter-grid one-col">
            <LabeledInput label="Tuo tempo medio di risposta (h)" value={myProfile.responseTime} onChange={(v) => setMyProfile((p) => ({ ...p, responseTime: v }))} />
            <LabeledInput label="Tua valutazione media (1-5)" value={myProfile.rating} onChange={(v) => setMyProfile((p) => ({ ...p, rating: v }))} />
            <LabeledInput label="Tuo tasso di risposta (%)" value={myProfile.responseRate} onChange={(v) => setMyProfile((p) => ({ ...p, responseRate: v }))} />
          </div>
          <div className="sw-grid" style={{ marginTop: 6 }}>
            <div>
              <div className="micro-label">Tempo risposta (media categoria: {avgResponse}h)</div>
              <div className={Number(myProfile.responseTime) <= avgResponse ? "green-text" : "amber-text"}>{Number(myProfile.responseTime) <= avgResponse ? "Sei più veloce della media" : "Più lento della media di categoria"}</div>
            </div>
            <div>
              <div className="micro-label">Affidabilità (media categoria: {avgReliability}%)</div>
              <div className={myProfile.rating * 20 >= avgReliability ? "green-text" : "amber-text"}>{myProfile.rating * 20 >= avgReliability ? "In linea o sopra la media" : "Sotto la media di categoria"}</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="chart-title" style={{ marginBottom: 10 }}>Temi ricorrenti nelle recensioni</div>
          {reviewThemes.map((t) => (
            <div key={t.label} style={{ marginBottom: 10 }}>
              <div className="stat-row" style={{ marginBottom: 4 }}>
                <span className="muted small">{t.label}</span>
                <span className={`mono small ${t.sentiment === "positive" ? "green-text" : "red-text"}`}>{t.pct}%</span>
              </div>
              <div className="bar-mini" style={{ width: "100%" }}><div className="bar-mini-fill" style={{ width: `${t.pct}%`, background: t.sentiment === "positive" ? "var(--green)" : "var(--red)" }} /></div>
            </div>
          ))}
        </GlassCard>
      </div>

      <GlassCard className="table-card">
        <table className="table">
          <thead><tr><th>Venditore</th><th>Recensioni</th><th>Affidabilità</th><th>Tempo risposta</th><th>Frequenza pubblicazione</th><th>AI Score</th></tr></thead>
          <tbody>
            {sellers.map((s) => (
              <tr key={s.id}>
                <td className="cell-strong">@{s.name}</td>
                <td className="mono">{s.reviews}</td>
                <td><div className="bar-mini"><div className="bar-mini-fill" style={{ width: `${s.reliability}%` }} /></div><span className="muted small">{s.reliability}%</span></td>
                <td className="mono">{s.responseTime}h</td>
                <td className="mono">{s.freq}/settimana</td>
                <td>
                  <span className={`score-chip ${s.aiScore >= 80 ? "chip-green" : s.aiScore >= 60 ? "chip-blue" : "chip-amber"}`} style={{ cursor: "pointer" }}
                    onClick={() => ai.ask(`Perché il venditore @${s.name} ha uno score di affidabilità di ${s.aiScore}?`)}>{s.aiScore}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}

/* ============================== MERCATO ============================== */

function MarketPage({ range, setRange }) {
  const ai = useAI();
  const trend = useMemo(() => genTrend(range, "market"), [range]);

  function onPriceClick() {
    const start = trend[0].prezzo, end = trend[trend.length - 1].prezzo;
    const changePct = Math.round(((end - start) / start) * 1000) / 10;
    ai.analyzeChart("chart-market-price", { range, changePct });
  }
  function onTimeClick() {
    const avgDays = Math.round(trend.reduce((s, p) => s + p.venditaGiorni, 0) / trend.length);
    ai.analyzeChart("chart-market-time", { range, avgDays });
  }
  function onBrandsClick() {
    ai.analyzeChart("chart-brands", { topBrand: TOP_BRANDS_DATA[0].fullBrand, topValue: TOP_BRANDS_DATA[0].domanda, gap: TOP_BRANDS_DATA[0].domanda - TOP_BRANDS_DATA[1].domanda });
  }
  function onCategoryClick() {
    const total = CATEGORY_SPLIT.reduce((s, c) => s + c.value, 0);
    const topShare = Math.round((CATEGORY_SPLIT[0].value / total) * 100);
    ai.analyzeChart("chart-category", { topCategory: CATEGORY_SPLIT[0].name, topShare, lowCategory: CATEGORY_SPLIT[CATEGORY_SPLIT.length - 1].name });
  }

  return (
    <div className="page">
      <SectionTitle eyebrow="Dati di mercato" title="Analisi del mercato" right={
        <div className="range-toggle">
          {[30, 90, 365].map((r) => <button key={r} className={`toggle-btn ${range === r ? "active" : ""}`} onClick={(e) => { e.stopPropagation(); setRange(r); }}>{r}gg</button>)}
        </div>
      } />
      <div className="grid-2">
        <AIHighlightable id="chart-market-price" type="chart" onClick={onPriceClick}>
          <GlassCard className="chart-card">
            <div className="chart-title">Trend prezzo medio ({range} giorni)</div>
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={trend}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" stroke="#5b6b78" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#5b6b78" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip suffix="€" />} />
                <Line type="monotone" dataKey="prezzo" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>
        </AIHighlightable>

        <AIHighlightable id="chart-market-time" type="chart" onClick={onTimeClick}>
          <GlassCard className="chart-card">
            <div className="chart-title">Tempo medio di vendita (giorni)</div>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={trend}>
                <defs><linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f5b93d" stopOpacity={0.5} /><stop offset="100%" stopColor="#f5b93d" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" stroke="#5b6b78" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#5b6b78" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip suffix="gg" />} />
                <Area type="monotone" dataKey="venditaGiorni" stroke="#f5b93d" fill="url(#timeGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>
        </AIHighlightable>
      </div>

      <div className="grid-2">
        <AIHighlightable id="chart-brands" type="chart" onClick={onBrandsClick}>
          <GlassCard className="chart-card">
            <div className="chart-title">Marche più richieste</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={TOP_BRANDS_DATA}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="brand" stroke="#5b6b78" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#5b6b78" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip suffix="" />} />
                <Bar dataKey="domanda" fill="#00e28a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </AIHighlightable>

        <AIHighlightable id="chart-category" type="chart" onClick={onCategoryClick}>
          <GlassCard className="chart-card">
            <div className="chart-title">Distribuzione per categoria</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={CATEGORY_SPLIT} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {CATEGORY_SPLIT.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip content={<ChartTooltip suffix="%" />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="legend-wrap">{CATEGORY_SPLIT.map((c, i) => <span className="legend-item" key={c.name}><i style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />{c.name}</span>)}</div>
          </GlassCard>
        </AIHighlightable>
      </div>
    </div>
  );
}

/* ============================== CALCOLATORE ============================== */

function CalculatorPage() {
  const [purchase, setPurchase] = useState(25);
  const [shipping, setShipping] = useState(6);
  const [fees, setFees] = useState(3);
  const [salePrice, setSalePrice] = useState(60);
  const totalCost = Number(purchase || 0) + Number(shipping || 0) + Number(fees || 0);
  const netProfit = Number(salePrice || 0) - totalCost;
  const roi = totalCost > 0 ? Math.round((netProfit / totalCost) * 1000) / 10 : 0;
  const margin = salePrice > 0 ? Math.round((netProfit / salePrice) * 1000) / 10 : 0;
  const fastSalePrice = Math.round(totalCost * 1.55);
  const maxProfitPrice = Math.round(totalCost * 2.3);
  return (
    <div className="page">
      <SectionTitle eyebrow="Strumento" title="Calcolatore di profitto" />
      <div className="grid-2 align-start">
        <GlassCard>
          <div className="chart-title" style={{ marginBottom: 12 }}>Dati di acquisto</div>
          <div className="filter-grid one-col">
            <LabeledInput label="Prezzo di acquisto (€)" value={purchase} onChange={setPurchase} />
            <LabeledInput label="Costo spedizione (€)" value={shipping} onChange={setShipping} />
            <LabeledInput label="Spese aggiuntive / commissioni (€)" value={fees} onChange={setFees} />
            <LabeledInput label="Prezzo di vendita previsto (€)" value={salePrice} onChange={setSalePrice} />
          </div>
        </GlassCard>
        <div className="calc-results">
          <div className="grid-2">
            <KpiCard icon={Euro} label="Profitto netto" rawValue={netProfit} formatter={euro2} accent={netProfit >= 0 ? "green" : "red"} />
            <KpiCard icon={Percent} label="ROI" rawValue={roi} formatter={(n) => `${Math.round(n * 10) / 10}%`} accent="blue" />
          </div>
          <div className="grid-2">
            <KpiCard icon={BarChart3} label="Margine" rawValue={margin} formatter={(n) => `${Math.round(n * 10) / 10}%`} accent="blue" />
            <KpiCard icon={Wallet} label="Costo totale" rawValue={totalCost} formatter={euro2} accent="amber" />
          </div>
          <GlassCard>
            <div className="chart-title" style={{ marginBottom: 10 }}>Prezzi consigliati</div>
            <div className="recommend-row">
              <div><div className="micro-label">Vendita rapida</div><div className="mono price">{euro(fastSalePrice)}</div><div className="muted small">Prezzo competitivo per vendere in pochi giorni</div></div>
              <div><div className="micro-label">Massimo guadagno</div><div className="mono price green-text">{euro(maxProfitPrice)}</div><div className="muted small">Prezzo ottimale se puoi aspettare l'acquirente giusto</div></div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

/* ============================== INVENTARIO ============================== */

function skuFor(id) { return "VA-" + Math.abs(hashCode(String(id))).toString(36).toUpperCase().slice(0, 7); }
function CodeStripe({ value }) {
  const rnd = mulberry32(hashCode(value));
  const bars = Array.from({ length: 22 }, () => 1 + Math.floor(rnd() * 3));
  return <div className="code-stripe">{bars.map((w, i) => <span key={i} style={{ width: w * 2 }} className={i % 2 === 0 ? "bar-dark" : "bar-light"} />)}</div>;
}
function InventoryPage() {
  const [items, setItems] = useState(() => {
    const rnd = mulberry32(hashCode("inventory-seed"));
    const statuses = ["Disponibile", "Venduto", "Spedito"];
    return Array.from({ length: 5 }, (_, i) => {
      const buyPrice = 15 + Math.floor(rnd() * 60);
      const status = statuses[Math.floor(rnd() * statuses.length)];
      const sellPrice = status === "Disponibile" ? null : Math.round(buyPrice * (1.4 + rnd() * 0.9));
      return { id: i, name: `${pick(rnd, BRANDS)} ${pick(rnd, CATEGORIES)}`, buyDate: `${1 + Math.floor(rnd() * 27)}/0${1 + Math.floor(rnd() * 6)}/2026`, buyPrice, sellPrice, status };
    });
  });
  const [form, setForm] = useState({ name: "", buyPrice: "", sellPrice: "", status: "Disponibile" });
  function addItem() {
    if (!form.name || !form.buyPrice) return;
    setItems((prev) => [...prev, { id: Date.now(), name: form.name, buyDate: new Date().toLocaleDateString("it-IT"), buyPrice: Number(form.buyPrice), sellPrice: form.sellPrice ? Number(form.sellPrice) : null, status: form.status }]);
    setForm({ name: "", buyPrice: "", sellPrice: "", status: "Disponibile" });
  }
  function removeItem(id) { setItems((prev) => prev.filter((it) => it.id !== id)); }
  const totalUscite = items.reduce((s, it) => s + it.buyPrice, 0);
  const totalEntrate = items.reduce((s, it) => s + (it.sellPrice || 0), 0);
  const totalMargine = items.reduce((s, it) => s + (it.sellPrice ? it.sellPrice - it.buyPrice : 0), 0);
  return (
    <div className="page">
      <SectionTitle eyebrow="I tuoi acquisti" title="Gestione inventario" />
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <KpiCard icon={Wallet} label="Uscite totali" rawValue={totalUscite} formatter={euro2} accent="red" />
        <KpiCard icon={Euro} label="Entrate totali" rawValue={totalEntrate} formatter={euro2} accent="green" />
        <KpiCard icon={TrendingUp} label="Margine complessivo" rawValue={totalMargine} formatter={euro2} accent={totalMargine >= 0 ? "green" : "red"} />
      </div>
      <GlassCard style={{ marginBottom: 18 }}>
        <div className="chart-title" style={{ marginBottom: 12 }}><Plus size={15} /> Aggiungi articolo</div>
        <div className="filter-grid">
          <LabeledInput type="text" label="Nome articolo" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          <LabeledInput label="Prezzo di acquisto (€)" value={form.buyPrice} onChange={(v) => setForm((f) => ({ ...f, buyPrice: v }))} />
          <LabeledInput label="Prezzo di vendita (€)" value={form.sellPrice} onChange={(v) => setForm((f) => ({ ...f, sellPrice: v }))} />
          <LabeledSelect label="Stato" value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v }))} options={["Disponibile", "Venduto", "Spedito"]} />
        </div>
        <button className="btn-primary" onClick={addItem}><Plus size={14} /> Salva articolo</button>
      </GlassCard>
      <GlassCard className="table-card">
        <table className="table">
          <thead><tr><th>Articolo</th><th>Codice</th><th>Data acquisto</th><th>Prezzo acquisto</th><th>Prezzo vendita</th><th>Profitto</th><th>Stato</th><th></th></tr></thead>
          <tbody>
            {items.map((it) => {
              const profit = it.sellPrice ? it.sellPrice - it.buyPrice : null;
              const sku = skuFor(it.id);
              return (
                <tr key={it.id}>
                  <td className="cell-strong">{it.name}</td>
                  <td><CodeStripe value={sku} /><div className="mono" style={{ fontSize: 10, color: "var(--text-mute)" }}>{sku}</div></td>
                  <td className="muted">{it.buyDate}</td>
                  <td className="mono">{euro2(it.buyPrice)}</td>
                  <td className="mono">{it.sellPrice ? euro2(it.sellPrice) : "—"}</td>
                  <td className="mono">{profit !== null ? <span className={profit >= 0 ? "green-text" : "red-text"}>{euro2(profit)}</span> : "—"}</td>
                  <td><span className={`status-chip status-${it.status.toLowerCase()}`}>{it.status}</span></td>
                  <td><button className="icon-btn" onClick={() => removeItem(it.id)}><Trash2 size={14} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}

/* ============================== AI LISTING GENERATOR ============================== */

function ListingPage({ prefill }) {
  const [form, setForm] = useState({ name: "Felpa Stone Island", brand: "Stone Island", size: "L", condition: "Ottimo", category: "Streetwear" });
  const [output, setOutput] = useState(null);
  useEffect(() => {
    if (prefill) setForm((f) => ({ ...f, ...(prefill.name ? { name: prefill.name } : {}), ...(prefill.brand ? { brand: prefill.brand } : {}), ...(prefill.category ? { category: prefill.category } : {}) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);
  function generate() {
    const rnd = mulberry32(hashCode(JSON.stringify(form)));
    const hooks = ["Introvabile", "Rara", "Autentica", "Vintage", "Edizione limitata", "Come nuova"];
    const title = `${pick(rnd, hooks)} ${form.brand} ${form.name.replace(form.brand, "").trim() || form.category} tg.${form.size} — ${form.condition}`;
    const description = `${form.brand} ${form.category.toLowerCase()} in condizioni "${form.condition.toLowerCase()}", taglia ${form.size}. Articolo autentico, perfetto per il guardaroba streetwear o come pezzo da collezione. Spedizione rapida e curata, imballaggio protetto. Controlla le misure in tabella e scrivimi per qualsiasi domanda prima dell'acquisto.`;
    const hashtags = [form.brand, form.category, form.size, form.condition, "vinted", "streetwear", "vintage"].map((t) => "#" + t.replace(/\s+/g, "").toLowerCase());
    const keywords = [form.brand, form.category, `taglia ${form.size}`, form.condition, "originale", "autentico", "spedizione rapida"];
    const tier = BRAND_TIER[form.brand] || 1.3;
    const base = 18 + Math.round(rnd() * 55);
    const priceMin = Math.round(base * 0.85);
    const priceIdeal = Math.round(base * tier * 0.6);
    const priceMax = Math.round(priceIdeal * 1.35);
    const negotiation = `Accetta piccole trattative fino a ${euro(priceMin)}, ma non scendere oltre: sotto quella soglia il margine si riduce troppo. Se l'acquirente propone un prezzo troppo basso, offri di includere la spedizione invece di scontare ulteriormente.`;
    const autoReplies = [
      `Ciao! Sì, l'articolo è ancora disponibile ed è nelle condizioni descritte in foto. Fammi sapere se hai altre domande 😊`,
      `Grazie per l'interesse! Posso fare un piccolo sconto se acquisti insieme ad un altro articolo del mio armadio.`,
      `Il prezzo è leggermente trattabile, ma essendo ${form.condition.toLowerCase()} e originale ${form.brand}, il valore è già competitivo.`,
    ];
    setOutput({ title, description, hashtags, keywords, priceMin, priceIdeal, priceMax, negotiation, autoReplies });
  }
  return (
    <div className="page">
      <SectionTitle eyebrow="Generatore automatico" title="AI Listing Generator" />
      <div className="grid-2 align-start">
        <GlassCard>
          <div className="chart-title" style={{ marginBottom: 12 }}>Dettagli prodotto</div>
          <div className="filter-grid one-col">
            <LabeledInput type="text" label="Nome prodotto" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
            <LabeledSelect label="Marca" value={form.brand} onChange={(v) => setForm((f) => ({ ...f, brand: v }))} options={BRANDS} />
            <LabeledSelect label="Taglia" value={form.size} onChange={(v) => setForm((f) => ({ ...f, size: v }))} options={SIZES} />
            <LabeledSelect label="Condizione" value={form.condition} onChange={(v) => setForm((f) => ({ ...f, condition: v }))} options={CONDITIONS} />
            <LabeledSelect label="Categoria" value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} options={CATEGORIES} />
          </div>
          <button className="btn-primary full" onClick={generate}><Sparkles size={15} /> Genera con AI</button>
        </GlassCard>
        {output && (
          <GlassCard>
            <div className="eyebrow">Titolo ottimizzato</div><div className="listing-title">{output.title}</div>
            <div className="eyebrow" style={{ marginTop: 16 }}>Descrizione SEO</div><p className="listing-desc">{output.description}</p>
            <div className="eyebrow" style={{ marginTop: 16 }}>Hashtag</div><div className="tag-wrap">{output.hashtags.map((h) => <span className="hashtag" key={h}>{h}</span>)}</div>
            <div className="eyebrow" style={{ marginTop: 16 }}>Parole chiave</div><div className="tag-wrap">{output.keywords.map((k) => <span className="keyword" key={k}>{k}</span>)}</div>
            <div className="eyebrow" style={{ marginTop: 16 }}>Prezzo consigliato</div>
            <div className="recommend-row">
              <div><div className="micro-label">Minimo</div><div className="mono price">{euro(output.priceMin)}</div></div>
              <div><div className="micro-label">Ideale</div><div className="mono price green-text">{euro(output.priceIdeal)}</div></div>
              <div><div className="micro-label">Massimo</div><div className="mono price gold-text">{euro(output.priceMax)}</div></div>
            </div>
            <div className="eyebrow" style={{ marginTop: 16 }}>Strategia trattativa</div>
            <p className="listing-desc">{output.negotiation}</p>
            <div className="eyebrow" style={{ marginTop: 16 }}>Risposte automatiche</div>
            {output.autoReplies.map((r, i) => <p key={i} className="listing-desc" style={{ marginTop: 6 }}>💬 {r}</p>)}
          </GlassCard>
        )}
      </div>
    </div>
  );
}

/* ============================== AI PHOTO STUDIO ============================== */

const BG_PRESETS = [
  { id: "grey-carpet", label: "Tappeto grigio chiaro", swatch: "linear-gradient(160deg,#d9dadc,#b7b9bc)" },
  { id: "beige-carpet", label: "Tappeto beige", swatch: "linear-gradient(160deg,#e7dcc7,#cdbf9f)" },
  { id: "dark-carpet", label: "Tappeto grigio scuro", swatch: "linear-gradient(160deg,#7d8085,#4c4e52)" },
  { id: "light-floor", label: "Pavimento chiaro", swatch: "linear-gradient(180deg,#e8e2d6,#cfc6b4)" },
  { id: "neutral-parquet", label: "Parquet chiaro", swatch: "linear-gradient(180deg,#c9a06b,#a97c4a)" },
  { id: "dark-parquet", label: "Parquet scuro", swatch: "linear-gradient(180deg,#5a3d26,#3b271a)" },
  { id: "white-bg", label: "Fondo bianco", swatch: "radial-gradient(circle,#ffffff,#eef0f1)" },
  { id: "minimal-bg", label: "Fondo minimal", swatch: "radial-gradient(circle,#f6f7f8,#e7e9eb)" },
  { id: "vinted-style", label: "Stile Vinted", swatch: "linear-gradient(135deg,#eef4f1,#dde8e2)" },
  { id: "ebay-style", label: "Stile eBay", swatch: "linear-gradient(135deg,#ffffff,#f4f4f4)" },
  { id: "stockx-style", label: "Stile StockX", swatch: "linear-gradient(180deg,#f4f4f5,#e2e3e5)" },
  { id: "professional-style", label: "Stile professionale", swatch: "radial-gradient(circle,#9a9ca0,#5c5e63)" },
];
const CROP_FORMATS = [
  { id: "square", label: "Quadrato", exportW: 1200, exportH: 1200 },
  { id: "vertical", label: "Verticale", exportW: 1080, exportH: 1350 },
  { id: "vinted", label: "Formato Vinted", exportW: 1200, exportH: 1600 },
  { id: "instagram", label: "Instagram", exportW: 1080, exportH: 1350 },
  { id: "ebay", label: "Formato eBay", exportW: 1600, exportH: 1600 },
];
const EXPORT_QUALITY = { Alta: 0.8, Ultra: 0.92, Massima: 1 };

function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function clampByte(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
function loadImageEl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
function downscaleToCanvas(img, maxSize) {
  let w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
  const scale = Math.min(1, maxSize / Math.max(w, h));
  w = Math.max(1, Math.round(w * scale)); h = Math.max(1, Math.round(h * scale));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d").drawImage(img, 0, 0, w, h);
  return c;
}

function removeBackground(canvas, threshold) {
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext("2d");
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const idx = (x, y) => y * w + x;

  // stima iniziale del colore di sfondo, usata solo per decidere quali pixel
  // di bordo sono "semi di sfondo" validi da cui partire
  let rs = 0, gs = 0, bs = 0, n = 0;
  const stepX = Math.max(1, Math.floor(w / 60)), stepY = Math.max(1, Math.floor(h / 60));
  for (let x = 0; x < w; x += stepX) {
    let i = (0 * w + x) * 4; rs += data[i]; gs += data[i + 1]; bs += data[i + 2]; n++;
    i = ((h - 1) * w + x) * 4; rs += data[i]; gs += data[i + 1]; bs += data[i + 2]; n++;
  }
  for (let y = 0; y < h; y += stepY) {
    let i = (y * w + 0) * 4; rs += data[i]; gs += data[i + 1]; bs += data[i + 2]; n++;
    i = (y * w + (w - 1)) * 4; rs += data[i]; gs += data[i + 1]; bs += data[i + 2]; n++;
  }
  const bgR = rs / n, bgG = gs / n, bgB = bs / n;

  const mask = new Uint8ClampedArray(w * h);
  const visited = new Uint8Array(w * h);
  // coda con riferimento colore "locale": ogni pixel propaga confrontandosi
  // con il colore del vicino che l'ha marcato, non con la media globale fissa.
  // Questo segue gradienti/ombre/variazioni di luce sullo sfondo molto meglio
  // di un confronto a colore fisso, fermandosi comunque ai bordi netti del capo.
  const qx = new Int32Array(w * h), qy = new Int32Array(w * h);
  const qr = new Float32Array(w * h), qg = new Float32Array(w * h), qb = new Float32Array(w * h);
  let qHead = 0, qTail = 0;

  const seedTolerance = threshold * 1.6; // pi\u00f9 permissivo solo per accettare i semi iniziali sul bordo
  function trySeed(x, y) {
    const p = idx(x, y);
    if (visited[p]) return;
    const i = p * 4;
    const dr = data[i] - bgR, dg = data[i + 1] - bgG, db = data[i + 2] - bgB;
    if (Math.sqrt(dr * dr + dg * dg + db * db) < seedTolerance) {
      visited[p] = 1; mask[p] = 255;
      qx[qTail] = x; qy[qTail] = y; qr[qTail] = data[i]; qg[qTail] = data[i + 1]; qb[qTail] = data[i + 2];
      qTail++;
    }
  }
  for (let x = 0; x < w; x++) { trySeed(x, 0); trySeed(x, h - 1); }
  for (let y = 0; y < h; y++) { trySeed(0, y); trySeed(w - 1, y); }

  function tryPropagate(x, y, refR, refG, refB) {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = idx(x, y);
    if (visited[p]) return;
    visited[p] = 1;
    const i = p * 4;
    const dr = data[i] - refR, dg = data[i + 1] - refG, db = data[i + 2] - refB;
    if (Math.sqrt(dr * dr + dg * dg + db * db) < threshold) {
      mask[p] = 255;
      qx[qTail] = x; qy[qTail] = y; qr[qTail] = data[i]; qg[qTail] = data[i + 1]; qb[qTail] = data[i + 2];
      qTail++;
    }
  }
  while (qHead < qTail) {
    const x = qx[qHead], y = qy[qHead], r = qr[qHead], g = qg[qHead], b = qb[qHead];
    qHead++;
    tryPropagate(x + 1, y, r, g, b); tryPropagate(x - 1, y, r, g, b);
    tryPropagate(x, y + 1, r, g, b); tryPropagate(x, y - 1, r, g, b);
  }

  let m = mask;
  for (let pass = 0; pass < 3; pass++) {
    const blurred = new Uint8ClampedArray(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0, cnt = 0;
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            const nx = x + ox, ny = y + oy;
            if (nx >= 0 && ny >= 0 && nx < w && ny < h) { sum += m[idx(nx, ny)]; cnt++; }
          }
        }
        blurred[idx(x, y)] = sum / cnt;
      }
    }
    m = blurred;
  }
  for (let p = 0; p < w * h; p++) data[p * 4 + 3] = 255 - m[p];
  ctx.putImageData(imgData, 0, 0);

  const full = ctx.getImageData(0, 0, w, h).data;
  let minX = w, minY = h, maxX = 0, maxY = 0, any = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (full[(y * w + x) * 4 + 3] > 20) {
        any = true;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  if (!any) { minX = 0; minY = 0; maxX = w - 1; maxY = h - 1; }
  return { canvas, bbox: { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 } };
}

function autoLevels(canvas, bbox) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  let lo = 255, hi = 0;
  for (let y = bbox.minY; y <= bbox.maxY; y++) {
    for (let x = bbox.minX; x <= bbox.maxX; x++) {
      const i = (y * w + x) * 4;
      if (data[i + 3] < 20) continue;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < lo) lo = lum; if (lum > hi) hi = lum;
    }
  }
  if (hi - lo < 12) return;
  const range = hi - lo;
  for (let p = 0; p < data.length; p += 4) {
    if (data[p + 3] < 10) continue;
    for (let c = 0; c < 3; c++) data[p + c] = clampByte((data[p + c] - lo) / range * 255);
  }
  ctx.putImageData(imgData, 0, 0);
}
function unsharpMask(canvas, amount) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data);
  const idx = (x, y, c) => (y * w + x) * 4 + c;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      if (copy[i + 3] < 10) continue;
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) sum += copy[idx(x + ox, y + oy, c)];
        const blurred = sum / 9;
        data[i + c] = clampByte(copy[i + c] + amount * (copy[i + c] - blurred));
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}
function smartSmooth(canvas, strength) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data);
  const idx = (x, y, c) => (y * w + x) * 4 + c;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      if (copy[i + 3] < 10) continue;
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) sum += copy[idx(x + ox, y + oy, c)];
        const blurred = sum / 9;
        data[i + c] = clampByte(copy[i + c] * (1 - strength) + blurred * strength);
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}
function computeMetrics(canvas, bbox) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const imgData = ctx.getImageData(0, 0, w, canvas.height);
  const data = imgData.data;
  let sum = 0, sumSq = 0, n = 0, edgeSum = 0, edgeN = 0;
  for (let y = bbox.minY; y <= bbox.maxY; y++) {
    for (let x = bbox.minX; x <= bbox.maxX; x++) {
      const i = (y * w + x) * 4;
      if (data[i + 3] < 20) continue;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sum += lum; sumSq += lum * lum; n++;
      if (x < bbox.maxX) {
        const i2 = (y * w + x + 1) * 4;
        if (data[i2 + 3] >= 20) {
          const lum2 = 0.299 * data[i2] + 0.587 * data[i2 + 1] + 0.114 * data[i2 + 2];
          edgeSum += Math.abs(lum2 - lum); edgeN++;
        }
      }
    }
  }
  const brightness = n ? sum / n : 128;
  const variance = n ? Math.max(0, sumSq / n - brightness * brightness) : 0;
  const contrast = Math.sqrt(variance);
  const sharpness = edgeN ? edgeSum / edgeN : 0;
  const cx = (bbox.minX + bbox.maxX) / 2, cy = (bbox.minY + bbox.maxY) / 2;
  const offX = Math.abs(cx - canvas.width / 2) / (canvas.width / 2);
  const offY = Math.abs(cy - canvas.height / 2) / (canvas.height / 2);
  const centering = 1 - Math.min(1, (offX + offY) / 2);
  return { brightness, contrast, sharpness, centering };
}
function scoreFromMetrics(m) {
  const brightScore = clamp01(1 - Math.abs(m.brightness - 165) / 165);
  const contrastScore = clamp01(m.contrast / 55);
  const sharpScore = clamp01(m.sharpness / 18);
  const centerScore = clamp01(m.centering);
  let score = Math.round((brightScore * 0.28 + contrastScore * 0.22 + sharpScore * 0.28 + centerScore * 0.22) * 100);
  score = clamp(score, 10, 99);
  const notes = [];
  if (brightScore > 0.8) notes.push("Illuminazione eccellente.");
  else if (brightScore > 0.55) notes.push("Illuminazione buona, ma migliorabile.");
  else notes.push("Illuminazione da correggere: prova uno scatto con più luce naturale.");
  notes.push("Sfondo generato dall'AI: pulito e uniforme.");
  if (centerScore > 0.85) notes.push("Prodotto perfettamente centrato.");
  else notes.push("Il prodotto potrebbe essere centrato meglio nell'inquadratura.");
  if (contrastScore < 0.7) notes.push("Possibile miglioramento: aumentare leggermente il contrasto.");
  if (sharpScore < 0.6) notes.push("Possibile miglioramento: aumentare leggermente la nitidezza.");
  return { score, notes };
}
function addNoise(ctx, w, h, amount) {
  const n = Math.round((w * h) / 900);
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    ctx.fillStyle = `rgba(0,0,0,${(Math.random() * amount / 100).toFixed(3)})`;
    ctx.fillRect(x, y, 1.4, 1.4);
  }
}
function addPlanks(ctx, w, h, color) {
  ctx.strokeStyle = color; ctx.lineWidth = 1;
  for (let i = 1; i < 8; i++) { const y = (h / 8) * i; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
}
function addMarbleVeins(ctx, w, h, color) {
  ctx.strokeStyle = color; ctx.globalAlpha = 0.3;
  for (let i = 0; i < 6; i++) {
    let x = Math.random() * w, y = 0;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let s = 0; s < 6; s++) { x += (Math.random() - 0.5) * w * 0.28; y += h / 6; ctx.lineTo(x, y); }
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function addBlotches(ctx, w, h, color, count, maxR) {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 10 + Math.random() * maxR;
    ctx.globalAlpha = 0.03 + Math.random() * 0.05;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, Math.random() * Math.PI, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function shadeColor(hex, percent) {
  hex = hex.replace("#", "");
  const num = parseInt(hex, 16);
  let r = (num >> 16) & 0xff, g = (num >> 8) & 0xff, b = num & 0xff;
  r = Math.min(255, Math.max(0, r + Math.round(2.55 * percent)));
  g = Math.min(255, Math.max(0, g + Math.round(2.55 * percent)));
  b = Math.min(255, Math.max(0, b + Math.round(2.55 * percent)));
  return `rgb(${r},${g},${b})`;
}
// "AI" testuale: interpreta materiale + colore dal testo scritto dall'utente e disegna
// una texture procedurale coerente. Non è un modello di generazione immagini (quelli
// richiedono di scaricare pesi da internet, bloccato in questo ambiente sandbox) — è un
// motore di regole materiale->texture che risponde davvero a ciò che scrivi.
const TEXTURE_MATERIALS = [
  { keys: ["marmo"], type: "marble" },
  { keys: ["cemento", "calcestruzzo"], type: "concrete" },
  { keys: ["velluto"], type: "velvet" },
  { keys: ["legno", "parquet"], type: "wood" },
  { keys: ["tappeto", "moquette"], type: "carpet" },
  { keys: ["pietra", "sasso", "sassi"], type: "stone" },
  { keys: ["metallo", "acciaio", "alluminio"], type: "metal" },
  { keys: ["carta", "cartone", "kraft"], type: "paper" },
  { keys: ["stoffa", "tessuto", "lino", "cotone"], type: "fabric" },
];
const TEXTURE_COLORS = [
  ["bianco", "#f2f1ee"], ["nero", "#232324"], ["grigio scuro", "#4b4d51"], ["grigio", "#9a9a9e"],
  ["beige", "#e4d9c3"], ["blu scuro", "#1f2c3d"], ["blu", "#33465e"], ["verde scuro", "#233327"],
  ["verde", "#3d5c46"], ["rosso", "#7a3030"], ["marrone", "#5a4432"], ["rosa", "#caa0ab"],
  ["giallo", "#cbb35a"], ["azzurro", "#5c8aa0"], ["viola", "#5b4a6e"], ["crema", "#e9dfc9"],
];
function parseTexturePrompt(promptText) {
  const p = (promptText || "").toLowerCase();
  let type = "carpet";
  for (const m of TEXTURE_MATERIALS) if (m.keys.some((k) => p.includes(k))) { type = m.type; break; }
  let baseColor = "#c7c7c7";
  for (const [name, hex] of TEXTURE_COLORS) if (p.includes(name)) { baseColor = hex; break; }
  return { type, baseColor };
}
function drawGeneratedTexture(ctx, w, h, promptText) {
  const { type, baseColor } = parseTexturePrompt(promptText);
  const light = shadeColor(baseColor, 22), dark = shadeColor(baseColor, -24);
  switch (type) {
    case "marble": {
      const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, light); g.addColorStop(1, baseColor);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      addMarbleVeins(ctx, w, h, shadeColor(baseColor, -45)); addMarbleVeins(ctx, w, h, shadeColor(baseColor, 38));
      break;
    }
    case "concrete": {
      ctx.fillStyle = baseColor; ctx.fillRect(0, 0, w, h);
      addBlotches(ctx, w, h, dark, 40, 60); addBlotches(ctx, w, h, light, 30, 50); addNoise(ctx, w, h, 14);
      break;
    }
    case "velvet": {
      const g = ctx.createRadialGradient(w * 0.5, h * 0.4, 10, w * 0.5, h * 0.5, w * 0.85);
      g.addColorStop(0, light); g.addColorStop(1, dark); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      addNoise(ctx, w, h, 6);
      break;
    }
    case "wood": {
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, light); g.addColorStop(1, dark);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); addPlanks(ctx, w, h, "rgba(0,0,0,0.18)"); addNoise(ctx, w, h, 8);
      break;
    }
    case "stone": {
      ctx.fillStyle = baseColor; ctx.fillRect(0, 0, w, h);
      addBlotches(ctx, w, h, dark, 60, 40); addBlotches(ctx, w, h, light, 40, 30); addNoise(ctx, w, h, 16);
      break;
    }
    case "metal": {
      const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, dark); g.addColorStop(0.5, light); g.addColorStop(1, dark);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); addNoise(ctx, w, h, 5);
      break;
    }
    case "paper": { ctx.fillStyle = light; ctx.fillRect(0, 0, w, h); addNoise(ctx, w, h, 10); break; }
    case "fabric": { ctx.fillStyle = baseColor; ctx.fillRect(0, 0, w, h); addNoise(ctx, w, h, 18); break; }
    default: {
      const g = ctx.createRadialGradient(w * 0.5, h * 0.4, 10, w * 0.5, h * 0.5, w * 0.8);
      g.addColorStop(0, light); g.addColorStop(1, dark); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); addNoise(ctx, w, h, 12);
    }
  }
}
const customBgRegistry = {}; // id -> testo prompt, usato da drawBackgroundPreset per gli sfondi generati
function drawBackgroundPreset(ctx, w, h, presetId) {
  if (presetId && presetId.startsWith("custom-")) {
    drawGeneratedTexture(ctx, w, h, customBgRegistry[presetId] || "");
    return;
  }
  switch (presetId) {
    case "grey-carpet": { const g = ctx.createRadialGradient(w * 0.5, h * 0.4, 10, w * 0.5, h * 0.5, w * 0.8); g.addColorStop(0, "#d9dadc"); g.addColorStop(1, "#b7b9bc"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); addNoise(ctx, w, h, 10); break; }
    case "beige-carpet": { const g = ctx.createRadialGradient(w * 0.5, h * 0.4, 10, w * 0.5, h * 0.5, w * 0.8); g.addColorStop(0, "#e7dcc7"); g.addColorStop(1, "#cdbf9f"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); addNoise(ctx, w, h, 10); break; }
    case "dark-carpet": { const g = ctx.createRadialGradient(w * 0.5, h * 0.4, 10, w * 0.5, h * 0.5, w * 0.8); g.addColorStop(0, "#7d8085"); g.addColorStop(1, "#4c4e52"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); addNoise(ctx, w, h, 12); break; }
    case "light-floor": { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#e8e2d6"); g.addColorStop(1, "#cfc6b4"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); addPlanks(ctx, w, h, "rgba(0,0,0,0.04)"); break; }
    case "neutral-parquet": { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#c9a06b"); g.addColorStop(1, "#a97c4a"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); addPlanks(ctx, w, h, "rgba(0,0,0,0.14)"); break; }
    case "dark-parquet": { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#5a3d26"); g.addColorStop(1, "#3b271a"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); addPlanks(ctx, w, h, "rgba(0,0,0,0.22)"); break; }
    case "white-bg": { const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.85); g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#eef0f1"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); break; }
    case "minimal-bg": { ctx.fillStyle = "#f1f2f4"; ctx.fillRect(0, 0, w, h); const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.8); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.06)"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); break; }
    case "vinted-style": { const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#eef4f1"); g.addColorStop(1, "#dde8e2"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); break; }
    case "ebay-style": { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h); break; }
    case "stockx-style": { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#f4f4f5"); g.addColorStop(1, "#e2e3e5"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); break; }
    case "professional-style": { const g = ctx.createRadialGradient(w / 2, h * 0.35, 10, w / 2, h / 2, w * 0.9); g.addColorStop(0, "#9a9ca0"); g.addColorStop(1, "#5c5e63"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); break; }
    default: ctx.fillStyle = "#eeeeee"; ctx.fillRect(0, 0, w, h);
  }
}
function compositeForFormat(fgCanvas, bbox, bgPresetId, formatId, resMult) {
  resMult = resMult || 1;
  const format = CROP_FORMATS.find((f) => f.id === formatId) || CROP_FORMATS[0];
  const W = format.exportW * resMult, H = format.exportH * resMult;
  const out = document.createElement("canvas"); out.width = W; out.height = H;
  const ctx = out.getContext("2d");
  drawBackgroundPreset(ctx, W, H, bgPresetId);
  const targetH = H * 0.66;
  const scale = targetH / bbox.h;
  const drawW = bbox.w * scale, drawH = bbox.h * scale;
  const dx = (W - drawW) / 2, dy = (H - drawH) / 2;
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.ellipse(W / 2, dy + drawH * 0.98, drawW * 0.36, Math.max(4, drawH * 0.045), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.drawImage(fgCanvas, bbox.minX, bbox.minY, bbox.w, bbox.h, dx, dy, drawW, drawH);
  return out;
}
function autoWhiteBalance(canvas, bbox) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const imgData = ctx.getImageData(0, 0, w, canvas.height);
  const data = imgData.data;
  let rs = 0, gs = 0, bs = 0, n = 0;
  for (let y = bbox.minY; y <= bbox.maxY; y++) {
    for (let x = bbox.minX; x <= bbox.maxX; x++) {
      const i = (y * w + x) * 4;
      if (data[i + 3] < 20) continue;
      rs += data[i]; gs += data[i + 1]; bs += data[i + 2]; n++;
    }
  }
  if (!n) return;
  const avg = (rs + gs + bs) / (3 * n);
  const rGain = avg / Math.max(1, rs / n), gGain = avg / Math.max(1, gs / n), bGain = avg / Math.max(1, bs / n);
  for (let p = 0; p < data.length; p += 4) {
    if (data[p + 3] < 10) continue;
    data[p] = clampByte(data[p] * rGain);
    data[p + 1] = clampByte(data[p + 1] * gGain);
    data[p + 2] = clampByte(data[p + 2] * bGain);
  }
  ctx.putImageData(imgData, 0, 0);
}
function adjustSaturation(canvas, amount) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  for (let p = 0; p < data.length; p += 4) {
    if (data[p + 3] < 10) continue;
    const r = data[p], g = data[p + 1], b = data[p + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    data[p] = clampByte(gray + (r - gray) * amount);
    data[p + 1] = clampByte(gray + (g - gray) * amount);
    data[p + 2] = clampByte(gray + (b - gray) * amount);
  }
  ctx.putImageData(imgData, 0, 0);
}
function denoise(canvas) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data);
  const idx = (x, y, c) => (y * w + x) * 4 + c;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      if (copy[i + 3] < 10) continue;
      for (let c = 0; c < 3; c++) {
        const vals = [];
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) vals.push(copy[idx(x + ox, y + oy, c)]);
        vals.sort((a, b) => a - b);
        data[i + c] = vals[4];
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}
function rotateCanvas(canvas, degrees) {
  if (!degrees) return canvas;
  const rad = (degrees * Math.PI) / 180;
  const w = canvas.width, h = canvas.height;
  const out = document.createElement("canvas"); out.width = w; out.height = h;
  const ctx = out.getContext("2d");
  ctx.translate(w / 2, h / 2); ctx.rotate(rad); ctx.drawImage(canvas, -w / 2, -h / 2);
  return out;
}
function decontaminateEdges(canvas, bbox) {
  // rimuove l'alone/frangia colorata dello sfondo che resta mescolata ai pixel
  // di bordo del capo dopo il ritaglio (color fringing), tipica di JPEG/compressione.
  // Per ogni pixel semi-trasparente (bordo), spinge il colore verso quello dei
  // pixel vicini pienamente opachi (interni al capo), riducendo la contaminazione.
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data);
  const idx = (x, y) => (y * w + x) * 4;
  for (let y = Math.max(1, bbox.minY - 2); y <= Math.min(h - 2, bbox.maxY + 2); y++) {
    for (let x = Math.max(1, bbox.minX - 2); x <= Math.min(w - 2, bbox.maxX + 2); x++) {
      const i = idx(x, y);
      const a = copy[i + 3];
      if (a === 0 || a === 255) continue; // solo i pixel di bordo semi-trasparenti
      let rs = 0, gs = 0, bs = 0, n = 0;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const ni = idx(x + ox, y + oy);
          if (copy[ni + 3] > 200) { rs += copy[ni]; gs += copy[ni + 1]; bs += copy[ni + 2]; n++; }
        }
      }
      if (n === 0) continue;
      const mixR = rs / n, mixG = gs / n, mixB = bs / n;
      const w2 = 0.55; // quanto tirare il colore verso l'interno del capo
      data[i] = copy[i] * (1 - w2) + mixR * w2;
      data[i + 1] = copy[i + 1] * (1 - w2) + mixG * w2;
      data[i + 2] = copy[i + 2] * (1 - w2) + mixB * w2;
    }
  }
  ctx.putImageData(imgData, 0, 0);
}
async function processPhotoPipeline(img, settings) {
  await new Promise((r) => setTimeout(r, 10));
  let work = downscaleToCanvas(img, 1600);
  if (settings.rotation) work = rotateCanvas(work, settings.rotation);
  const { canvas: fgCanvas, bbox } = removeBackground(work, settings.threshold);
  decontaminateEdges(fgCanvas, bbox);
  if (settings.whiteBalance) autoWhiteBalance(fgCanvas, bbox);
  if (settings.autoLight) autoLevels(fgCanvas, bbox);
  if (settings.denoise) denoise(fgCanvas);
  if (settings.smooth) smartSmooth(fgCanvas, 0.16);
  if (settings.sharpen) unsharpMask(fgCanvas, 0.5);
  if (settings.vibrance) adjustSaturation(fgCanvas, 1.18);
  const metrics = computeMetrics(fgCanvas, bbox);
  const { score, notes } = scoreFromMetrics(metrics);
  const composedByFormat = {};
  CROP_FORMATS.forEach((f) => { composedByFormat[f.id] = compositeForFormat(fgCanvas, bbox, settings.background, f.id).toDataURL("image/png"); });
  return { fgCanvas, bbox, metrics, score, notes, composedByFormat };
}
function recompositeAllFormats(fgCanvas, bbox, bgPresetId) {
  const composedByFormat = {};
  CROP_FORMATS.forEach((f) => { composedByFormat[f.id] = compositeForFormat(fgCanvas, bbox, bgPresetId, f.id).toDataURL("image/png"); });
  return composedByFormat;
}
async function downloadDataUrl(dataUrl, filename, format, quality) {
  if (format === "png") {
    const a = document.createElement("a"); a.href = dataUrl; a.download = filename + ".png"; a.click();
    return;
  }
  const img = await loadImageEl(dataUrl);
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const ctx = c.getContext("2d");
  if (format === "jpg") { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, c.width, c.height); }
  ctx.drawImage(img, 0, 0);
  const mime = format === "jpg" ? "image/jpeg" : "image/webp";
  const outUrl = c.toDataURL(mime, quality);
  const a = document.createElement("a"); a.href = outUrl; a.download = `${filename}.${format}`; a.click();
}

function BeforeAfterSlider({ before, after }) {
  const [pct, setPct] = useState(50);
  const ref = useRef(null);
  function updateFromX(clientX) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPct(clamp(((clientX - rect.left) / rect.width) * 100, 0, 100));
  }
  function onDown(e) {
    e.preventDefault();
    const getX = (ev) => (ev.touches ? ev.touches[0].clientX : ev.clientX);
    updateFromX(getX(e.nativeEvent || e));
    function move(ev) { updateFromX(getX(ev)); }
    function up() {
      window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move); window.removeEventListener("touchend", up);
    }
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move); window.addEventListener("touchend", up);
  }
  return (
    <div className="ba-slider" ref={ref}>
      {before ? <img src={before} className="ba-img" draggable={false} alt="Originale" /> : <div className="ba-placeholder" />}
      {after && (
        <div className="ba-after-wrap" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}>
          <img src={after} className="ba-img" draggable={false} alt="Migliorata" />
        </div>
      )}
      {after && <div className="ba-handle" style={{ left: `${pct}%` }} onMouseDown={onDown} onTouchStart={onDown}><span className="ba-handle-grip" /></div>}
      <span className="ba-label ba-label-left">PRIMA</span>
      {after && <span className="ba-label ba-label-right">DOPO</span>}
    </div>
  );
}

function ScoreRing({ score }) {
  const color = score >= 85 ? "#00e28a" : score >= 65 ? "#3b82f6" : score >= 45 ? "#f5b93d" : "#ff5470";
  return (
    <div className="score-ring" style={{ background: `conic-gradient(${color} ${score * 3.6}deg, rgba(255,255,255,0.08) 0)` }}>
      <div className="score-ring-inner">
        <div className="score-ring-value mono">{score}</div>
        <div className="score-ring-label">/100</div>
      </div>
    </div>
  );
}

function PhotoStudioPage({ onSendToListing }) {
  const [photos, setPhotos] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [settings, setSettings] = useState({ background: "white-bg", format: "square", threshold: 42, autoLight: true, whiteBalance: true, smooth: true, sharpen: true, denoise: false, vibrance: false, rotation: 0, exportFormat: "png", exportQuality: "Alta", exportScale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [listingBusy, setListingBusy] = useState(false);
  const fileInputRef = useRef(null);
  const [customBackgrounds, setCustomBackgrounds] = useState([]);
  useEffect(() => {
    try {
      if (window.storage) {
        window.storage.get("photostudio:customBackgrounds").then((r) => {
          if (r && r.value) {
            const saved = JSON.parse(r.value);
            if (Array.isArray(saved)) {
              saved.forEach((bg) => { if (bg.prompt) customBgRegistry[bg.id] = bg.prompt; });
              setCustomBackgrounds(saved);
            }
          }
        }).catch(() => {});
      }
    } catch (e) {}
  }, []);
  const [texturePrompt, setTexturePrompt] = useState("");
  const [touchUpMode, setTouchUpMode] = useState(null); // null | "keep" | "erase"
  const [brushSize, setBrushSize] = useState(26);
  const touchUpCanvasRef = useRef(null);
  const isPaintingRef = useRef(false);

  useEffect(() => {
    function onPaste(e) {
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      const files = [];
      for (let i = 0; i < items.length; i++) if (items[i].type && items[i].type.startsWith("image/")) files.push(items[i].getAsFile());
      if (files.length) handleFiles(files);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  async function handleFiles(fileList) {
    const files = Array.from(fileList).filter((f) => f.type && f.type.startsWith("image/"));
    for (const file of files) {
      const id = uid();
      const dataUrl = await fileToDataUrl(file);
      setPhotos((prev) => [...prev, { id, name: file.name || "foto", originalDataUrl: dataUrl, state: "processing", result: null }]);
      setActiveId((cur) => cur || id);
      try {
        const img = await loadImageEl(dataUrl);
        const result = await processPhotoPipeline(img, settings);
        setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, state: "done", result } : p)));
      } catch (e) {
        setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, state: "error" } : p)));
      }
    }
  }
  function onDrop(e) { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }
  function onDragOver(e) { e.preventDefault(); setIsDragging(true); }
  function onDragLeave(e) { e.preventDefault(); setIsDragging(false); }

  function changeBackground(bgId) {
    setSettings((s) => ({ ...s, background: bgId }));
    setPhotos((prev) => prev.map((p) => {
      if (p.state !== "done" || !p.result) return p;
      const composedByFormat = recompositeAllFormats(p.result.fgCanvas, p.result.bbox, bgId);
      return { ...p, result: { ...p.result, composedByFormat } };
    }));
  }
  function changeFormat(fmtId) { setSettings((s) => ({ ...s, format: fmtId })); }
  function toggleEnhance(key) { setSettings((s) => ({ ...s, [key]: !s[key] })); }
  const thresholdDebounce = useRef(null);
  function changeThreshold(v) {
    const val = Number(v);
    setSettings((s) => ({ ...s, threshold: val }));
    if (thresholdDebounce.current) clearTimeout(thresholdDebounce.current);
    thresholdDebounce.current = setTimeout(async () => {
      const current = photos.find((p) => p.id === activeId);
      if (!current || current.state === "processing") return;
      setPhotos((prev) => prev.map((q) => (q.id === current.id ? { ...q, state: "processing" } : q)));
      try {
        const img = await loadImageEl(current.originalDataUrl);
        const result = await processPhotoPipeline(img, { ...settings, threshold: val });
        setPhotos((prev) => prev.map((q) => (q.id === current.id ? { ...q, state: "done", result } : q)));
      } catch (e) {
        setPhotos((prev) => prev.map((q) => (q.id === current.id ? { ...q, state: "error" } : q)));
      }
    }, 300);
  }
  function changeRotation(v) { setSettings((s) => ({ ...s, rotation: Number(v) })); }

  function generateTextureBackground() {
    if (!texturePrompt.trim()) return;
    const id = `custom-${Date.now()}`;
    customBgRegistry[id] = texturePrompt.trim();
    const preview = document.createElement("canvas"); preview.width = 120; preview.height = 90;
    drawGeneratedTexture(preview.getContext("2d"), 120, 90, texturePrompt.trim());
    const swatchUrl = preview.toDataURL("image/png");
    setCustomBackgrounds((prev) => {
      const next = [{ id, label: texturePrompt.trim(), swatchUrl, prompt: texturePrompt.trim() }, ...prev].slice(0, 12);
      try { if (window.storage) window.storage.set("photostudio:customBackgrounds", JSON.stringify(next), false).catch(() => {}); } catch (e) {}
      return next;
    });
    changeBackground(id);
  }

  function drawTouchUpCanvas() {
    const activeP = photos.find((p) => p.id === activeId);
    const canvasEl = touchUpCanvasRef.current;
    if (!activeP || !activeP.result || !canvasEl) return;
    const fg = activeP.result.fgCanvas;
    canvasEl.width = fg.width; canvasEl.height = fg.height;
    const ctx = canvasEl.getContext("2d");
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    const tile = 12;
    for (let y = 0; y < canvasEl.height; y += tile) {
      for (let x = 0; x < canvasEl.width; x += tile) {
        ctx.fillStyle = ((x / tile + y / tile) % 2 === 0) ? "#3a3f45" : "#2c3035";
        ctx.fillRect(x, y, tile, tile);
      }
    }
    ctx.drawImage(fg, 0, 0);
  }
  useEffect(() => { if (touchUpMode) drawTouchUpCanvas(); }, [touchUpMode, activeId]);

  function paintAt(clientX, clientY) {
    const activeP = photos.find((p) => p.id === activeId);
    const canvasEl = touchUpCanvasRef.current;
    if (!activeP || !activeP.result || !canvasEl || !touchUpMode) return;
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = canvasEl.width / rect.width, scaleY = canvasEl.height / rect.height;
    const cx = (clientX - rect.left) * scaleX, cy = (clientY - rect.top) * scaleY;
    const fg = activeP.result.fgCanvas;
    const ctx = fg.getContext("2d");
    const imgData = ctx.getImageData(0, 0, fg.width, fg.height);
    const data = imgData.data;
    const r = brushSize;
    const alphaVal = touchUpMode === "keep" ? 255 : 0;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const px = Math.round(cx + dx), py = Math.round(cy + dy);
        if (px < 0 || py < 0 || px >= fg.width || py >= fg.height) continue;
        data[(py * fg.width + px) * 4 + 3] = alphaVal;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    drawTouchUpCanvas();
  }
  function onTouchUpDown(e) { isPaintingRef.current = true; const p = e.touches ? e.touches[0] : e; paintAt(p.clientX, p.clientY); }
  function onTouchUpMove(e) { if (!isPaintingRef.current) return; const p = e.touches ? e.touches[0] : e; paintAt(p.clientX, p.clientY); }
  function onTouchUpUp() {
    if (!isPaintingRef.current) return;
    isPaintingRef.current = false;
    const activeP = photos.find((p) => p.id === activeId);
    if (!activeP || !activeP.result) return;
    const composedByFormat = recompositeAllFormats(activeP.result.fgCanvas, activeP.result.bbox, settings.background);
    setPhotos((prev) => prev.map((q) => (q.id === activeP.id ? { ...q, result: { ...q.result, composedByFormat } } : q)));
  }

  async function applyToBatch(customSettings) {
    const useSettings = customSettings || settings;
    if (customSettings) setSettings(customSettings);
    setExporting(true);
    for (const p of photos) {
      try {
        const img = await loadImageEl(p.originalDataUrl);
        setPhotos((prev) => prev.map((q) => (q.id === p.id ? { ...q, state: "processing" } : q)));
        const result = await processPhotoPipeline(img, useSettings);
        setPhotos((prev) => prev.map((q) => (q.id === p.id ? { ...q, state: "done", result } : q)));
      } catch (e) {
        setPhotos((prev) => prev.map((q) => (q.id === p.id ? { ...q, state: "error" } : q)));
      }
    }
    setExporting(false);
  }
  function applyVintedMode() {
    applyToBatch({ ...settings, background: "minimal-bg", format: "vinted", autoLight: true, whiteBalance: true, smooth: true, sharpen: true, denoise: true, vibrance: true, rotation: 0 });
  }
  async function oneClickListing(photo) {
    if (!photo) return;
    setListingBusy(true);
    try {
      const mediaType = (photo.originalDataUrl.match(/^data:([^;]+);/) || [, "image/jpeg"])[1];
      const base64 = photo.originalDataUrl.split(",")[1];
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 200,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: `Guarda l'immagine di questo capo/accessorio. Rispondi SOLO con un oggetto JSON valido nella forma {"brand":"...","category":"..."}. Per brand scegli tra: ${BRANDS.join(", ")}, oppure il nome reale se lo riconosci. Per category scegli esattamente una tra: ${CATEGORIES.join(", ")}.` },
          ] }],
        }),
      });
      let brand = "Vintage Anni '90", category = "Streetwear";
      if (resp.ok) {
        const data = await resp.json();
        const tb = (data.content || []).find((c) => c.type === "text");
        if (tb) {
          try {
            const clean = tb.text.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
            const parsed = JSON.parse(clean);
            if (parsed.brand) brand = parsed.brand;
            if (parsed.category) category = parsed.category;
          } catch (e) {}
        }
      }
      if (!photo.result || photo.result.composedByFormat.vinted === undefined) {
        await applyVintedMode();
      }
      onSendToListing && onSendToListing({ name: `${brand} ${category}`, brand, category, _ts: Date.now() });
    } catch (e) {
      onSendToListing && onSendToListing({ _ts: Date.now() });
    }
    setListingBusy(false);
  }

  function removePhoto(id) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setActiveId((cur) => (cur === id ? null : cur));
  }

  const active = photos.find((p) => p.id === activeId) || null;
  const doneCount = photos.filter((p) => p.state === "done").length;

  async function exportPhoto(photo) {
    if (!photo.result) return;
    const scale = settings.exportScale || 1;
    let dataUrl;
    if (scale > 1) {
      const hiResCanvas = compositeForFormat(photo.result.fgCanvas, photo.result.bbox, settings.background, settings.format, scale);
      dataUrl = hiResCanvas.toDataURL("image/png");
    } else {
      dataUrl = photo.result.composedByFormat[settings.format];
    }
    await downloadDataUrl(dataUrl, `${photo.name.replace(/\.[^.]+$/, "")}_${settings.format}${scale > 1 ? `_${scale}x` : ""}`, settings.exportFormat, EXPORT_QUALITY[settings.exportQuality]);
  }
  async function exportBatch() {
    setExporting(true);
    for (const p of photos) {
      if (p.result) { await exportPhoto(p); await new Promise((r) => setTimeout(r, 350)); }
    }
    setExporting(false);
  }

  return (
    <div className="page">
      <SectionTitle eyebrow="Studio fotografico virtuale" title="AI Photo Studio" right={doneCount > 0 ? <StatPill label="Foto elaborate" value={`${doneCount}/${photos.length}`} tone="green" /> : null} />

      <GlassCard className={`upload-zone ${isDragging ? "dragging" : ""}`} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onClick={() => fileInputRef.current && fileInputRef.current.click()}>
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        <UploadCloud size={26} className="blue-text" />
        <div className="chart-title">Trascina qui le tue foto, incollale (Ctrl+V) o clicca per caricarle</div>
        <div className="muted small">Puoi caricare più immagini contemporaneamente — fronte, retro e dettagli dello stesso capo.</div>
      </GlassCard>

      {photos.length > 0 && (
        <>
          <div className="thumb-strip">
            {photos.map((p) => (
              <div key={p.id} className={`thumb ${activeId === p.id ? "thumb-active" : ""}`} onClick={() => setActiveId(p.id)}>
                <img src={(p.result && p.result.composedByFormat[settings.format]) || p.originalDataUrl} alt={p.name} />
                {p.state === "processing" && <div className="thumb-overlay"><Loader2 size={16} className="spin" /></div>}
                {p.state === "done" && <span className={`thumb-score ${p.result.score >= 80 ? "sc-green" : p.result.score >= 55 ? "sc-blue" : "sc-amber"}`}>{p.result.score}</span>}
                <button className="thumb-remove" onClick={(e) => { e.stopPropagation(); removePhoto(p.id); }}><X size={11} /></button>
              </div>
            ))}
          </div>

          <div className="studio-layout">
            <div className="studio-main">
              <GlassCard>
                <div className="chart-head">
                  <div className="chart-title"><Wand2 size={15} /> Prima / Dopo</div>
                  <div className="range-toggle">
                    {CROP_FORMATS.map((f) => <button key={f.id} className={`toggle-btn ${settings.format === f.id ? "active" : ""}`} onClick={() => changeFormat(f.id)}>{f.label}</button>)}
                  </div>
                </div>
                {active ? (
                  touchUpMode ? (
                    <div>
                      <canvas
                        ref={touchUpCanvasRef}
                        style={{ width: "100%", borderRadius: 10, cursor: "crosshair", touchAction: "none" }}
                        onMouseDown={onTouchUpDown} onMouseMove={onTouchUpMove} onMouseUp={onTouchUpUp} onMouseLeave={onTouchUpUp}
                        onTouchStart={onTouchUpDown} onTouchMove={onTouchUpMove} onTouchEnd={onTouchUpUp}
                      />
                      <div className="muted small" style={{ marginTop: 6 }}>
                        {touchUpMode === "keep" ? "🖌️ Ripristina: disegna sulle zone che dovrebbero far parte del capo ma sono state cancellate per sbaglio." : "🧹 Cancella: disegna sulle zone di sfondo rimaste attaccate al capo."}
                      </div>
                    </div>
                  ) : (
                    <BeforeAfterSlider before={active.originalDataUrl} after={active.result ? active.result.composedByFormat[settings.format] : null} />
                  )
                ) : <div className="muted small">Seleziona una foto dalla strip qui sopra.</div>}
                {active && active.state === "processing" && <div className="muted small" style={{ marginTop: 8 }}><Loader2 size={12} className="spin" style={{ marginRight: 5 }} /> Elaborazione AI in corso…</div>}
                {active && active.result && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
                    <button className={`chip ${touchUpMode === "keep" ? "chip-active" : ""}`} onClick={() => setTouchUpMode(touchUpMode === "keep" ? null : "keep")}>🖌️ Ripristina zona</button>
                    <button className={`chip ${touchUpMode === "erase" ? "chip-active" : ""}`} onClick={() => setTouchUpMode(touchUpMode === "erase" ? null : "erase")}>🧹 Cancella zona</button>
                    {touchUpMode && (
                      <>
                        <span className="muted small">Dimensione pennello</span>
                        <input type="range" min="6" max="70" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} style={{ width: 100 }} />
                        <button className="chip" onClick={() => setTouchUpMode(null)}>Fine ritocco</button>
                      </>
                    )}
                  </div>
                )}
              </GlassCard>

              {active && active.result && (
                <GlassCard className="quality-card">
                  <ScoreRing score={active.result.score} />
                  <div className="quality-notes">
                    <div className="chart-title" style={{ marginBottom: 6 }}><Gauge size={15} /> AI Quality Score</div>
                    {active.result.notes.map((n, i) => <div key={i} className="muted small" style={{ marginBottom: 3 }}>• {n}</div>)}
                  </div>
                </GlassCard>
              )}
            </div>

            <div className="studio-sidebar">
              <GlassCard>
                <div className="chart-title" style={{ marginBottom: 10 }}><Layers size={15} /> Background Vinted</div>
                <div className="bg-grid">
                  {BG_PRESETS.map((bg) => (
                    <button key={bg.id} className={`bg-swatch ${settings.background === bg.id ? "bg-active" : ""}`} style={{ background: bg.swatch }} title={bg.label} onClick={() => changeBackground(bg.id)}>
                      {settings.background === bg.id && <CheckCircle2 size={13} />}
                    </button>
                  ))}
                  {customBackgrounds.map((bg) => (
                    <button key={bg.id} className={`bg-swatch ${settings.background === bg.id ? "bg-active" : ""}`} style={{ backgroundImage: `url(${bg.swatchUrl})`, backgroundSize: "cover", position: "relative" }} title={bg.label} onClick={() => changeBackground(bg.id)}>
                      {settings.background === bg.id && <CheckCircle2 size={13} />}
                      <span
                        role="button" title="Elimina sfondo salvato"
                        style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.55)", borderRadius: 8, width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomBackgrounds((prev) => {
                            const next = prev.filter((b) => b.id !== bg.id);
                            try { if (window.storage) window.storage.set("photostudio:customBackgrounds", JSON.stringify(next), false).catch(() => {}); } catch (err) {}
                            return next;
                          });
                          delete customBgRegistry[bg.id];
                          if (settings.background === bg.id) changeBackground("white-bg");
                        }}
                      ><XCircle size={12} /></span>
                    </button>
                  ))}
                </div>
                <div className="muted small" style={{ marginTop: 6 }}>{(BG_PRESETS.find((b) => b.id === settings.background) || customBackgrounds.find((b) => b.id === settings.background) || {}).label}</div>
                <div className="field" style={{ marginTop: 12 }}>
                  <span className="field-label">Genera sfondo dal testo (AI)</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="text" className="analyst-input" style={{ flex: 1 }}
                      placeholder='es. "marmo bianco", "velluto verde scuro", "parquet chiaro"'
                      value={texturePrompt} onChange={(e) => setTexturePrompt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") generateTextureBackground(); }}
                    />
                    <button className="btn-secondary" onClick={generateTextureBackground} disabled={!texturePrompt.trim()}><Sparkles size={14} /></button>
                  </div>
                  <div className="muted small" style={{ marginTop: 4 }}>
                    Descrivi materiale + colore (es. "cemento grigio scuro", "tappeto beige", "metallo spazzolato"). Genera una texture procedurale coerente, non è una foto reale.
                  </div>
                </div>
              </GlassCard>

              <GlassCard>
                <div className="chart-title" style={{ marginBottom: 10 }}><SlidersHorizontal size={15} /> AI Enhancer</div>
                <div className="enhance-list">
                  <label className="enhance-row"><input type="checkbox" checked={settings.whiteBalance} onChange={() => toggleEnhance("whiteBalance")} /> Bilanciamento del bianco</label>
                  <label className="enhance-row"><input type="checkbox" checked={settings.autoLight} onChange={() => toggleEnhance("autoLight")} /> Esposizione e contrasto automatici</label>
                  <label className="enhance-row"><input type="checkbox" checked={settings.vibrance} onChange={() => toggleEnhance("vibrance")} /> Vivacità colori</label>
                  <label className="enhance-row"><input type="checkbox" checked={settings.denoise} onChange={() => toggleEnhance("denoise")} /> Riduzione rumore</label>
                  <label className="enhance-row"><input type="checkbox" checked={settings.smooth} onChange={() => toggleEnhance("smooth")} /> Riduci pieghe del tessuto</label>
                  <label className="enhance-row"><input type="checkbox" checked={settings.sharpen} onChange={() => toggleEnhance("sharpen")} /> Aumenta nitidezza</label>
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <span className="field-label">Precisione rimozione sfondo</span>
                  <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <button className={`chip ${settings.threshold <= 32 ? "chip-active" : ""}`} onClick={() => changeThreshold(28)}>Delicato</button>
                    <button className={`chip ${settings.threshold > 32 && settings.threshold <= 60 ? "chip-active" : ""}`} onClick={() => changeThreshold(48)}>Normale</button>
                    <button className={`chip ${settings.threshold > 60 ? "chip-active" : ""}`} onClick={() => changeThreshold(75)}>Aggressivo</button>
                  </div>
                  <input type="range" min="10" max="110" value={settings.threshold} onChange={(e) => changeThreshold(e.target.value)} />
                  <div className="muted small" style={{ marginTop: 4 }}>
                    Se restano bordi di sfondo attorno al capo, aumenta verso "Aggressivo". Se il capo perde dei pezzi (es. maniche chiare su sfondo chiaro), torna verso "Delicato".
                  </div>
                </div>
                <div className="field" style={{ marginTop: 8 }}>
                  <span className="field-label">Raddrizza / correggi prospettiva ({settings.rotation}°)</span>
                  <input type="range" min="-10" max="10" step="0.5" value={settings.rotation} onChange={(e) => changeRotation(e.target.value)} />
                </div>
                <button className="btn-secondary full" disabled={exporting} onClick={() => applyToBatch()}><Scissors size={14} /> Applica a tutto il batch</button>
                <button className="btn-primary full" style={{ marginTop: 8 }} disabled={exporting || photos.length === 0} onClick={applyVintedMode}><Wand2 size={14} /> Vinted Mode: un click, tutto pronto</button>
                <div className="muted small" style={{ marginTop: 6 }}>AI Consistency: stesso sfondo, stessa luce e stessa impostazione su tutte le foto caricate.</div>
              </GlassCard>

              <GlassCard>
                <div className="chart-title" style={{ marginBottom: 10 }}><Download size={15} /> Esportazione</div>
                <div className="filter-grid one-col">
                  <PlainSelect label="Formato file" value={settings.exportFormat} onChange={(v) => setSettings((s) => ({ ...s, exportFormat: v }))} options={["png", "jpg", "webp"]} />
                  <PlainSelect label="Qualità" value={settings.exportQuality} onChange={(v) => setSettings((s) => ({ ...s, exportQuality: v }))} options={["Alta", "Ultra", "Massima"]} />
                  <PlainSelect label="Risoluzione" value={String(settings.exportScale)} onChange={(v) => setSettings((s) => ({ ...s, exportScale: Number(v) }))} options={["1", "2", "3"]} />
                </div>
                <div className="muted small" style={{ marginTop: -6, marginBottom: 8 }}>
                  Risoluzione: 1× = formato standard, 2×/3× = fino a ~4K (file più pesante, utile per zoomare o stampare — non aggiunge dettagli che la foto originale non aveva).
                </div>
                <button className="btn-primary full" disabled={!active || !active.result} onClick={() => active && exportPhoto(active)}><Download size={14} /> Esporta foto corrente</button>
                <button className="btn-secondary full" style={{ marginTop: 8 }} disabled={exporting || doneCount === 0} onClick={exportBatch}><Layers size={14} /> Esporta tutto il batch ({doneCount})</button>
              </GlassCard>

              <GlassCard>
                <div className="chart-title gold-text" style={{ marginBottom: 8 }}><Sparkles size={15} /> One-Click Listing</div>
                <div className="muted small" style={{ marginBottom: 10 }}>Dalla foto attiva: sfondo, ritocco e annuncio pronto (titolo, descrizione, prezzo) generati automaticamente.</div>
                <button className="btn-primary full" disabled={!active || listingBusy} onClick={() => oneClickListing(active)}>
                  {listingBusy ? <Loader2 size={14} className="spin" /> : <Wand2 size={14} />} {listingBusy ? "Sto analizzando la foto…" : "Genera annuncio da questa foto"}
                </button>
              </GlassCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================== AI NEGOTIATION ASSISTANT ============================== */

function NegotiationPage() {
  const [listPrice, setListPrice] = useState(25);
  const [offerPrice, setOfferPrice] = useState(18);
  const [marketAvg, setMarketAvg] = useState(24);
  const [daysLive, setDaysLive] = useState(12);
  const [result, setResult] = useState(null);

  function analyze() {
    const lp = Number(listPrice), op = Number(offerPrice), ma = Number(marketAvg), days = Number(daysLive);
    const discountPct = Math.round(((lp - op) / lp) * 100);
    const vsMarketPct = Math.round(((lp - ma) / ma) * 100);
    const counterPrice = Math.round(op + (lp - op) * 0.45);
    let recommendation;
    if (discountPct <= 8) recommendation = "accetta";
    else if (discountPct > 25 && days > 25) recommendation = "controproponi_basso";
    else if (discountPct > 20) recommendation = "controproponi";
    else if (days < 7 && lp <= ma * 1.05) recommendation = "rifiuta";
    else recommendation = "controproponi";

    const suggestions = [
      { label: "Accetta", text: `Ciao! Va bene, accetto ${euro2(op)}. Grazie per l'interesse, procedo con la spedizione appena confermi.`, rationale: `L'offerta è solo il ${discountPct}% sotto il prezzo di listino${days > 20 ? ", e l'articolo è fermo da tempo: meglio chiudere ora" : ""}.` },
      { label: "Controproponi", text: `Grazie per l'offerta! Potrei fare ${euro2(counterPrice)}, è già un buon compromesso rispetto al prezzo di mercato.`, rationale: `Una via di mezzo tra la tua offerta e il listino tutela il margine senza perdere la vendita; il prezzo di listino è circa il ${vsMarketPct >= 0 ? "+" : ""}${vsMarketPct}% rispetto alla media di mercato.` },
      { label: "Rifiuta gentilmente", text: `Ciao! Il prezzo è già allineato al mercato per articoli comparabili, per ora preferisco non scendere oltre.`, rationale: `L'annuncio è online da soli ${days} giorni ed è già in linea con il prezzo medio di mercato: non conviene svalutarlo subito.` },
    ];
    setResult({ discountPct, vsMarketPct, counterPrice, recommendation, suggestions });
  }

  return (
    <div className="page">
      <SectionTitle eyebrow="Assistente alla trattativa" title="AI Negotiation Assistant" />
      <div className="grid-2 align-start">
        <GlassCard>
          <div className="chart-title" style={{ marginBottom: 12 }}><Scale size={15} /> Dati dell'offerta ricevuta</div>
          <div className="filter-grid one-col">
            <LabeledInput label="Prezzo di listino (€)" value={listPrice} onChange={setListPrice} />
            <LabeledInput label="Offerta ricevuta (€)" value={offerPrice} onChange={setOfferPrice} />
            <LabeledInput label="Prezzo medio di mercato (€)" value={marketAvg} onChange={setMarketAvg} />
            <LabeledInput label="Giorni dalla pubblicazione" value={daysLive} onChange={setDaysLive} />
          </div>
          <button className="btn-primary full" onClick={analyze}><Scale size={15} /> Analizza offerta</button>
        </GlassCard>

        {result && (
          <div className="calc-results">
            <div className="grid-2">
              <KpiCard icon={Percent} label="Sconto richiesto" rawValue={result.discountPct} formatter={(n) => `${Math.round(n)}%`} accent={result.discountPct > 20 ? "red" : "amber"} />
              <KpiCard icon={TrendingUp} label="Listino vs mercato" rawValue={result.vsMarketPct} formatter={(n) => `${n >= 0 ? "+" : ""}${Math.round(n)}%`} accent="blue" />
            </div>
            <GlassCard>
              <div className="chart-title gold-text" style={{ marginBottom: 4 }}>Consiglio principale</div>
              <div className="muted small">{result.recommendation === "accetta" ? "Accetta l'offerta: è già vicina al tuo prezzo." : result.recommendation === "rifiuta" ? "Rifiuta gentilmente: l'articolo è recente e già competitivo." : "Controproponi prima di cedere sul prezzo pieno."}</div>
            </GlassCard>
            {result.suggestions.map((s) => (
              <GlassCard key={s.label}>
                <div className="chart-title" style={{ marginBottom: 6 }}>{s.label}</div>
                <p className="listing-desc">💬 {s.text}</p>
                <div className="muted small" style={{ marginTop: 6 }}><b>Perché:</b> {s.rationale}</div>
                <button className="btn-secondary small" onClick={() => navigator.clipboard && navigator.clipboard.writeText(s.text)}><Copy size={12} /> Copia risposta</button>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================== AI CHAT SCREENSHOT ANALYZER ============================== */

async function analyzeChatScreenshot(file) {
  const dataUrl = await fileToDataUrl(file);
  const mediaType = (dataUrl.match(/^data:([^;]+);/) || [, "image/jpeg"])[1];
  const base64 = dataUrl.split(",")[1];
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6", max_tokens: 900,
      system: "Sei un assistente che legge screenshot di chat tra venditore e acquirente su marketplace second-hand e aiuta il venditore a rispondere bene. Rispondi SOLO con un oggetto JSON valido, senza testo fuori dal JSON, in questa forma esatta: {\"transcript\":[{\"sender\":\"buyer|seller\",\"text\":\"...\"}],\"detected_intent\":\"breve etichetta\",\"suggestions\":[{\"label\":\"...\",\"text\":\"...\",\"rationale\":\"...\"}]}. Genera 2-3 suggestions, ciascuna con un'etichetta breve tipo 'Controproponi' o 'Crea urgenza gentile'. Tutto in italiano.",
      messages: [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
        { type: "text", text: "Leggi questo screenshot di una conversazione di vendita e genera la trascrizione, l'intento rilevato e i suggerimenti di risposta." },
      ] }],
    }),
  });
  if (!resp.ok) throw new Error("api-error");
  const data = await resp.json();
  const tb = (data.content || []).find((c) => c.type === "text");
  if (!tb) throw new Error("no-text");
  const clean = tb.text.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  return JSON.parse(clean);
}

function ChatAnalyzerPage() {
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const fileInputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setBusy(true); setError(""); setAnalysis(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      setImage(dataUrl);
      const result = await analyzeChatScreenshot(file);
      setAnalysis(result);
    } catch (e) {
      setError("Non sono riuscito a leggere questo screenshot con sufficiente confidenza. Prova con un'immagine più nitida.");
    }
    setBusy(false);
  }

  return (
    <div className="page">
      <SectionTitle eyebrow="Analisi conversazioni" title="AI Chat Screenshot Analyzer" />
      <GlassCard className="upload-zone" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])} />
        {busy ? <Loader2 size={26} className="spin blue-text" /> : <MessageSquare size={26} className="blue-text" />}
        <div className="chart-title">{busy ? "Sto leggendo la conversazione…" : "Carica uno screenshot della chat"}</div>
        <div className="muted small">Funziona con screenshot di Vinted o di qualsiasi altra app di messaggistica.</div>
      </GlassCard>
      {error && <div className="muted small">{error}</div>}

      {(image || analysis) && (
        <div className="studio-layout">
          <div className="studio-main">
            {image && <GlassCard><img src={image} alt="Screenshot chat" style={{ width: "100%", borderRadius: 12, display: "block" }} /></GlassCard>}
            {analysis && (
              <GlassCard>
                <div className="chart-title" style={{ marginBottom: 8 }}>Trascrizione</div>
                <div className="chat-transcript">
                  {analysis.transcript.map((m, i) => (
                    <div key={i} className={`chat-row ${m.sender === "buyer" ? "user" : "analyst"}`}>
                      <div className={`chat-bubble ${m.sender === "buyer" ? "user-bubble" : "analyst-bubble"}`}>{m.text}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
          {analysis && (
            <div className="studio-sidebar">
              <GlassCard>
                <div className="micro-label">Intento rilevato</div>
                <div className="chart-title">{analysis.detected_intent}</div>
              </GlassCard>
              {analysis.suggestions.map((s, i) => (
                <GlassCard key={i}>
                  <div className="chart-title" style={{ marginBottom: 6 }}>{s.label}</div>
                  <p className="listing-desc">💬 {s.text}</p>
                  <div className="muted small" style={{ marginTop: 6 }}><b>Perché:</b> {s.rationale}</div>
                  <button className="btn-secondary small" onClick={() => navigator.clipboard && navigator.clipboard.writeText(s.text)}><Copy size={12} /> Copia risposta</button>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================== AI TREND HUNTER + RESTOCK ADVISOR ============================== */

function TrendHunterPage() {
  const trends = useMemo(() => {
    return HEATMAP_BRANDS.map((b) => {
      const rnd = mulberry32(hashCode("trend-" + b));
      const growth = Math.round((rnd() - 0.25) * 60);
      const seasonal = rnd() > 0.5;
      return { brand: b, growth, seasonal };
    }).sort((a, b) => b.growth - a.growth);
  }, []);
  const [alerts, setAlerts] = useState([]);
  const [alertBrand, setAlertBrand] = useState(BRANDS[0]);
  const [alertThreshold, setAlertThreshold] = useState(20);

  const restock = useMemo(() => {
    const pool = generateResults("restock advisor sourcing", 14);
    const byBrand = {};
    pool.forEach((it) => { if (!byBrand[it.brand] || it.roi > byBrand[it.brand].roi) byBrand[it.brand] = it; });
    return Object.values(byBrand).sort((a, b) => b.roi - a.roi).slice(0, 6);
  }, []);
  const [checklist, setChecklist] = useState(() => restock.slice(0, 5).map((r) => ({ id: r.id, label: `${r.brand} ${r.category}`, done: false })));

  function addAlert() { setAlerts((prev) => [...prev, { id: uid(), brand: alertBrand, threshold: alertThreshold }]); }
  function toggleCheck(id) { setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c))); }

  return (
    <div className="page">
      <SectionTitle eyebrow="Sourcing intelligente" title="Trend Hunter & Restock Advisor" />
      <div className="grid-2 align-start">
        <GlassCard>
          <div className="chart-title" style={{ marginBottom: 10 }}><Radar size={15} /> Radar tendenze</div>
          <div className="table-card" style={{ padding: 0, background: "none", border: "none" }}>
            <table className="table">
              <thead><tr><th>Brand</th><th>Crescita</th><th>Tipo</th></tr></thead>
              <tbody>
                {trends.map((t) => (
                  <tr key={t.brand}>
                    <td className="cell-strong">{t.brand}</td>
                    <td className={t.growth >= 0 ? "green-text mono" : "red-text mono"}>{t.growth >= 0 ? "+" : ""}{t.growth}%</td>
                    <td className="muted small">{t.seasonal ? "Stagionale ricorrente" : "Trend emergente — da confermare"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="filter-grid" style={{ marginTop: 12 }}>
            <LabeledSelect label="Marca da monitorare" value={alertBrand} onChange={setAlertBrand} options={BRANDS} />
            <LabeledInput label="Soglia crescita (%)" value={alertThreshold} onChange={setAlertThreshold} />
          </div>
          <button className="btn-secondary" onClick={addAlert}><Bell size={14} /> Crea alert</button>
          {alerts.length > 0 && (
            <div className="alert-list" style={{ marginTop: 10 }}>
              {alerts.map((a) => <div key={a.id} className="muted small">🔔 Avvisami quando {a.brand} cresce oltre il {a.threshold}%</div>)}
            </div>
          )}
        </GlassCard>

        <div className="calc-results">
          <GlassCard>
            <div className="chart-title" style={{ marginBottom: 10 }}><ShoppingCart size={15} /> Restock Advisor</div>
            <div className="muted small" style={{ marginBottom: 10 }}>Categorie/marche ad alta rotazione consigliate per il prossimo sourcing.</div>
            {restock.map((r) => (
              <div key={r.id} className="feed-item">
                <Badge badge={r.badge} />
                <div className="feed-body">
                  <div className="cell-strong small">{r.brand} · {r.category}</div>
                  <div className="muted small">margine atteso {r.roi}% · profitto medio {euro2(r.profit)}</div>
                </div>
              </div>
            ))}
          </GlassCard>
          <GlassCard>
            <div className="chart-title" style={{ marginBottom: 10 }}>Lista della spesa (sourcing)</div>
            {checklist.map((c) => (
              <label key={c.id} className="enhance-row">
                <input type="checkbox" checked={c.done} onChange={() => toggleCheck(c.id)} />
                <span style={{ textDecoration: c.done ? "line-through" : "none" }}>{c.label}</span>
              </label>
            ))}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

/* ============================== COMMAND PALETTE ============================== */

function CommandPalette({ tab, setTab, navItems }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return navItems.filter((n) => n.label.toLowerCase().includes(q));
  }, [query, navItems]);
  function go(key) { setTab(key); setOpen(false); setQuery(""); }
  if (!open) return null;
  return (
    <div className="cmdk-overlay" onClick={() => setOpen(false)}>
      <div className="cmdk-box" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-input-row">
          <Command size={16} className="muted" />
          <input autoFocus className="cmdk-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Vai a... (es. Photo Studio, Inventario, Dashboard)" onKeyDown={(e) => { if (e.key === "Enter" && filtered[0]) go(filtered[0].key); }} />
          <span className="cmdk-kbd">ESC</span>
        </div>
        <div className="cmdk-list">
          {filtered.map((n) => (
            <div key={n.key} className={`cmdk-item ${tab === n.key ? "cmdk-active" : ""}`} onClick={() => go(n.key)}>
              <n.icon size={15} /> {n.label}
            </div>
          ))}
          {filtered.length === 0 && <div className="muted small" style={{ padding: "10px 14px" }}>Nessun risultato</div>}
        </div>
      </div>
    </div>
  );
}

/* ============================== PREMIUM ============================== */

function PremiumBanner() {
  const features = [
    { icon: Zap, text: "Analisi illimitate" }, { icon: Bell, text: "Alert istantanei" },
    { icon: Clock, text: "Cronologia dei prezzi" }, { icon: TrendingUp, text: "Analisi avanzata dei trend" },
    { icon: Download, text: "Esportazione Excel e PDF" }, { icon: LayoutDashboard, text: "Dashboard personalizzabile" },
  ];
  return (
    <GlassCard className="premium-banner">
      <div className="premium-left">
        <div className="premium-badge"><ShieldCheck size={14} /> PREMIUM</div>
        <div className="chart-title">Sblocca tutto il potenziale di Vinted Analytics AI</div>
        <div className="muted small">L'esperienza da trading terminal per reseller professionisti.</div>
      </div>
      <div className="premium-features">{features.map((f) => <span className="premium-feature" key={f.text}><f.icon size={13} /> {f.text}</span>)}</div>
      <button className="btn-primary">Passa a Premium</button>
    </GlassCard>
  );
}

/* ============================== APP SHELL ============================== */

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [clock, setClock] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("Stone Island");
  const [minProfitFilter, setMinProfitFilter] = useState(null);
  const [marketRange, setMarketRange] = useState(30);
  const [selectedItem, setSelectedItem] = useState(null);
  const [listingPrefill, setListingPrefill] = useState(null);

  const [kpis, setKpis] = useState({
    profitTotal: 8940, profitDelta: 12.4, roiAvg: 64, roiDelta: 4.1,
    dealsToday: 18, dealsDelta: 15.0, monitored: 14236, monitoredDelta: 2.3,
    monthly: 2310, monthlyDelta: -3.5,
  });

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setKpis((k) => {
        const rnd = Math.random();
        return {
          ...k,
          profitTotal: Math.round(k.profitTotal + (rnd - 0.4) * 30),
          dealsToday: clamp(Math.round(k.dealsToday + (Math.random() - 0.45) * 2), 5, 60),
          roiAvg: clamp(Math.round((k.roiAvg + (Math.random() - 0.5) * 1.5) * 10) / 10, 30, 95),
        };
      });
    }, 18000);
    return () => clearInterval(id);
  }, []);

  const appActions = useMemo(() => ({
    goTo: (t) => setTab(t),
    setSearchQuery: (v) => { setSearchQuery(v); setMinProfitFilter(null); },
    setMinProfitFilter: (v) => setMinProfitFilter(v),
    setMarketRange: (v) => setMarketRange(v),
  }), []);

  const pageMap = {
    dashboard: <Dashboard onGo={setTab} kpis={kpis} />,
    search: <SearchPage query={searchQuery} setQuery={setSearchQuery} minProfitFilter={minProfitFilter} setMinProfitFilter={setMinProfitFilter} onSelectItem={setSelectedItem} />,
    insights: <InsightsPage />,
    alerts: <AlertsPage />,
    sellers: <SellersPage />,
    market: <MarketPage range={marketRange} setRange={setMarketRange} />,
    calculator: <CalculatorPage />,
    inventory: <InventoryPage />,
    listing: <ListingPage prefill={listingPrefill} />,
    photostudio: <PhotoStudioPage onSendToListing={(data) => { setListingPrefill(data); setTab("listing"); }} />,
    negotiation: <NegotiationPage />,
    chatanalyzer: <ChatAnalyzerPage />,
    trendhunter: <TrendHunterPage />,
  };

  return (
    <AIProvider kpis={kpis} appActions={appActions} selectedItem={selectedItem}>
      <div className="app-root">
        <style>{CSS}</style>
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">VA</div>
            <div className="brand-text"><div className="brand-name">Vinted Analytics</div><div className="brand-sub">AI · Reseller Terminal</div></div>
          </div>
          <nav className="nav">
            {NAV_ITEMS.map((n) => (
              <button key={n.key} className={`nav-item ${tab === n.key ? "active" : ""}`} onClick={() => setTab(n.key)}>
                <n.icon size={17} /><span>{n.label}</span>{tab === n.key && <span className="nav-dot" />}
              </button>
            ))}
          </nav>
          <div className="sidebar-footer"><PremiumMini /></div>
        </aside>

        <div className="main-col">
          <TickerTape />
          <header className="topbar">
            <div className="topbar-left"><Activity size={16} className="blue-text" /><span className="muted small">Mercato Vinted · Europa</span></div>
            <div className="topbar-right"><span className="cmdk-hint"><Command size={11} /> K per navigare</span><span className="muted small mono">{clock.toLocaleTimeString("it-IT")}</span><span className="live-dot" /><span className="muted small">Dati simulati in tempo reale</span></div>
          </header>
          <main className="content">
            {pageMap[tab]}
            {tab !== "dashboard" && <PremiumBanner />}
          </main>
        </div>

        <AIOrb />
        <AnalystPanel />
        <CommandPalette tab={tab} setTab={setTab} navItems={NAV_ITEMS} />
      </div>
    </AIProvider>
  );
}

function PremiumMini() {
  return (
    <div className="premium-mini">
      <div className="premium-mini-head"><Star size={13} /> Premium</div>
      <div className="muted small">Sblocca alert istantanei ed export dati.</div>
      <button className="btn-secondary full small">Scopri di più</button>
    </div>
  );
}

/* ============================== STYLES ============================== */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  --bg: #060708; --bg-alt: #0a0c0e; --panel: rgba(255,255,255,0.045); --panel-solid: #121417;
  --border: rgba(255,255,255,0.085); --green: #14e8a0; --green-dim: rgba(20,232,160,0.14);
  --blue: #3d7bff; --blue-dim: rgba(61,123,255,0.14); --amber: #f5b93d; --amber-dim: rgba(245,185,61,0.14);
  --red: #ff5470; --red-dim: rgba(255,84,112,0.14); --text: #f3f5f7; --text-dim: #94a1ac; --text-mute: #5c6770;
  --gold: #d8b26a; --gold-dim: rgba(216,178,106,0.14);
}
* { box-sizing: border-box; }
.app-root { display: flex; min-height: 100vh; background: radial-gradient(1100px 550px at 88% -8%, rgba(61,123,255,0.11), transparent 62%), radial-gradient(950px 480px at -8% 15%, rgba(20,232,160,0.08), transparent 62%), radial-gradient(700px 400px at 50% 105%, rgba(216,178,106,0.05), transparent 65%), var(--bg); color: var(--text); font-family: 'Inter', sans-serif; position: relative; }
.mono { font-family: 'JetBrains Mono', monospace; }

/* Sidebar */
.sidebar { width: 232px; flex-shrink: 0; background: var(--bg-alt); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 20px 14px; position: sticky; top: 0; height: 100vh; }
.brand { display: flex; align-items: center; gap: 10px; padding: 0 6px 20px 6px; border-bottom: 1px solid var(--border); margin-bottom: 16px; }
.brand-mark { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, var(--green), var(--blue)); display: flex; align-items: center; justify-content: center; font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: #06110d; font-size: 13px; }
.brand-name { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 13.5px; line-height: 1.2; }
.brand-sub { font-size: 10.5px; color: var(--text-mute); letter-spacing: 0.03em; }
.nav { display: flex; flex-direction: column; gap: 3px; flex: 1; overflow-y: auto; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; border: none; background: transparent; color: var(--text-dim); font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; text-align: left; position: relative; transition: background .15s ease, color .15s ease; }
.nav-item:hover { background: rgba(255,255,255,0.04); color: var(--text); }
.nav-item.active { background: linear-gradient(90deg, rgba(0,226,138,0.12), rgba(59,130,246,0.06)); color: var(--text); }
.nav-item.active svg { color: var(--green); }
.nav-dot { position: absolute; right: 10px; width: 5px; height: 5px; border-radius: 50%; background: var(--green); }
.sidebar-footer { margin-top: 12px; }
.premium-mini { background: var(--panel-solid); border: 1px solid var(--border); border-radius: 12px; padding: 12px; }
.premium-mini-head { display: flex; align-items: center; gap: 6px; font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 12.5px; color: var(--amber); margin-bottom: 4px; }

/* Main */
.main-col { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ticker-wrap { display: flex; align-items: center; height: 30px; background: #060a0e; border-bottom: 1px solid var(--border); overflow: hidden; font-family: 'JetBrains Mono', monospace; font-size: 11.5px; }
.ticker-label { display: flex; align-items: center; gap: 5px; padding: 0 12px; height: 100%; background: var(--red); color: #1a0007; font-weight: 700; flex-shrink: 0; letter-spacing: 0.05em; }
.ticker-label svg { animation: pulse 1.4s infinite; }
.ticker-track { overflow: hidden; flex: 1; white-space: nowrap; position: relative; }
.ticker-move { display: inline-block; padding-left: 100%; animation: scrollTicker 55s linear infinite; }
.ticker-item { display: inline-block; padding: 0 28px; color: var(--text-dim); }
@keyframes scrollTicker { from { transform: translateX(0); } to { transform: translateX(-100%); } }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
.topbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 28px; border-bottom: 1px solid var(--border); }
.topbar-left, .topbar-right { display: flex; align-items: center; gap: 8px; }
.live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); }
.content { padding: 24px 28px 60px 28px; flex: 1; }
.page { display: flex; flex-direction: column; gap: 18px; animation: fadeIn .35s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.section-title-row { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.eyebrow { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-mute); margin-bottom: 2px; }
.section-title { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 700; margin: 0; }
.chart-title { font-family: 'Space Grotesk', sans-serif; font-size: 14.5px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
.muted { color: var(--text-dim); } .small { font-size: 12px; }
.green-text { color: var(--green); } .blue-text { color: var(--blue); } .red-text { color: var(--red); } .amber-text { color: var(--amber); }

.glass { background: var(--panel); border: 1px solid var(--border); border-radius: 18px; padding: 18px; backdrop-filter: blur(22px); -webkit-backdrop-filter: blur(22px); box-shadow: 0 1px 0 rgba(255,255,255,0.05) inset, 0 12px 32px -16px rgba(0,0,0,0.55); transition: border-color .25s ease, box-shadow .25s ease, transform .25s cubic-bezier(.2,.8,.25,1); }
.gold-text { color: var(--gold); } .icon-gold { background: var(--gold-dim); color: var(--gold); }

/* AI highlight targets */
.ai-target { border-radius: 16px; transition: box-shadow .35s ease, transform .35s ease; position: relative; }
.ai-chart { cursor: pointer; }
.ai-chart-hint { position: absolute; top: 10px; right: 14px; font-size: 10px; color: var(--text-mute); display: flex; align-items: center; gap: 4px; opacity: 0; transition: opacity .2s ease; pointer-events: none; background: rgba(0,0,0,0.3); padding: 3px 8px; border-radius: 20px; }
.ai-chart:hover .ai-chart-hint { opacity: 1; }
.ai-target.ai-active { box-shadow: 0 0 0 2px rgba(0,226,138,0.55), 0 0 40px rgba(0,226,138,0.25); transform: scale(1.012); z-index: 2; }
.ai-target.ai-active .glass { border-color: rgba(0,226,138,0.5); }

/* KPI */
.kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; }
@media (max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 700px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
.kpi-card { display: flex; flex-direction: column; gap: 8px; }
.kpi-top { display: flex; align-items: center; justify-content: space-between; }
.kpi-top-right { display: flex; align-items: center; gap: 6px; }
.kpi-icon { width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
.icon-green { background: var(--green-dim); color: var(--green); } .icon-blue { background: var(--blue-dim); color: var(--blue); }
.icon-amber { background: var(--amber-dim); color: var(--amber); } .icon-red { background: var(--red-dim); color: var(--red); }
.kpi-delta { font-size: 11px; display: flex; align-items: center; gap: 2px; font-weight: 600; }
.kpi-delta.pos { color: var(--green); } .kpi-delta.neg { color: var(--red); }
.kpi-value { font-size: 22px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; }
.kpi-label { font-size: 12px; color: var(--text-dim); }
.explain-btn { width: 18px; height: 18px; border-radius: 50%; border: 1px solid var(--border); background: rgba(255,255,255,0.04); color: var(--text-mute); font-size: 10.5px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.explain-btn:hover { color: var(--blue); border-color: var(--blue); }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.align-start { align-items: start; }
@media (max-width: 900px) { .grid-2 { grid-template-columns: 1fr; } }
.chart-card { display: flex; flex-direction: column; gap: 10px; }
.chart-head { display: flex; align-items: center; justify-content: space-between; }
.pill { font-size: 11.5px; padding: 4px 10px; border-radius: 20px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: var(--text-dim); }
.pill.tone-green { color: var(--green); border-color: rgba(0,226,138,0.3); }
.pill.tone-alta { color: var(--green); } .pill.tone-media { color: var(--amber); } .pill.tone-bassa { color: var(--red); }
.chart-tooltip { background: #0d1319; border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; font-size: 12px; }
.tt-label { color: var(--text-dim); margin-bottom: 4px; font-size: 11px; } .tt-row { display: flex; gap: 6px; align-items: center; }
.cta-strip { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }

.overview-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
@media (max-width: 1100px) { .overview-grid { grid-template-columns: repeat(2, 1fr); } }
.overview-card { cursor: pointer; display: flex; flex-direction: column; gap: 4px; }
.overview-card:hover { transform: translateY(-2px); border-color: rgba(20,232,160,0.3); }
.overview-icon { width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
@media (max-width: 1100px) { .grid-3 { grid-template-columns: 1fr; } }
.score-gauge-card { display: flex; flex-direction: column; align-items: center; text-align: center; }
.feed-list { display: flex; flex-direction: column; gap: 8px; max-height: 210px; overflow-y: auto; }
.feed-item { display: flex; align-items: center; gap: 8px; padding: 7px 0; border-bottom: 1px dashed var(--border); }
.feed-item:last-child { border-bottom: none; }
.feed-body { flex: 1; min-width: 0; }
.heatmap-wrap { overflow-x: auto; }
.heatmap-grid { display: grid; gap: 4px; min-width: 560px; }
.heatmap-label { font-size: 10.5px; color: var(--text-mute); display: flex; align-items: center; justify-content: center; text-align: center; padding: 4px 2px; }
.heatmap-row-label { justify-content: flex-start; font-weight: 600; color: var(--text-dim); }
.heatmap-cell { aspect-ratio: 1.6; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 10.5px; font-family: 'JetBrains Mono', monospace; color: var(--text); transition: transform .15s ease; }
.heatmap-cell:hover { transform: scale(1.08); }

.btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 6px; background: linear-gradient(135deg, var(--green), #00b46f); color: #06150f; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 600; font-size: 13px; cursor: pointer; transition: transform .18s cubic-bezier(.2,.8,.25,1), opacity .18s ease, box-shadow .18s ease; white-space: nowrap; }
.btn-primary:hover { opacity: 0.94; transform: translateY(-1.5px); box-shadow: 0 8px 24px -8px rgba(20,232,160,0.45); }
.btn-primary:active { transform: translateY(0); }
.btn-primary.full { width: 100%; margin-top: 6px; }
.btn-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 6px; background: rgba(59,130,246,0.12); color: var(--blue); border: 1px solid rgba(59,130,246,0.3); padding: 9px 16px; border-radius: 10px; font-weight: 600; font-size: 12.5px; cursor: pointer; }
.btn-secondary.full { width: 100%; } .btn-secondary.small { padding: 6px 12px; font-size: 11.5px; margin-top: 8px; }
.icon-btn { background: rgba(255,84,112,0.1); border: 1px solid rgba(255,84,112,0.25); color: var(--red); border-radius: 8px; padding: 6px 8px; cursor: pointer; }

.search-bar { display: flex; align-items: center; gap: 10px; padding: 10px 14px; }
.search-input { flex: 1; background: transparent; border: none; outline: none; color: var(--text); font-size: 14px; }
.search-input::placeholder { color: var(--text-mute); }
.select-inline { background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--text-dim); border-radius: 8px; padding: 8px 10px; font-size: 12px; outline: none; }
.active-filter { display: inline-flex; align-items: center; gap: 8px; background: var(--blue-dim); color: var(--blue); padding: 6px 12px; border-radius: 20px; font-size: 12px; width: fit-content; }
.active-filter button { background: none; border: none; color: var(--blue); cursor: pointer; display: flex; }
.suggest-dropdown { position: absolute; top: 100%; left: 14px; right: 14px; margin-top: 6px; background: var(--panel-solid); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; z-index: 10; box-shadow: 0 12px 32px -12px rgba(0,0,0,0.6); }
.suggest-item { padding: 9px 14px; font-size: 12.5px; color: var(--text-dim); cursor: pointer; }
.suggest-item:hover { background: rgba(255,255,255,0.05); color: var(--text); }
.history-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.filter-dot { position: absolute; top: 4px; right: 4px; width: 6px; height: 6px; border-radius: 50%; background: var(--green); }
.fav-list { display: flex; flex-direction: column; gap: 8px; }
.fav-item { padding: 8px 10px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); cursor: pointer; }
.fav-item:hover { border-color: rgba(20,232,160,0.35); }
.fav-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; color: var(--text-mute); }
.sw-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 8px 0; }
.strategy-box { border-top: 1px dashed var(--border); padding-top: 10px; margin-top: 4px; }
.sparkline { display: block; margin: 4px 0 8px 0; }
.field { display: flex; flex-direction: column; gap: 5px; } .field-label { font-size: 11.5px; color: var(--text-dim); }
.select, .input { background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--text); border-radius: 9px; padding: 9px 10px; font-size: 13px; outline: none; }
.input.small { padding: 6px 9px; font-size: 12px; }
.select:focus, .input:focus { border-color: var(--blue); }
.filter-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 14px; }
.filter-grid.one-col { grid-template-columns: 1fr; }
@media (max-width: 900px) { .filter-grid { grid-template-columns: repeat(2, 1fr); } }

.results-layout { display: grid; grid-template-columns: 1fr 360px; gap: 16px; align-items: start; }
@media (max-width: 1100px) { .results-layout { grid-template-columns: 1fr; } }
.results-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
@media (max-width: 1400px) { .results-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 700px) { .results-grid { grid-template-columns: 1fr; } }
.result-card { display: flex; flex-direction: column; gap: 10px; transition: border-color .15s ease, transform .15s ease; }
.result-card:hover { transform: translateY(-2px); border-color: rgba(0,226,138,0.35); }
.result-photo-wrap { width: 100%; aspect-ratio: 4 / 3; border-radius: 10px; overflow: hidden; background: #10161c; display: flex; align-items: center; justify-content: center; margin-bottom: 2px; }
.result-photo { width: 100%; height: 100%; object-fit: cover; display: block; }
.result-photo-fallback { background: repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 10px, rgba(255,255,255,0.01) 10px 20px); }
.result-active { border-color: var(--green); box-shadow: 0 0 0 1px rgba(0,226,138,0.3); }
.result-top { display: flex; align-items: center; justify-content: space-between; }
.result-brand { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-mute); font-weight: 600; }
.result-title { font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 600; }
.result-meta { font-size: 11.5px; }
.price-row { display: flex; gap: 10px; border-top: 1px dashed var(--border); border-bottom: 1px dashed var(--border); padding: 8px 0; }
.price-block { flex: 1; } .micro-label { font-size: 10px; color: var(--text-mute); text-transform: uppercase; letter-spacing: 0.04em; }
.price { font-size: 14px; font-weight: 600; }
.stat-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 12px; }
.stat { display: flex; align-items: center; gap: 4px; color: var(--text-dim); }
.ai-score { margin-left: auto; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 13px; color: var(--text); background: rgba(255,255,255,0.05); padding: 3px 9px; border-radius: 20px; }
.badge { font-size: 11px; font-weight: 600; padding: 4px 9px; border-radius: 20px; white-space: nowrap; }
.badge-fire { background: rgba(255,84,112,0.14); color: #ff8a9e; } .badge-good { background: var(--green-dim); color: var(--green); }
.badge-warn { background: var(--amber-dim); color: var(--amber); } .badge-bad { background: rgba(255,255,255,0.06); color: var(--text-mute); }

.advisor-panel { display: flex; flex-direction: column; gap: 12px; position: sticky; top: 16px; }
.advisor-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.prediction-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 10px 0; border-top: 1px dashed var(--border); border-bottom: 1px dashed var(--border); }
.pred-cell { display: flex; align-items: center; gap: 8px; }
.pred-val { font-size: 13px; font-weight: 700; }
.advisor-text p { font-size: 12.8px; line-height: 1.55; color: var(--text-dim); margin: 8px 0; }
.advisor-text b { color: var(--text); }
.advisor-footer { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; border-top: 1px solid var(--border); padding-top: 12px; }

.alert-list { display: flex; flex-direction: column; gap: 8px; max-height: 420px; overflow-y: auto; }
.alert-item { display: flex; gap: 10px; padding: 10px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); font-size: 12.5px; }
.alert-icon { width: 26px; height: 26px; border-radius: 8px; background: var(--blue-dim); color: var(--blue); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

.table-card { overflow-x: auto; } .table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.table th { text-align: left; color: var(--text-mute); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; padding: 8px 12px; border-bottom: 1px solid var(--border); white-space: nowrap; }
.table td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); white-space: nowrap; }
.cell-strong { font-weight: 600; }
.bar-mini { width: 70px; height: 5px; border-radius: 4px; background: rgba(255,255,255,0.06); display: inline-block; margin-right: 6px; overflow: hidden; vertical-align: middle; }
.bar-mini-fill { height: 100%; background: linear-gradient(90deg, var(--green), var(--blue)); }
.score-chip { padding: 3px 9px; border-radius: 8px; font-weight: 700; font-size: 12px; }
.chip-green { background: var(--green-dim); color: var(--green); } .chip-blue { background: var(--blue-dim); color: var(--blue); } .chip-amber { background: var(--amber-dim); color: var(--amber); }
.status-chip { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.status-disponibile { background: var(--blue-dim); color: var(--blue); } .status-venduto { background: var(--green-dim); color: var(--green); } .status-spedito { background: var(--amber-dim); color: var(--amber); }
.code-stripe { display: flex; align-items: stretch; height: 20px; gap: 1px; }
.bar-dark { background: #e8eef3; display: inline-block; }
.bar-light { background: transparent; display: inline-block; }

.range-toggle { display: flex; gap: 4px; background: rgba(255,255,255,0.04); padding: 3px; border-radius: 10px; }
.toggle-btn { background: transparent; border: none; color: var(--text-dim); padding: 6px 12px; border-radius: 8px; font-size: 12px; cursor: pointer; font-weight: 600; }
.toggle-btn.active { background: var(--panel-solid); color: var(--green); }
.legend-wrap { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
.legend-item { display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-dim); }
.legend-item i { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

.calc-results { display: flex; flex-direction: column; gap: 14px; } .recommend-row { display: flex; gap: 24px; flex-wrap: wrap; }
.listing-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 15.5px; margin-top: 4px; }
.listing-desc { font-size: 13px; color: var(--text-dim); line-height: 1.6; margin-top: 4px; }
.tag-wrap { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 6px; }
.hashtag { background: var(--blue-dim); color: var(--blue); padding: 4px 9px; border-radius: 20px; font-size: 11.5px; }
.keyword { background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: var(--text-dim); padding: 4px 9px; border-radius: 20px; font-size: 11.5px; }

.insights-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
@media (max-width: 1100px) { .insights-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 700px) { .insights-grid { grid-template-columns: 1fr; } }
.insight-card { display: flex; flex-direction: column; align-items: flex-start; }
.insight-icon { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.insight-icon.tone-green { background: var(--green-dim); color: var(--green); } .insight-icon.tone-blue { background: var(--blue-dim); color: var(--blue); }
.insight-icon.tone-amber { background: var(--amber-dim); color: var(--amber); } .insight-icon.tone-red { background: var(--red-dim); color: var(--red); } .insight-icon.tone-gold { background: var(--gold-dim); color: var(--gold); }

.premium-banner { display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; border: 1px solid rgba(245,185,61,0.25); background: linear-gradient(120deg, rgba(245,185,61,0.06), var(--panel)); }
.premium-left { display: flex; flex-direction: column; gap: 3px; min-width: 220px; }
.premium-badge { display: inline-flex; align-items: center; gap: 5px; background: var(--amber-dim); color: var(--amber); font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 20px; width: fit-content; margin-bottom: 4px; }
.premium-features { display: flex; flex-wrap: wrap; gap: 10px; flex: 1; }
.premium-feature { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-dim); background: rgba(255,255,255,0.03); padding: 6px 10px; border-radius: 20px; border: 1px solid var(--border); }

/* ---------- AI Orb ---------- */
.ai-orb-wrap { position: fixed; bottom: 26px; right: 26px; width: 62px; height: 62px; border-radius: 50%; border: none; background: transparent; cursor: pointer; z-index: 60; display: flex; align-items: center; justify-content: center; }
.ai-orb-core { position: relative; width: 46px; height: 46px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #7dffcf, var(--green) 40%, var(--blue) 100%); box-shadow: 0 0 24px rgba(0,226,138,0.55), inset 0 0 12px rgba(255,255,255,0.35); animation: orbBreathe 3.2s ease-in-out infinite; overflow: hidden; }
.ai-orb-glow { position: absolute; inset: -30%; background: conic-gradient(from 0deg, rgba(255,255,255,0.5), transparent 30%, rgba(255,255,255,0.5) 60%, transparent 90%); animation: orbSpin 4s linear infinite; opacity: 0.5; }
.ai-orb-ring { position: absolute; inset: 0; border-radius: 50%; border: 1.5px solid rgba(0,226,138,0.35); opacity: 0; }
@keyframes orbBreathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.07); } }
@keyframes orbSpin { to { transform: rotate(360deg); } }
.state-listening .ai-orb-core { animation: orbPulseFast 0.9s ease-in-out infinite; box-shadow: 0 0 28px rgba(59,130,246,0.75); }
.state-listening .ai-orb-ring.r1 { opacity: 1; animation: ringExpand 1.4s ease-out infinite; border-color: rgba(59,130,246,0.6); }
.state-thinking .ai-orb-glow { animation: orbSpin 1s linear infinite; }
.state-speaking .ai-orb-ring.r1, .state-speaking .ai-orb-ring.r2 { opacity: 1; border-color: rgba(0,226,138,0.5); }
.state-speaking .ai-orb-ring.r1 { animation: ringExpand 1.1s ease-out infinite; }
.state-speaking .ai-orb-ring.r2 { animation: ringExpand 1.1s ease-out infinite 0.55s; }
@keyframes orbPulseFast { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
@keyframes ringExpand { 0% { transform: scale(0.9); opacity: 0.8; } 100% { transform: scale(1.9); opacity: 0; } }
.ai-orb-badge { position: absolute; top: -2px; right: -2px; background: var(--red); color: #fff; font-size: 10px; font-weight: 700; width: 17px; height: 17px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 3px var(--bg); }

/* ---------- Analyst Panel ---------- */
.analyst-panel { position: fixed; top: 0; right: 0; height: 100vh; width: 400px; max-width: 92vw; background: rgba(10,14,19,0.88); backdrop-filter: blur(22px); -webkit-backdrop-filter: blur(22px); border-left: 1px solid var(--border); z-index: 59; display: flex; flex-direction: column; transform: translateX(100%); transition: transform .35s cubic-bezier(.2,.9,.25,1); box-shadow: -20px 0 60px rgba(0,0,0,0.4); }
.analyst-panel.panel-open { transform: translateX(0); }
.analyst-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 16px 12px 16px; border-bottom: 1px solid var(--border); }
.analyst-header-left { display: flex; align-items: center; gap: 10px; }
.mini-orb { width: 22px; height: 22px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #7dffcf, var(--green) 40%, var(--blue) 100%); box-shadow: 0 0 10px rgba(0,226,138,0.5); flex-shrink: 0; }
.mini-orb.state-listening { box-shadow: 0 0 10px rgba(59,130,246,0.7); animation: orbPulseFast 0.9s ease-in-out infinite; }
.mini-orb.state-speaking, .mini-orb.state-thinking { animation: orbPulseFast 1.1s ease-in-out infinite; }
.analyst-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 13.5px; }
.analyst-status { font-size: 11px; color: var(--text-mute); }
.analyst-header-right { display: flex; align-items: center; gap: 6px; }
.icon-toggle { background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: var(--text-dim); border-radius: 8px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.icon-toggle.on { color: var(--green); border-color: rgba(0,226,138,0.4); }
.name-capture { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--border); }
.voice-picker { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--border); }
.voice-select { flex: 1; padding: 7px 8px; font-size: 11.5px; }
.analyst-body { flex: 1; overflow-y: auto; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.analyst-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; height: 100%; text-align: center; padding: 30px; }
.chat-row { display: flex; }
.chat-row.user { justify-content: flex-end; }
.chat-row.analyst, .chat-row.system { justify-content: flex-start; }
.chat-bubble { max-width: 88%; padding: 10px 13px; border-radius: 14px; font-size: 12.8px; line-height: 1.5; }
.user-bubble { background: var(--blue-dim); color: var(--text); border-bottom-right-radius: 4px; }
.system-bubble { background: rgba(255,255,255,0.05); color: var(--text-mute); font-size: 11.5px; border: 1px dashed var(--border); }
.analyst-bubble { background: rgba(0,226,138,0.07); border: 1px solid rgba(0,226,138,0.18); border-bottom-left-radius: 4px; }
.beat-line { margin: 0 0 6px 0; color: var(--text-dim); transition: color .2s ease; }
.beat-line:last-child { margin-bottom: 0; }
.beat-line.beat-active { color: var(--text); font-weight: 500; }
.quick-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 10px 16px; }
.chip { background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: var(--text-dim); font-size: 10.8px; padding: 6px 10px; border-radius: 20px; cursor: pointer; white-space: nowrap; }
.chip-active { background: var(--green-dim); border-color: rgba(0,226,138,0.5); color: var(--green); }
.chip:hover { color: var(--green); border-color: rgba(0,226,138,0.4); }
.analyst-input-row { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--border); }
.mic-btn { width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--border); background: rgba(255,255,255,0.05); color: var(--text-dim); display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
.mic-btn.listening { background: rgba(59,130,246,0.2); color: var(--blue); border-color: var(--blue); animation: orbPulseFast 0.9s ease-in-out infinite; }
.analyst-input { flex: 1; background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--text); border-radius: 10px; padding: 9px 12px; font-size: 12.5px; outline: none; }
.analyst-input:focus { border-color: var(--green); }
.send-btn { width: 36px; height: 36px; border-radius: 10px; border: none; background: linear-gradient(135deg, var(--green), #00b46f); color: #06150f; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }

/* ---------- AI Photo Studio ---------- */
.upload-zone { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center; border: 1.5px dashed var(--border); cursor: pointer; padding: 34px 20px; transition: border-color .2s ease, background .2s ease; }
.upload-zone:hover, .upload-zone.dragging { border-color: rgba(59,130,246,0.6); background: rgba(59,130,246,0.05); }
.thumb-strip { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; }
.thumb { position: relative; width: 78px; height: 78px; border-radius: 12px; overflow: hidden; border: 2px solid var(--border); cursor: pointer; flex-shrink: 0; background: #0d1319; }
.thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.thumb-active { border-color: var(--green); }
.thumb-overlay { position: absolute; inset: 0; background: rgba(6,10,14,0.55); display: flex; align-items: center; justify-content: center; }
.thumb-score { position: absolute; bottom: 3px; left: 3px; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 10px; }
.sc-green { background: var(--green-dim); color: var(--green); } .sc-blue { background: var(--blue-dim); color: var(--blue); } .sc-amber { background: var(--amber-dim); color: var(--amber); }
.thumb-remove { position: absolute; top: 3px; right: 3px; width: 16px; height: 16px; border-radius: 50%; background: rgba(0,0,0,0.55); border: none; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }

.studio-layout { display: grid; grid-template-columns: 1fr 320px; gap: 16px; align-items: start; }
@media (max-width: 1100px) { .studio-layout { grid-template-columns: 1fr; } }
.studio-main { display: flex; flex-direction: column; gap: 16px; }
.studio-sidebar { display: flex; flex-direction: column; gap: 16px; }

.ba-slider { position: relative; width: 100%; aspect-ratio: 4 / 3; border-radius: 12px; overflow: hidden; background: #0d1319; user-select: none; }
.ba-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: #10161c; }
.ba-placeholder { position: absolute; inset: 0; background: #10161c; }
.ba-after-wrap { position: absolute; inset: 0; }
.ba-handle { position: absolute; top: 0; bottom: 0; width: 3px; background: var(--green); cursor: ew-resize; transform: translateX(-50%); box-shadow: 0 0 10px rgba(0,226,138,0.6); }
.ba-handle-grip { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 30px; height: 30px; border-radius: 50%; background: var(--green); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 4px rgba(0,226,138,0.2); }
.ba-label { position: absolute; bottom: 8px; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; background: rgba(0,0,0,0.55); color: #fff; padding: 3px 8px; border-radius: 6px; }
.ba-label-left { left: 8px; } .ba-label-right { right: 8px; }

.quality-card { display: flex; align-items: center; gap: 18px; }
.score-ring { width: 84px; height: 84px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.score-ring-inner { width: 64px; height: 64px; border-radius: 50%; background: var(--bg-alt); display: flex; flex-direction: column; align-items: center; justify-content: center; }
.score-ring-value { font-size: 19px; font-weight: 700; }
.score-ring-label { font-size: 9px; color: var(--text-mute); }
.quality-notes { flex: 1; }

.bg-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
.bg-swatch { aspect-ratio: 1; border-radius: 10px; border: 2px solid var(--border); cursor: pointer; display: flex; align-items: center; justify-content: center; color: rgba(0,0,0,0.5); }
.bg-swatch.bg-active { border-color: var(--green); box-shadow: 0 0 0 2px rgba(0,226,138,0.3); }
.enhance-list { display: flex; flex-direction: column; gap: 8px; }
.enhance-row { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--text-dim); cursor: pointer; }
.enhance-row input { accent-color: var(--green); width: 15px; height: 15px; }

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 8px; }
::-webkit-scrollbar-track { background: transparent; }

/* ---------- Command Palette ---------- */
.cmdk-hint { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-mute); border: 1px solid var(--border); padding: 3px 8px; border-radius: 6px; }
.cmdk-overlay { position: fixed; inset: 0; background: rgba(4,6,8,0.65); backdrop-filter: blur(4px); z-index: 80; display: flex; align-items: flex-start; justify-content: center; padding-top: 12vh; }
.cmdk-box { width: 100%; max-width: 520px; background: var(--panel-solid); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; box-shadow: 0 30px 80px -20px rgba(0,0,0,0.7); animation: cmdkIn .15s ease; }
@keyframes cmdkIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
.cmdk-input-row { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.cmdk-input { flex: 1; background: transparent; border: none; outline: none; color: var(--text); font-size: 14px; }
.cmdk-kbd { font-size: 10px; color: var(--text-mute); border: 1px solid var(--border); padding: 2px 6px; border-radius: 5px; }
.cmdk-list { max-height: 320px; overflow-y: auto; padding: 6px; }
.cmdk-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 9px; font-size: 13px; color: var(--text-dim); cursor: pointer; }
.cmdk-item:hover, .cmdk-item.cmdk-active { background: rgba(255,255,255,0.05); color: var(--text); }

/* ---------- Chat Analyzer ---------- */
.chat-transcript { display: flex; flex-direction: column; gap: 8px; max-height: 420px; overflow-y: auto; }
`;
