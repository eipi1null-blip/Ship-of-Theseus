# Ship of Theseus

A static GitHub Pages applet for exploring the Ship of Theseus thought experiment.

## Features

- Year slider from 0 to 1000.
- Ship A shows a continuously repaired ship with replacement planks.
- Ship A's hull gradually changes color as the replacement history accumulates.
- Ship B builds up from recovered original planks, with each year adding one visible hull piece.
- A single visible old wooden plank leaves Ship A while a new plank slides into the same place.
- Ship B is hidden at year 0 and is physically assembled as recovered planks are used to build it.
- Animated play and reset controls.
- Identity perspective buttons for material continuity, continuous history, and the open philosophical question.

## Deploy on GitHub Pages

1. Create a GitHub repository.
2. Add `index.html`, `styles.css`, `script.js`, and `README.md` to the repository root.
3. Open **Settings > Pages**.
4. Set **Source** to **Deploy from a branch**, choose `main`, and choose `/root`.
5. Save. GitHub will publish the applet at the Pages URL shown there.

No build step or package installation is required.
