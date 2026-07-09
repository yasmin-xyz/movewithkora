# Kora

Kora is an AI-powered class planning assistant for fitness instructors. Users can set a class length, skill level, and peak movement, and Kora generates a structured flow — warm-up, build, peak, counterposes, cool-down — with breath cues and modifications.

**Live app:** [movewithkora.vercel.app](https://movewithkora.vercel.app)

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Router
- Supabase (database + streaming Edge Function for generation)
- Vercel (hosting)

## Features

- AI-generated class plans, streamed in real time
- Save and revisit past classes
- Landing page with scroll-reveal and lotus-bloom animations, routed separately from the planner tool

## What I Learned

- Migrating a Lovable-prototyped app into a repo I own and maintain by hand
- Structuring a multi-route React app (marketing layer + core tool)
- Supabase Edge Functions and streaming responses
- Writing and debugging custom SVG/CSS animations in React
- Auditing generated code for production issues (committed secrets, leftover branding)

## Origin

An earlier static HTML/CSS/JS concept version lives at [OLD-movewithkora]([url](https://github.com/yasmin-xyz/OLD-movewithkora)) — kept as a record of how the idea started.
