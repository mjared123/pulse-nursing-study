# Question bank format

Each topic is one JSON file at `src/data/exams/<exam-id>/topics/<slug>.json`:

```json
{
  "slug": "afib-aflutter",
  "title": "A-Flutter / A-Fib / Meds / ECG",
  "short": "A-Fib & A-Flutter",
  "icon": "heart-pulse",
  "description": "One sentence describing what this section covers.",
  "keyPoints": ["5-8 short high-yield bullet facts shown on the topic page"],
  "questions": [ ... ]
}
```

## Question types

All questions share: `id` (string, `<slug>-<nn>`, unique), `type`, `stem`, `bloom`
(one of `remember`, `understand`, `apply`, `analyze`, `evaluate`), `explanation`
(2-4 sentence teaching summary of the key concept), and optional `ecg`.

`ecg` (optional) shows a generated rhythm strip above the stem. Allowed values:
`nsr`, `sinus_tach`, `sinus_brady`, `svt`, `afib`, `aflutter`, `vtach`, `vfib`, `asystole`.
Only use it when the question asks the student to interpret the strip.

### single (one best answer, 4 options)
```json
{
  "id": "afib-aflutter-01",
  "type": "single",
  "bloom": "apply",
  "stem": "A client with new-onset atrial fibrillation ... Which action should the nurse take first?",
  "options": [
    { "id": "a", "text": "...", "correct": true,  "rationale": "Why this is right." },
    { "id": "b", "text": "...", "correct": false, "rationale": "Why this is wrong." },
    { "id": "c", "text": "...", "correct": false, "rationale": "..." },
    { "id": "d", "text": "...", "correct": false, "rationale": "..." }
  ],
  "explanation": "..."
}
```

### sata (select all that apply, 5-6 options, 2-4 correct)
Same shape as `single`, but the stem ends with "Select all that apply." and more than one option is `correct`.

### order (ordered response / drag to rank, 4-5 items)
`items` are listed in the CORRECT order; the app shuffles them.
```json
{
  "id": "chest-tubes-07", "type": "order", "bloom": "apply",
  "stem": "Place the nurse's actions in priority order.",
  "items": [ { "id": "a", "text": "..." }, { "id": "b", "text": "..." } ],
  "explanation": "Why this order, step by step."
}
```

### numeric (fill in the blank; dosage calculations)
```json
{
  "id": "dosage-calc-03", "type": "numeric", "bloom": "apply",
  "stem": "Heparin 18 units/kg/hr ... How many mL/hr? Round to the nearest tenth.",
  "answer": 16.2, "tolerance": 0.05, "unit": "mL/hr",
  "steps": ["Step 1 ...", "Step 2 ..."],
  "explanation": "..."
}
```

## Writing rules
- NCLEX-style stems (client, nurse; realistic vitals/labs/data), clinical-judgment focus: prioritization, recognizing cues, deterioration, teaching, safety, meds.
- Every option of single/sata gets its own rationale: why right or why wrong. Be specific, not "this is incorrect."
- Content must be accurate per current standard med-surg nursing references (Lewis, Hinkle/Brunner, ACLS/AHA). No trick questions built on obscure trivia.
- Vary which letter is correct. Avoid "all of the above".
- Bloom mix per topic roughly: remember 8%, understand 15%, apply 44%, analyze 25%, evaluate 8%.
- Plain ASCII JSON strings are fine; use unicode (°, ≥, µ) where natural. No HTML/markdown inside strings.
