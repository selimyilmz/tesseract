/* Precision 4D Perspective Containment Plate & UI Controls */
(function () {
  "use strict";

  const PLANE_META = {
    all: {
      title: "ALL PLANES ACTIVE (X · Y · Z · W)",
      detail: "Four orthogonal containment boundaries enforced around the workload.",
    },
    x: {
      title: "PLANE X — PINNED WOLFI ROOTFS",
      detail: "Host filesystem never mounted; read-only Wolfi rootfs + bounded tmpfs + fanotify.",
    },
    y: {
      title: "PLANE Y — SECCOMP BPF (DEFAULT EPERM)",
      detail: "Sealed memfd BPF profile verified by SHA-256; forbidden syscalls denied.",
    },
    z: {
      title: "PLANE Z — HTTP/HTTPS & IMDS SINKHOLE",
      detail: "Proxy-aware egress trapped with 0 upstream forwarding; direct sockets ENETUNREACH.",
    },
    w: {
      title: "PLANE W — HASH-CHAINED EVIDENCE",
      detail: "Root-owned SHA-256 event chain with fail-closed completeness latches.",
    },
  };

  /* ---- Mobile Navigation Drawer (Auto-Closes on Desktop Resize) ---- */
  const menuBtn = document.getElementById("menuToggle");
  const drawer = document.getElementById("mobileDrawer");
  const desktopQuery = window.matchMedia("(min-width: 64rem)");

  if (menuBtn && drawer) {
    const closeMenu = () => {
      drawer.hidden = true;
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.textContent = "Index";
    };
    menuBtn.addEventListener("click", () => {
      const opening = drawer.hidden;
      drawer.hidden = !opening;
      menuBtn.setAttribute("aria-expanded", String(opening));
      menuBtn.textContent = opening ? "Close" : "Index";
    });
    drawer.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !drawer.hidden) {
        closeMenu();
        menuBtn.focus();
      }
    });
    desktopQuery.addEventListener("change", (e) => {
      if (e.matches && !drawer.hidden) closeMenu();
    });
  }

  /* ---- Accessible Static Walkthrough Brief Generator ---- */
  const form = document.getElementById("inquiryForm");
  const statusEl = document.getElementById("inquiryStatus");
  if (form && statusEl) {
    const emailInput = form.elements.partner_email;
    const firmInput = form.elements.investment_firm;

    [emailInput, firmInput].forEach((field) => {
      if (!field) return;
      field.addEventListener("input", () => {
        field.setCustomValidity("");
      });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      statusEl.textContent = "";

      const email = emailInput ? emailInput.value.trim() : "";
      const firm = firmInput ? firmInput.value.trim() : "";

      if (firmInput && !firm) {
        firmInput.setCustomValidity("Please enter a firm or organization name.");
      }
      if (!form.reportValidity()) return;

      const briefText =
        "tesseract (agent-sandbox-guard) Walkthrough Request — Organization: " +
        firm +
        " | Contact: " +
        email +
        " | Repo: https://github.com/selimyilmz/tesseract";

      let copied = false;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(briefText);
          copied = true;
        } catch (_err) {
          copied = false;
        }
      }

      statusEl.textContent = copied
        ? "Brief summary copied to clipboard. Open a walkthrough request via the GitHub link to schedule a live negative-test session."
        : "Brief prepared: " + briefText;
      form.reset();
    });
  }

  /* ---- 4D Perspective Hypercube CAD Plate ---- */
  const canvas = document.getElementById("tesseractCanvas");
  const frame = document.getElementById("tesseractFrame");
  const readoutTitle = document.getElementById("planeTitle");
  const readoutDetail = document.getElementById("planeDetail");
  const telemetryEl = document.getElementById("angleTelemetry");
  const motionBtn = document.getElementById("motionToggle");
  const planeButtons = document.querySelectorAll(".plane-btn[data-plane]");

  if (!canvas || !frame) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const vertices4D = [];
  for (let i = 0; i < 16; i++) {
    vertices4D.push([
      i & 1 ? 1 : -1,
      i & 2 ? 1 : -1,
      i & 4 ? 1 : -1,
      i & 8 ? 1 : -1,
    ]);
  }

  const AXIS_NAMES = ["x", "y", "z", "w"];
  const edges = [];
  for (let i = 0; i < 16; i++) {
    for (let j = i + 1; j < 16; j++) {
      let diffAxis = -1;
      let diffCount = 0;
      for (let k = 0; k < 4; k++) {
        if (vertices4D[i][k] !== vertices4D[j][k]) {
          diffCount++;
          diffAxis = k;
        }
      }
      if (diffCount === 1) {
        edges.push({ i, j, axis: AXIS_NAMES[diffAxis] });
      }
    }
  }

  let activePlane = "all";
  let angleXW = 0.55;
  let angleYW = 0.35;
  let angleXY = 0.2;
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  let currentSize = 320;
  let rafId = null;
  let lastTimestamp = null;
  let isInViewport = true;

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const forcedColorsQuery = window.matchMedia("(forced-colors: active)");
  let isPlaying = !reducedMotionQuery.matches;

  function syncMotionButton() {
    if (!motionBtn) return;
    motionBtn.textContent = isPlaying ? "Pause" : "Play";
    motionBtn.setAttribute(
      "aria-label",
      isPlaying ? "Pause 4D projection rotation" : "Play 4D projection rotation"
    );
  }

  function resizeCanvas() {
    const rect = frame.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    currentSize = Math.max(180, Math.round(rect.width || 320));
    canvas.width = Math.round(currentSize * dpr);
    canvas.height = Math.round(currentSize * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderFrame();
  }

  function rotate4D(pt) {
    const [x, y, z, w] = pt;
    const cXW = Math.cos(angleXW), sXW = Math.sin(angleXW);
    const x1 = x * cXW - w * sXW;
    const w1 = x * sXW + w * cXW;

    const cYW = Math.cos(angleYW), sYW = Math.sin(angleYW);
    const y2 = y * cYW - w1 * sYW;
    const w2 = y * sYW + w1 * cYW;

    const cXY = Math.cos(angleXY), sXY = Math.sin(angleXY);
    const x3 = x1 * cXY - y2 * sXY;
    const y3 = x1 * sXY + y2 * cXY;

    return [x3, y3, z, w2];
  }

  function getPalette() {
    if (forcedColorsQuery.matches) {
      const style = getComputedStyle(frame);
      const fg = style.color || "CanvasText";
      const bg = style.backgroundColor || "Canvas";
      return {
        forced: true,
        grid: fg,
        ink: fg,
        bg: bg,
        muted: fg,
        x: fg,
        y: fg,
        z: "Highlight",
        w: fg,
      };
    }
    return {
      forced: false,
      grid: "rgba(18, 19, 17, 0.14)",
      ink: "#121311",
      bg: "#FAF8F3",
      muted: "rgba(18, 19, 17, 0.34)",
      x: "#121311",
      y: "#1B563B",
      z: "#B02B16",
      w: "#7A4206",
    };
  }

  function strokeForAxis(axis, pal) {
    if (activePlane !== "all" && axis !== activePlane) {
      return { color: pal.muted, width: 1.05, dash: [3, 3] };
    }
    switch (axis) {
      case "x":
        return { color: pal.x, width: activePlane === "x" ? 2.6 : 1.65, dash: [] };
      case "y":
        return { color: pal.y, width: activePlane === "y" ? 2.6 : 1.65, dash: [] };
      case "z":
        return { color: pal.z, width: activePlane === "z" ? 2.6 : 1.65, dash: [] };
      case "w":
      default:
        return { color: pal.w, width: activePlane === "w" ? 2.6 : 1.5, dash: [4, 3] };
    }
  }

  function renderFrame() {
    const size = currentSize;
    const pal = getPalette();
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;

    /* Precision registration crosshair */
    ctx.save();
    ctx.strokeStyle = pal.grid;
    ctx.globalAlpha = pal.forced ? 0.45 : 1;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, 12);
    ctx.lineTo(cx, size - 12);
    ctx.moveTo(12, cy);
    ctx.lineTo(size - 12, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.43, 0, Math.PI * 2);
    ctx.setLineDash([2, 4]);
    ctx.stroke();
    ctx.restore();

    const dist4D = 2.8;
    const dist3D = 3.2;
    const scale = size * 1.18;

    const projected = vertices4D.map((v) => {
      const [rx, ry, rz, rw] = rotate4D(v);
      const wf = 1 / (dist4D - rw);
      const x3 = rx * wf;
      const y3 = ry * wf;
      const z3 = rz * wf;
      const zf = 1 / (dist3D - z3);
      return {
        x: cx + x3 * zf * scale,
        y: cy + y3 * zf * scale,
        depth: rw + z3,
      };
    });

    edges.forEach(({ i, j, axis }) => {
      const p1 = projected[i];
      const p2 = projected[j];
      const style = strokeForAxis(axis, pal);
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash(style.dash);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = style.color;
      ctx.lineWidth = style.width;
      ctx.stroke();
      ctx.restore();
    });

    projected.forEach((p) => {
      const r = p.depth > 0 ? 3.0 : 2.1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = p.depth > 0 ? pal.ink : pal.bg;
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = pal.ink;
      ctx.stroke();
    });

    if (telemetryEl) {
      const norm = (a) => (((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)).toFixed(2);
      telemetryEl.textContent =
        "XW " + norm(angleXW) + " rad  ·  YW " + norm(angleYW) + " rad  ·  XY " + norm(angleXY) + " rad";
    }
  }

  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastTimestamp = null;
  }

  function tick(timestamp) {
    if (!isPlaying || document.hidden || !isInViewport) {
      stopLoop();
      return;
    }
    if (lastTimestamp === null) {
      lastTimestamp = timestamp;
    }
    const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
    lastTimestamp = timestamp;

    if (!isDragging) {
      /* Delta-time normalized rad/s (consistent across 60Hz/120Hz/144Hz displays) */
      angleXW += 0.33 * dt;
      angleYW += 0.24 * dt;
      angleXY += 0.12 * dt;
    }
    renderFrame();
    rafId = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (rafId === null && isPlaying && !document.hidden && isInViewport) {
      lastTimestamp = null;
      rafId = requestAnimationFrame(tick);
    }
  }

  /* Pointer / Touch Drag Support */
  frame.addEventListener("pointerdown", (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    frame.setPointerCapture(e.pointerId);
  });

  frame.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    angleXW += (e.clientX - lastX) * 0.011;
    angleYW += (e.clientY - lastY) * 0.011;
    lastX = e.clientX;
    lastY = e.clientY;
    if (!isPlaying) renderFrame();
  });

  const endDrag = () => {
    isDragging = false;
  };
  frame.addEventListener("pointerup", endDrag);
  frame.addEventListener("pointercancel", endDrag);

  /* Keyboard Rotation Parity (Arrow Keys) */
  frame.addEventListener("keydown", (e) => {
    const step = 0.14;
    if (e.key === "ArrowLeft") {
      angleXW -= step;
    } else if (e.key === "ArrowRight") {
      angleXW += step;
    } else if (e.key === "ArrowUp") {
      angleYW -= step;
    } else if (e.key === "ArrowDown") {
      angleYW += step;
    } else {
      return;
    }
    e.preventDefault();
    renderFrame();
  });

  /* Interactive Plane Selector */
  planeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      activePlane = btn.dataset.plane || "all";
      planeButtons.forEach((b) => {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      const info = PLANE_META[activePlane] || PLANE_META.all;
      if (readoutTitle) readoutTitle.textContent = info.title;
      if (readoutDetail) readoutDetail.textContent = info.detail;
      renderFrame();
    });
  });

  if (motionBtn) {
    motionBtn.addEventListener("click", () => {
      isPlaying = !isPlaying;
      syncMotionButton();
      if (isPlaying) {
        startLoop();
      } else {
        stopLoop();
      }
    });
  }

  /* Pause offscreen to save CPU/battery */
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        isInViewport = entries.some((entry) => entry.isIntersecting);
        if (isInViewport && isPlaying) {
          startLoop();
        } else {
          stopLoop();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(frame);
  }

  reducedMotionQuery.addEventListener("change", (e) => {
    isPlaying = !e.matches;
    syncMotionButton();
    if (isPlaying) {
      startLoop();
    } else {
      stopLoop();
    }
  });

  forcedColorsQuery.addEventListener("change", renderFrame);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && isPlaying) {
      startLoop();
    } else {
      stopLoop();
    }
  });

  window.addEventListener("resize", resizeCanvas);

  syncMotionButton();
  resizeCanvas();
  startLoop();
})();
