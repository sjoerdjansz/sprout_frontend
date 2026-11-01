# Sprout Frontend

This is the Vue frontend for Sprout, a learning app with enhanced capabilities due to AI integration.

## About

After reading multiple books and relevant literature I decided to create an application to assist my own learning.
It integrates different science based learning principles to optimize retention and to foster deeper understanding.

The application uses multiple methods, like flashcards, multiple choice, open questions, explain it (based on Feynman)
and chatting with an AI tutor to better understand a topic.

AI is used to generate relevant flashcards and questions from topics and information that you provide. It also scores
your answers on open ended questions and gives feedback.
Practicing is based around spaced repetition, interleaving and mastery scores per topic.

## Tech stack

Vue 3, TypeScript, Vite, Vue Router, Pinia, Tailwind CSS 4, and Vitest.

## Getting started

Everything runs on the host. You need Node `^22.18.0 || >=24.12.0` and the backend running on http://localhost:8001.

```sh
cp .env.example .env.local
npm install
npm run dev
```

Fill in this value in `.env.local`:

- `VITE_API_URL` the backend API, including the version prefix (default `http://localhost:8001/api/v1`)

The app runs on http://localhost:5173. The port is fixed, because the backend only allows the origins in its
`CORS_ALLOWED_ORIGINS`.

## Usage

You sign in without a password. Enter your email, then open the magic link from Mailpit on http://localhost:8025.

The backend seeder adds two test accounts:

- `ada@sprout.test` has three weeks of learning data, cards due today and a streak
- `sam@sprout.test` just signed up and has no data

## Tests

```sh
npm run test:unit -- --run
npm run type-check
npm run lint
```

Tests run in Vitest with jsdom and stub every API call.

## Project structure

- `src/views` are the pages, one per route in `src/router`. They compose components and connect them to stores.
- `src/components` are the building blocks. Shared `Base*` components on top, the rest grouped per feature.
- `src/stores` hold the state, one Pinia store per domain. They are the only place that calls the API.
- `src/composables` hold the logic of a screen, split per job, so views and components stay small.
- `src/lib` has the API client (`api.ts`) and the rules that don't need Vue, like ordering a practice session.
- `src/assets/main.css` mirrors the design tokens as a Tailwind `@theme`.

## Backend

GitHub repo: [sprout-backend](https://github.com/sjoerdjansz/sprout-backend).

## Status

Personal project (work in progress)
