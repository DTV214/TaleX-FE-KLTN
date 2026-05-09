# TaleX - Frontend App

TaleX is a frontend web client for a short comic/video animation platform. This repository contains the Next.js application for the TaleX client.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Shadcn UI style components
- Zustand
- TanStack Query
- Lucide React

## Project Structure

The project follows a Feature-Sliced Design direction:

- `src/app/`: routing, layouts, and page entry points only.
- `src/features/`: feature-owned UI, hooks, and API logic.
- `src/shared/`: reusable UI, helpers, and shared library configuration.
- `src/core/`: core application logic such as auth and global stores.

Avoid deep imports between features. Each feature should expose its public API through an `index.ts` file.

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
