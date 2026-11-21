/* Precision 4D Perspective Containment Plate (01-III True-Depth Edition) & UI Controls */
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

  /* ---- 4D Hypercube CAD Plate with True Z-Depth & Backface-Culled 01-III Core ---- */
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

  /* 16 vertices of the 4D hypercube */
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

  /* Sealed 3D vermilion core at origin (exact outward normals for flicker-free backface culling) */
  const CORE_R = 0.088;
  const coreVerts3D = [];
  for (let i = 0; i < 8; i++) {
    coreVerts3D.push([
      i & 1 ? CORE_R : -CORE_R,
      i & 2 ? CORE_R : -CORE_R,
      i & 4 ? CORE_R : -CORE_R,
    ]);
  }
  const CORE_FACES = [
    { idx: [4, 5, 7, 6], n: [0, 0, 1] },
    { idx: [0, 2, 3, 1], n: [0, 0, -1] },
    { idx: [2, 6, 7, 3], n: [0, 1, 0] },
    { idx: [0, 1, 5, 4], n: [0, -1, 0] },
    { idx: [1, 3, 7, 5], n: [1, 0, 0] },
    { idx: [0, 4, 6, 2], n: [-1, 0, 0] },
  ];

  /* Exact isometric base mirroring our 01-III hexagonal logo */
  const ISO_Y = Math.PI / 4;
  const ISO_X = Math.atan(1 / Math.SQRT2);

  let activePlane = "all";
  let angleXW = 0.0;
  let angleYW = 0.0;
  let angleXY = 0.0;
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

  function rotate3D(pt) {
    const [x, y, z] = pt;
    const cY = Math.cos(rotY), sY = Math.sin(rotY);
    const x1 = x * cY + z * sY;
    const z1 = -x * sY + z * cY;

    const cX = Math.cos(rotX), sX = Math.sin(rotX);
    const y2 = y * cX - z1 * sX;
    const z2 = y * sX + z1 * cX;

    return [x1, y2, z2];
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

    const [vx, vy, vz] = rotate3D([x3, y3, z]);
    return [vx, vy, vz, w2];
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
        coreHi: "Highlight",
        coreMid: "Highlight",
        coreLo: "Highlight",
        coreEdge: fg,
        x: fg,
        y: fg,
        z: "Highlight",
        w: fg,
      };
    }
    return {
      forced: false,
      grid: "rgba(27, 21, 17, 0.14)",
      ink: "#1B1511",
      bg: "#FAF8F3",
      muted: "rgba(27, 21, 17, 0.28)",
      coreHi: "#D94C32",
      coreMid: "#B02B16",
      coreLo: "#7D1C0E",
      coreEdge: "#7D1C0E",
      x: "#2E231C",
      y: "#1B563B",
      z: "#B02B16",
      w: "#7A4206",
    };
  }

  function drawEdge(e, p1, p2, pal, isFront) {
    const isolated = activePlane !== "all" && e.axis !== activePlane;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);

    if (isolated) {
      ctx.strokeStyle = pal.muted;
      ctx.lineWidth = isFront ? 1.1 : 0.95;
      ctx.setLineDash([3, 3]);
    } else {
      ctx.strokeStyle = pal[e.axis] || pal.ink;
      if (e.axis === "w") ctx.setLineDash([4, 3]);
      if (!pal.forced) {
        ctx.globalAlpha = isFront ? 1.0 : 0.56;
      }
      if (activePlane === e.axis) {
        ctx.lineWidth = isFront ? 2.7 : 1.9;
      } else {
        ctx.lineWidth = isFront
          ? (e.axis === "w" ? 1.65 : 2.15)
          : (e.axis === "w" ? 1.15 : 1.35);
      }
    }

    ctx.stroke();
    ctx.restore();
  }

  function drawVertex(p, pal) {
    ctx.save();
    if (!pal.forced && p.z3 < 0) ctx.globalAlpha = 0.62;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.z3 >= 0 ? 2.9 : 2.0, 0, Math.PI * 2);
    ctx.fillStyle = p.z3 >= 0 ? pal.ink : pal.bg;
    ctx.fill();
    ctx.lineWidth = 1.15;
    ctx.strokeStyle = pal.ink;
    ctx.stroke();
    ctx.restore();
  }

  function draw3DCore(cx, cy, scale, pal) {
    const dist3D = 3.55;
    const pts = coreVerts3D.map((v) => {
      const [x, y, z] = rotate3D(v);
      const zf = 1 / (dist3D - z);
      return { x: cx + x * zf * scale, y: cy - y * zf * scale, z };
    });

    /* Directional key light from top-left-front for crisp 3-tone architectural shading */
    const lx = -0.45, ly = 0.72, lz = 0.52;
    CORE_FACES.forEach((f) => {
      const [nx, ny, nz] = rotate3D(f.n);
      if (nz <= 0) return; /* exact backface culling */
      const lit = nx * lx + ny * ly + nz * lz;
      const fill = lit > 0.45 ? pal.coreHi : lit > 0.05 ? pal.coreMid : pal.coreLo;

      ctx.beginPath();
      f.idx.forEach((vi, k) => {
        if (k === 0) ctx.moveTo(pts[vi].x, pts[vi].y);
        else ctx.lineTo(pts[vi].x, pts[vi].y);
      });
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = pal.coreEdge;
      ctx.lineWidth = 0.65;
      ctx.stroke();
    });
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

    const dist4D = 2.75;
    const dist3D = 3.55;
    const scale = size * 1.14;

    const projected = vertices4D.map((v) => {
      const [rx, ry, rz, rw] = rotate4D(v);
      const wf = 1 / (dist4D - rw);
      const x3 = rx * wf;
      const y3 = ry * wf;
      const z3 = rz * wf;
      const zf = 1 / (dist3D - z3);
      return {
        x: cx + x3 * zf * scale,
        y: cy - y3 * zf * scale,
        z3: z3,
      };
    });

    /* Split edges cleanly by Z-depth relative to the center core (z3 = 0) */
    const backEdges = [];
    const frontEdges = [];
    edges.forEach((e) => {
      const avgZ = (projected[e.i].z3 + projected[e.j].z3) / 2;
      if (avgZ < 0) backEdges.push({ e, avgZ });
      else frontEdges.push({ e, avgZ });
    });
    backEdges.sort((a, b) => a.avgZ - b.avgZ);
    frontEdges.sort((a, b) => a.avgZ - b.avgZ);

    /* PASS 1: Back edges & back vertices (BEHIND the center core) */
    backEdges.forEach(({ e }) => drawEdge(e, projected[e.i], projected[e.j], pal, false));
    projected.forEach((p) => {
      if (p.z3 < 0) drawVertex(p, pal);
    });

    /* PASS 2: Sealed 3D vermilion 01-III core at z = 0 */
    draw3DCore(cx, cy, scale, pal);

    /* PASS 3: Front edges & front vertices (CLEANLY IN FRONT OF the center core) */
    frontEdges.forEach(({ e }) => drawEdge(e, projected[e.i], projected[e.j], pal, true));
    projected.forEach((p) => {
      if (p.z3 >= 0) drawVertex(p, pal);
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
      angleXW += 0.25 * dt;
      angleYW += 0.16 * dt;
      angleXY += 0.07 * dt;
      rotY += 0.06 * dt;
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
    rotY += (e.clientX - lastX) * 0.005;
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
      rotY -= step * 0.4;
    } else if (e.key === "ArrowRight") {
      angleXW += step;
      rotY += step * 0.4;
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
