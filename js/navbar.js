
const navbarContainer = document.querySelector("#navbar-container");

if (navbarContainer) {
  navbarContainer.innerHTML = `
    <header class="navbar">
      <div class="navbar__container">

        <!-- الشعار -->
        <a class="navbar__brand" href="#home" aria-label="سار - الرئيسية">
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
          <a
            class="navbar__link is-active"
            href="#home"
            data-page="home"
            aria-current="page"
          >
            الرئيسية
          </a>

          <a
            class="navbar__link"
            href="#deeds"
            data-page="deeds"
          >
            نقل الصكوك
          </a>

          <a
            class="navbar__link"
            href="#encroachments"
            data-page="encroachments"
          >
            التعديات
          </a>

          <a
            class="navbar__link"
            href="#transactions"
            data-page="transactions"
          >
            المعاملات
          </a>
        </nav>

      </div>
    </header>
  `;

  const menuToggle = navbarContainer.querySelector(".navbar__toggle");
  const navigation = navbarContainer.querySelector(".navbar__nav");
  const navLinks = navbarContainer.querySelectorAll(".navbar__link");

  // فتح القائمة أو إغلاقها
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

  // تحديد الرابط النشط
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.forEach((item) => {
        item.classList.remove("is-active");
        item.removeAttribute("aria-current");
      });

      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");

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
