(() => {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  function initGothicRosePetalsAndTouch() {
    if (document.getElementById("gothicRosePetalsCanvas")) return;

    // 1. Background Ambient Falling Petals Canvas (behind cards/content)
    const bgCanvas = document.createElement("canvas");
    bgCanvas.id = "gothicRosePetalsCanvas";
    bgCanvas.className = "gothic-ambient-canvas";
    bgCanvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(bgCanvas);

    // 2. Foreground Interactive Touch/Tap Blossom Canvas (under finger, non-blocking)
    const fxCanvas = document.createElement("canvas");
    fxCanvas.id = "gothicTouchPetalCanvas";
    fxCanvas.className = "gothic-ambient-canvas";
    fxCanvas.style.zIndex = "55";
    fxCanvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(fxCanvas);

    const bgCtx = bgCanvas.getContext("2d");
    const fxCtx = fxCanvas.getContext("2d");
    if (!bgCtx || !fxCtx) return;

    // Pre-render 4 botanical black-velvet rose petal sprites (front & back) on offscreen canvases
    // for silky 60fps performance with rich velvet shading, cupped shadows, and delicate veins
    const SPRITE_SIZE = 96;
    const HALF = SPRITE_SIZE / 2;
    const petalSprites = [];

    function tracePetalSilhouette(ctx, variant, r) {
      ctx.beginPath();
      if (variant === 0) {
        // Classic heart-cleft velvet rose petal
        ctx.moveTo(0, r * 0.82);
        ctx.bezierCurveTo(-r * 0.55, r * 0.62, -r * 1.02, r * 0.08, -r * 0.94, -r * 0.42);
        ctx.bezierCurveTo(-r * 0.88, -r * 0.78, -r * 0.48, -r * 0.96, -r * 0.16, -r * 0.84);
        ctx.bezierCurveTo(-r * 0.05, -r * 0.79, -r * 0.01, -r * 0.68, 0.02, -r * 0.68);
        ctx.bezierCurveTo(r * 0.06, -r * 0.68, r * 0.12, -r * 0.82, r * 0.24, -r * 0.87);
        ctx.bezierCurveTo(r * 0.58, -r * 0.98, r * 0.94, -r * 0.72, r * 0.96, -r * 0.34);
        ctx.bezierCurveTo(r * 0.98, r * 0.16, r * 0.52, r * 0.64, 0, r * 0.82);
      } else if (variant === 1) {
        // Broad ruffled outer rose petal
        ctx.moveTo(0, r * 0.76);
        ctx.bezierCurveTo(-r * 0.68, r * 0.58, -r * 1.08, r * 0.04, -r * 0.98, -r * 0.46);
        ctx.bezierCurveTo(-r * 0.9, -r * 0.82, -r * 0.42, -r * 0.96, -r * 0.08, -r * 0.88);
        ctx.bezierCurveTo(r * 0.18, -r * 0.95, r * 0.62, -r * 0.9, r * 0.88, -r * 0.62);
        ctx.bezierCurveTo(r * 1.08, -r * 0.36, r * 0.98, r * 0.22, r * 0.58, r * 0.56);
        ctx.bezierCurveTo(r * 0.34, r * 0.72, r * 0.14, r * 0.76, 0, r * 0.76);
      } else if (variant === 2) {
        // Asymmetric wind-curled petal
        ctx.moveTo(-r * 0.08, r * 0.84);
        ctx.bezierCurveTo(-r * 0.62, r * 0.54, -r * 0.96, -r * 0.06, -r * 0.82, -r * 0.56);
        ctx.bezierCurveTo(-r * 0.7, -r * 0.88, -r * 0.26, -r * 0.96, r * 0.06, -r * 0.84);
        ctx.bezierCurveTo(r * 0.38, -r * 0.92, r * 0.78, -r * 0.72, r * 0.84, -r * 0.34);
        ctx.bezierCurveTo(r * 0.9, r * 0.14, r * 0.46, r * 0.66, -r * 0.08, r * 0.84);
      } else {
        // Teardrop inner bud petal
        ctx.moveTo(0, r * 0.86);
        ctx.bezierCurveTo(-r * 0.52, r * 0.56, -r * 0.84, -r * 0.04, -r * 0.74, -r * 0.52);
        ctx.bezierCurveTo(-r * 0.64, -r * 0.86, -r * 0.22, -r * 0.94, 0, -r * 0.84);
        ctx.bezierCurveTo(r * 0.22, -r * 0.94, r * 0.64, -r * 0.86, r * 0.74, -r * 0.52);
        ctx.bezierCurveTo(r * 0.84, -r * 0.04, r * 0.52, r * 0.56, 0, r * 0.86);
      }
      ctx.closePath();
    }

    function buildPetalSprite(variant, isBackSide) {
      const off = document.createElement("canvas");
      off.width = SPRITE_SIZE;
      off.height = SPRITE_SIZE;
      const c = off.getContext("2d");
      if (!c) return off;

      const r = SPRITE_SIZE * 0.38;
      c.save();
      c.translate(HALF, HALF);

      // Soft drop shadow for depth
      c.shadowColor = "rgba(18, 16, 24, 0.28)";
      c.shadowBlur = 5;
      c.shadowOffsetY = 2;

      tracePetalSilhouette(c, variant, r);

      // Rich multi-stop radial velvet gradient
      const radGrad = c.createRadialGradient(
        isBackSide ? r * 0.15 : -r * 0.18,
        -r * 0.28,
        r * 0.06,
        0,
        r * 0.1,
        r * 1.05
      );

      if (!isBackSide) {
        radGrad.addColorStop(0, "#4c4958");
        radGrad.addColorStop(0.38, "#312e3a");
        radGrad.addColorStop(0.75, "#1d1b24");
        radGrad.addColorStop(1, "#111016");
      } else {
        radGrad.addColorStop(0, "#585566");
        radGrad.addColorStop(0.45, "#3a3744");
        radGrad.addColorStop(0.82, "#24222c");
        radGrad.addColorStop(1, "#16151c");
      }

      c.fillStyle = radGrad;
      c.fill();

      // Reset shadow for inner botanical details
      c.shadowColor = "transparent";
      c.shadowBlur = 0;
      c.shadowOffsetY = 0;

      // Clip to petal silhouette for internal cupped shading & veins
      c.save();
      tracePetalSilhouette(c, variant, r);
      c.clip();

      // Cupped bowl shadow near base & center
      const cupGrad = c.createRadialGradient(0, r * 0.22, r * 0.04, 0, r * 0.22, r * 0.68);
      cupGrad.addColorStop(0, "rgba(8, 7, 12, 0.42)");
      cupGrad.addColorStop(0.6, "rgba(16, 14, 22, 0.14)");
      cupGrad.addColorStop(1, "rgba(16, 14, 22, 0)");
      c.fillStyle = cupGrad;
      c.fillRect(-HALF, -HALF, SPRITE_SIZE, SPRITE_SIZE);

      // Curled upper lip satin highlight
      const lipGrad = c.createLinearGradient(0, -r * 0.95, 0, -r * 0.25);
      lipGrad.addColorStop(0, "rgba(255, 255, 255, 0.22)");
      lipGrad.addColorStop(0.45, "rgba(220, 218, 232, 0.07)");
      lipGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      c.fillStyle = lipGrad;
      c.fillRect(-HALF, -HALF, SPRITE_SIZE, SPRITE_SIZE);

      // Delicate branching botanical veins
      c.strokeStyle = "rgba(235, 233, 245, 0.11)";
      c.lineWidth = 0.75;
      c.lineCap = "round";

      // Center midrib vein
      c.beginPath();
      c.moveTo(0, r * 0.75);
      c.quadraticCurveTo(r * 0.05, 0, 0, -r * 0.66);
      c.stroke();

      // Left & right secondary veins
      const veins = [
        [0, r * 0.45, -r * 0.32, r * 0.12, -r * 0.58, -r * 0.28],
        [0, r * 0.2, -r * 0.28, -r * 0.18, -r * 0.46, -r * 0.58],
        [0, r * 0.45, r * 0.32, r * 0.12, r * 0.58, -r * 0.28],
        [0, r * 0.2, r * 0.28, -r * 0.18, r * 0.46, -r * 0.58]
      ];
      c.lineWidth = 0.55;
      for (let i = 0; i < veins.length; i++) {
        const v = veins[i];
        c.beginPath();
        c.moveTo(v[0], v[1]);
        c.quadraticCurveTo(v[2], v[3], v[4], v[5]);
        c.stroke();
      }

      // Soft warm ivory/silver base stem point
      const baseGlow = c.createRadialGradient(0, r * 0.78, 0, 0, r * 0.78, r * 0.22);
      baseGlow.addColorStop(0, "rgba(230, 228, 240, 0.26)");
      baseGlow.addColorStop(1, "rgba(230, 228, 240, 0)");
      c.fillStyle = baseGlow;
      c.beginPath();
      c.arc(0, r * 0.78, r * 0.22, 0, Math.PI * 2);
      c.fill();

      c.restore();

      // Satin rim stroke
      tracePetalSilhouette(c, variant, r);
      c.lineWidth = 0.85;
      c.strokeStyle = isBackSide
        ? "rgba(240, 238, 248, 0.16)"
        : "rgba(240, 238, 248, 0.22)";
      c.stroke();

      c.restore();
      return off;
    }

    for (let v = 0; v < 4; v++) {
      petalSprites.push({
        front: buildPetalSprite(v, false),
        back: buildPetalSprite(v, true)
      });
    }

    let width = 0;
    let height = 0;
    let dpr = 1;
    let ambientPetals = [];
    let touchPetals = [];
    let touchRipples = [];
    let touchSparks = [];

    // Gentle pointer/touch wind interaction
    const pointer = { x: -9999, y: -9999, vx: 0, vy: 0, active: false };

    function targetAmbientCount() {
      if (width <= 680) return 11;
      if (width <= 1024) return 15;
      return 19;
    }

    function createAmbientPetal(spawnAtTop) {
      const depth = 0.58 + Math.random() * 0.56;
      const size = (13 + Math.random() * 9) * depth;
      const variant = Math.floor(Math.random() * petalSprites.length);

      return {
        x: Math.random() * (width + 60) - 30,
        y: spawnAtTop
          ? -30 - Math.random() * (height * 0.3)
          : Math.random() * (height + 40) - 20,
        vx: 0,
        vy: (15 + Math.random() * 13) * (0.72 + depth * 0.34),
        vxDrift: (Math.random() - 0.44) * 7,
        size,
        depth,
        variant,
        swayAmp: 10 + Math.random() * 14,
        swayFreq: 0.45 + Math.random() * 0.45,
        swayPhase: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.5,
        flipPhase: Math.random() * Math.PI * 2,
        flipSpeed: 0.65 + Math.random() * 0.8,
        pitchPhase: Math.random() * Math.PI * 2,
        pitchSpeed: 0.5 + Math.random() * 0.65,
        alpha: 0.14 + depth * 0.12
      };
    }

    function syncAmbientPool() {
      const desired = targetAmbientCount();
      while (ambientPetals.length < desired) {
        ambientPetals.push(createAmbientPetal(false));
      }
      if (ambientPetals.length > desired) {
        ambientPetals.length = desired;
      }
    }

    function resize() {
      width = window.innerWidth || document.documentElement.clientWidth || 375;
      height = window.innerHeight || document.documentElement.clientHeight || 667;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      [bgCanvas, fxCanvas].forEach((cvs) => {
        cvs.width = Math.round(width * dpr);
        cvs.height = Math.round(height * dpr);
        cvs.style.width = width + "px";
        cvs.style.height = height + "px";
      });

      bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      syncAmbientPool();
    }

    function drawPetalSprite(ctx, p, extraAlpha) {
      const spritePair = petalSprites[p.variant % petalSprites.length];
      const cosFlip = Math.cos(p.flipPhase);
      const sinPitch = Math.sin(p.pitchPhase);
      const sprite = cosFlip >= 0 ? spritePair.front : spritePair.back;

      // 3D foreshortening when petal tumbles and pitches in air
      const scaleX = 0.84 + Math.cos(p.pitchPhase) * 0.16;
      const scaleY = (0.36 + Math.abs(cosFlip) * 0.64) * (0.86 + sinPitch * 0.14);
      const shearX = sinPitch * 0.14;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot + Math.sin(p.swayPhase) * 0.18);
      ctx.transform(scaleX, shearX, 0, scaleY, 0, 0);
      ctx.globalAlpha = Math.max(
        0,
        Math.min(1, p.alpha * extraAlpha * (0.8 + Math.abs(cosFlip) * 0.2))
      );

      const drawSize = p.size * 1.45;
      ctx.drawImage(sprite, -drawSize * 0.5, -drawSize * 0.5, drawSize, drawSize);
      ctx.restore();
    }

    // Spawn touch/click blossom effect at (x, y)
    function spawnTouchBlossom(x, y) {
      // Keep pool bounded if user taps rapidly
      if (touchRipples.length > 8) touchRipples.shift();
      if (touchPetals.length > 42) touchPetals.splice(0, 8);
      if (touchSparks.length > 36) touchSparks.splice(0, 8);

      touchRipples.push({
        x,
        y,
        age: 0,
        duration: 0.72,
        maxRadius: width <= 680 ? 44 : 54,
        rot: (Math.random() - 0.5) * 0.5
      });

      const burstCount = width <= 680 ? 6 : 7;
      for (let i = 0; i < burstCount; i++) {
        const baseAngle = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.45;
        const speed = 38 + Math.random() * 52;
        const size = 11 + Math.random() * 7;

        touchPetals.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          vx: Math.cos(baseAngle) * speed,
          vy: Math.sin(baseAngle) * speed - 18,
          size,
          variant: Math.floor(Math.random() * petalSprites.length),
          swayPhase: Math.random() * Math.PI * 2,
          swayFreq: 2.2 + Math.random() * 1.5,
          rot: baseAngle + Math.PI * 0.5 + (Math.random() - 0.5) * 0.6,
          rotSpeed: (Math.random() - 0.5) * 3.2,
          flipPhase: Math.random() * Math.PI * 2,
          flipSpeed: 2.4 + Math.random() * 2.2,
          pitchPhase: Math.random() * Math.PI * 2,
          pitchSpeed: 1.8 + Math.random() * 1.6,
          alpha: 0.52 + Math.random() * 0.18,
          age: 0,
          duration: 1.15 + Math.random() * 0.45
        });
      }

      // Delicate gothic stardust motes
      const sparkCount = 4;
      for (let i = 0; i < sparkCount; i++) {
        const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 1.4;
        const speed = 24 + Math.random() * 38;
        touchSparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 10,
          size: 2.2 + Math.random() * 2.2,
          age: 0,
          duration: 0.65 + Math.random() * 0.3
        });
      }
    }

    function drawTouchRipple(ctx, r) {
      const progress = Math.min(1, r.age / r.duration);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const fade = Math.pow(1 - progress, 1.65);
      const radius = 6 + r.maxRadius * easeOut;

      ctx.save();
      ctx.translate(r.x, r.y);

      // Outer soft ink halo ring
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(42, 39, 50, " + (0.24 * fade).toFixed(3) + ")";
      ctx.lineWidth = 1.25;
      ctx.stroke();

      // Inner delicate scalloped ring
      const innerR = radius * 0.64;
      ctx.beginPath();
      ctx.arc(0, 0, innerR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(120, 116, 134, " + (0.2 * fade).toFixed(3) + ")";
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center 4-point gothic star crest that blooms and vanishes early
      if (progress < 0.65) {
        const starFade = 1 - progress / 0.65;
        const starScale = (0.6 + easeOut * 0.7) * 6.5;
        ctx.rotate(r.rot + progress * 0.35);
        ctx.fillStyle = "rgba(38, 36, 46, " + (0.34 * starFade).toFixed(3) + ")";
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2;
          const nextA = a + Math.PI / 4;
          if (i === 0) ctx.moveTo(Math.cos(a) * starScale, Math.sin(a) * starScale);
          else ctx.lineTo(Math.cos(a) * starScale, Math.sin(a) * starScale);
          ctx.lineTo(
            Math.cos(nextA) * (starScale * 0.24),
            Math.sin(nextA) * (starScale * 0.24)
          );
        }
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    function drawSparkMote(ctx, sp) {
      const progress = Math.min(1, sp.age / sp.duration);
      const fade = 1 - progress;
      const r = sp.size * (0.7 + Math.sin(progress * Math.PI) * 0.45);

      ctx.save();
      ctx.translate(sp.x, sp.y);
      ctx.rotate(progress * 1.6);
      ctx.fillStyle = "rgba(54, 51, 64, " + (0.38 * fade).toFixed(3) + ")";
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(r * 0.18, -r * 0.18, r, 0);
      ctx.quadraticCurveTo(r * 0.18, r * 0.18, 0, r);
      ctx.quadraticCurveTo(-r * 0.18, r * 0.18, -r, 0);
      ctx.quadraticCurveTo(-r * 0.18, -r * 0.18, 0, -r);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    window.addEventListener(
      "pointerdown",
      (e) => {
        if (typeof e.clientX !== "number" || typeof e.clientY !== "number") return;
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.active = true;
        spawnTouchBlossom(e.clientX, e.clientY);
      },
      { passive: true }
    );

    window.addEventListener(
      "pointermove",
      (e) => {
        if (typeof e.clientX !== "number" || typeof e.clientY !== "number") return;
        if (pointer.active) {
          pointer.vx = e.clientX - pointer.x;
          pointer.vy = e.clientY - pointer.y;
        }
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.active = true;
      },
      { passive: true }
    );

    resize();
    window.addEventListener("resize", resize, { passive: true });

    let prevTime = performance.now();

    function tick(now) {
      if (document.hidden) {
        prevTime = now;
        requestAnimationFrame(tick);
        return;
      }

      const dt = Math.min(0.05, Math.max(0.001, (now - prevTime) * 0.001));
      prevTime = now;

      bgCtx.clearRect(0, 0, width, height);
      fxCtx.clearRect(0, 0, width, height);

      const globalBreeze =
        Math.sin(now * 0.00024) * 5.5 + Math.cos(now * 0.00013) * 3.5;

      pointer.vx *= 0.88;
      pointer.vy *= 0.88;

      // 1. Update & Draw Ambient Background Petals
      for (let i = 0; i < ambientPetals.length; i++) {
        const p = ambientPetals[i];
        p.swayPhase += p.swayFreq * dt;
        p.flipPhase += p.flipSpeed * dt;
        p.pitchPhase += p.pitchSpeed * dt;
        p.rot += p.rotSpeed * dt;

        // Subtle air current swirl when finger/cursor moves near a background petal
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 9600 && distSq > 4) {
            const dist = Math.sqrt(distSq);
            const push = (1 - dist / 98) * 18 * dt;
            p.vx += (dx / dist) * push + pointer.vx * 0.08 * dt;
            p.rotSpeed += (Math.random() - 0.5) * 0.08;
          }
        }

        p.vx *= 0.95;
        const swayVx = Math.cos(p.swayPhase) * p.swayAmp;
        const liftVy = Math.sin(p.swayPhase * 2) * 2.5;

        p.x += (p.vx + p.vxDrift + swayVx + globalBreeze * p.depth * 0.35) * dt;
        p.y += (p.vy + liftVy) * dt;

        if (p.y > height + 38) {
          ambientPetals[i] = createAmbientPetal(true);
          ambientPetals[i].y = -28 - Math.random() * 20;
          continue;
        }

        if (p.x < -55) p.x = width + 45;
        else if (p.x > width + 55) p.x = -45;

        drawPetalSprite(bgCtx, p, 1);
      }

      // 2. Update & Draw Touch Ripples
      for (let i = touchRipples.length - 1; i >= 0; i--) {
        const r = touchRipples[i];
        r.age += dt;
        if (r.age >= r.duration) {
          touchRipples.splice(i, 1);
          continue;
        }
        drawTouchRipple(fxCtx, r);
      }

      // 3. Update & Draw Touch Sparks
      for (let i = touchSparks.length - 1; i >= 0; i--) {
        const sp = touchSparks[i];
        sp.age += dt;
        if (sp.age >= sp.duration) {
          touchSparks.splice(i, 1);
          continue;
        }
        sp.vx *= 0.94;
        sp.vy = sp.vy * 0.94 + 28 * dt;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        drawSparkMote(fxCtx, sp);
      }

      // 4. Update & Draw Touch Blossom Petals
      for (let i = touchPetals.length - 1; i >= 0; i--) {
        const p = touchPetals[i];
        p.age += dt;
        if (p.age >= p.duration) {
          touchPetals.splice(i, 1);
          continue;
        }

        const lifeRatio = p.age / p.duration;
        const fade =
          lifeRatio < 0.15
            ? lifeRatio / 0.15
            : Math.pow(1 - (lifeRatio - 0.15) / 0.85, 1.35);

        p.swayPhase += p.swayFreq * dt;
        p.flipPhase += p.flipSpeed * dt;
        p.pitchPhase += p.pitchSpeed * dt;
        p.rot += p.rotSpeed * dt;

        // Air drag slows initial burst, then gravity + gentle flutter takes over
        const drag = Math.pow(0.08, dt);
        p.vx = p.vx * drag + Math.cos(p.swayPhase) * 14 * dt;
        p.vy = p.vy * drag + 46 * dt;

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        drawPetalSprite(fxCtx, p, fade);
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        prevTime = performance.now();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGothicRosePetalsAndTouch);
  } else {
    initGothicRosePetalsAndTouch();
  }
})();
