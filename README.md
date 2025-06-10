# How to run this code

To run this LM journal app, you need to complete a few things:

1. First, ensure you have llama.cpp installed. On Mac, this can be done via `brew install llama.cpp`. In production, we'll ship prebuilt llama.cpp binaries to go with our app in case users don't have it already

2. Ensure you have go and rust installed.

3. Optional but recommended: Install `Beekeeper Studio` or any of your favourite sqlite DB viewers.

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
