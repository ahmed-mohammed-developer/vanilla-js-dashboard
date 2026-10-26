/**
 * مؤشرات وتحليلات التعديات العقارية
 * يتطلب وجود ملف encroachments.json في مجلد البيانات (data).
 */

const DATA_URL = "./data/encroachments.json";

// متغيرات عامة لحفظ حالة الرسوم البيانية والسجلات
let donutChart = null;
let statusChart = null;
let originalRecords = [];
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
 * بداية الدالة
 */
const countWhere = (records, predicate) => records.filter(predicate).length;
// نهاية الدالة

/**
 * دالة مساعدة: التحقق من وجود قيمة صالحة غير فارغة
 * بداية الدالة
 */
const hasValue = value => value !== null && value !== undefined && String(value).trim() !== "";
// نهاية الدالة

/**
 * دالة تطبيع النصوص (توحيد المسافات وإزالة الفراغات الزائدة)
 * بداية الدالة
 */
function normalize(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}
// نهاية الدالة

/**
 * دالة تحديث اللوحة بالكامل (المؤشرات والرسوم البيانية)
 * بداية الدالة
 */
function refreshDashboard(records) {
  currentRecords = records;
  renderKpis(records);
  renderDonutChart(records);
  renderStatusChart(records);
}
// نهاية الدالة

/**
 * دالة حساب مؤشرات الأداء الرئيسية (KPIs) بناءً على قواعد البيانات
 * بداية الدالة
 */
function calculateKpis(records) {
  const expired = r => normalize(r["التصنيف"]) === "عقد منتهى";
  const handPossession = r => normalize(r["التصنيف"]) === "وضع يد";
  const evicted = r => ["تم الاخلاء", "تم الإخلاء"].includes(normalize(r["حالة_التعدي"]));
  const finalJudgment = r => normalize(r["حالة_القضية"]) === "حكم نهائي";
  const initialJudgment = r => normalize(r["حالة_القضية"]) === "حكم ابتدائي";
  const pendingCase = r => normalize(r["حالة_القضية"]) === "قضية منظورة";
  const rentalIncident = r => hasValue(r["رقم_الواقعة_الإيجارية"]);
  const lawsuit = r => hasValue(r["رقم_الدعوى_القضائية"]) || hasValue(r["رقم_صك_الدعوى"]) || finalJudgment(r) || initialJudgment(r) || pendingCase(r);

  return [
    { id: "total", label: "إجمالي التعديات", value: records.length, icon: "total", color: "#00778B", detail: "عدد السجلات في قاعدة البيانات." },
    { id: "incidents", label: "وقائع إيجارية", value: countWhere(records, rentalIncident), icon: "incident", color: "#C18B20", detail: "السجلات التي لها واقعة إيجارية." },
    { id: "lawsuits", label: "رُفعت عليها قضايا", value: countWhere(records, lawsuit), icon: "case", color: "#5B78B7", detail: "السجلات المرتبطة بقضية أو صك." },
  ];
}
// نهاية الدالة

/**
 * دالة إنشاء وتحديث رسم حالة التعدي (Donut Chart)
 * بداية الدالة
 */
function renderStatusChart(records) {
  const statusCounts = {};

  records.forEach(record => {
    const status = normalize(record["حالة_التعدي"]) || "غير محدد";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const labels = Object.keys(statusCounts);
  const values = Object.values(statusCounts);
  const totalElement = document.getElementById("status-total");

  if (totalElement) {
    totalElement.textContent = records.length;
  }

  const colors = ["#00778B", "#71B2C9", "#16856B", "#CB2C30", "#F1B434", "#768692", "#8A6BBE"];
  const canvas = document.getElementById("statusChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (statusChart) statusChart.destroy();

  statusChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: "#FFFFFF",
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "50%",
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const value = context.raw;
              const percent = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${value} (${percent}%)`;
            }
          }
        }
      },
      onClick(event, elements) {
        if (!elements.length) return;
        const selectedStatus = labels[elements[0].index];
        const filteredRecords = originalRecords.filter(r => normalize(r["حالة_التعدي"]) === selectedStatus);
        refreshDashboard(filteredRecords);
      }
    }
  });
}
// نهاية الدالة

/**
 * دالة إنشاء وتحديث رسم تصنيف التعديات (عقود منتهية مقابل وضع يد)
 * بداية الدالة
 */
/**
 * دالة إنشاء وتحديث رسم تصنيف التعديات (عقود منتهية مقابل وضع يد) مع عرض التفاصيل
 * بداية الدالة
 */
function renderDonutChart(records) {
  const expiredRecords = records.filter(r => normalize(r["التصنيف"]) === "عقد منتهى");
  const handRecords = records.filter(r => normalize(r["التصنيف"]) === "وضع يد");

  const totalElement = document.getElementById("chart-total");
  const chartCanvas = document.getElementById("encroachmentsChart");
  const detailsContainer = document.getElementById("encroachments-legend-details");
  
  if (!chartCanvas) return;

  const total = records.length;
  if (totalElement) totalElement.textContent = total;

  // تجهيز البيانات والنسب المئوية
  const dataDetails = [
    { label: "وضع اليد", count: handRecords.length, color: "#CB2C30", records: handRecords },
    { label: "العقود المنتهية", count: expiredRecords.length, color: "#768692", records: expiredRecords }
  ];

  // توليد كاردات التفاصيل HTML تلقائياً
  if (detailsContainer) {
    detailsContainer.innerHTML = dataDetails.map(item => {
      const percent = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
      return `
        <div class="chart-detail-item">
          <div class="chart-detail-info">
            <span class="chart-detail-color" style="background-color: ${item.color};"></span>
            <span class="chart-detail-label">${item.label}</span>
          </div>
          <span class="chart-detail-stats">${item.count} (${percent}%)</span>
        </div>
      `;
    }).join("");
  }

  const ctx = chartCanvas.getContext("2d");
  if (donutChart) donutChart.destroy();

  donutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: dataDetails.map(d => d.label),
      datasets: [{
        data: dataDetails.map(d => d.count),
        backgroundColor: dataDetails.map(d => d.color),
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
        legend: { display: false }, // قمنا بإلغاء الليجند الافتراضي لأننا صنعنا كاردات مخصصة بدلاً منه
        tooltip: {
          callbacks: {
            label(context) {
              const value = context.raw;
              const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${context.label}: ${value} (${percent}%)`;
            }
          }
        }
      },
      onClick(event, elements) {
        if (!elements.length) return;
        const index = elements[0].index;
        refreshDashboard(dataDetails[index].records);
      }
    }
  });
}
// نهاية الدالة
// نهاية الدالة

/**
 * دالة طباعة وبناء بطاقات مؤشرات الأداء الرئيسية في الواجهة
 * بداية الدالة
 */
function renderKpis(records) {
  const container = document.getElementById("kpi-container");
  const formatter = new Intl.NumberFormat("en-US");
  const kpis = calculateKpis(records);

  // تم حذف تذييل البطاقة (.kpi-foot) بالكامل من قالب HTML الخاص بالبطاقات
  container.innerHTML = kpis.map(kpi => `
    <div class="kpi-card" style="--accent:${kpi.color}">
      <span class="kpi-card-top">
        <span class="kpi-label">${kpi.label}</span>
        <span class="kpi-icon">${icons[kpi.icon]}</span>
      </span>
      <strong class="kpi-value" dir="ltr">${formatter.format(kpi.value)}</strong>
    </div>
  `).join("");
}// نهاية الدالة

/**
 * دالة تهيئة وتحميل بيانات النظام من ملف JSON الخارجي
 * بداية الدالة
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
    errorBox.hidden = false;
    errorBox.textContent = "تعذر تحميل ملف البيانات: " + error.message;
  }
}
// نهاية الدالة

/**
 * مستمع الأحداث العام لإعادة تعيين الفلترة عند الضغط على زر التصفية
 * بداية الاستماع
 */
document.addEventListener("click", (e) => {
  if (!e.target.classList.contains("reset-filter")) return;
  refreshDashboard(originalRecords);
});
// نهاية الاستماع

// تشغيل النظام عند التحميل
initKpis();