# Contributing to Terrestrial

This page says what we take, where to send it, and the few rules that keep the repo easy to maintain.

## Types of Contributions

### Documentation

Typo fixes, clearer wording, better examples, and extra guides for [`README.md`](./README.md) are welcome, as long as the change stays small and keeps the current tone.

### Bug Reports

Found an inaccurate distance, an unexpected exception, a sorting mismatch, or a broken example? [Open an issue](https://github.com/NeaByteLab/Terrestrial/issues) with a small reproduction: the `TerrestrialParams` input (`origin`, `targets`, and `unit`) and the `TerrestrialResult[]` you expected next to the one you got.

### Proposals, Questions, and Feedback

Want a new option, an API change, or a design discussion? [Start a discussion](https://github.com/NeaByteLab/Terrestrial/discussions) instead of opening an issue, because issues are for defects we can fix and discussions are for ideas.

Start from a coordinate case that actually failed, since every new option is something every caller has to learn and the bar for adding one is high. If you are unsure, leave it out.

> **Not sure where to post?** Use Discussions, and if it turns out to be a real defect we will turn it into an issue.

### The Engine (`src/`)

It projects geographic coordinates into reduced-latitude algebraic chords, rectifies the WGS84 ellipsoidal arc via Alexandrian apothem-sagitta rational approximation, and sorts target locations by ascending distance without calling transcendental trigonometric functions (`Math.sin`, `Math.cos`, `Math.asin`, `Math.atan2`).

A refactor that keeps distance accuracy and makes the code easier to read is welcome, but altering polynomial coefficients or rectification stages needs a discussion first. If you claim accuracy or speed improved, include a benchmark against the WGS84 iterative reference across local, regional, and transcontinental pairs.

### Not Accepted Yet

While the engine is focused on single-pass geodesic calculation, these are out of scope:

- **Files and network**, because loading coordinate datasets is the caller's job.
- **Transcendental trig fallbacks or hybrid branches**, because the calculation path must remain a single unified algebraic pass.
- **Stateful spatial indexes**, because `Terrestrial.calculate` operates directly on the provided `TerrestrialParams`.
- **Large rewrites**, because we only take small, verifiable changes.

If you are not sure something fits, open a Discussion before writing the code.

## Development Setup

The engine and the tests run on Deno:

```bash
# Format, lint, and type-check the source
deno task check

# Run the tests
deno task test
```

The npm build uses [unbuild](https://github.com/unjs/unbuild):

```bash
npm install
npm run build
```

## Submitting Changes

1. Fork the repository.
2. Branch off `main`.
3. Make the change, then run `deno task check` and `deno task test`.
4. Open a pull request against `main`, and say what changed and why.

Keep each pull request to one change and link the related issue or discussion. If the change alters calculated distances or ordering, paste the `Terrestrial.calculate()` output before and after.

## AI-Assisted Contributions

Using an AI assistant to help with a contribution is fine if you say so in the pull request or the issue, and say roughly how you used it, for example: "An assistant drafted the sagitta rectification loop, then I reviewed it and verified the WGS84 error bounds."

This is enough:

> Parts of this PR were drafted with an AI assistant, then reviewed and edited by hand.

Typos, whitespace, and dead links do not need a disclosure.

Code that looks generated and is not disclosed is hard to review, and we may close it without merging.

### What Makes Review Easier

- Say if an assistant helped.
- Understand every line you changed, well enough to explain it.
- Say why the change is needed, in a few lines.
- Include coordinate pairs that show the new behaviour, or the bug it fixes.

## License

By contributing, you agree that your contributions are licensed under the [Apache License 2.0](./LICENSE).
