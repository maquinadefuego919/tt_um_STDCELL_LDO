/* Chip Design Club · Publicaciones
   Todo el movimiento va ligado al scroll: no hay botones ni controles.
   Sin dependencias; un solo bucle de animación con requestAnimationFrame. */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  /* ---------- aparición de cada bloque al entrar en pantalla ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-active"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -18% 0px", threshold: .12 });
  $$(".scene, .seq").forEach(function (s) { io.observe(s); });

  /* ---------- cifras que suben al aparecer ---------- */
  var counters = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      counters.unobserve(e.target);
      var el = e.target, end = parseFloat(el.dataset.count), suf = el.dataset.suffix || "", dec = el.dataset.dec | 0;
      if (reduce) { el.textContent = end.toFixed(dec) + suf; return; }
      var t0 = performance.now();
      (function step(t) {
        var k = clamp((t - t0) / 900, 0, 1);
        el.textContent = (end * (1 - Math.pow(1 - k, 3))).toFixed(dec) + suf;
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: .6 });
  $$("[data-count]").forEach(function (el) { counters.observe(el); });

  /* ---------- registro de efectos ligados al scroll ---------- */
  var effects = [];

  /* 1 · parallax suave */
  $$("[data-parallax]").forEach(function (el) {
    var amount = parseFloat(el.dataset.parallax) || 40;
    effects.push(function (vh) {
      var r = el.getBoundingClientRect();
      var p = (r.top + r.height / 2 - vh / 2) / vh;      // −1 arriba … +1 abajo
      el.style.transform = "translate3d(0," + (-p * amount).toFixed(1) + "px,0)";
    });
  });

  /* utilidad: progreso 0→1 de una secuencia fija */
  function seqProgress(seq, vh) {
    var r = seq.getBoundingClientRect();
    var total = r.height - vh;
    return total <= 0 ? 0 : clamp(-r.top / total, 0, 1);
  }
  function stepOf(p, steps) {                            // índice y fracción dentro del paso
    var x = clamp(p, 0, .9999) * steps;
    return { i: Math.floor(x), f: x - Math.floor(x) };
  }
  function labels(seq) {
    var els = $$(".step-label > div", seq), ticks = $$(".ticks i", seq);
    return function (i) {
      els.forEach(function (e, k) { e.classList.toggle("on", k === i); });
      ticks.forEach(function (t, k) { t.classList.toggle("on", k <= i); });
    };
  }

  /* 2 · recorrido por el layout: el chip se acerca a cada bloque */
  $$('[data-seq="zoom"]').forEach(function (seq) {
    var stage = $(".stage", seq), marker = $(".marker", seq);
    var overlay = $(".overlay", seq);                     // opcional: imagen que aparece al primer paso
    var scale = overlay && $(".scalebar", seq);           // con overlay, la escala se va al acercarse
    var blocks = JSON.parse(seq.dataset.blocks);          // [{l,t,w,h,z}] en % del layout
    var setLabel = labels(seq);
    var states = [{ ox: 50, oy: 50, z: 1 }].concat(blocks.map(function (b) {
      return { ox: b.l + b.w / 2, oy: b.t + b.h / 2, z: b.z, b: b };
    }));
    effects.push(function (vh) {
      var p = seqProgress(seq, vh), st = stepOf(p, states.length - 1);
      var a = states[st.i], b = states[Math.min(st.i + 1, states.length - 1)], t = ease(st.f);
      var ox = lerp(a.ox, b.ox, t), oy = lerp(a.oy, b.oy, t), z = lerp(a.z, b.z, t);
      stage.style.transformOrigin = ox.toFixed(2) + "% " + oy.toFixed(2) + "%";
      stage.style.transform = "scale(" + z.toFixed(3) + ")";
      if (overlay) overlay.style.opacity = clamp(p * (states.length - 1), 0, 1).toFixed(3);
      if (scale) scale.style.opacity = (1 - clamp(p * (states.length - 1) * 2, 0, 1)).toFixed(3);
      var cur = t > .5 ? b : a;                           // bloque dominante
      setLabel(states.indexOf(cur));
      if (marker) {
        marker.classList.toggle("on", !!cur.b && z > 1.2);
        if (cur.b) {
          marker.style.left = cur.b.l + "%"; marker.style.top = cur.b.t + "%";
          marker.style.width = cur.b.w + "%"; marker.style.height = cur.b.h + "%";
        }
      }
    });
  });

  /* 3 · la onda se transforma: muestras → escalones → senoidal → diferencial */
  $$('[data-seq="wave"]').forEach(function (seq) {
    var svg = $("svg", seq), setLabel = labels(seq);
    var W = 600, H = 210, pad = 18, cy = H / 2, A = H / 2 - pad * 1.7, N = 240, STEPS = 24, LEV = 8;
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    var mirror = document.createElementNS("http://www.w3.org/2000/svg", "path");
    var axis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    axis.setAttribute("x1", pad); axis.setAttribute("x2", W - pad);
    axis.setAttribute("y1", cy); axis.setAttribute("y2", cy);
    axis.setAttribute("stroke", "rgba(255,255,255,.14)");
    mirror.setAttribute("fill", "none"); mirror.setAttribute("stroke", "#eef2f8");
    mirror.setAttribute("stroke-opacity", ".5"); mirror.setAttribute("stroke-width", "2");
    mirror.setAttribute("stroke-dasharray", "6 5");
    path.setAttribute("fill", "none"); path.setAttribute("stroke-width", "3"); path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(axis); svg.appendChild(mirror); svg.appendChild(path);
    var dots = [];
    for (var d = 0; d < STEPS; d++) {
      var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("r", "4.5"); svg.appendChild(c); dots.push(c);
    }
    var sine = function (f) { return Math.sin(2 * Math.PI * f); };
    var quant = function (v) { return Math.round(v * LEV) / LEV; };            // cuantización de amplitud
    var hold = function (f) { return Math.floor(f * STEPS) / STEPS; };         // muestreo y retención

    effects.push(function (vh) {
      var p = seqProgress(seq, vh), st = stepOf(p, 3), t = ease(st.f), i = st.i;
      var acc = getComputedStyle(document.body).getPropertyValue("--acc").trim();
      path.setAttribute("stroke", acc);
      var pts = [], k, f, v;
      for (k = 0; k <= N; k++) {
        f = k / N;
        var vHold = quant(sine(hold(f)));      // etapa 0: muestras cuantizadas
        var vStep = sine(hold(f));             // etapa 1: escalones del DAC
        var vSine = sine(f);                   // etapas 2 y 3: onda continua
        if (i === 0) v = lerp(vHold, vStep, t);
        else if (i === 1) v = lerp(vStep, vSine, t);
        else v = vSine;
        pts.push((pad + f * (W - 2 * pad)).toFixed(1) + "," + (cy - A * v).toFixed(1));
      }
      path.setAttribute("d", "M" + pts.join(" L"));
      // los puntos de muestreo solo existen en la primera etapa
      var op = i === 0 ? 1 - t : 0;
      dots.forEach(function (c, n) {
        var ff = n / STEPS;
        c.setAttribute("cx", (pad + ff * (W - 2 * pad)).toFixed(1));
        c.setAttribute("cy", (cy - A * quant(sine(ff))).toFixed(1));
        c.setAttribute("fill", acc); c.setAttribute("opacity", op.toFixed(2));
      });
      // la señal espejo aparece en la última etapa
      var mop = i === 2 ? t : 0;
      mirror.setAttribute("opacity", mop.toFixed(2));
      if (mop > 0) {
        var m = [];
        for (k = 0; k <= N; k++) { f = k / N; m.push((pad + f * (W - 2 * pad)).toFixed(1) + "," + (cy + A * sine(f)).toFixed(1)); }
        mirror.setAttribute("d", "M" + m.join(" L"));
      }
      setLabel(t > .5 ? Math.min(i + 1, 3) : i);
    });
  });

  /* 4 · la carga sube y el arreglo enciende inversores; la salida no se mueve */
  $$('[data-seq="load"]').forEach(function (seq) {
    var grid = $(".grid", seq), read = $(".read", seq), svg = $("svg", seq), setLabel = labels(seq);
    for (var i = 0; i < 128; i++) grid.appendChild(document.createElement("i"));
    var cells = $$("i", grid);
    var W = 600, H = 120;
    var vin = document.createElementNS("http://www.w3.org/2000/svg", "path");
    var vout = document.createElementNS("http://www.w3.org/2000/svg", "path");
    vin.setAttribute("fill", "none"); vin.setAttribute("stroke", "#8f99ad"); vin.setAttribute("stroke-width", "2"); vin.setAttribute("stroke-dasharray", "5 4");
    vout.setAttribute("fill", "none"); vout.setAttribute("stroke-width", "3");
    svg.appendChild(vin); svg.appendChild(vout);

    effects.push(function (vh) {
      var p = seqProgress(seq, vh);
      var load = Math.round(p * 100), on = Math.round(p * 128);
      var acc = getComputedStyle(document.body).getPropertyValue("--acc").trim();
      cells.forEach(function (c, k) { c.classList.toggle("on", k < on); });
      read.innerHTML = '<span>Carga <b>' + load + ' %</b></span><span>Inversores activos <b>' + on + ' / 128</b></span>';
      // V_IN ondula con la carga, V_OUT se mantiene plano
      var a = [], b = [], k, f;
      for (k = 0; k <= 120; k++) {
        f = k / 120;
        a.push((f * W).toFixed(1) + "," + (30 + Math.sin(f * 14 + p * 6) * (4 + p * 10)).toFixed(1));
        b.push((f * W).toFixed(1) + "," + 86);
      }
      vin.setAttribute("d", "M" + a.join(" L"));
      vout.setAttribute("stroke", acc);
      vout.setAttribute("d", "M" + b.join(" L"));
      setLabel(p > .66 ? 2 : (p > .33 ? 1 : 0));
    });
  });

  /* 5 · RISC-V: LOAD → RUN → BLOCKLOAD → RUN. Un solo registro de modo decide quién usa la memoria */
  $$('[data-seq="modes"]').forEach(function (seq) {
    var svg = $("svg", seq), setLabel = labels(seq), NS = "http://www.w3.org/2000/svg";
    function mk(tag, attrs, parent) {
      var e = document.createElementNS(NS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      (parent || svg).appendChild(e); return e;
    }
    function tx(x, y, s, cls, anchor, parent) {
      var t = mk("text", { x: x, y: y, "class": cls || "", "text-anchor": anchor || "start" }, parent);
      t.textContent = s; return t;
    }
    function arrow(x1, y1, x2, y2) {
      var g = mk("g", { "class": "flow" }), dir = x2 > x1 ? 1 : (x2 < x1 ? -1 : 0);
      mk("line", { x1: x1, y1: y1, x2: x2 - dir * 6, y2: y2 - (dir ? 0 : 6) }, g);
      mk("path", { d: dir ? "M" + x2 + "," + y2 + " l" + (-dir * 8) + ",-5 v10 z" : "M" + x2 + "," + y2 + " l-5,-8 h10 z" }, g);
      return g;
    }
    // modo actual: las mismas tres combinaciones que salen por uo_out[7:6]
    var pills = [["LOAD", "00"], ["RUN", "01"], ["BLOCKLOAD", "10"]].map(function (m, k) {
      var g = mk("g", { "class": "pill" });
      mk("rect", { x: k * 136, y: 2, width: 128, height: 30 }, g);
      tx(k * 136 + 64, 22, m[0] + " · " + m[1], "", "middle", g);
      return g;
    });
    // UART (bloque 0) · memoria de instrucciones · memoria SPI (bloques 1…)
    mk("rect", { x: 0, y: 64, width: 74, height: 54, "class": "box" });
    tx(37, 86, "UART", "hd", "middle"); tx(37, 104, "bloque 0", "sm", "middle");
    mk("rect", { x: 100, y: 48, width: 200, height: 192, "class": "box" });
    var title = tx(200, 66, "", "sm", "middle");
    var slots = [], k;
    for (k = 0; k < 8; k++) {
      tx(118, 88 + k * 19, "w" + k, "sm", "end");
      slots.push(mk("rect", { x: 124, y: 77 + k * 19, width: 140, height: 15, "class": "slot" }));
    }
    var pc = mk("g", { "class": "pc" });
    mk("path", { d: "M268,0 l10,-6 v12 z" }, pc);
    tx(281, 4, "PC", "pcl", "start", pc);
    mk("rect", { x: 326, y: 48, width: 74, height: 192, "class": "box" });
    tx(363, 66, "SPI", "hd", "middle");
    var blocks = [];
    for (k = 0; k < 5; k++) {
      blocks.push(mk("rect", { x: 336, y: 78 + k * 31, width: 54, height: 24, "class": "blk" }));
      tx(363, 94 + k * 31, "B" + (k + 1), "sm", "middle");
    }
    var aUart = arrow(74, 91, 100, 91), aSpi = arrow(326, 160, 300, 160), aCpu = arrow(200, 240, 200, 258);
    var req = tx(313, 150, "0x4C", "req", "middle");
    mk("rect", { x: 100, y: 258, width: 200, height: 34, "class": "box cpu" });
    tx(200, 280, "CPU · 1 instrucción/ciclo", "hd", "middle");
    mk("rect", { x: 314, y: 258, width: 86, height: 34, "class": "box" });
    tx(357, 272, "x1 … x31", "sm", "middle"); var regs = tx(357, 286, "", "req", "middle");
    var out = tx(0, 318, "", "out");
    var bytes = ["0D", "07", "08", "10", "AA"];

    effects.push(function (vh) {
      var p = seqProgress(seq, vh), st = stepOf(p, 4), i = st.i, f = st.f;
      var mode = [0, 1, 2, 1][i];
      pills.forEach(function (g, n) { g.setAttribute("class", "pill" + (n === mode ? " on" : "")); });
      aUart.setAttribute("class", "flow" + (i === 0 ? " on" : ""));
      aSpi.setAttribute("class", "flow" + (i === 2 ? " on" : ""));
      aCpu.setAttribute("class", "flow" + (mode === 1 ? " on" : ""));
      req.style.opacity = i === 2 ? 1 : 0;
      regs.textContent = i === 3 ? "se conservan" : "";
      var n = Math.min(7, Math.floor(f * 8));             // instrucción en ejecución
      var filled = Math.min(8, Math.floor(f * 9));        // palabras recibidas
      slots.forEach(function (s, k) {
        var c = "slot";
        if (i === 0) c += k < filled ? " lleno" : "";
        else if (i === 2) c += k < filled ? " lleno" : " viejo";
        else c += k === n ? " exec" : " lleno";
        s.setAttribute("class", c);
      });
      title.textContent = (i < 2 || (i === 2 && filled === 0)) ? "8 × 32 bits · bloque 0" : "8 × 32 bits · bloque 1";
      blocks.forEach(function (b, k) { b.setAttribute("class", "blk" + (k === 0 && i >= 2 ? " on" : "")); });
      pc.style.opacity = mode === 1 ? 1 : 0;
      pc.setAttribute("transform", "translate(0," + (84.5 + n * 19) + ")");
      var sent = i === 0 ? 0 : i === 1 ? (n >= 6 ? 2 : n >= 3 ? 1 : 0) : i === 2 ? 2 : 2 + (n >= 6 ? 3 : n >= 4 ? 2 : n >= 2 ? 1 : 0);
      out.textContent = "TX › " + (sent ? bytes.slice(0, sent).join(" ") : "…");
      setLabel(i);
    });
  });

  /* ---------- barra de progreso de la publicación ---------- */
  var bars = $(".bars");
  if (bars) {
    var chapters = $$(".scene, .seq");
    chapters.forEach(function () { bars.appendChild(document.createElement("i")); });
    var segs = $$("i", bars);
    effects.push(function (vh) {
      var mid = vh / 2, cur = 0;
      chapters.forEach(function (c, k) { if (c.getBoundingClientRect().top <= mid) cur = k; });
      segs.forEach(function (s, k) { s.className = k <= cur ? "done" : ""; });
    });
  }

  /* ---------- un solo bucle ---------- */
  function run() {
    var vh = innerHeight;
    for (var i = 0; i < effects.length; i++) {
      try { effects[i](vh); } catch (e) { /* un efecto con problemas no debe detener a los demás */ }
    }
  }
  // Se actualiza en el propio evento de scroll: son unas cuantas escrituras de estilo,
  // y así funciona también cuando el navegador tiene pausadas las animaciones.
  addEventListener("scroll", run, { passive: true });
  addEventListener("resize", run);
  run();

  /* ---------- pista inferior ----------
     Se ve al inicio, dentro de las secuencias fijas (donde el contenido parece detenido aunque
     falte bajar) y si el lector se queda quieto unos segundos en la primera pantalla; nunca al final. */
  var hint = $(".hint");
  if (hint) {
    var hintTxt = $("span", hint), firstTxt = hintTxt ? hintTxt.textContent : "";
    var seqs = $$(".seq"), quiet = false, timer = 0;
    var updHint = function () {
      var y = scrollY, vh = innerHeight;
      var atEnd = y >= document.documentElement.scrollHeight - vh - 60;
      var inSeq = seqs.some(function (q) { var r = q.getBoundingClientRect(); return r.top <= 1 && r.bottom > vh * 1.08; });
      hint.classList.toggle("gone", atEnd || !(y < 40 || inSeq || (quiet && y < vh)));
      if (hintTxt) hintTxt.textContent = y < 40 ? firstTxt : "Sigue bajando";
    };
    addEventListener("scroll", function () {
      quiet = false; clearTimeout(timer);
      timer = setTimeout(function () { quiet = true; updHint(); }, 5000);
      updHint();
    }, { passive: true });
    addEventListener("resize", updHint);
    updHint();
  }
})();
