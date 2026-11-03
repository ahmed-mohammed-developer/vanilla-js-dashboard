const navbarContainer = document.querySelector("#navbar-container");

if (navbarContainer) {
  navbarContainer.innerHTML = `
    <header class="navbar">
      <div class="navbar__container">
        <!-- زر قائمة الجوال -->
        <button
          class="navbar__toggle"
          type="button"
          aria-label="فتح القائمة"
          aria-expanded="false"
          aria-controls="primary-navigation"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>

        <!-- روابط التنقل -->
        <nav
          class="navbar__nav"
          id="primary-navigation"
          aria-label="القائمة الرئيسية"
        >
          <a class="navbar__link disabled-link" href="javascript:void(0);" data-page="index.html" aria-disabled="true">
            الرئيسية
          </a>

          <a class="navbar__link disabled-link" href="javascript:void(0);" data-page="target2026.html" aria-disabled="true">
            هدف 2026م
          </a>

          <a class="navbar__link disabled-link" href="javascript:void(0);" data-page="deeds.html" aria-disabled="true">
            نقل الصكوك
          </a>

          <a class="navbar__link" href="/encroachments.html" data-page="encroachments.html">
            التعديات
          </a>
        </nav>
        <!-- الشعار -->
        <a class="navbar__brand" href="/index.html" aria-label="سار - الرئيسية">
          <span class="navbar__brand-text">
            <span class="navbar__brand-name">الشركة السعودية للخطوط الحديدية</span>
          </span>
          <span class="navbar__logo" aria-hidden="true">
            <img src="assets/images/sar-logo.png" alt="شعار سار">
          </span>
        </a>
      </div>
    </header>
  `;

  const menuToggle = navbarContainer.querySelector(".navbar__toggle");
  const navigation = navbarContainer.querySelector(".navbar__nav");
  const navLinks = navbarContainer.querySelectorAll(".navbar__link");

  // ========================================
  // تحديد الرابط النشط بناءً على الصفحة الحالية
  // ========================================

  const currentPath = window.location.pathname;
  const currentPage = currentPath.split("/").pop().toLowerCase();
  const activePage = currentPage || "index.html";

  navLinks.forEach((link) => {
    // نتأكد أن الروابط المعطلة لا تأخذ حالة النشط الا إذا رغبت
    if (link.classList.contains("disabled-link")) return;

    const linkPage = link.dataset.page.toLowerCase();
    const isActive = linkPage === activePage;

    link.classList.toggle("is-active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  // ========================================
  // فتح القائمة أو إغلاقها
  // ========================================

  function setMenuOpen(isOpen) {
    navigation.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "إغلاق القائمة" : "فتح القائمة"
    );
  }

  // الاستجابة للضغط على زر القائمة
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    setMenuOpen(!isOpen);
  });

  // إغلاق القائمة عند الضغط على أحد الروابط (باستثناء المعطلة)
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      if (link.classList.contains("disabled-link")) {
        e.preventDefault(); // منع أي استجابة للرابط المعطل
        return;
      }
      setMenuOpen(false);
    });
  });

  // إغلاق القائمة عند الضغط على Escape
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuOpen(false);
    }
  });

  // إغلاق القائمة عند الضغط خارج النافبار
  document.addEventListener("click", (event) => {
    if (!navbarContainer.contains(event.target)) {
      setMenuOpen(false);
    }
  });

  // إغلاق القائمة عند الانتقال إلى شاشة كبيرة
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      setMenuOpen(false);
    }
  });
}