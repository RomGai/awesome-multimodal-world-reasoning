# Awesome Multimodal World Reasoning

<p align="center">
  <a href="https://romgai.github.io/awesome-multimodal-world-reasoning/">
    <img src="public/readme-hero.png" alt="From Language to World States — A Survey of World Models in Multimodal Reasoning" width="100%">
  </a>
</p>

<p align="center">
  An interactive, bilingual literature and evaluation index for world models in multimodal reasoning, simulation, planning, and control.
</p>

<p align="center">
  <a href="https://romgai.github.io/awesome-multimodal-world-reasoning/"><img src="https://img.shields.io/badge/Open-Live%20Portal-0A7F86?style=flat-square&amp;logo=githubpages&amp;logoColor=white" alt="Open the live portal"></a>
  <a href="https://awesome.re"><img src="https://awesome.re/badge.svg" alt="Awesome"></a>
</p>

This repository is the interactive companion to **A Survey of World Models in Multimodal Reasoning**. It currently indexes 345 Research Works and 176 Evaluation Resources with functional-role filtering, world-model types, keyword and year search, date sorting, bilingual summaries, structured resource details, pagination, and verified Paper, Code, Project, and Blog links when available.

## Contents

- [Live portal](#live-portal)
- [Organization](#organization)
- [Contributing](#contributing)
- [Citation](#citation)
- [License](#license)

## Live portal

The complete index is available at:

**https://romgai.github.io/awesome-multimodal-world-reasoning/**

The portal provides two connected views:

- **Research Works** — world-model methods grouped by their functional roles and technical type.
- **Evaluation Resources** — benchmarks, datasets, environments, simulators, metrics, and evaluation protocols organized by Evaluation Focus.

## Organization

### Primary roles

| Family | Meaning |
| --- | --- |
| TI | Temporal & Imaginative |
| SS | Structured State |
| AC | Action Coupled |

Research Works may receive multiple detailed roles across interactive or imagined rollout, generation or prediction, persistent memory, geometric, physical, causal and relational state, and VLA, robot, driving, navigation, or tool interfaces.

### World model types

- **Generative & Interactive** — produces observable or executable future world states.
- **Latent-Dynamics & Predictive-State** — learns predictive representations or transition states used for reasoning, planning, or control.
- **(M)LLM-Integrated** — places an LLM, MLLM, VLM, or VLA interface inside the world-model loop.

The types are intentionally non-exclusive when a paper implements more than one mechanism.

## Contributing

Corrections and additions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request. Proposed additions should include an official full-text source and evidence for the requested role or Evaluation Focus.

### Submit a portal-data pull request

1. **Fork the repository and create a focused branch.**

   ```bash
   git clone https://github.com/<your-username>/awesome-multimodal-world-reasoning.git
   cd awesome-multimodal-world-reasoning
   git checkout -b data/add-short-name
   ```

2. **Edit the source files for your change.** Do not edit `app/data/*.generated.json` by hand.

   | Change | Files to edit |
   | --- | --- |
   | Correct a Table 2 Research Work | `source-data/world_model_methods.csv`; use `data/portal-meta.json` for summaries or official link corrections |
   | Correct a Table 3 Evaluation Resource | `source-data/world_model_benchmarks.csv`; update `source-data/tab_world_model_benchmarks.tex` when its TI/SS/AC Evaluation Focus changes |
   | Add a Research Work beyond Table 2 | add its BibTeX record to `source-data/survey.bib`, add the Research entry to `data/curated-additions.json`, and add its bilingual summary and official links to `data/portal-meta.json` |
   | Add an Evaluation Resource beyond Table 3 | add its BibTeX record to `source-data/survey.bib`, add the Evaluation entry to `data/curated-additions.json`, and add official links to `data/portal-meta.json` when available |

   Do not append new, non-table works to the Table 2 or Table 3 source files. Research roles must use `TI-I`, `TI-G`, `TI-M`, `SS-G`, `SS-P`, `SS-C`, `SS-E`, `AC-V`, `AC-R`, `AC-D`, `AC-N`, or `AC-T`. Evaluation Focus accepts `TI`, `SS`, and `AC`. Multiple tags are allowed when supported by the full text.

3. **Include the required evidence and metadata.**

   - Link the official paper, long-form technical document, or official release page.
   - Base classifications and structured details on the full text, especially Method and Evaluation—not only the title or abstract.
   - Use only author- or institution-maintained Code and Project links, and use HTTPS URLs.
   - For a Research Work, provide a neutral English summary of 80–120 words and a Chinese summary of 140–220 Chinese characters. Do not add criticism or unsupported claims.
   - For an Evaluation Resource, provide `resourceType`, `target`, `scale`, `task`, and `dimensions` instead of a narrative summary.

4. **Regenerate and validate the portal.** Node.js 22 or newer is required.

   ```bash
   npm ci
   npm test
   ```

   `npm test` regenerates the front-end catalogs and checks identifiers, tags, summaries, links, pagination data, and the static build. Include the regenerated `app/data/*.generated.json` files in the pull request, but never edit them manually.

5. **Commit, push, and open the pull request.**

   ```bash
   git add source-data data app/data
   git commit -m "Add <work-or-resource-name>"
   git push -u origin data/add-short-name
   ```

   On GitHub, select **Compare & pull request**. In the description, state what changed, link the full-text source, cite the sections or pages supporting the tags and details, confirm link ownership, and report that `npm test` passes. Keep each pull request limited to one work, one resource, or one closely related correction whenever possible.

## Citation

Repository citation metadata is available in [CITATION.cff](CITATION.cff). Citation details for the survey paper will be added when its official publication page becomes available.

## License

The curated catalog, summaries, and documentation are licensed under [CC BY 4.0](LICENSE). Portal source code is licensed separately under the [MIT License](LICENSE-CODE).
