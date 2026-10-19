# Pulse · MSU Nursing Study

Practice quizzes and full-length practice exams for Missouri State nursing students, built from each course's exam blueprint.

- **Study-guide reviews** (where a class supplies study guides): a readable page per section with tap-to-reveal recall questions, read before the section quiz.
- **Section quizzes** for every blueprint topic, with a rationale for every answer choice shown right after you answer.
- **Practice exams** that match the blueprint's format (length, time limit, alternate-format and dosage-calc counts). Rationales appear on the results screen.
- Progress, scores and in-progress exams are saved in the browser (localStorage). No accounts yet.

Built with Vue 3, Vite and Tailwind CSS 4. It's a static site with no backend.

## Run it

```bash
npm install
npm run dev       # local dev server
npm run build     # validates the question banks, then builds to dist/
```

## Deploy on Vercel

Import the repo in Vercel. The defaults are correct (framework: Vite, build: `npm run build`, output: `dist`). `vercel.json` sends every route to `index.html` so deep links work.

## Adding an exam

Each exam is a folder in `src/data/exams/<exam-id>/`:

```
exam.json          # course, title, format (questions, minutes, alt-format, dosage calc),
                   # topic list with blueprint counts, practice exam distribution, Bloom levels, objectives
topics/<slug>.json # one question bank per topic (plus an optional study-guide review)
```

A class's URL comes from its course code (`NUR 312` → `/nur312`); set `"courseId"` in exam.json when the class has no code yet (Gerontologic Nursing uses `/gero`).

The question format is documented in [QUESTION_SCHEMA.md](QUESTION_SCHEMA.md). `npm run validate` checks every bank and confirms the practice exams can be built without reusing a question. A new folder shows up on the home page automatically.

## Accounts (optional)

Students can sign in with Google or an emailed link so their progress follows them across devices. Without the settings below the site runs exactly as before, with progress saved in the browser only.

1. Create a Supabase project, then run [`supabase/schema.sql`](supabase/schema.sql) in its SQL Editor.
2. In Authentication → URL Configuration, set the Site URL to the live site and add `https://pulse-nursing-study.vercel.app/**` and `http://localhost:5173/**` as redirect URLs.
3. Turn on the Google provider (Authentication → Providers) with a Google Cloud OAuth client. Email links work by default.
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel (and in `.env.local` for local dev, see `.env.example`), then redeploy.

Progress is still saved in the browser first. On sign-in, `src/lib/auth.js` merges the browser's progress with the account's copy (`src/lib/merge.js`) and saves the result to both; after that every change syncs a moment later. Signing out clears the browser's copy.
