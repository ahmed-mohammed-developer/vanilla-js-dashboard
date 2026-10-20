
const pageMetadata = {
  "index.html": {
    title: "الرئيسية",
    description:
      "الصفحة الرئيسية للوحة تحكم سار، لمتابعة الأعمال والمؤشرات.",
    image: "assets/images/sar-logo.png"
  },

  "deeds.html": {
    title: "نقل الصكوك",
    description:
      "متابعة بيانات الصكوك وعمليات نقلها ومؤشرات الإنجاز.",
    image: "assets/images/sar-logo.png"
  },

  "encroachments.html": {
    title: "التعديات",
    description:
      "متابعة التعديات وحالات المعالجة والإجراءات المرتبطة بها.",
    image: "assets/images/sar-logo.png"
  },

  "transactions.html": {
    title: "المعاملات",
    description:
      "متابعة المعاملات وحالاتها ومستجدات إنجازها.",
    image: "assets/images/sar-logo.png"
  }
};

function updateMetaContent(selector, content) {
  const element = document.querySelector(selector);

  if (element) {
    element.setAttribute("content", content);
  }
}

function updatePageMetadata() {
  const currentPage =
    window.location.pathname.split("/").pop() || "index.html";

  const page = pageMetadata[currentPage] || pageMetadata["index.html"];

  const pageTitle = `${page.title} | سار`;

  // عنوان تبويب المتصفح
  document.title = pageTitle;

  // وصف الصفحة
  updateMetaContent('meta[name="description"]', page.description);

  // بيانات Open Graph
  updateMetaContent("#og-title", pageTitle);
  updateMetaContent("#og-description", page.description);
  updateMetaContent("#og-url", window.location.href);

  // بيانات Twitter / X
  updateMetaContent("#twitter-title", pageTitle);
  updateMetaContent("#twitter-description", page.description);

  // روابط الصور
  const imageUrl = new URL(page.image, window.location.href).href;

  updateMetaContent("#og-image", imageUrl);
  updateMetaContent("#twitter-image", imageUrl);
}

updatePageMetadata();
