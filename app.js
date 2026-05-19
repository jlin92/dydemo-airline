// AuraAir multi-page JS (rewritten for MPA, fixes routing + results + seat map)
document.documentElement.classList.add('js');

// ----------------------------
// State (persist across full page loads)
// ----------------------------
const STATE_KEY = 'auraairState_mpa_v3';
const clone = (o) => JSON.parse(JSON.stringify(o));

const defaultState = {
  tripType: 'return',
  pax: { adults: 1, children: 0 },
  selectedDest: 'Tokyo',
  searchFrom: 'Singapore (SIN)',
  searchDepart: null,
  searchReturn: null,
  cabinClass: 'Economy',
  selectedFare: { name: 'Economy Value', price: 698, flight: 'AU 301', depart: '07:55', arrive: '15:15', stops: 'Direct' },
  extrasSelected: [],
  extrasTotal: 0,
  selectedSeat: null,
  totalPrice: 790,
  currentSort: 'price',
  confirmation: null
};

function loadState(){
  try{
    const raw = sessionStorage.getItem(STATE_KEY);
    if (!raw) return clone(defaultState);
    const s = JSON.parse(raw);
    const base = clone(defaultState);
    return {
      ...base,
      ...s,
      pax: { ...base.pax, ...(s.pax || {}) },
      selectedFare: { ...base.selectedFare, ...(s.selectedFare || {}) }
    };
  } catch(e){
    return clone(defaultState);
  }
}

function saveState(patch){
  const cur = loadState();
  const next = {
    ...cur,
    ...(patch || {}),
    pax: { ...cur.pax, ...((patch||{}).pax || {}) },
    selectedFare: { ...cur.selectedFare, ...((patch||{}).selectedFare || {}) }
  };
  sessionStorage.setItem(STATE_KEY, JSON.stringify(next));
  return next;
}

function go(rel){ window.location.href = rel; }
function getPage(){ return document.body?.dataset?.page || ''; }
function getBookingStep(){
  const v = document.body?.dataset?.bookingStep;
  return v ? parseInt(v, 10) : null;
}

// ----------------------------
// Nav
// ----------------------------
function handleScroll(){
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  nav.className = window.scrollY > 80 ? 'scrolled' : 'transparent';
}

function initNav(){
  const page = getPage();
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  if (page === 'home'){
    nav.className = 'transparent';
    window.addEventListener('scroll', handleScroll);
    handleScroll();
  } else {
    nav.className = 'solid';
    window.removeEventListener('scroll', handleScroll);
  }
}

// ----------------------------
// Home controls
// ----------------------------
function setTripType(type, btn){
  saveState({ tripType: type });
  document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const fields = document.getElementById('searchFields');
  const returnField = document.getElementById('returnField');
  if (!fields || !returnField) return;
  if (type === 'oneway'){
    fields.className = 'search-fields one-way';
    returnField.style.display = 'none';
  } else {
    fields.className = 'search-fields';
    returnField.style.display = '';
  }
}

function changePax(type, delta){
  const s = loadState();
  if (type === 'adults'){
    const adults = Math.max(1, (s.pax.adults||1) + delta);
    saveState({ pax: { adults } });
    const el = document.getElementById('adultCount');
    if (el) el.textContent = adults;
  } else {
    const children = Math.max(0, (s.pax.children||0) + delta);
    saveState({ pax: { children } });
    const el = document.getElementById('childCount');
    if (el) el.textContent = children;
  }
}

function captureSearchInputs(){
  const from = document.getElementById('searchFrom')?.value || 'Singapore (SIN)';
  const to = document.getElementById('searchTo')?.value || 'Tokyo';
  const depart = document.getElementById('searchDepart')?.value || null;
  const ret = document.getElementById('searchReturn')?.value || null;
  const cabin = document.getElementById('cabinClass')?.value || 'Economy';
  saveState({ searchFrom: from, selectedDest: to, searchDepart: depart, searchReturn: ret, cabinClass: cabin });
}

function doSearch(){
  captureSearchInputs();
  go('flightsearch/');
}

function quickSearch(dest){
  const toSel = document.getElementById('searchTo');
  if (toSel) toSel.value = dest;
  captureSearchInputs();
  go('flightsearch/');
}
var destInfo = {
  'Tokyo':              { code: 'NRT', city: 'Tokyo Narita' },
  'Seoul':              { code: 'ICN', city: 'Seoul Incheon' },
  'London':             { code: 'LHR', city: 'London Heathrow' },
  'Sydney':             { code: 'SYD', city: 'Sydney Kingsford' },
  'Paris':              { code: 'CDG', city: 'Paris Charles de Gaulle' },
  'Dubai':              { code: 'DXB', city: 'Dubai International' },
  'New York':           { code: 'JFK', city: 'New York JFK' },
  'Ho Chi Minh City':   { code: 'SGN', city: 'Ho Chi Minh City' },
  'Bangkok':            { code: 'BKK', city: 'Bangkok Suvarnabhumi' },
  'Mumbai':             { code: 'BOM', city: 'Mumbai Chhatrapati' },
  'Melbourne':          { code: 'MEL', city: 'Melbourne Tullamarine' },
  'Shanghai':           { code: 'PVG', city: 'Shanghai Pudong' },
  'Beijing':            { code: 'PEK', city: 'Beijing Capital' },
  'Hong Kong':          { code: 'HKG', city: 'Hong Kong Intl' },
  'Osaka':              { code: 'KIX', city: 'Osaka Kansai' },
  'Kuala Lumpur':       { code: 'KUL', city: 'Kuala Lumpur Intl' },
  'Jakarta':            { code: 'CGK', city: 'Jakarta Soekarno-Hatta' },
  'Bali':               { code: 'DPS', city: 'Bali Ngurah Rai' },
  'Manila':             { code: 'MNL', city: 'Manila Ninoy Aquino' },
  'Delhi':              { code: 'DEL', city: 'Delhi Indira Gandhi' },
  'Colombo':            { code: 'CMB', city: 'Colombo Bandaranaike' },
  'Auckland':           { code: 'AKL', city: 'Auckland Intl' },
  'Amsterdam':          { code: 'AMS', city: 'Amsterdam Schiphol' },
  'Frankfurt':          { code: 'FRA', city: 'Frankfurt Intl' },
  'Zurich':             { code: 'ZRH', city: 'Zurich Intl' },
  'Rome':               { code: 'FCO', city: 'Rome Fiumicino' },
  'Barcelona':          { code: 'BCN', city: 'Barcelona El Prat' },
  'Los Angeles':        { code: 'LAX', city: 'Los Angeles Intl' },
  'San Francisco':      { code: 'SFO', city: 'San Francisco Intl' },
  'Houston':            { code: 'IAH', city: 'Houston George Bush' },
  'Johannesburg':       { code: 'JNB', city: 'Johannesburg OR Tambo' },
  'Nairobi':            { code: 'NBO', city: 'Nairobi Jomo Kenyatta' }
};
function seededRand(seed) {
  var t = seed + 0x6D2B79F5;
  return function () {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function minutesToHM(mins) {
  var h = Math.floor(mins / 60), m = mins % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}
function durToText(mins) {
  return Math.floor(mins / 60) + 'h ' + String(mins % 60).padStart(2, '0') + 'm';
}

function generateFlights(dest) {
  var seed = Array.from(dest).reduce(function(a, c) { return a + c.charCodeAt(0); }, 0);
  var rand = seededRand(seed);
  var flights = [];
  var baseDep = 6 * 60 + Math.floor(rand() * 200);
  var baseDur = 140 + Math.floor(rand() * 700);
  var airlines = [
    { code: 'AA', name: 'AuraAir', color: '#0a1628' },
    { code: 'PA', name: 'Partner', color: '#c0392b' }
  ];
  for (var i = 0; i < 5; i++) {
    var isStop    = rand() > 0.72;
    var dep       = baseDep + i * 145 + Math.floor(rand() * 25);
    var dur       = baseDur + (isStop ? (120 + Math.floor(rand() * 160)) : Math.floor(rand() * 50));
    var arr       = dep + dur;
    var nextDay   = arr >= 24 * 60;
    var arrM      = arr % (24 * 60);
    var airline   = rand() > 0.25 ? airlines[0] : airlines[1];
    var flightNo  = 'AU ' + (300 + Math.floor(rand() * 160));
    var stopLbl   = ['KUL', 'BKK', 'HKG'][Math.floor(rand() * 3)];
    var stopsText = isStop ? '1 stop \u00b7 ' + stopLbl : 'Direct';
    var lite      = 420 + Math.floor(rand() * 380) + (isStop ? -30 : 0);
    var value     = lite + 120 + Math.floor(rand() * 90);
    flights.push({
      depTime: minutesToHM(dep),
      arrTime: minutesToHM(arrM) + (nextDay ? '+1' : ''),
      durationText: durToText(dur),
      stopsText: stopsText,
      airline: airline,
      flightNo: flightNo,
      fareLite: lite,
      fareValue: value
    });
  }
  return flights;
}


function renderFlightCards(dest, info) {
  var listWrap = document.querySelector('#page-results .results-body > div:nth-child(2)');
  if (!listWrap) return;
  listWrap.querySelectorAll('.flight-card').forEach(function(el) { el.remove(); });

  var container = document.getElementById('flightCards');
  if (!container) {
    container = document.createElement('div');
    container.id = 'flightCards';
    var sortBar = listWrap.querySelector('.sort-bar');
    if (sortBar) { sortBar.insertAdjacentElement('afterend', container); }
    else { listWrap.appendChild(container); }
  }

  var flights = generateFlights(dest);
  container.innerHTML = flights.map(function(f) {
    return '<div class="flight-card">' +
      '<div class="flight-card-main">' +
        '<div><div class="flight-time">' + f.depTime + '</div><div class="flight-airport">SIN</div><div class="flight-city">Singapore Changi</div></div>' +
        '<div class="flight-duration-block"><div class="flight-duration">' + f.durationText + '</div><div class="flight-line"><div class="flight-line-dot"></div><div class="flight-line-plane">&#9992;</div><div class="flight-line-dot"></div></div><div class="flight-stops">' + f.stopsText + '</div></div>' +
        '<div><div class="flight-time">' + f.arrTime + '</div><div class="flight-airport">' + info.code + '</div><div class="flight-city">' + info.city + '</div></div>' +
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:12px">' +
          '<div class="flight-airline"><div class="airline-logo" style="background:' + f.airline.color + '">' + f.airline.code + '</div><div class="airline-info">' + f.airline.name + ' \u00b7 ' + f.flightNo + '<br><span class="tag tag-green" style="font-size:10px">On time</span></div></div>' +
          '<button class="flight-options-toggle" onclick="toggleOptions(this)">Select &#8594;</button>' +
        '</div>' +
      '</div>' +
      '<div class="flight-options-panel">' +
        '<div class="options-grid">' +
          '<div class="option-card" onclick="selectFare(this,\'Economy Lite\',\'' + f.fareLite + '\',\'' + f.flightNo + '\',\'' + f.depTime + '\',\'' + f.arrTime + '\',\'' + f.stopsText + '\')">' +
            '<div class="option-card-header"><div class="option-name">Economy Lite</div><div class="option-price"><div class="option-price-amount">SGD ' + f.fareLite + '</div><div class="option-price-per">per person</div></div></div>' +
            '<div style="height:1px;background:var(--grey-light)"></div>' +
            '<div class="option-features">' +
              '<div class="option-feature"><span class="icon icon-check">&#10003;</span> 7kg cabin baggage</div>' +
              '<div class="option-feature"><span class="icon icon-check">&#10003;</span> Standard seat selection</div>' +
              '<div class="option-feature"><span class="icon icon-check">&#10003;</span> In-flight entertainment</div>' +
              '<div class="option-feature"><span class="icon icon-x">&#10007;</span> No checked baggage</div>' +
              '<div class="option-feature"><span class="icon icon-x">&#10007;</span> No meal included</div>' +
              '<div class="option-feature"><span class="icon icon-x">&#10007;</span> Non-refundable</div>' +
            '</div>' +
            '<button class="option-select-btn">Select Economy Lite</button>' +
          '</div>' +
          '<div class="option-card" onclick="selectFare(this,\'Economy Value\',\'' + f.fareValue + '\',\'' + f.flightNo + '\',\'' + f.depTime + '\',\'' + f.arrTime + '\',\'' + f.stopsText + '\')">' +
            '<div class="option-badge">Most Popular</div>' +
            '<div class="option-card-header"><div class="option-name">Economy Value</div><div class="option-price"><div class="option-price-amount">SGD ' + f.fareValue + '</div><div class="option-price-per">per person</div></div></div>' +
            '<div style="height:1px;background:var(--grey-light)"></div>' +
            '<div class="option-features">' +
              '<div class="option-feature"><span class="icon icon-check">&#10003;</span> 7kg cabin baggage</div>' +
              '<div class="option-feature"><span class="icon icon-check">&#10003;</span> 25kg checked baggage</div>' +
              '<div class="option-feature"><span class="icon icon-check">&#10003;</span> Meal included</div>' +
              '<div class="option-feature"><span class="icon icon-check">&#10003;</span> Seat selection included</div>' +
              '<div class="option-feature"><span class="icon icon-check">&#10003;</span> AuraPoints earning</div>' +
              '<div class="option-feature"><span class="icon icon-x">&#10007;</span> Non-refundable</div>' +
            '</div>' +
            '<button class="option-select-btn">Select Economy Value</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  try { sortFlightCards(currentSort); } catch (e) {}
}



// ----------------------------
// Flight options
// ----------------------------
function toggleOptions(btn){
  const card = btn.closest('.flight-card');
  const panel = card.querySelector('.flight-options-panel');
  const isOpen = panel.classList.contains('open');
  document.querySelectorAll('.flight-options-panel').forEach(p => p.classList.remove('open'));
  if (!isOpen) panel.classList.add('open');
}

function selectFare(card, fareName, price, flightNum, dep, arr, stopsText){
  document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');

  saveState({
    selectedFare: {
      name: fareName,
      price: parseInt(price, 10),
      flight: flightNum,
      depart: dep,
      arrive: arr,
      stops: stopsText || 'Direct'
    },
    extrasSelected: [],
    extrasTotal: 0,
    selectedSeat: null,
    confirmation: null
  });
  go('../booking-step-1/');
}

// ----------------------------
// Sorting
// ----------------------------
function setSort(btn, type){
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  saveState({ currentSort: type });
  sortFlightCards(type);
}
function sortFlightCards(type) {
  var listWrap = document.querySelector('#page-results .results-body > div:nth-child(2)');
  if (!listWrap) return;
  var sortBar = listWrap.querySelector('.sort-bar');
  var cards   = Array.from(listWrap.querySelectorAll('.flight-card'));
  if (!cards.length) return;

  function getMetrics(card) {
    var times = card.querySelectorAll('.flight-card-main .flight-time');
    var dep   = times[0] ? parseTimeToMinutes(times[0].textContent.trim()) : 0;
    var arr   = times[1] ? parseTimeToMinutes(times[1].textContent.trim()) : 0;
    var durEl = card.querySelector('.flight-duration');
    var dur   = durEl ? parseDurationToMinutes(durEl.textContent.trim()) : 0;
    var priceEls = card.querySelectorAll('.option-price-amount');
    var minPrice = Infinity;
    priceEls.forEach(function(p) { var v = parseMoney(p.textContent); if (!isNaN(v)) minPrice = Math.min(minPrice, v); });
    if (!isFinite(minPrice)) minPrice = 0;
    return { dep: dep, arr: arr, dur: dur, price: minPrice };
  }

  var metricsMap = new Map(cards.map(function(c) { return [c, getMetrics(c)]; }));
  var keyMap = { price: 'price', duration: 'dur', depart: 'dep', arrive: 'arr' };
  var key    = keyMap[type] || 'price';

  cards.sort(function(a, b) {
    var ma = metricsMap.get(a), mb = metricsMap.get(b);
    if (ma[key] !== mb[key]) return ma[key] - mb[key];
    return ma.price - mb.price;
  });

  document.querySelectorAll('.flight-options-panel').forEach(function(p) { p.classList.remove('open'); });
  cards.forEach(function(c) { listWrap.appendChild(c); });
  if (sortBar) listWrap.insertBefore(sortBar, listWrap.firstChild);
}


function parseMoney(text) {
  var m = String(text).replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : NaN;
}
function parseDurationToMinutes(text) {
  var h = (text.match(/(\d+)\s*h/i) || [])[1];
  var m = (text.match(/(\d+)\s*m/i)  || [])[1];
  return (h ? parseInt(h, 10) : 0) * 60 + (m ? parseInt(m, 10) : 0);
}
function parseTimeToMinutes(text) {
  var nextDay = /\+\s*1/.test(text);
  var t       = text.replace(/\+\s*1/g, '').trim().split(':');
  if (t.length < 2) return 0;
  return parseInt(t[0], 10) * 60 + parseInt(t[1], 10) + (nextDay ? 24 * 60 : 0);
}




// ----------------------------
// Results page (MPA)
// ----------------------------
function ensureDefaultDates(){
  const s = loadState();
  if (s.searchDepart && s.searchReturn) return;
  const today = new Date();
  const dep = new Date(today); dep.setDate(dep.getDate() + 30);
  const ret = new Date(dep); ret.setDate(ret.getDate() + 7);
  const fmt = d => d.toISOString().split('T')[0];
  saveState({ searchDepart: s.searchDepart || fmt(dep), searchReturn: s.searchReturn || fmt(ret) });
}

function updateResultsPage(){
  const s = loadState();
  const dest = s.selectedDest || 'Tokyo';
  const info = destInfo[dest] || { code: dest.substring(0,3).toUpperCase(), city: dest };

  // Allow user overrides from results form (if present)
  const rTo = document.getElementById('r-to');
  const rDep = document.getElementById('r-depart');
  const rRet = document.getElementById('r-return');

  const destFromUI = rTo?.value || dest;
  const depart = rDep?.value || s.searchDepart;
  const ret = rRet?.value || s.searchReturn;

  saveState({ selectedDest: destFromUI, searchDepart: depart, searchReturn: ret });

  const effectiveInfo = destInfo[destFromUI] || { code: destFromUI.substring(0,3).toUpperCase(), city: destFromUI };

  // Header
  const titleEl = document.getElementById('resultsTitle');
  if (titleEl){
    titleEl.textContent = 'Singapore → ' + destFromUI;
    titleEl.dataset.sku = 'SIN-' + effectiveInfo.code;
  }

  // Subtitle uses stored pax/cabin
  const pax = s.pax || { adults: 1, children: 0 };
  const cabin = s.cabinClass || 'Economy';

  let dateStr = 'Mon, 14 Jul 2025';
  try{
    if (depart){
      dateStr = new Date(depart).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch(e) {}

  const subEl = document.getElementById('resultsSub');
  if (subEl){
    subEl.textContent = dateStr + ' · ' + (pax.adults||1) + ' Adult' + ((pax.adults||1)>1 ? 's' : '') + ' · ' + cabin + ' · 24 results';
  }

  // Make sure the dropdown shows the selected destination
  if (rTo){
    const exists = Array.from(rTo.options).some(o => o.value === destFromUI);
    if (!exists){
      rTo.innerHTML = '<option value="' + destFromUI + '">' + destFromUI + '</option>';
    }
    rTo.value = destFromUI;
  }

  // Render flight cards
  renderFlightCards(destFromUI, effectiveInfo);

  // Apply sort
  try { sortFlightCards(loadState().currentSort || 'price'); } catch(e) {}
}

function initResultsPage(){
  ensureDefaultDates();
  const s = loadState();

  // Populate date fields
  const rDep = document.getElementById('r-depart');
  const rRet = document.getElementById('r-return');
  if (rDep && s.searchDepart) rDep.value = s.searchDepart;
  if (rRet && s.searchReturn) rRet.value = s.searchReturn;

  // Populate destination dropdown
  const rTo = document.getElementById('r-to');
  if (rTo){
    const dest = s.selectedDest || 'Tokyo';
    const exists = Array.from(rTo.options).some(o => o.value === dest);
    if (!exists){
      rTo.innerHTML = '<option value="' + dest + '">' + dest + '</option>';
    }
    rTo.value = dest;
  }

  
  // Set active sort button
  const sort = s.currentSort || 'price';
  const btns = Array.from(document.querySelectorAll('.sort-btn'));
  btns.forEach(b => b.classList.remove('active'));
  const map = { price: 'Best Price', duration: 'Duration', depart: 'Departure', arrive: 'Arrival' };
  const label = map[sort];
  const match = btns.find(b => (b.textContent||'').trim() === label);
  if (match) match.classList.add('active');

  updateResultsPage();
}

function refreshResults(){
  // called by Update Search button
  updateResultsPage();
}

// ----------------------------
// Booking pages (steps)
// ----------------------------
function setStepIndicators(step){
  for (let j=1;j<=4;j++){
    const ind = document.getElementById('step'+j+'-indicator');
    if (!ind) continue;
    ind.className = 'step';
    if (j < step) ind.classList.add('completed');
    if (j === step) ind.classList.add('active');
  }
  for (let k=1;k<=3;k++){
    const line = document.getElementById('line-'+k+'-'+(k+1));
    if (line) line.className = k < step ? 'step-line active' : 'step-line';
  }
}

function updateSummary(){
  const s = loadState();
  const paxCount = (s.pax.adults||1) + (s.pax.children||0);
  const base = (s.selectedFare.price||0) * paxCount;
  const tax = Math.round(base * 0.13);
  const extras = s.extrasTotal || 0;
  const total = base + tax + extras;

  const lbl = document.getElementById('sum-base-label');
  if (lbl){
    const a = s.pax.adults||1, c = s.pax.children||0;
    lbl.textContent = 'Base fare (' + a + ' adult' + (a>1?'s':'') + (c>0? ', ' + c + ' child' + (c>1?'ren':'') : '') + ')';
  }

  const setText = (id,val) => { const el=document.getElementById(id); if(el) el.textContent=val; };
  setText('sum-base', 'SGD ' + base.toLocaleString());
  setText('sum-tax', 'SGD ' + tax.toLocaleString());

  const extrasRow = document.getElementById('sum-extras-row');
  const extrasEl = document.getElementById('sum-extras');
  if (extrasRow && extrasEl){
    extrasRow.style.display = extras>0 ? '' : 'none';
    extrasEl.textContent = 'SGD ' + extras.toLocaleString();
  }

  saveState({ totalPrice: total });
  setText('sum-total', 'SGD ' + total.toLocaleString());
}

function updateBookingHeader(){
  const s = loadState();
  const dest = s.selectedDest || 'Tokyo';
  const info = destInfo[dest] || { code: dest.substring(0,3).toUpperCase(), city: dest };

  const header = document.getElementById('bookingFlightInfo');
  if (header){
    header.textContent = 'AuraAir ' + s.selectedFare.flight + ' · Singapore → ' + dest + ' · ' + s.selectedFare.name;
  }

  const routeEl = document.getElementById('sum-route');
  if (routeEl){
    routeEl.textContent = 'SIN → ' + info.code;
    routeEl.dataset.sku = 'SIN-' + info.code;
  }

  const setText = (id,val)=>{ const el=document.getElementById(id); if(el) el.textContent=val; };
  setText('sum-flight', 'AuraAir ' + s.selectedFare.flight);
  setText('sum-times', s.selectedFare.depart + ' → ' + s.selectedFare.arrive + ' · ' + (s.selectedFare.stops || 'Direct'));
  setText('sum-fare', s.selectedFare.name);

  updateSummary();
}

function nextStep(){
  const step = getBookingStep() || 1;
  if (step < 4) go(`../booking-step-${step+1}/`);
  else confirmBooking();
}

function prevStep(){
  const step = getBookingStep() || 1;
  if (step > 1) go(`../booking-step-${step-1}/`);
  else go('../flightsearch/');
}

function toggleAnc(card){
  card.classList.toggle('selected');
  const cb = card.querySelector('input[type="checkbox"]');
  if (cb) cb.checked = card.classList.contains('selected');
  recalcExtras();
}

function recalcExtras(){
  const s = loadState();
  const paxCount = (s.pax.adults||1) + (s.pax.children||0);
  const selectedCards = Array.from(document.querySelectorAll('.anc-card.selected'));
  let total = 0;
  const ids = [];

  selectedCards.forEach(card => {
    const id = card.dataset.ancId;
    if (id) ids.push(id);
    const priceEl = card.querySelector('.anc-price');
    if (!priceEl) return;
    const t = priceEl.textContent.trim();
    if (/included/i.test(t)) return;
    const num = (t.replace(/,/g,'').match(/(\d+)/) || [])[1];
    if (!num) return;
    const amount = parseInt(num,10);
    const lower = t.toLowerCase();
    const mult = (lower.includes('/ person') || lower.includes('/person')) ? paxCount : 1;
    total += amount * mult;
  });

  saveState({ extrasSelected: ids, extrasTotal: total });
  updateSummary();
}

function applyExtrasFromState(){
  const s = loadState();
  const set = new Set(s.extrasSelected || []);
  document.querySelectorAll('.anc-card').forEach(card => {
    const id = card.dataset.ancId;
    const on = id && set.has(id);
    card.classList.toggle('selected', !!on);
    const cb = card.querySelector('input[type="checkbox"]');
    if (cb) cb.checked = !!on;
  });
  recalcExtras();
}

// ----------------------------
// Seat map
// ----------------------------
function initSeatMap() {
  var map = document.getElementById('seatMap');
  if (!map || map.children.length > 0) return;
  var cols     = ['A', 'B', 'C', '', 'D', 'E', 'F'];
  var occupied = new Set();
  for (var i = 0; i < 30; i++) {
    var r = Math.floor(Math.random() * 18) + 10;
    var c = ['A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 6)];
    occupied.add(r + c);
  }
  var exitRows = new Set([20, 21]);
  for (var row = 10; row <= 28; row++) {
    var rowEl = document.createElement('div');
    rowEl.className = 'seat-row';
    var numEl = document.createElement('div');
    numEl.className   = 'seat-row-num';
    numEl.textContent = row;
    rowEl.appendChild(numEl);
    cols.forEach(function(col) {
      if (col === '') {
        var aisle = document.createElement('div');
        aisle.className = 'seat-aisle';
        rowEl.appendChild(aisle);
        return;
      }
      var seatId = row + col;
      var seat   = document.createElement('div');
      seat.className   = 'seat';
      seat.textContent = col;
      if (occupied.has(seatId)) {
        seat.classList.add('occupied');
      } else if (exitRows.has(row)) {
        seat.classList.add('exit');
        (function(s, sid) { s.onclick = function() { selectSeat(s, sid, 'exit'); }; }(seat, seatId));
      } else {
        seat.classList.add('available');
        (function(s, sid) { s.onclick = function() { selectSeat(s, sid, 'standard'); }; }(seat, seatId));
      }
      rowEl.appendChild(seat);
    });
    map.appendChild(rowEl);
  }
}



function selectSeat(el, seatId, type){
  // Fix: ensure the forEach callback is properly closed.
  document.querySelectorAll('.seat.selected').forEach(function(s) {
    s.classList.remove('selected');
    s.classList.add(s.dataset.orig || 'available');
  });

  el.dataset.orig = (type === 'exit') ? 'exit' : 'available';
  el.classList.remove('available', 'exit');
  el.classList.add('selected');

  saveState({ selectedSeat: seatId });

  const disp = document.getElementById('selectedSeatDisplay');
  const typ  = document.getElementById('selectedSeatType');
  const exit = document.getElementById('exitFeature');
  if (disp) disp.textContent = seatId;
  if (typ) typ.textContent = (type === 'exit') ? 'Exit Row Seat' : 'Standard Economy';
  if (exit) exit.style.display = (type === 'exit') ? 'block' : 'none';
}

// ----------------------------
// Payment
// ----------------------------
function selectPayment(el){
  document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
  el.classList.add('selected');
}

function formatCard(input){
  input.value = input.value.replace(/\D/g, '').substring(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

// ----------------------------
// Confirmation
// ----------------------------
function confirmBooking(){
  const s = loadState();
  const ref = 'AUR-' + Math.floor(100000 + Math.random() * 900000);
  const info = destInfo[s.selectedDest] || { code: (s.selectedDest||'TOK').substring(0,3).toUpperCase() };
  const conf = {
    ref,
    flight: s.selectedFare.flight,
    route: 'SIN → ' + info.code,
    date: '14 Jul 2025',
    cabin: s.selectedFare.name,
    seat: s.selectedSeat || '32A',
    total: 'SGD ' + (s.totalPrice || 0).toLocaleString()
  };
  saveState({ confirmation: conf });
  go('../confirmation/');
}

function initConfirmationPage(){
  const conf = loadState().confirmation;
  if (!conf) return;
  const set = (id,val)=>{ const el=document.getElementById(id); if (el) el.textContent = val; };
  set('confRef', conf.ref);
  set('confFlight', conf.flight);
  set('confRoute', conf.route);
  set('confDate', conf.date);
  set('confCabin', conf.cabin);
  set('confSeat', conf.seat);
  set('confTotal', conf.total);
}

// ----------------------------
// Scroll animations + default dates
// ----------------------------
function initScrollAnimations(){
  if (!('IntersectionObserver' in window)){
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

function initHomeDates(){
  const today = new Date();
  const dep = new Date(today); dep.setDate(dep.getDate() + 30);
  const ret = new Date(dep); ret.setDate(ret.getDate() + 7);
  const fmt = d => d.toISOString().split('T')[0];

  const depEl = document.getElementById('searchDepart');
  const retEl = document.getElementById('searchReturn');

  const s = loadState();
  if (depEl && !depEl.value) depEl.value = s.searchDepart || fmt(dep);
  if (retEl && !retEl.value) retEl.value = s.searchReturn || fmt(ret);

  saveState({ searchDepart: depEl?.value || s.searchDepart || fmt(dep), searchReturn: retEl?.value || s.searchReturn || fmt(ret) });
}

// ----------------------------
// Bootstrap per page
// ----------------------------
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  const page = getPage();

  if (page === 'home'){
    const s = loadState();
    const a = document.getElementById('adultCount');
    const c = document.getElementById('childCount');
    if (a) a.textContent = s.pax.adults;
    if (c) c.textContent = s.pax.children;

    const trip = s.tripType || 'return';
    const tabs = Array.from(document.querySelectorAll('.search-tab'));
    const tabMap = { return: 0, oneway: 1, multi: 2 };
    const idx = tabMap[trip] ?? 0;
    if (tabs[idx]) setTripType(trip, tabs[idx]);

    initHomeDates();
    initScrollAnimations();
  }

  if (page === 'results'){
    initResultsPage();
  }

  if (page === 'booking'){
    const step = getBookingStep() || 1;
    setStepIndicators(step);
    updateBookingHeader();
    if (step === 2) applyExtrasFromState();
    if (step === 3) initSeatMap();

    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) nextBtn.textContent = step < 4 ? 'Continue →' : 'Confirm & Pay';
  }

  if (page === 'confirmation'){
    initConfirmationPage();
  }
});

// Expose for inline onclick handlers
Object.assign(window, {
  setTripType, changePax, doSearch, quickSearch,
  toggleOptions, selectFare,
  setSort, sortFlightCards,
  refreshResults,
  nextStep, prevStep,
  toggleAnc, selectPayment, formatCard,
  selectSeat, confirmBooking
});
