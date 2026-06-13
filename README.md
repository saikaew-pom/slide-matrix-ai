# SlideMatrixAI App

This is the Next.js application for SlideMatrixAI.

SlideMatrixAI turns messy business notes, data, screenshots, PDFs, CSVs, and text files into persuasive presentation blueprints for business reports, sales decks, and startup pitches.

## Project Context

The product, logic, and design source files live one level above this app folder:

- `../docs/slidematrixai-launch-plan.md`
- `../docs/slidematrixai-core-knowledge.md`
- `../presentation_engine_spec_v2.md`
- `../SlideMatrixAI.dc.html`

Use those files as the source of truth before implementing product features.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase
- Vercel
- Cloudinary
- MiniMax API
- Stripe

## Getting Started

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Initial Product Direction

V1 should focus on:

- One guided workflow.
- Three output engines: report, sales, pitch.
- Upload support for PDF, CSV, TXT, PNG, and JPG.
- MiniMax-powered blueprint generation.
- Editable slide-by-slide cards.
- Markdown export before PPTX or Google Slides export.

