# Subshells in 3D

I made this because a picture of orbital shapes had me reading `1s² 2s² 2p²` wrong. The rows looked like shells, so the yellow dumbbells seemed to be shell 2, and `2s²` had nowhere to go. The rows are shapes, not shells. Shell 2 is a sphere and those dumbbells together.

A static page for reading electron configurations like `1s² 2s² 2p²`, live at [willmarl.github.io/subshell3d](https://willmarl.github.io/subshell3d/). The number is the shell, the letter is the shape, and the superscript is the electron count.

```bash
pnpm dev
pnpm build
```

`dist/` is frontend-only and can be published to GitHub Pages. Pushing to `main` runs that deploy.
