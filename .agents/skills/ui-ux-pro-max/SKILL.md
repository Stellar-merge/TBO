---
name: ui-ux-pro-max
description: Elite UI/UX design and frontend development guidelines. Delivers ultra-polished, pixel-perfect, aesthetic-grade interfaces inspired by Stripe, Linear, Apple, and Mobbin with advanced animations, glassmorphism, micro-interactions, responsive typography, and accessibility.
---

# UI/UX Pro Max Skill

This skill enforces enterprise-grade, award-winning UI/UX standards for web applications and dashboards.

## Core Design Principles

1. **Aesthetic Excellence & Visual Hierarchy**
   - High visual contrast with intentional whitespace.
   - Distinct elevation levels: subtle borders (`border-slate-200/80` or `border-white/10`), dual drop-shadows, and smooth backdrop blurs.
   - Refined typography pairings (modern geometric display sans for headings, clean neutral sans for data tables and body).

2. **Micro-Interactions & Animation Choreography**
   - Entrance staging: Staggered reveal animations with smooth bezier curves (`cubic-bezier(0.16, 1, 0.3, 1)`).
   - Continuous ambient motion: Sub-hertz rotations or floating keyframes (`25s - 45s` duration) to keep interfaces feeling alive without distracting.
   - Responsive hover feedback: Smooth scaling (`scale-[1.02]`), subtle border glow transitions (`duration-200`).

3. **Data Density & B2B Ergonomics**
   - Compact table views with inline status chips, sparklines, and range indicators.
   - Color-coded semantic badges:
     - 🟢 Success / High Margin: Emerald / Mint
     - 🔵 Primary Brand / Information: Electric Blue / Cobalt / Indigo
     - 🟡 Warning / Moderate Risk: Amber / Warm Gold
     - 🔴 Critical / High Risk: Rose / Crimson

4. **Component Architecture**
   - Reusable, accessible components with keyboard navigation support and ARIA semantics.
   - Fluid responsive breakpoints with sticky navigation and contextual drawers/modals.
