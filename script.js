const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const isEnglish = document.documentElement.lang.toLowerCase().startsWith("en");
const navLabels = isEnglish
  ? { open: "Open navigation", close: "Close navigation" }
  : { open: "打开导航", close: "关闭导航" };

function syncHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 8);
}

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  header.classList.toggle("is-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? navLabels.close : navLabels.open);
});

nav.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    nav.classList.remove("is-open");
    header.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", navLabels.open);
  }
});

const motionSafe = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll(
  ".product-card, .application-grid article, .spec-table-wrap, .client-card, .download-card, .timeline article, .contact-copy, .contact-form"
);

if (motionSafe && "IntersectionObserver" in window) {
  revealItems.forEach((item, index) => {
    item.classList.add("reveal");
    item.style.setProperty("--reveal-delay", `${Math.min(index % 8, 5) * 55}ms`);
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

document.querySelectorAll(".contact-form").forEach((form) => {
  const requiredFields = form.querySelectorAll("[data-required-submit]");
  const phoneField = form.querySelector('input[name="phone"]');
  const emailField = form.querySelector("[data-email-field]");
  const messageField = form.querySelector('textarea[name="message"]');
  const submitButton = form.querySelector('button[type="submit"]');
  const status = form.querySelector("[data-form-status]");
  const text = isEnglish
    ? {
        invalidPhone: "Please enter a valid phone number.",
        invalidEmail: "Please enter a valid email address.",
        messageTooLong: "Requirement details must be 200 characters or fewer.",
        sending: "Submitting inquiry...",
        success: "Inquiry recorded. We will contact you soon.",
        failed: "Submission failed. Please try again later.",
        localPreview: "The form cannot submit from a local file preview. Please open the site through a PHP-enabled web server.",
        networkFailed: "Submission API is unavailable. Please confirm api/inquiry.php is running in a PHP-enabled hosting environment.",
        correctedEmail: "Email domain spelling was corrected automatically.",
        clear: "Clear"
      }
    : {
        invalidPhone: "请输入有效手机号。",
        invalidEmail: "请输入有效邮箱地址。",
        messageTooLong: "需求说明不能超过 200 字。",
        sending: "正在提交询盘...",
        success: "询盘已记录，我们会尽快联系您。",
        failed: "提交失败，请稍后重试。",
        localPreview: "本地文件预览无法提交表单，请通过支持 PHP 的网站环境打开页面。",
        networkFailed: "提交接口不可用，请确认 api/inquiry.php 已部署在支持 PHP 的服务器环境。",
        correctedEmail: "邮箱域名拼写已自动修正。",
        clear: "清除"
      };

  const emailDomainFixes = {
    "qq.con": "qq.com",
    "qq.cm": "qq.com",
    "163.con": "163.com",
    "163.co": "163.com",
    "126.con": "126.com",
    "126.co": "126.com",
    "gmail.con": "gmail.com",
    "gmail.cm": "gmail.com",
    "hotmail.con": "hotmail.com",
    "outlook.con": "outlook.com",
    "foxmail.con": "foxmail.com"
  };
  const commonEmailDomains = ["qq.com", "163.com", "126.com", "gmail.com", "outlook.com", "hotmail.com", "foxmail.com"];

  if (emailField) {
    const emailList = document.createElement("datalist");
    emailList.id = `email-suggestions-${Math.random().toString(36).slice(2)}`;
    document.body.appendChild(emailList);
    emailField.setAttribute("list", emailList.id);

    emailField.addEventListener("input", () => {
      const value = emailField.value.trim();
      const atIndex = value.indexOf("@");

      if (atIndex <= 0) {
        emailList.replaceChildren();
        return;
      }

      const local = value.slice(0, atIndex);
      const typedDomain = value.slice(atIndex + 1).toLowerCase();
      emailList.replaceChildren();
      commonEmailDomains
        .filter((domain) => domain.startsWith(typedDomain))
        .forEach((domain) => {
          const option = document.createElement("option");
          option.value = `${local}@${domain}`;
          emailList.appendChild(option);
        });
    });
  }

  function setStatus(message, type = "") {
    if (!status) return;
    status.textContent = message;
    status.dataset.status = type;
  }

  function normalizeEmail() {
    if (!emailField || !emailField.value.trim()) return;
    const value = emailField.value.trim();
    const atIndex = value.lastIndexOf("@");

    if (atIndex <= 0) return;

    const local = value.slice(0, atIndex);
    const domain = value.slice(atIndex + 1).toLowerCase();
    const fixedDomain = emailDomainFixes[domain];

    if (fixedDomain) {
      emailField.value = `${local}@${fixedDomain}`;
      setStatus(text.correctedEmail, "info");
    }
  }

  function syncSubmitState() {
    const canSubmit = Array.from(requiredFields).every((field) => field.value.trim());
    submitButton.disabled = !canSubmit;
  }

  const clearableFields = form.querySelectorAll('input:not([type="hidden"]), textarea');
  const formClearButton = document.createElement("button");
  formClearButton.className = "form-clear";
  formClearButton.type = "button";
  formClearButton.textContent = text.clear;
  formClearButton.setAttribute("aria-label", text.clear);
  form.insertBefore(formClearButton, form.firstElementChild);

  function syncFormClearButton() {
    formClearButton.disabled = !Array.from(clearableFields).some((field) => field.value);
  }

  clearableFields.forEach((field) => {
    field.addEventListener("input", syncFormClearButton);
  });

  formClearButton.addEventListener("click", () => {
    if (formClearButton.disabled) return;
    clearableFields.forEach((field) => {
      field.value = "";
      field.dispatchEvent(new Event("input", { bubbles: true }));
    });
    clearableFields[0]?.focus();
  });

  requiredFields.forEach((field) => field.addEventListener("input", syncSubmitState));
  emailField?.addEventListener("blur", normalizeEmail);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    normalizeEmail();

    if (!phoneField.checkValidity()) {
      setStatus(text.invalidPhone, "error");
      phoneField.focus();
      return;
    }

    if (emailField?.value.trim() && !emailField.checkValidity()) {
      setStatus(text.invalidEmail, "error");
      emailField.focus();
      return;
    }

    if (messageField.value.length > 200) {
      setStatus(text.messageTooLong, "error");
      messageField.focus();
      return;
    }

    submitButton.disabled = true;
    setStatus(text.sending, "info");

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw new Error(result.message || text.failed);
      }

      form.reset();
      syncFormClearButton();
      setStatus(text.success, "success");
    } catch (error) {
      if (window.location.protocol === "file:") {
        setStatus(text.localPreview, "error");
      } else if (error instanceof TypeError && /fetch/i.test(error.message)) {
        setStatus(text.networkFailed, "error");
      } else {
        setStatus(error.message || text.failed, "error");
      }
    } finally {
      syncSubmitState();
    }
  });

  syncSubmitState();
  syncFormClearButton();
});
