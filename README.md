# Fable Together

Fable Together was designed around personalized storytelling, selectable narration voices, story discovery, and family-oriented voice experiences.

## Interactive Demo

This repository contains a self-contained reconstruction of the original product experience for portfolio use. Accounts and activity are fictional, voice cloning is simulated, narration uses browser speech, and translations are stored with the sample stories. Credits, quests, notifications, and community activity are demonstration state saved in the browser.

## Running Locally

Install the dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo Mode is the default and does not require API credentials.

## Verification

```bash
npm run test:demo
npx tsc --noEmit
npm run lint
npm run build
```

## Technical Overview

The showcase uses Next.js, React, and TypeScript. Its interactive state is stored locally in the browser, narration uses the Web Speech API, and story, voice, translation, and activity data come from bundled fixtures.

## Provenance

This is a sanitized reconstruction of the original private Fable Together project. It preserves the product's page and component structure while replacing production services with local demo behavior.
