# TBO SmartStock AI — Hackathon Presentation Pitch Deck & Script

---

## ⏱️ Pitch Overview
- **Target Duration:** 2.5 – 3.0 Minutes
- **Live Demo Scenario:** Kolkata Holiday Peak (Dec 24 – Dec 31) under ₹1,00,000 Budget Cap
- **Key Highlight:** Real-time B2B Wholesale Arbitrage (₹95,200 procurement vs. MakeMyTrip ₹1,05,000 retail)

---

## 🎬 Step-by-Step Presentation Script

### Step 1: The Hook & Problem (30 Seconds)
> "Hello judges. TBO is a global B2B travel distribution giant. To capture peak holiday margins, TBO must **pre-buy hotel inventory in advance** before surges happen.
> 
> But manual procurement faces two massive risks:
> 1. **Over-buying:** Unsold rooms perish at check-in with a 100% financial loss.
> 2. **Under-buying:** Stockouts cause lost margin to competitors.
> 
> We built **TBO SmartStock AI** — an end-to-end intelligent inventory procurement engine powered by LightGBM Quantile ML, Newsvendor $Q^*$ sizing, and Mixed-Integer Linear Programming (MILP)."

---

### Step 2: The Live Scenario Setup (30 Seconds)
*(Action on screen: Set Location = Kolkata, Dates = Dec 24–31, Budget = ₹1,00,000, Model = P50 Balanced, then click "Optimize Procurement")*

> "Let's run a live procurement test case:
> - **Location:** Kolkata
> - **Travel Window:** Dec 24th to Dec 31st (Peak Christmas & New Year holiday rush)
> - **Capital Budget Cap:** ₹1,00,000
> - **Risk Stance:** Default P50 Balanced
> 
> We click **Optimize Procurement**."

---

### Step 3: The Result & The "MakeMyTrip" Comparison (45 Seconds)
*(Action on screen: Highlight The Park Kolkata Park Street card showing ₹95,200)*

> "Notice our top recommendation: **The Park Kolkata on Park Street**.
> - If an individual traveler goes to **MakeMyTrip right now**, this exact 7-night block is listed at retail for **₹1,05,000**.
> - But our engine procures via **Direct Hotel Extranet Partner Contracts** at the pre-negotiated wholesale rate of **₹95,200** (7 nights $\times$ ₹13,600/night).
> - Notice the capital discipline: buying 2 rooms would cost ₹1,90,400, breaching our capital limit. Our **PuLP Mixed-Integer Linear Programming (MILP)** solver automatically capped allocation to **exactly 1 room block**, staying strictly under our ₹1,00,000 budget while securing a guaranteed **~₹10,000–₹15,000 margin spread**."

---

### Step 4: Explainability & Risk Control (30 Seconds)
*(Action on screen: Click into the Reason Card / Risk Dial modal)*

> "We don't give the procurement manager a black box:
> 1. **TreeSHAP Reason Cards:** Break down exact feature impacts (e.g., +42% Christmas booking velocity, -18% lead-time cancellation buffer).
> 2. **Newsvendor Critical Fractile ($Q^*$):** Sizing inventory probabilistically across LightGBM quantiles (P10 conservative floor, P50 median, P90 surge).
> 3. **2,000-Run Monte Carlo Simulation:** Validates downside portfolio risk with a 95% Value-at-Risk (VaR) and a live 0–100 Risk Dial."

---

### Step 5: The Closing Punchline (15 Seconds)
> "With TBO SmartStock AI, TBO transforms volatile travel search demand into risk-hedged, mathematically optimized inventory assets — buying the right rooms, at the right wholesale rate, within budget.
> 
> Thank you, we are open to questions!"

---

## 🎯 Judge Q&A Rapid Response Cheat Sheet

| Question from Judges | Your Crisp Answer |
| :--- | :--- |
| **"Where did the ₹95,000 figure come from?"** | *"It is calculated as 7 nights $\times$ ₹13,600 wholesale contracted rate per night (\$160 converted at ₹85/USD) from the hotel's direct partner extranet agreement."* |
| **"Why did it only buy 1 room?"** | *"Because of our hard budget constraint of ₹1,00,000 in the MILP solver. Buying 2 rooms would cost ₹1,90,400 ($> ₹1,00,000$). The solver safely allocated 1 room block (₹95,200), keeping ₹4,800 as liquidity buffer."* |
| **"Who is TBO buying from?"** | *"TBO procures through **Direct Hotel Extranet Contracts** (e.g. Apeejay Surrendra Group for The Park) or through **Tier-1 B2B Bedbanks** (Hotelbeds, WebBeds) via API, incorporating supplier minimum batches and release cutoff terms."* |
| **"How is this different from a booking website?"** | *"MakeMyTrip sells at retail rack rates to consumers. TBO is a B2B travel wholesaler/bed-bank that pre-buys at discounted wholesale rates to resell to travel agents and corporates at higher margins."* |
| **"What machine learning is running?"** | *"LightGBM Quantile Regressors (P10, P50, P90) trained with Pinball Loss for demand, Platt-calibrated Logistic Regression for cancellation probability, and TreeSHAP for explainability."* |
