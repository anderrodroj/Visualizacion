/* =========================================================
   COLOMBIA EDUCATION STORYTELLING — main.js
   Requires: D3 v7, data.js (window.EDU_DATA)
   ========================================================= */

(function () {
  'use strict';

  /* ── Palette ─────────────────────────────────────────── */
  const C = {
    accent:  '#f5c842',
    red:     '#e84040',
    blue:    '#3d9be9',
    green:   '#45c97d',
    orange:  '#f07832',
    muted:   '#8888aa',
    border:  'rgba(255,255,255,0.08)',
    bg:      '#0d0d0f',
    surface: '#1a1a26',
    text:    '#e8e8f0',
  };

  /* ── Helpers ─────────────────────────────────────────── */
  function fmtPct(v) { return v != null ? v.toFixed(1) + '%' : '–'; }

  function barColor(v) {
    if (v >= 90) return C.green;
    if (v >= 75) return C.accent;
    return C.red;
  }

  function getWidth(el) {
    return el.getBoundingClientRect().width || 600;
  }

  /* ── Tooltip ─────────────────────────────────────────── */
  const tip = d3.select('body').append('div').attr('class', 'tooltip');

  function showTip(event, html) {
    tip.style('display', 'block').html(html);
    moveTip(event);
  }
  function moveTip(event) {
    const x = event.clientX + 14;
    const y = event.clientY - 28;
    tip.style('left', x + 'px').style('top', y + 'px');
  }
  function hideTip() { tip.style('display', 'none'); }

  /* ── Scroll animation + deferred chart drawing ──────── */
  const chartDrawFns = {};   // keyed by section id → draw function

  const observer = new IntersectionObserver(
    (entries) => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        const fn = chartDrawFns[e.target.id];
        if (fn) {
          setTimeout(fn, 200);   // slight delay so fade-in starts first
          delete chartDrawFns[e.target.id];
        }
        observer.unobserve(e.target);
      }
    }),
    { threshold: 0.12 }
  );

  document.querySelectorAll('.chart-section').forEach(s => observer.observe(s));

  /* ── Data ────────────────────────────────────────────── */
  const DATA       = window.EDU_DATA;
  const national   = DATA.national;     // [{year, cobertura, desercion, repitencia, …}]
  const dept2024   = DATA.dept2024;     // [{dept, cobertura, desercion, repitencia, …}]

  /* ── Hero counter animation ──────────────────────────── */
  (function animateHero() {
    const el = document.getElementById('hero-number');
    const target = 53;
    let current = 0;
    const step = () => {
      current += 1;
      el.textContent = current;
      if (current < target) requestAnimationFrame(step);
    };
    setTimeout(() => requestAnimationFrame(step), 400);
  })();

  /* ════════════════════════════════════════════════════════
     CHART 1 — LA BRECHA  (horizontal bars by department)
  ═══════════════════════════════════════════════════════ */
  function drawBrecha() {
    const container = document.getElementById('chart-brecha');
    const W  = Math.min(getWidth(container), 680);
    const barH = 20;
    const gap  = 6;
    const n    = dept2024.length;
    const margin = { top: 20, right: 60, bottom: 40, left: 170 };
    const innerW = W - margin.left - margin.right;
    const innerH = n * (barH + gap);
    const H = innerH + margin.top + margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('width', '100%')
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleLinear().domain([0, 110]).range([0, innerW]);
    const y = d3.scaleBand()
      .domain(dept2024.map(d => d.dept))
      .range([0, innerH])
      .padding(0.25);

    // Grid lines
    g.append('g').attr('class', 'grid')
      .call(d3.axisBottom(x).tickValues([25, 50, 75, 100]).tickSize(innerH).tickFormat(''))
      .call(gg => gg.select('.domain').remove())
      .attr('transform', 'translate(0,0)');

    // Bars (animate from 0 width)
    g.selectAll('.bar')
      .data(dept2024)
      .join('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .attr('y', d => y(d.dept))
        .attr('height', y.bandwidth())
        .attr('width', 0)
        .attr('rx', 3)
        .attr('fill', d => barColor(d.cobertura))
        .attr('opacity', 0.85)
      .on('mouseover', (event, d) => {
        showTip(event, `<strong>${d.dept}</strong>Cobertura neta: ${fmtPct(d.cobertura)}<br>Deserción: ${fmtPct(d.desercion)}`);
        d3.select(event.currentTarget).attr('opacity', 1);
      })
      .on('mousemove', moveTip)
      .on('mouseleave', (event) => {
        hideTip();
        d3.select(event.currentTarget).attr('opacity', 0.85);
      })
      .transition().duration(900).delay((_, i) => i * 18)
        .attr('width', d => x(d.cobertura));

    // Value labels
    g.selectAll('.bar-label')
      .data(dept2024)
      .join('text')
        .attr('class', 'bar-label')
        .attr('x', d => x(d.cobertura) + 5)
        .attr('y', d => y(d.dept) + y.bandwidth() / 2 + 1)
        .attr('dominant-baseline', 'middle')
        .attr('font-family', 'system-ui, sans-serif')
        .attr('font-size', 10)
        .attr('fill', C.muted)
        .attr('opacity', 0)
        .text(d => fmtPct(d.cobertura))
      .transition().delay((_, i) => 300 + i * 18).duration(400)
        .attr('opacity', 1);

    // Y axis
    g.append('g').call(
      d3.axisLeft(y).tickSize(0)
    )
    .call(gg => gg.select('.domain').remove())
    .call(gg => gg.selectAll('text')
      .attr('font-family', 'system-ui, sans-serif')
      .attr('font-size', 11)
      .attr('fill', C.text)
      .attr('x', -6)
    );

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickValues([0, 25, 50, 75, 100]).tickFormat(d => d + '%'))
      .call(gg => gg.select('.domain').attr('stroke', C.border))
      .call(gg => gg.selectAll('text')
        .attr('font-family', 'system-ui, sans-serif')
        .attr('font-size', 10)
        .attr('fill', C.muted)
      );

    // Reference line at 100%
    g.append('line')
      .attr('x1', x(100)).attr('x2', x(100))
      .attr('y1', 0).attr('y2', innerH)
      .attr('stroke', 'rgba(255,255,255,0.2)')
      .attr('stroke-dasharray', '4 3');

    g.append('text')
      .attr('x', x(100) + 3)
      .attr('y', -6)
      .attr('font-family', 'system-ui, sans-serif')
      .attr('font-size', 9)
      .attr('fill', 'rgba(255,255,255,0.35)')
      .text('100%');
  }

  /* ════════════════════════════════════════════════════════
     CHART 2 — TENDENCIA  (cobertura neta line)
  ═══════════════════════════════════════════════════════ */
  function drawTendencia() {
    const container = document.getElementById('chart-tendencia');
    const W = Math.min(getWidth(container), 620);
    const H = 340;
    const margin = { top: 30, right: 30, bottom: 45, left: 55 };
    const iW = W - margin.left - margin.right;
    const iH = H - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('width', '100%');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([2011, 2024]).range([0, iW]);
    const y = d3.scaleLinear().domain([78, 95]).range([iH, 0]);

    // COVID band
    g.append('rect')
      .attr('x', x(2020)).attr('y', 0)
      .attr('width', x(2022) - x(2020))
      .attr('height', iH)
      .attr('fill', 'rgba(232,64,64,0.07)');

    g.append('text')
      .attr('x', x(2021))
      .attr('y', 12)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'system-ui, sans-serif')
      .attr('font-size', 10)
      .attr('fill', 'rgba(232,64,64,0.5)')
      .text('COVID-19');

    // Grid
    g.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).tickValues([80, 85, 90]).tickSize(-iW).tickFormat(''))
      .call(gg => gg.select('.domain').remove());

    // Line
    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.cobertura))
      .curve(d3.curveMonotoneX);

    const path = g.append('path')
      .datum(national)
      .attr('fill', 'none')
      .attr('stroke', C.blue)
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Animate stroke
    const totalLen = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', totalLen)
      .attr('stroke-dashoffset', totalLen)
      .transition().duration(1600).ease(d3.easeCubicInOut)
        .attr('stroke-dashoffset', 0);

    // Area fill
    const area = d3.area()
      .x(d => x(d.year))
      .y0(iH)
      .y1(d => y(d.cobertura))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(national)
      .attr('fill', 'url(#grad-blue)')
      .attr('d', area)
      .attr('opacity', 0)
      .transition().delay(800).duration(800)
        .attr('opacity', 1);

    // Gradient
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient')
      .attr('id', 'grad-blue')
      .attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1);
    grad.append('stop').attr('offset', '0%').attr('stop-color', C.blue).attr('stop-opacity', 0.2);
    grad.append('stop').attr('offset', '100%').attr('stop-color', C.blue).attr('stop-opacity', 0.01);

    // Dots
    g.selectAll('circle')
      .data(national)
      .join('circle')
        .attr('cx', d => x(d.year))
        .attr('cy', d => y(d.cobertura))
        .attr('r', 4)
        .attr('fill', C.blue)
        .attr('opacity', 0)
        .on('mouseover', (event, d) => showTip(event, `<strong>${d.year}</strong>Cobertura neta: ${fmtPct(d.cobertura)}`))
        .on('mousemove', moveTip)
        .on('mouseleave', hideTip)
      .transition().delay(1600).duration(300)
        .attr('opacity', 1);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${iH})`)
      .call(d3.axisBottom(x).tickFormat(d => d.toString()).ticks(7))
      .call(gg => gg.select('.domain').attr('stroke', C.border))
      .call(gg => gg.selectAll('text').attr('font-family', 'system-ui, sans-serif').attr('font-size', 10).attr('fill', C.muted));

    g.append('g')
      .call(d3.axisLeft(y).tickFormat(d => d + '%').ticks(5))
      .call(gg => gg.select('.domain').remove())
      .call(gg => gg.selectAll('text').attr('font-family', 'system-ui, sans-serif').attr('font-size', 10).attr('fill', C.muted));

    // Title
    g.append('text')
      .attr('class', 'chart-title')
      .attr('x', 0).attr('y', -12)
      .attr('fill', C.muted)
      .text('COBERTURA NETA PROMEDIO NACIONAL (%)');
  }

  /* ════════════════════════════════════════════════════════
     CHART 3 — COVID PARADOX  (deserción + repitencia dual)
  ═══════════════════════════════════════════════════════ */
  function drawCovid() {
    const container = document.getElementById('chart-covid');
    const W = Math.min(getWidth(container), 620);
    const H = 340;
    const margin = { top: 30, right: 30, bottom: 45, left: 55 };
    const iW = W - margin.left - margin.right;
    const iH = H - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('width', '100%');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([2011, 2024]).range([0, iW]);
    const maxY = d3.max(national, d => Math.max(d.desercion, d.repitencia)) + 1;
    const y = d3.scaleLinear().domain([0, maxY]).range([iH, 0]);

    // COVID band
    g.append('rect')
      .attr('x', x(2020)).attr('y', 0)
      .attr('width', x(2022) - x(2020))
      .attr('height', iH)
      .attr('fill', 'rgba(232,64,64,0.07)');

    g.append('text')
      .attr('x', x(2021)).attr('y', 12)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'system-ui, sans-serif')
      .attr('font-size', 10)
      .attr('fill', 'rgba(232,64,64,0.5)')
      .text('COVID-19');

    // Grid
    g.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5).tickSize(-iW).tickFormat(''))
      .call(gg => gg.select('.domain').remove());

    // Helper to draw animated line
    function drawLine(key, color, label, labelOffset) {
      const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d[key]))
        .curve(d3.curveMonotoneX);

      const path = g.append('path')
        .datum(national)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2.5)
        .attr('d', line);

      const len = path.node().getTotalLength();
      path.attr('stroke-dasharray', len).attr('stroke-dashoffset', len)
        .transition().duration(1600).ease(d3.easeCubicInOut)
          .attr('stroke-dashoffset', 0);

      // Dots
      g.selectAll(`.dot-${key}`)
        .data(national)
        .join('circle')
          .attr('class', `dot-${key}`)
          .attr('cx', d => x(d.year))
          .attr('cy', d => y(d[key]))
          .attr('r', 3.5)
          .attr('fill', color)
          .attr('opacity', 0)
          .on('mouseover', (event, d) => showTip(event, `<strong>${d.year}</strong>${label}: ${fmtPct(d[key])}`))
          .on('mousemove', moveTip)
          .on('mouseleave', hideTip)
        .transition().delay(1600).duration(300)
          .attr('opacity', 1);

      // Legend label at last point
      const last = national[national.length - 1];
      g.append('text')
        .attr('x', x(last.year) + 6)
        .attr('y', y(last[key]) + labelOffset)
        .attr('font-family', 'system-ui, sans-serif')
        .attr('font-size', 11)
        .attr('fill', color)
        .attr('font-weight', '700')
        .attr('opacity', 0)
        .text(label)
        .transition().delay(1700).duration(300)
          .attr('opacity', 1);
    }

    drawLine('desercion',  C.blue,  'Deserción',  0);
    drawLine('repitencia', C.red,   'Repitencia', 14);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${iH})`)
      .call(d3.axisBottom(x).tickFormat(d => d.toString()).ticks(7))
      .call(gg => gg.select('.domain').attr('stroke', '#333'))
      .call(gg => gg.selectAll('text').attr('font-family', 'system-ui, sans-serif').attr('font-size', 10).attr('fill', C.muted));

    g.append('g')
      .call(d3.axisLeft(y).tickFormat(d => d + '%').ticks(5))
      .call(gg => gg.select('.domain').remove())
      .call(gg => gg.selectAll('text').attr('font-family', 'system-ui, sans-serif').attr('font-size', 10).attr('fill', C.muted));

    g.append('text')
      .attr('class', 'chart-title')
      .attr('x', 0).attr('y', -12)
      .attr('fill', C.muted)
      .text('DESERCIÓN Y REPITENCIA NACIONAL (%)');
  }

  /* ════════════════════════════════════════════════════════
     CHART 4 — LA SOMBRA  (repitencia area)
  ═══════════════════════════════════════════════════════ */
  function drawSombra() {
    const container = document.getElementById('chart-sombra');
    const W = Math.min(getWidth(container), 620);
    const H = 320;
    const margin = { top: 30, right: 30, bottom: 45, left: 55 };
    const iW = W - margin.left - margin.right;
    const iH = H - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('width', '100%');

    const defs = svg.append('defs');
    const grad = defs.append('linearGradient')
      .attr('id', 'grad-repitencia').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1);
    grad.append('stop').attr('offset', '0%').attr('stop-color', C.red).attr('stop-opacity', 0.7);
    grad.append('stop').attr('offset', '100%').attr('stop-color', C.red).attr('stop-opacity', 0.03);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([2011, 2024]).range([0, iW]);
    const maxRep = d3.max(national, d => d.repitencia);
    const y = d3.scaleLinear().domain([0, maxRep + 1]).range([iH, 0]);

    // COVID band
    g.append('rect')
      .attr('x', x(2020)).attr('y', 0)
      .attr('width', x(2022) - x(2020))
      .attr('height', iH)
      .attr('fill', 'rgba(255,165,0,0.06)');

    // Grid
    g.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5).tickSize(-iW).tickFormat(''))
      .call(gg => gg.select('.domain').remove());

    // Pre-COVID baseline (2017 value = 2.94%)
    const baseline = 2.94;
    g.append('line')
      .attr('x1', 0).attr('x2', iW)
      .attr('y1', y(baseline)).attr('y2', y(baseline))
      .attr('stroke', C.muted)
      .attr('stroke-dasharray', '5 4')
      .attr('opacity', 0.5);

    g.append('text')
      .attr('x', 5).attr('y', y(baseline) - 6)
      .attr('font-family', 'system-ui, sans-serif')
      .attr('font-size', 10)
      .attr('fill', C.muted)
      .text('Nivel pre-COVID (2.9%)');

    // Area
    const area = d3.area()
      .x(d => x(d.year))
      .y0(iH)
      .y1(d => y(d.repitencia))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(national)
      .attr('fill', 'url(#grad-repitencia)')
      .attr('d', area)
      .attr('opacity', 0)
      .transition().duration(1000)
        .attr('opacity', 1);

    // Line
    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.repitencia))
      .curve(d3.curveMonotoneX);

    const path = g.append('path')
      .datum(national)
      .attr('fill', 'none')
      .attr('stroke', C.red)
      .attr('stroke-width', 2.5)
      .attr('d', line);

    const len = path.node().getTotalLength();
    path.attr('stroke-dasharray', len).attr('stroke-dashoffset', len)
      .transition().duration(1600).ease(d3.easeCubicInOut)
        .attr('stroke-dashoffset', 0);

    // Peak annotation (2023)
    const peak = national.find(d => d.year === 2023);
    if (peak) {
      g.append('circle')
        .attr('cx', x(2023)).attr('cy', y(peak.repitencia))
        .attr('r', 6).attr('fill', C.red).attr('opacity', 0)
        .transition().delay(1700).duration(300).attr('opacity', 1);

      g.append('text')
        .attr('x', x(2023) + 8)
        .attr('y', y(peak.repitencia) - 8)
        .attr('font-family', 'system-ui, sans-serif')
        .attr('font-size', 11)
        .attr('font-weight', '700')
        .attr('fill', C.red)
        .attr('opacity', 0)
        .text('Récord: ' + fmtPct(peak.repitencia))
        .transition().delay(1800).duration(300).attr('opacity', 1);
    }

    // Dots
    g.selectAll('.rpt-dot')
      .data(national)
      .join('circle')
        .attr('class', 'rpt-dot')
        .attr('cx', d => x(d.year))
        .attr('cy', d => y(d.repitencia))
        .attr('r', 3.5)
        .attr('fill', C.red)
        .attr('opacity', 0)
        .on('mouseover', (event, d) => showTip(event, `<strong>${d.year}</strong>Repitencia: ${fmtPct(d.repitencia)}`))
        .on('mousemove', moveTip)
        .on('mouseleave', hideTip)
      .transition().delay(1800).duration(300).attr('opacity', 1);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${iH})`)
      .call(d3.axisBottom(x).tickFormat(d => d.toString()).ticks(7))
      .call(gg => gg.select('.domain').attr('stroke', '#333'))
      .call(gg => gg.selectAll('text').attr('font-family', 'system-ui, sans-serif').attr('font-size', 10).attr('fill', C.muted));

    g.append('g')
      .call(d3.axisLeft(y).tickFormat(d => d + '%').ticks(5))
      .call(gg => gg.select('.domain').remove())
      .call(gg => gg.selectAll('text').attr('font-family', 'system-ui, sans-serif').attr('font-size', 10).attr('fill', C.muted));

    g.append('text')
      .attr('class', 'chart-title')
      .attr('x', 0).attr('y', -12)
      .attr('fill', C.muted)
      .text('TASA DE REPITENCIA NACIONAL (%)');
  }

  /* ════════════════════════════════════════════════════════
     CHART 5 — DESERCIÓN POR DEPARTAMENTO 2024
  ═══════════════════════════════════════════════════════ */
  function drawDesercion() {
    const container = document.getElementById('chart-desercion');
    const W = Math.min(getWidth(container), 620);

    // Top 20 by desercion
    const data = [...dept2024]
      .filter(d => d.desercion != null)
      .sort((a, b) => b.desercion - a.desercion)
      .slice(0, 20);

    const barH = 20;
    const gap  = 6;
    const n    = data.length;
    const margin = { top: 20, right: 60, bottom: 40, left: 170 };
    const innerW = W - margin.left - margin.right;
    const innerH = n * (barH + gap);
    const H = innerH + margin.top + margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('width', '100%');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const maxD = d3.max(data, d => d.desercion);
    const x = d3.scaleLinear().domain([0, Math.ceil(maxD + 0.5)]).range([0, innerW]);
    const y = d3.scaleBand()
      .domain(data.map(d => d.dept))
      .range([0, innerH])
      .padding(0.25);

    // Color scale: green → orange → red
    const colorScale = d3.scaleSequential()
      .domain([d3.min(data, d => d.desercion), maxD])
      .interpolator(d3.interpolateRgb(C.accent, C.red));

    // Grid
    g.append('g').attr('class', 'grid')
      .call(d3.axisBottom(x).ticks(4).tickSize(innerH).tickFormat(''))
      .call(gg => gg.select('.domain').remove());

    // Bars
    g.selectAll('.dbar')
      .data(data)
      .join('rect')
        .attr('class', 'dbar')
        .attr('x', 0)
        .attr('y', d => y(d.dept))
        .attr('height', y.bandwidth())
        .attr('width', 0)
        .attr('rx', 3)
        .attr('fill', d => colorScale(d.desercion))
        .attr('opacity', 0.85)
        .on('mouseover', (event, d) => {
          showTip(event, `<strong>${d.dept}</strong>Deserción: ${fmtPct(d.desercion)}<br>Cobertura: ${fmtPct(d.cobertura)}`);
          d3.select(event.currentTarget).attr('opacity', 1);
        })
        .on('mousemove', moveTip)
        .on('mouseleave', (event) => {
          hideTip();
          d3.select(event.currentTarget).attr('opacity', 0.85);
        })
      .transition().duration(900).delay((_, i) => i * 25)
        .attr('width', d => x(d.desercion));

    // Labels
    g.selectAll('.dlabel')
      .data(data)
      .join('text')
        .attr('class', 'dlabel')
        .attr('x', d => x(d.desercion) + 5)
        .attr('y', d => y(d.dept) + y.bandwidth() / 2 + 1)
        .attr('dominant-baseline', 'middle')
        .attr('font-family', 'system-ui, sans-serif')
        .attr('font-size', 10)
        .attr('fill', C.muted)
        .attr('opacity', 0)
        .text(d => fmtPct(d.desercion))
      .transition().delay((_, i) => 350 + i * 25).duration(400)
        .attr('opacity', 1);

    // Y axis
    g.append('g').call(d3.axisLeft(y).tickSize(0))
      .call(gg => gg.select('.domain').remove())
      .call(gg => gg.selectAll('text')
        .attr('font-family', 'system-ui, sans-serif')
        .attr('font-size', 11)
        .attr('fill', C.text)
        .attr('x', -6)
      );

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickFormat(d => d + '%').ticks(5))
      .call(gg => gg.select('.domain').attr('stroke', '#333'))
      .call(gg => gg.selectAll('text').attr('font-family', 'system-ui, sans-serif').attr('font-size', 10).attr('fill', C.muted));

    g.append('text')
      .attr('class', 'chart-title')
      .attr('x', 0).attr('y', -12)
      .attr('fill', C.muted)
      .text('TASA DE DESERCIÓN POR DEPARTAMENTO — 2024 (%)');
  }

  /* ════════════════════════════════════════════════════════
     INIT — register deferred draws
  ═══════════════════════════════════════════════════════ */
  function init() {
    chartDrawFns['sec-brecha']    = drawBrecha;
    chartDrawFns['sec-tendencia'] = drawTendencia;
    chartDrawFns['sec-covid']     = drawCovid;
    chartDrawFns['sec-sombra']    = drawSombra;
    chartDrawFns['sec-desercion'] = drawDesercion;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
