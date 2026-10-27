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
  renderCaseChart(records);
  renderRentalIncidentSection(records); // <--- إضافة دالة الوقائع الإيجارية هنا
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
 * دالة إنشاء وتحديث رسم تصنيف التعديات مع الكاردات الخاصة بها
 * بداية الدالة
 */
/**
 * دالة إنشاء وتحديث رسم تصنيف التعديات مع إخفاء التصنيفات التي رصيدها صفر عند الفلترة
 * بداية الدالة
 */
function renderDonutChart(records) {
  const classificationCounts = {};

  // تجميع السجلات حسب التصنيف وتجاهل الفارغة
  records.forEach(record => {
    const classification = normalize(record["التصنيف"]);
    if (!classification) return;

    classificationCounts[classification] = (classificationCounts[classification] || 0) + 1;
  });

  // ترتيب التصنيفات من الأكبر إلى الأصغر تنازلياً
  const sortedEntries = Object.entries(classificationCounts)
    .sort((a, b) => b[1] - a[1]);

  const labels = sortedEntries.map(entry => entry[0]);
  const values = sortedEntries.map(entry => entry[1]);
  
  // إجمالي السجلات للتصنيفات الموجودة
  const total = values.reduce((sum, val) => sum + val, 0);

  const totalElement = document.getElementById("chart-total");
  const chartCanvas = document.getElementById("encroachmentsChart");
  const detailsContainer = document.getElementById("encroachments-legend-details");
  
  if (!chartCanvas) return;

  if (totalElement) {
    totalElement.textContent = total;
  }

  /**
   * جدول ربط الألوان الثابتة لتصنيفات التعديات
   */
  const colorMapping = {
    "وضع يد": "#CB2C30",          // أحمر
    "عقد منتهى": "#768692"       // رمادي مساند
  };

  // مصفوفة ألوان احتياطية في حال ظهر تصنيف جديد
  const fallbackColors = [
    "#CB2C30",
    "#768692",
    "#00778B"
  ];

  // إعطاء لون ثابت لكل تصنيف بناءً على اسمه
  const chartColors = labels.map((label, index) => {
    return colorMapping[label] || fallbackColors[index % fallbackColors.length];
  });

  // توليد كاردات التفاصيل HTML تلقائياً (تظهر فقط التصنيفات التي تحتوي على قيم)
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
        const index = elements[0].index;
        const selectedStatus = labels[index];

        // التصفية بناءً على التصنيف المحدد فعلياً
        const filteredRecords = originalRecords.filter(r => normalize(r["التصنيف"]) === selectedStatus);
        refreshDashboard(filteredRecords);
      }
    }
  });
}
// نهاية الدالة
// نهاية الدالة

/**
 * دالة إنشاء وتحديث رسم حالة التعدي مع الكاردات الخاصة بها
 * بداية الدالة
 */
/**
 * دالة إنشاء وتحديث رسم حالة التعدي مع عرض التفاصيل مرتبة من الأكبر إلى الأصغر
 * بداية الدالة
 */
/**
 * دالة إنشاء وتحديث رسم حالة التعدي مع الحفاظ على ثبات الألوان والترتيب بعد التصفية
 * بداية الدالة
 */
/**
 
/**
 * إنشاء وتحديث رسم حالات التعدي
 * مع تثبيت لون كل حالة وترتيبها من الأكبر إلى الأصغر
 */


/**
 * دالة إنشاء وتحديث رسم حالة التعدي مع ربط لون ثابت ومحدد لكل حالة
 * بداية الدالة
 */
function renderStatusChart(records) {
  const statusCounts = {};

  // تجميع السجلات حسب حالة التعدي
  records.forEach(record => {
    const status = normalize(record["حالة_التعدي"]) || "غير محدد";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  // ترتيب الحالات من الأكبر إلى الأصغر
  const sortedEntries = Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1]);

  const labels = sortedEntries.map(entry => entry[0]);
  const values = sortedEntries.map(entry => entry[1]);
  const total = records.length;

  /**
   * جدول ربط الألوان الثابتة: قم بتعديل الألوان هنا حسب رغبتك لكل حالة
   */
  const colorMapping = {
    "قائم": "#A7C8CE",          // أحمر
    "تم الاخلاء": "#00778B",     // أخضر (احتمال اختلاف الهمزة)
    "لدى القانونية": "#174A5B", // بنفسجي
    "لدى القانونية قبل اللجنة": "#648F9A",         // رمادي
    "تحت إجراءات الإستلام": "#25A6B7"       // أصفر
  };

  // مصفوفة ألوان احتياطية في حال ظهرت حالة جديدة غير موجودة في الجدول أعلاه
  const fallbackColors = [
    "#00778B",
    "#174A5B",
    "#A7C8CE",
    "#648F9A",
    "#25A6B7",
    "#16856B"
  ];

  // إعطاء لون ثابت لكل حالة بناءً على اسمها، وإذا لم توجد يُأخذ لها لون احتياطي بالترتيب
  const chartColors = labels.map((label, index) => {
    return colorMapping[label] || fallbackColors[index % fallbackColors.length];
  });

  // تحديث إجمالي الحالات
  const totalElement = document.getElementById("status-total");

  if (totalElement) {
    totalElement.textContent = total;
  }

  // تحديث تفاصيل الشارت (الكاردات السفلية)
  const detailsContainer = document.getElementById(
    "status-legend-details"
  );

  if (detailsContainer) {
    detailsContainer.innerHTML = labels.map((label, index) => {
      const count = values[index];
      const percent = total > 0
        ? ((count / total) * 100).toFixed(1)
        : "0.0";

      return `
        <div class="chart-detail-item">
          <div class="chart-detail-info">
            <span
              class="chart-detail-color"
              style="background-color: ${chartColors[index]};"
            ></span>
            <span class="chart-detail-label">${label}</span>
          </div>
          <span class="chart-detail-stats">
            ${count} (${percent}%)
          </span>
        </div>
      `;
    }).join("");
  }

  // إنشاء الشارت
  const canvas = document.getElementById("statusChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (statusChart) {
    statusChart.destroy();
  }

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
        legend: {
          display: false
        },

        tooltip: {
          callbacks: {
            label(context) {
              const value = context.raw;
              const percent = total > 0
                ? ((value / total) * 100).toFixed(1)
                : "0.0";

              return `${context.label}: ${value} (${percent}%)`;
            }
          }
        }
      },

      onClick(event, elements) {
        if (!elements.length) return;

        const selectedStatus = labels[elements[0].index];

        const filteredRecords = originalRecords.filter(record => {
          const status =
            normalize(record["حالة_التعدي"]) || "غير محدد";

          return status === selectedStatus;
        });

        refreshDashboard(filteredRecords);
      }
    }
  });
}
// نهاية الدالة

// متغير عام لحفظ حالة شارت القضايا
let caseChart = null;

/**
 * دالة إنشاء وتحديث رسم حالة القضية مع ربط ألوان ثابتة وتفاصيل الكاردات
 * بداية الدالة
 */
/**
 * دالة إنشاء وتحديث رسم حالة القضية للحведе فقط على السجلات التي تحتوي على حالة قضية
 * بداية الدالة
 */
function renderCaseChart(records) {
  const caseCounts = {};

  // تجميع السجلات حسب حالة القضية، وتجاهل السجلات التي لا تحتوي على قيمة
  records.forEach(record => {
    const caseStatus = normalize(record["حالة_القضية"]);
    
    // إذا لم تكن هناك قيمة مسجلة في حالة القضية، يتم تخطي هذا السجل تماماً
    if (!caseStatus) return;

    caseCounts[caseStatus] = (caseCounts[caseStatus] || 0) + 1;
  });

  // ترتيب الحالات من الأكبر إلى الأصغر تنازلياً
  const sortedEntries = Object.entries(caseCounts)
    .sort((a, b) => b[1] - a[1]);

  const labels = sortedEntries.map(entry => entry[0]);
  const values = sortedEntries.map(entry => entry[1]);
  
  // إجمالي السجلات التي تحتوي على حالات قضايا فقط
  const total = values.reduce((sum, val) => sum + val, 0);

  /**
   * جدول ربط الألوان الثابتة لحالة القضية
   */
  const colorMapping = {
    "حكم نهائي": "#00778B",     // أخضر
    "قضية منظورة": "#A3C6CC",  // أصفر / تحذيري
    "حكم ابتدائي": "#20A4B8"    // لون سار الأساسي
  };

  // مصفوفة ألوان احتياطية في حال ظهرت حالة جديدة
  const fallbackColors = [
    "#00778B",
    "#A3C6CC",
    "#20A4B8",
  ];

  // إعطاء لون ثابت لكل حالة بناءً على اسمها
  const chartColors = labels.map((label, index) => {
    return colorMapping[label] || fallbackColors[index % fallbackColors.length];
  });

  // تحديث إجمالي الحالات في منتصف الشارت
  const totalElement = document.getElementById("case-total");
  if (totalElement) {
    totalElement.textContent = total;
  }

  // تحديث تفاصيل الشارت (الكاردات السفلية)
  const detailsContainer = document.getElementById("case-legend-details");
  if (detailsContainer) {
    detailsContainer.innerHTML = labels.map((label, index) => {
      const count = values[index];
      const percent = total > 0
        ? ((count / total) * 100).toFixed(1)
        : "0.0";

      return `
        <div class="chart-detail-item">
          <div class="chart-detail-info">
            <span
              class="chart-detail-color"
              style="background-color: ${chartColors[index]};"
            ></span>
            <span class="chart-detail-label">${label}</span>
          </div>
          <span class="chart-detail-stats">
            ${count} (${percent}%)
          </span>
        </div>
      `;
    }).join("");
  }

  // إنشاء الشارت باستخدام مكتبة Chart.js
  const canvas = document.getElementById("caseChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (caseChart) {
    caseChart.destroy();
  }

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
        legend: {
          display: false
        },

        tooltip: {
          callbacks: {
            label(context) {
              const value = context.raw;
              const percent = total > 0
                ? ((value / total) * 100).toFixed(1)
                : "0.0";

              return `${context.label}: ${value} (${percent}%)`;
            }
          }
        }
      },

      onClick(event, elements) {
        if (!elements.length) return;

        const selectedStatus = labels[elements[0].index];

        // التصفية بناءً على الحالات الموجودة فعلياً
        const filteredRecords = originalRecords.filter(record => {
          const status = normalize(record["حالة_القضية"]);
          return status === selectedStatus;
        });

        refreshDashboard(filteredRecords);
      }
    }
  });
}
// نهاية الدالة


// متغير عام لحفظ شارت حالة الواقعة
let rentalIncidentChart = null;

/**
 * دالة إنشاء وتحديث رسم "حالة الواقعة الإيجارية" وعرض قائمة البيانات المرتبطة بها
 * بداية الدالة
 */
function renderRentalIncidentSection(records) {
  const incidentCounts = {};

  // تصفية السجلات التي تحتوي حصراً على حقل "حالة_الواقعة_الإيجارية" وتجميعها
  const rentalRecords = records.filter(record => {
    const status = normalize(record["حالة_الواقعة_الإيجارية"]);
    return status !== ""; 
  });

  rentalRecords.forEach(record => {
    const status = normalize(record["حالة_الواقعة_الإيجارية"]);
    incidentCounts[status] = (incidentCounts[status] || 0) + 1;
  });

  // ترتيب الحالات تنازلياً
  const sortedEntries = Object.entries(incidentCounts)
    .sort((a, b) => b[1] - a[1]);

  const labels = sortedEntries.map(entry => entry[0]);
  const values = sortedEntries.map(entry => entry[1]);
  const total = rentalRecords.length;

  // تحديث عداد إجمالي الوقائع الإيجارية في منتصف الشارت
  const totalElement = document.getElementById("incident-total");
  if (totalElement) totalElement.textContent = total;

  /**
   * جدول ربط الألوان الثابتة (ألوان الشارت)
   */
  const colorMapping = {
    "موثقة": "#00778B",        // أخضر
    "طلب تعديل": "#20A4B8",    // أصفر / تحذيري
    "لم يتم الإنشاء": "#A3C6CC" // أحمر
  };

  const fallbackColors = ["#00778B", "#20A4B8", "#00778B", "#A3C6CC", "#8A6BBE"];

  const chartColors = labels.map((label, index) => {
    return colorMapping[label] || fallbackColors[index % fallbackColors.length];
  });

  // تحديث تفاصيل الشارت (الكاردات السفلية للشارت)
  const detailsContainer = document.getElementById("incident-legend-details");
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

  // رسم الشارت (Doughnut Chart)
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
          const filteredRecords = originalRecords.filter(record => {
            return normalize(record["حالة_الواقعة_الإيجارية"]) === selectedStatus;
          });
          refreshDashboard(filteredRecords);
        }
      }
    });
  }

  // --- القسم الثاني: عرض قائمة البيانات والترقيم الرقمي (Numbered List) ---
  const recordsContainer = document.getElementById("rental-records-container");
  const recordsCountLabel = document.getElementById("rental-records-count");

  if (recordsCountLabel) {
    recordsCountLabel.textContent = rentalRecords.length;
  }

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

        // إيجاد اللون المخصص لهذه الحالة بناءً على الشارت
        const statusColor = colorMapping[incidentStatus] || "#00778B";

        return `
          <div style="background: var(--color-background); border: 1px solid var(--color-border); border-radius: var(--border-radius-sm); padding: 12px 14px; font-size: 0.9rem; display: flex; flex-direction: column; gap: 8px;">
            <!-- الترويسة: التعداد ورقم الواقعة والحالة بنفس ألوان ونمط الشارت -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 6px;">
              <strong style="color: var(--color-primary);"># ${index + 1} - رقم الواقعة: ${incidentNo}</strong>
              <span style="background-color: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}40; padding: 3px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 600;">${incidentStatus}</span>
            </div>
            
            <!-- تفاصيل الحقول: كل حقل في صف مستقل -->
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
// نهاية الدالة

/**
 * دالة طباعة وبناء بطاقات مؤشرات الأداء الرئيسية في الواجهة
 * بداية الدالة
 */
function renderKpis(records) {
  const container = document.getElementById("kpi-container");
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
// نهاية الدالة

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