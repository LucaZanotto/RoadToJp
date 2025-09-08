// ====== Config ======
const CONFIG = {
  totalTarget: 5000, // Japan trip goal
  paypalLink: "https://www.paypal.me/lucazan8",
  satispayLink: "https://satispay.com/pay/tuo-utente",
  iban: "IT00 A000 0000 0000 0000 0000 000",
  social: {
    instagram: "https://www.instagram.com/roadtojapan2k26/",
    tiktok: "https://www.tiktok.com/@tuo-utente",
    twitter: "https://x.com/tuo-utente"
  },
  // Gifts: fixed price + meme-style lines (sorted by price)
  gifts: [
    { id:"coffee",  emoji:"☕", title:"Coffee",   desc:"Fuel my study brain — unlocks +5 focus.",                     amount: 2  },
    { id:"cinema",  emoji:"🎬", title:"Cinema",   desc:"Two tickets so we can judge the plot like pros.",             amount: 8  },
    { id:"flowers", emoji:"🌸", title:"Flowers",  desc:"Pixels are nice, but petals hit different.",                  amount: 15 },
    { id:"dinner",  emoji:"🍝", title:"Dinner",   desc:"Home-cooked date night — chef’s kiss included.",              amount: 25 },
    { id:"spa",     emoji:"♨️", title:"Spa Day",  desc:"De-stress upgrade: turning us from noodles to humans.",       amount: 80 },
    { id:"weekend", emoji:"🧳", title:"Weekend",  desc:"Mini getaway: touching grass in 4K HDR.",                     amount: 200 }
  ]
};

// ====== Utilities ======
const $ = (id) => document.getElementById(id);
function formatEUR(n){
  return new Intl.NumberFormat("en-GB", {style:"currency", currency:"EUR", maximumFractionDigits:0}).format(n);
}
const clamp = (x,min,max)=>Math.min(Math.max(x,min),max);

// ====== Supabase: lettura del totale reale (RPC) ======
// Inserisci i tuoi valori in seguito: per ora sono placeholder sicuri.
const SUPABASE_URL  = "https://owoeqjeqqbtrtiwgpqbr.supabase.co";  // OK renderlo pubblico
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93b2VxamVxcWJ0cnRpd2dwcWJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDQ0ODYsImV4cCI6MjA3MjkyMDQ4Nn0.Nj_yol5ECxQ70-j5GsztNkYBz9tN_8PZDSkpY_FLp6I";                         // Sostituisci quando pronto

async function fetchTotalCents(){
  // Se la chiave è ancora placeholder, evita la chiamata remota
  if (!SUPABASE_ANON || SUPABASE_ANON.startsWith("<")) {
    console.warn("Supabase anon key non impostata: il totale resterà 0 finché non la configuri.");
    return 0;
  }
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_donation_total`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`
    }
  });
  if (!r.ok) {
    console.error("Errore nel recupero totale:", await r.text());
    return 0;
  }
  const cents = await r.json(); // ritorna bigint/number
  return Number(cents) || 0;
}

// ====== Social dock: set hrefs from CONFIG ======
$("socialIG")?.setAttribute("href", CONFIG.social.instagram);
$("socialTT")?.setAttribute("href", CONFIG.social.tiktok);
$("socialTW")?.setAttribute("href", CONFIG.social.twitter);

// ====== Mobile menu (hamburger) ======
const hamburger = $("hamburger");
const primaryMenu = $("primaryMenu");

function closeMenu(){
  if (!hamburger || !primaryMenu) return;
  hamburger.setAttribute("aria-expanded","false");
  primaryMenu.classList.remove("open");
}
function toggleMenu(){
  if (!hamburger || !primaryMenu) return;
  const isOpen = hamburger.getAttribute("aria-expanded")==="true";
  hamburger.setAttribute("aria-expanded", String(!isOpen));
  primaryMenu.classList.toggle("open", !isOpen);
}
hamburger?.addEventListener("click", (e)=>{ e.stopPropagation(); toggleMenu(); });
primaryMenu?.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));
document.addEventListener("click",(e)=>{
  if (!primaryMenu?.contains(e.target) && !hamburger?.contains(e.target)) closeMenu();
});

// ====== Render Totale (reale) ======
async function renderTotal(){
  const totalCents = await fetchTotalCents();
  const totalRaised = Math.round(totalCents / 100); // converti in EUR interi
  const target = CONFIG.totalTarget;
  const pct = clamp((totalRaised / target) * 100, 0, 100);

  $("totalRaisedLabel").textContent = `${formatEUR(totalRaised)} raised`;
  $("totalTargetLabel").textContent = `Target: ${formatEUR(target)}`;
  $("totalProgress").style.width = pct + "%";
}

// ====== Render Gift Grid ======
function renderGifts(){
  const grid = $("giftGrid");
  grid.innerHTML = "";
  const tpl = $("giftCardTpl");

  CONFIG.gifts.forEach(g => {
    const node = tpl.content.cloneNode(true);
    node.querySelector(".gift-emoji").textContent = g.emoji;
    node.querySelector(".gift-title").textContent = g.title;
    node.querySelector(".gift-desc").textContent = g.desc;
    node.querySelector(".amount").textContent = formatEUR(g.amount);

    node.querySelector("[data-role='donateBtn']").addEventListener("click", ()=>{
      openPaymentModal(g.title, g.amount, g.id);
    });

    grid.appendChild(node);
  });
}

// ====== Payments / Modal ======
const modal = document.getElementById("payModal");

function openPaymentModal(title, amount, giftId){
  const hasAmount = Number.isFinite(amount) && amount > 0;

  // Title
  $("modalTitle").textContent = "Contribute — " + title;

  // Selected amount row: show only if we have a fixed amount
  const selectedRow = document.getElementById("selectedRow");
  if (selectedRow){
    selectedRow.style.display = hasAmount ? "" : "none";
  }
  if (hasAmount){
    $("modalAmount").textContent = formatEUR(amount);
  }

  // Payment links
  const paypalA = $("payPaypal");
  const satisA  = $("paySatispay");
  $("ibanValue").textContent = CONFIG.iban;
  paypalA.href = CONFIG.paypalLink;
  satisA.href  = CONFIG.satispayLink;

  // Importante: NON incrementiamo più un contatore locale qui.
  // Il totale viene solo da Supabase.
  paypalA.onclick = null;
  satisA.onclick  = null;
  const copyBtn = $("copyIban");
  if (copyBtn) {
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(CONFIG.iban);
      alert("IBAN copied to clipboard. Thank you!");
    };
  }

  modal?.showModal?.();
}

// ====== Custom amount triggers (same modal, no fixed amount) ======
$("openCustomCta")?.addEventListener("click", ()=>{
  openPaymentModal("Custom amount", null, null);
});
$("openCustomMenu")?.addEventListener("click", (e)=>{
  e.preventDefault();
  closeMenu();
  openPaymentModal("Custom amount", null, null);
});

// ====== Init ======
(function init(){
  // Nascondi eventuale bottone "Reset local data" se presente nell'HTML (non serve più)
  const resetBtn = $("resetData");
  if (resetBtn) resetBtn.style.display = "none";

  renderGifts();
  renderTotal();
  // Refresh periodico opzionale (30s)
  setInterval(renderTotal, 30000);
})();