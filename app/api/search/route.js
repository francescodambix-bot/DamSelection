// Funzione server (gira su Vercel, non nel browser) che cerca davvero su Vinted.
// Chiamata dal bottone "Cerca dal vivo" dentro l'app. Uso personale, rate-limited.

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
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
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

async function getSessionCookies(domain) {
  const res = await fetch(`https://${domain}/`, {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "it-IT,it;q=0.9,en;q=0.8" },
  });
  const setCookie = res.headers.get("set-cookie") || "";
  const cookiePairs = setCookie.split(/,(?=[^;]+?=)/).map((c) => c.split(";")[0].trim()).filter(Boolean);
  return cookiePairs.join("; ");
}

async function searchVinted(domain, cookies, query, page, perPage = 48) {
  const url = `https://${domain}/api/v2/catalog/items?page=${page}&per_page=${perPage}&search_text=${encodeURIComponent(query)}&order=newest_first`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
      "Cookie": cookies,
      "Referer": `https://${domain}/`,
    },
  });
  if (!res.ok) throw new Error(`Vinted ha risposto ${res.status}`);
  return res.json();
}

function brandMatchesQuery(brand, q) {
  const b = (brand || "").toLowerCase().trim();
  const qq = (q || "").toLowerCase().trim();
  if (!b || b === "sconosciuto") return false;
  return b.includes(qq) || qq.includes(b) || qq.split(" ").some((w) => w === b);
}

function buildItem(raw, marketMedian, seedIndex) {
  const price = Number(raw?.price?.amount || 0);
  if (!price) return null;
  const brand = (raw.brand_title || "Sconosciuto").trim() || "Sconosciuto";
  const title = raw.title || `${brand} articolo`;
  const conditionMap = {
    new_with_tags: "Nuovo con etichetta", very_good: "Ottimo", good: "Buono", satisfactory: "Discreto",
  };
  const condition = conditionMap[raw.status] || raw.status || "Non specificata";

  let photo = null;
  const photoObj = raw.photo || (raw.photos && raw.photos[0]);
  if (photoObj) photo = photoObj.full_size_url || photoObj.url || (photoObj.thumbnails && photoObj.thumbnails[0]?.url) || null;

  const marketAvg = marketMedian || price;
  const resaleAvg = marketAvg;
  const shippingCost = 6;
  const profit = Math.round((resaleAvg - price - shippingCost) * 100) / 100;
  const roi = price ? Math.round((profit / price) * 1000) / 10 : 0;
  const discountVsMarketPct = marketAvg > 0 ? Math.round((1 - price / marketAvg) * 1000) / 10 : 0;

  let score = 50 + Math.min(30, roi / 3) + (discountVsMarketPct > 30 ? 10 : discountVsMarketPct > 10 ? 3 : -5);
  score = clamp(Math.round(score + (Math.sin(seedIndex * 999) * 3)), 5, 98);
  const sellProbability = clamp(Math.round(40 + score * 0.4), 5, 98);
  const idealPrice = Math.round(marketAvg * 0.93 * 100) / 100;

  return {
    id: `real-${raw.id || seedIndex}`,
    title, brand,
    category: raw.catalog_id,
    size: raw.size_title || "N/D",
    color: raw.color1 || "N/D",
    condition,
    country: raw.country || "N/D",
    material: "N/D",
    year: null,
    limitedEdition: false,
    seller: raw.user?.login || "sconosciuto",
    sellerReviews: raw.user?.feedback_count || 0,
    priceHistory: [],
    strengths: discountVsMarketPct > 25 ? [`Prezzato circa il ${discountVsMarketPct}% sotto la mediana degli annunci simili trovati`] : ["Prezzo in linea con gli altri annunci simili trovati"],
    weaknesses: (raw.photos?.length || 0) < 2 ? ["Poche foto disponibili nell'annuncio originale"] : ["Nessuna debolezza evidente rilevata automaticamente"],
    buyStrategy: price <= idealPrice ? "Acquista ora: prezzo già sotto il valore mediano stimato." : `Valuta se negoziare: la mediana osservata è ${marketAvg.toFixed(2)}€.`,
    sellStrategy: "Rivendi vicino alla mediana di mercato osservata per una vendita rapida.",
    price: Math.round(price * 100) / 100,
    marketAvg: Math.round(marketAvg * 100) / 100,
    resaleAvg: Math.round(resaleAvg * 100) / 100,
    shippingCost, profit, roi,
    demand: "N/D", competition: "N/D", saleTime: null,
    score, badge: badgeForScore(score), sellProbability, idealPrice,
    risk: riskForScore(score),
    url: raw.url || null,
    photo,
    discountVsMarketPct,
    fetchedAt: new Date().toISOString(),
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const queries = searchParams.getAll("q").filter(Boolean);
  const country = searchParams.get("country") || "it";
  const pages = Math.min(3, Math.max(1, Number(searchParams.get("pages") || 1)));
  const minDiscount = Math.min(0.9, Math.max(0, Number(searchParams.get("minDiscount") || 0.25)));

  if (queries.length === 0) {
    return Response.json({ error: "Manca il parametro q (parola chiave da cercare)" }, { status: 400 });
  }

  const domain = country === "it" ? "www.vinted.it" : `www.vinted.${country}`;

  try {
    const cookies = await getSessionCookies(domain);
    const allItems = [];

    for (const q of queries) {
      const rawItems = [];
      for (let page = 1; page <= pages; page++) {
        const data = await searchVinted(domain, cookies, q, page);
        const items = data.items || [];
        if (items.length === 0) break;
        rawItems.push(...items);
        await new Promise((r) => setTimeout(r, 700));
      }

      const relevant = rawItems.filter((r) => brandMatchesQuery(r.brand_title, q));
      const byBrand = {};
      for (const r of relevant) {
        const brand = (r.brand_title || "Sconosciuto").trim();
        const price = Number(r?.price?.amount || 0);
        if (price > 0) (byBrand[brand] ||= []).push(price);
      }
      const medians = {};
      for (const [brand, prices] of Object.entries(byBrand)) {
        if (prices.length >= 5) medians[brand] = median(prices);
      }

      relevant.forEach((raw, i) => {
        const brand = (raw.brand_title || "Sconosciuto").trim();
        const m = medians[brand];
        if (m == null) return;
        const item = buildItem(raw, m, i);
        if (item && item.discountVsMarketPct >= minDiscount * 100) allItems.push(item);
      });
    }

    allItems.sort((a, b) => b.discountVsMarketPct - a.discountVsMarketPct);
    return Response.json({ items: allItems, count: allItems.length, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return Response.json({ error: String(err?.message || err) }, { status: 502 });
  }
}
