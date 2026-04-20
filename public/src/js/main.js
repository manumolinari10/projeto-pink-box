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

function animateProfileRings() {
    document.querySelectorAll("[data-profile-progress]").forEach((ring, index) => {
        const progressCircle = ring.querySelector(".clients-profile-ring-progress");
        const target = Number(ring.dataset.profileProgress || 0);

        if (!progressCircle) {
            return;
        }

        const radius = 40;
        const circumference = 2 * Math.PI * radius;
        const clampedTarget = Math.max(0, Math.min(100, target));
        const offset = circumference - ((clampedTarget / 100) * circumference);

        progressCircle.style.strokeDasharray = `${circumference}`;
        progressCircle.style.strokeDashoffset = `${circumference}`;

        setTimeout(() => {
            progressCircle.style.strokeDashoffset = `${offset}`;
        }, 140 + (index * 120));
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

function setupModals() {
    const modalTriggers = document.querySelectorAll("[data-modal-target]");

    if (!modalTriggers.length) {
        return;
    }

    function closeModal(modal) {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
    }

    modalTriggers.forEach((trigger) => {
        const targetId = trigger.dataset.modalTarget;
        const modal = document.getElementById(targetId);

        if (!modal) {
            return;
        }

        trigger.addEventListener("click", () => {
            modal.hidden = false;
            document.body.classList.add("modal-open");
        });

        modal.querySelectorAll("[data-modal-close]").forEach((closeButton) => {
            closeButton.addEventListener("click", () => closeModal(modal));
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") {
            return;
        }

        document.querySelectorAll(".client-modal:not([hidden])").forEach((modal) => {
            closeModal(modal);
        });
    });
}

function setupAccordions() {
    document.querySelectorAll("[data-accordion]").forEach((accordion) => {
        const toggle = accordion.querySelector("[data-accordion-toggle]");
        const content = accordion.querySelector("[data-accordion-content]");

        if (!toggle || !content) {
            return;
        }

        toggle.addEventListener("click", () => {
            const isOpen = accordion.classList.toggle("is-open");
            content.hidden = !isOpen;
            toggle.setAttribute("aria-expanded", String(isOpen));
        });
    });
}

function setupJourneyFilters() {
    document.querySelectorAll(".client-journey-card").forEach((journeyCard) => {
        const filters = journeyCard.querySelectorAll("[data-journey-filter]");
        const events = journeyCard.querySelectorAll("[data-journey-type]");

        if (!filters.length || !events.length) {
            return;
        }

        filters.forEach((filterButton) => {
            filterButton.addEventListener("click", () => {
                const selectedFilter = filterButton.dataset.journeyFilter;

                filters.forEach((button) => {
                    button.classList.toggle("is-active", button === filterButton);
                });

                events.forEach((eventCard) => {
                    const eventType = eventCard.dataset.journeyType;
                    const shouldShow = selectedFilter === "all" || eventType === selectedFilter;
                    eventCard.hidden = !shouldShow;
                });
            });
        });
    });
}

function setupRowLinks() {
    document.querySelectorAll("[data-row-href]").forEach((row) => {
        row.addEventListener("click", (event) => {
            const interactiveElement = event.target.closest("a, button, input, select, textarea");

            if (interactiveElement) {
                return;
            }

            window.location.href = row.dataset.rowHref;
        });
    });
}

function setupReceiptActions() {
    const receiptContent = document.querySelector("[data-receipt-content]");
    const whatsappButton = document.querySelector("[data-receipt-whatsapp]");
    const printButton = document.querySelector("[data-receipt-print]");

    if (!receiptContent) {
        return;
    }

    const receiptText = receiptContent.innerText.trim();

    if (whatsappButton) {
        whatsappButton.addEventListener("click", () => {
            const url = `https://wa.me/?text=${encodeURIComponent(receiptText)}`;
            window.open(url, "_blank", "noopener,noreferrer");
        });
    }

    if (printButton) {
        printButton.addEventListener("click", () => {
            const printWindow = window.open("", "_blank", "width=900,height=700");

            if (!printWindow) {
                return;
            }

            printWindow.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Comprovante do Pedido</title>
<style>
body {
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    margin: 0;
    padding: 32px;
    color: #1f1720;
    background: #ffffff;
}
.receipt-print {
    max-width: 720px;
    margin: 0 auto;
    line-height: 1.7;
    font-size: 16px;
}
.receipt-print p {
    margin: 0 0 14px;
}
.receipt-print strong {
    font-weight: 700;
}
.receipt-print em {
    font-style: italic;
}
</style>
</head>
<body>
    <div class="receipt-print">${receiptContent.innerHTML}</div>
</body>
</html>`);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        });
    }
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
    setupModals();
    setupAccordions();
    setupJourneyFilters();
    setupRowLinks();
    setupReceiptActions();
    animateProgressBar();
    animatePerformanceBars();
    animateStockBars();
    animateProfileRings();

    document.querySelectorAll("[data-target]").forEach((element) => {
        animateValue(element);
    });
});
