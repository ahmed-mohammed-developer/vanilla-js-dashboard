// js/map.js
import { originalRecords, normalize, refreshDashboard } from './main.js';

let selectedCityForFilter = "";

/**
 * دالة حساب إحصائيات المدينة المحددة من البيانات
 */
function getCityStatistics(cityName, records) {
  const normalizedCity = normalize(cityName);

  const cityRecords = records.filter(item => {
    return normalize(item["المدينة"]) === normalizedCity;
  });

  const total = cityRecords.length;
  const expiredContracts = cityRecords.filter(item => normalize(item["التصنيف"]) === "عقد منتهى").length;
  const handPossession = cityRecords.filter(item => normalize(item["التصنيف"]) === "وضع يد").length;

  return {
    city: cityName,
    total,
    expiredContracts,
    handPossession,
    records: cityRecords
  };
}

/**
 * دالة تحديث كارد الإحصائيات عند اختيار مدينة
 */
function updateCityStatsCard(cityName) {
  const stats = getCityStatistics(cityName, originalRecords);
  selectedCityForFilter = cityName;

  const titleElem = document.getElementById("selected-city-name");
  const totalElem = document.getElementById("stat-total-count");
  const handElem = document.getElementById("stat-hand-count");
  const handPercentElem = document.getElementById("stat-hand-percent");
  const contractElem = document.getElementById("stat-contract-count");
  const contractPercentElem = document.getElementById("stat-contract-percent");
  const filterBtn = document.getElementById("filter-by-city-btn");

  if (titleElem) titleElem.textContent = stats.city;
  if (totalElem) totalElem.textContent = stats.total;
  if (handElem) handElem.textContent = stats.handPossession;
  if (contractElem) contractElem.textContent = stats.expiredContracts;

  const handPercent = stats.total > 0 ? ((stats.handPossession / stats.total) * 100).toFixed(1) : "0.0";
  const contractPercent = stats.total > 0 ? ((stats.expiredContracts / stats.total) * 100).toFixed(1) : "0.0";

  if (handPercentElem) handPercentElem.textContent = `(${handPercent}%)`;
  if (contractPercentElem) contractPercentElem.textContent = `(${contractPercent}%)`;

  if (filterBtn) {
    filterBtn.disabled = false;
    filterBtn.textContent = `تصفية لوحة التحكم لمدينة (${cityName})`;
  }
}

/**
 * دالة ربط أحداث النقر على عناصر الخريطة والدبابيس
 */
export function initSaudiMapEvents() {
  const regions = document.querySelectorAll(".saudi-map .region");
  const cityPins = document.querySelectorAll(".saudi-map .city-pin");
  const filterBtn = document.getElementById("filter-by-city-btn");

  cityPins.forEach(pin => {
    pin.addEventListener("click", () => {
      cityPins.forEach(p => p.classList.remove("active"));
      regions.forEach(r => r.classList.remove("active"));

      pin.classList.add("active");
      const cityName = pin.getAttribute("data-city");
      updateCityStatsCard(cityName);
    });
  });

  regions.forEach(region => {
    region.addEventListener("click", () => {
      cityPins.forEach(p => p.classList.remove("active"));
      regions.forEach(r => r.classList.remove("active"));

      region.classList.add("active");
      const regionName = region.getAttribute("data-name");
      updateCityStatsCard(regionName);
    });
  });

  if (filterBtn) {
    filterBtn.addEventListener("click", () => {
      if (!selectedCityForFilter) return;
      const filtered = originalRecords.filter(r => normalize(r["المدينة"]) === normalize(selectedCityForFilter));
      refreshDashboard(filtered);
    });
  }
}