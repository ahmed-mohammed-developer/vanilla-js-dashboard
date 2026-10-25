const navbarContainer = document.querySelector("#navbar-container");

if (navbarContainer) {
  navbarContainer.innerHTML = `
    <header class="navbar">
      <div class="navbar__container">

        <!-- الشعار -->
        <a class="navbar__brand" href="/index.html" aria-label="سار - الرئيسية">
          <span class="navbar__logo" aria-hidden="true">
            <img src="assets/images/sar-logo.png" alt="شعار سار">
          </span>

          <span class="navbar__brand-text">
            <span class="navbar__brand-name">الشركة السعودية للخطوط الحديدية</span>
          </span>
        </a>

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
          <a class="navbar__link" href="index.html" data-page="index.html">
            الرئيسية
          </a>

          <a class="navbar__link" href="target2026.html" data-page="target2026.html">
            هدف 2026م
          </a>

          <a class="navbar__link" href="deeds.html" data-page="deeds.html">
            نقل الصكوك
          </a>

          <a class="navbar__link" href="encroachments.html" data-page="encroachments.html">
            التعديات
          </a>
        </nav>

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

  // استخراج اسم الصفحة من الرابط
  const currentPage = currentPath.split("/").pop().toLowerCase();

  // اعتبار الصفحة الرئيسية هي index.html إذا كان المسار فارغًا
  const activePage = currentPage || "index.html";

  navLinks.forEach((link) => {
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
    const isOpen =
      menuToggle.getAttribute("aria-expanded") === "true";

    setMenuOpen(!isOpen);
  });

  // إغلاق القائمة عند الضغط على أحد الروابط
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
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
