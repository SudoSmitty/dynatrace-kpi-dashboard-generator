// Workflow JavaScript Action — 30min BizEvents injector for Walmart KPI Demo
// Requirements:
//   - Workflow must run in Dynatrace Platform context (AutomationEngine)
//   - Uses integrated authentication (no token required)
// References: Dynatrace Business Events API v2 with platform-native fetch.

export default async function () {
  // ---------- Tunables (per 30-min run) ----------
  const HOURS_WINDOW       = 0.5;
  const CHUNK              = 500;

  // KPI 1: Store Operations
  const POS_MIN            = 800;
  const POS_MAX            = 1100;
  const FOOT_TRAFFIC_MIN   = 300;
  const FOOT_TRAFFIC_MAX   = 450;
  const INVENTORY_MIN      = 250;
  const INVENTORY_MAX      = 400;
  const STOCKOUT_MIN       = 25;
  const STOCKOUT_MAX       = 60;

  // KPI 2: E-commerce & Digital
  const ECOM_ORDER_MIN     = 300;
  const ECOM_ORDER_MAX     = 450;
  const CART_ABANDON_MIN   = 100;
  const CART_ABANDON_MAX   = 180;
  const ECOM_CHECKOUT_MIN  = 250;
  const ECOM_CHECKOUT_MAX  = 380;

  // KPI 3: Supply Chain & Fulfillment
  const SHIP_MIN           = 200;
  const SHIP_MAX            = 300;
  const DELIVERY_MIN       = 180;
  const DELIVERY_MAX       = 280;
  const ON_TIME_DELIVERY_RATE = 0.94;
  const PICKUP_MIN         = 150;
  const PICKUP_MAX         = 250;
  const DC_SHIP_MIN        = 80;
  const DC_SHIP_MAX        = 150;

  // KPI 4: Customer Experience
  const REVIEW_MIN         = 80;
  const REVIEW_MAX         = 150;
  const COMPLAINT_MIN      = 20;
  const COMPLAINT_MAX      = 50;
  const LOYALTY_MIN        = 30;
  const LOYALTY_MAX        = 70;
  const RETURN_MIN         = 60;
  const RETURN_MAX         = 130;

  // KPI 5: Pharmacy & Health
  const RX_MIN             = 120;
  const RX_MAX             = 200;
  const VACC_MIN           = 30;
  const VACC_MAX           = 60;

  // KPI 6: Workforce
  const SHIFT_MIN          = 100;
  const SHIFT_MAX          = 200;

  // ---------- Demo catalogs ----------
  const EVENT_PROVIDER = "walmart.event.provider";

  // Walmart store banners
  const BANNERS = ["Walmart Supercenter", "Walmart Neighborhood Market", "Sam's Club", "Walmart.com"];
  const BANNER_WEIGHTS = [0.55, 0.15, 0.18, 0.12];

  // Top US metros where Walmart operates (with real coordinates)
  const STORE_METROS = [
    { city: "Bentonville-AR",    state: "AR", region: "South Central", lat: 36.3729, lon: -94.2088 },
    { city: "Dallas-TX",         state: "TX", region: "South Central", lat: 32.7767, lon: -96.7970 },
    { city: "Houston-TX",        state: "TX", region: "South Central", lat: 29.7604, lon: -95.3698 },
    { city: "San-Antonio-TX",    state: "TX", region: "South Central", lat: 29.4241, lon: -98.4936 },
    { city: "Phoenix-AZ",        state: "AZ", region: "Southwest",     lat: 33.4484, lon: -112.0740 },
    { city: "Las-Vegas-NV",      state: "NV", region: "Southwest",     lat: 36.1699, lon: -115.1398 },
    { city: "Atlanta-GA",        state: "GA", region: "Southeast",     lat: 33.7490, lon: -84.3880 },
    { city: "Orlando-FL",        state: "FL", region: "Southeast",     lat: 28.5383, lon: -81.3792 },
    { city: "Miami-FL",          state: "FL", region: "Southeast",     lat: 25.7617, lon: -80.1918 },
    { city: "Charlotte-NC",      state: "NC", region: "Southeast",     lat: 35.2271, lon: -80.8431 },
    { city: "Nashville-TN",      state: "TN", region: "Southeast",     lat: 36.1627, lon: -86.7816 },
    { city: "Chicago-IL",        state: "IL", region: "Midwest",       lat: 41.8781, lon: -87.6298 },
    { city: "Indianapolis-IN",   state: "IN", region: "Midwest",       lat: 39.7684, lon: -86.1581 },
    { city: "Detroit-MI",        state: "MI", region: "Midwest",       lat: 42.3314, lon: -83.0458 },
    { city: "Minneapolis-MN",    state: "MN", region: "Midwest",       lat: 44.9778, lon: -93.2650 },
    { city: "St-Louis-MO",       state: "MO", region: "Midwest",       lat: 38.6270, lon: -90.1994 },
    { city: "Denver-CO",         state: "CO", region: "Mountain",      lat: 39.7392, lon: -104.9903 },
    { city: "Los-Angeles-CA",    state: "CA", region: "West",          lat: 34.0522, lon: -118.2437 },
    { city: "Seattle-WA",        state: "WA", region: "Northwest",     lat: 47.6062, lon: -122.3321 },
    { city: "Philadelphia-PA",   state: "PA", region: "Northeast",     lat: 39.9526, lon: -75.1652 },
    { city: "New-York-NY",       state: "NY", region: "Northeast",     lat: 40.7128, lon: -74.0060 },
    { city: "Boston-MA",         state: "MA", region: "Northeast",     lat: 42.3601, lon: -71.0589 }
  ];

  // Distribution centers (subset)
  const DC_LOCATIONS = [
    { dc_id: "DC-BENTONVILLE",   lat: 36.3729, lon: -94.2088 },
    { dc_id: "DC-DALLAS",        lat: 32.7767, lon: -96.7970 },
    { dc_id: "DC-ATLANTA",       lat: 33.7490, lon: -84.3880 },
    { dc_id: "DC-CHICAGO",       lat: 41.8781, lon: -87.6298 },
    { dc_id: "DC-LOS-ANGELES",   lat: 34.0522, lon: -118.2437 },
    { dc_id: "DC-PHILADELPHIA",  lat: 39.9526, lon: -75.1652 }
  ];

  // Product departments
  const DEPARTMENTS = ["Grocery", "General Merchandise", "Apparel", "Electronics", "Home & Garden", "Health & Beauty", "Pharmacy", "Auto Care"];
  const DEPT_WEIGHTS = [0.42, 0.15, 0.10, 0.08, 0.10, 0.07, 0.05, 0.03];

  // Payment methods
  const PAYMENT_METHODS = ["credit_card", "debit_card", "cash", "ebt", "walmart_pay", "gift_card", "buy_now_pay_later"];
  const PAYMENT_WEIGHTS = [0.32, 0.30, 0.12, 0.10, 0.10, 0.04, 0.02];

  // Online channels
  const CHANNELS = ["walmart.com_web", "walmart_app", "marketplace_seller", "third_party"];
  const CHANNEL_WEIGHTS = [0.40, 0.45, 0.10, 0.05];

  // Fulfillment methods
  const FULFILLMENT = ["ship_to_home", "store_pickup", "curbside_pickup", "express_delivery", "ship_to_store"];
  const FULFILL_WEIGHTS = [0.45, 0.18, 0.20, 0.10, 0.07];

  // Carriers
  const CARRIERS = ["Walmart-GoLocal", "FedEx", "UPS", "USPS", "DHL", "Walmart-Spark"];
  const CARRIER_WEIGHTS = [0.30, 0.20, 0.18, 0.15, 0.05, 0.12];

  // Complaint categories
  const COMPLAINT_CATS = ["product_quality", "out_of_stock", "checkout_wait", "delivery_delay", "wrong_item", "price_dispute", "associate_service"];
  const COMPLAINT_WEIGHTS = [0.18, 0.20, 0.15, 0.20, 0.10, 0.07, 0.10];

  // Return reasons
  const RETURN_REASONS = ["defective", "wrong_size", "no_longer_needed", "not_as_described", "damaged_in_transit", "better_price_elsewhere"];
  const RETURN_WEIGHTS = [0.25, 0.18, 0.22, 0.12, 0.13, 0.10];

  // Pharmacy services
  const RX_TYPES = ["new_prescription", "refill", "transfer_in", "specialty"];
  const RX_WEIGHTS = [0.30, 0.55, 0.10, 0.05];

  const VACCINE_TYPES = ["flu", "covid_booster", "shingles", "tdap", "pneumonia", "rsv"];
  const VACCINE_WEIGHTS = [0.45, 0.20, 0.12, 0.10, 0.08, 0.05];

  // Shift event types
  const SHIFT_EVENTS = ["clock_in", "clock_out", "break_start", "break_end"];
  const SHIFT_WEIGHTS = [0.30, 0.30, 0.20, 0.20];

  // Walmart+ membership tiers
  const MEMBERSHIP_TIERS = ["Walmart+", "Walmart+ with Paramount+", "Sams Club", "Sams Club Plus"];
  const TIER_WEIGHTS = [0.55, 0.20, 0.15, 0.10];

  // ---------- Helpers ----------
  function nowUtc() { return new Date(); }
  function toIso(d) { return new Date(d).toISOString(); }
  function clampFuture(ts, now, safetySeconds) {
    const maxAllowed = new Date(now.getTime() - (safetySeconds * 1000));
    return ts > maxAllowed ? maxAllowed : ts;
  }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randFloat(min, max) { return (Math.random() * (max - min)) + min; }
  function choose(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function chooseWeighted(options, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    const w = weights.map(v => v / (total || 1));
    const r = Math.random();
    let acc = 0;
    for (let i = 0; i < options.length; i++) {
      acc += w[i];
      if (r <= acc) return options[i];
    }
    return options[options.length - 1];
  }
  function distribute(start, end, count, jitter) {
    const spanMs = end.getTime() - start.getTime();
    const stepMs = Math.max(1, Math.floor(spanMs / Math.max(1, count)));
    const out = [];
    for (let i = 0; i < count; i++) {
      const base = new Date(start.getTime() + (i * stepMs));
      const jms = Math.floor(((Math.random() * 2 * jitter) - jitter) * stepMs);
      out.push(new Date(base.getTime() + jms));
    }
    return out;
  }
  function makeEvent(provider, etype, ts, extra, now) {
    const safeTs = clampFuture(ts, now, 30);
    const ev = { "event.provider": provider, "event.type": etype, "timestamp": toIso(safeTs) };
    if (extra && typeof extra === "object") Object.assign(ev, extra);
    return ev;
  }
  function countBy(arr, fn) {
    const m = {};
    for (let i = 0; i < arr.length; i++) {
      const k = fn(arr[i]);
      m[k] = (m[k] || 0) + 1;
    }
    return m;
  }
  function startPlus(dt, minutes) { return new Date(dt.getTime() + (minutes * 60000)); }
  function endMinus(dt, minutes) { return new Date(dt.getTime() - (minutes * 60000)); }
  function cryptoRandomId(len) {
    const hex = "abcdef0123456789";
    let out = "";
    for (let i = 0; i < len; i++) { out += hex[Math.floor(Math.random() * hex.length)]; }
    return out.toUpperCase();
  }
  function pickStore() { return choose(STORE_METROS); }

  // ---------- Generate events for the time window ----------
  const now = nowUtc();
  const start = new Date(now.getTime() - (HOURS_WINDOW * 3600000));
  const events = [];

  // =========================================================================
  // KPI 1: Store Operations — POS transactions, foot traffic, inventory
  // =========================================================================

  // POS transactions (in-store)
  const POS_COUNT = randInt(POS_MIN, POS_MAX);
  const posTimes = distribute(startPlus(start, 1), endMinus(now, 1), POS_COUNT, 0.05);
  for (let i = 0; i < posTimes.length; i++) {
    const ts = posTimes[i];
    const banner = chooseWeighted(["Walmart Supercenter", "Walmart Neighborhood Market", "Sam's Club"], [0.65, 0.18, 0.17]);
    const store = pickStore();
    const dept = chooseWeighted(DEPARTMENTS, DEPT_WEIGHTS);
    const items = randInt(1, 28);
    const basket = Number(randFloat(items * 1.5, items * 18.5).toFixed(2));

    events.push(makeEvent(EVENT_PROVIDER, "pos.transaction", ts, {
      "transaction_id": "TXN-" + cryptoRandomId(10),
      "store_id": "STR-" + String(randInt(1, 4500)).padStart(5, "0"),
      "banner": banner,
      "city": store.city,
      "state": store.state,
      "region": store.region,
      "department": dept,
      "items_count": items,
      "basket_value_usd": basket,
      "payment_method": chooseWeighted(PAYMENT_METHODS, PAYMENT_WEIGHTS),
      "register_id": "REG-" + randInt(1, 32),
      "checkout_type": choose(["self_checkout", "associate_lane", "scan_and_go"]),
      "geo.location.latitude": store.lat,
      "geo.location.longitude": store.lon
    }, now));
  }

  // Foot traffic counts (per-store snapshots)
  const FT_COUNT = randInt(FOOT_TRAFFIC_MIN, FOOT_TRAFFIC_MAX);
  const ftTimes = distribute(startPlus(start, 1), endMinus(now, 1), FT_COUNT, 0.05);
  for (let i = 0; i < ftTimes.length; i++) {
    const ts = ftTimes[i];
    const banner = chooseWeighted(["Walmart Supercenter", "Walmart Neighborhood Market", "Sam's Club"], [0.65, 0.20, 0.15]);
    const store = pickStore();
    const visitors = randInt(35, 320);
    const transactions = Math.floor(visitors * randFloat(0.18, 0.42));

    events.push(makeEvent(EVENT_PROVIDER, "store.foot.traffic", ts, {
      "store_id": "STR-" + String(randInt(1, 4500)).padStart(5, "0"),
      "banner": banner,
      "city": store.city,
      "state": store.state,
      "region": store.region,
      "visitors_count": visitors,
      "transactions_count": transactions,
      "conversion_percent": Number(((transactions / visitors) * 100).toFixed(1)),
      "geo.location.latitude": store.lat,
      "geo.location.longitude": store.lon
    }, now));
  }

  // Inventory updates
  const INV_COUNT = randInt(INVENTORY_MIN, INVENTORY_MAX);
  const invTimes = distribute(startPlus(start, 1), endMinus(now, 1), INV_COUNT, 0.05);
  for (let i = 0; i < invTimes.length; i++) {
    const ts = invTimes[i];
    const store = pickStore();
    events.push(makeEvent(EVENT_PROVIDER, "inventory.update", ts, {
      "store_id": "STR-" + String(randInt(1, 4500)).padStart(5, "0"),
      "city": store.city,
      "state": store.state,
      "region": store.region,
      "department": chooseWeighted(DEPARTMENTS, DEPT_WEIGHTS),
      "sku": "SKU-" + cryptoRandomId(8),
      "units_on_hand": randInt(0, 480),
      "reorder_point": randInt(10, 50),
      "weeks_of_supply": Number(randFloat(0.5, 8.5).toFixed(1))
    }, now));
  }

  // Stockouts
  const STOCK_COUNT = randInt(STOCKOUT_MIN, STOCKOUT_MAX);
  const stockTimes = distribute(startPlus(start, 2), endMinus(now, 2), STOCK_COUNT, 0.08);
  for (let i = 0; i < stockTimes.length; i++) {
    const ts = stockTimes[i];
    const store = pickStore();
    events.push(makeEvent(EVENT_PROVIDER, "inventory.stockout", ts, {
      "store_id": "STR-" + String(randInt(1, 4500)).padStart(5, "0"),
      "city": store.city,
      "state": store.state,
      "region": store.region,
      "department": chooseWeighted(DEPARTMENTS, DEPT_WEIGHTS),
      "sku": "SKU-" + cryptoRandomId(8),
      "lost_sales_estimate_usd": Number(randFloat(40, 1800).toFixed(2)),
      "duration_minutes": randInt(15, 720)
    }, now));
  }

  // =========================================================================
  // KPI 2: E-commerce & Digital — orders, cart abandonment, checkout
  // =========================================================================

  // Online orders placed
  const ECOM_COUNT = randInt(ECOM_ORDER_MIN, ECOM_ORDER_MAX);
  const ecomTimes = distribute(startPlus(start, 1), endMinus(now, 1), ECOM_COUNT, 0.05);
  for (let i = 0; i < ecomTimes.length; i++) {
    const ts = ecomTimes[i];
    const channel = chooseWeighted(CHANNELS, CHANNEL_WEIGHTS);
    const store = pickStore();
    const items = randInt(1, 18);
    const orderValue = Number(randFloat(items * 4.5, items * 32).toFixed(2));

    events.push(makeEvent(EVENT_PROVIDER, "ecom.order.placed", ts, {
      "order_id": "ORD-" + cryptoRandomId(10),
      "channel": channel,
      "city": store.city,
      "state": store.state,
      "region": store.region,
      "items_count": items,
      "order_value_usd": orderValue,
      "fulfillment_method": chooseWeighted(FULFILLMENT, FULFILL_WEIGHTS),
      "department": chooseWeighted(DEPARTMENTS, DEPT_WEIGHTS),
      "is_walmart_plus": Math.random() < 0.42,
      "is_marketplace": channel === "marketplace_seller"
    }, now));
  }

  // Cart abandonment
  const CART_COUNT = randInt(CART_ABANDON_MIN, CART_ABANDON_MAX);
  const cartTimes = distribute(startPlus(start, 1), endMinus(now, 1), CART_COUNT, 0.05);
  for (let i = 0; i < cartTimes.length; i++) {
    const ts = cartTimes[i];
    const channel = chooseWeighted(CHANNELS, CHANNEL_WEIGHTS);
    events.push(makeEvent(EVENT_PROVIDER, "ecom.cart.abandoned", ts, {
      "session_id": "SES-" + cryptoRandomId(10),
      "channel": channel,
      "items_in_cart": randInt(1, 12),
      "cart_value_usd": Number(randFloat(15, 380).toFixed(2)),
      "abandon_stage": choose(["product_page", "cart_review", "shipping", "payment"]),
      "device_type": choose(["mobile", "desktop", "tablet"])
    }, now));
  }

  // Checkout completed
  const CHK_COUNT = randInt(ECOM_CHECKOUT_MIN, ECOM_CHECKOUT_MAX);
  const chkTimes = distribute(startPlus(start, 2), endMinus(now, 1), CHK_COUNT, 0.05);
  for (let i = 0; i < chkTimes.length; i++) {
    const ts = chkTimes[i];
    events.push(makeEvent(EVENT_PROVIDER, "ecom.checkout.completed", ts, {
      "order_id": "ORD-" + cryptoRandomId(10),
      "channel": chooseWeighted(CHANNELS, CHANNEL_WEIGHTS),
      "checkout_duration_seconds": randInt(20, 240),
      "payment_method": chooseWeighted(PAYMENT_METHODS, PAYMENT_WEIGHTS),
      "order_value_usd": Number(randFloat(15, 420).toFixed(2)),
      "device_type": choose(["mobile", "desktop", "tablet"])
    }, now));
  }

  // =========================================================================
  // KPI 3: Supply Chain & Fulfillment
  // =========================================================================

  // Shipments
  const SHIP_COUNT = randInt(SHIP_MIN, SHIP_MAX);
  const shipTimes = distribute(startPlus(start, 1), endMinus(now, 1), SHIP_COUNT, 0.05);
  for (let i = 0; i < shipTimes.length; i++) {
    const ts = shipTimes[i];
    events.push(makeEvent(EVENT_PROVIDER, "fulfillment.shipped", ts, {
      "order_id": "ORD-" + cryptoRandomId(10),
      "carrier": chooseWeighted(CARRIERS, CARRIER_WEIGHTS),
      "fulfillment_method": chooseWeighted(FULFILLMENT, FULFILL_WEIGHTS),
      "expected_delivery_days": randInt(1, 5),
      "package_weight_lbs": Number(randFloat(0.5, 45).toFixed(1)),
      "region": choose(["South Central", "Southeast", "Midwest", "Northeast", "West", "Southwest", "Northwest", "Mountain"])
    }, now));
  }

  // Deliveries
  const DEL_COUNT = randInt(DELIVERY_MIN, DELIVERY_MAX);
  const delTimes = distribute(startPlus(start, 2), endMinus(now, 1), DEL_COUNT, 0.05);
  for (let i = 0; i < delTimes.length; i++) {
    const ts = delTimes[i];
    const onTime = Math.random() < ON_TIME_DELIVERY_RATE;
    events.push(makeEvent(EVENT_PROVIDER, "fulfillment.delivery", ts, {
      "order_id": "ORD-" + cryptoRandomId(10),
      "carrier": chooseWeighted(CARRIERS, CARRIER_WEIGHTS),
      "delivery_status": onTime ? "on_time" : "delayed",
      "delivery_days": onTime ? randInt(1, 4) : randInt(5, 9),
      "fulfillment_method": chooseWeighted(FULFILLMENT, FULFILL_WEIGHTS),
      "region": choose(["South Central", "Southeast", "Midwest", "Northeast", "West", "Southwest", "Northwest", "Mountain"])
    }, now));
  }

  // Pickup ready (curbside / store pickup)
  const PICK_COUNT = randInt(PICKUP_MIN, PICKUP_MAX);
  const pickTimes = distribute(startPlus(start, 1), endMinus(now, 1), PICK_COUNT, 0.05);
  for (let i = 0; i < pickTimes.length; i++) {
    const ts = pickTimes[i];
    const store = pickStore();
    events.push(makeEvent(EVENT_PROVIDER, "pickup.order.ready", ts, {
      "order_id": "ORD-" + cryptoRandomId(10),
      "store_id": "STR-" + String(randInt(1, 4500)).padStart(5, "0"),
      "city": store.city,
      "state": store.state,
      "region": store.region,
      "pickup_type": choose(["curbside_pickup", "store_pickup", "express_delivery"]),
      "prep_time_minutes": randInt(8, 65),
      "items_count": randInt(1, 22)
    }, now));
  }

  // DC outbound shipments (for map)
  const DC_COUNT = randInt(DC_SHIP_MIN, DC_SHIP_MAX);
  const dcTimes = distribute(startPlus(start, 1), endMinus(now, 1), DC_COUNT, 0.05);
  for (let i = 0; i < dcTimes.length; i++) {
    const ts = dcTimes[i];
    const dc = choose(DC_LOCATIONS);
    events.push(makeEvent(EVENT_PROVIDER, "dc.shipment.outbound", ts, {
      "shipment_id": "SHP-" + cryptoRandomId(10),
      "dc_id": dc.dc_id,
      "trucks_dispatched": randInt(1, 6),
      "pallets_count": randInt(20, 280),
      "destination_region": choose(["South Central", "Southeast", "Midwest", "Northeast", "West", "Southwest", "Northwest", "Mountain"]),
      "geo.location.latitude": dc.lat,
      "geo.location.longitude": dc.lon
    }, now));
  }

  // =========================================================================
  // KPI 4: Customer Experience
  // =========================================================================

  // Reviews / CSAT
  const REV_COUNT = randInt(REVIEW_MIN, REVIEW_MAX);
  const revTimes = distribute(startPlus(start, 1), endMinus(now, 1), REV_COUNT, 0.05);
  for (let i = 0; i < revTimes.length; i++) {
    const ts = revTimes[i];
    const rating = chooseWeighted([5, 4, 3, 2, 1], [0.55, 0.22, 0.10, 0.07, 0.06]);
    events.push(makeEvent(EVENT_PROVIDER, "customer.review", ts, {
      "review_id": "REV-" + cryptoRandomId(8),
      "banner": chooseWeighted(BANNERS, BANNER_WEIGHTS),
      "rating": rating,
      "csat_score": rating * 20,
      "department": chooseWeighted(DEPARTMENTS, DEPT_WEIGHTS),
      "channel": choose(["in_store_kiosk", "post_purchase_email", "app_prompt", "web_form"]),
      "is_walmart_plus": Math.random() < 0.45
    }, now));
  }

  // Complaints
  const CMP_COUNT = randInt(COMPLAINT_MIN, COMPLAINT_MAX);
  const cmpTimes = distribute(startPlus(start, 2), endMinus(now, 2), CMP_COUNT, 0.08);
  for (let i = 0; i < cmpTimes.length; i++) {
    const ts = cmpTimes[i];
    events.push(makeEvent(EVENT_PROVIDER, "customer.complaint", ts, {
      "complaint_id": "CMP-" + cryptoRandomId(8),
      "banner": chooseWeighted(BANNERS, BANNER_WEIGHTS),
      "category": chooseWeighted(COMPLAINT_CATS, COMPLAINT_WEIGHTS),
      "severity": choose(["low", "medium", "high"]),
      "channel": choose(["call_center", "store_front", "social_media", "email", "app"]),
      "resolution_time_minutes": randInt(5, 240)
    }, now));
  }

  // Loyalty signups (Walmart+)
  const LOY_COUNT = randInt(LOYALTY_MIN, LOYALTY_MAX);
  const loyTimes = distribute(startPlus(start, 1), endMinus(now, 1), LOY_COUNT, 0.05);
  for (let i = 0; i < loyTimes.length; i++) {
    const ts = loyTimes[i];
    events.push(makeEvent(EVENT_PROVIDER, "loyalty.signup", ts, {
      "member_id": "MEM-" + cryptoRandomId(10),
      "membership_tier": chooseWeighted(MEMBERSHIP_TIERS, TIER_WEIGHTS),
      "channel": choose(["walmart_app", "walmart.com_web", "in_store_kiosk", "associate_assist"]),
      "trial": Math.random() < 0.62,
      "annual_fee_usd": choose([0, 98, 110, 50, 100])
    }, now));
  }

  // Returns processed
  const RET_COUNT = randInt(RETURN_MIN, RETURN_MAX);
  const retTimes = distribute(startPlus(start, 1), endMinus(now, 1), RET_COUNT, 0.05);
  for (let i = 0; i < retTimes.length; i++) {
    const ts = retTimes[i];
    events.push(makeEvent(EVENT_PROVIDER, "return.processed", ts, {
      "return_id": "RET-" + cryptoRandomId(10),
      "banner": chooseWeighted(BANNERS, BANNER_WEIGHTS),
      "return_reason": chooseWeighted(RETURN_REASONS, RETURN_WEIGHTS),
      "return_value_usd": Number(randFloat(8, 320).toFixed(2)),
      "return_method": choose(["in_store", "ship_back", "carrier_pickup", "drop_off_kiosk"]),
      "department": chooseWeighted(DEPARTMENTS, DEPT_WEIGHTS)
    }, now));
  }

  // =========================================================================
  // KPI 5: Pharmacy & Health
  // =========================================================================

  const RX_COUNT = randInt(RX_MIN, RX_MAX);
  const rxTimes = distribute(startPlus(start, 1), endMinus(now, 1), RX_COUNT, 0.05);
  for (let i = 0; i < rxTimes.length; i++) {
    const ts = rxTimes[i];
    const store = pickStore();
    events.push(makeEvent(EVENT_PROVIDER, "pharmacy.prescription.filled", ts, {
      "rx_id": "RX-" + cryptoRandomId(10),
      "store_id": "STR-" + String(randInt(1, 4500)).padStart(5, "0"),
      "state": store.state,
      "region": store.region,
      "rx_type": chooseWeighted(RX_TYPES, RX_WEIGHTS),
      "wait_time_minutes": randInt(5, 45),
      "is_generic": Math.random() < 0.86,
      "copay_usd": Number(randFloat(0, 80).toFixed(2)),
      "is_4_dollar_program": Math.random() < 0.38
    }, now));
  }

  const VAC_COUNT = randInt(VACC_MIN, VACC_MAX);
  const vacTimes = distribute(startPlus(start, 1), endMinus(now, 1), VAC_COUNT, 0.05);
  for (let i = 0; i < vacTimes.length; i++) {
    const ts = vacTimes[i];
    const store = pickStore();
    events.push(makeEvent(EVENT_PROVIDER, "pharmacy.vaccination", ts, {
      "vaccination_id": "VAC-" + cryptoRandomId(8),
      "store_id": "STR-" + String(randInt(1, 4500)).padStart(5, "0"),
      "state": store.state,
      "region": store.region,
      "vaccine_type": chooseWeighted(VACCINE_TYPES, VACCINE_WEIGHTS),
      "scheduled": Math.random() < 0.72,
      "wait_time_minutes": randInt(2, 25)
    }, now));
  }

  // =========================================================================
  // KPI 6: Workforce / associate shift events
  // =========================================================================

  const SHF_COUNT = randInt(SHIFT_MIN, SHIFT_MAX);
  const shfTimes = distribute(startPlus(start, 1), endMinus(now, 1), SHF_COUNT, 0.05);
  for (let i = 0; i < shfTimes.length; i++) {
    const ts = shfTimes[i];
    const store = pickStore();
    events.push(makeEvent(EVENT_PROVIDER, "associate.shift.event", ts, {
      "associate_id": "ASC-" + cryptoRandomId(8),
      "store_id": "STR-" + String(randInt(1, 4500)).padStart(5, "0"),
      "banner": chooseWeighted(BANNERS, BANNER_WEIGHTS),
      "region": store.region,
      "shift_event": chooseWeighted(SHIFT_EVENTS, SHIFT_WEIGHTS),
      "department": chooseWeighted(DEPARTMENTS, DEPT_WEIGHTS),
      "shift_type": choose(["morning", "afternoon", "evening", "overnight"])
    }, now));
  }

  // ---------- Ingest (chunked, using integrated auth) ----------
  const totals = countBy(events, e => e["event.type"]);
  const batches = [];
  for (let i = 0; i < events.length; i += CHUNK) {
    const batch = events.slice(i, i + CHUNK);
    const res = await fetch("/platform/classic/environment-api/v2/bizevents/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch)
    });

    let text = "";
    try { text = await res.text(); } catch (e) {}

    if (!res.ok) {
      console.error(`BizEvents ingest failed for batch ${i}-${i + batch.length - 1}: HTTP ${res.status} ${text}`);
      throw new Error(`BizEvents ingest failed: HTTP ${res.status}`);
    }

    batches.push({ range: i + "-" + (i + batch.length - 1), status: res.status, bodyPreview: text.slice(0, 500) });
  }

  return {
    totals,
    batches,
    sample: events.slice(0, 3),
    meta: {
      totalEvents: events.length,
      windowHours: HOURS_WINDOW
    }
  };
}
