# Pulse · MSU Nursing Study

Practice quizzes and full-length practice exams for Missouri State nursing students, built from each course's exam blueprint.

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
topics/<slug>.json # one question bank per topic
```

The question format is documented in [QUESTION_SCHEMA.md](QUESTION_SCHEMA.md). `npm run validate` checks every bank and confirms the practice exams can be built without reusing a question. A new folder shows up on the home page automatically.
