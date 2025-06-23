# coral-studio

[//]: # (TODO: Fix npx)
[//]: # (# Running via npx &#40;recommended&#41;)

[//]: # (```bash)

[//]: # (npx @coral-protcol/coral-studio)

[//]: # (```)
## Running
1. After cloning the repo, cd into it.
2. Install dependencies with yarn, then start a dev server:
```bash
yarn install
yarn dev
```

You can then access coral studio at http://127.0.0.1:3000
## Building

```bash
yarn build
```

You can preview the production build with `yarn preview`.

## Running on Docker (not recommended)
```bash
docker run -p 3000:3000 ghcr.io/coral-protocol/coral-studio
```
