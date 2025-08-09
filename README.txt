Forest Platformer — Ready-to-upload package
==========================================

Contents (root of ZIP):
- package.json, main.js, preload.js
- web/ (index.html, game.js, assets/)
- build/ (icon.png placeholder)
- .github/workflows/build.yml  (CI workflow to produce Windows .exe)

How to use:
1. Create a new GitHub repo (public recommended).
2. Extract all files from this ZIP and upload them to the repo root via drag-and-drop.
3. Commit to main. GitHub Actions will run the workflow and build the Windows .exe.
4. When the action finishes, open Actions -> latest run -> Artifacts -> download windows-build.

Local testing:
- Install Node.js (16+ or 20 recommended).
- In the extracted folder: run `npm install` then `npm start` to run the Electron app locally.

Controls:
- Move: A/D or Left/Right arrows
- Jump: W or Space (double-jump supported)
- Keyboard only. Click canvas once to allow audio and fullscreen.

