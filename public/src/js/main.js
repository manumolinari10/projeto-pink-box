function formatCurrencyPtBr(value) {
    return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function animateValue(element) {
    const target = Number(element.dataset.target);

    if (!target) {
        return;
    }

    const prefix = element.dataset.prefix || "";
    const suffix = element.dataset.suffix || "";
    const isCurrency = element.classList.contains("sales-value");
    const duration = 1200;
    const startTime = performance.now();

    function update(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = target * eased;

        if (isCurrency) {
            element.textContent = formatCurrencyPtBr(current);
        } else {
            element.textContent = `${prefix}${Math.round(current)}${suffix}`;
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        } else if (isCurrency) {
            element.textContent = formatCurrencyPtBr(target);
        } else {
            element.textContent = `${prefix}${Math.round(target)}${suffix}`;
        }
    }

    requestAnimationFrame(update);
}

function updateCurrentMonth() {
    const label = document.querySelector("[data-current-month]");

    if (!label) {
        return;
    }

    const formattedMonth = new Intl.DateTimeFormat("pt-BR", {
        month: "long"
    }).format(new Date());

    label.textContent = formattedMonth;
}

function updateCurrentYear() {
    const year = document.querySelector("[data-current-year]");

    if (!year) {
        return;
    }

    year.textContent = String(new Date().getFullYear());
}
function updateTodayPill() {
    const pill = document.querySelector("[data-today-pill]");

    if (!pill) {
        return;
    }

    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = new Intl.DateTimeFormat("pt-BR", {
        month: "long"
    }).format(now).toUpperCase();
    const year = String(now.getFullYear());

    pill.textContent = `${day} ${month} ${year}`;
}

function setupPeriodMenu() {
    const filter = document.querySelector(".period-filter");
    const toggle = document.querySelector(".month-badge-button");
    const arrowButton = document.querySelector("[data-period-toggle]");
    const menu = document.querySelector("[data-period-menu]");
    const label = document.querySelector("[data-current-month]");

    if (!filter || !toggle || !menu || !label) {
        return;
    }

    menu.hidden = true;
    filter.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");

    function closeMenu() {
        filter.classList.remove("is-open");
        menu.hidden = true;
        if (arrowButton) {
            arrowButton.setAttribute("aria-expanded", "false");
        }
    }

    toggle.addEventListener("click", (event) => {
        event.stopPropagation();
        const isOpen = !filter.classList.contains("is-open");
        filter.classList.toggle("is-open", isOpen);
        menu.hidden = !isOpen;
        if (arrowButton) {
            arrowButton.setAttribute("aria-expanded", String(isOpen));
        }
    });

    menu.querySelectorAll("[data-period-option]").forEach((option) => {
        option.addEventListener("click", () => {
            label.textContent = option.dataset.periodOption;
            closeMenu();
        });
    });

    document.addEventListener("click", (event) => {
        if (!filter.contains(event.target)) {
            closeMenu();
        }
    });
}

function setupNotificationMenu() {
    const wrapper = document.querySelector(".notification-wrapper");
    const toggle = document.querySelector("[data-notification-toggle]");
    const menu = document.querySelector("[data-notification-menu]");

    if (!wrapper || !toggle || !menu) {
        return;
    }

    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");

    function closeMenu() {
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", (event) => {
        event.stopPropagation();
        const isOpen = menu.hidden;
        menu.hidden = !isOpen;
        toggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (event) => {
        if (!wrapper.contains(event.target)) {
            closeMenu();
        }
    });
}

function animateProgressBar() {
    const fill = document.querySelector("[data-progress-target]");
    const icon = document.querySelector(".progress-icon");

    if (!fill) {
        return;
    }

    const target = fill.dataset.progressTarget || "0";
    fill.style.width = "0%";

    if (icon) {
        icon.classList.remove("is-pulsing");
        void icon.offsetWidth;
        icon.classList.add("is-pulsing");
    }

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            fill.style.width = `${target}%`;
        });
    });
}
function animatePerformanceBars() {
    document.querySelectorAll("[data-bar-height]").forEach((bar, index) => {
        const target = Number(bar.dataset.barHeight || 0);
        bar.style.height = "0px";

        setTimeout(() => {
            bar.style.height = `${target}px`;
        }, 120 + (index * 110));
    });
}

function animateStockBars() {
    document.querySelectorAll("[data-stock-width]").forEach((bar, index) => {
        const target = Number(bar.dataset.stockWidth || 100);
        bar.style.width = "100%";

        setTimeout(() => {
            bar.style.width = `${target}%`;
        }, 180 + (index * 90));
    });
}
function setupSidebarToggle() {
    const toggle = document.querySelector(".menu-toggle");

    if (!toggle) {
        return;
    }

    toggle.addEventListener("click", () => {
        const collapsed = document.body.classList.toggle("sidebar-collapsed");
        toggle.setAttribute("aria-expanded", String(!collapsed));
    });
}

window.addEventListener("load", () => {
    window.scrollTo(0, 0);
    document.body.classList.add("is-ready");
    updateCurrentMonth();
    updateCurrentYear();
    updateTodayPill();
    setupSidebarToggle();
    setupPeriodMenu();
    setupNotificationMenu();
    animateProgressBar();
    animatePerformanceBars();
    animateStockBars();

    document.querySelectorAll("[data-target]").forEach((element) => {
        animateValue(element);
    });
});






