# TBO Intelligent Inventory Optimization - Agents Directives

## 1. Safety & VCS Rules
- **DO NOT PUSH OR COMMIT TO GIT**: Never run `git commit` or `git push` unless explicitly ordered by the user. You may run `git status`, `git diff`, and `git log`.
- **PRE-COMPLETION VERIFICATION**: Always test builds (e.g. `npm run build` in `client`) and linting before concluding any task.

---

## 2. Active Skills in Workspace

- **`ui-ux-pro-max`** ([.agents/skills/ui-ux-pro-max/SKILL.md](.agents/skills/ui-ux-pro-max/SKILL.md)):
  - Enforces elite visual fidelity, typography hierarchy, micro-interactions, and glassmorphism.
  - Required for all frontend components in `client/src/components/`.

---

## 3. Subsystem Architecture Reference

Refer to [GUIDE.md](GUIDE.md) for full architectural blueprints, mathematical equations, and execution steps:
- **`client/`**: React, Vite, Tailwind CSS, Framer Motion.
- **`server/`**: FastAPI, Pydantic, REST endpoints, CORS middleware.
- **`models/`**:
  1. LightGBM Quantile Regressors (P10, P50, P90) with Pinball Loss.
  2. Calibrated Logistic Regression for cancellation probability $P(\text{Cancel})$.
  3. Log-Log Price Sensitivity OLS Regression ($\epsilon_d$).
  4. Seasonal-Naive Baseline.
  5. Opportunity Scoring & Newsvendor Quantile Allocation ($Q^*$).
  6. PuLP MILP Budget Optimizer under hard capital caps ($B$).
  7. 2,000-run Monte Carlo Simulation Engine with VaR 95% & Risk Dial.
  8. TreeSHAP Feature Attribution Reason Cards.
