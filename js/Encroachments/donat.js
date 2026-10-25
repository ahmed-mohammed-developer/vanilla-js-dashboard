

import { renderKpis } from "./kpis.js";

const DATA_URL = "./data/encroachments.json";

let donutChart = null;
let allRecords = [];

function normalize(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function renderDonutChart(records) {

  allRecords = records;

  const contractRecords = records.filter(
    r => normalize(r["التصنيف"]) === "عقد منتهى"
  );

  const handRecords = records.filter(
    r => normalize(r["التصنيف"]) === "وضع يد"
  );

  const total = records.length;

  document.getElementById("chart-total").textContent =
    total;

  const ctx =
    document.getElementById("encroachmentsChart")
      .getContext("2d");

  if (donutChart) {
    donutChart.destroy();
  }

  donutChart = new Chart(ctx, {

    type: "doughnut",

    data: {
      labels: [
        "العقود المنتهية",
        "وضع اليد"
      ],

      datasets: [{
        data: [
          contractRecords.length,
          handRecords.length
        ],

        backgroundColor: [
          "#00778B",
          "#71B2C9"
        ],

        borderColor: "#FFFFFF",
        borderWidth: 4,
        hoverOffset: 12
      }]
    },

    options: {

      responsive: true,

      maintainAspectRatio: false,

      cutout: "72%",

      plugins: {

        legend: {
          position: "bottom",

          labels: {
            usePointStyle: true,
            padding: 20,

            font: {
              family: "IBM Plex Sans Arabic",
              size: 13
            }
          }
        },

        tooltip: {

          callbacks: {

            label(context) {

              const value = context.raw;

              const percent =
                ((value / total) * 100).toFixed(1);

              return `${context.label}: ${value} (${percent}%)`;
            }
          }
        }
      },

      onClick(event, elements) {

        if (!elements.length) return;

        const index = elements[0].index;

        if (index === 0) {

          renderKpis(contractRecords);

          document.getElementById("chart-total")
            .textContent = contractRecords.length;
        }

        if (index === 1) {

          renderKpis(handRecords);

          document.getElementById("chart-total")
            .textContent = handRecords.length;
        }
      }
    }
  });

  const resetButton =
    document.getElementById("reset-filter");

  if (resetButton && !resetButton.dataset.bound) {

    resetButton.dataset.bound = "true";

    resetButton.addEventListener("click", () => {

      renderKpis(allRecords);

      document.getElementById("chart-total")
        .textContent = allRecords.length;
    });
  }
}

async function loadDonutData() {

  try {

    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const records = await response.json();

    renderDonutChart(records);

  } catch (error) {

    console.error("Donut Chart Error:", error);

  }
}

loadDonutData();

export { renderDonutChart };