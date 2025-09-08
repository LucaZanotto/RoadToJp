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
  // Micro-gifts: fixed price + funny meme-style lines (sorted by price)
  gifts: [
    { id:"coffee",  emoji:"☕", title:"Coffee",    desc:"Fuel my study brain — unlocks +5 focus.",                     amount: 2  },
    { id:"cinema",  emoji:"🎬", title:"Cinema",    desc:"Two tickets so we can judge the plot like pros.",             amount: 8  },
    { id:"flowers", emoji:"🌸", title:"Flowers",   desc:"Pixels are nice, but petals hit different.",                  amount: 15 },
    { id:"dinner",  emoji:"🍝", title:"Dinner",    desc:"Home-cooked date night — chef’s kiss included.",              amount: 25 },
    { id:"spa",     emoji:"♨️", title:"Spa Day",   desc:"De-stress upgrade: turning us from noodles to humans.",       amount: 80 },
    { id:"weekend", emoji:"🧳", title:"Weekend",   desc:"Mini getaway: touching grass in 4K HDR.",                     amount: 200 }
  ]
};


// ====== Local state (demo) ======
const STORAGE_KEY = "donationLiteV1";
const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
if (!state.gifts) { state.gifts = {}; }
if (typeof state.totalRaised !== "number") { state.totalRaised = 0; }

// Utils
const formatEUR = (n) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const clamp = (x,min,max)=>Math.min(Math.max(x,min),max);
const $ = (id) => document.getElementById(id);

// Social dock: set hrefs from CONFIG
const ig = $("socialIG");
const tk = $("socialTT");
const tw = $("socialTW");
if (ig) ig.href = CONFIG.social.instagram;
if (tk) tk.href = CONFIG.social.tiktok;
if (tw) tw.href = CONFIG.social.twitter;

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

// ====== State helpers ======
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function addDonation(giftId, amount){
  amount = Math.round(Math.max(0, Number(amount) || 0));
  if(!amount) return;
  state.totalRaised += amount;
  if(giftId){ state.gifts[giftId] = (state.gifts[giftId]||0) + amount; }
  saveState(); render();
}
function resetState(){ localStorage.removeItem(STORAGE_KEY); location.reload(); }

// ====== Render ======
function render(){
  // Total
  const totalRaised = state.totalRaised || 0;
  const pct = clamp((totalRaised / CONFIG.totalTarget) * 100, 0, 100);
  $("totalRaisedLabel").textContent = `${formatEUR(totalRaised)} raised`;
  $("totalTargetLabel").textContent = `Target: ${formatEUR(CONFIG.totalTarget)}`;
  $("totalProgress").style.width = pct + "%";

  // Gifts grid (semplice)
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

  // Popola la tendina del custom (opzionale)
  const freeSel = $("freeGift");
  if (freeSel) {
    freeSel.innerHTML = '<option value="">— optionally link it to a gesture —</option>';
    CONFIG.gifts.forEach(g => {
      const opt = document.createElement("option");
      opt.value = g.id; opt.textContent = `${g.emoji} ${g.title}`;
      freeSel.appendChild(opt);
    });
  }
}

// Payments
const modal = document.getElementById("payModal");
function openPaymentModal(title, amount, giftId){
  $("modalTitle").textContent = "Contribute — " + title;
  $("modalAmount").textContent = formatEUR(amount);

  const paypalA = $("payPaypal");
  paypalA.href = CONFIG.paypalLink;
  const satisA = $("paySatispay");
  satisA.href = CONFIG.satispayLink;
  $("ibanValue").textContent = CONFIG.iban;

  paypalA.onclick = () => { addDonation(giftId, amount); };
  satisA.onclick = () => { addDonation(giftId, amount); };
  $("copyIban").onclick = () => {
    navigator.clipboard.writeText(CONFIG.iban);
    addDonation(giftId, amount);
    alert("IBAN copied to clipboard. Thank you!");
  };

  modal?.showModal?.();
}

// Custom amount
$("freeDonateBtn").addEventListener("click", ()=>{
  const amount = parseInt($("freeAmount").value, 10);
  const giftId = $("freeGift").value || null;
  if(isNaN(amount) || amount<=0){ alert("Please enter a valid amount."); return; }
  const title = giftId ? (CONFIG.gifts.find(g=>g.id===giftId)?.title || "Custom amount") : "Custom amount";
  openPaymentModal(title, amount, giftId);
});

// Init
document.getElementById("resetData")?.addEventListener("click", resetState);
render();
