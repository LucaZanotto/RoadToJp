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
  // Themed micro-gifts
  gifts: [
    { id:"fiori",  emoji:"💐", title:"Flowers",  desc:"A bouquet with a note.", suggest: 15 },
    { id:"cinema", emoji:"🎬", title:"Cinema",   desc:"Two tickets for a movie night.", suggest: 8 },
    { id:"cena",   emoji:"🍝", title:"Dinner",   desc:"A cozy dinner at our place.", suggest: 25 },
    { id:"terme",  emoji:"♨️", title:"Spa",      desc:"Relaxing thermal spa entry.", suggest: 60 },
    { id:"caffe",  emoji:"☕", title:"Coffee",   desc:"Offer me a coffee (or two!).", suggest: 1.5 }
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
// Chiudi il menu quando clicchi un link o fuori
primaryMenu?.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));
document.addEventListener("click",(e)=>{
  if (!primaryMenu?.contains(e.target) && !hamburger?.contains(e.target)) {
    closeMenu();
  }
});

// ====== Rendering ======
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function addDonation(giftId, amount){
  amount = Math.round(Math.max(0, Number(amount) || 0));
  if(!amount) return;
  state.totalRaised += amount;
  if(giftId){ state.gifts[giftId] = (state.gifts[giftId]||0) + amount; }
  saveState(); render();
}
function resetState(){ localStorage.removeItem(STORAGE_KEY); location.reload(); }

function render(){
  // Total
  const totalRaised = state.totalRaised || 0;
  const pct = clamp((totalRaised / CONFIG.totalTarget) * 100, 0, 100);
  $("totalRaisedLabel").textContent = `${formatEUR(totalRaised)} raised`;
  $("totalTargetLabel").textContent = `Target: ${formatEUR(CONFIG.totalTarget)}`;
  $("totalProgress").style.width = pct + "%";

  // Gifts grid
  const grid = $("giftGrid");
  grid.innerHTML = "";
  const tpl = $("giftCardTpl");
  const freeSel = $("freeGift");
  freeSel.innerHTML = '<option value="">— optionally link it to a gesture —</option>';

  CONFIG.gifts.forEach(g => {
    const node = tpl.content.cloneNode(true);
    node.querySelector(".gift-emoji").textContent = g.emoji;
    node.querySelector(".gift-title").textContent = g.title;
    node.querySelector(".gift-desc").textContent = g.desc;
    node.querySelector(".suggest-amount").textContent = formatEUR(g.suggest);

    let selectedAmount = g.suggest;
    node.querySelectorAll(".chip").forEach(chip=>{
      const val = parseInt(chip.dataset.amount,10);
      if(val === selectedAmount) chip.classList.add("active");
      chip.addEventListener("click", ()=>{
        node.querySelectorAll(".chip").forEach(c=>c.classList.remove("active"));
        if(val > 0){ chip.classList.add("active"); selectedAmount = val; }
        else{
          const other = prompt("Enter a custom amount (€):", String(selectedAmount));
          const num = parseInt(other,10);
          if(!isNaN(num) && num>0) { selectedAmount = num; }
        }
      });
    });

    const raised = state.gifts[g.id] || 0;
    node.querySelector("[data-role='giftRaised']").textContent = formatEUR(raised);

    node.querySelector("[data-role='donateBtn']").addEventListener("click", ()=>{
      openPaymentModal(g.title, selectedAmount, g.id);
    });

    grid.appendChild(node);

    const opt = document.createElement("option");
    opt.value = g.id; opt.textContent = `${g.emoji} ${g.title}`;
    freeSel.appendChild(opt);
  });
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

// Share (kept for future use if you re-add share buttons)
function share({title, text}){
  const url = location.href;
  if(navigator.share){
    navigator.share({title, text, url}).catch(()=>{});
  }else{
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard. Thanks for sharing!");
  }
}

// Init
$("resetData").addEventListener("click", resetState);
render();
