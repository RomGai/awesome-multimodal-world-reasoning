# Contributing

Thank you for helping improve Awesome Multimodal World Reasoning. Corrections, verified links, and carefully supported additions are welcome.

## Before proposing an entry

A Research Work should introduce or operationally use a world state, transition model, imagined rollout, structured state, or action-coupled world-model interface. An Evaluation Resource should provide a reproducible benchmark, dataset, environment, simulator, metric, or protocol that evaluates temporal/imaginative, structured-state, or action-coupled capabilities.

Please provide:

- the official paper, technical report, system card, or long-form release page;
- the official Code and Project links, when available;
- the requested functional roles, world-model types, or Evaluation Focus;
- a short explanation grounded in the Method and Evaluation sections of the source.

Do not submit links to unofficial mirrors, repository aggregators, or third-party implementations as the primary Code or Project link.

## Data changes

- Table-derived records are stored in `source-data/`.
- Additional Research and Evaluation entries are stored in `data/curated-additions.json`.
- Bilingual summaries and official link overrides are stored in `data/portal-meta.json`.
- Use the first publicly accessible month for chronology: arXiv v1 when available, otherwise the earliest official release or formal publication. Keep the venue label separate from this date.
- Files under `app/data/*.generated.json` are generated and should not be edited manually.

After making a change, run:

```bash
npm test
```

## Pull requests

Keep each pull request focused. Describe the source reviewed, the reason for the classification or correction, and any link ownership checks performed. New Research summaries should remain neutral and factual and should not include offensive language, limitations, or unsupported claims.
