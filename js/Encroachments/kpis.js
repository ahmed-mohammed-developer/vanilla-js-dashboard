/**
 * مؤشرات التعديات
 * يتوقع أن يكون encroachments.json في نفس مجلد هذا الملف.
 * التشغيل عبر Live Server أو خادم محلي مطلوب لأن fetch لا يعمل عادةً مع file://.
 */

const DATA_URL = "./data/encroachments.json";

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

const countWhere = (records, predicate) => records.filter(predicate).length;

const hasValue = value =>
  value !== null &&
  value !== undefined &&
  String(value).trim() !== "";

function normalize(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function calculateKpis(records) {

  const expired = r =>
    normalize(r["التصنيف"]) === "عقد منتهى";

  const handPossession = r =>
    normalize(r["التصنيف"]) === "وضع يد";

  const evicted = r =>
    ["تم الاخلاء", "تم الإخلاء"].includes(
      normalize(r["حالة_التعدي"])
    );

  const finalJudgment = r =>
    normalize(r["حالة_القضية"]) === "حكم نهائي";

  const initialJudgment = r =>
    normalize(r["حالة_القضية"]) === "حكم ابتدائي";

  const pendingCase = r =>
    normalize(r["حالة_القضية"]) === "قضية منظورة";

  const rentalIncident = r =>
    hasValue(r["رقم_الواقعة_الإيجارية"]);

  const lawsuit = r =>
    hasValue(r["رقم_الدعوى_القضائية"]) ||
    hasValue(r["رقم_صك_الدعوى"]) ||
    finalJudgment(r) ||
    initialJudgment(r) ||
    pendingCase(r);

  return [
    {
      id: "total",
      label: "إجمالي التعديات",
      value: records.length,
      icon: "total",
      color: "#00778B",
      detail: "عدد السجلات في قاعدة البيانات."
    },
    
    {
      id: "expired",
      label: "العقود المنتهية",
      value: countWhere(records, expired),
      icon: "contract",
      color: "#71B2C9",
      detail: "السجلات المصنفة عقد منتهى."
    },
    {
      id: "hand",
      label: "تعديات وضع اليد",
      value: countWhere(records, handPossession),
      icon: "hand",
      color: "#768692",
      detail: "السجلات المصنفة وضع يد."
    },
    {
      id: "evicted",
      label: "تم الإخلاء",
      value: countWhere(records, evicted),
      icon: "check",
      color: "#16856B",
      detail: "السجلات التي تم إخلاؤها."
    },
     {
      id: "active",
      label: "التعديات القائمة",
      value: countWhere(
        records,
        r => normalize(r["حالة_التعدي"]) === "قائم"
      ),
      icon: "active",
      color: "#CB2C30",
      detail: "التعديات التي مازالت قائمة."
    },
    {
      id: "legal",
      label: "لدى القانونية",
      value: countWhere(
        records,
        r => normalize(r["حالة_التعدي"]) === "لدى القانونية"
      ),
      icon: "legal",
      color: "#8A6BBE",
      detail: "التعديات المحالة للإدارة القانونية."
    },
   
    {
      id: "cities",
      label: "عدد المدن",
      value: new Set(
        records
          .map(r => normalize(r["المدينة"]))
          .filter(Boolean)
      ).size,
      icon: "city",
      color: "#00778B",
      detail: "عدد المدن المختلفة."
    },
    {
      id: "incidents",
      label: "وقائع إيجارية",
      value: countWhere(records, rentalIncident),
      icon: "incident",
      color: "#C18B20",
      detail: "السجلات التي لها واقعة إيجارية."
    },
    {
      id: "lawsuits",
      label: "رُفعت عليها قضايا",
      value: countWhere(records, lawsuit),
      icon: "case",
      color: "#5B78B7",
      detail: "السجلات المرتبطة بقضية أو صك."
    },
    {
      id: "final",
      label: "أحكام نهائية",
      value: countWhere(records, finalJudgment),
      icon: "final",
      color: "#16856B",
      detail: "القضايا ذات الحكم النهائي."
    },
    {
      id: "initial",
      label: "أحكام ابتدائية",
      value: countWhere(records, initialJudgment),
      icon: "initial",
      color: "#D18A35",
      detail: "القضايا ذات الحكم الابتدائي."
    },
    {
      id: "pending",
      label: "قضايا منظورة",
      value: countWhere(records, pendingCase),
      icon: "pending",
      color: "#CB2C30",
      detail: "القضايا المنظورة حالياً."
    }
  ];
}

function renderKpis(records) {

  const container = document.getElementById("kpi-container");
  const countLabel = document.getElementById("record-count");
  const note = document.getElementById("data-note");

  const formatter = new Intl.NumberFormat("en-US");
  const kpis = calculateKpis(records);

  countLabel.textContent =
    `${formatter.format(records.length)} سجل`;

  container.innerHTML = kpis.map(kpi => `
    <button class="kpi-card" type="button"
      style="--accent:${kpi.color}"
      aria-label="${kpi.label}: ${kpi.value}">
      <span class="kpi-card-top">
        <span class="kpi-label">${kpi.label}</span>
        <span class="kpi-icon">${icons[kpi.icon]}</span>
      </span>
      <strong class="kpi-value" dir="ltr">
        ${formatter.format(kpi.value)}
      </strong>
      <span class="kpi-foot">
        <span>تفاصيل المؤشر</span>
        <span class="more">عرض التوضيح ←</span>
      </span>
    </button>
  `).join("");

  [...container.querySelectorAll(".kpi-card")]
    .forEach((button, index) => {
      button.addEventListener("click", () => {
        const kpi = kpis[index];

        alert(
`${kpi.label}
العدد: ${formatter.format(kpi.value)}

طريقة الاحتساب:
${kpi.detail}`
        );
      });
    });

  note.hidden = false;
  note.textContent =
    `ملف البيانات يحتوي على ${records.length} سجلًا، منها ${
      kpis.find(k => k.id === "expired").value
    } عقدًا منتهيًا و${
      kpis.find(k => k.id === "hand").value
    } حالة وضع يد.`;
}

async function initKpis() {

  const errorBox = document.getElementById("load-error");

  try {

    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const records = await response.json();

    if (!Array.isArray(records)) {
      throw new Error("تنسيق الملف يجب أن يكون JSON Array.");
    }

    renderKpis(records);

  } catch (error) {

    errorBox.hidden = false;
    errorBox.textContent =
      "تعذر تحميل ملف البيانات: " +
      error.message;

    document.getElementById("record-count")
      .textContent = "تعذر التحميل";
  }
}

initKpis();