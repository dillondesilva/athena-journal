# Athena
> An AI journal that talks back to you. Designed for privacy and simplicity. Powered by local LMs.

Journalling is a healthy practice that can provide an outlet for expression, prompt self reflection and improve our overall human wellbeing. With AI language models running on edge devices (e.g. laptops), it is now possible to add another dimension to our journalling experiences whilst providing a privacy-focused experience.

Athena is a *journal that talks back to you*, helping you find recurring themes + cohesion in your journal entries over time. Whilst we only have a developer supported version for now, this doc outlines how to run Athena and contribute to it.

## Prerequisites

To build Athena, you must have `node`, `npm`, `rust`, `golang` and `llama.cpp` installed on your computer.

- **Recommended Rust Version:** 1.87.0
- **Recommended Go Version:** 1.24.3

## Build your own copy of Athena
Simply perform the following:

```bash
git clone git@github.com:dillondesilva/athena-journal.git
cd athena-journal/lm-journal
npm install
cd .. && ./build.sh
```

And that should (hopefully) be it!

## Getting started with development

To run this LM journal app, you need to complete a few things:

1. First, ensure you have llama.cpp installed. On Mac, this can be done via `brew install llama.cpp`.

2. Optional but recommended: Install `Beekeeper Studio` or any of your favourite sqlite DB viewers.

Then we need to run our backend:

```
cd backend
go run main.go
```

This will spin up our server, create a DB if necessary (`notes.db`) and also start up `llama-server` as a subprocess, with health-checks running concurrently as a coroutine. If you are running the backend for a while, it is normal for these checks to fail as the model is downloading.

To check the download progress/existence of a model, you can print the contents of `~/Library/Caches/llama.cpp` if you are on Mac.

To spin up the frontend, we can do the following:

```
cd lm-journal
npm install
npm run tauri dev
```

You'll find familiar React app components in `src`.

## Contributing guide

A quick browse of this repo will quickly reveal there is significant improvement required to bring Athena to a production-grade application that could work across several users reliably. **Your contributions are very much needed and appreciated!**

### How to Contribute

The best way to get started is to **create a GitHub issue** first. This helps coordinate efforts and avoid duplicate work.

1. **Fork the repository** and clone it locally
2. **Set up your development environment** following the instructions above
3. **Create a GitHub issue** describing what you'd like to work on
4. **Make your changes** and submit a pull request

Every contribution, no matter how small, helps make Athena better. Thank you for considering contributing! 