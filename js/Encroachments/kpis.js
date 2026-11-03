/**
 * مؤشرات وتحليلات التعديات العقارية
 * يتطلب وجود ملف encroachments.json في مجلد البيانات (data).
 */

const DATA_URL = "./data/encroachments.json";

// متغيرات عامة لحفظ حالة الرسوم البيانية والسجلات
let donutChart = null;
let statusChart = null;
let caseChart = null;
let rentalIncidentChart = null;
let cityEncroachmentChart = null;

export let originalRecords = [];
let currentRecords = [];

// تعريف الرموز الرسومية (SVG Icons) للمؤشرات
const icons = {
  total: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 1 4 16.5z"/><path d="M4 16a2.5 2.5 0 0 1 2.5-2.5H20M8 7h8M8 10h5"/></svg>',
  hand: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M8 11V5a1.5 1.5 0 0 1 3 0v5-6a1.5 1.5 0 0 1 3 0v6-4a1.5 1.5 0 0 1 3 0v6l1-1a1.8 1.8 0 0 1 3 1.4l-1 5.1A5 5 0 0 1 15.1 22h-2.4a5 5 0 0 1-3.8-1.8L4 14.5a1.8 1.8 0 0 1 2.7-2.4L8 13.5"/></svg>',
  contract: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M15 3v5h4M9 13h6M9 17h6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16.5 9"/></svg>',
  legal: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M12 3v18M5 6h14M7 6l-4 7h8L7 6zm10 0-4 7h8l-4-7zM7 21h10"/></svg>',
  active: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  city: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M3 21V8l6-4v17M9 10h6v11M15 7l6 3v11M6 11h.01M6 15h.01M12 13h.01M12 17h.01M18 13h.01M18 17h.01"/></svg>',
  incident: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></svg>',
  case: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M3 7h18v13H3zM8 7V4h8v3M3 11h18M10 11v2h4v-2"/></svg>',
  final: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M12 3 19 6v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg>',
  initial: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M4 4h16v16H4zM8 8h8M8 12h5M8 16h7"/></svg>',
  pending: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
};

/**
 * دالة مساعدة: حساب عدد السجلات المطابقة لشرط معين
 */
const countWhere = (records, predicate) => records.filter(predicate).length;

/**
 * دالة مساعدة: التحقق من وجود قيمة صالحة غير فارغة
 */
const hasValue = value => value !== null && value !== undefined && String(value).trim() !== "";

/**
 * دالة تطبيع النصوص (توحيد المسافات وإزالة الفراغات الزائدة)
 */
export function normalize(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

/**
 * دالة لتحديث عرض تاريخ ووقت آخر تحديث في الواجهة
 */
function updateLastUpdateTime() {
  const timeElement = document.getElementById("last-update-time");
  if (!timeElement) return;

  const now = new Date();
  const options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };

  timeElement.textContent = new Intl.DateTimeFormat('ar-SA', options).format(now);
}

/**
 * دالة تحديث اللوحة بالكامل (المؤشرات والرسوم البيانية وتاريخ التحديث)
 */
export function refreshDashboard(records) {
  currentRecords = records;
  renderKpis(records);
  renderDonutChart(records);
  renderStatusChart(records);
  renderCaseChart(records);
  renderRentalIncidentSection(records);
  renderCityEncroachmentSection(records);
  
  // تحديث وقت آخر تحديث
  updateLastUpdateTime();

  renderUpdatesSection(records); // <--- إضافة دالة تحديث الملاحظات هنا
}

/**
 * دالة حساب مؤشرات الأداء الرئيسية (KPIs) بناءً على قواعد البيانات
 */
function calculateKpis(records) {
  const finalJudgment = r => normalize(r["حالة_القضية"]) === "حكم نهائي";
  const initialJudgment = r => normalize(r["حالة_القضية"]) === "حكم ابتدائي";
  const pendingCase = r => normalize(r["حالة_القضية"]) === "قضية منظورة";
  
  const rentalIncident = r => hasValue(r["رقم_الواقعة_الإيجارية"]);
  const lawsuit = r => hasValue(r["رقم_الدعوى_القضائية"]) || hasValue(r["رقم_صك_الدعوى"]) || finalJudgment(r) || initialJudgment(r) || pendingCase(r);
  
  // شروط المؤشرات الجديدة بناءً على حقل "حالة_التعدي"
  const activeEncroachment = r => normalize(r["حالة_التعدي"]) === "قائم";
  const evacuatedEncroachment = r => normalize(r["حالة_التعدي"]) === "تم الاخلاء";

  return [
    { id: "total", label: "إجمالي التعديات", value: records.length, icon: "total", color: "#00778B", detail: "عدد السجلات في قاعدة البيانات." },
    { id: "active", label: "التعديات القائمة", value: countWhere(records, activeEncroachment), icon: "active", color: "#CB2C30", detail: "التعديات التي لا تزال قائمة." },
    { id: "evacuated", label: "تم الإخلاء", value: countWhere(records, evacuatedEncroachment), icon: "check", color: "#16856B", detail: "التعديات التي تم إخلاؤها بنجاح." },
    { id: "incidents", label: "وقائع إيجارية", value: countWhere(records, rentalIncident), icon: "incident", color: "#C18B20", detail: "السجلات التي لها واقعة إيجارية." },
    { id: "lawsuits", label: "رُفعت عليها قضايا", value: countWhere(records, lawsuit), icon: "case", color: "#5B78B7", detail: "السجلات المرتبطة بقضية أو صك." },
    { id: "final_judgment", label: "حكم نهائي", value: countWhere(records, finalJudgment), icon: "final", color: "#00778B", detail: "السجلات التي صدر لها حكم نهائي." },

  ];
}

/**
 * دالة طباعة وبناء بطاقات مؤشرات الأداء الرئيسية في الواجهة
 */
function renderKpis(records) {
  const container = document.getElementById("kpi-container");
  if (!container) return;

  const formatter = new Intl.NumberFormat("en-US");
  const kpis = calculateKpis(records);

  container.innerHTML = kpis.map(kpi => `
    <div class="kpi-card" style="--accent:${kpi.color}">
      <span class="kpi-card-top">
        <span class="kpi-label">${kpi.label}</span>
        <span class="kpi-icon">${icons[kpi.icon]}</span>
      </span>
      <strong class="kpi-value" dir="ltr">${formatter.format(kpi.value)}</strong>
    </div>
  `).join("");
}

/**
 * دالة إنشاء وتحديث قسم آخر التحديثات بناءً على حقل الملاحظات في قاعدة البيانات
 */
/**
 * دالة إنشاء وتحديث قسم آخر التحديثات بناءً على حقل الملاحظات في قاعدة البيانات
 */
function renderUpdatesSection(records) {
  // تصفية السجلات التي تحتوي على ملاحظات غير فارغة
  const updatesRecords = records.filter(record => hasValue(record["ملاحظات"]));

  const container = document.getElementById("updates-records-container");
  const countLabel = document.getElementById("updates-count");

  if (countLabel) {
    countLabel.textContent = updatesRecords.length;
  }

  if (!container) return;

  if (updatesRecords.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: var(--color-text-muted); padding: 20px;">لا توجد ملاحظات أو تحديثات مسجلة</p>`;
  } else {
    container.innerHTML = updatesRecords.map((record, index) => {
      const city = record["المدينة"] || "-";
      const landNo = record["رقم_الارض"] || "-";
      const nameCustomer = record["المتعدي"] || "-";
      const notes = record["ملاحظات"] || "-";
      const classification = record["التصنيف"] || "-";

      return `
        <div style="background: var(--color-background); border: 1px solid var(--color-border); border-radius: var(--border-radius-sm); padding: 12px 16px; font-size: 0.6rem; display: flex; flex-direction: column; gap: 8px;">
          <!-- ترويسة البطاقة -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 6px;">
            <strong style="color: var(--color-primary);"># ${index + 1} - المدينة: ${city} (رقم الأرض: ${landNo})</strong>
            <span style="background: rgba(0, 119, 139, 0.08); color: var(--color-primary); padding: 3px 10px; border-radius: 999px; font-size: 0.5rem; font-weight: 600;">${classification}</span>
          </div>
          
          <!-- اسم المتعدي -->
          <div style="color: var(--color-text); font-size: 0.88rem; display: flex; gap: 6px;">
            <strong>المتعدي:</strong> <span>${nameCustomer}</span>
          </div>

          <!-- نص الملاحظة -->
          <div style="color: var(--color-text); font-size: 0.9rem; line-height: 1.6; display: flex; align-items: flex-start; gap: 8px; border-top: 1px dashed var(--color-border); padding-top: 6px; margin-top: 2px;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0; margin-top: 3px; color: var(--color-primary);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
            <span>${notes}</span>
          </div>
        </div>
      `;
    }).join("");
  }
}


/**
 * دالة إنشاء وتحديث رسم تصنيف التعديات
 */
function renderDonutChart(records) {
  const classificationCounts = {};

  records.forEach(record => {
    const classification = normalize(record["التصنيف"]);
    if (!classification) return;
    classificationCounts[classification] = (classificationCounts[classification] || 0) + 1;
  });

  const sortedEntries = Object.entries(classificationCounts).sort((a, b) => b[1] - a[1]);
  const labels = sortedEntries.map(entry => entry[0]);
  const values = sortedEntries.map(entry => entry[1]);
  const total = values.reduce((sum, val) => sum + val, 0);

  const totalElement = document.getElementById("chart-total");
  const chartCanvas = document.getElementById("encroachmentsChart");
  const detailsContainer = document.getElementById("encroachments-legend-details");
  
  if (!chartCanvas) return;
  if (totalElement) totalElement.textContent = total;

  const colorMapping = {
    "وضع يد": "#CB2C30",
    "عقد منتهى": "#768692"
  };

  const fallbackColors = ["#CB2C30", "#768692", "#00778B"];
  const chartColors = labels.map((label, index) => colorMapping[label] || fallbackColors[index % fallbackColors.length]);

  if (detailsContainer) {
    detailsContainer.innerHTML = labels.map((label, index) => {
      const count = values[index];
      const percent = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
      const color = chartColors[index];
      return `
        <div class="chart-detail-item">
          <div class="chart-detail-info">
            <span class="chart-detail-color" style="background-color: ${color};"></span>
            <span class="chart-detail-label">${label}</span>
          </div>
          <span class="chart-detail-stats">${count} (${percent}%)</span>
        </div>
      `;
    }).join("");
  }

  const ctx = chartCanvas.getContext("2d");
  if (donutChart) donutChart.destroy();

  donutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: chartColors,
        hoverBackgroundColor: chartColors,
        borderColor: "#FFFFFF",
        borderWidth: 4,
        hoverOffset: 12
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "55%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              const value = context.raw;
              const percent = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
              return `${context.label}: ${value} (${percent}%)`;
            }
          }
        }
      },
      onClick(event, elements) {
        if (!elements.length) return;
        const selectedStatus = labels[elements[0].index];
        const filteredRecords = originalRecords.filter(r => normalize(r["التصنيف"]) === selectedStatus);
        refreshDashboard(filteredRecords);
      }
    }
  });
}

/**
 * دالة إنشاء وتحديث رسم حالة التعدي
 */
function renderStatusChart(records) {
  const statusCounts = {};

  records.forEach(record => {
    const status = normalize(record["حالة_التعدي"]) || "غير محدد";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const sortedEntries = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
  const labels = sortedEntries.map(entry => entry[0]);
  const values = sortedEntries.map(entry => entry[1]);
  const total = records.length;

  const colorMapping = {
    "قائم": "#A7C8CE",
    "تم الاخلاء": "#00778B",
    "لدى القانونية": "#174A5B",
    "لدى القانونية قبل اللجنة": "#648F9A",
    "تحت إجراءات الإستلام": "#25A6B7"
  };

  const fallbackColors = ["#00778B", "#174A5B", "#A7C8CE", "#648F9A", "#25A6B7", "#16856B"];
  const chartColors = labels.map((label, index) => colorMapping[label] || fallbackColors[index % fallbackColors.length]);

  const totalElement = document.getElementById("status-total");
  if (totalElement) totalElement.textContent = total;

  const detailsContainer = document.getElementById("status-legend-details");
  if (detailsContainer) {
    detailsContainer.innerHTML = labels.map((label, index) => {
      const count = values[index];
      const percent = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
      return `
        <div class="chart-detail-item">
          <div class="chart-detail-info">
            <span class="chart-detail-color" style="background-color: ${chartColors[index]};"></span>
            <span class="chart-detail-label">${label}</span>
          </div>
          <span class="chart-detail-stats">${count} (${percent}%)</span>
        </div>
      `;
    }).join("");
  }

  const canvas = document.getElementById("statusChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (statusChart) statusChart.destroy();

  statusChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: chartColors,
        hoverBackgroundColor: chartColors,
        borderColor: "#FFFFFF",
        borderWidth: 4,
        hoverOffset: 12
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "55%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              const value = context.raw;
              const percent = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
              return `${context.label}: ${value} (${percent}%)`;
            }
          }
        }
      },
      onClick(event, elements) {
        if (!elements.length) return;
        const selectedStatus = labels[elements[0].index];
        const filteredRecords = originalRecords.filter(record => (normalize(record["حالة_التعدي"]) || "غير محدد") === selectedStatus);
        refreshDashboard(filteredRecords);
      }
    }
  });
}

/**
 * دالة إنشاء وتحديث رسم حالة القضية
 */
function renderCaseChart(records) {
  const caseCounts = {};

  records.forEach(record => {
    const caseStatus = normalize(record["حالة_القضية"]);
    if (!caseStatus) return;
    caseCounts[caseStatus] = (caseCounts[caseStatus] || 0) + 1;
  });

  const sortedEntries = Object.entries(caseCounts).sort((a, b) => b[1] - a[1]);
  const labels = sortedEntries.map(entry => entry[0]);
  const values = sortedEntries.map(entry => entry[1]);
  const total = values.reduce((sum, val) => sum + val, 0);

  const colorMapping = {
    "حكم نهائي": "#00778B",
    "قضية منظورة": "#A3C6CC",
    "حكم ابتدائي": "#20A4B8"
  };

  const fallbackColors = ["#00778B", "#A3C6CC", "#20A4B8"];
  const chartColors = labels.map((label, index) => colorMapping[label] || fallbackColors[index % fallbackColors.length]);

  const totalElement = document.getElementById("case-total");
  if (totalElement) totalElement.textContent = total;

  const detailsContainer = document.getElementById("case-legend-details");
  if (detailsContainer) {
    detailsContainer.innerHTML = labels.map((label, index) => {
      const count = values[index];
      const percent = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
      return `
        <div class="chart-detail-item">
          <div class="chart-detail-info">
            <span class="chart-detail-color" style="background-color: ${chartColors[index]};"></span>
            <span class="chart-detail-label">${label}</span>
          </div>
          <span class="chart-detail-stats">${count} (${percent}%)</span>
        </div>
      `;
    }).join("");
  }

  const canvas = document.getElementById("caseChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (caseChart) caseChart.destroy();

  caseChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: chartColors,
        hoverBackgroundColor: chartColors,
        borderColor: "#FFFFFF",
        borderWidth: 4,
        hoverOffset: 12
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "55%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              const value = context.raw;
              const percent = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
              return `${context.label}: ${value} (${percent}%)`;
            }
          }
        }
      },
      onClick(event, elements) {
        if (!elements.length) return;
        const selectedStatus = labels[elements[0].index];
        const filteredRecords = originalRecords.filter(record => normalize(record["حالة_القضية"]) === selectedStatus);
        refreshDashboard(filteredRecords);
      }
    }
  });
}

/**
 * دالة إنشاء وتحديث رسم "حالة الواقعة الإيجارية" وقائمتها
 */
function renderRentalIncidentSection(records) {
  const incidentCounts = {};
  const rentalRecords = records.filter(record => normalize(record["حالة_الواقعة_الإيجارية"]) !== "");

  rentalRecords.forEach(record => {
    const status = normalize(record["حالة_الواقعة_الإيجارية"]);
    incidentCounts[status] = (incidentCounts[status] || 0) + 1;
  });

  const sortedEntries = Object.entries(incidentCounts).sort((a, b) => b[1] - a[1]);
  const labels = sortedEntries.map(entry => entry[0]);
  const values = sortedEntries.map(entry => entry[1]);
  const total = rentalRecords.length;

  const totalElement = document.getElementById("incident-total");
  if (totalElement) totalElement.textContent = total;

  const colorMapping = {
    "موثقة": "#00778B",
    "طلب تعديل": "#20A4B8",
    "لم يتم الإنشاء": "#A3C6CC"
  };

  const fallbackColors = ["#00778B", "#20A4B8", "#A3C6CC", "#8A6BBE"];
  const chartColors = labels.map((label, index) => colorMapping[label] || fallbackColors[index % fallbackColors.length]);

  const detailsContainer = document.getElementById("incident-legend-details");
  if (detailsContainer) {
    detailsContainer.innerHTML = labels.map((label, index) => {
      const count = values[index];
      const percent = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
      return `
        <div class="chart-detail-item">
          <div class="chart-detail-info">
            <span class="chart-detail-color" style="background-color: ${chartColors[index]};"></span>
            <span class="chart-detail-label">${label}</span>
          </div>
          <span class="chart-detail-stats">${count} (${percent}%)</span>
        </div>
      `;
    }).join("");
  }

  const canvas = document.getElementById("rentalIncidentChart");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    if (rentalIncidentChart) rentalIncidentChart.destroy();

    rentalIncidentChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: chartColors,
          hoverBackgroundColor: chartColors,
          borderColor: "#FFFFFF",
          borderWidth: 4,
          hoverOffset: 12
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "55%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label(context) {
                const value = context.raw;
                const percent = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                return `${context.label}: ${value} (${percent}%)`;
              }
            }
          }
        },
        onClick(event, elements) {
          if (!elements.length) return;
          const selectedStatus = labels[elements[0].index];
          const filteredRecords = originalRecords.filter(record => normalize(record["حالة_الواقعة_الإيجارية"]) === selectedStatus);
          refreshDashboard(filteredRecords);
        }
      }
    });
  }

  const recordsContainer = document.getElementById("rental-records-container");
  const recordsCountLabel = document.getElementById("rental-records-count");

  if (recordsCountLabel) recordsCountLabel.textContent = rentalRecords.length;

  if (recordsContainer) {
    if (rentalRecords.length === 0) {
      recordsContainer.innerHTML = `<p style="text-align: center; color: var(--color-text-muted); padding: 20px;">لا توجد وقائع إيجارية مطابقة</p>`;
    } else {
      recordsContainer.innerHTML = rentalRecords.map((record, index) => {
        const city = record["المدينة"] || "-";
        const landNo = record["رقم_الارض"] || "-";
        const trespasser = record["المتعدي"] || "-";
        const incidentNo = record["رقم_الواقعة_الإيجارية"] || "-";
        const incidentStatus = record["حالة_الواقعة_الإيجارية"] || "-";
        const transactionWhere = record["أين_المعاملة"] || "-";
        const statusColor = colorMapping[incidentStatus] || "#00778B";

        return `
          <div style="background: var(--color-background); border: 1px solid var(--color-border); border-radius: var(--border-radius-sm); padding: 12px 14px; font-size: 0.9rem; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 6px;">
              <strong style="color: var(--color-primary);"># ${index + 1} - رقم الواقعة: ${incidentNo}</strong>
              <span style="background-color: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}40; padding: 3px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 600;">${incidentStatus}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 5px; color: var(--color-text);">
              <div><strong>المدينة:</strong> ${city}</div>
              <div><strong>رقم الأرض:</strong> ${landNo}</div>
              <div><strong>المتعدي:</strong> ${trespasser}</div>
              <div><strong>أين المعاملة:</strong> ${transactionWhere}</div>
            </div>
          </div>
        `;
      }).join("");
    }
  }
}

/**
 * دالة إنشاء وتحديث شارت المدن والتعديات والجدول المقابل
 */
function renderCityEncroachmentSection(records) {
  const validRecords = records.filter(record => {
    const city = normalize(record["المدينة"]);
    const classification = normalize(record["التصنيف"]);
    return city !== "" && classification !== "";
  });

  const cityClassificationMap = {};
  const allClassificationsSet = new Set();

  validRecords.forEach(record => {
    const city = String(record["المدينة"]).trim();
    const classification = String(record["التصنيف"]).trim();
    allClassificationsSet.add(classification);

    if (!cityClassificationMap[city]) {
      cityClassificationMap[city] = {};
    }
    cityClassificationMap[city][classification] = (cityClassificationMap[city][classification] || 0) + 1;
  });

  const cities = Object.keys(cityClassificationMap);
  const classifications = Array.from(allClassificationsSet);
  const total = validRecords.length;

  const colorMapping = {
    "وضع يد": "#CB2C30",
    "عقد منتهى": "#768692",
    "موثقة": "#00778B",
    "طلب تعديل": "#20A4B8"
  };
  const fallbackColors = ["#00778B", "#20A4B8", "#CB2C30", "#768692", "#8A6BBE"];

  const datasets = classifications.map((classification, index) => {
    const data = cities.map(city => cityClassificationMap[city][classification] || 0);
    const color = colorMapping[classification] || fallbackColors[index % fallbackColors.length];
    return {
      label: classification,
      data: data,
      backgroundColor: color,
      borderRadius: 4
    };
  });

  const detailsContainer = document.getElementById("city-legend-details");
  if (detailsContainer) {
    detailsContainer.innerHTML = classifications.map((classification, index) => {
      const color = colorMapping[classification] || fallbackColors[index % fallbackColors.length];
      const count = validRecords.filter(r => String(r["التصنيف"]).trim() === classification).length;
      const percent = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
      return `
        <div class="chart-detail-item" style="display: flex; align-items: center; justify-content: space-between;">
          <div class="chart-detail-info" style="display: flex; align-items: center; gap: 8px;">
            <span class="chart-detail-color" style="width: 12px; height: 12px; border-radius: 3px; background-color: ${color}; display: inline-block;"></span>
            <span class="chart-detail-label" style="font-weight: 500;">${classification}</span>
          </div>
          <span class="chart-detail-stats" style="color: var(--color-text-muted);">${count} (${percent}%)</span>
        </div>
      `;
    }).join("");
  }

  const canvas = document.getElementById("cityEncroachmentChart");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    if (cityEncroachmentChart) cityEncroachmentChart.destroy();

    cityEncroachmentChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: cities,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label(context) {
                return `${context.dataset.label}: ${context.raw} حالة`;
              }
            }
          }
        },
        onClick(event, elements) {
          if (!elements.length) return;
          const clickedCity = cities[elements[0].index];
          const filteredRecords = originalRecords.filter(record => normalize(record["المدينة"]) === normalize(clickedCity));
          refreshDashboard(filteredRecords);
        }
      }
    });
  }

  const recordsContainer = document.getElementById("city-records-container");
  const recordsCountLabel = document.getElementById("city-records-count");

  if (recordsCountLabel) recordsCountLabel.textContent = validRecords.length;

  if (recordsContainer) {
    if (validRecords.length === 0) {
      recordsContainer.innerHTML = `<p style="text-align: center; color: var(--color-text-muted); padding: 20px;">لا توجد بيانات مطابقة</p>`;
    } else {
      recordsContainer.innerHTML = validRecords.map((record, index) => {
        const city = record["المدينة"] || "-";
        const landNo = record["رقم_الارض"] || "-";
        const trespasser = record["المتعدي"] || "-";
        const classification = record["التصنيف"] || "-";
        const statusColor = colorMapping[classification] || "#00778B";

        return `
          <div style="background: var(--color-background); border: 1px solid var(--color-border); border-radius: var(--border-radius-sm); padding: 12px 14px; font-size: 0.9rem; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 6px;">
              <strong style="color: var(--color-primary);"># ${index + 1} - المدينة: ${city}</strong>
              <span style="background-color: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}40; padding: 3px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 600;">${classification}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; color: var(--color-text); font-size: 0.85rem;">
              <div><strong>رقم الأرض:</strong> ${landNo}</div>
              <div><strong>المتعدي:</strong> ${trespasser}</div>
            </div>
          </div>
        `;
      }).join("");
    }
  }
}

/**
 * دالة تهيئة وتحميل بيانات النظام من ملف JSON الخارجي
 */
async function initKpis() {
  const errorBox = document.getElementById("load-error");

  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const records = await response.json();
    if (!Array.isArray(records)) throw new Error("تنسيق الملف يجب أن يكون JSON Array.");

    originalRecords = [...records];
    currentRecords = [...records];

    refreshDashboard(currentRecords);

  } catch (error) {
    if (errorBox) {
      errorBox.hidden = false;
      errorBox.textContent = "تعذر تحميل ملف البيانات: " + error.message;
    }
  }
}

/**
 * مستمع الأحداث العام لإعادة تعيين الفلترة عند الضغط على زر التصفية
 */
document.addEventListener("click", (e) => {
  if (!e.target.classList.contains("reset-filter")) return;
  refreshDashboard(originalRecords);
});

/**
 * دالة تنفيذ البحث الشامل وعرض النتائج وإخفاء باقي الأقسام
 */
/**
 * دالة تنفيذ البحث الشامل وعرض النتائج وإخفاء باقي الأقسام
 */
function handleGlobalSearch(query, records) {
  const searchSection = document.getElementById("search-results-section");
  const resultsContainer = document.getElementById("search-results-container");
  const countLabel = document.getElementById("search-results-count");
  
  const mainSections = document.querySelectorAll(".kpi-section, .charts-section, .charts-section2");
  const searchTerm = query.trim().toLowerCase();

  if (!searchTerm) {
    if (searchSection) searchSection.style.display = "none";
    mainSections.forEach(sec => sec.style.display = "");
    return;
  }

  mainSections.forEach(sec => sec.style.display = "none");
  if (searchSection) searchSection.style.display = "block";

  const matchedRecords = records.filter(record => {
    return Object.values(record).some(value => 
      String(value ?? "").toLowerCase().includes(searchTerm)
    );
  });

  if (countLabel) countLabel.textContent = matchedRecords.length;
  if (!resultsContainer) return;

  // جدول ربط الألوان الثابتة للتصنيفات
  const colorMapping = {
    "وضع يد": "#CB2C30",    // أحمر
    "عقد منتهى": "#768692" // رمادي مساند
  };

  if (matchedRecords.length === 0) {
    resultsContainer.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--color-text-muted); padding: 30px;">لا توجد نتائج مطابقة لبحثك ("${query}")</p>`;
  } else {
    resultsContainer.innerHTML = matchedRecords.map((record, index) => {
      const city = record["المدينة"] || "-";
      const landNo = record["رقم_الارض"] || "-";
      const classification = record["التصنيف"] || "-";
      const subClassification = record["التصنيف_الفرعي"] || "-";
      const trespasser = record["المتعدي"] || "-";
      const status = record["حالة_التعدي"] || "-";
      const policeReport = record["رقم_بلاغ_الشرطة"] || "غير مسجل";
      const caseStatus = record["حالة_القضية"] || "لا توجد قضية";
      const rentalIncident = record["رقم_الواقعة_الإيجارية"] || "لا توجد";
      const notes = record["ملاحظات"] || "لا توجد ملاحظات";

      // تحديد لون الشارة بناءً على التصنيف (مع لون افتراضي احتياطي)
      const classificationColor = colorMapping[classification] || "#00778B";

      return `
        <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--border-radius-md); padding: 16px; box-shadow: var(--shadow-card); display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 8px;">
            <strong style="color: var(--color-primary); font-size: 1rem;"># ${index + 1} - ${city}</strong>
            <span style="background-color: ${classificationColor}15; color: ${classificationColor}; border: 1px solid ${classificationColor}40; padding: 3px 10px; border-radius: 999px; font-size: 0.78rem; font-weight: 600;">${classification}</span>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.88rem; color: var(--color-text);">
            <div><strong>رقم الأرض:</strong> ${landNo}</div>
            <div><strong>المتعدي:</strong> ${trespasser}</div>
            <div><strong>التصنيف الفرعي:</strong> ${subClassification}</div>
            <div><strong>حالة التعدي:</strong> ${status}</div>
            <div><strong>رقم بلاغ الشرطة:</strong> ${policeReport}</div>
            <div><strong>حالة القضية:</strong> ${caseStatus}</div>
            <div><strong>الواقعة الإيجارية:</strong> ${rentalIncident}</div>
            <div style="background: var(--color-background); padding: 8px; border-radius: var(--border-radius-sm); margin-top: 4px; font-size: 0.85rem;">
              <strong>ملاحظات:</strong> ${notes}
            </div>
          </div>
        </div>
      `;
    }).join("");
  }
}

/**
 * ربط مستمع الحدث لحقل البحث وإلغاء البحث
 */
document.addEventListener("input", (e) => {
  if (e.target && e.target.id === "global-search-input") {
    handleGlobalSearch(e.target.value, originalRecords);
  }
});

document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "clear-search-btn") {
    const searchInput = document.getElementById("global-search-input");
    if (searchInput) {
      searchInput.value = "";
      handleGlobalSearch("", originalRecords);
    }
  }
});


// تشغيل النظام عند التحميل
initKpis();