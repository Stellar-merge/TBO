# TBO Intelligent Inventory Optimization - Workspace Rules & Directives

## 1. Absolute Golden Rules (Zero Exceptions)
- **STRICT GIT POLICY**: DO NOT run `git push` or `git commit` under any circumstances unless the user explicitly commands it in plain text. You may inspect git status, logs, diffs, branches, and untracked files freely, but NEVER push or commit.
- **CODE MODIFICATION INTEGRITY**: All code edits and new files must be validated with build/type checks before completing a turn.

---

## 2. Workspace Architecture & Directory Roles

- **`client/` (Frontend Application)**:
  - Framework: React 18+ with TypeScript, Vite, Tailwind CSS, and Framer Motion.
  - Design Philosophy: Enterprise B2B FinTech / Revenue Management (Stripe, Linear, Duetto inspired).
  - Mandatory Design Skill: Always apply the guidelines in [ui-ux-pro-max](.agents/skills/ui-ux-pro-max/SKILL.md) for typography, micro-interactions, data density, color tokens, and elevation.
  - Key Screens:
    - *Overview Hero*: High-fidelity aesthetic replica with 3D rotating blue spiral wheel (`BlueSpiralWheel.tsx`), protruding metric cards, and connecting orbital curves.
    - *Procurement & MILP Optimizer*: Hard budget cap slider, Newsvendor $Q^*$ quantile sizing, interactive candidate data grid, and TreeSHAP Reason Cards.
    - *Monte Carlo Risk Engine*: 2,000-run simulation, Semicircular Risk Dial (0–100), 95% VaR, CVaR, and probability density curves.
    - *Monitor & Recover*: Real-time actual vs. P10–P90 quantile pacing, dynamic markdown clearance triggers, and Feature Store retraining feedback loops.

- **`server/` (Backend Service)**:
  - Framework: FastAPI, Pydantic v2, Uvicorn.
  - Endpoints: REST API for `/api/v1/optimize`, `/api/v1/simulate-risk`, `/api/v1/reasons/{id}`, and `/api/v1/pacing/{id}`.
  - Computation: Asynchronous offloading for MILP solver and Monte Carlo vectorization.

- **`models/` (Machine Learning & Optimization Engines)**:
  - *Demand Forecaster*: LightGBM Quantile Regression ($q \in \{0.10, 0.50, 0.90\}$) with Pinball Loss.
  - *Cancellation Risk*: Calibrated Logistic Regression (Platt scaling / Isotonic regression).
  - *Price Sensitivity*: Log-Log OLS regression ($\ln Q = \alpha + \beta \ln P$) extracting elasticity $\epsilon_d$.
  - *Baseline*: Seasonal-Naive heuristic for benchmarking.
  - *Feature Store*: Look-to-Book (L2B) ratios, censored/lost demand reconstruction, and cyclical calendar signals.
  - *Optimization Engine*: PuLP/SciPy MILP solver enforcing hard budget caps and supplier minimum batches.
  - *Explainability*: TreeSHAP attribution generating human-readable Reason Cards.

---

## 3. Skill Utilization Directives

Always activate and reference the appropriate workspace skills when operating on corresponding subsystems:

1. **Frontend & UI/UX Work**:
   - Activate: [.agents/skills/ui-ux-pro-max/SKILL.md](.agents/skills/ui-ux-pro-max/SKILL.md)
   - Scope: Any component design, styling, animation, typography, layout, or responsiveness in `client/`.
   - Standard: Ultra-polished, high contrast, smooth spring physics, micro-interactions, and high data density.

2. **ML & Optimization Work**:
   - Follow: [GUIDE.md](GUIDE.md) Section 3.3 & 3.4
   - Scope: Loss functions, quantile interpolation, Newsvendor critical fractiles ($CF = \frac{C_u}{C_u + C_o}$), MILP formulations, and Monte Carlo stochastic generation.

3. **Backend & API Work**:
   - Follow: [GUIDE.md](GUIDE.md) Section 4 & 6
   - Scope: FastAPI routes, Pydantic schemas, validation, and JSON contracts.
