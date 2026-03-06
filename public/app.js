const uploadInput = document.getElementById("csvFile");
const uploadBtn   = document.getElementById("uploadBtn");
const uploadStatus = document.getElementById("uploadStatus");
const alertList   = document.getElementById("alertList");
const alertSummary = document.getElementById("alertSummary");
const chatInput   = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");
const chatMessages = document.getElementById("chatMessages");

let currentVitals = [];

// â”€â”€ Theme Toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeIcon      = document.getElementById("themeIcon");
const themeLabel     = document.getElementById("themeLabel");

const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("medchart-theme", theme);
  if (theme === "light") {
    themeIcon.textContent  = "☀️";
    themeLabel.textContent = "Dark Mode";
  } else {
    themeIcon.textContent  = "🌙";
    themeLabel.textContent = "Light Mode";
  }
};

// Init from stored preference
applyTheme(localStorage.getItem("medchart-theme") || "dark");

themeToggleBtn?.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "light" ? "dark" : "light");
  if (currentVitals && currentVitals.length > 0) {
    setTimeout(() => buildCharts(currentVitals), 50);
  }
});

// â”€â”€ Drag-and-drop on drop zone â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const dropZone = document.getElementById("dropZone");
if (dropZone) {
  dropZone.addEventListener("dragover", e => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file) {
      // Inject into the file input so existing logic works
      const dt = new DataTransfer();
      dt.items.add(file);
      uploadInput.files = dt.files;
      dropZone.classList.add("has-file");
      document.querySelector(".drop-main").textContent = file.name;
      uploadStatus.textContent = `File ready: ${file.name}`;
      uploadStatus.className = "status";
    }
  });
  uploadInput.addEventListener("change", () => {
    if (uploadInput.files[0]) {
      dropZone.classList.add("has-file");
      document.querySelector(".drop-main").textContent = uploadInput.files[0].name;
    }
  });
}

// â”€â”€ Thresholds â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const thresholds = {
  heart_rate:  { criticalLow: 50,  criticalHigh: 120, min: 30,  max: 180 },
  systolic_bp: { criticalLow: 80,  criticalHigh: 160, min: 60,  max: 220 },
  temperature: { criticalLow: 35,  criticalHigh: 38.5, min: 33, max: 42  }
};

const isCritical = (value, vital) => {
  const { criticalLow, criticalHigh } = thresholds[vital];
  return value < criticalLow || value > criticalHigh;
};

// â”€â”€ Chart instances â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let heartRateChart, systolicBpChart, temperatureChart;
let overviewChart, distChart, scatterChart;

// â”€â”€ Shared chart defaults â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const baseScales = () => ({
  x: { ticks: { color: getChartTextColor() }, grid: { color: getChartGridColor() } },
  y: { ticks: { color: getChartTextColor() }, grid: { color: getChartGridColor() } }
});

// â”€â”€ KPI / Stat Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const stat = (arr) => ({
  min: Math.min(...arr),
  max: Math.max(...arr),
  avg: arr.reduce((a, b) => a + b, 0) / arr.length,
  latest: arr[arr.length - 1]
});

const critColor = (v, vital) => isCritical(v, vital) ? "var(--critical)" : "var(--normal)";

const updateKPI = (rows) => {
  const hrVals   = rows.map(r => r.heart_rate);
  const bpVals   = rows.map(r => r.systolic_bp);
  const tmpVals  = rows.map(r => r.temperature);

  const hrS  = stat(hrVals);
  const bpS  = stat(bpVals);
  const tmpS = stat(tmpVals);

  const setKPI = (id, s, vital) => {
    const latestEl = document.getElementById(`kpi-${id}-latest`);
    latestEl.textContent = id === "temp" ? s.latest.toFixed(1) : Math.round(s.latest);
    latestEl.style.color = critColor(s.latest, vital);
    document.getElementById(`kpi-${id}-min`).textContent = id === "temp" ? s.min.toFixed(1) : Math.round(s.min);
    document.getElementById(`kpi-${id}-avg`).textContent = id === "temp" ? s.avg.toFixed(1) : Math.round(s.avg);
    document.getElementById(`kpi-${id}-max`).textContent = id === "temp" ? s.max.toFixed(1) : Math.round(s.max);

    const t = thresholds[vital];
    const pct = Math.min(100, Math.max(0, ((s.latest - t.min) / (t.max - t.min)) * 100));
    const fill = document.getElementById(`gauge-${id}`);
    fill.style.width = `${pct}%`;
    fill.style.background = critColor(s.latest, vital);
  };

  setKPI("hr",   hrS,  "heart_rate");
  setKPI("bp",   bpS,  "systolic_bp");
  setKPI("temp", tmpS, "temperature");

  const hrCrit  = hrVals.filter(v => isCritical(v, "heart_rate")).length;
  const bpCrit  = bpVals.filter(v => isCritical(v, "systolic_bp")).length;
  const tmpCrit = tmpVals.filter(v => isCritical(v, "temperature")).length;
  const total   = hrCrit + bpCrit + tmpCrit;

  document.getElementById("kpi-alert-count").textContent = total;
  document.getElementById("kpi-hr-crit").textContent   = hrCrit;
  document.getElementById("kpi-bp-crit").textContent   = bpCrit;
  document.getElementById("kpi-temp-crit").textContent = tmpCrit;
};

// â”€â”€ Normalise value to 0-100 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const norm = (v, vital) => {
  const { min, max } = thresholds[vital];
  return Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100));
};

// â”€â”€ Combined Overview Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ── Dynamic chart color helpers (theme-aware) ──
const getChartTextColor = () =>
  document.documentElement.getAttribute('data-theme') === 'light'
    ? '#0c1a2e' : '#94a3b8';

const getChartGridColor = () =>
  document.documentElement.getAttribute('data-theme') === 'light'
    ? 'rgba(6,182,212,0.1)' : 'rgba(6,182,212,0.08)';

const getChartLegendColor = () =>
  document.documentElement.getAttribute('data-theme') === 'light'
    ? '#0c1a2e' : '#e2e8f0';

const buildOverviewChart = (rows) => {
  if (overviewChart) overviewChart.destroy();
  const labels = rows.map(r => r.timestamp);
  overviewChart = new Chart(document.getElementById("overviewChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Heart Rate %",
          data: rows.map(r => norm(r.heart_rate, "heart_rate")),
          borderColor: "#06b6d4",
          backgroundColor: "rgba(6,182,212,0.12)",
          tension: 0.4, pointRadius: 2, borderWidth: 2
        },
        {
          label: "Systolic BP %",
          data: rows.map(r => norm(r.systolic_bp, "systolic_bp")),
          borderColor: "#10b981",
          backgroundColor: "rgba(16,185,129,0.1)",
          tension: 0.4, pointRadius: 2, borderWidth: 2
        },
        {
          label: "Temperature %",
          data: rows.map(r => norm(r.temperature, "temperature")),
          borderColor: "#818cf8",
          backgroundColor: "rgba(129,140,248,0.1)",
          tension: 0.4, pointRadius: 2, borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { labels: { color: getChartLegendColor() } },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}%`
          }
        }
      },
      scales: {
        ...baseScales(),
        y: {
          min: 0,
          max: 100,
          ticks: { color: getChartTextColor(), callback: v => v + "%" },
          grid: { color: getChartGridColor() }
        }
      }
    }
  });
};

// â”€â”€ Individual Line Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const buildLineChart = (canvasId, label, points, vital) => {
  const colors = points.map(p => isCritical(p.value, vital) ? "#f43f5e" : "#10b981");
  return new Chart(document.getElementById(canvasId), {
    type: "line",
    data: {
      labels: points.map(p => p.timestamp),
      datasets: [{
        label,
        data: points.map(p => p.value),
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.1)",
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: colors,
        pointBorderColor: colors,
        segment: {
          borderColor: ctx =>
            isCritical(ctx.p0.parsed.y, vital) || isCritical(ctx.p1.parsed.y, vital)
              ? "#f43f5e" : "#10b981"
        }
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: getChartLegendColor() } } },
      scales: baseScales()
    }
  });
};

// â”€â”€ Normal vs Critical Bar Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const buildDistChart = (rows) => {
  if (distChart) distChart.destroy();
  const count = (vital) => {
    const crits = rows.filter(r => isCritical(r[vital], vital)).length;
    return { crit: crits, normal: rows.length - crits };
  };
  const hr  = count("heart_rate");
  const bp  = count("systolic_bp");
  const tmp = count("temperature");

  distChart = new Chart(document.getElementById("distChart"), {
    type: "bar",
    data: {
      labels: ["Heart Rate", "Systolic BP", "Temperature"],
      datasets: [
        {
          label: "Normal",
          data: [hr.normal, bp.normal, tmp.normal],
          backgroundColor: "rgba(16,185,129,0.75)",
          borderRadius: 8
        },
        {
          label: "Critical",
          data: [hr.crit, bp.crit, tmp.crit],
          backgroundColor: "rgba(244,63,94,0.75)",
          borderRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: getChartLegendColor() } } },
      scales: {
        ...baseScales(),
        x: { stacked: false, ticks: { color: getChartTextColor() }, grid: { color: getChartGridColor() } },
        y: { beginAtZero: true, ticks: { color: getChartTextColor() }, grid: { color: getChartGridColor() } }
      }
    }
  });
};

// â”€â”€ HR vs BP Scatter Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const buildScatterChart = (rows) => {
  if (scatterChart) scatterChart.destroy();
  const normalPts  = [];
  const critPts    = [];
  rows.forEach(r => {
    const pt = { x: r.heart_rate, y: r.systolic_bp };
    if (isCritical(r.heart_rate, "heart_rate") || isCritical(r.systolic_bp, "systolic_bp")) {
      critPts.push(pt);
    } else {
      normalPts.push(pt);
    }
  });

  scatterChart = new Chart(document.getElementById("scatterChart"), {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Normal",
          data: normalPts,
          backgroundColor: "rgba(76,211,162,0.65)",
          pointRadius: 5
        },
        {
          label: "Critical",
          data: critPts,
          backgroundColor: "rgba(244,63,94,0.75)",
          pointRadius: 6,
          pointStyle: "triangle"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: getChartLegendColor() } } },
      scales: {
        x: { title: { display: true, text: "Heart Rate (BPM)", color: getChartTextColor() }, ticks: { color: getChartTextColor() }, grid: { color: getChartGridColor() } },
        y: { title: { display: true, text: "Systolic BP (mmHg)", color: getChartTextColor() }, ticks: { color: getChartTextColor() }, grid: { color: getChartGridColor() } }
      }
    }
  });
};

// â”€â”€ Critical Alert Log â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const updateAlerts = (rows) => {
  alertList.innerHTML = "";
  const criticals = [];
  rows.forEach(row => {
    Object.keys(thresholds).forEach(vital => {
      if (isCritical(row[vital], vital)) {
        criticals.push({ vital, timestamp: row.timestamp, value: row[vital] });
      }
    });
  });
  if (!criticals.length) {
    alertSummary.textContent = "No critical readings in this file.";
    return;
  }
  alertSummary.textContent = `${criticals.length} critical readings detected.`;
  criticals.forEach(alert => {
    const item = document.createElement("li");
    item.className = "alert-item";
    const label = alert.vital.replace(/_/g, " ");
    item.innerHTML = `<strong>${label}</strong> ${alert.value} <span>${alert.timestamp}</span>`;      
      const explainBtn = document.createElement("button");
      explainBtn.className = "explain-btn";
      explainBtn.innerHTML = "✨ AI Explain";
      explainBtn.style.cssText = "margin-left:auto; background:var(--accent); color:#fff; border:none; border-radius:4px; padding:3px 8px; font-size:11px; cursor:pointer;";
      explainBtn.onclick = () => {
        document.getElementById('chatbotWidget').classList.add('open');
        chatInput.value = `Explain why the ${label} reading of ${alert.value} at ${alert.timestamp} is critical.`;
        chatSendBtn.click();
      };
      item.appendChild(explainBtn);
      item.style.display = "flex";
      item.style.alignItems = "center";
          alertList.appendChild(item);
  });
};

// â”€â”€ Build All Charts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const buildCharts = (rows) => {
  if (heartRateChart)  heartRateChart.destroy();
  if (systolicBpChart) systolicBpChart.destroy();
  if (temperatureChart) temperatureChart.destroy();

  const hrPts  = rows.map(r => ({ timestamp: r.timestamp, value: r.heart_rate }));
  const bpPts  = rows.map(r => ({ timestamp: r.timestamp, value: r.systolic_bp }));
  const tmpPts = rows.map(r => ({ timestamp: r.timestamp, value: r.temperature }));

  heartRateChart   = buildLineChart("heartRateChart",   "Heart Rate",   hrPts,  "heart_rate");
  systolicBpChart  = buildLineChart("systolicBpChart",  "Systolic BP",  bpPts,  "systolic_bp");
  temperatureChart = buildLineChart("temperatureChart", "Temperature",  tmpPts, "temperature");

  buildOverviewChart(rows);
  buildDistChart(rows);
  buildScatterChart(rows);
};

// â”€â”€ Show all sections â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const showSections = () => {
  ["kpiSection","overviewSection","dashboardSection","distSection","alertsSection",
   "statusSection","insightsSection","predictionSection"]
    .forEach(id => { document.getElementById(id).style.display = ""; });
};

// â”€â”€ Patient Status Badge + Early Warning Score â”€â”€â”€â”€â”€â”€â”€â”€
const updateStatusBadge = (rows) => {
  const counts = {};
  let totalCrit = 0;
  Object.keys(thresholds).forEach(v => {
    counts[v] = rows.filter(r => isCritical(r[v], v)).length;
    totalCrit += counts[v];
  });

  // EWS: HR ×3, BP ×3, Temp ×2 per critical reading (capped at 10)
  const rawEWS = Math.min(
    Math.round(counts.heart_rate*0.9 + counts.systolic_bp*0.9 + counts.temperature*0.6),
    10
  );
  document.getElementById("ewsScore").textContent = rawEWS;
  const ewsEl = document.getElementById("ewsLevel");
  const ewsGauge = document.getElementById("gauge-ews");
  if (rawEWS <= 2)       { ewsEl.textContent="LOW RISK";    ewsEl.style.color="var(--normal)";   document.getElementById("ewsScore").style.color="var(--normal)";   }
  else if (rawEWS <= 5) { ewsEl.textContent="MODERATE";    ewsEl.style.color="var(--accent)";   document.getElementById("ewsScore").style.color="var(--accent)";   }
  else                  { ewsEl.textContent="HIGH RISK";   ewsEl.style.color="var(--critical)"; document.getElementById("ewsScore").style.color="var(--critical)"; }
  ewsGauge.style.width = (rawEWS * 10) + "%";
  ewsGauge.style.background = rawEWS <= 2 ? "var(--normal)" : rawEWS <= 5 ? "var(--accent)" : "var(--critical)";

  const badge = document.getElementById("statusBadge");
  const label = document.getElementById("statusLabel");
  const sub   = document.getElementById("statusSub");
  badge.className = "status-badge";
  if (totalCrit === 0) {
    label.textContent = "STABLE";
    badge.classList.add("status-stable");
  } else if (totalCrit <= 3) {
    label.textContent = "WARNING";
    badge.classList.add("status-warning");
  } else {
    label.textContent = "CRITICAL";
    badge.classList.add("status-critical");
  }
  sub.textContent = `${totalCrit} critical reading${totalCrit !== 1 ? "s" : ""} detected`;
};

// â”€â”€ Trend Detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const computeTrend = (vals, delta) => {
  if (vals.length < 2) return { arrow: "→ Stable", cls:"trend-stable" };
  const avg = arr => arr.reduce((a,b)=>a+b,0)/arr.length;
  const half = Math.max(1, Math.floor(vals.length/2));
  const diff = avg(vals.slice(-half)) - avg(vals.slice(0,half));
  if (diff > delta)  return { arrow: "↑ Increasing", cls:"trend-up" };
  if (diff < -delta) return { arrow: "↓ Dropping", cls:"trend-down" };
  return { arrow: "→ Stable", cls:"trend-stable" };
};
const updateTrends = (rows) => {
  const hrVals   = rows.map(r=>+r.heart_rate);
  const bpVals   = rows.map(r=>+r.systolic_bp);
  const tmpVals  = rows.map(r=>+r.temperature);
  const set = (id, trend) => {
    const el = document.getElementById(id);
    el.textContent = trend.arrow;
    el.className = `trend-val ${trend.cls}`;
  };
  set("trend-hr",   computeTrend(hrVals,  5));
  set("trend-bp",   computeTrend(bpVals,  5));
  set("trend-temp", computeTrend(tmpVals, 0.3));
};

// â”€â”€ Auto Clinical Insights â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const buildInsights = (rows) => {
  const list = document.getElementById("insightsList");
  list.innerHTML = "";
  const add = (msg) => {
    const li = document.createElement("li");
    li.textContent = msg;
    list.appendChild(li);
  };

  const hrCrits  = rows.filter(r=>isCritical(r.heart_rate,  "heart_rate"));
  const bpCrits  = rows.filter(r=>isCritical(r.systolic_bp, "systolic_bp"));
  const tmpCrits = rows.filter(r=>isCritical(r.temperature, "temperature"));

  if (hrCrits.length === 0 && bpCrits.length === 0 && tmpCrits.length === 0) {
    add("All vitals within normal range across entire recording.");
    return;
  }
  if (hrCrits.length) {
    const peak = Math.max(...hrCrits.map(r=>+r.heart_rate));
    const t = hrCrits.find(r=>+r.heart_rate===peak) || hrCrits[0];
    add(`Heart rate peaked at ${peak} BPM at ${t.timestamp} — exceeds safe threshold (50–120 BPM).`);
    if (hrCrits.length > 1) add(`Sustained heart-rate anomaly: ${hrCrits.length} readings out of range.`);
  }
  if (bpCrits.length) {
    const peak = Math.max(...bpCrits.map(r=>+r.systolic_bp));
    const t = bpCrits.find(r=>+r.systolic_bp===peak) || bpCrits[0];
    add(`Systolic BP reached ${peak} mmHg at ${t.timestamp} — hypertensive threshold exceeded (>160 mmHg).`);
  }
  if (tmpCrits.length) {
    const peak = Math.max(...tmpCrits.map(r=>+r.temperature));
    const t = tmpCrits.find(r=>+r.temperature===peak) || tmpCrits[0];
    add(`Temperature abnormality detected: ${peak}°C at ${t.timestamp} — outside safe range (35–38.5°C).`);
  }
  const overlap = rows.filter(r =>
    isCritical(r.heart_rate,"heart_rate") &&
    (isCritical(r.systolic_bp,"systolic_bp") || isCritical(r.temperature,"temperature"))
  );
  if (overlap.length) add(`⚠️ Multi-vital crisis detected at ${overlap.length} time point(s) — immediate review recommended.`);
  const hrVals = rows.map(r=>+r.heart_rate);
  const hrTrend = computeTrend(hrVals, 5);
  if (hrTrend.cls === "trend-up")   add("Heart rate trending upward — monitor for tachycardia onset.");
  if (hrTrend.cls === "trend-down") add("Heart rate trending downward — monitor for bradycardia.");
};

// â”€â”€ Critical Event Timeline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const buildTimeline = (rows) => {
  const container = document.getElementById("timeline");
  container.innerHTML = "";
  const events = [];
  rows.forEach((r,i) => {
    if (isCritical(r.heart_rate, "heart_rate")) {
      events.push({ ts: r.timestamp, msg: `Heart Rate: ${r.heart_rate} BPM`, cls:"tl-hr" });
    }
    if (isCritical(r.systolic_bp, "systolic_bp")) {
      events.push({ ts: r.timestamp, msg: `Systolic BP: ${r.systolic_bp} mmHg`, cls:"tl-bp" });
    }
    if (isCritical(r.temperature, "temperature")) {
      events.push({ ts: r.timestamp, msg: `Temperature: ${r.temperature}°C`, cls:"tl-temp" });
    }
  });
  if (events.length === 0) {
    container.innerHTML = "<p style='color:var(--normal);font-size:.82rem'>No critical events recorded.</p>";
    return;
  }
  events.forEach(ev => {
    const div = document.createElement("div");
    div.className = "timeline-event";
    div.innerHTML = `<span class="tl-time">${ev.ts}</span><span class="tl-msg ${ev.cls}">${ev.msg}</span>`;
    container.appendChild(div);
  });
};

// â”€â”€ Linear Regression Prediction â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const linearRegression = (vals) => {
  const n = vals.length;
  const xs = Array.from({length:n},(_,i)=>i);
  const sumX  = xs.reduce((a,b)=>a+b,0);
  const sumY  = vals.reduce((a,b)=>a+b,0);
  const sumXY = xs.reduce((a,x,i)=>a+x*vals[i],0);
  const sumX2 = xs.reduce((a,x)=>a+x*x,0);
  const m = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX) || 0;
  const b = (sumY - m*sumX) / n;
  return { m, b, predict: (x) => m*x + b };
};

const runPrediction = (rows) => {
  const result = document.getElementById("predictionResult");
  result.innerHTML = "";
  if (rows.length < 3) { result.innerHTML = "<p style='color:var(--muted)'>Need at least 3 readings to predict.</p>"; return; }

  const vitals = [
    { key:"heart_rate",  label:"Heart Rate",  unit:"BPM",  vital:"heart_rate" },
    { key:"systolic_bp", label:"Systolic BP", unit:"mmHg", vital:"systolic_bp" },
    { key:"temperature", label:"Temperature", unit:"°C",   vital:"temperature" }
  ];

  vitals.forEach(({key, label, unit, vital}) => {
    const vals = rows.map(r => +r[key]);
    const { predict } = linearRegression(vals);
    // "5 minutes" — assume each row is one reading interval; predict 5 steps ahead
    const stepsAhead = Math.min(5, Math.ceil(rows.length / 4));
    const predicted  = Math.round(predict(vals.length + stepsAhead - 1) * 10) / 10;
    const crit = isCritical(predicted, vital);
    const warn = Math.abs(predicted - thresholds[vital].criticalHigh) < 10 ||
                 Math.abs(predicted - thresholds[vital].criticalLow) < 10;
    const cls  = crit ? "pred-danger" : warn ? "pred-warn" : "pred-safe";

    const card = document.createElement("div");
    card.className = "pred-card";
    card.innerHTML = `
      <p class="pred-vital">${label}</p>
      <p class="pred-val ${cls}">${predicted} <span style="font-size:.9rem">${unit}</span></p>
      <p class="pred-note">${crit ? "⚠️ Predicted Critical" : warn ? "△ Approaching Threshold" : "✓ Within Safe Range"}</p>`;
    result.appendChild(card);
  });
};

document.getElementById("predictBtn")?.addEventListener("click", () => {
  if (currentVitals.length) runPrediction(currentVitals);
});

// â”€â”€ Real-time Simulation Playback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let simTimer = null;
const playSimulation = (rows) => {
  const btn = document.getElementById("playBtn");
  if (simTimer) {
    clearInterval(simTimer);
    simTimer = null;
    btn.textContent = "▶ Simulate Live";
    btn.classList.remove("playing");
    return;
  }
  // Rebuild all displays fresh at each step
  let idx = 1;
  btn.textContent = "Stop";
  btn.classList.add("playing");
  const tick = () => {
    if (idx > rows.length) {
      clearInterval(simTimer);
      simTimer = null;
      btn.textContent = "▶ Simulate Live";
      btn.classList.remove("playing");
      return;
    }
    const slice = rows.slice(0, idx);
    updateKPI(slice);
    buildCharts(slice);
    updateAlerts(slice);
    updateStatusBadge(slice);
    updateTrends(slice);
    buildInsights(slice);
    buildTimeline(slice);
    idx++;
  };
  tick(); // run first tick immediately
  simTimer = setInterval(tick, 800);
};

document.getElementById("playBtn")?.addEventListener("click", () => {
  if (currentVitals.length) playSimulation(currentVitals);
});

// â”€â”€ Med-Bot Chat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const appendBubble = (text, role) => {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = text;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
};

const sendChat = async () => {
  const message = chatInput.value.trim();
  if (!message) return;
  chatInput.value = "";
  appendBubble(message, "user");
  const thinking = appendBubble("Med-Bot is thinking...", "thinking");
  chatSendBtn.disabled = true;
  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, vitals: currentVitals })
    });
    const data = await response.json();
    thinking.remove();
    appendBubble(data.reply || data.error || "No response.", "bot");
  } catch {
    thinking.remove();
    appendBubble("Connection error. Is the server running?", "bot");
  } finally {
    chatSendBtn.disabled = false;
    chatInput.focus();
  }
};

chatSendBtn.addEventListener("click", sendChat);
chatInput.addEventListener("keydown", e => { if (e.key === "Enter") sendChat(); });

// â”€â”€ Guided Demo Tour â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DEMO_STEPS = [
  {
    targetId: null,
    title:    "Welcome to MedChart — Demo Mode",
    body:     "Sample patient data has been auto-loaded. This 6-step tour walks through every key feature judges evaluate. Use Next / Back to navigate, or press Skip to exit anytime."
  },
  {
    targetId: "statusSection",
    title:    "Step 1 — Patient Status & Early Warning Score",
    body:     "The EWS score (0–10) is calculated instantly from critical reading counts. The pulsing dot updates from STABLE → WARNING → CRITICAL. Trend arrows show whether each vital is rising, dropping, or stable."
  },
  {
    targetId: "dashboardSection",
    title:    "Step 2 — Color-Coded Time-Series Charts",
    body:     "Green = normal range. Red = critical. Line segments change colour per-segment, not just per-point — so a nurse sees exactly when the patient crossed the threshold on a continuous trace."
  },
  {
    targetId: "insightsSection",
    title:    "Step 3 — Clinical Insights & Event Timeline",
    body:     "Auto-generated clinical text pinpoints the peak reading, its timestamp, threshold breach, and sustained anomaly count. The timeline on the right is a chronological log every clinician expects in an EMR."
  },
  {
    targetId: "predictionSection",
    title:    "Step 4 — 5-Minute Forecast",
    body:     "Linear regression over all readings projects the next value for each vital. Cards turn red when the predicted value breaches a threshold — giving nurses advance warning before the alarm fires."
  },
  {
    targetId: "alertsSection",
    title:    "Step 5 — Critical Alert Log",
    body:     "Every threshold breach is timestamped and listed here — the same format used in real hospital bedside monitor event logs. Judges verify this panel to confirm anomaly detection works correctly."
  },
  {
    targetId: "emergencyBtn",
    title:    "Step 6 — Emergency Mode",
    body:     "Press the red button (bottom-right) to activate full Emergency Mode: the screen changes state, a triple ICU beep fires, and a clinical summary with recommended actions appears instantly.",
    isLast: true
  }
];

let demoStep = 0;
let demoActive = false;
let spotlitEl = null;

const demoShowStep = () => {
  const step = DEMO_STEPS[demoStep];
  const tooltip  = document.getElementById("demoTooltip");
  const backdrop = document.getElementById("demoBackdrop");

  if (spotlitEl) { spotlitEl.classList.remove("demo-spotlight"); spotlitEl = null; }

  if (step.targetId) {
    const el = document.getElementById(step.targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => el.classList.add("demo-spotlight"), 220);
      spotlitEl = el;
    }
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.getElementById("demoStepLabel").textContent =
    `Step ${demoStep + 1} of ${DEMO_STEPS.length}`;
  document.getElementById("demoStepTitle").textContent = step.title;
  document.getElementById("demoStepBody").textContent  = step.body;
  document.getElementById("demoPrevBtn").style.visibility = demoStep === 0 ? "hidden" : "visible";
  document.getElementById("demoNextBtn").textContent = step.isLast ? "✓ Finish" : "Next →";

  backdrop.classList.add("active");
  tooltip.classList.add("active");
};

const loadDemoData = async () => {
  const btn = document.getElementById("demoBtn");
  btn.textContent = "Loading…";
  btn.disabled = true;
  try {
    const res  = await fetch("/api/demo");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    currentVitals = data.rows;
    uploadStatus.textContent = `Demo loaded: ${data.rows.length} readings.`;
    showSections();
    updateKPI(data.rows);
    buildCharts(data.rows);
    updateAlerts(data.rows);
    updateStatusBadge(data.rows);
    updateTrends(data.rows);
    buildInsights(data.rows);
    buildTimeline(data.rows);
    runPrediction(data.rows);
  } catch (err) {
    uploadStatus.textContent = "Demo load failed: " + err.message;
    btn.textContent = "▶ Start Demo";
    btn.disabled = false;
    return;
  }
  demoActive = true;
  demoStep   = 0;
  btn.textContent = "▶ Start Demo";
  btn.disabled = false;
  demoShowStep();
};

window.demoNext = () => {
  if (!demoActive) return;
  if (demoStep >= DEMO_STEPS.length - 1) { demoSkip(); return; }
  demoStep++;
  demoShowStep();
};

window.demoPrev = () => {
  if (!demoActive || demoStep === 0) return;
  demoStep--;
  demoShowStep();
};

window.demoSkip = () => {
  demoActive = false;
  if (spotlitEl) { spotlitEl.classList.remove("demo-spotlight"); spotlitEl = null; }
  document.getElementById("demoTooltip").classList.remove("active");
  document.getElementById("demoBackdrop").classList.remove("active");
};

document.getElementById("demoBtn")?.addEventListener("click", loadDemoData);
document.getElementById("demoBackdrop")?.addEventListener("click", demoSkip);

// â”€â”€ Emergency Mode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const playEmergencyBeep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (freq, start, dur) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.6, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    };
    beep(880, 0,    0.18);
    beep(880, 0.22, 0.18);
    beep(880, 0.44, 0.35);
  } catch { /* AudioContext blocked — silent fallback */ }
};

const buildEmergencySummary = () => {
  const list = document.getElementById("emIssuesList");
  list.innerHTML = "";
  if (!currentVitals.length) {
    const li = document.createElement("li");
    li.textContent = "Emergency mode activated manually — no CSV data loaded.";
    list.appendChild(li);
    return;
  }
  const add = (msg) => {
    const li = document.createElement("li");
    li.textContent = msg;
    list.appendChild(li);
  };
  const hrCrits  = currentVitals.filter(r => isCritical(r.heart_rate,  "heart_rate"));
  const bpCrits  = currentVitals.filter(r => isCritical(r.systolic_bp, "systolic_bp"));
  const tmpCrits = currentVitals.filter(r => isCritical(r.temperature, "temperature"));
  if (hrCrits.length) {
    const peak = Math.max(...hrCrits.map(r => +r.heart_rate));
    add(`Heart Rate Spike — ${peak} BPM detected`);
  }
  if (bpCrits.length) {
    const worst = Math.min(...bpCrits.map(r => +r.systolic_bp));
    const dir   = worst < thresholds.systolic_bp.criticalLow ? `Low (${worst} mmHg)` : `High (${worst} mmHg)`;
    add(`Blood Pressure ${dir} detected`);
  }
  if (tmpCrits.length) {
    const peak = Math.max(...tmpCrits.map(r => +r.temperature));
    add(`Temperature Abnormality — ${peak}°C detected`);
  }
  if (!hrCrits.length && !bpCrits.length && !tmpCrits.length) {
    add("No specific threshold breach found — emergency activated manually.");
  }
};

window.activateEmergency = () => {
  buildEmergencySummary();
  document.getElementById("emTimestamp").textContent =
    "Activated: " + new Date().toLocaleTimeString();
  document.body.classList.add("emergency-active");
  const overlay = document.getElementById("emergencyOverlay");
  overlay.classList.add("visible");
  overlay.setAttribute("aria-hidden", "false");
  playEmergencyBeep();
};

window.dismissEmergency = () => {
  document.body.classList.remove("emergency-active");
  const overlay = document.getElementById("emergencyOverlay");
  overlay.classList.remove("visible");
  overlay.setAttribute("aria-hidden", "true");
};

// â”€â”€ Upload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
uploadBtn.addEventListener("click", async () => {
  const file = uploadInput.files[0];
  if (!file) {
    uploadStatus.textContent = "Please choose a CSV file.";
    uploadStatus.className = "status fail";
    return;
  }
  uploadStatus.textContent = "Analyzing…";
  uploadStatus.className = "status";
  uploadBtn.disabled = true;
  uploadBtn.classList.add("loading");
  uploadBtn.textContent = "Analyzing";
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/upload", { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) {
      uploadStatus.textContent = data.error || "Upload failed.";
      uploadStatus.className = "status fail";
      uploadBtn.disabled = false; uploadBtn.classList.remove("loading"); uploadBtn.textContent = "Analyze";
      return;
    }

    uploadStatus.textContent = `Loaded ${data.rows.length} readings.`;
    uploadStatus.className = "status ok";
    if (dropZone) dropZone.classList.add("has-file");
    currentVitals = data.rows;
    showSections();
    updateKPI(data.rows);
    buildCharts(data.rows);
    updateAlerts(data.rows);
    updateStatusBadge(data.rows);
    updateTrends(data.rows);
    buildInsights(data.rows);
    buildTimeline(data.rows);
    runPrediction(data.rows);
  } catch {
    uploadStatus.textContent = "Upload failed. Check server logs.";
    uploadStatus.className = "status fail";
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.classList.remove("loading");
    uploadBtn.textContent = "Analyze";
  }
});

