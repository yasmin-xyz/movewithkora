# Kora

Kora is an AI-powered class planning assistant for yoga instructors. Users can set a class length, skill level, and peak movement, and Kora generates a structured flow — warm-up, build, peak, counterposes, cool-down — with breath cues and modifications.

**Live app:** [movewithkora.com](https://movewithkora.com)

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Router
- Supabase (database + streaming Edge Function for generation)
- Google Gemini API (class plan generation)
- Vercel (hosting)

## Features

- AI-generated class plans, streamed in real time
- Save and revisit past classes, export as PDF, or share via a public link
- Searchable, filterable pose library with cue and modification reference
- Optional browser notification when a longer class finishes generating
- Landing page with scroll-reveal and lotus-bloom animations, routed separately from the planner tool

## What I Learned

- Migrating a Lovable-prototyped app into a repo I own and maintain by hand
- Structuring a multi-route React app (marketing layer + core tool)
- Supabase Edge Functions and streaming responses
- Working around a platform execution timeout by splitting one long AI generation into two chained requests that stream into the UI as a single continuous result
- Diagnosing a silent LLM fallback-model issue (a 503-triggered fallback was serving weaker results) by adding response-header instrumentation instead of guessing from an aggregated usage dashboard
- Writing and debugging custom SVG/CSS animations in React, including scroll-triggered reveal sequencing to avoid glitchy async image loading
- Auditing generated code for production issues (committed secrets, leftover branding, and a privacy policy that had drifted out of sync with the actual data flow)

## Origin

An earlier static HTML/CSS/JS concept version lives at [OLD-movewithkora]([url](https://github.com/yasmin-xyz/OLD-movewithkora)) — kept as a record of how the idea started.
