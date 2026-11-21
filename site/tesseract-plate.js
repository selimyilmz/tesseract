/* Living 4D Logo Containment Plate & UI Controls */
(function () {
  "use strict";

  const PLANE_META = {
    all: {
      title: "ALL PLANES ACTIVE (X · Y · Z · W)",
      detail: "Four orthogonal containment boundaries enforced around the sealed core.",
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
        "tesseract Walkthrough Request — Organization: " +
        firm +
        " | Contact: " +
        email;

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
        ? "Brief summary copied to clipboard. Share it with the tesseract team to schedule a live negative-test session."
        : "Brief prepared: " + briefText;
      form.reset();
    });
  }

  /* ---- Living 01-III 4D Hypercube Logo Plate ---- */
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

  /* 16 vertices of 4D hypercube (0..7: inner w=-1, 8..15: outer w=+1) */
  const vertices4D = [];
  for (let i = 0; i < 16; i++) {
    vertices4D.push([
      i & 1 ? 1 : -1,
      i & 2 ? 1 : -1,
      i & 4 ? 1 : -1,
      i & 8 ? 1 : -1,
    ]);
  }

  /* 6 faces of a 3D cube (vertex indices 0..7) for subtle 01-III facet depth */
  const CUBE_FACES = [
    [0, 1, 3, 2],
    [4, 5, 7, 6],
    [0, 1, 5, 4],
    [2, 3, 7, 6],
    [0, 2, 6, 4],
    [1, 3, 7, 5],
  ];

  /* 8 vertices of the central sealed vermilion core cube */
  const coreVertices3D = [];
  for (let i = 0; i < 8; i++) {
    coreVertices3D.push([
      i & 1 ? 0.25 : -0.25,
      i & 2 ? 0.25 : -0.25,
      i & 4 ? 0.25 : -0.25,
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
        const isOuter = i >= 8 && j >= 8;
        const isInner = i < 8 && j < 8;
        edges.push({ i, j, axis: AXIS_NAMES[diffAxis], isOuter, isInner });
      }
    }
  }

  /* Start in the exact isometric Schlegel pose of the 01-III logo */
  const ISO_Y = Math.PI / 4;
  const ISO_X = Math.atan(1 / Math.SQRT2);

  let activePlane = "all";
  let angleXW = 0.0;
  let angleYW = 0.0;
  let rotY = ISO_Y;
  let rotX = ISO_X;
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
      isPlaying ? "Pause 4D logo rotation" : "Play 4D logo rotation"
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

  function rotate4DTo3D(pt) {
    const [x, y, z, w] = pt;
    /* 4D rotations (XW and YW) */
    const cXW = Math.cos(angleXW), sXW = Math.sin(angleXW);
    const x1 = x * cXW - w * sXW;
    const w1 = x * sXW + w * cXW;

    const cYW = Math.cos(angleYW), sYW = Math.sin(angleYW);
    const y2 = y * cYW - w1 * sYW;
    const w2 = y * sYW + w1 * cYW;

    /* Schlegel 4D -> 3D projection: w=+1 outer cube, w=-1 nested inner cube */
    const dist4D = 2.65;
    const wf = 1.65 / (dist4D - w2);
    return rotate3D([x1 * wf, y2 * wf, z * wf], w2);
  }

  function rotate3D(pt, wDepth) {
    const [x, y, z] = pt;
    const cY = Math.cos(rotY), sY = Math.sin(rotY);
    const x1 = x * cY + z * sY;
    const z1 = -x * sY + z * cY;

    const cX = Math.cos(rotX), sX = Math.sin(rotX);
    const y2 = y * cX - z1 * sX;
    const z2 = y * sX + z1 * cX;

    return [x1, y2, z2, wDepth];
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
        outerFacet: "transparent",
        innerFacet: bg,
        strut: fg,
        muted: fg,
        coreHi: "Highlight",
        coreMid: "Highlight",
        coreLo: "Highlight",
        x: fg,
        y: fg,
        z: "Highlight",
        w: fg,
      };
    }
    return {
      forced: false,
      grid: "rgba(27, 21, 17, 0.13)",
      ink: "#1B1511",
      bg: "#FAF8F3",
      outerFacet: "rgba(27, 21, 17, 0.045)",
      innerFacet: "rgba(250, 248, 243, 0.72)",
      strut: "rgba(27, 21, 17, 0.58)",
      muted: "rgba(27, 21, 17, 0.24)",
      coreHi: "#D6472C",
      coreMid: "#B02B16",
      coreLo: "#7E1D0E",
      x: "#2E231C",
      y: "#1B563B",
      z: "#B02B16",
      w: "#7A4206",
    };
  }

  function strokeForEdge(edge, pal) {
    if (activePlane === "all") {
      if (edge.axis === "w") {
        return { color: pal.strut, width: 1.3, dash: [] };
      }
      return {
        color: pal.ink,
        width: edge.isOuter ? 2.1 : 1.55,
        dash: [],
      };
    }
    if (edge.axis !== activePlane) {
      return { color: pal.muted, width: 1.0, dash: [3, 3] };
    }
    switch (edge.axis) {
      case "x":
        return { color: pal.x, width: 2.6, dash: [] };
      case "y":
        return { color: pal.y, width: 2.6, dash: [] };
      case "z":
        return { color: pal.z, width: 2.6, dash: [] };
      case "w":
      default:
        return { color: pal.w, width: 2.4, dash: [5, 3] };
    }
  }

  function projectPoint(p3, cx, cy, scale) {
    const dist3D = 6.2;
    const zf = dist3D / (dist3D - p3[2]);
    return {
      x: cx + p3[0] * zf * scale,
      y: cy - p3[1] * zf * scale,
      z: p3[2],
      w: p3[3],
    };
  }

  function renderFrame() {
    const size = currentSize;
    const pal = getPalette();
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;

    /* Precision registration crosshair & circular reticle */
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

    const scale = size * 0.245;

    const projected = vertices4D.map((v) => projectPoint(rotate4DTo3D(v), cx, cy, scale));

    /* 1. Subtle 01-III architectural facets on outer cube (indices 8..15) */
    if (!pal.forced && activePlane === "all") {
      const outerFaces = CUBE_FACES.map((face) => {
        const pts = face.map((idx) => projected[idx + 8]);
        const avgZ = pts.reduce((sum, p) => sum + p.z, 0) / 4;
        return { pts, avgZ };
      }).sort((a, b) => a.avgZ - b.avgZ);

      outerFaces.forEach((f, idx) => {
        if (idx < 3) return; /* front-facing 3 facets only for clean 01-III shading */
        ctx.beginPath();
        ctx.moveTo(f.pts[0].x, f.pts[0].y);
        for (let k = 1; k < 4; k++) ctx.lineTo(f.pts[k].x, f.pts[k].y);
        ctx.closePath();
        ctx.fillStyle = idx === 5 ? "rgba(250, 248, 243, 0.22)" : idx === 4 ? "rgba(27, 21, 17, 0.045)" : "rgba(27, 21, 17, 0.085)";
        ctx.fill();
      });
    }

    /* 2. Translucent paper facets on inner containment cube (indices 0..7) */
    if (!pal.forced && activePlane === "all") {
      const innerFaces = CUBE_FACES.map((face) => {
        const pts = face.map((idx) => projected[idx]);
        const avgZ = pts.reduce((sum, p) => sum + p.z, 0) / 4;
        return { pts, avgZ };
      }).sort((a, b) => a.avgZ - b.avgZ);

      innerFaces.forEach((f, idx) => {
        if (idx < 3) return;
        ctx.beginPath();
        ctx.moveTo(f.pts[0].x, f.pts[0].y);
        for (let k = 1; k < 4; k++) ctx.lineTo(f.pts[k].x, f.pts[k].y);
        ctx.closePath();
        ctx.fillStyle = pal.innerFacet;
        ctx.fill();
      });
    }

    /* 3. Draw all 32 hypercube edges sorted back-to-front */
    const sortedEdges = edges
      .map((edge) => ({
        edge,
        p1: projected[edge.i],
        p2: projected[edge.j],
        depth: (projected[edge.i].z + projected[edge.j].z) / 2,
      }))
      .sort((a, b) => a.depth - b.depth);

    sortedEdges.forEach(({ edge, p1, p2 }) => {
      const style = strokeForEdge(edge, pal);
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash(style.dash);
      ctx.lineJoin = "miter";
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = style.color;
      ctx.lineWidth = style.width;
      ctx.stroke();
      ctx.restore();
    });

    /* 4. Signature 01-III sealed vermilion core cube at dead center */
    const coreProj = coreVertices3D.map((v) => projectPoint(rotate3D(v, 0), cx, cy, scale));
    const coreFaces = CUBE_FACES.map((face) => {
      const pts = face.map((idx) => coreProj[idx]);
      const avgZ = pts.reduce((sum, p) => sum + p.z, 0) / 4;
      return { pts, avgZ };
    }).sort((a, b) => a.avgZ - b.avgZ);

    coreFaces.slice(3).forEach((f, idx) => {
      ctx.beginPath();
      ctx.moveTo(f.pts[0].x, f.pts[0].y);
      for (let k = 1; k < 4; k++) ctx.lineTo(f.pts[k].x, f.pts[k].y);
      ctx.closePath();
      ctx.fillStyle = idx === 2 ? pal.coreHi : idx === 1 ? pal.coreMid : pal.coreLo;
      ctx.fill();
    });

    if (telemetryEl) {
      const norm = (a) => (((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)).toFixed(2);
      telemetryEl.textContent =
        "XW " + norm(angleXW) + " rad  ·  YW " + norm(angleYW) + " rad  ·  3D " + norm(rotY) + " rad";
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
      /* Calm, dignified 4D breathing rotation around the 01-III logo silhouette */
      angleXW += 0.24 * dt;
      angleYW += 0.14 * dt;
      rotY += 0.08 * dt;
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
    rotY += (e.clientX - lastX) * 0.011;
    rotX += (e.clientY - lastY) * 0.011;
    angleXW += (e.clientX - lastX) * 0.004;
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
      rotY -= step;
    } else if (e.key === "ArrowRight") {
      rotY += step;
    } else if (e.key === "ArrowUp") {
      rotX -= step;
    } else if (e.key === "ArrowDown") {
      rotX += step;
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
