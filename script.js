(function () {
  "use strict";

  const totalPlanks = 1000;
  const yearSlider = document.getElementById("yearSlider");
  const yearReadout = document.getElementById("yearReadout");
  const playButton = document.getElementById("playButton");
  const resetButton = document.getElementById("resetButton");
  const shipA = document.getElementById("shipA");
  const shipB = document.getElementById("shipB");
  const transferLayer = document.getElementById("transferLayer");
  const aOriginalText = document.getElementById("aOriginalText");
  const aReplacementText = document.getElementById("aReplacementText");
  const bOriginalText = document.getElementById("bOriginalText");
  const bMissingText = document.getElementById("bMissingText");
  const aOriginalBar = document.getElementById("aOriginalBar");
  const bOriginalBar = document.getElementById("bOriginalBar");
  const lensText = document.getElementById("lensText");
  const lensButtons = Array.from(document.querySelectorAll(".lens"));

  let year = 0;
  let playing = false;
  let lastTick = null;
  let activeLens = "history";

  function plankCounts() {
    const clamped = completedYears();
    return {
      aOriginal: totalPlanks - clamped,
      aReplacement: clamped,
      bOriginal: clamped,
      bMissing: totalPlanks - clamped
    };
  }

  function render() {
    const counts = plankCounts();
    yearReadout.textContent = String(completedYears());
    yearSlider.value = String(completedYears());
    aOriginalText.textContent = String(counts.aOriginal);
    aReplacementText.textContent = String(counts.aReplacement);
    bOriginalText.textContent = String(counts.bOriginal);
    bMissingText.textContent = String(counts.bMissing);
    aOriginalBar.style.width = `${(counts.aOriginal / totalPlanks) * 100}%`;
    bOriginalBar.style.width = `${(counts.bOriginal / totalPlanks) * 100}%`;
    renderShip(shipA, counts.aOriginal / totalPlanks, 1, "A");
    renderShip(shipB, counts.bOriginal / totalPlanks, (counts.bOriginal + replacementPhase()) / totalPlanks, "B");
    renderTransferPlank();
    renderLens();
  }

  function renderShip(svg, originalFraction, completion, label) {
    const visibleCompletion = clamp(completion, 0, 1);
    svg.replaceChildren();
    appendPath(svg, "water", "M 56 255 C 92 241, 126 270, 164 255 S 235 270, 275 255 S 346 270, 386 255 S 456 269, 492 255");
    if (label === "B" && visibleCompletion <= 0) {
      appendText(svg, "build-message", 260, 158, "Ship B has not been built yet");
      appendText(svg, "build-submessage", 260, 188, "Recovered original planks will appear here.");
      return;
    }
    if (label === "B") {
      renderShipBConstruction(svg, visibleCompletion);
      return;
    }
    appendEllipse(svg, "hull-shadow", 260, 270, 170 * Math.max(visibleCompletion, 0.18), 15);

    const group = createSvg("g");
    svg.appendChild(group);

    const hull = appendPath(group, "hull-base", "M 86 178 C 129 226, 177 247, 262 247 C 351 247, 414 224, 451 178 C 374 204, 173 204, 86 178 Z");
    hull.style.fill = rebuiltHullColor(1 - originalFraction);
    renderHullTexture(group);
    renderSwapMechanism(group);

    appendLine(group, "mast", 270, 74, 270, 205);
    appendPath(group, "sail", "M 278 82 C 351 104, 389 141, 398 194 C 350 179, 313 158, 278 82 Z");
    appendPath(group, "sail-line", "M 298 103 C 326 130, 350 158, 374 185");
    appendPath(group, "sail-line", "M 321 114 C 335 140, 354 166, 384 192");
    appendPath(group, "rope", "M 270 84 C 232 120, 202 162, 176 206");
    appendPath(group, "rope", "M 270 84 C 300 127, 327 164, 360 205");
    appendPath(group, "flag", "M 270 72 L 318 52 L 308 80 Z");
  }

  function renderShipBConstruction(svg, completion) {
    appendEllipse(svg, "hull-shadow", 260, 270, 170 * Math.max(completion, 0.18), 15);
    const group = createSvg("g");
    svg.appendChild(group);

    const finish = smoothstep(clamp((completion - 0.95) / 0.05, 0, 1));
    const constructionGroup = createSvg("g");
    constructionGroup.setAttribute("class", "ship-b-construction");
    constructionGroup.style.opacity = (1 - finish).toFixed(3);
    group.appendChild(constructionGroup);

    renderConstructionFrame(constructionGroup, completion);
    renderIndividualHullPlanks(constructionGroup, completedYears());
    renderAssemblyPlank(constructionGroup, completion);

    if (completion >= 0.54) {
      const mastGrow = clamp((completion - 0.54) / 0.16, 0, 1);
      appendLine(constructionGroup, "mast building-part", 270, 205 - 131 * mastGrow, 270, 205);
      appendPath(constructionGroup, "rope building-part", "M 270 84 C 232 120, 202 162, 176 206");
      appendPath(constructionGroup, "rope building-part", "M 270 84 C 300 127, 327 164, 360 205");
    }

    if (completion >= 0.72) {
      appendPath(constructionGroup, "sail building-part", "M 278 82 C 351 104, 389 141, 398 194 C 350 179, 313 158, 278 82 Z");
      appendPath(constructionGroup, "sail-line building-part", "M 298 103 C 326 130, 350 158, 374 185");
      appendPath(constructionGroup, "sail-line building-part", "M 321 114 C 335 140, 354 166, 384 192");
    }

    if (completion >= 0.92) {
      appendPath(constructionGroup, "flag building-part", "M 270 72 L 318 52 L 308 80 Z");
    }

    renderFinalShipBOverlay(group, finish);
  }

  function renderFinalShipBOverlay(group, finish) {
    if (finish <= 0) return;
    const finalGroup = createSvg("g");
    finalGroup.setAttribute("class", "final-ship-b");
    finalGroup.style.opacity = finish.toFixed(3);
    group.appendChild(finalGroup);
    renderCompleteShip(finalGroup, "#8d5525", false);
  }

  function renderCompleteShip(group, hullColor, showSwap) {
    const hull = appendPath(group, "hull-base", "M 86 178 C 129 226, 177 247, 262 247 C 351 247, 414 224, 451 178 C 374 204, 173 204, 86 178 Z");
    hull.style.fill = hullColor;
    renderHullTexture(group);
    if (showSwap) renderSwapMechanism(group);

    appendLine(group, "mast", 270, 74, 270, 205);
    appendPath(group, "sail", "M 278 82 C 351 104, 389 141, 398 194 C 350 179, 313 158, 278 82 Z");
    appendPath(group, "sail-line", "M 298 103 C 326 130, 350 158, 374 185");
    appendPath(group, "sail-line", "M 321 114 C 335 140, 354 166, 384 192");
    appendPath(group, "rope", "M 270 84 C 232 120, 202 162, 176 206");
    appendPath(group, "rope", "M 270 84 C 300 127, 327 164, 360 205");
    appendPath(group, "flag", "M 270 72 L 318 52 L 308 80 Z");
  }

  function renderConstructionFrame(group, completion) {
    const keelGrow = clamp(completion / 0.18, 0, 1);
    appendPath(group, "keel", `M 124 238 C 184 253, 322 254, ${124 + 276 * keelGrow} ${238 - 10 * keelGrow}`);
    if (completion > 0.06) {
      const postGrow = clamp((completion - 0.06) / 0.16, 0, 1);
      appendPath(group, "ship-post", `M 92 180 C ${94 + 20 * postGrow} ${192 + 25 * postGrow}, ${111 + 20 * postGrow} ${219 + 17 * postGrow}, 126 238`);
      appendPath(group, "ship-post", `M 451 180 C ${432 - 14 * postGrow} ${198 + 20 * postGrow}, ${416 - 18 * postGrow} ${221 + 10 * postGrow}, 400 238`);
    }
    const ribs = [
      { t: 0.09, x: 148, top: 206, tilt: -20 },
      { t: 0.14, x: 186, top: 195, tilt: -12 },
      { t: 0.2, x: 224, top: 190, tilt: -5 },
      { t: 0.26, x: 262, top: 188, tilt: 2 },
      { t: 0.32, x: 302, top: 190, tilt: 9 },
      { t: 0.38, x: 342, top: 198, tilt: 16 },
      { t: 0.44, x: 382, top: 211, tilt: 24 }
    ];
    ribs.forEach((rib) => {
      if (completion < rib.t) return;
      const grow = clamp((completion - rib.t) / 0.08, 0, 1);
      appendPath(group, "rib", `M ${rib.x} 239 C ${rib.x + rib.tilt * 0.4} ${232 - 24 * grow}, ${rib.x + rib.tilt * 0.7} ${214 - 26 * grow}, ${rib.x + rib.tilt} ${(239 + (rib.top - 239) * grow).toFixed(1)}`);
    });
  }

  function renderIndividualHullPlanks(group, count) {
    const rows = 20;
    const columns = 50;
    const visible = clamp(count, 0, totalPlanks);
    const planksGroup = createSvg("g");
    planksGroup.setAttribute("class", "assembled-plank");
    group.appendChild(planksGroup);

    for (let index = 0; index < visible; index += 1) {
      const row = Math.floor(index / columns);
      const column = index % columns;
      appendHullPlankPiece(planksGroup, row, column, rows, columns, index === visible - 1);
    }
  }

  function appendHullPlankPiece(parent, row, column, rows, columns, isNewest) {
    const lower = row / rows;
    const upper = (row + 0.82) / rows;
    const margin = 0.012;
    const u0 = column / columns + margin;
    const u1 = (column + 1) / columns - margin;
    const p1 = hullPoint(lower, u0);
    const p2 = hullPoint(lower, u1);
    const p3 = hullPoint(upper, u1);
    const p4 = hullPoint(upper, u0);
    const d = [
      `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`,
      `C ${((p1.x + p2.x) / 2).toFixed(1)} ${(p1.y + 1.8).toFixed(1)}, ${((p1.x + p2.x) / 2).toFixed(1)} ${(p2.y + 1.8).toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
      `L ${p3.x.toFixed(1)} ${p3.y.toFixed(1)}`,
      `C ${((p3.x + p4.x) / 2).toFixed(1)} ${(p3.y - 1.5).toFixed(1)}, ${((p3.x + p4.x) / 2).toFixed(1)} ${(p4.y - 1.5).toFixed(1)}, ${p4.x.toFixed(1)} ${p4.y.toFixed(1)}`,
      "Z"
    ].join(" ");
    appendPath(parent, isNewest ? "plank original-plank build-plank hull-piece newest-piece" : "plank original-plank build-plank hull-piece", d);
  }

  function hullPoint(layer, across) {
    const sideCurve = Math.sin(layer * Math.PI);
    const left = 124 - 38 * layer + 18 * sideCurve;
    const right = 400 + 51 * layer - 12 * sideCurve;
    const x = left + (right - left) * across;
    const centered = (across - 0.5) * 2;
    const y = 238 - layer * 60 - (1 - centered * centered) * (8 + 13 * layer);
    return { x, y };
  }

  function renderHullTexture(group) {
    [
      "M 118 190 C 184 213, 330 214, 420 190",
      "M 135 206 C 204 226, 319 226, 398 207",
      "M 164 223 C 222 239, 303 239, 365 224"
    ].forEach((d) => appendPath(group, "hull-grain", d));
  }

  function rebuiltHullColor(replacementFraction) {
    return mixColor([141, 85, 37], [74, 112, 158], clamp(replacementFraction, 0, 1));
  }

  function mixColor(start, end, amount) {
    const channel = (index) => Math.round(start[index] + (end[index] - start[index]) * amount);
    return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
  }

  function renderSwapMechanism(group) {
    if (year === 0 || year >= totalPlanks) return;
    const phase = replacementPhase();
    if (phase <= 0 || phase >= 1) return;
    const extract = clamp(phase / 0.24, 0, 1);
    appendCurvedPlank(group, {
      x: 176,
      y: 205,
      width: 150,
      height: 15,
      bend: -2,
      className: "slot-outline"
    });

    if (phase < 0.25) {
      const oldPlank = createSvg("g");
      oldPlank.setAttribute("class", "loose-plank");
      oldPlank.setAttribute("transform", `translate(${(246 + extract * 92).toFixed(1)} ${(210 - Math.sin(extract * Math.PI) * 10).toFixed(1)})`);
      group.appendChild(oldPlank);
      appendCurvedPlank(oldPlank, {
        x: -74,
        y: -8,
        width: 148,
        height: 15,
        bend: -2,
        className: "plank original-plank traveling-plank"
      });
    }

    const newPlank = createSvg("g");
    newPlank.setAttribute("class", "loose-plank");
    const replacement = clamp((phase - 0.08) / 0.44, 0, 1);
    newPlank.setAttribute("transform", `translate(${(414 - replacement * 168).toFixed(1)} ${(214 + Math.sin(replacement * Math.PI) * 16).toFixed(1)})`);
    group.appendChild(newPlank);
    appendCurvedPlank(newPlank, {
      x: -74,
      y: -8,
      width: 148,
      height: 15,
      bend: -2,
      className: "plank replacement-plank new-plank"
    });
  }

  function renderAssemblyPlank(svg, completion) {
    if (year === 0 || completion >= 1) return;
    const phase = replacementPhase();
    if (phase < 0.74) return;
    const arrival = smoothstep(clamp((phase - 0.74) / 0.26, 0, 1));
    const plank = createSvg("g");
    plank.setAttribute("class", "loose-plank");
    plank.setAttribute("transform", `translate(${(-28 + arrival * 206).toFixed(1)} ${(206 + arrival * 17).toFixed(1)})`);
    svg.appendChild(plank);
    appendCurvedPlank(plank, {
      x: -62,
      y: -7,
      width: 124,
      height: 14,
      bend: 6,
      className: "plank original-plank traveling-plank"
    });
  }

  function renderTransferPlank() {
    transferLayer.replaceChildren();
    if (year === 0 || year >= totalPlanks) return;
    const phase = replacementPhase();
    if (phase < 0.25 || phase > 0.74) return;
    const travel = smoothstep(clamp((phase - 0.25) / 0.49, 0, 1));
    const plank = createSvg("g");
    const startX = 325;
    const endX = 535;
    const startY = 221;
    const endY = 239;
    const arc = Math.sin(travel * Math.PI) * 18;
    plank.setAttribute("class", "loose-plank intership-plank");
    plank.setAttribute("transform", `translate(${(startX + (endX - startX) * travel).toFixed(1)} ${(startY + (endY - startY) * travel - arc).toFixed(1)})`);
    transferLayer.appendChild(plank);
    appendCurvedPlank(plank, {
      x: -58,
      y: -7,
      width: 116,
      height: 14,
      bend: 5,
      className: "plank original-plank traveling-plank"
    });
  }

  function appendCurvedPlank(parent, options) {
    const { x, y, width, height, bend, className } = options;
    const end = x + width;
    const bottom = y + height;
    const d = [
      `M ${x.toFixed(1)} ${y.toFixed(1)}`,
      `C ${(x + width * 0.25).toFixed(1)} ${(y + bend).toFixed(1)}, ${(x + width * 0.75).toFixed(1)} ${(y - bend * 0.6).toFixed(1)}, ${end.toFixed(1)} ${(y + bend * 0.18).toFixed(1)}`,
      `L ${end.toFixed(1)} ${(bottom + bend * 0.15).toFixed(1)}`,
      `C ${(x + width * 0.72).toFixed(1)} ${(bottom - bend * 0.45).toFixed(1)}, ${(x + width * 0.28).toFixed(1)} ${(bottom + bend * 0.45).toFixed(1)}, ${x.toFixed(1)} ${bottom.toFixed(1)}`,
      "Z"
    ].join(" ");
    const path = appendPath(parent, className, d);
    const grainCount = width > 50 ? 3 : 2;
    for (let i = 1; i <= grainCount; i += 1) {
      const gy = y + (height / (grainCount + 1)) * i;
      appendPath(parent, "wood-grain", `M ${(x + 5).toFixed(1)} ${gy.toFixed(1)} C ${(x + width * 0.35).toFixed(1)} ${(gy + bend * 0.22).toFixed(1)}, ${(x + width * 0.66).toFixed(1)} ${(gy - bend * 0.16).toFixed(1)}, ${(end - 5).toFixed(1)} ${(gy + bend * 0.08).toFixed(1)}`);
    }
    return path;
  }

  function appendShapedPlank(parent, d, grain) {
    const path = appendPath(parent, "plank original-plank build-plank hull-shaped-plank", d);
    appendPath(parent, "wood-grain", grain);
    return path;
  }

  function renderLens() {
    lensButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.lens === activeLens);
    });
    const counts = plankCounts();
    if (activeLens === "material") {
      lensText.textContent = counts.bOriginal === totalPlanks
        ? "By material continuity, Ship B has all of the original planks."
        : "By material continuity, Ship B becomes stronger as more original planks are recovered.";
    } else if (activeLens === "history") {
      lensText.textContent = counts.aReplacement === totalPlanks
        ? "By continuous history, Ship A still has the uninterrupted story, even with no original planks left."
        : "By continuous history, Ship A remains the ship that kept sailing through every repair.";
    } else {
      lensText.textContent = "The puzzle works because identity can mean material, structure, function, history, or something else.";
    }
  }

  function tick(timestamp) {
    if (!playing) return;
    if (lastTick === null) lastTick = timestamp;
    const elapsed = timestamp - lastTick;
    if (elapsed > 24) {
      year = Math.min(totalPlanks, year + elapsed / 180);
      lastTick = timestamp;
      if (year >= totalPlanks) {
        playing = false;
        playButton.textContent = "Play";
      }
      render();
    }
    requestAnimationFrame(tick);
  }

  function setYear(value) {
    year = clamp(Math.round(Number(value)), 0, totalPlanks);
    render();
  }

  function completedYears() {
    return clamp(Math.floor(year), 0, totalPlanks);
  }

  function replacementPhase() {
    if (!playing) return 0;
    return year - Math.floor(year);
  }

  function createSvg(name) {
    return document.createElementNS("http://www.w3.org/2000/svg", name);
  }

  function appendPath(parent, className, d) {
    const path = createSvg("path");
    path.setAttribute("class", className);
    path.setAttribute("d", d);
    parent.appendChild(path);
    return path;
  }

  function appendLine(parent, className, x1, y1, x2, y2) {
    const line = createSvg("line");
    line.setAttribute("class", className);
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    parent.appendChild(line);
    return line;
  }

  function appendEllipse(parent, className, cx, cy, rx, ry) {
    const ellipse = createSvg("ellipse");
    ellipse.setAttribute("class", className);
    ellipse.setAttribute("cx", cx);
    ellipse.setAttribute("cy", cy);
    ellipse.setAttribute("rx", rx);
    ellipse.setAttribute("ry", ry);
    parent.appendChild(ellipse);
    return ellipse;
  }

  function appendText(parent, className, x, y, textContent) {
    const text = createSvg("text");
    text.setAttribute("class", className);
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.setAttribute("text-anchor", "middle");
    text.textContent = textContent;
    parent.appendChild(text);
    return text;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function smoothstep(value) {
    const x = clamp(value, 0, 1);
    return x * x * (3 - 2 * x);
  }

  yearSlider.addEventListener("input", (event) => {
    playing = false;
    playButton.textContent = "Play";
    setYear(event.target.value);
  });

  playButton.addEventListener("click", () => {
    playing = !playing;
    playButton.textContent = playing ? "Pause" : "Play";
    lastTick = null;
    if (playing && year >= totalPlanks) {
      year = 0;
    }
    render();
    if (playing) requestAnimationFrame(tick);
  });

  resetButton.addEventListener("click", () => {
    playing = false;
    playButton.textContent = "Play";
    year = 0;
    render();
  });

  lensButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeLens = button.dataset.lens;
      renderLens();
    });
  });

  render();
}());
