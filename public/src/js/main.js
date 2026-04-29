function formatCurrencyPtBr(value) {
    return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function parseCurrencyPtBr(value) {
    if (typeof value !== "string") {
        return Number(value) || 0;
    }

    const normalized = value
        .replace(/\s/g, "")
        .replace(/R\$/gi, "")
        .replace(/\./g, "")
        .replace(",", ".")
        .replace(/[^\d.-]/g, "");

    return Number(normalized) || 0;
}

function formatMoneyInputPtBr(rawValue) {
    const digits = String(rawValue ?? "").replace(/\D/g, "");
    const cents = Number(digits || "0") / 100;
    return formatCurrencyPtBr(cents);
}

function animateValue(element) {
    const target = Number(element.dataset.target);

    if (!target) {
        return;
    }

    const prefix = element.dataset.prefix || "";
    const suffix = element.dataset.suffix || "";
    const isCurrency = element.classList.contains("sales-value");
    const decimals = Number(element.dataset.decimals || 0);
    const duration = 1200;
    const startTime = performance.now();

    function update(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = target * eased;

        if (isCurrency) {
            element.textContent = formatCurrencyPtBr(current);
        } else if (decimals > 0) {
            element.textContent = new Intl.NumberFormat("pt-BR", {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(current);
        } else {
            element.textContent = `${prefix}${Math.round(current)}${suffix}`;
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        } else if (isCurrency) {
            element.textContent = formatCurrencyPtBr(target);
        } else if (decimals > 0) {
            element.textContent = new Intl.NumberFormat("pt-BR", {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(target);
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

    if (label.dataset.monthLabelFixed) {
        label.textContent = label.dataset.monthLabelFixed;
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

function setupProfileMenu() {
    const profileCards = document.querySelectorAll(".profile-card");

    if (!profileCards.length) {
        return;
    }

    profileCards.forEach((card) => {
        if (!card || card.closest(".profile-menu-wrapper")) {
            return;
        }

        const wrapper = document.createElement("div");
        wrapper.className = "profile-menu-wrapper";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "profile-card profile-card-button";
        button.setAttribute("aria-label", "Abrir menu do perfil");
        button.setAttribute("aria-haspopup", "true");
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("data-profile-menu-toggle", "");
        button.innerHTML = card.innerHTML;

        const menu = document.createElement("div");
        menu.className = "profile-menu";
        menu.hidden = true;
        menu.setAttribute("data-profile-menu", "");
        menu.innerHTML = `
            <a href="./perfil.html">Meu Perfil</a>
            <a href="./login.html">Sair</a>
        `;

        card.replaceWith(wrapper);
        wrapper.append(button, menu);

        function closeMenu() {
            menu.hidden = true;
            button.setAttribute("aria-expanded", "false");
        }

        button.addEventListener("click", (event) => {
            event.stopPropagation();
            const shouldOpen = menu.hidden;

            document.querySelectorAll(".profile-menu-wrapper").forEach((otherWrapper) => {
                const otherMenu = otherWrapper.querySelector("[data-profile-menu]");
                const otherButton = otherWrapper.querySelector("[data-profile-menu-toggle]");

                if (otherMenu && otherButton) {
                    otherMenu.hidden = true;
                    otherButton.setAttribute("aria-expanded", "false");
                }
            });

            menu.hidden = !shouldOpen;
            button.setAttribute("aria-expanded", String(shouldOpen));
        });

        document.addEventListener("click", (event) => {
            if (!wrapper.contains(event.target)) {
                closeMenu();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeMenu();
            }
        });
    });
}

function setupProfileSectionEditors() {
    const sections = document.querySelectorAll("[data-profile-section-editor]");

    if (!sections.length) {
        return;
    }

    function formatProfilePhone(value) {
        const digits = value.replace(/\D/g, "").slice(0, 11);

        if (digits.length <= 2) {
            return digits ? `(${digits}` : "";
        }

        if (digits.length <= 10) {
            if (digits.length <= 6) {
                return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
            }

            return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
        }

        if (digits.length <= 7) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        }

        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }

    sections.forEach((section) => {
        const toggleButton = section.querySelector("[data-profile-section-toggle]");
        const actionsWrap = section.querySelector("[data-profile-section-actions]");
        const cancelButton = section.querySelector("[data-profile-section-cancel]");
        const saveButton = section.querySelector("[data-profile-section-save]");
        const editableRows = Array.from(section.querySelectorAll("[data-profile-editable-row]"));

        if (!toggleButton || !actionsWrap || !cancelButton || !saveButton || !editableRows.length) {
            return;
        }

        const initialValues = new Map();

        editableRows.forEach((row) => {
            const input = row.querySelector("[data-profile-field-input]");
            const view = row.querySelector("[data-profile-field-view]");

            if (!input || !view) {
                return;
            }

            initialValues.set(row.dataset.profileEditableRow, view.textContent.trim());
        });

        function setEditingState(isEditing) {
            section.dataset.profileEditing = isEditing ? "true" : "false";
            toggleButton.hidden = isEditing;
            actionsWrap.hidden = !isEditing;

            editableRows.forEach((row) => {
                const editor = row.querySelector("[data-profile-field-editor]");
                const view = row.querySelector("[data-profile-field-view]");
                if (editor) {
                    editor.hidden = !isEditing;
                }
                if (view) {
                    view.hidden = isEditing;
                }
            });
        }

        function resetInputs() {
            editableRows.forEach((row) => {
                const input = row.querySelector("[data-profile-field-input]");
                const originalValue = initialValues.get(row.dataset.profileEditableRow) || "";

                if (!input) {
                    return;
                }

                if (input.tagName === "SELECT") {
                    Array.from(input.options).forEach((option) => {
                        option.selected = option.text === originalValue;
                    });
                } else {
                    input.value = originalValue;
                }
            });
        }

        toggleButton.addEventListener("click", () => {
            resetInputs();
            setEditingState(true);
        });

        editableRows.forEach((row) => {
            const input = row.querySelector("[data-profile-field-input]");
            const view = row.querySelector("[data-profile-field-view]");
            const inputType = input?.dataset.profileInputType;

            if (!input || !view) {
                return;
            }

            if (inputType === "phone") {
                input.addEventListener("input", (event) => {
                    event.target.value = formatProfilePhone(event.target.value);
                });
            }

            if (inputType === "email") {
                input.addEventListener("blur", () => {
                    input.value = input.value.trim().toLowerCase();
                });
            }
        });

        cancelButton.addEventListener("click", () => {
            resetInputs();
            setEditingState(false);
        });

        saveButton.addEventListener("click", () => {
            for (const row of editableRows) {
                const input = row.querySelector("[data-profile-field-input]");
                const inputType = input?.dataset.profileInputType;

                if (!input) {
                    continue;
                }

                if (inputType === "email" && input.value && !input.checkValidity()) {
                    input.reportValidity();
                    return;
                }
            }

            editableRows.forEach((row) => {
                const input = row.querySelector("[data-profile-field-input]");
                const view = row.querySelector("[data-profile-field-view]");

                if (!input || !view) {
                    return;
                }

                const nextValue = input.tagName === "SELECT"
                    ? input.options[input.selectedIndex]?.text || ""
                    : input.value.trim();

                view.textContent = nextValue;
                initialValues.set(row.dataset.profileEditableRow, nextValue);
            });

            setEditingState(false);
        });
    });
}

function setupProfileDescriptionEditor() {
    const editor = document.querySelector("[data-profile-description-editor]");

    if (!editor) {
        return;
    }

    const view = editor.querySelector("[data-profile-description-view]");
    const toggle = editor.querySelector("[data-profile-description-toggle]");
    const actions = editor.querySelector("[data-profile-description-actions]");
    const input = editor.querySelector("[data-profile-description-input]");
    const cancel = editor.querySelector("[data-profile-description-cancel]");
    const save = editor.querySelector("[data-profile-description-save]");

    if (!view || !toggle || !actions || !input || !cancel || !save) {
        return;
    }

    let initialValue = view.textContent.replace("[EDITAR]", "").trim();

    function setEditingState(isEditing) {
        view.hidden = isEditing;
        actions.hidden = !isEditing;
    }

    toggle.addEventListener("click", () => {
        input.value = initialValue;
        setEditingState(true);
    });

    cancel.addEventListener("click", () => {
        input.value = initialValue;
        setEditingState(false);
    });

    save.addEventListener("click", () => {
        initialValue = input.value.trim();
        view.innerHTML = `${initialValue} <button class="profile-inline-edit" type="button" data-profile-description-toggle>[EDITAR]</button>`;
        const renewedToggle = view.querySelector("[data-profile-description-toggle]");
        renewedToggle?.addEventListener("click", () => {
            input.value = initialValue;
            setEditingState(true);
        });
        setEditingState(false);
    });
}

function setupProfileImageUpload() {
    const trigger = document.querySelector("[data-profile-image-trigger]");
    const input = document.querySelector("[data-profile-image-input]");
    const preview = document.querySelector("[data-profile-image-preview]");
    const modal = document.getElementById("profile-image-modal");
    const editor = document.querySelector("[data-profile-image-editor]");
    const editorPreview = document.querySelector("[data-profile-image-editor-preview]");
    const applyButton = document.querySelector("[data-profile-image-apply]");
    const resetButton = document.querySelector("[data-profile-image-reset]");

    if (!trigger || !input || !preview || !modal || !editor || !editorPreview || !applyButton || !resetButton) {
        return;
    }

    let pendingImageSrc = "";
    let pendingPosition = { x: 50, y: 50 };
    let savedPosition = { x: 50, y: 50 };
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let dragOrigin = { x: 50, y: 50 };

    function setImagePosition(x, y) {
        const clampedX = Math.max(0, Math.min(100, x));
        const clampedY = Math.max(0, Math.min(100, y));
        pendingPosition = { x: clampedX, y: clampedY };
        editorPreview.style.setProperty("--new-client-image-x", `${clampedX}%`);
        editorPreview.style.setProperty("--new-client-image-y", `${clampedY}%`);
    }

    function applySavedImage() {
        preview.src = pendingImageSrc || preview.src;
        preview.style.setProperty("--profile-image-x", `${savedPosition.x}%`);
        preview.style.setProperty("--profile-image-y", `${savedPosition.y}%`);
    }

    function closeModal() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        input.value = "";
    }

    trigger.addEventListener("click", () => {
        input.click();
    });

    input.addEventListener("change", () => {
        const file = input.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            input.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = String(event.target?.result || "");

            if (!result) {
                return;
            }

            pendingImageSrc = result;
            editorPreview.src = result;
            pendingPosition = { ...savedPosition };
            setImagePosition(pendingPosition.x, pendingPosition.y);
            modal.hidden = false;
            document.body.classList.add("modal-open");
        };
        reader.readAsDataURL(file);
    });

    editor.addEventListener("pointerdown", (event) => {
        if (modal.hidden) {
            return;
        }

        isDragging = true;
        dragStart = { x: event.clientX, y: event.clientY };
        dragOrigin = { ...pendingPosition };
        editor.setPointerCapture(event.pointerId);
    });

    editor.addEventListener("pointermove", (event) => {
        if (!isDragging) {
            return;
        }

        const rect = editor.getBoundingClientRect();
        const deltaX = ((event.clientX - dragStart.x) / rect.width) * 100;
        const deltaY = ((event.clientY - dragStart.y) / rect.height) * 100;
        setImagePosition(dragOrigin.x - deltaX, dragOrigin.y - deltaY);
    });

    function stopDragging(event) {
        if (!isDragging) {
            return;
        }

        isDragging = false;

        if (typeof event.pointerId !== "undefined") {
            try {
                editor.releasePointerCapture(event.pointerId);
            } catch (error) {
                // ignore
            }
        }
    }

    editor.addEventListener("pointerup", stopDragging);
    editor.addEventListener("pointercancel", stopDragging);
    editor.addEventListener("pointerleave", stopDragging);

    resetButton.addEventListener("click", () => {
        setImagePosition(50, 50);
    });

    applyButton.addEventListener("click", () => {
        savedPosition = { ...pendingPosition };
        applySavedImage();
        const result = pendingImageSrc || preview.src;
        document.querySelectorAll(".profile-card .avatar-image, .profile-avatar.avatar-image").forEach((image) => {
            image.src = result;
        });
        closeModal();
    });

    document.querySelectorAll("[data-profile-image-close]").forEach((button) => {
        button.addEventListener("click", closeModal);
    });
}

function setupSidebarFooterLinks() {
    const helpMarkup = `
        <span class="nav-icon">
            <svg viewBox="0 0 256 256"><path d="M140,180a12,12,0,1,1-12-12A12,12,0,0,1,140,180Zm84-52A96,96,0,1,1,128,32A96.11,96.11,0,0,1,224,128Zm-56-36c0-24.26-19.06-44-42.49-44C102.6,48,84,65.94,84,88a8,8,0,0,0,16,0c0-13.23,11.65-24,26-24s26.49,12.56,26.49,28c0,17.31-17.79,26.71-18.54,27.1A8,8,0,0,0,128,126v18a8,8,0,0,0,16,0V130.42C152.49,125.3,168,112.95,168,92Z"></path></svg>
        </span>
        <span>Ajuda</span>
    `;

    document.querySelectorAll(".footer-links").forEach((footerLinks) => {
        const configLink = Array.from(footerLinks.querySelectorAll("a")).find((link) => link.getAttribute("href") === "./configuracoes.html");
        const logoutLink = Array.from(footerLinks.querySelectorAll("a")).find((link) => link.getAttribute("href") === "./login.html");
        let helpLink = Array.from(footerLinks.querySelectorAll("a")).find((link) => link.getAttribute("href") === "./ajuda.html");

        if (logoutLink) {
            logoutLink.remove();
        }

        if (!helpLink) {
            helpLink = document.createElement("a");
            helpLink.className = "nav-link nav-link--subtle";
            helpLink.href = "./ajuda.html";
            helpLink.innerHTML = helpMarkup;
        }

        if (configLink) {
            footerLinks.insertBefore(helpLink, configLink);
        } else if (!footerLinks.contains(helpLink)) {
            footerLinks.append(helpLink);
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

function setupSidebarSubmenus() {
    document.querySelectorAll("[data-sidebar-group]").forEach((group) => {
        const toggle = group.querySelector("[data-sidebar-submenu-toggle]");
        const submenu = group.querySelector("[data-sidebar-submenu]");

        if (!toggle || !submenu) {
            return;
        }

        const shouldStartOpen = group.classList.contains("is-open");
        submenu.hidden = !shouldStartOpen;
        toggle.setAttribute("aria-expanded", String(shouldStartOpen));

        toggle.addEventListener("click", () => {
            const isOpen = !submenu.hidden;
            submenu.hidden = isOpen;
            group.classList.toggle("is-open", !isOpen);
            toggle.setAttribute("aria-expanded", String(!isOpen));
        });
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
        const events = Array.from(journeyCard.querySelectorAll("[data-journey-type]"));
        const loadMoreButton = journeyCard.querySelector("[data-journey-load-more]");
        let selectedFilter = "all";
        let visibleCount = 10;

        if (!filters.length || !events.length) {
            return;
        }

        function renderJourney() {
            const filteredEvents = events.filter((eventCard) => {
                const eventType = eventCard.dataset.journeyType;
                return selectedFilter === "all" || eventType === selectedFilter;
            });

            events.forEach((eventCard) => {
                eventCard.hidden = true;
            });

            filteredEvents.forEach((eventCard, index) => {
                eventCard.hidden = index >= visibleCount;
            });

            if (loadMoreButton) {
                loadMoreButton.hidden = filteredEvents.length <= visibleCount;
            }
        }

        filters.forEach((filterButton) => {
            filterButton.addEventListener("click", () => {
                selectedFilter = filterButton.dataset.journeyFilter;
                visibleCount = 10;

                filters.forEach((button) => {
                    button.classList.toggle("is-active", button === filterButton);
                });

                renderJourney();
            });
        });

        loadMoreButton?.addEventListener("click", () => {
            visibleCount += 10;
            renderJourney();
        });

        renderJourney();
    });
}

function setupClientDetailModals() {
    const messageModal = document.getElementById("client-message-modal");
    const composeModal = document.getElementById("client-compose-modal");

    function closeModal(modal) {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
    }

    if (messageModal) {
        const messageDate = messageModal.querySelector("[data-client-message-date]");
        const messageBody = messageModal.querySelector("[data-client-message-body]");

        document.querySelectorAll("[data-client-message-trigger]").forEach((trigger) => {
            trigger.addEventListener("click", () => {
                if (messageDate) {
                    messageDate.textContent = trigger.dataset.messageDate || "";
                }

                if (messageBody) {
                    messageBody.textContent = trigger.dataset.messageBody || "";
                }

                messageModal.hidden = false;
                document.body.classList.add("modal-open");
            });
        });

        messageModal.querySelectorAll("[data-modal-close]").forEach((closeButton) => {
            closeButton.addEventListener("click", () => {
                closeModal(messageModal);
            });
        });
    }

    if (composeModal) {
        const composeText = composeModal.querySelector("[data-client-compose-text]");

        document.querySelectorAll("[data-client-compose-trigger]").forEach((trigger) => {
            trigger.addEventListener("click", () => {
                if (composeText) {
                    composeText.value = "";
                }

                composeModal.hidden = false;
                document.body.classList.add("modal-open");
            });
        });

        composeModal.querySelectorAll("[data-client-compose-close]").forEach((closeButton) => {
            closeButton.addEventListener("click", () => {
                closeModal(composeModal);
            });
        });
    }
}

function setupClientPurchaseHistory() {
    const historyCard = document.querySelector(".client-purchase-history");

    if (!historyCard) {
        return;
    }

    const loadMoreButton = historyCard.querySelector("[data-client-history-load-more]");
    const hiddenRows = Array.from(historyCard.querySelectorAll("[data-client-history-row]"));
    const sortWrap = historyCard.querySelector("[data-client-history-sort]");
    const sortToggle = historyCard.querySelector("[data-client-history-sort-toggle]");
    const sortMenu = historyCard.querySelector("[data-client-history-sort-menu]");

    loadMoreButton?.addEventListener("click", () => {
        const nextRows = hiddenRows.filter((row) => row.hidden).slice(0, 10);
        nextRows.forEach((row) => {
            row.hidden = false;
        });

        if (!hiddenRows.some((row) => row.hidden)) {
            loadMoreButton.hidden = true;
        }
    });

    if (!sortWrap || !sortToggle || !sortMenu) {
        return;
    }

    sortMenu.hidden = true;
    sortToggle.setAttribute("aria-expanded", "false");

    function closeSortMenu() {
        sortMenu.hidden = true;
        sortToggle.setAttribute("aria-expanded", "false");
    }

    sortToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        const shouldOpen = sortMenu.hidden;
        sortMenu.hidden = !shouldOpen;
        sortToggle.setAttribute("aria-expanded", String(shouldOpen));
    });

    sortMenu.querySelectorAll(".client-history-sort-option").forEach((option) => {
        option.addEventListener("click", () => {
            closeSortMenu();
        });
    });

    document.addEventListener("click", (event) => {
        if (!sortWrap.contains(event.target)) {
            closeSortMenu();
        }
    });
}

function setupNotesPage() {
    const modal = document.getElementById("note-delete-modal");
    const noteFilterButtons = Array.from(document.querySelectorAll("[data-note-filter]"));
    const noteItems = Array.from(document.querySelectorAll("[data-note-item]"));

    if (!modal && !noteFilterButtons.length) {
        return;
    }

    if (noteFilterButtons.length && noteItems.length) {
        const activeFilters = new Set(["behavior", "product", "preference"]);

        function syncNoteFilterButtons() {
            const allActive = activeFilters.size === 3;

            noteFilterButtons.forEach((button) => {
                const filter = button.dataset.noteFilter;
                const isActive = filter === "all" ? allActive : activeFilters.has(filter);
                button.classList.toggle("is-active", isActive);
                button.classList.toggle("is-muted", !isActive);
            });
        }

        function renderNoteItems() {
            noteItems.forEach((item) => {
                item.hidden = !activeFilters.has(item.dataset.noteType);
            });

            syncNoteFilterButtons();
        }

        noteFilterButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const filter = button.dataset.noteFilter;

                if (filter === "all") {
                    activeFilters.clear();
                    ["behavior", "product", "preference"].forEach((type) => activeFilters.add(type));
                    renderNoteItems();
                    return;
                }

                if (activeFilters.has(filter)) {
                    activeFilters.delete(filter);
                } else {
                    activeFilters.add(filter);
                }

                renderNoteItems();
            });
        });

        renderNoteItems();
    }

    if (!modal) {
        return;
    }

    const tag = modal.querySelector("[data-note-delete-tag]");
    const date = modal.querySelector("[data-note-delete-date]");
    const text = modal.querySelector("[data-note-delete-text]");

    function closeModal() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
    }

    document.querySelectorAll("[data-note-delete]").forEach((button) => {
        button.addEventListener("click", () => {
            const noteTag = button.getAttribute("data-note-tag") || "";
            const noteDate = button.getAttribute("data-note-date") || "";
            const noteText = button.getAttribute("data-note-text") || "";

            if (tag) {
                tag.textContent = noteTag;
                tag.className = "client-insight-badge";

                if (noteTag.toLowerCase() === "comportamento") {
                    tag.classList.add("client-insight-badge--blue");
                } else if (noteTag.toLowerCase() === "produto") {
                    tag.classList.add("client-insight-badge--purple");
                } else {
                    tag.classList.add("client-insight-badge--red");
                }
            }

            if (date) {
                date.textContent = noteDate;
            }

            if (text) {
                text.textContent = noteText;
            }

            modal.hidden = false;
            document.body.classList.add("modal-open");
        });
    });

    modal.querySelectorAll("[data-note-delete-close]").forEach((button) => {
        button.addEventListener("click", closeModal);
    });
}

function setupClientProfileEditor() {
    const editor = document.querySelector("[data-client-profile-editor]");

    if (!editor) {
        return;
    }

    const editButton = editor.querySelector("[data-client-profile-edit]");
    const actionWrap = editor.querySelector("[data-client-profile-edit-actions]");
    const cancelButton = editor.querySelector("[data-client-profile-cancel]");
    const saveButton = editor.querySelector("[data-client-profile-save]");
    const viewFields = Array.from(editor.querySelectorAll("[data-client-profile-view]"));
    const inputFields = Array.from(editor.querySelectorAll("[data-client-profile-input]"));
    const initialValues = new Map();

    inputFields.forEach((field) => {
        initialValues.set(field.dataset.clientProfileInput, field.value);
    });

    function updateVerifiedView(value) {
        const verifiedView = editor.querySelector('[data-client-profile-view="verified"]');

        if (!verifiedView) {
            return;
        }

        verifiedView.classList.toggle("is-negative", value !== "Sim");

        verifiedView.innerHTML = value === "Sim"
            ? '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z"></path></svg><span>Sim</span>'
            : '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg><span>Não</span>';
    }

    function setEditingState(isEditing) {
        editButton.hidden = isEditing;
        actionWrap.hidden = !isEditing;

        viewFields.forEach((field) => {
            field.hidden = isEditing;
        });

        inputFields.forEach((field) => {
            field.hidden = !isEditing;
        });
    }

    cancelButton?.addEventListener("click", () => {
        inputFields.forEach((field) => {
            const key = field.dataset.clientProfileInput;
            field.value = initialValues.get(key) || "";
        });

        setEditingState(false);
    });

    saveButton?.addEventListener("click", () => {
        inputFields.forEach((field) => {
            const key = field.dataset.clientProfileInput;
            const view = editor.querySelector(`[data-client-profile-view="${key}"]`);

            if (!view) {
                return;
            }

            if (key === "verified") {
                updateVerifiedView(field.value);
            } else if (view.querySelector("span") && !view.classList.contains("client-profile-status")) {
                view.textContent = field.value;
            } else {
                view.textContent = field.value;
            }

            initialValues.set(key, field.value);
        });

        setEditingState(false);
    });

    editButton?.addEventListener("click", () => {
        setEditingState(true);
    });
}

function setupClientAccordionEditors() {
    document.querySelectorAll("[data-client-section-editor]").forEach((section) => {
        const sectionName = section.dataset.clientSectionEditor;
        const editButton = section.querySelector(`[data-client-section-edit="${sectionName}"]`);
        const actions = section.querySelector(`[data-client-section-actions="${sectionName}"]`);
        const cancelButton = section.querySelector(`[data-client-section-cancel="${sectionName}"]`);
        const saveButton = section.querySelector(`[data-client-section-save="${sectionName}"]`);
        const inputs = Array.from(section.querySelectorAll("[data-client-section-input]")).filter((item) =>
            item.dataset.clientSectionInput.startsWith(`${sectionName}-`)
        );
        const views = Array.from(section.querySelectorAll("[data-client-section-view]")).filter((item) =>
            item.dataset.clientSectionView.startsWith(`${sectionName}-`)
        );
        const initialValues = new Map();
        let lastCepRequested = "";

        if (!editButton || !actions || !inputs.length) {
            return;
        }

        inputs.forEach((field) => {
            if (field.matches("input, select, textarea")) {
                initialValues.set(field.dataset.clientSectionInput, field.value);
                return;
            }

            initialValues.set(
                field.dataset.clientSectionInput,
                Array.from(field.querySelectorAll('input[type="checkbox"]:checked')).map((checkbox) => checkbox.value)
            );
        });

        function setEditingState(isEditing) {
            editButton.hidden = isEditing;
            actions.hidden = !isEditing;

            inputs.forEach((field) => {
                field.hidden = !isEditing;
            });

            views.forEach((view) => {
                view.hidden = isEditing;
            });
        }

        function formatWhatsapp(value) {
            const digits = value.replace(/\D/g, "").slice(0, 11);

            if (digits.length <= 2) {
                return digits ? `(${digits}` : "";
            }

            if (digits.length <= 7) {
                return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
            }

            return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
        }

        function formatPhone(value) {
            const digits = value.replace(/\D/g, "").slice(0, 10);

            if (digits.length <= 2) {
                return digits ? `(${digits}` : "";
            }

            if (digits.length <= 6) {
                return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
            }

            return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
        }

        async function lookupCep(rawCep) {
            if (sectionName !== "address") {
                return;
            }

            const cep = rawCep.replace(/\D/g, "");

            if (cep.length !== 8) {
                return;
            }

            lastCepRequested = cep;

            const streetInput = section.querySelector("[data-address-street-input]");
            const districtInput = section.querySelector("[data-address-district-input]");
            const cityInput = section.querySelector("[data-address-city-input]");
            const stateInput = section.querySelector("[data-address-state-input]");

            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();

                if (lastCepRequested !== cep || data.erro) {
                    return;
                }

                if (streetInput) {
                    streetInput.value = data.logradouro || "";
                }

                if (districtInput) {
                    districtInput.value = data.bairro || "";
                }

                if (cityInput) {
                    cityInput.value = data.localidade || "";
                }

                if (stateInput) {
                    stateInput.value = data.uf || "";
                }
            } catch (error) {
                console.error("Nao foi possivel consultar o CEP.", error);
            }
        }

        if (sectionName === "address") {
            const cepInput = section.querySelector("[data-address-cep-input]");

            cepInput?.addEventListener("input", (event) => {
                const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
                event.target.value = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;

                if (digits.length === 8) {
                    lookupCep(digits);
                }
            });

            cepInput?.addEventListener("blur", () => {
                lookupCep(cepInput.value);
            });
        }

        if (sectionName === "contacts") {
            const whatsappInput = section.querySelector("[data-contact-whatsapp-input]");
            const phoneInput = section.querySelector("[data-contact-phone-input]");
            const emailInput = section.querySelector("[data-contact-email-input]");

            whatsappInput?.addEventListener("input", (event) => {
                event.target.value = formatWhatsapp(event.target.value);
            });

            phoneInput?.addEventListener("input", (event) => {
                event.target.value = formatPhone(event.target.value);
            });

            emailInput?.addEventListener("blur", () => {
                emailInput.value = emailInput.value.trim().toLowerCase();
            });
        }

        cancelButton?.addEventListener("click", () => {
            inputs.forEach((field) => {
                const key = field.dataset.clientSectionInput;
                const initialValue = initialValues.get(key);

                if (field.matches("input, select, textarea")) {
                    field.value = initialValue || "";
                    return;
                }

                const selectedValues = Array.isArray(initialValue) ? initialValue : [];
                field.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
                    checkbox.checked = selectedValues.includes(checkbox.value);
                });
            });

            setEditingState(false);
        });

        saveButton?.addEventListener("click", () => {
            if (sectionName === "contacts") {
                const emailInput = section.querySelector("[data-contact-email-input]");

                if (emailInput && emailInput.value && !emailInput.checkValidity()) {
                    emailInput.reportValidity();
                    return;
                }
            }

            inputs.forEach((field) => {
                const key = field.dataset.clientSectionInput;
                const view = section.querySelector(`[data-client-section-view="${key}"]`);

                if (!view) {
                    return;
                }

                if (field.matches("input, select, textarea")) {
                    view.textContent = field.value;
                    initialValues.set(key, field.value);
                    return;
                }

                const selectedValues = Array.from(field.querySelectorAll('input[type="checkbox"]:checked')).map((checkbox) => checkbox.value);
                view.innerHTML = selectedValues.length
                    ? selectedValues.map((value) => `<span class="client-accordion-tag">${value}</span>`).join("")
                    : '<span class="client-accordion-tag">Não informado</span>';
                initialValues.set(key, selectedValues);
            });

            setEditingState(false);
        });

        editButton.addEventListener("click", () => {
            setEditingState(true);
        });
    });
}

function setupNewClientForm() {
    const form = document.querySelector("[data-new-client-form]");

    if (!form) {
        return;
    }

    const imageInput = form.querySelector("[data-new-client-image-input]");
    const imagePreview = form.querySelector("[data-new-client-image-preview]");
    const cpfInput = form.querySelector("[data-new-client-cpf]");
    const whatsappInput = form.querySelector("[data-new-client-whatsapp]");
    const phoneInput = form.querySelector("[data-new-client-phone]");
    const emailInput = form.querySelector("[data-new-client-email]");
    const cepInput = form.querySelector("[data-new-client-cep]");
    const streetInput = form.querySelector("[data-new-client-street]");
    const districtInput = form.querySelector("[data-new-client-district]");
    const cityInput = form.querySelector("[data-new-client-city]");
    const stateInput = form.querySelector("[data-new-client-state]");
    const feedback = document.querySelector("[data-new-client-feedback]");
    const imageModal = document.getElementById("new-client-image-modal");
    const imageEditor = document.querySelector("[data-new-client-image-editor]");
    const imageEditorPreview = document.querySelector("[data-new-client-image-editor-preview]");
    const imageApplyButton = document.querySelector("[data-new-client-image-apply]");
    const imageResetButton = document.querySelector("[data-new-client-image-reset]");
    let lastCepRequested = "";
    let pendingImageSrc = "";
    let pendingPosition = { x: 50, y: 50 };
    let savedPosition = { x: 50, y: 50 };
    let isDraggingImage = false;
    let dragStart = { x: 0, y: 0 };
    let dragOrigin = { x: 50, y: 50 };

    function formatCpf(value) {
        const digits = value.replace(/\D/g, "").slice(0, 11);

        if (digits.length <= 3) {
            return digits;
        }

        if (digits.length <= 6) {
            return `${digits.slice(0, 3)}.${digits.slice(3)}`;
        }

        if (digits.length <= 9) {
            return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
        }

        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    }

    function formatWhatsapp(value) {
        const digits = value.replace(/\D/g, "").slice(0, 11);

        if (digits.length <= 2) {
            return digits ? `(${digits}` : "";
        }

        if (digits.length <= 7) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        }

        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }

    function formatPhone(value) {
        const digits = value.replace(/\D/g, "").slice(0, 10);

        if (digits.length <= 2) {
            return digits ? `(${digits}` : "";
        }

        if (digits.length <= 6) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        }

        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    async function lookupCep(rawCep) {
        const cep = rawCep.replace(/\D/g, "");

        if (cep.length !== 8) {
            return;
        }

        lastCepRequested = cep;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (lastCepRequested !== cep || data.erro) {
                return;
            }

            if (streetInput) {
                streetInput.value = data.logradouro || "";
            }

            if (districtInput) {
                districtInput.value = data.bairro || "";
            }

            if (cityInput) {
                cityInput.value = data.localidade || "";
            }

            if (stateInput) {
                stateInput.value = data.uf || "";
            }
        } catch (error) {
            console.error("Nao foi possivel consultar o CEP.", error);
        }
    }

    function setImagePosition(x, y) {
        const clampedX = Math.max(0, Math.min(100, x));
        const clampedY = Math.max(0, Math.min(100, y));
        pendingPosition = { x: clampedX, y: clampedY };

        imageEditorPreview?.style.setProperty("--new-client-image-x", `${clampedX}%`);
        imageEditorPreview?.style.setProperty("--new-client-image-y", `${clampedY}%`);
    }

    function applySavedImage() {
        if (!imagePreview) {
            return;
        }

        imagePreview.src = pendingImageSrc || imagePreview.src;
        imagePreview.style.setProperty("--new-client-image-x", `${savedPosition.x}%`);
        imagePreview.style.setProperty("--new-client-image-y", `${savedPosition.y}%`);
    }

    function closeImageModal() {
        if (!imageModal) {
            return;
        }

        imageModal.hidden = true;
        document.body.classList.remove("modal-open");
        if (imageInput) {
            imageInput.value = "";
        }
    }

    imageInput?.addEventListener("change", () => {
        const file = imageInput.files && imageInput.files[0];

        if (!file || !imagePreview || !imageEditorPreview || !imageModal) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            pendingImageSrc = event.target?.result || imagePreview.src;
            imageEditorPreview.src = pendingImageSrc;
            pendingPosition = { ...savedPosition };
            setImagePosition(pendingPosition.x, pendingPosition.y);
            imageModal.hidden = false;
            document.body.classList.add("modal-open");
        };
        reader.readAsDataURL(file);
    });

    imageEditor?.addEventListener("pointerdown", (event) => {
        if (!imageModal || imageModal.hidden) {
            return;
        }

        isDraggingImage = true;
        dragStart = { x: event.clientX, y: event.clientY };
        dragOrigin = { ...pendingPosition };
        imageEditor.setPointerCapture(event.pointerId);
    });

    imageEditor?.addEventListener("pointermove", (event) => {
        if (!isDraggingImage || !imageEditor) {
            return;
        }

        const rect = imageEditor.getBoundingClientRect();
        const deltaX = ((event.clientX - dragStart.x) / rect.width) * 100;
        const deltaY = ((event.clientY - dragStart.y) / rect.height) * 100;
        setImagePosition(dragOrigin.x - deltaX, dragOrigin.y - deltaY);
    });

    function stopDraggingImage(event) {
        if (!isDraggingImage || !imageEditor) {
            return;
        }

        isDraggingImage = false;

        if (typeof event.pointerId !== "undefined") {
            try {
                imageEditor.releasePointerCapture(event.pointerId);
            } catch (error) {
                // ignore release errors for safety
            }
        }
    }

    imageEditor?.addEventListener("pointerup", stopDraggingImage);
    imageEditor?.addEventListener("pointercancel", stopDraggingImage);

    imageResetButton?.addEventListener("click", () => {
        setImagePosition(50, 50);
    });

    imageApplyButton?.addEventListener("click", () => {
        savedPosition = { ...pendingPosition };
        applySavedImage();
        closeImageModal();
    });

    document.querySelectorAll("[data-new-client-image-close]").forEach((button) => {
        button.addEventListener("click", closeImageModal);
    });

    cpfInput?.addEventListener("input", (event) => {
        event.target.value = formatCpf(event.target.value);
    });

    whatsappInput?.addEventListener("input", (event) => {
        event.target.value = formatWhatsapp(event.target.value);
    });

    phoneInput?.addEventListener("input", (event) => {
        event.target.value = formatPhone(event.target.value);
    });

    emailInput?.addEventListener("blur", () => {
        emailInput.value = emailInput.value.trim().toLowerCase();
    });

    cepInput?.addEventListener("input", (event) => {
        const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
        event.target.value = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;

        if (digits.length === 8) {
            lookupCep(digits);
        }
    });

    cepInput?.addEventListener("blur", () => {
        lookupCep(cepInput.value);
    });

    form.addEventListener("submit", (event) => {
        if (!form.reportValidity()) {
            event.preventDefault();
            return;
        }

        event.preventDefault();

        if (feedback) {
            feedback.hidden = false;
        }
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

function setupActionMenus() {
    document.querySelectorAll("[data-actions-toggle]").forEach((toggle) => {
        const wrapper = toggle.closest(".finance-actions-menu");
        const menu = wrapper ? wrapper.querySelector("[data-actions-menu]") : null;

        if (!wrapper || !menu) {
            return;
        }

        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");

        toggle.addEventListener("click", (event) => {
            event.stopPropagation();
            const shouldOpen = menu.hidden;

            document.querySelectorAll("[data-actions-menu]").forEach((openMenu) => {
                openMenu.hidden = true;
            });
            document.querySelectorAll("[data-actions-toggle]").forEach((openToggle) => {
                openToggle.setAttribute("aria-expanded", "false");
            });

            menu.hidden = !shouldOpen;
            toggle.setAttribute("aria-expanded", String(shouldOpen));
        });

        menu.addEventListener("click", (event) => {
            if (event.target.closest("[data-modal-target]")) {
                menu.hidden = true;
                toggle.setAttribute("aria-expanded", "false");
            }
        });
    });

    document.addEventListener("click", (event) => {
        if (event.target.closest(".finance-actions-menu")) {
            return;
        }

        document.querySelectorAll("[data-actions-menu]").forEach((menu) => {
            menu.hidden = true;
        });
        document.querySelectorAll("[data-actions-toggle]").forEach((toggle) => {
            toggle.setAttribute("aria-expanded", "false");
        });
    });
}

function setupClientFilters() {
    const wrap = document.querySelector("[data-client-filters-wrap]");
    const toggle = document.querySelector("[data-client-filters-toggle]");
    const panel = document.querySelector("[data-client-filters-panel]");
    const clearButton = document.querySelector("[data-client-filters-clear]");
    const checkAllButton = document.querySelector("[data-client-filters-check-all]");
    const counter = document.querySelector("[data-client-filters-counter]");

    if (!wrap || !toggle || !panel) {
        return;
    }

    const accordions = Array.from(panel.querySelectorAll("[data-client-filter-accordion]"));
    const checkboxes = () => Array.from(panel.querySelectorAll('input[type="checkbox"]'));
    const updateCounter = () => {
        if (!counter) {
            return;
        }

        const allCheckboxes = checkboxes();
        const checkedCount = allCheckboxes.filter((checkbox) => checkbox.checked).length;
        counter.textContent = `${checkedCount}/${allCheckboxes.length} filtros aplicados`;
    };

    accordions.forEach((accordion) => {
        const accordionToggle = accordion.querySelector("[data-client-filter-accordion-toggle]");
        const content = accordion.querySelector("[data-client-filter-accordion-content]");

        if (!accordionToggle || !content) {
            return;
        }

        content.hidden = true;
        accordion.classList.remove("is-open");
        accordionToggle.setAttribute("aria-expanded", "false");

        accordionToggle.addEventListener("click", () => {
            const shouldOpen = content.hidden;
            content.hidden = !shouldOpen;
            accordion.classList.toggle("is-open", shouldOpen);
            accordionToggle.setAttribute("aria-expanded", String(shouldOpen));
        });
    });

    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");

    toggle.addEventListener("click", () => {
        const shouldOpen = panel.hidden;
        panel.hidden = !shouldOpen;
        toggle.setAttribute("aria-expanded", String(shouldOpen));
        wrap.classList.toggle("is-expanded", shouldOpen);
    });

    clearButton?.addEventListener("click", () => {
        checkboxes().forEach((checkbox) => {
            checkbox.checked = false;
        });
        updateCounter();
    });

    checkAllButton?.addEventListener("click", () => {
        checkboxes().forEach((checkbox) => {
            checkbox.checked = true;
        });
        updateCounter();
    });

    checkboxes().forEach((checkbox) => {
        checkbox.addEventListener("change", updateCounter);
    });

    updateCounter();
}

function setupProductFilters() {
    const wrap = document.querySelector("[data-product-filters-wrap]");
    const toggle = document.querySelector("[data-product-filters-toggle]");
    const panel = document.querySelector("[data-product-filters-panel]");
    const clearButton = document.querySelector("[data-product-filters-clear]");
    const checkAllButton = document.querySelector("[data-product-filters-check-all]");
    const counter = document.querySelector("[data-product-filters-counter]");

    if (!wrap || !toggle || !panel) {
        return;
    }

    const checkboxes = () => Array.from(panel.querySelectorAll('input[type="checkbox"]'));
    const radios = () => Array.from(panel.querySelectorAll('input[type="radio"]'));
    const radioGroups = () => Array.from(new Set(radios().map((input) => input.name)));
    const rangeInputs = () => Array.from(panel.querySelectorAll(".clients-filter-range input"));
    const parentCheckboxes = () => Array.from(panel.querySelectorAll("[data-product-category-parent]"));
    const childCheckboxes = (parentKey) => Array.from(panel.querySelectorAll(`[data-product-category-child="${parentKey}"]`));

    function updateCounter() {
        if (!counter) {
            return;
        }

        const checkedCheckboxes = checkboxes().filter((checkbox) => checkbox.checked).length;
        const checkedRadios = radioGroups().reduce((total, groupName) => {
            return total + (panel.querySelector(`input[type="radio"][name="${groupName}"]:checked`) ? 1 : 0);
        }, 0);
        const totalFilters = checkboxes().length + radioGroups().length;
        const appliedFilters = checkedCheckboxes + checkedRadios;

        counter.textContent = `${appliedFilters}/${totalFilters} filtros aplicados`;
    }

    function syncParentState(parentInput) {
        const parentKey = parentInput.dataset.productCategoryParent;
        const children = childCheckboxes(parentKey);
        const checkedChildren = children.filter((child) => child.checked).length;

        parentInput.checked = checkedChildren === children.length && children.length > 0;
        parentInput.indeterminate = checkedChildren > 0 && checkedChildren < children.length;
    }

    function syncAllParents() {
        parentCheckboxes().forEach(syncParentState);
    }

    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");

    toggle.addEventListener("click", () => {
        const shouldOpen = panel.hidden;
        panel.hidden = !shouldOpen;
        toggle.setAttribute("aria-expanded", String(shouldOpen));
        wrap.classList.toggle("is-expanded", shouldOpen);
    });

    parentCheckboxes().forEach((parentInput) => {
        parentInput.addEventListener("change", () => {
            const children = childCheckboxes(parentInput.dataset.productCategoryParent);

            children.forEach((child) => {
                child.checked = parentInput.checked;
            });

            parentInput.indeterminate = false;
            updateCounter();
        });
    });

    checkboxes().forEach((checkbox) => {
        if (checkbox.hasAttribute("data-product-category-child")) {
            checkbox.addEventListener("change", () => {
                const parentKey = checkbox.dataset.productCategoryChild;
                const parentInput = panel.querySelector(`[data-product-category-parent="${parentKey}"]`);

                if (parentInput) {
                    syncParentState(parentInput);
                }

                updateCounter();
            });

            return;
        }

        if (!checkbox.hasAttribute("data-product-category-parent")) {
            checkbox.addEventListener("change", updateCounter);
        }
    });

    radios().forEach((radio) => {
        radio.addEventListener("change", updateCounter);
    });

    rangeInputs().forEach((input) => {
        input.addEventListener("input", updateCounter);
    });

    clearButton?.addEventListener("click", () => {
        checkboxes().forEach((checkbox) => {
            checkbox.checked = false;
            checkbox.indeterminate = false;
        });

        radios().forEach((radio) => {
            radio.checked = false;
        });

        rangeInputs().forEach((input) => {
            input.value = "";
        });

        syncAllParents();
        updateCounter();
    });

    checkAllButton?.addEventListener("click", () => {
        checkboxes().forEach((checkbox) => {
            checkbox.checked = true;
            checkbox.indeterminate = false;
        });

        radioGroups().forEach((groupName) => {
            const defaultRadio = panel.querySelector(`input[type="radio"][name="${groupName}"][data-product-radio-default]`);
            const fallbackRadio = panel.querySelector(`input[type="radio"][name="${groupName}"]`);

            if (defaultRadio) {
                defaultRadio.checked = true;
            } else if (fallbackRadio) {
                fallbackRadio.checked = true;
            }
        });

        syncAllParents();
        updateCounter();
    });

    syncAllParents();
    updateCounter();
}

function setupProductPerformance() {
    const chart = document.querySelector("[data-product-performance-chart]");
    const filterWrap = document.querySelector("[data-product-performance-filters]");
    const info = document.querySelector("[data-product-performance-info]");

    if (!chart || !filterWrap) {
        return;
    }

    const buttons = Array.from(filterWrap.querySelectorAll("[data-product-range]"));
    const config = {
        7: { count: 7, maxHeight: 120 },
        30: { count: 30, maxHeight: 132 },
        90: { count: 90, maxHeight: 144 },
        365: { count: 365, maxHeight: 156 }
    };

    function formatShortDate(date) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = date.toLocaleDateString("pt-BR", { month: "short" })
            .replace(".", "")
            .split(" ")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");
        const year = String(date.getFullYear()).slice(-2);

        return `${day} ${month} ${year}`;
    }

    function updateInfo(units, dateText) {
        if (!info) {
            return;
        }

        info.textContent = `${units} un - ${dateText}`;
    }

    function buildHeights(count, maxHeight) {
        return Array.from({ length: count }, (_, index) => {
            const base = (Math.sin((index + 1) * 0.72) + 1) / 2;
            const wave = (Math.cos((index + 1) * 0.31) + 1) / 2;
            const mixed = (base * 0.62) + (wave * 0.38);
            return Math.max(12, Math.round(14 + (mixed * (maxHeight - 14))));
        });
    }

    function renderBars(range) {
        const selected = config[range] || config[30];
        const heights = buildHeights(selected.count, selected.maxHeight);
        const endDate = new Date();

        chart.innerHTML = "";

        heights.forEach((height, index) => {
            const bar = document.createElement("span");
            bar.className = "product-performance-bar";
            const units = Math.max(1, Math.round((height / selected.maxHeight) * 42));
            const date = new Date(endDate);
            date.setDate(endDate.getDate() - (selected.count - 1 - index));
            const formattedDate = formatShortDate(date);

            if (index === heights.length - 1) {
                bar.classList.add("is-strong");
            }

            bar.dataset.value = `${units} un`;
            bar.dataset.date = formattedDate;
            bar.setAttribute("aria-label", `${units} unidades`);
            bar.tabIndex = 0;
            bar.style.height = "0px";
            chart.appendChild(bar);

            bar.addEventListener("mouseenter", () => {
                updateInfo(units, formattedDate);
            });

            bar.addEventListener("focus", () => {
                updateInfo(units, formattedDate);
            });

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    bar.style.height = `${height}px`;
                });
            });
        });

        const lastHeight = heights[heights.length - 1];
        const lastUnits = Math.max(1, Math.round((lastHeight / selected.maxHeight) * 42));
        const lastDate = formatShortDate(endDate);
        updateInfo(lastUnits, lastDate);
    }

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            buttons.forEach((item) => {
                item.classList.toggle("is-active", item === button);
            });

            renderBars(Number(button.dataset.productRange));
        });
    });

    const activeButton = filterWrap.querySelector(".is-active") || buttons[0];

    if (activeButton) {
        renderBars(Number(activeButton.dataset.productRange));
    }
}

function setupManualProductAddPage() {
    const page = document.querySelector("[data-manual-product-page]");

    if (!page) {
        return;
    }

    const catalog = [
        { code: "PBX-993281", name: "Batom Matte Velvet - Rose Pink", price: 89.90 },
        { code: "PBX-442110", name: "Sérum Facial Glow Booster 30ml", price: 159.00 },
        { code: "PBX-883344", name: "Paleta de Sombras Midnight Bloom", price: 124.90 },
        { code: "PBX-112233", name: "Eau de Parfum Pink Seduction 50ml", price: 299.00 },
        { code: "PBX-556677", name: "Base Fluida Matte Skin - Tom 20", price: 75.00 },
        { code: "MK-445821", name: "Kit TimeWise Repair Volu-Firm", price: 249.90 },
        { code: "MK-772145", name: "Sérum C+E TimeWise", price: 179.90 },
        { code: "MK-390512", name: "Loção Corporal Satin Body", price: 23.10 }
    ];

    const searchInput = page.querySelector("[data-manual-product-search]");
    const priceInput = page.querySelector("[data-manual-product-price]");
    const qtyValue = page.querySelector("[data-manual-product-qty]");
    const qtyMinus = page.querySelector("[data-manual-product-minus]");
    const qtyPlus = page.querySelector("[data-manual-product-plus]");
    const addButton = page.querySelector("[data-manual-product-add]");
    const results = page.querySelector("[data-manual-product-results]");
    const selection = page.querySelector("[data-manual-product-selection]");
    const historyTable = page.querySelector("[data-manual-product-history]");
    const modal = document.getElementById("manual-product-confirm-modal");
    const confirmQty = modal?.querySelector("[data-manual-product-confirm-qty]");
    const confirmName = modal?.querySelector("[data-manual-product-confirm-name]");
    const confirmButton = modal?.querySelector("[data-manual-product-confirm]");

    let selectedProduct = null;
    let quantity = 1;

    if (!searchInput || !priceInput || !qtyValue || !qtyMinus || !qtyPlus || !addButton || !results || !selection || !historyTable || !modal || !confirmQty || !confirmName || !confirmButton) {
        return;
    }

    function closeModal() {
        modal.hidden = true;
        if (!document.querySelector(".client-modal:not([hidden])")) {
            document.body.classList.remove("modal-open");
        }
    }

    function openModal() {
        modal.hidden = false;
        document.body.classList.add("modal-open");
    }

    function updateButtonState() {
        addButton.disabled = !selectedProduct || quantity < 1 || parseCurrencyPtBr(priceInput.value) <= 0;
        qtyMinus.disabled = quantity <= 1;
        qtyValue.textContent = String(quantity);
    }

    function setSelection(product) {
        selectedProduct = product;
        searchInput.value = `${product.name} (${product.code})`;
        priceInput.disabled = false;
        priceInput.value = `R$ ${formatCurrencyPtBr(product.price)}`;
        selection.textContent = `Produto selecionado: ${product.name}`;
        results.hidden = true;
        results.innerHTML = "";
        updateButtonState();
    }

    function renderResults(query) {
        const normalized = query.trim().toLowerCase();

        if (normalized.length < 3) {
            results.hidden = true;
            results.innerHTML = "";
            return;
        }

        const matches = catalog.filter((product) => {
            return `${product.name} ${product.code}`.toLowerCase().includes(normalized);
        });

        if (!matches.length) {
            results.innerHTML = '<div class="manual-product-result-empty">Nenhum produto encontrado.</div>';
            results.hidden = false;
            return;
        }

        results.innerHTML = matches.map((product) => {
            return `
                <button type="button" class="manual-product-result-item" data-manual-product-option="${product.code}">
                    <strong>${product.name}</strong>
                    <span>${product.code}</span>
                </button>
            `;
        }).join("");

        results.hidden = false;

        results.querySelectorAll("[data-manual-product-option]").forEach((button) => {
            button.addEventListener("click", () => {
                const chosen = catalog.find((product) => product.code === button.dataset.manualProductOption);

                if (chosen) {
                    setSelection(chosen);
                }
            });
        });
    }

    searchInput.addEventListener("input", () => {
        selectedProduct = null;
        priceInput.value = "";
        priceInput.disabled = true;
        selection.textContent = "Nenhum produto selecionado.";
        updateButtonState();
        renderResults(searchInput.value);
    });

    priceInput.addEventListener("input", () => {
        updateButtonState();
    });

    qtyMinus.addEventListener("click", () => {
        quantity = Math.max(1, quantity - 1);
        updateButtonState();
    });

    qtyPlus.addEventListener("click", () => {
        quantity += 1;
        updateButtonState();
    });

    addButton.addEventListener("click", () => {
        if (!selectedProduct) {
            return;
        }

        confirmQty.textContent = String(quantity);
        confirmName.textContent = selectedProduct.name;
        openModal();
    });

    confirmButton.addEventListener("click", () => {
        const now = new Date();
        const formattedDate = new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }).format(now).replace(".", "");

        historyTable.insertAdjacentHTML("afterbegin", `
            <tr>
                <td>${formattedDate}</td>
                <td><strong>${selectedProduct.name}</strong></td>
                <td>R$ ${formatCurrencyPtBr(parseCurrencyPtBr(priceInput.value))}</td>
                <td>${quantity} un</td>
            </tr>
        `);

        closeModal();
        selectedProduct = null;
        searchInput.value = "";
        priceInput.value = "";
        priceInput.disabled = true;
        quantity = 1;
        selection.textContent = "Produto adicionado ao estoque com sucesso.";
        updateButtonState();
    });

    modal.querySelectorAll("[data-manual-product-close]").forEach((button) => {
        button.addEventListener("click", closeModal);
    });

    document.addEventListener("click", (event) => {
        if (!page.contains(event.target)) {
            results.hidden = true;
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeModal();
            results.hidden = true;
        }
    });

    updateButtonState();
}

function setupNewMkOrderPage() {
    const page = document.querySelector("[data-mk-new-order-page]");

    if (!page) {
        return;
    }

    const catalog = [
        { code: "MK-445821", name: "Kit TimeWise Repair Volu-Firm", points: 48, price: 249.90 },
        { code: "MK-772145", name: "Sérum C+E TimeWise", points: 44, price: 179.90 },
        { code: "MK-390512", name: "Loção Corporal Satin Body", points: 16, price: 23.10 },
        { code: "MK-228940", name: "Batom Gel Semi-Matte Rosé", points: 13, price: 49.80 },
        { code: "MK-834120", name: "Sabonete 3 em 1 TimeWise", points: 18, price: 72.40 },
        { code: "MK-681450", name: "Máscara de Cílios Lash Love", points: 15, price: 63.50 },
        { code: "MK-553710", name: "Base TimeWise 3D Beige 2", points: 22, price: 89.90 }
    ];

    const pdfTrigger = page.querySelector("[data-mk-pdf-trigger]");
    const pdfInput = page.querySelector("[data-mk-pdf-input]");
    const pdfLabel = page.querySelector("[data-mk-pdf-label]");
    const searchInput = page.querySelector("[data-mk-new-order-search]");
    const priceInput = page.querySelector("[data-mk-new-order-price]");
    const results = page.querySelector("[data-mk-new-order-results]");
    const qtyValue = page.querySelector("[data-mk-new-order-qty]");
    const qtyMinus = page.querySelector("[data-mk-new-order-minus]");
    const qtyPlus = page.querySelector("[data-mk-new-order-plus]");
    const addButton = page.querySelector("[data-mk-new-order-add]");
    const selection = page.querySelector("[data-mk-new-order-selection]");
    const historyTable = page.querySelector("[data-mk-new-order-history]");
    const launchButton = page.querySelector("[data-mk-launch-open]");
    const replaceModal = document.getElementById("mk-pdf-replace-modal");
    const replaceConfirm = replaceModal?.querySelector("[data-mk-pdf-use]");
    const launchModal = document.getElementById("mk-launch-products-modal");
    const launchConfirm = launchModal?.querySelector("[data-mk-launch-confirm]");
    const deleteModal = document.getElementById("mk-new-order-delete-modal");
    const deleteName = deleteModal?.querySelector("[data-mk-new-order-delete-name]");
    const deleteConfirm = deleteModal?.querySelector("[data-mk-new-order-delete-confirm]");

    let selectedProduct = null;
    let quantity = 1;
    let pdfReady = false;
    let currentPdfName = "";
    let pendingDeleteRow = null;

    if (!searchInput || !priceInput || !results || !qtyValue || !qtyMinus || !qtyPlus || !addButton || !selection || !historyTable || !deleteModal || !deleteName || !deleteConfirm) {
        return;
    }

    function closeReplaceModal() {
        if (!replaceModal) {
            return;
        }
        replaceModal.hidden = true;
        if (!document.querySelector(".client-modal:not([hidden])")) {
            document.body.classList.remove("modal-open");
        }
    }

    function openReplaceModal() {
        if (!replaceModal) {
            return;
        }
        replaceModal.hidden = false;
        document.body.classList.add("modal-open");
    }

    function closeLaunchModal() {
        if (!launchModal) {
            return;
        }
        launchModal.hidden = true;
        if (!document.querySelector(".client-modal:not([hidden])")) {
            document.body.classList.remove("modal-open");
        }
    }

    function openLaunchModal() {
        if (!launchModal) {
            return;
        }
        launchModal.hidden = false;
        document.body.classList.add("modal-open");
    }

    function closeDeleteModal() {
        deleteModal.hidden = true;
        pendingDeleteRow = null;
        if (!document.querySelector(".client-modal:not([hidden])")) {
            document.body.classList.remove("modal-open");
        }
    }

    function openDeleteModal(row, name) {
        pendingDeleteRow = row;
        deleteName.textContent = name;
        deleteModal.hidden = false;
        document.body.classList.add("modal-open");
    }

    function renderHistoryRow(product, rowQuantity) {
        return `
            <tr>
                <td><span class="products-sku">${product.code}</span></td>
                <td><strong>${product.name}</strong></td>
                <td>${product.points}</td>
                <td>R$ ${formatCurrencyPtBr(product.price)}</td>
                <td>${rowQuantity}</td>
                <td>R$ ${formatCurrencyPtBr(product.price * rowQuantity)}</td>
                <td>
                    <button type="button" class="mk-order-row-delete" data-mk-new-order-delete="${product.name}" aria-label="Excluir ${product.name}">
                        <svg viewBox="0 0 256 256" aria-hidden="true"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM112,168a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm0-120H96V40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8Z"></path></svg>
                    </button>
                </td>
            </tr>
        `;
    }

    function updateButtonState() {
        addButton.disabled = !selectedProduct || quantity < 1 || parseCurrencyPtBr(priceInput.value) <= 0;
        qtyMinus.disabled = quantity <= 1;
        qtyValue.textContent = String(quantity);
    }

    function setSelection(product) {
        selectedProduct = product;
        searchInput.value = `${product.name} (${product.code})`;
        priceInput.disabled = false;
        priceInput.value = `R$ ${formatCurrencyPtBr(product.price)}`;
        selection.textContent = `Produto selecionado: ${product.name}`;
        results.hidden = true;
        results.innerHTML = "";
        updateButtonState();
    }

    function renderResults(query) {
        const normalized = query.trim().toLowerCase();

        if (normalized.length < 3) {
            results.hidden = true;
            results.innerHTML = "";
            return;
        }

        const matches = catalog.filter((product) => {
            return `${product.name} ${product.code}`.toLowerCase().includes(normalized);
        });

        if (!matches.length) {
            results.innerHTML = '<div class="manual-product-result-empty">Nenhum produto encontrado.</div>';
            results.hidden = false;
            return;
        }

        results.innerHTML = matches.map((product) => `
            <button type="button" class="manual-product-result-item" data-mk-new-order-option="${product.code}">
                <strong>${product.name}</strong>
                <span>${product.code}</span>
            </button>
        `).join("");

        results.hidden = false;

        results.querySelectorAll("[data-mk-new-order-option]").forEach((button) => {
            button.addEventListener("click", () => {
                const chosen = catalog.find((product) => product.code === button.dataset.mkNewOrderOption);

                if (chosen) {
                    setSelection(chosen);
                }
            });
        });
    }

    function applyPdfProducts() {
        const pdfItems = [
            { code: "MK-902310", name: "Conjunto TimeWise Miracle Set", points: 62, price: 319.90, qty: 1 },
            { code: "MK-551240", name: "Base TimeWise 3D Beige N 140", points: 22, price: 89.90, qty: 3 },
            { code: "MK-770180", name: "Batom Unlimited Lip Gloss Rosé", points: 11, price: 42.50, qty: 2 },
            { code: "MK-118420", name: "Sabonete Botanical Effects", points: 14, price: 58.40, qty: 1 }
        ];

        historyTable.innerHTML = pdfItems.map((item) => renderHistoryRow(item, item.qty)).join("");

        selection.textContent = currentPdfName
            ? `PDF salvo e produtos importados: ${currentPdfName}`
            : "PDF salvo e produtos importados com sucesso.";
    }

    if (pdfTrigger && pdfInput && pdfLabel && replaceModal && replaceConfirm) {
        pdfTrigger.addEventListener("click", () => {
            if (!pdfReady) {
                pdfInput.click();
                return;
            }

            if (historyTable.querySelector("tr")) {
                openReplaceModal();
                return;
            }

            applyPdfProducts();
        });

        pdfInput.addEventListener("change", () => {
            const fileName = pdfInput.files?.[0]?.name;

            if (fileName) {
                selection.textContent = `PDF selecionado: ${fileName}`;
                currentPdfName = fileName;
                pdfReady = true;
                pdfLabel.textContent = "Salvar PDF";
                pdfTrigger.classList.remove("products-toolbar-button");
                pdfTrigger.classList.add("clients-primary-button", "mk-pdf-button", "is-ready");
            }
        });

        replaceConfirm.addEventListener("click", () => {
            applyPdfProducts();
            closeReplaceModal();
        });

        replaceModal.querySelectorAll("[data-mk-pdf-close]").forEach((button) => {
            button.addEventListener("click", closeReplaceModal);
        });
    }

    searchInput.addEventListener("input", () => {
        selectedProduct = null;
        priceInput.value = "";
        priceInput.disabled = true;
        selection.textContent = "Nenhum produto selecionado.";
        updateButtonState();
        renderResults(searchInput.value);
    });

    priceInput.addEventListener("input", () => {
        updateButtonState();
    });

    qtyMinus.addEventListener("click", () => {
        quantity = Math.max(1, quantity - 1);
        updateButtonState();
    });

    qtyPlus.addEventListener("click", () => {
        quantity += 1;
        updateButtonState();
    });

    addButton.addEventListener("click", () => {
        if (!selectedProduct) {
            return;
        }

        const productForRow = {
            ...selectedProduct,
            price: parseCurrencyPtBr(priceInput.value)
        };

        historyTable.insertAdjacentHTML("afterbegin", renderHistoryRow(productForRow, quantity));

        selectedProduct = null;
        quantity = 1;
        searchInput.value = "";
        priceInput.value = "";
        priceInput.disabled = true;
        selection.textContent = "Produto adicionado ao pedido com sucesso.";
        updateButtonState();
    });

    historyTable.addEventListener("click", (event) => {
        const deleteButton = event.target.closest("[data-mk-new-order-delete]");

        if (!deleteButton) {
            return;
        }

        const row = deleteButton.closest("tr");

        if (!row) {
            return;
        }

        openDeleteModal(row, deleteButton.dataset.mkNewOrderDelete || "este produto");
    });

    deleteConfirm.addEventListener("click", () => {
        pendingDeleteRow?.remove();
        selection.textContent = "Produto removido da lista.";
        closeDeleteModal();
    });

    deleteModal.querySelectorAll("[data-mk-new-order-delete-close]").forEach((button) => {
        button.addEventListener("click", closeDeleteModal);
    });

    if (launchButton && launchModal && launchConfirm) {
        launchButton.addEventListener("click", () => {
            openLaunchModal();
        });

        launchConfirm.addEventListener("click", () => {
            window.location.href = "./pedidos-mk.html";
        });

        launchModal.querySelectorAll("[data-mk-launch-close]").forEach((button) => {
            button.addEventListener("click", closeLaunchModal);
        });
    }

    document.addEventListener("click", (event) => {
        if (!page.contains(event.target)) {
            results.hidden = true;
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeReplaceModal();
            closeLaunchModal();
            closeDeleteModal();
        }
    });

    updateButtonState();
}

function setupNewSalePage() {
    const page = document.querySelector("[data-new-sale-page]");

    if (!page) {
        return;
    }

    const clients = [
        { name: "Mariana Silveira", cpf: "123.456.789-00", phone: "(11) 99876-5432" },
        { name: "Ana Paula Santos", cpf: "987.654.321-00", phone: "(11) 99111-2233" },
        { name: "Camila Costa", cpf: "456.789.123-00", phone: "(21) 99777-8899" },
        { name: "Clara Martins", cpf: "741.852.963-11", phone: "(31) 98888-1122" },
        { name: "Juliana Reis", cpf: "258.369.147-22", phone: "(41) 99999-5566" }
    ];

    const catalog = [
        { code: "PBX-992381", name: "Batom Matte Velvet - Rose Pink", price: 89.90 },
        { code: "PBX-442110", name: "Sérum Facial Glow Booster 30ml", price: 159.00 },
        { code: "PBX-883344", name: "Paleta de Sombras Midnight Bloom", price: 124.90 },
        { code: "PB-ROS-050", name: "Perfume Rose Exclusive 50ml", price: 489.00 },
        { code: "PBX-556677", name: "Base Fluida Matte Skin - Tom 20", price: 75.00 }
    ];

    const clientSearch = page.querySelector("[data-new-sale-client-search]");
    const clientResults = page.querySelector("[data-new-sale-client-results]");
    const clientSelection = page.querySelector("[data-new-sale-client-selection]");
    const productSearch = page.querySelector("[data-new-sale-product-search]");
    const productResults = page.querySelector("[data-new-sale-product-results]");
    const productPrice = page.querySelector("[data-new-sale-product-price]");
    const productQty = page.querySelector("[data-new-sale-product-qty]");
    const productMinus = page.querySelector("[data-new-sale-product-minus]");
    const productPlus = page.querySelector("[data-new-sale-product-plus]");
    const productAdd = page.querySelector("[data-new-sale-product-add]");
    const productsHistory = page.querySelector("[data-new-sale-products-history]");
    const productsEmptyRow = page.querySelector("[data-new-sale-products-empty-row]");
    const productsCount = page.querySelector("[data-new-sale-products-count]");
    const deleteModal = document.getElementById("new-sale-delete-modal");
    const deleteName = deleteModal?.querySelector("[data-new-sale-delete-name]");
    const deleteConfirm = deleteModal?.querySelector("[data-new-sale-delete-confirm]");
    const saveOpenButton = page.querySelector("[data-new-sale-save-open]");
    const confirmModal = document.getElementById("new-sale-confirm-modal");
    const confirmSummary = confirmModal?.querySelector(".new-sale-confirm-summary");
    const confirmApply = confirmModal?.querySelector("[data-new-sale-confirm-apply]");
    const saleDateInput = page.querySelector("[data-new-sale-sale-date]");
    const saleTypeSelect = page.querySelector("[data-new-sale-sale-type]");
    const paymentMethodSelect = page.querySelector("[data-new-sale-payment-method]");
    const installmentsSelect = page.querySelector("[data-new-sale-payment-installments]");
    const paymentStatusSelect = page.querySelector("[data-new-sale-payment-status]");
    const deliveryStatusSelect = page.querySelector("[data-new-sale-delivery-status]");
    const adjustmentRows = Array.from(page.querySelectorAll("[data-new-sale-adjustment-row]"));
    const summaryCount = page.querySelector("[data-new-sale-summary-count]");
    const summarySubtotal = page.querySelector("[data-new-sale-summary-subtotal]");
    const summaryFreight = page.querySelector("[data-new-sale-summary-freight]");
    const summaryFreightDescription = page.querySelector("[data-new-sale-summary-freight-description]");
    const summaryInsurance = page.querySelector("[data-new-sale-summary-insurance]");
    const summaryInsuranceDescription = page.querySelector("[data-new-sale-summary-insurance-description]");
    const summaryTax = page.querySelector("[data-new-sale-summary-tax]");
    const summaryTaxDescription = page.querySelector("[data-new-sale-summary-tax-description]");
    const summaryDiscount = page.querySelector("[data-new-sale-summary-discount]");
    const summaryDiscountDescription = page.querySelector("[data-new-sale-summary-discount-description]");
    const summaryOther = page.querySelector("[data-new-sale-summary-other]");
    const summaryOtherDescription = page.querySelector("[data-new-sale-summary-other-description]");
    const sidebarInstallments = page.querySelector("[data-new-sale-sidebar-installments]");
    const confirmClient = confirmModal?.querySelector("[data-new-sale-confirm-client]");
    const confirmDate = confirmModal?.querySelector("[data-new-sale-confirm-date]");
    const confirmProducts = confirmModal?.querySelector("[data-new-sale-confirm-products]");
    const confirmMethod = confirmModal?.querySelector("[data-new-sale-confirm-method]");
    const confirmInstallments = confirmModal?.querySelector("[data-new-sale-confirm-installments]");
    const confirmPaymentStatus = confirmModal?.querySelector("[data-new-sale-confirm-payment-status]");
    const confirmDeliveryStatus = confirmModal?.querySelector("[data-new-sale-confirm-delivery-status]");
    const confirmCosts = confirmModal?.querySelector("[data-new-sale-confirm-costs]");
    const confirmParcels = confirmModal?.querySelector("[data-new-sale-confirm-parcels]");
    const confirmTotal = confirmModal?.querySelector("[data-new-sale-confirm-total]");
    const confirmReceived = confirmModal?.querySelector("[data-new-sale-confirm-received]");
    const confirmPending = confirmModal?.querySelector("[data-new-sale-confirm-pending]");
    const confirmAlert = confirmModal?.querySelector("[data-new-sale-confirm-alert]");
    const editWarning = confirmModal?.querySelector("[data-new-sale-edit-warning]");
    const installmentRows = Array.from(page.querySelectorAll("[data-new-sale-installment-row]"));

    let selectedClient = null;
    let selectedProduct = null;
    let quantity = 1;
    let pendingDeleteRow = null;

    if (!clientSearch || !clientResults || !clientSelection || !productSearch || !productResults || !productPrice || !productQty || !productMinus || !productPlus || !productAdd || !productsHistory || !productsCount || !deleteModal || !deleteName || !deleteConfirm) {
        return;
    }

    const initialClientName = clientSearch.dataset.initialClientName;
    const initialClientCpf = clientSearch.dataset.initialClientCpf;
    const initialClientPhone = clientSearch.dataset.initialClientPhone;

    if (initialClientName && initialClientCpf && initialClientPhone) {
        selectedClient = {
            name: initialClientName,
            cpf: initialClientCpf,
            phone: initialClientPhone
        };

        clientSearch.value = `${initialClientName} (${initialClientCpf})`;
        clientSelection.textContent = `Cliente selecionada: ${initialClientName} • ${initialClientPhone}`;
    }

    function closeDeleteModal() {
        deleteModal.hidden = true;
        pendingDeleteRow = null;
        if (!document.querySelector(".client-modal:not([hidden])")) {
            document.body.classList.remove("modal-open");
        }
    }

    function closeConfirmModal() {
        if (!confirmModal) {
            return;
        }

        confirmModal.hidden = true;

        if (!document.querySelector(".client-modal:not([hidden])")) {
            document.body.classList.remove("modal-open");
        }
    }

    function openDeleteModal(row, name) {
        pendingDeleteRow = row;
        deleteName.textContent = name;
        deleteModal.hidden = false;
        document.body.classList.add("modal-open");
    }

    function formatDatePtBr(value) {
        const [year, month, day] = String(value || "").split("-");
        return year && month && day ? `${day}/${month}/${year}` : "";
    }

    function toIsoDate(value) {
        if (!value) {
            return "";
        }

        if (value.includes("-")) {
            return value;
        }

        const [day, month, year] = String(value).split("/");
        return year && month && day ? `${year}-${month}-${day}` : "";
    }

    function getVisibleInstallmentRows() {
        return installmentRows.filter((row) => !row.hidden);
    }

    function getProductRows() {
        return Array.from(productsHistory.querySelectorAll("tr")).filter((row) => !row.hasAttribute("data-new-sale-products-empty-row"));
    }

    function getProductsSubtotal() {
        return getProductRows().reduce((total, row) => {
            const value = row.querySelector(".products-total")?.textContent?.trim() || "0";
            return total + parseCurrencyPtBr(value);
        }, 0);
    }

    function getAdjustmentData() {
        const data = {
            cost: { Frete: { value: 0, description: "" }, Seguro: { value: 0, description: "" }, Imposto: { value: 0, description: "" }, Outros: { value: 0, description: "" } },
            discount: { Desconto: { value: 0, description: "" }, Outros: { value: 0, description: "" } }
        };

        adjustmentRows.forEach((row) => {
            const group = row.dataset.adjustmentGroup;
            const label = row.dataset.adjustmentLabel;
            const valueInput = row.querySelector("[data-adjustment-value]");
            const descriptionInput = row.querySelector("[data-adjustment-description]");

            if (!group || !label || !data[group]?.[label]) {
                return;
            }

            data[group][label] = {
                value: parseCurrencyPtBr(valueInput?.value || "0"),
                description: descriptionInput?.value?.trim() || ""
            };
        });

        return data;
    }

    function getGrandTotal() {
        const adjustments = getAdjustmentData();
        const subtotal = getProductsSubtotal();
        const costs = adjustments.cost.Frete.value + adjustments.cost.Seguro.value + adjustments.cost.Imposto.value + adjustments.cost.Outros.value;
        const discounts = adjustments.discount.Desconto.value + adjustments.discount.Outros.value;
        return subtotal + costs - discounts;
    }

    function splitInstallments(total, count) {
        const cents = Math.max(0, Math.round(total * 100));
        const base = count > 0 ? Math.floor(cents / count) : 0;
        const remainder = count > 0 ? cents - (base * count) : 0;
        return Array.from({ length: count }, (_, index) => ((base + (index === count - 1 ? remainder : 0)) / 100));
    }

    function syncInstallmentRows() {
        const installmentsValue = installmentsSelect?.value || "À vista";
        const countMatch = installmentsValue.match(/\d+/);
        const count = installmentsValue === "À vista" ? 1 : Math.max(1, Number(countMatch?.[0] || 1));
        const total = getGrandTotal();
        const values = splitInstallments(total, count);
        const baseDate = saleDateInput?.value ? new Date(`${saleDateInput.value}T12:00:00`) : new Date("2026-04-28T12:00:00");
        const paymentMethod = paymentMethodSelect?.value || "Cartão de Crédito";

        installmentRows.forEach((row, index) => {
            const isVisible = index < count;
            row.hidden = !isVisible;

            if (!isVisible) {
                return;
            }

            const dateInput = row.querySelector('[data-installment-input="date"]');
            const dateView = row.querySelector('[data-installment-view="date"]');
            const valueInput = row.querySelector('[data-installment-input="value"]');
            const valueView = row.querySelector('[data-installment-view="value"]');
            const paymentInput = row.querySelector('[data-installment-input="payment"]');
            const paymentView = row.querySelector('[data-installment-view="payment"]');
            const paidCheckbox = row.querySelector("[data-new-sale-installment-paid]");

            const rowDate = new Date(baseDate);
            rowDate.setMonth(rowDate.getMonth() + index);
            const yyyy = rowDate.getFullYear();
            const mm = String(rowDate.getMonth() + 1).padStart(2, "0");
            const dd = String(rowDate.getDate()).padStart(2, "0");
            const brDate = `${dd}/${mm}/${yyyy}`;
            const formattedValue = formatCurrencyPtBr(values[index] || 0);

            if (dateInput) dateInput.value = `${yyyy}-${mm}-${dd}`;
            if (dateView) dateView.textContent = brDate;
            if (valueInput) valueInput.value = formattedValue;
            if (valueView) valueView.textContent = formattedValue;

            if (paymentMethod !== "Várias") {
                if (paymentInput) paymentInput.value = paymentMethod;
                if (paymentView) paymentView.textContent = paymentMethod;
            }

            if (paidCheckbox && paymentStatusSelect?.value !== "Pagamento Parcial") {
                paidCheckbox.checked = paymentStatusSelect?.value === "Pago";
            }
        });

        syncPaymentStatus();
        renderSidebarInstallments();
    }

    function validateInstallmentDate(row, nextDateValue) {
        const visibleRows = getVisibleInstallmentRows();
        const currentIndex = visibleRows.indexOf(row);

        if (currentIndex === -1) {
            return { valid: true, message: "" };
        }

        const saleDateValue = saleDateInput?.value || "";
        const previousRow = currentIndex > 0 ? visibleRows[currentIndex - 1] : null;
        const nextRow = currentIndex < visibleRows.length - 1 ? visibleRows[currentIndex + 1] : null;
        const previousDate = previousRow?.querySelector('[data-installment-input="date"]')?.value
            || toIsoDate(previousRow?.querySelector('[data-installment-view="date"]')?.textContent?.trim());
        const nextDate = nextRow?.querySelector('[data-installment-input="date"]')?.value
            || toIsoDate(nextRow?.querySelector('[data-installment-view="date"]')?.textContent?.trim());

        if (saleDateValue && nextDateValue < saleDateValue) {
            return {
                valid: false,
                message: "A data da parcela não pode ser anterior à data da compra."
            };
        }

        if (previousDate && nextDateValue < previousDate) {
            return {
                valid: false,
                message: "A data da parcela não pode ser menor do que a data da parcela anterior."
            };
        }

        if (nextDate && nextDateValue > nextDate) {
            return {
                valid: false,
                message: "A data da parcela não pode ser maior do que a data da próxima parcela."
            };
        }

        return { valid: true, message: "" };
    }

    function syncPaymentStatus() {
        const status = paymentStatusSelect?.value || "Pago";
        const visibleRows = getVisibleInstallmentRows();

        visibleRows.forEach((row) => {
            const checkbox = row.querySelector("[data-new-sale-installment-paid]");
            if (!checkbox) return;

            if (status === "Pago") {
                checkbox.checked = true;
                checkbox.disabled = true;
            } else if (status === "Não pago") {
                checkbox.checked = false;
                checkbox.disabled = true;
            } else {
                checkbox.disabled = false;
            }
        });

        renderSidebarInstallments();
        updateSummary();
    }

    function renderSidebarInstallments() {
        if (!sidebarInstallments) {
            return;
        }

        const status = paymentStatusSelect?.value || "Pago";
        const visibleRows = getVisibleInstallmentRows();

        sidebarInstallments.innerHTML = visibleRows.map((row, index) => {
            const payment = row.querySelector('[data-installment-view="payment"]')?.textContent?.trim() || "-";
            const date = row.querySelector('[data-installment-view="date"]')?.textContent?.trim() || "-";
            const value = row.querySelector('[data-installment-view="value"]')?.textContent?.trim() || "0,00";
            const checked = row.querySelector("[data-new-sale-installment-paid]")?.checked;
            const receivedClass = status === "Pago" || checked ? " order-installment-item--received" : "";
            const iconClass = status === "Pago" || checked ? "" : " order-installment-icon--warning";
            const iconPath = status === "Pago" || checked
                ? '<path d="M229.66,90.34l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,201.37,218.34,79a8,8,0,0,1,11.32,11.31Z"></path>'
                : '<path d="M236.8,188.09,149.35,36.24a24,24,0,0,0-42.7,0L19.2,188.09A24,24,0,0,0,40,224H216a24,24,0,0,0,20.8-35.91ZM128,112a8,8,0,0,1,8,8v32a8,8,0,0,1-16,0V120A8,8,0,0,1,128,112Zm0,72a12,12,0,1,1,12-12A12,12,0,0,1,128,184Z"></path>';

            return `
                <div class="order-installment-item${receivedClass}">
                    <span class="order-installment-icon${iconClass}">
                        <svg viewBox="0 0 256 256">${iconPath}</svg>
                    </span>
                    <div class="order-installment-copy">
                        <strong>Parcela ${index + 1}</strong>
                        <span>${payment}</span>
                        <span>${date}</span>
                    </div>
                    <strong>R$ ${String(value).replace(/^R\$\s*/, "")}</strong>
                </div>`;
        }).join("");
    }

    function updateSummary() {
        const adjustments = getAdjustmentData();
        const subtotal = getProductsSubtotal();
        const total = getGrandTotal();
        const visibleRows = getVisibleInstallmentRows();
        const paidTotal = paymentStatusSelect?.value === "Pago"
            ? total
            : paymentStatusSelect?.value === "Não pago"
                ? 0
                : visibleRows.reduce((sum, row) => {
                    const checked = row.querySelector("[data-new-sale-installment-paid]")?.checked;
                    const value = row.querySelector('[data-installment-view="value"]')?.textContent?.trim() || "0";
                    return checked ? sum + parseCurrencyPtBr(value) : sum;
                }, 0);
        const pendingTotal = Math.max(0, total - paidTotal);
        const rowCount = getProductRows().length;
        const costOther = adjustments.cost.Outros.value;
        const discountOther = adjustments.discount.Outros.value;
        const netOther = costOther - discountOther;
        const otherDescription = costOther > 0
            ? (adjustments.cost.Outros.description || "Outros custos")
            : discountOther > 0
                ? (adjustments.discount.Outros.description || "Outros descontos")
                : "Sem ajustes";
        const subtotalItem = summarySubtotal?.closest(".mk-builder-summary-item");
        const freightItem = summaryFreight?.closest(".mk-builder-summary-item");
        const insuranceItem = summaryInsurance?.closest(".mk-builder-summary-item");
        const taxItem = summaryTax?.closest(".mk-builder-summary-item");
        const discountItem = summaryDiscount?.closest(".mk-builder-summary-item");
        const otherItem = summaryOther?.closest(".mk-builder-summary-item");

        if (summaryCount) summaryCount.textContent = `${rowCount} item${rowCount === 1 ? "" : "s"} selecionado${rowCount === 1 ? "" : "s"}`;
        if (summarySubtotal) summarySubtotal.textContent = `R$ ${formatCurrencyPtBr(subtotal)}`;
        if (summaryFreight) summaryFreight.textContent = `R$ ${formatCurrencyPtBr(adjustments.cost.Frete.value)}`;
        if (summaryFreightDescription) summaryFreightDescription.textContent = adjustments.cost.Frete.description || "Sem descrição";
        if (summaryInsurance) summaryInsurance.textContent = `R$ ${formatCurrencyPtBr(adjustments.cost.Seguro.value)}`;
        if (summaryInsuranceDescription) summaryInsuranceDescription.textContent = adjustments.cost.Seguro.description || "Sem descrição";
        if (summaryTax) summaryTax.textContent = `R$ ${formatCurrencyPtBr(adjustments.cost.Imposto.value)}`;
        if (summaryTaxDescription) summaryTaxDescription.textContent = adjustments.cost.Imposto.description || "Sem descrição";
        if (summaryDiscount) summaryDiscount.textContent = `- R$ ${formatCurrencyPtBr(adjustments.discount.Desconto.value)}`;
        if (summaryDiscountDescription) summaryDiscountDescription.textContent = adjustments.discount.Desconto.description || "Sem descrição";
        if (summaryOther) {
            summaryOther.textContent = `${netOther < 0 ? "- " : ""}R$ ${formatCurrencyPtBr(Math.abs(netOther))}`;
        }
        if (summaryOtherDescription) summaryOtherDescription.textContent = otherDescription;
        if (subtotalItem) subtotalItem.hidden = subtotal <= 0;
        if (freightItem) freightItem.hidden = adjustments.cost.Frete.value <= 0;
        if (insuranceItem) insuranceItem.hidden = adjustments.cost.Seguro.value <= 0;
        if (taxItem) taxItem.hidden = adjustments.cost.Imposto.value <= 0;
        if (discountItem) discountItem.hidden = adjustments.discount.Desconto.value <= 0;
        if (otherItem) otherItem.hidden = netOther === 0;
        if (confirmTotal) confirmTotal.textContent = `R$ ${formatCurrencyPtBr(total)}`;
        if (confirmReceived) confirmReceived.textContent = `R$ ${formatCurrencyPtBr(paidTotal)}`;
        if (confirmPending) confirmPending.textContent = `R$ ${formatCurrencyPtBr(pendingTotal)}`;

        const totalStrong = page.querySelector("[data-new-sale-summary-total]");
        const receivedStrong = page.querySelector("[data-new-sale-summary-received]");
        const pendingStrong = page.querySelector("[data-new-sale-summary-pending]");
        if (totalStrong) totalStrong.textContent = `R$ ${formatCurrencyPtBr(total)}`;
        if (receivedStrong) receivedStrong.textContent = `R$ ${formatCurrencyPtBr(paidTotal)}`;
        if (pendingStrong) pendingStrong.textContent = `R$ ${formatCurrencyPtBr(pendingTotal)}`;
    }

    function getValidationError() {
        if (!selectedClient) {
            return "Falta preencher o campo cliente.";
        }

        if (!saleDateInput?.value) {
            return "Falta preencher o campo data da venda.";
        }

        if (!saleTypeSelect?.value) {
            return "Falta preencher o campo tipo de venda.";
        }

        if (!getProductRows().length) {
            return "Falta preencher o campo produtos do pedido.";
        }

        const visibleRows = getVisibleInstallmentRows();
        const isPartial = paymentStatusSelect?.value === "Pagamento Parcial";

        if (isPartial) {
            const paidCount = visibleRows.filter((row) => row.querySelector("[data-new-sale-installment-paid]")?.checked).length;

            if (!paidCount) {
                return "Você escolheu a opção de pagamento parcial, mas não informou qual parcela foi paga.";
            }

            if (paidCount === visibleRows.length) {
                return "Pagamento parcial não permite que todas as parcelas estejam marcadas como pagas.";
            }
        }

        return "";
    }

    function buildConfirmSummary() {
        if (!confirmModal) {
            return;
        }

        const validationError = getValidationError();

        if (confirmApply) {
            confirmApply.disabled = Boolean(validationError);
        }

        if (validationError) {
            if (editWarning) {
                editWarning.hidden = true;
            }

            if (confirmAlert) {
                confirmAlert.hidden = false;
                confirmAlert.textContent = validationError;
            }

            if (confirmSummary) {
                confirmSummary.hidden = true;
            }

            if (confirmProducts) confirmProducts.innerHTML = "";
            if (confirmCosts) confirmCosts.innerHTML = "";
            if (confirmParcels) confirmParcels.innerHTML = "";
            return;
        }

        if (confirmAlert) {
            confirmAlert.hidden = true;
            confirmAlert.textContent = "";
        }

        if (editWarning) {
            editWarning.hidden = false;
        }

        if (confirmSummary) {
            confirmSummary.hidden = false;
        }

        const clientText = selectedClient?.name || "Cliente não selecionada";
        const rows = getProductRows();
        const productItems = rows.map((row) => {
            const cells = row.querySelectorAll("td");
            const name = cells[0]?.textContent?.trim() || "Produto";
            const qty = cells[3]?.textContent?.trim() || "1";
            const total = cells[4]?.textContent?.trim() || "R$ 0,00";
            return `<div class="new-sale-confirm-item"><div><strong>${name}</strong><span>${qty} unidade(s)</span></div><strong>${total}</strong></div>`;
        }).join("");

        const costItems = adjustmentRows.map((row) => {
            const label = row.dataset.adjustmentLabel || "";
            const group = row.dataset.adjustmentGroup || "";
            const value = parseCurrencyPtBr(row.querySelector("[data-adjustment-value]")?.value || "0");
            const description = row.querySelector("[data-adjustment-description]")?.value?.trim() || "Sem descrição";

            if (!value) {
                return "";
            }

            const prefix = group === "discount" ? "- " : "";

            return `<div class="new-sale-confirm-item"><div><strong>${label}</strong><span>${description}</span></div><strong>${prefix}R$ ${formatCurrencyPtBr(value)}</strong></div>`;
        }).filter(Boolean).join("");

        const parcelItems = getVisibleInstallmentRows().map((row, index) => {
            const number = row.children[0]?.textContent?.trim() || "-";
            const date = row.querySelector('[data-installment-view="date"]')?.textContent?.trim()
                || formatDatePtBr(row.querySelector('[data-installment-input="date"]')?.value)
                || "-";
            const value = row.querySelector('[data-installment-view="value"]')?.textContent?.trim()
                || row.querySelector('[data-installment-input="value"]')?.value
                || "0,00";
            const payment = row.querySelector('[data-installment-view="payment"]')?.textContent?.trim()
                || row.querySelector('[data-installment-input="payment"]')?.value
                || "-";
            const checked = row.querySelector("[data-new-sale-installment-paid]")?.checked;
            const isPaid = paymentStatusSelect?.value === "Pago" || checked;
            const iconClass = isPaid ? "" : " order-installment-icon--warning";
            const iconPath = isPaid
                ? '<path d="M229.66,90.34l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,201.37,218.34,79a8,8,0,0,1,11.32,11.31Z"></path>'
                : '<path d="M236.8,188.09,149.35,36.24a24,24,0,0,0-42.7,0L19.2,188.09A24,24,0,0,0,40,224H216a24,24,0,0,0,20.8-35.91ZM128,112a8,8,0,0,1,8,8v32a8,8,0,0,1-16,0V120A8,8,0,0,1,128,112Zm0,72a12,12,0,1,1,12-12A12,12,0,0,1,128,184Z"></path>';

            return `
                <div class="order-installment-item${isPaid ? " order-installment-item--received" : ""}">
                    <span class="order-installment-icon${iconClass}">
                        <svg viewBox="0 0 256 256" aria-hidden="true">${iconPath}</svg>
                    </span>
                    <div class="order-installment-copy">
                        <strong>Parcela ${number || index + 1}</strong>
                        <span>${payment}</span>
                        <span>${date}</span>
                    </div>
                    <div class="order-installment-value">
                        <strong>R$ ${String(value).replace(/^R\\$\\s*/, "")}</strong>
                    </div>
                </div>`;
        }).join("");

        if (confirmClient) confirmClient.textContent = clientText;
        if (confirmDate) confirmDate.textContent = formatDatePtBr(saleDateInput?.value) || "28/04/2026";
        if (confirmProducts) confirmProducts.innerHTML = productItems;
        if (confirmMethod) confirmMethod.textContent = paymentMethodSelect?.value || "-";
        if (confirmInstallments) confirmInstallments.textContent = installmentsSelect?.value || "-";
        if (confirmPaymentStatus) confirmPaymentStatus.textContent = paymentStatusSelect?.value || "-";
        if (confirmDeliveryStatus) confirmDeliveryStatus.textContent = deliveryStatusSelect?.value || "-";
        if (confirmCosts) confirmCosts.innerHTML = costItems || '<div class="new-sale-confirm-item"><div><strong>Sem custos ou descontos adicionais</strong></div><strong>R$ 0,00</strong></div>';
        if (confirmParcels) confirmParcels.innerHTML = parcelItems;
        if (confirmTotal) confirmTotal.textContent = page.querySelector("[data-new-sale-summary-total]")?.textContent?.trim() || "R$ 0,00";
        if (confirmReceived) confirmReceived.textContent = page.querySelector("[data-new-sale-summary-received]")?.textContent?.trim() || "R$ 0,00";
        if (confirmPending) confirmPending.textContent = page.querySelector("[data-new-sale-summary-pending]")?.textContent?.trim() || "R$ 0,00";
    }

    function updateProductsCount() {
        const productRows = getProductRows();

        if (productsEmptyRow) {
            productsEmptyRow.hidden = productRows.length > 0;
        }

        productsCount.textContent = `${productRows.length} itens adicionados`;
    }

    function updateProductButtonState() {
        productMinus.disabled = quantity <= 1;
        productQty.textContent = String(quantity);
        productAdd.disabled = !selectedProduct || parseCurrencyPtBr(productPrice.value) <= 0;
    }

    function renderClientResults(query) {
        const normalized = query.trim().toLowerCase();

        if (normalized.length < 3) {
            clientResults.hidden = true;
            clientResults.innerHTML = "";
            return;
        }

        const matches = clients.filter((client) => `${client.name} ${client.cpf} ${client.phone}`.toLowerCase().includes(normalized));

        if (!matches.length) {
            clientResults.innerHTML = '<div class="manual-product-result-empty">Nenhuma cliente encontrada.</div>';
            clientResults.hidden = false;
            return;
        }

        clientResults.innerHTML = matches.map((client) => `
            <button type="button" class="manual-product-result-item" data-new-sale-client-option="${client.cpf}">
                <strong>${client.name}</strong>
                <span>${client.cpf} • ${client.phone}</span>
            </button>
        `).join("");

        clientResults.hidden = false;

        clientResults.querySelectorAll("[data-new-sale-client-option]").forEach((button) => {
            button.addEventListener("click", () => {
                const chosen = clients.find((client) => client.cpf === button.dataset.newSaleClientOption);

                if (!chosen) {
                    return;
                }

                selectedClient = chosen;
                clientSearch.value = `${chosen.name} (${chosen.cpf})`;
                clientSelection.textContent = `Cliente selecionada: ${chosen.name} • ${chosen.phone}`;
                clientResults.hidden = true;
                clientResults.innerHTML = "";
                buildConfirmSummary();
            });
        });
    }

    function renderProductResults(query) {
        const normalized = query.trim().toLowerCase();

        if (normalized.length < 3) {
            productResults.hidden = true;
            productResults.innerHTML = "";
            return;
        }

        const matches = catalog.filter((product) => `${product.name} ${product.code}`.toLowerCase().includes(normalized));

        if (!matches.length) {
            productResults.innerHTML = '<div class="manual-product-result-empty">Nenhum produto encontrado.</div>';
            productResults.hidden = false;
            return;
        }

        productResults.innerHTML = matches.map((product) => `
            <button type="button" class="manual-product-result-item" data-new-sale-product-option="${product.code}">
                <strong>${product.name}</strong>
                <span>${product.code}</span>
            </button>
        `).join("");

        productResults.hidden = false;

        productResults.querySelectorAll("[data-new-sale-product-option]").forEach((button) => {
            button.addEventListener("click", () => {
                const chosen = catalog.find((product) => product.code === button.dataset.newSaleProductOption);

                if (!chosen) {
                    return;
                }

                selectedProduct = chosen;
                productSearch.value = `${chosen.name} (${chosen.code})`;
                productPrice.value = `R$ ${formatCurrencyPtBr(chosen.price)}`;
                productPrice.disabled = false;
                productResults.hidden = true;
                productResults.innerHTML = "";
                updateProductButtonState();
            });
        });
    }

    clientSearch.addEventListener("input", () => {
        selectedClient = null;
        clientSelection.textContent = "Nenhuma cliente selecionada.";
        renderClientResults(clientSearch.value);
        buildConfirmSummary();
    });

    productSearch.addEventListener("input", () => {
        selectedProduct = null;
        productPrice.value = "R$ 0,00";
        productPrice.disabled = true;
        renderProductResults(productSearch.value);
        updateProductButtonState();
    });

    productPrice.addEventListener("input", updateProductButtonState);
    saleDateInput?.addEventListener("input", () => {
        syncInstallmentRows();
        buildConfirmSummary();
    });
    saleTypeSelect?.addEventListener("change", buildConfirmSummary);
    paymentMethodSelect?.addEventListener("change", () => {
        syncInstallmentRows();
        buildConfirmSummary();
    });
    installmentsSelect?.addEventListener("change", () => {
        syncInstallmentRows();
        buildConfirmSummary();
    });
    paymentStatusSelect?.addEventListener("change", () => {
        syncPaymentStatus();
        buildConfirmSummary();
    });
    deliveryStatusSelect?.addEventListener("change", buildConfirmSummary);

    adjustmentRows.forEach((row) => {
        row.querySelectorAll("input").forEach((input) => {
            if (input.hasAttribute("data-adjustment-value")) {
                input.value = formatMoneyInputPtBr(input.value);
            }

            input.addEventListener("input", () => {
                if (input.hasAttribute("data-adjustment-value")) {
                    input.value = formatMoneyInputPtBr(input.value);
                }

                syncInstallmentRows();
                buildConfirmSummary();
            });
        });
    });

    productMinus.addEventListener("click", () => {
        quantity = Math.max(1, quantity - 1);
        updateProductButtonState();
    });

    productPlus.addEventListener("click", () => {
        quantity += 1;
        updateProductButtonState();
    });

    productAdd.addEventListener("click", () => {
        if (!selectedProduct) {
            return;
        }

        const price = parseCurrencyPtBr(productPrice.value);
        const total = price * quantity;

        productsHistory.insertAdjacentHTML("afterbegin", `
            <tr>
                <td><strong>${selectedProduct.name}</strong></td>
                <td>${selectedProduct.code}</td>
                <td>R$ ${formatCurrencyPtBr(price)}</td>
                <td><span class="order-qty-pill">${quantity}</span></td>
                <td class="products-total">R$ ${formatCurrencyPtBr(total)}</td>
                <td>
                    <button type="button" class="mk-order-row-delete" data-new-sale-delete="${selectedProduct.name}" aria-label="Excluir ${selectedProduct.name}">
                        <svg viewBox="0 0 256 256" aria-hidden="true"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM112,168a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm0-120H96V40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8Z"></path></svg>
                    </button>
                </td>
            </tr>
        `);

        selectedProduct = null;
        quantity = 1;
        productSearch.value = "";
        productPrice.value = "R$ 0,00";
        productPrice.disabled = true;
        updateProductButtonState();
        updateProductsCount();
        syncInstallmentRows();
        buildConfirmSummary();
    });

    document.addEventListener("click", (event) => {
        const deleteButton = event.target.closest("[data-new-sale-delete]");

        if (deleteButton) {
            const row = deleteButton.closest("tr");

            if (row) {
                openDeleteModal(row, deleteButton.dataset.newSaleDelete);
            }
        }

        if (!clientSearch.closest(".new-sale-lookup-field")?.contains(event.target)) {
            clientResults.hidden = true;
        }

        if (!productSearch.closest(".manual-product-search-shell")?.contains(event.target)) {
            productResults.hidden = true;
        }
    });

    deleteConfirm.addEventListener("click", () => {
        if (pendingDeleteRow) {
            pendingDeleteRow.remove();
            updateProductsCount();
            syncInstallmentRows();
            buildConfirmSummary();
        }

        closeDeleteModal();
    });

    deleteModal.querySelectorAll("[data-new-sale-delete-close]").forEach((button) => {
        button.addEventListener("click", closeDeleteModal);
    });

    confirmModal?.querySelectorAll("[data-new-sale-confirm-close]").forEach((button) => {
        button.addEventListener("click", closeConfirmModal);
    });

    saveOpenButton?.addEventListener("click", () => {
        buildConfirmSummary();
        confirmModal.hidden = false;
        document.body.classList.add("modal-open");
    });

    confirmApply?.addEventListener("click", () => {
        if (confirmApply.disabled) {
            return;
        }
        window.location.href = "./vendas.html";
    });

    installmentRows.forEach((row) => {
        const editButton = row.querySelector("[data-new-sale-installment-edit]");
        const dateView = row.querySelector('[data-installment-view="date"]');
        const valueView = row.querySelector('[data-installment-view="value"]');
        const paymentView = row.querySelector('[data-installment-view="payment"]');
        const dateInput = row.querySelector('[data-installment-input="date"]');
        const valueInput = row.querySelector('[data-installment-input="value"]');
        const paymentInput = row.querySelector('[data-installment-input="payment"]');

        if (!editButton || !dateView || !valueView || !paymentView || !dateInput || !valueInput || !paymentInput) {
            return;
        }

        const editIcon = '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM51.31,160l90.35-90.35,16.68,16.69L68,176.68ZM48,179.31,76.69,208H48Zm48,25.38L79.31,188l90.35-90.35h0l16.68,16.69Z"></path></svg>';
        const confirmIcon = '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M229.66,90.34l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,201.37,218.34,79a8,8,0,0,1,11.32,11.31Z"></path></svg>';

        editButton.addEventListener("click", () => {
            const isEditing = row.classList.toggle("is-editing");

            [dateView, valueView, paymentView].forEach((element) => {
                element.hidden = isEditing;
            });

            [dateInput, valueInput, paymentInput].forEach((element) => {
                element.hidden = !isEditing;
            });

            editButton.innerHTML = isEditing ? confirmIcon : editIcon;
            editButton.setAttribute("aria-label", isEditing ? "Confirmar edição da parcela" : "Editar parcela");

            if (isEditing) {
                const visibleRows = getVisibleInstallmentRows();
                const currentIndex = visibleRows.indexOf(row);
                const previousRow = currentIndex > 0 ? visibleRows[currentIndex - 1] : null;
                const nextRow = currentIndex < visibleRows.length - 1 ? visibleRows[currentIndex + 1] : null;
                const previousDate = previousRow?.querySelector('[data-installment-input="date"]')?.value
                    || toIsoDate(previousRow?.querySelector('[data-installment-view="date"]')?.textContent?.trim());
                const nextDate = nextRow?.querySelector('[data-installment-input="date"]')?.value
                    || toIsoDate(nextRow?.querySelector('[data-installment-view="date"]')?.textContent?.trim());

                dateInput.min = previousDate || saleDateInput?.value || "";
                dateInput.max = nextDate || "";
            } else {
                const validation = validateInstallmentDate(row, dateInput.value);

                if (!validation.valid) {
                    row.classList.add("is-editing");
                    [dateView, valueView, paymentView].forEach((element) => {
                        element.hidden = true;
                    });

                    [dateInput, valueInput, paymentInput].forEach((element) => {
                        element.hidden = false;
                    });

                    editButton.innerHTML = confirmIcon;
                    editButton.setAttribute("aria-label", "Confirmar edição da parcela");

                    window.alert(validation.message);
                    return;
                }

                const [year, month, day] = dateInput.value.split("-");

                if (year && month && day) {
                    dateView.textContent = `${day}/${month}/${year}`;
                }

                valueView.textContent = valueInput.value;
                paymentView.textContent = paymentInput.value;
                updateSummary();
                renderSidebarInstallments();
                buildConfirmSummary();
            }
        });

        const paidCheckbox = row.querySelector("[data-new-sale-installment-paid]");

        paidCheckbox?.addEventListener("change", () => {
            if (paymentStatusSelect?.value === "Pagamento Parcial") {
                const visibleRows = getVisibleInstallmentRows();
                const allChecked = visibleRows.every((visibleRow) => visibleRow.querySelector("[data-new-sale-installment-paid]")?.checked);

                if (allChecked) {
                    paidCheckbox.checked = false;
                }
            }

            updateSummary();
            renderSidebarInstallments();
            buildConfirmSummary();
        });
    });

    updateProductButtonState();
    updateProductsCount();
    syncInstallmentRows();
    buildConfirmSummary();
}

function setupProductStockModal() {
    const openButton = document.querySelector("[data-product-stock-open]");
    const stockDisplay = document.querySelector("[data-product-stock-current]");
    const stockModal = document.getElementById("product-stock-modal");
    const confirmModal = document.getElementById("product-stock-confirm-modal");
    const valueLabel = document.querySelector("[data-product-stock-value]");
    const increaseButton = document.querySelector("[data-product-stock-increase]");
    const decreaseButton = document.querySelector("[data-product-stock-decrease]");
    const confirmOpenButton = document.querySelector("[data-product-stock-confirm-open]");
    const confirmApplyButton = document.querySelector("[data-product-stock-apply]");
    const productTitle = document.querySelector(".product-detail-header h1");
    const fromLabel = document.querySelector("[data-product-stock-from]");
    const toLabel = document.querySelector("[data-product-stock-to]");
    const nameLabel = document.querySelector("[data-product-stock-name]");

    if (!openButton || !stockDisplay || !stockModal || !confirmModal || !valueLabel) {
        return;
    }

    let currentValue = Number(stockDisplay.dataset.target || 0);
    let nextValue = currentValue;

    function openModal(modal) {
        modal.hidden = false;
        document.body.classList.add("modal-open");
    }

    function closeModal(modal) {
        modal.hidden = true;
        if (!document.querySelector(".client-modal:not([hidden])")) {
            document.body.classList.remove("modal-open");
        }
    }

    function syncValue() {
        valueLabel.textContent = String(nextValue);

        if (confirmOpenButton) {
            confirmOpenButton.disabled = nextValue === currentValue;
        }
    }

    function refreshConfirmCopy() {
        if (fromLabel) {
            fromLabel.textContent = String(currentValue);
        }

        if (toLabel) {
            toLabel.textContent = String(nextValue);
        }

        if (nameLabel && productTitle) {
            nameLabel.textContent = productTitle.textContent.trim();
        }
    }

    openButton.addEventListener("click", () => {
        nextValue = currentValue;
        syncValue();
        openModal(stockModal);
    });

    increaseButton?.addEventListener("click", () => {
        nextValue += 1;
        syncValue();
    });

    decreaseButton?.addEventListener("click", () => {
        nextValue = Math.max(0, nextValue - 1);
        syncValue();
    });

    confirmOpenButton?.addEventListener("click", () => {
        refreshConfirmCopy();
        openModal(confirmModal);
    });

    confirmApplyButton?.addEventListener("click", () => {
        currentValue = nextValue;
        stockDisplay.dataset.target = String(currentValue);
        stockDisplay.textContent = `${currentValue} un`;
        closeModal(confirmModal);
        closeModal(stockModal);
    });

    stockModal.querySelectorAll("[data-product-stock-close]").forEach((button) => {
        button.addEventListener("click", () => closeModal(stockModal));
    });

    confirmModal.querySelectorAll("[data-product-stock-confirm-close]").forEach((button) => {
        button.addEventListener("click", () => closeModal(confirmModal));
    });
}

function setupSalesPage() {
    const page = document.querySelector("[data-sales-page]");

    if (!page) {
        return;
    }

    const periodButtons = Array.from(page.querySelectorAll("[data-sales-period]"));
    const chart = page.querySelector("[data-sales-chart]");
    const chartInfo = page.querySelector("[data-sales-chart-info]");
    const totalElement = page.querySelector("[data-sales-total]");
    const revenueElement = page.querySelector("[data-sales-revenue]");
    const goalPercentElement = page.querySelector("[data-sales-goal-percent]");
    const goalFillElement = page.querySelector("[data-sales-goal-fill]");
    const goalCurrentElement = page.querySelector("[data-sales-goal-current]");
    const goalTargetElement = page.querySelector("[data-sales-goal-target]");
    const ordersBody = page.querySelector("[data-sales-orders]");
    const footerElement = page.querySelector("[data-sales-footer]");
    const today = new Date();

    if (!periodButtons.length || !chart || !totalElement || !revenueElement || !goalPercentElement || !goalFillElement || !goalCurrentElement || !goalTargetElement || !ordersBody || !footerElement) {
        return;
    }

    const periods = {
        "7d": {
            total: 94,
            revenue: 8940,
            goalPercent: 61,
            goalCurrent: 8940,
            goalTarget: 14650,
            chartCount: 7,
            chartScale: 86,
            orders: [
                { date: "28 Abr, 2026", number: "#459821", client: "Mariana Silveira", value: 420, status: "Concluído", statusClass: "clients-status--active" },
                { date: "27 Abr, 2026", number: "#459818", client: "Clara Martins", value: 890, status: "Concluído", statusClass: "clients-status--active" },
                { date: "27 Abr, 2026", number: "#459814", client: "Paula Gomes", value: 315, status: "Pendente", statusClass: "sales-status--pending" },
                { date: "26 Abr, 2026", number: "#459802", client: "Lucas Mendes", value: 280, status: "Concluído", statusClass: "clients-status--active" }
            ],
            footer: "Mostrando 1-4 de 94 resultados"
        },
        "30d": {
            total: 452,
            revenue: 42150,
            goalPercent: 72,
            goalCurrent: 30348,
            goalTarget: 42150,
            chartCount: 30,
            chartScale: 98,
            orders: [
                { date: "14 Out, 2023", number: "#458921", client: "Mariana Silveira", value: 840, status: "Concluído", statusClass: "clients-status--active" },
                { date: "14 Out, 2023", number: "#458918", client: "Ricardo Alencar", value: 1250, status: "Pendente", statusClass: "sales-status--pending" },
                { date: "13 Out, 2023", number: "#458902", client: "Ana Beatriz Dias", value: 450, status: "Cancelado", statusClass: "clients-status--cancelled" },
                { date: "13 Out, 2023", number: "#458884", client: "Lucas Mendes", value: 299, status: "Concluído", statusClass: "clients-status--active" },
                { date: "12 Out, 2023", number: "#458861", client: "Clara Martins", value: 1100, status: "Concluído", statusClass: "clients-status--active" },
                { date: "12 Out, 2023", number: "#458844", client: "Hugo Pereira", value: 540, status: "Pendente", statusClass: "sales-status--pending" }
            ],
            footer: "Mostrando 1-20 de 184 resultados"
        },
        "90d": {
            total: 1186,
            revenue: 109380,
            goalPercent: 83,
            goalCurrent: 90785,
            goalTarget: 109380,
            chartCount: 90,
            chartScale: 104,
            orders: [
                { date: "26 Abr, 2026", number: "#459770", client: "Camila Costa", value: 960, status: "Concluído", statusClass: "clients-status--active" },
                { date: "24 Abr, 2026", number: "#459742", client: "Ana Paula Santos", value: 1380, status: "Pendente", statusClass: "sales-status--pending" },
                { date: "22 Abr, 2026", number: "#459730", client: "Renata Moura", value: 720, status: "Concluído", statusClass: "clients-status--active" },
                { date: "20 Abr, 2026", number: "#459701", client: "Priscila Nunes", value: 510, status: "Concluído", statusClass: "clients-status--active" },
                { date: "18 Abr, 2026", number: "#459689", client: "Helena Prado", value: 450, status: "Cancelado", statusClass: "clients-status--cancelled" },
                { date: "16 Abr, 2026", number: "#459660", client: "Juliana Reis", value: 1150, status: "Concluído", statusClass: "clients-status--active" }
            ],
            footer: "Mostrando 1-20 de 463 resultados"
        },
        "1y": {
            total: 4280,
            revenue: 398460,
            goalPercent: 91,
            goalCurrent: 362599,
            goalTarget: 398460,
            chartCount: 365,
            chartScale: 110,
            orders: [
                { date: "28 Abr, 2026", number: "#459821", client: "Mariana Silveira", value: 420, status: "Concluído", statusClass: "clients-status--active" },
                { date: "25 Abr, 2026", number: "#459805", client: "Camila Costa", value: 960, status: "Concluído", statusClass: "clients-status--active" },
                { date: "21 Abr, 2026", number: "#459777", client: "Helena Prado", value: 1380, status: "Pendente", statusClass: "sales-status--pending" },
                { date: "18 Abr, 2026", number: "#459744", client: "Priscila Nunes", value: 690, status: "Concluído", statusClass: "clients-status--active" },
                { date: "14 Abr, 2026", number: "#459701", client: "Juliana Reis", value: 1520, status: "Concluído", statusClass: "clients-status--active" },
                { date: "09 Abr, 2026", number: "#459662", client: "Ana Beatriz Dias", value: 480, status: "Cancelado", statusClass: "clients-status--cancelled" }
            ],
            footer: "Mostrando 1-20 de 1.284 resultados"
        },
        "all": {
            total: 8732,
            revenue: 812940,
            goalPercent: 94,
            goalCurrent: 764164,
            goalTarget: 812940,
            chartCount: 365,
            chartScale: 116,
            orders: [
                { date: "28 Abr, 2026", number: "#459821", client: "Mariana Silveira", value: 420, status: "Concluído", statusClass: "clients-status--active" },
                { date: "18 Jan, 2026", number: "#458915", client: "Camila Costa", value: 2210, status: "Concluído", statusClass: "clients-status--active" },
                { date: "07 Set, 2025", number: "#457802", client: "Lucas Mendes", value: 940, status: "Pendente", statusClass: "sales-status--pending" },
                { date: "12 Mar, 2025", number: "#456644", client: "Clara Martins", value: 1330, status: "Concluído", statusClass: "clients-status--active" },
                { date: "24 Nov, 2024", number: "#454281", client: "Juliana Reis", value: 760, status: "Cancelado", statusClass: "clients-status--cancelled" },
                { date: "14 Fev, 2024", number: "#451930", client: "Ana Paula Santos", value: 1180, status: "Concluído", statusClass: "clients-status--active" }
            ],
            footer: "Mostrando 1-20 de 8.732 resultados"
        }
    };

    function formatSalesLabel(date, periodKey, index, total) {
        if (periodKey === "7d") {
            return date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").slice(0, 3);
        }

        if (periodKey === "30d") {
            return index % 5 === 0 || index === total - 1
                ? String(date.getDate()).padStart(2, "0")
                : "";
        }

        if (periodKey === "90d") {
            return index % 15 === 0 || index === total - 1
                ? String(date.getDate()).padStart(2, "0")
                : "";
        }

        return date.getDate() === 1 || index === total - 1
            ? date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").slice(0, 3)
            : "";
    }

    function buildSalesSeries(count, scale, periodKey, totalRevenue) {
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - (count - 1));
        const rawItems = Array.from({ length: count }, (_, index) => {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + index);

            const base = (Math.sin((index + 1) * 0.68) + 1) / 2;
            const wave = (Math.cos((index + 1) * 0.21) + 1) / 2;
            const mixed = (base * 0.58) + (wave * 0.42);
            const value = Math.max(18, Math.round(16 + (mixed * (scale - 16))));

            return {
                label: formatSalesLabel(date, periodKey, index, count),
                value,
                dateLabel: formatShortDate(date)
            };
        });

        const totalWeight = rawItems.reduce((sum, item) => sum + item.value, 0) || 1;
        let allocatedRevenue = 0;

        return rawItems.map((item, index) => {
            const amount = index === rawItems.length - 1
                ? Math.max(0, totalRevenue - allocatedRevenue)
                : Math.round((item.value / totalWeight) * totalRevenue);

            allocatedRevenue += amount;

            return {
                ...item,
                amount
            };
        });
    }

    function formatShortDate(date) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = date.toLocaleDateString("pt-BR", { month: "short" })
            .replace(".", "")
            .split(" ")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");
        const year = String(date.getFullYear()).slice(-2);

        return `${day} ${month} ${year}`;
    }

    function updateChartInfo(amount, dateText) {
        if (!chartInfo) {
            return;
        }

        chartInfo.textContent = `R$ ${formatCurrencyPtBr(amount)} - ${dateText}`;
    }

    function renderChart(items) {
        chart.innerHTML = "";
        chart.style.gap = items.length > 180 ? "1px" : items.length > 60 ? "2px" : "3px";

        items.forEach((item, index) => {
            const group = document.createElement("div");
            group.className = "sales-chart-group";

            const bar = document.createElement("span");
            bar.className = `sales-chart-bar${index === items.length - 1 ? " is-strong" : ""}`;
            bar.style.height = "0px";
            bar.tabIndex = 0;
            bar.dataset.value = `R$ ${formatCurrencyPtBr(item.amount)}`;
            bar.setAttribute("aria-label", `R$ ${formatCurrencyPtBr(item.amount)} em ${item.dateLabel}`);

            const label = document.createElement("small");
            label.textContent = item.label;

            group.append(bar, label);
            chart.appendChild(group);

            bar.addEventListener("mouseenter", () => {
                updateChartInfo(item.amount, item.dateLabel);
            });

            bar.addEventListener("focus", () => {
                updateChartInfo(item.amount, item.dateLabel);
            });

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    bar.style.height = `${item.value}px`;
                });
            });
        });

        const lastItem = items[items.length - 1];

        if (lastItem) {
            updateChartInfo(lastItem.amount, lastItem.dateLabel);
        }
    }

    function renderOrders(items) {
        ordersBody.innerHTML = items.map((item) => `
            <tr class="sales-table-row" data-row-href="./pedido.html">
                <td>${item.date}</td>
                <td><strong class="sales-order-number">${item.number}</strong></td>
                <td>
                    <a class="sales-client-link" href="./cliente.html">
                        <img class="sales-client-avatar avatar-image" src="../src/assets/customers/default.webp" alt="Foto de ${item.client}">
                        <strong>${item.client}</strong>
                    </a>
                </td>
                <td>R$ ${formatCurrencyPtBr(item.value)}</td>
                <td><span class="clients-status ${item.statusClass}">${item.status}</span></td>
            </tr>
        `).join("");

        setupRowLinks();
    }

    function applyPeriod(key) {
        const period = periods[key] || periods["30d"];

        periodButtons.forEach((button) => {
            button.classList.toggle("is-active", button.dataset.salesPeriod === key);
        });

        renderChart(buildSalesSeries(period.chartCount, period.chartScale, key, period.revenue));
        totalElement.textContent = String(period.total);
        revenueElement.textContent = formatCurrencyPtBr(period.revenue);
        goalPercentElement.textContent = `${period.goalPercent}%`;
        goalCurrentElement.textContent = `R$ ${formatCurrencyPtBr(period.goalCurrent)}`;
        goalTargetElement.textContent = `R$ ${formatCurrencyPtBr(period.goalTarget)}`;
        goalFillElement.style.width = `${period.goalPercent}%`;
        renderOrders(period.orders);
        footerElement.textContent = period.footer;
    }

    periodButtons.forEach((button) => {
        button.addEventListener("click", () => applyPeriod(button.dataset.salesPeriod));
    });

    applyPeriod("30d");
}

function setupSalesFilters() {
    const wrap = document.querySelector("[data-sales-filters-wrap]");
    const toggle = document.querySelector("[data-sales-filters-toggle]");
    const panel = document.querySelector("[data-sales-filters-panel]");
    const clearButton = document.querySelector("[data-sales-filters-clear]");
    const checkAllButton = document.querySelector("[data-sales-filters-check-all]");
    const counter = document.querySelector("[data-sales-filters-counter]");

    if (!wrap || !toggle || !panel) {
        return;
    }

    const checkboxes = () => Array.from(panel.querySelectorAll("[data-sales-filter-checkbox]"));
    const radios = () => Array.from(panel.querySelectorAll("[data-sales-filter-radio]"));
    const radioGroups = () => Array.from(new Set(radios().map((input) => input.name)));
    const inputs = () => Array.from(panel.querySelectorAll("[data-sales-filter-input]"));

    function updateCounter() {
        if (!counter) {
            return;
        }

        const checkedCheckboxes = checkboxes().filter((checkbox) => checkbox.checked).length;
        const checkedRadios = radioGroups().reduce((total, groupName) => {
            return total + (panel.querySelector(`input[type="radio"][name="${groupName}"]:checked`) ? 1 : 0);
        }, 0);
        const totalFilters = checkboxes().length + radioGroups().length;
        const appliedFilters = checkedCheckboxes + checkedRadios;

        counter.textContent = `${appliedFilters}/${totalFilters} filtros aplicados`;
    }

    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");

    toggle.addEventListener("click", () => {
        const shouldOpen = panel.hidden;
        panel.hidden = !shouldOpen;
        toggle.setAttribute("aria-expanded", String(shouldOpen));
        wrap.classList.toggle("is-expanded", shouldOpen);
    });

    checkboxes().forEach((checkbox) => checkbox.addEventListener("change", updateCounter));
    radios().forEach((radio) => radio.addEventListener("change", updateCounter));
    inputs().forEach((input) => {
        input.addEventListener("input", updateCounter);
        input.addEventListener("change", updateCounter);
    });

    clearButton?.addEventListener("click", () => {
        checkboxes().forEach((checkbox) => {
            checkbox.checked = false;
        });

        radioGroups().forEach((groupName) => {
            const defaultRadio = radios().find((radio) => radio.name === groupName);

            if (defaultRadio) {
                defaultRadio.checked = true;
            }
        });

        inputs().forEach((input) => {
            input.value = "";
        });

        updateCounter();
    });

    checkAllButton?.addEventListener("click", () => {
        checkboxes().forEach((checkbox) => {
            checkbox.checked = true;
        });

        radioGroups().forEach((groupName) => {
            const defaultRadio = radios().find((radio) => radio.name === groupName);

            if (defaultRadio) {
                defaultRadio.checked = true;
            }
        });

        updateCounter();
    });

    updateCounter();
}

function setupMkOrdersFilters() {
    const wrap = document.querySelector("[data-mk-filters-wrap]");
    const toggle = document.querySelector("[data-mk-filters-toggle]");
    const panel = document.querySelector("[data-mk-filters-panel]");
    const clearButton = document.querySelector("[data-mk-filters-clear]");
    const counter = document.querySelector("[data-mk-filters-counter]");

    if (!wrap || !toggle || !panel) {
        return;
    }

    const inputs = () => Array.from(panel.querySelectorAll("input"));

    function updateCounter() {
        if (!counter) {
            return;
        }

        const allInputs = inputs();
        const filledCount = allInputs.filter((input) => input.value.trim() !== "").length;
        counter.textContent = `${filledCount}/${allInputs.length} filtros aplicados`;
    }

    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");

    toggle.addEventListener("click", () => {
        const shouldOpen = panel.hidden;
        panel.hidden = !shouldOpen;
        toggle.setAttribute("aria-expanded", String(shouldOpen));
        wrap.classList.toggle("is-expanded", shouldOpen);
    });

    inputs().forEach((input) => {
        input.addEventListener("input", updateCounter);
        input.addEventListener("change", updateCounter);
    });

    clearButton?.addEventListener("click", () => {
        inputs().forEach((input) => {
            input.value = "";
        });
        updateCounter();
    });

    updateCounter();
}

function setupMkOrderSortMenu() {
    const sortWrap = document.querySelector("[data-mk-order-sort]");
    const sortToggle = document.querySelector("[data-mk-order-sort-toggle]");
    const sortMenu = document.querySelector("[data-mk-order-sort-menu]");

    if (!sortWrap || !sortToggle || !sortMenu) {
        return;
    }

    sortMenu.hidden = true;
    sortToggle.setAttribute("aria-expanded", "false");

    function closeSortMenu() {
        sortMenu.hidden = true;
        sortToggle.setAttribute("aria-expanded", "false");
    }

    sortToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        const shouldOpen = sortMenu.hidden;
        sortMenu.hidden = !shouldOpen;
        sortToggle.setAttribute("aria-expanded", String(shouldOpen));
    });

    sortMenu.querySelectorAll(".client-history-sort-option").forEach((option) => {
        option.addEventListener("click", () => {
            closeSortMenu();
        });
    });

    document.addEventListener("click", (event) => {
        if (!sortWrap.contains(event.target)) {
            closeSortMenu();
        }
    });
}

function setupMkOrderActions() {
    const actionsWrap = document.querySelector("[data-mk-order-actions]");
    const optionsWrap = document.querySelector("[data-mk-order-options]");
    const optionsToggle = document.querySelector("[data-mk-order-options-toggle]");
    const optionsMenu = document.querySelector("[data-mk-order-options-menu]");
    const exportButton = document.querySelector("[data-mk-order-export]");
    const deleteOpenButton = document.querySelector("[data-mk-order-delete-open]");
    const confirmButton = document.querySelector("[data-mk-order-confirm]");
    const deleteModal = document.getElementById("mk-order-delete-modal");
    const deleteConfirm = deleteModal?.querySelector("[data-mk-order-delete-confirm]");

    if (!actionsWrap || !optionsWrap || !optionsToggle || !optionsMenu || !exportButton || !deleteOpenButton || !confirmButton || !deleteModal || !deleteConfirm) {
        return;
    }

    function closeOptionsMenu() {
        optionsMenu.hidden = true;
        optionsToggle.setAttribute("aria-expanded", "false");
    }

    function openDeleteModal() {
        deleteModal.hidden = false;
        document.body.classList.add("modal-open");
    }

    function closeDeleteModal() {
        deleteModal.hidden = true;
        if (!document.querySelector(".client-modal:not([hidden])")) {
            document.body.classList.remove("modal-open");
        }
    }

    optionsToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        const shouldOpen = optionsMenu.hidden;
        optionsMenu.hidden = !shouldOpen;
        optionsToggle.setAttribute("aria-expanded", String(shouldOpen));
    });

    exportButton.addEventListener("click", () => {
        const fileContent = [
            "Pedido MK #458921",
            "Data do pedido: 25/04/2026",
            "",
            "Itens:",
            "MK-445821 | Kit TimeWise Repair Volu-Firm | 2 un | R$ 499,80",
            "MK-772145 | Sérum C+E TimeWise | 3 un | R$ 539,70",
            "MK-228940 | Batom Gel Semi-Matte Rosé | 4 un | R$ 199,20",
            "MK-390512 | Loção Corporal Satin Body | 2 un | R$ 46,20"
        ].join("\n");

        const blob = new Blob([fileContent], { type: "application/pdf" });
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = "pedido-mk-458921.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(objectUrl);
        closeOptionsMenu();
    });

    deleteOpenButton.addEventListener("click", () => {
        closeOptionsMenu();
        openDeleteModal();
    });

    confirmButton.addEventListener("click", () => {
        window.location.href = "./pedidos-mk.html";
    });

    deleteConfirm.addEventListener("click", () => {
        window.location.href = "./pedidos-mk.html";
    });

    deleteModal.querySelectorAll("[data-mk-order-delete-close]").forEach((button) => {
        button.addEventListener("click", closeDeleteModal);
    });

    document.addEventListener("click", (event) => {
        if (!optionsWrap.contains(event.target)) {
            closeOptionsMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeOptionsMenu();
            closeDeleteModal();
        }
    });
}

function setupMkOrderBuilder() {
    const builder = document.querySelector("[data-mk-builder]");

    if (!builder) {
        return;
    }

    const rows = Array.from(builder.querySelectorAll("[data-mk-builder-row]"));
    const summaryList = builder.querySelector("[data-mk-summary-list]");
    const summaryEmpty = builder.querySelector("[data-mk-summary-empty]");
    const totalElement = builder.querySelector("[data-mk-summary-total]");
    const pointsElement = builder.querySelector("[data-mk-summary-points]");
    const deleteModal = document.querySelector("#mk-builder-delete-modal");
    const deleteName = deleteModal?.querySelector("[data-mk-builder-delete-name]");
    const deleteConfirm = deleteModal?.querySelector("[data-mk-builder-delete-confirm]");
    let pendingDeleteRow = null;

    if (!summaryList || !summaryEmpty || !totalElement || !pointsElement) {
        return;
    }

    function openDeleteModal(row) {
        if (!deleteModal || !deleteName) {
            row.hidden = true;
            return;
        }

        pendingDeleteRow = row;
        deleteName.textContent = row.dataset.name || "produto";
        deleteModal.hidden = false;
        document.body.classList.add("modal-open");
    }

    function closeDeleteModal() {
        if (!deleteModal) {
            return;
        }

        deleteModal.hidden = true;
        pendingDeleteRow = null;
        document.body.classList.remove("modal-open");
    }

    function parseCurrency(value) {
        return Number(value || 0);
    }

    function formatMoney(value) {
        return value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    function renderSummary() {
        let totalValue = 0;
        let totalPoints = 0;
        summaryList.innerHTML = "";

        rows.forEach((row) => {
            const qty = Number(row.dataset.qty || 0);
            const price = parseCurrency(row.dataset.price);
            const points = Number(row.dataset.points || 0);
            const added = row.dataset.added === "true";
            const addButton = row.querySelector("[data-mk-add-item]");

            addButton?.classList.toggle("is-active", added);

            if (!added || qty <= 0) {
                return;
            }

            totalValue += price * qty;
            totalPoints += points * qty;

            const item = document.createElement("div");
            item.className = "mk-builder-summary-item";
            item.innerHTML = `
                <div class="mk-builder-summary-item-top">
                    <div>
                        <strong>${row.dataset.name}</strong>
                        <span>${row.dataset.code}</span>
                    </div>
                    <div class="mk-builder-summary-item-side">
                        <strong>${formatMoney(price * qty)}</strong>
                        <button type="button" class="mk-builder-summary-remove" data-mk-summary-remove="${row.dataset.code}" aria-label="Excluir da lista final">
                            <svg viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM112,168a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm0-120H96V40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8Z"></path></svg>
                        </button>
                    </div>
                </div>
                <div class="mk-builder-summary-metrics">
                    <span>${qty} un x ${formatMoney(price)}</span>
                    <span>${points * qty} pts</span>
                </div>
            `;
            summaryList.appendChild(item);
        });

        summaryEmpty.hidden = summaryList.children.length > 0;
        totalElement.textContent = formatMoney(totalValue);
        pointsElement.textContent = `${totalPoints} pts`;
    }

    summaryList.addEventListener("click", (event) => {
        const button = event.target.closest("[data-mk-summary-remove]");

        if (!button) {
            return;
        }

        const row = rows.find((item) => item.dataset.code === button.dataset.mkSummaryRemove);

        if (!row) {
            return;
        }

        row.dataset.added = "false";
        row.hidden = false;
        renderSummary();
    });

    rows.forEach((row) => {
        const minusButton = row.querySelector("[data-mk-qty-minus]");
        const plusButton = row.querySelector("[data-mk-qty-plus]");
        const resetButton = row.querySelector("[data-mk-qty-reset]");
        const valueElement = row.querySelector("[data-mk-qty-value]");
        const addButton = row.querySelector("[data-mk-add-item]");
        const removeButton = row.querySelector("[data-mk-remove-item]");

        function syncValue() {
            valueElement.textContent = row.dataset.qty;
        }

        minusButton?.addEventListener("click", () => {
            const current = Number(row.dataset.qty || 0);
            row.dataset.qty = String(Math.max(1, current - 1));
            syncValue();
        });

        plusButton?.addEventListener("click", () => {
            const current = Number(row.dataset.qty || 0);
            row.dataset.qty = String(current + 1);
            syncValue();
        });

        resetButton?.addEventListener("click", () => {
            row.dataset.qty = row.dataset.initialQty || "1";
            syncValue();
        });

        addButton?.addEventListener("click", () => {
            row.dataset.added = "true";
            row.hidden = true;
            renderSummary();
        });

        removeButton?.addEventListener("click", () => {
            openDeleteModal(row);
        });
    });

    deleteConfirm?.addEventListener("click", () => {
        if (!pendingDeleteRow) {
            closeDeleteModal();
            return;
        }

        pendingDeleteRow.dataset.added = "false";
        pendingDeleteRow.hidden = true;
        closeDeleteModal();
        renderSummary();
    });

    deleteModal?.querySelectorAll("[data-mk-builder-delete-close]").forEach((button) => {
        button.addEventListener("click", () => {
            closeDeleteModal();
        });
    });

    renderSummary();
}

function setupFinancePage() {
    const page = document.querySelector("[data-finance-page]");

    if (!page) {
        return;
    }

    const periodButtons = Array.from(page.querySelectorAll("[data-finance-period]"));
    const performanceTitle = page.querySelector("[data-finance-performance-title]");
    const performanceValue = page.querySelector("[data-finance-performance-value]");
    const performanceDelta = page.querySelector("[data-finance-performance-delta]");
    const performanceInfo = page.querySelector("[data-finance-performance-info]");
    const performanceChart = page.querySelector("[data-finance-performance-chart]");
    const seriesToggles = Array.from(page.querySelectorAll("[data-finance-series-toggle]"));
    const delinquencyPill = page.querySelector("[data-finance-delinquency-pill]");
    const delinquencyIcon = page.querySelector("[data-finance-delinquency-icon]");
    const delinquencyValue = page.querySelector("[data-finance-delinquency-value]");
    const delinquencyMessage = page.querySelector("[data-finance-delinquency-message]");
    const debtorsLink = page.querySelector("[data-finance-debtors-link]");
    const paymentDonut = page.querySelector("[data-finance-payment-donut]");
    const paymentPix = page.querySelector("[data-finance-payment-pix]");
    const paymentCredit = page.querySelector("[data-finance-payment-credit]");
    const paymentDebit = page.querySelector("[data-finance-payment-debit]");
    const paymentOther = page.querySelector("[data-finance-payment-other]");
    const receivedValue = page.querySelector("[data-finance-received-value]");
    const pendingValue = page.querySelector("[data-finance-pending-value]");
    const receivedTrack = page.querySelector("[data-finance-received-track]");
    const pendingTrack = page.querySelector("[data-finance-pending-track]");
    const today = new Date(2026, 3, 29);

    if (!periodButtons.length || !performanceTitle || !performanceValue || !performanceDelta || !performanceInfo || !performanceChart || !seriesToggles.length || !delinquencyPill || !delinquencyIcon || !delinquencyValue || !delinquencyMessage || !debtorsLink || !paymentDonut || !paymentPix || !paymentCredit || !paymentDebit || !paymentOther || !receivedValue || !pendingValue || !receivedTrack || !pendingTrack) {
        return;
    }

    const activeSeries = new Set(["gain", "cost"]);
    let currentFinancePeriodKey = "30d";

    const periods = {
        "7d": {
            title: "Performance Semanal",
            delta: "+8.4%",
            gainTotal: 9840,
            costTotal: 2680,
            sourceDays: 7,
            delinquency: { amount: 0, count: 0 },
            payments: { pix: 52, credit: 24, debit: 16, other: 8 },
            receivables: { received: 9840, pending: 2140 }
        },
        "30d": {
            title: "Performance Mensal",
            delta: "+12.5%",
            gainTotal: 42850,
            costTotal: 16320,
            sourceDays: 30,
            delinquency: { amount: 3120, count: 12 },
            payments: { pix: 45, credit: 25, debit: 20, other: 10 },
            receivables: { received: 28400, pending: 11200 }
        },
        "90d": {
            title: "Performance Trimestral",
            delta: "+16.2%",
            gainTotal: 126430,
            costTotal: 48180,
            sourceDays: 90,
            delinquency: { amount: 5690, count: 21 },
            payments: { pix: 43, credit: 31, debit: 17, other: 9 },
            receivables: { received: 96200, pending: 30230 }
        },
        "6m": {
            title: "Performance Semestral",
            delta: "+19.1%",
            gainTotal: 248670,
            costTotal: 90340,
            sourceDays: 180,
            delinquency: { amount: 7420, count: 28 },
            payments: { pix: 40, credit: 34, debit: 18, other: 8 },
            receivables: { received: 189420, pending: 59250 }
        },
        "1y": {
            title: "Performance Anual",
            delta: "+23.7%",
            gainTotal: 482960,
            costTotal: 178220,
            sourceDays: 365,
            delinquency: { amount: 9840, count: 36 },
            payments: { pix: 38, credit: 37, debit: 17, other: 8 },
            receivables: { received: 398460, pending: 84490 }
        },
        "all": {
            title: "Performance Total",
            delta: "+31.4%",
            gainTotal: 913840,
            costTotal: 341590,
            sourceDays: 900,
            delinquency: { amount: 11860, count: 42 },
            payments: { pix: 39, credit: 35, debit: 17, other: 9 },
            receivables: { received: 764280, pending: 149560 }
        }
    };

    function formatShortDate(date) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
        const year = String(date.getFullYear()).slice(-2);
        return `${day} ${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
    }

    function formatMonthShort(date) {
        return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").slice(0, 3);
    }

    function formatMonthYearShort(date) {
        const month = formatMonthShort(date);
        const year = String(date.getFullYear()).slice(-2);
        return `${month} ${year}`;
    }

    function formatRangeLabel(startDate, endDate) {
        const startDay = String(startDate.getDate()).padStart(2, "0");
        const endDay = String(endDate.getDate()).padStart(2, "0");
        const startMonth = formatMonthShort(startDate);
        const endMonth = formatMonthShort(endDate);

        if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
            return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
        }

        return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
    }

    function allocateTotals(weights, total) {
        const weightSum = weights.reduce((sum, value) => sum + value, 0) || 1;
        let allocated = 0;

        return weights.map((weight, index) => {
            const amount = index === weights.length - 1
                ? Math.max(0, total - allocated)
                : Math.round((weight / weightSum) * total);

            allocated += amount;
            return amount;
        });
    }

    function buildFinanceSeries(sourceDays, periodKey, gainTotal, costTotal) {
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - (sourceDays - 1));

        const rawItems = Array.from({ length: sourceDays }, (_, index) => {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + index);

            const gainWeight = Math.max(
                14,
                Math.round(18 + (((Math.sin((index + 1) * 0.68) + 1) / 2) * 92) + (((Math.cos((index + 1) * 0.19) + 1) / 2) * 28))
            );
            const costWeight = Math.max(
                10,
                Math.round(12 + (((Math.cos((index + 1) * 0.51) + 1) / 2) * 70) + (((Math.sin((index + 3) * 0.17) + 1) / 2) * 20))
            );

            return {
                date,
                label: periodKey === "7d"
                    ? date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").slice(0, 3)
                    : periodKey === "30d"
                        ? String(date.getDate()).padStart(2, "0")
                        : "",
                dateLabel: formatShortDate(date),
                gainWeight,
                costWeight
            };
        });

        const gainAmounts = allocateTotals(rawItems.map((item) => item.gainWeight), gainTotal);
        const costAmounts = allocateTotals(rawItems.map((item) => item.costWeight), costTotal);

        const hydratedItems = rawItems.map((item, index) => ({
            ...item,
            gainAmount: gainAmounts[index],
            costAmount: costAmounts[index]
        }));

        let buckets = [];

        if (periodKey === "7d" || periodKey === "30d") {
            buckets = hydratedItems.map((item) => ({
                ...item
            }));
        } else if (periodKey === "90d") {
            for (let start = 0; start < hydratedItems.length; start += 15) {
                const slice = hydratedItems.slice(start, start + 15);

                if (!slice.length) {
                    continue;
                }

                const firstItem = slice[0];
                const lastItem = slice[slice.length - 1];

                buckets.push({
                    date: lastItem.date,
                    dateLabel: formatRangeLabel(firstItem.date, lastItem.date),
                    label: formatRangeLabel(firstItem.date, lastItem.date),
                    gainAmount: slice.reduce((sum, item) => sum + item.gainAmount, 0),
                    costAmount: slice.reduce((sum, item) => sum + item.costAmount, 0),
                    gainWeight: slice.reduce((sum, item) => sum + item.gainWeight, 0),
                    costWeight: slice.reduce((sum, item) => sum + item.costWeight, 0)
                });
            }
        } else {
            const monthBuckets = [];
            let currentBucket = null;

            hydratedItems.forEach((item) => {
                const monthKey = `${item.date.getFullYear()}-${item.date.getMonth()}`;

                if (!currentBucket || currentBucket.key !== monthKey) {
                    currentBucket = {
                        key: monthKey,
                        startDate: item.date,
                        endDate: item.date,
                        gainAmount: 0,
                        costAmount: 0,
                        gainWeight: 0,
                        costWeight: 0
                    };
                    monthBuckets.push(currentBucket);
                }

                currentBucket.endDate = item.date;
                currentBucket.gainAmount += item.gainAmount;
                currentBucket.costAmount += item.costAmount;
                currentBucket.gainWeight += item.gainWeight;
                currentBucket.costWeight += item.costWeight;
            });

            if (periodKey === "6m" || periodKey === "1y") {
                buckets = monthBuckets.map((bucket) => ({
                    date: bucket.endDate,
                    dateLabel: formatMonthYearShort(bucket.endDate),
                    label: formatMonthShort(bucket.endDate),
                    gainAmount: bucket.gainAmount,
                    costAmount: bucket.costAmount,
                    gainWeight: bucket.gainWeight,
                    costWeight: bucket.costWeight
                }));
            } else {
                if (monthBuckets.length <= 24) {
                    buckets = monthBuckets.map((bucket) => ({
                        date: bucket.endDate,
                        dateLabel: formatMonthYearShort(bucket.endDate),
                        label: formatMonthYearShort(bucket.endDate),
                        gainAmount: bucket.gainAmount,
                        costAmount: bucket.costAmount,
                        gainWeight: bucket.gainWeight,
                        costWeight: bucket.costWeight
                    }));
                } else {
                    for (let index = 0; index < monthBuckets.length; index += 2) {
                        const firstBucket = monthBuckets[index];
                        const secondBucket = monthBuckets[index + 1];

                        if (!secondBucket) {
                            buckets.push({
                                date: firstBucket.endDate,
                                dateLabel: formatMonthYearShort(firstBucket.endDate),
                                label: formatMonthYearShort(firstBucket.endDate),
                                gainAmount: firstBucket.gainAmount,
                                costAmount: firstBucket.costAmount,
                                gainWeight: firstBucket.gainWeight,
                                costWeight: firstBucket.costWeight
                            });
                            continue;
                        }

                        buckets.push({
                            date: secondBucket.endDate,
                            dateLabel: `${formatMonthYearShort(firstBucket.endDate)} - ${formatMonthYearShort(secondBucket.endDate)}`,
                            label: `${formatMonthShort(firstBucket.endDate)} - ${formatMonthShort(secondBucket.endDate)} ${String(secondBucket.endDate.getFullYear()).slice(-2)}`,
                            gainAmount: firstBucket.gainAmount + secondBucket.gainAmount,
                            costAmount: firstBucket.costAmount + secondBucket.costAmount,
                            gainWeight: firstBucket.gainWeight + secondBucket.gainWeight,
                            costWeight: firstBucket.costWeight + secondBucket.costWeight
                        });
                    }
                }
            }
        }

        const gainMax = Math.max(...buckets.map((item) => item.gainWeight), 1);
        const costMax = Math.max(...buckets.map((item) => item.costWeight), 1);

        return buckets.map((item) => ({
            ...item,
            gainHeight: Math.round((item.gainWeight / gainMax) * 170),
            costHeight: Math.round((item.costWeight / costMax) * 145)
        }));
    }

    function updatePerformanceHeadline(amount, typeLabel, dateLabel) {
        performanceValue.textContent = formatCurrencyPtBr(amount);
        performanceInfo.textContent = `${typeLabel} - ${dateLabel}`;
    }

    function syncFinanceLegend() {
        seriesToggles.forEach((button) => {
            const isActive = activeSeries.has(button.dataset.financeSeriesToggle);
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
    }

    function renderPerformanceChart(items) {
        performanceChart.innerHTML = "";
        performanceChart.style.gap = "10px";

        const plot = document.createElement("div");
        plot.className = "finance-line-plot";

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 100 200");
        svg.setAttribute("preserveAspectRatio", "none");
        svg.classList.add("finance-line-svg");

        const xStart = 4;
        const xEnd = 96;
        const yBase = 186;
        const gainPoints = [];
        const costPoints = [];

        items.forEach((item, index) => {
            const x = items.length === 1 ? 50 : xStart + ((index / (items.length - 1)) * (xEnd - xStart));
            const gainY = yBase - item.gainHeight;
            const costY = yBase - item.costHeight;

            if (activeSeries.has("gain")) {
                gainPoints.push(`${x},${gainY}`);

                const gainDot = document.createElement("button");
                gainDot.type = "button";
                gainDot.className = `finance-line-point finance-line-point--gain${index === items.length - 1 ? " is-strong" : ""}`;
                gainDot.style.left = `${x}%`;
                gainDot.style.top = `${(gainY / 200) * 100}%`;
                gainDot.dataset.value = `R$ ${formatCurrencyPtBr(item.gainAmount)}`;
                gainDot.setAttribute("aria-label", `Ganhos de R$ ${formatCurrencyPtBr(item.gainAmount)} em ${item.dateLabel}`);
                gainDot.addEventListener("mouseenter", () => updatePerformanceHeadline(item.gainAmount, "Ganhos", item.dateLabel));
                gainDot.addEventListener("focus", () => updatePerformanceHeadline(item.gainAmount, "Ganhos", item.dateLabel));
                plot.appendChild(gainDot);
            }

            if (activeSeries.has("cost")) {
                costPoints.push(`${x},${costY}`);

                const costDot = document.createElement("button");
                costDot.type = "button";
                costDot.className = "finance-line-point finance-line-point--cost";
                costDot.style.left = `${x}%`;
                costDot.style.top = `${(costY / 200) * 100}%`;
                costDot.dataset.value = `R$ ${formatCurrencyPtBr(item.costAmount)}`;
                costDot.setAttribute("aria-label", `Custos de R$ ${formatCurrencyPtBr(item.costAmount)} em ${item.dateLabel}`);
                costDot.addEventListener("mouseenter", () => updatePerformanceHeadline(item.costAmount, "Custos", item.dateLabel));
                costDot.addEventListener("focus", () => updatePerformanceHeadline(item.costAmount, "Custos", item.dateLabel));
                plot.appendChild(costDot);
            }
        });

        if (gainPoints.length > 1) {
            const gainPath = document.createElementNS(svgNS, "polyline");
            gainPath.classList.add("finance-line-path", "finance-line-path--gain");
            gainPath.setAttribute("points", gainPoints.join(" "));
            svg.appendChild(gainPath);
        }

        if (costPoints.length > 1) {
            const costPath = document.createElementNS(svgNS, "polyline");
            costPath.classList.add("finance-line-path", "finance-line-path--cost");
            costPath.setAttribute("points", costPoints.join(" "));
            svg.appendChild(costPath);
        }

        plot.prepend(svg);

        const labels = document.createElement("div");
        labels.className = "finance-line-labels";

        items.forEach((item, index) => {
            const label = document.createElement("small");
            label.textContent = item.label;
            if (index === items.length - 1) {
                label.classList.add("is-current");
            }
            labels.appendChild(label);
        });

        performanceChart.append(plot, labels);

        const lastItem = items[items.length - 1];

        if (lastItem) {
            if (activeSeries.has("gain")) {
                updatePerformanceHeadline(lastItem.gainAmount, "Ganhos", lastItem.dateLabel);
            } else if (activeSeries.has("cost")) {
                updatePerformanceHeadline(lastItem.costAmount, "Custos", lastItem.dateLabel);
            }
        }
    }

    function updateDelinquency(period) {
        const hasDelinquency = period.delinquency.amount > 0 && period.delinquency.count > 0;

        if (hasDelinquency) {
            delinquencyValue.classList.remove("finance-delinquency-value--text");
            delinquencyPill.textContent = "Alerta Crítico";
            delinquencyPill.style.background = "";
            delinquencyPill.style.color = "";
            delinquencyIcon.classList.remove("is-success");
            delinquencyIcon.innerHTML = '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M236.8,188.09,149.35,36.07a24,24,0,0,0-42.7,0L19.2,188.09A24,24,0,0,0,40,224H216a24,24,0,0,0,20.8-35.91ZM120,108a8,8,0,0,1,16,0v36a8,8,0,0,1-16,0Zm8,76a12,12,0,1,1,12-12A12,12,0,0,1,128,184Z"></path></svg>';
            delinquencyValue.innerHTML = `<span class="product-money-currency">R$</span><span>${formatCurrencyPtBr(period.delinquency.amount)}</span>`;
            delinquencyMessage.textContent = `${period.delinquency.count} pagamentos em atraso`;
            debtorsLink.hidden = false;
            return;
        }

        delinquencyPill.textContent = "Tudo em Dia";
        delinquencyPill.style.background = "#e8fbf2";
        delinquencyPill.style.color = "#17996b";
        delinquencyIcon.classList.add("is-success");
        delinquencyValue.classList.add("finance-delinquency-value--text");
        delinquencyIcon.innerHTML = '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M229.66,90.34l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,201.37,218.34,79a8,8,0,0,1,11.32,11.32Z"></path></svg>';
        delinquencyValue.textContent = "Tudo em dia";
        delinquencyMessage.textContent = "Nenhuma inadimplência no período selecionado";
        debtorsLink.hidden = true;
    }

    function updatePaymentMethods(period) {
        const pix = period.payments.pix;
        const credit = period.payments.credit;
        const debit = period.payments.debit;
        const other = period.payments.other;
        const firstStop = pix;
        const secondStop = pix + credit;
        const thirdStop = secondStop + debit;

        paymentDonut.style.background = `conic-gradient(var(--pink) 0 ${firstStop}%, var(--pink-dark) ${firstStop}% ${secondStop}%, #ffdbe9 ${secondStop}% ${thirdStop}%, #dedde1 ${thirdStop}% 100%)`;
        paymentPix.textContent = `${pix}%`;
        paymentCredit.textContent = `${credit}%`;
        paymentDebit.textContent = `${debit}%`;
        paymentOther.textContent = `${other}%`;
    }

    function updateReceivables(period) {
        const received = period.receivables.received;
        const pending = period.receivables.pending;
        const maxValue = Math.max(received, pending, 1);
        const receivedPercent = Math.max(18, Math.round((received / maxValue) * 100));
        const pendingPercent = Math.max(18, Math.round((pending / maxValue) * 100));

        receivedValue.textContent = `R$ ${formatCurrencyPtBr(received)}`;
        pendingValue.textContent = `R$ ${formatCurrencyPtBr(pending)}`;
        receivedTrack.style.width = `${Math.min(receivedPercent, 100)}%`;
        pendingTrack.style.width = `${Math.min(pendingPercent, 100)}%`;
    }

    function applyPeriod(key) {
        currentFinancePeriodKey = key;
        const period = periods[key] || periods["30d"];
        const performanceSeries = buildFinanceSeries(period.sourceDays, key, period.gainTotal, period.costTotal);

        periodButtons.forEach((button) => {
            button.classList.toggle("is-active", button.dataset.financePeriod === key);
        });

        performanceTitle.textContent = period.title;
        performanceValue.textContent = formatCurrencyPtBr(period.gainTotal);
        performanceDelta.textContent = period.delta;
        renderPerformanceChart(performanceSeries);
        updateDelinquency(period);
        updatePaymentMethods(period);
        updateReceivables(period);
    }

    periodButtons.forEach((button) => {
        button.addEventListener("click", () => {
            applyPeriod(button.dataset.financePeriod);
        });
    });

    seriesToggles.forEach((button) => {
        button.addEventListener("click", () => {
            const type = button.dataset.financeSeriesToggle;

            if (activeSeries.has(type) && activeSeries.size === 1) {
                return;
            }

            if (activeSeries.has(type)) {
                activeSeries.delete(type);
            } else {
                activeSeries.add(type);
            }

            syncFinanceLegend();
            applyPeriod(currentFinancePeriodKey);
        });
    });

    syncFinanceLegend();
    applyPeriod("30d");
}

function setupFinanceGainModal() {
    const movementModal = document.getElementById("finance-movement-modal");
    const gainModal = document.getElementById("finance-gain-modal");
    const gainTrigger = movementModal?.querySelector('[data-modal-target="finance-gain-modal"]');
    const gainForm = gainModal?.querySelector("[data-finance-gain-form]");
    const moneyInput = gainModal?.querySelector("[data-finance-gain-money]");
    const gainTitle = gainModal?.querySelector("[data-finance-gain-title]");
    const gainSubmit = gainModal?.querySelector("[data-finance-gain-submit]");
    const gainAlert = gainModal?.querySelector("[data-finance-gain-alert]");
    const costModal = document.getElementById("finance-cost-modal");
    const costTrigger = movementModal?.querySelector('[data-modal-target="finance-cost-modal"]');
    const costForm = costModal?.querySelector("[data-finance-cost-form]");
    const costMoneyInput = costModal?.querySelector("[data-finance-cost-money]");
    const costTitle = costModal?.querySelector("[data-finance-cost-title]");
    const costSubmit = costModal?.querySelector("[data-finance-cost-submit]");
    let editingRow = null;
    let editingType = "";

    if (!movementModal || !gainModal || !gainTrigger || !gainForm || !moneyInput || !costModal || !costTrigger || !costForm || !costMoneyInput) {
        return;
    }

    function closeModal(modal) {
        modal.hidden = true;
        const anyOpen = document.querySelector(".client-modal:not([hidden])");
        document.body.classList.toggle("modal-open", Boolean(anyOpen));
    }

    function openModal(modal) {
        modal.hidden = false;
        document.body.classList.add("modal-open");
    }

    function getRowDateIso(row) {
        if (row.dataset.financeDateIso) {
            return row.dataset.financeDateIso;
        }

        let pointer = row.previousElementSibling;

        while (pointer && !pointer.classList.contains("finance-day-row")) {
            pointer = pointer.previousElementSibling;
        }

        const day = Number(pointer?.querySelector("span")?.textContent || 29);
        const monthLabel = document.querySelector("[data-finance-month-label]")?.textContent?.trim() || "ABRIL 26";
        const monthMap = {
            JANEIRO: 0,
            FEVEREIRO: 1,
            "MARÇO": 2,
            ABRIL: 3,
            MAIO: 4,
            JUNHO: 5,
            JULHO: 6,
            AGOSTO: 7,
            SETEMBRO: 8,
            OUTUBRO: 9,
            NOVEMBRO: 10,
            DEZEMBRO: 11
        };
        const [monthText, yearText] = monthLabel.split(/\s+/);
        const monthIndex = monthMap[monthText] ?? 3;
        const year = yearText ? 2000 + Number(yearText) : 2026;
        const date = new Date(year, monthIndex, day);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }

    function getStatusTextFromRow(row) {
        return (row.children[5]?.textContent || "").trim().toLowerCase();
    }

    function deriveStatusFromForm(dateIso, isPaid) {
        if (isPaid) {
            return "pago";
        }

        const targetDate = new Date(dateIso);
        const today = new Date();
        targetDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        return targetDate < today ? "atrasado" : "pendente";
    }

    function setModalMode(modalType, isEditing) {
        if (modalType === "gain") {
            if (gainTitle) {
                gainTitle.textContent = isEditing ? "Editar Ganho" : "Adicionar Ganho";
            }
            if (gainSubmit) {
                gainSubmit.textContent = isEditing ? "Salvar" : "Confirmar";
            }
            if (gainAlert) {
                gainAlert.hidden = isEditing;
            }
            return;
        }

        if (costTitle) {
            costTitle.textContent = isEditing ? "Editar Custo" : "Adicionar Custo";
        }
        if (costSubmit) {
            costSubmit.textContent = isEditing ? "Salvar" : "Confirmar";
        }
    }

    function resetEditingState() {
        editingRow = null;
        editingType = "";
        setModalMode("gain", false);
        setModalMode("cost", false);
    }

    function populateEditForm(row) {
        const isGain = Boolean(row.querySelector(".finance-type-icon--gain"));
        const description = row.querySelector(".finance-description")?.textContent.trim() || "";
        const category = (row.children[3]?.textContent || "").trim().toLowerCase();
        const value = row.children[4]?.textContent.trim() || "R$ 0,00";
        const dateIso = getRowDateIso(row);
        const isPaid = getStatusTextFromRow(row) === "pago";

        editingRow = row;
        editingType = isGain ? "gain" : "cost";

        if (isGain) {
            setModalMode("gain", true);
            gainForm.reset();
            gainForm.querySelector('[name="description"]').value = description;
            gainForm.querySelector('[name="value"]').value = value;
            gainForm.querySelector('[name="date"]').value = dateIso;
            gainForm.querySelector('[name="status_paid"]').checked = isPaid;
            gainForm.querySelector('[name="notes"]').value = "";

            const radioValue = category === "bonificação" ? "Bonificações" : category === "iniciadas ativas" ? "Iniciadas Ativas" : "Outros";
            const radio = gainForm.querySelector(`[name="finance-gain-type"][value="${radioValue}"]`);
            if (radio) {
                radio.checked = true;
            }

            openModal(gainModal);
            return;
        }

        setModalMode("cost", true);
        costForm.reset();
        costForm.querySelector('[name="description"]').value = description;
        costForm.querySelector('[name="value"]').value = value;
        costForm.querySelector('[name="date"]').value = dateIso;
        costForm.querySelector('[name="status_paid"]').checked = isPaid;
        costForm.querySelector('[name="notes"]').value = "";

        const radioValue = category === "impostos" ? "Impostos" : category === "operacional" ? "Operacional" : "Outros";
        const radio = costForm.querySelector(`[name="finance-cost-type"][value="${radioValue}"]`);
        if (radio) {
            radio.checked = true;
        }

        openModal(costModal);
    }

    function applyEditToRow(form, type) {
        if (!editingRow) {
            return;
        }

        const description = form.querySelector('[name="description"]').value.trim();
        const value = form.querySelector('[name="value"]').value.trim() || "R$ 0,00";
        const dateIso = form.querySelector('[name="date"]').value;
        const isPaid = form.querySelector('[name="status_paid"]').checked;
        const status = deriveStatusFromForm(dateIso, isPaid);
        const category =
            type === "gain"
                ? form.querySelector('[name="finance-gain-type"]:checked')?.value || "Outros"
                : form.querySelector('[name="finance-cost-type"]:checked')?.value || "Outros";

        const categoryLabel =
            type === "gain"
                ? category === "Bonificações"
                    ? "Bonificação"
                    : category
                : category;

        const statusMap = {
            pago: { label: "Pago", className: "clients-status clients-status--active" },
            pendente: { label: "Pendente", className: "clients-status sales-status--pending" },
            atrasado: { label: "Atrasado", className: "clients-status status-overdue" }
        };

        const descriptionNode = editingRow.querySelector(".finance-description");
        const categoryCell = editingRow.children[3];
        const valueCell = editingRow.children[4];
        const statusNode = editingRow.children[5]?.querySelector("span");

        if (descriptionNode) {
            descriptionNode.textContent = description;
        }
        if (categoryCell) {
            categoryCell.textContent = categoryLabel;
        }
        if (valueCell) {
            valueCell.textContent = value;
        }
        if (statusNode) {
            statusNode.textContent = statusMap[status].label;
            statusNode.className = statusMap[status].className;
        }

        editingRow.dataset.financeDateIso = dateIso;
        document.dispatchEvent(new CustomEvent("finance:row-updated"));
    }

    function formatMoneyInput(value) {
        const digits = String(value || "").replace(/\D/g, "");
        const normalized = digits ? Number(digits) / 100 : 0;

        return normalized.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    gainTrigger.addEventListener("click", () => {
        resetEditingState();
        gainForm.reset();
        moneyInput.value = "R$ 0,00";
        gainForm.querySelector('[name="status_paid"]').checked = true;
        gainForm.querySelector('[name="finance-gain-type"][value="Outros"]').checked = true;
        closeModal(movementModal);
        openModal(gainModal);
    });

    costTrigger.addEventListener("click", () => {
        resetEditingState();
        costForm.reset();
        costMoneyInput.value = "R$ 0,00";
        costForm.querySelector('[name="status_paid"]').checked = true;
        costForm.querySelector('[name="finance-cost-type"][value="Outros"]').checked = true;
        closeModal(movementModal);
        openModal(costModal);
    });

    moneyInput.addEventListener("input", () => {
        moneyInput.value = formatMoneyInput(moneyInput.value);
    });

    moneyInput.addEventListener("focus", () => {
        if (!moneyInput.value.trim()) {
            moneyInput.value = "R$ 0,00";
        }
    });

    costMoneyInput.addEventListener("input", () => {
        costMoneyInput.value = formatMoneyInput(costMoneyInput.value);
    });

    costMoneyInput.addEventListener("focus", () => {
        if (!costMoneyInput.value.trim()) {
            costMoneyInput.value = "R$ 0,00";
        }
    });

    gainForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (editingRow && editingType === "gain") {
            applyEditToRow(gainForm, "gain");
            resetEditingState();
        }
        closeModal(gainModal);
    });

    costForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (editingRow && editingType === "cost") {
            applyEditToRow(costForm, "cost");
            resetEditingState();
        }
        closeModal(costModal);
    });

    document.addEventListener("finance:edit-row", (event) => {
        const row = event.detail?.row;

        if (!row) {
            return;
        }

        populateEditForm(row);
    });
}

function setupFinanceTableFilters() {
    const wrap = document.querySelector("[data-finance-filters-wrap]");
    const toggle = document.querySelector("[data-finance-filters-toggle]");
    const sortToggle = document.querySelector("[data-finance-sort-toggle]");
    const sortIcon = document.querySelector("[data-finance-sort-icon]");
    const archiveToggle = document.querySelector("[data-finance-archive-toggle]");
    const panel = document.querySelector("[data-finance-filters-panel]");
    const searchInput = document.querySelector("[data-finance-search]");
    const clearButton = document.querySelector("[data-finance-filters-clear]");
    const checkAllButton = document.querySelector("[data-finance-filters-check-all]");
    const applyButton = document.querySelector("[data-finance-filters-apply]");
    const counter = document.querySelector("[data-finance-filters-counter]");
    const tableBody = document.querySelector(".finance-table tbody");
    const monthLabel = document.querySelector("[data-finance-month-label]");
    const viewModal = document.getElementById("finance-view-modal");
    const summaryGain = document.querySelector("[data-finance-summary-gain]");
    const summaryCost = document.querySelector("[data-finance-summary-cost]");
    const summaryBalance = document.querySelector("[data-finance-summary-balance]");

    if (!wrap || !toggle || !panel || !searchInput || !tableBody) {
        return;
    }

    const dayRows = Array.from(tableBody.querySelectorAll(".finance-day-row"));
    const allRows = Array.from(tableBody.querySelectorAll("tr")).filter((row) => !row.classList.contains("finance-day-row"));
    const typeCheckboxes = Array.from(panel.querySelectorAll("[data-finance-filter-type]"));
    const categoryCheckboxes = Array.from(panel.querySelectorAll("[data-finance-filter-category]"));
    const statusCheckboxes = Array.from(panel.querySelectorAll("[data-finance-filter-status]"));
    const minInput = panel.querySelector("[data-finance-filter-value-min]");
    const maxInput = panel.querySelector("[data-finance-filter-value-max]");
    let isAscending = false;
    let showArchivedOnly = false;
    const appliedFilters = {
        types: new Set(typeCheckboxes.filter((input) => input.checked).map((input) => input.dataset.financeFilterType)),
        categories: new Set(categoryCheckboxes.filter((input) => input.checked).map((input) => input.dataset.financeFilterCategory)),
        statuses: new Set(statusCheckboxes.filter((input) => input.checked).map((input) => input.dataset.financeFilterStatus)),
        minValue: "",
        maxValue: ""
    };

    function parseCurrency(value) {
        const normalized = String(value || "")
            .replace(/[^\d,.-]/g, "")
            .replace(/\./g, "")
            .replace(",", ".");
        return Number(normalized) || 0;
    }

    function getDayNumber(dayRow) {
        return Number(dayRow.querySelector("span")?.textContent || 0);
    }

    function getFinanceMonthContext() {
        const monthMap = {
            JANEIRO: 0,
            FEVEREIRO: 1,
            "MARÇO": 2,
            ABRIL: 3,
            MAIO: 4,
            JUNHO: 5,
            JULHO: 6,
            AGOSTO: 7,
            SETEMBRO: 8,
            OUTUBRO: 9,
            NOVEMBRO: 10,
            DEZEMBRO: 11
        };
        const fallback = { monthIndex: 3, year: 2026 };
        const raw = monthLabel?.textContent?.trim();

        if (!raw) {
            return fallback;
        }

        const [monthText, yearText] = raw.split(/\s+/);
        const monthIndex = monthMap[monthText] ?? fallback.monthIndex;
        const year = yearText ? 2000 + Number(yearText) : fallback.year;
        return { monthIndex, year };
    }

    function updateSortIcon() {
        if (!sortToggle || !sortIcon) {
            return;
        }

        sortToggle.setAttribute("aria-pressed", String(isAscending));
        sortIcon.innerHTML = isAscending
            ? '<path d="M12 19V5"></path><path d="m7 10 5-5 5 5"></path>'
            : '<path d="M12 5v14"></path><path d="m7 14 5 5 5-5"></path>';
    }

    function isArchivedRow(row) {
        const statusText = (row.children[5]?.textContent || "").trim().toLowerCase();
        return statusText === "arquivado";
    }

    function getStatusConfig(status) {
        switch (status) {
            case "pago":
                return { label: "Pago", className: "clients-status clients-status--active" };
            case "pendente":
                return { label: "Pendente", className: "clients-status sales-status--pending" };
            case "atrasado":
                return { label: "Atrasado", className: "clients-status status-overdue" };
            default:
                return { label: "Arquivado", className: "clients-status" };
        }
    }

    function deriveFinanceCategory(row) {
        const description = row.querySelector(".finance-description")?.textContent.trim().toLowerCase() || "";
        const isGain = Boolean(row.querySelector(".finance-type-icon--gain"));

        if (isGain) {
            if (description.startsWith("venda #")) {
                return "Vendas";
            }
            if (description.includes("bônus") || description.includes("bonus")) {
                return "Bonificação";
            }
            if (description.includes("iniciadas ativas")) {
                return "Iniciadas Ativas";
            }
            return "Outros";
        }

        if (description.includes("reposição estoque") || description.includes("reposicao estoque") || description.includes("compra de produtos")) {
            return "Pedido MK";
        }
        if (description.includes("imposto") || description.includes("icms")) {
            return "Impostos";
        }
        if (
            description.includes("embalagens") ||
            description.includes("gateway") ||
            description.includes("campanha") ||
            description.includes("frete") ||
            description.includes("plataforma")
        ) {
            return "Operacional";
        }
        return "Outros";
    }

    function hydrateFinanceCategories() {
        allRows.forEach((row) => {
            const categoryCell = row.children[3];

            if (!categoryCell) {
                return;
            }

            categoryCell.textContent = deriveFinanceCategory(row);
        });
    }

    function formatFinanceDate(date) {
        const weekday = date.toLocaleDateString("pt-BR", { weekday: "long" });
        const day = String(date.getDate()).padStart(2, "0");
        const month = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
        const year = String(date.getFullYear());
        return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${day} ${month} ${year}`;
    }

    function populateFinanceViewModal(row) {
        if (!viewModal) {
            return;
        }

        const description = row.querySelector(".finance-description")?.textContent.trim() || "Movimentação";
        const isGain = Boolean(row.querySelector(".finance-type-icon--gain"));
        const typeLabel = isGain ? "Ganho" : "Custo";
        const category = row.children[3]?.textContent.trim() || "Outros";
        const value = row.children[4]?.textContent.trim() || "R$ 0,00";
        const status = row.children[5]?.textContent.trim() || "Pendente";
        const archived = isArchivedRow(row);
        const rowDate = getRowDate(row);
        const day = String(rowDate.getDate()).padStart(2, "0");
        const summary = archived
            ? "Movimentação arquivada para consulta histórica, sem exibição na lista principal enquanto permanecer nesse estado."
            : "Movimentação ativa no painel financeiro, disponível para acompanhamento, filtros e atualização de status.";

        const fields = {
            "[data-finance-view-type]": typeLabel,
            "[data-finance-view-description]": description,
            "[data-finance-view-date]": formatFinanceDate(rowDate),
            "[data-finance-view-value]": value,
            "[data-finance-view-status]": status,
            "[data-finance-view-category]": category,
            "[data-finance-view-archive-state]": archived ? "Arquivado" : "Ativo",
            "[data-finance-view-description-duplicate]": description,
            "[data-finance-view-type-label]": typeLabel,
            "[data-finance-view-category-duplicate]": category,
            "[data-finance-view-status-duplicate]": status,
            "[data-finance-view-day]": day,
            "[data-finance-view-month]": monthLabel?.textContent?.trim() || "ABRIL 26",
            "[data-finance-view-summary]": summary
        };

        Object.entries(fields).forEach(([selector, valueText]) => {
            const element = viewModal.querySelector(selector);

            if (!element) {
                return;
            }

            element.textContent = valueText;
        });

        const typeEyebrow = viewModal.querySelector("[data-finance-view-type]");
        const statusPill = viewModal.querySelector("[data-finance-view-status]");
        const archivePill = viewModal.querySelector("[data-finance-view-archive-state]");

        if (typeEyebrow) {
            typeEyebrow.classList.toggle("finance-description--gain", isGain);
            typeEyebrow.classList.toggle("finance-description--cost", !isGain);
        }

        if (statusPill) {
            statusPill.className = "finance-view-pill";
            if (status.toLowerCase() === "pago") {
                statusPill.classList.add("finance-view-pill--success");
            } else if (status.toLowerCase() === "atrasado") {
                statusPill.classList.add("finance-view-pill--danger");
            } else if (status.toLowerCase() === "arquivado") {
                statusPill.classList.add("finance-view-pill--soft");
            } else {
                statusPill.classList.add("finance-view-pill--warning");
            }
        }

        if (archivePill) {
            archivePill.className = "finance-view-pill finance-view-pill--soft";
        }
    }

    function closeRowMenu(row) {
        const menu = row.querySelector("[data-actions-menu]");
        const toggleButton = row.querySelector("[data-actions-toggle]");

        if (menu) {
            menu.hidden = true;
        }

        if (toggleButton) {
            toggleButton.setAttribute("aria-expanded", "false");
        }
    }

    function getRowCategory(row) {
        return (row.children[3]?.textContent || "").trim().toLowerCase();
    }

    function buildRowMenu(row, status) {
        const menu = row.querySelector("[data-actions-menu]");

        if (!menu) {
            return;
        }

        const category = getRowCategory(row);
        const isProtectedCategory = category === "vendas" || category === "pedido mk";

        if (status === "arquivado") {
            menu.innerHTML = `
                <button type="button" data-modal-target="finance-view-modal">Visualizar</button>
                <button type="button" data-finance-row-action="restore">Restaurar</button>
            `;
            return;
        }

        const paymentAction = status === "pago" ? "mark-unpaid" : "mark-paid";
        const paymentLabel = status === "pago" ? "Marcar como não pago" : "Marcar como pago";

        menu.innerHTML = `
            <button type="button" data-modal-target="finance-view-modal">Visualizar</button>
            <button type="button" data-finance-row-action="${paymentAction}">${paymentLabel}</button>
            ${isProtectedCategory ? "" : '<button type="button" data-finance-row-action="edit">Editar</button>'}
            ${isProtectedCategory ? "" : '<button type="button" data-finance-row-action="archive">Arquivar</button>'}
        `;
    }

    function updateRowStatus(row, status) {
        const statusCell = row.children[5]?.querySelector("span");
        const config = getStatusConfig(status);

        if (statusCell) {
            statusCell.textContent = config.label;
            statusCell.className = config.className;
        }

        buildRowMenu(row, status);
    }

    function getRowDate(row) {
        const dayRow = row.previousElementSibling?.classList.contains("finance-day-row")
            ? row.previousElementSibling
            : row.previousElementSibling?.closest?.(".finance-day-row");
        let pointer = row.previousElementSibling;

        while (pointer && !pointer.classList.contains("finance-day-row")) {
            pointer = pointer.previousElementSibling;
        }

        const headerRow = dayRow || pointer;
        const day = Number(headerRow?.querySelector("span")?.textContent || 0);
        const { monthIndex, year } = getFinanceMonthContext();
        return new Date(year, monthIndex, day || 1);
    }

    function updateArchivedVisibility() {
        allRows.forEach((row) => {
            const hiddenByArchiveState = showArchivedOnly ? !isArchivedRow(row) : isArchivedRow(row);
            row.dataset.financeArchivedHidden = hiddenByArchiveState ? "true" : "false";
        });
    }

    function setupRowActions() {
        allRows.forEach((row) => {
            buildRowMenu(row, isArchivedRow(row) ? "arquivado" : (row.children[5]?.textContent || "").trim().toLowerCase());

            const menu = row.querySelector("[data-actions-menu]");

            if (!menu || menu.dataset.financeBound === "true") {
                return;
            }

            menu.dataset.financeBound = "true";
            menu.addEventListener("click", (event) => {
                const viewTrigger = event.target.closest('[data-modal-target="finance-view-modal"]');
                const actionButton = event.target.closest("[data-finance-row-action]");

                if (viewTrigger) {
                    populateFinanceViewModal(row);
                    if (viewModal) {
                        viewModal.hidden = false;
                        document.body.classList.add("modal-open");
                    }
                    closeRowMenu(row);
                    return;
                }

                if (!actionButton) {
                    return;
                }

                const action = actionButton.dataset.financeRowAction;

                if (action === "restore") {
                    updateRowStatus(row, "pago");
                } else if (action === "archive") {
                    updateRowStatus(row, "arquivado");
                } else if (action === "mark-paid") {
                    updateRowStatus(row, "pago");
                } else if (action === "mark-unpaid") {
                    const rowDate = getRowDate(row);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    rowDate.setHours(0, 0, 0, 0);
                    updateRowStatus(row, rowDate < today ? "atrasado" : "pendente");
                } else if (action === "edit") {
                    closeRowMenu(row);
                    document.dispatchEvent(new CustomEvent("finance:edit-row", { detail: { row } }));
                    return;
                }

                updateArchivedVisibility();
                closeRowMenu(row);
                applyFilters();
            });
        });
    }

    function readPendingFilters() {
        return {
            types: new Set(typeCheckboxes.filter((input) => input.checked).map((input) => input.dataset.financeFilterType)),
            categories: new Set(
                categoryCheckboxes.filter((input) => input.checked).map((input) => input.dataset.financeFilterCategory)
            ),
            statuses: new Set(
                statusCheckboxes.filter((input) => input.checked).map((input) => input.dataset.financeFilterStatus)
            ),
            minValue: parseCurrency(minInput?.value || ""),
            maxValue: parseCurrency(maxInput?.value || "")
        };
    }

    function updateCounter() {
        if (!counter) {
            return;
        }

        const total = typeCheckboxes.length + categoryCheckboxes.length + statusCheckboxes.length;
        const applied =
            typeCheckboxes.filter((input) => input.checked).length +
            categoryCheckboxes.filter((input) => input.checked).length +
            statusCheckboxes.filter((input) => input.checked).length;
        counter.textContent = `${applied}/${total} filtros aplicados`;
    }

    function rowMatches(row) {
        const description = row.querySelector(".finance-description")?.textContent.trim().toLowerCase() || "";
        const type = row.querySelector(".finance-type-icon--gain") ? "gain" : row.querySelector(".finance-type-icon--cost") ? "cost" : "";
        const category = (row.children[3]?.textContent || "").trim().toLowerCase();
        const value = parseCurrency(row.children[4]?.textContent || "");
        const statusText = (row.children[5]?.textContent || "").trim().toLowerCase();
        const searchTerm = searchInput.value.trim().toLowerCase();
        const archived = isArchivedRow(row);

        const matchesSearch = !searchTerm || description.includes(searchTerm);
        if (showArchivedOnly) {
            return archived && matchesSearch;
        }
        if (archived) {
            return false;
        }
        const matchesType = appliedFilters.types.has(type);
        const matchesCategory = appliedFilters.categories.has(category);
        const matchesStatus = appliedFilters.statuses.has(statusText);
        const matchesMin = !appliedFilters.minValue || value >= appliedFilters.minValue;
        const matchesMax = !appliedFilters.maxValue || value <= appliedFilters.maxValue;

        return matchesSearch && matchesType && matchesCategory && matchesStatus && matchesMin && matchesMax;
    }

    function applyFilters() {
        updateArchivedVisibility();

        allRows.forEach((row) => {
            const hiddenByArchiveState = row.dataset.financeArchivedHidden === "true";
            row.hidden = hiddenByArchiveState || !rowMatches(row);
        });

        dayRows.forEach((dayRow) => {
            let next = dayRow.nextElementSibling;
            let hasVisibleRows = false;

            while (next && !next.classList.contains("finance-day-row")) {
                if (!next.hidden) {
                    hasVisibleRows = true;
                }
                next = next.nextElementSibling;
            }

            dayRow.hidden = !hasVisibleRows;
        });

        updateFinanceSummary();
    }

    function updateFinanceSummary() {
        if (!summaryGain || !summaryCost || !summaryBalance) {
            return;
        }

        let gainTotal = 0;
        let costTotal = 0;

        allRows.forEach((row) => {
            if (row.hidden) {
                return;
            }

            const value = parseCurrency(row.children[4]?.textContent || "");
            const isGain = Boolean(row.querySelector(".finance-type-icon--gain"));

            if (isGain) {
                gainTotal += value;
            } else {
                costTotal += value;
            }
        });

        summaryGain.textContent = `R$ ${formatCurrencyPtBr(gainTotal)}`;
        summaryCost.textContent = `R$ ${formatCurrencyPtBr(costTotal)}`;
        summaryBalance.textContent = `R$ ${formatCurrencyPtBr(gainTotal - costTotal)}`;
    }

    function sortFinanceRows() {
        const groups = dayRows.map((dayRow) => {
            const rows = [dayRow];
            let next = dayRow.nextElementSibling;

            while (next && !next.classList.contains("finance-day-row")) {
                rows.push(next);
                next = next.nextElementSibling;
            }

            return {
                day: getDayNumber(dayRow),
                rows
            };
        });

        groups.sort((a, b) => (isAscending ? a.day - b.day : b.day - a.day));

        groups.forEach((group) => {
            group.rows.forEach((row) => {
                tableBody.appendChild(row);
            });
        });
    }

    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");

    toggle.addEventListener("click", () => {
        const shouldOpen = panel.hidden;
        panel.hidden = !shouldOpen;
        toggle.setAttribute("aria-expanded", String(shouldOpen));
        wrap.classList.toggle("is-expanded", shouldOpen);
    });

    sortToggle?.addEventListener("click", () => {
        isAscending = !isAscending;
        updateSortIcon();
        sortFinanceRows();
        applyFilters();
    });

    archiveToggle?.addEventListener("click", () => {
        showArchivedOnly = !showArchivedOnly;
        archiveToggle.classList.toggle("is-active", showArchivedOnly);
        archiveToggle.setAttribute("aria-pressed", String(showArchivedOnly));
        applyFilters();
    });

    searchInput.addEventListener("input", () => {
        applyFilters();
    });

    [...typeCheckboxes, ...categoryCheckboxes, ...statusCheckboxes].forEach((input) => {
        input.addEventListener("change", () => {
            updateCounter();
        });
    });

    [minInput, maxInput].forEach((input) => {
        input?.addEventListener("input", updateCounter);
        input?.addEventListener("change", updateCounter);
    });

    clearButton?.addEventListener("click", () => {
        [...typeCheckboxes, ...categoryCheckboxes, ...statusCheckboxes].forEach((input) => {
            input.checked = false;
        });

        if (minInput) {
            minInput.value = "";
        }

        if (maxInput) {
            maxInput.value = "";
        }

        updateCounter();
    });

    checkAllButton?.addEventListener("click", () => {
        [...typeCheckboxes, ...categoryCheckboxes, ...statusCheckboxes].forEach((input) => {
            input.checked = true;
        });

        updateCounter();
    });

    applyButton?.addEventListener("click", () => {
        const pending = readPendingFilters();
        appliedFilters.types = pending.types;
        appliedFilters.categories = pending.categories;
        appliedFilters.statuses = pending.statuses;
        appliedFilters.minValue = pending.minValue;
        appliedFilters.maxValue = pending.maxValue;
        applyFilters();
    });

    document.addEventListener("finance:row-updated", applyFilters);

    updateCounter();
    updateSortIcon();
    hydrateFinanceCategories();
    setupRowActions();
    sortFinanceRows();
    applyFilters();
}

function setupFinanceMonthNav() {
    const monthNav = document.querySelector("[data-finance-month-nav]");

    if (!monthNav) {
        return;
    }

    const label = monthNav.querySelector("[data-finance-month-label]");
    const previous = monthNav.querySelector("[data-finance-month-prev]");
    const next = monthNav.querySelector("[data-finance-month-next]");
    const months = [
        "JANEIRO",
        "FEVEREIRO",
        "MARÇO",
        "ABRIL",
        "MAIO",
        "JUNHO",
        "JULHO",
        "AGOSTO",
        "SETEMBRO",
        "OUTUBRO",
        "NOVEMBRO",
        "DEZEMBRO"
    ];
    let currentDate = new Date(2026, 3, 1);

    function formatWeekday(date) {
        return date
            .toLocaleDateString("pt-BR", { weekday: "long" })
            .split("-")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join("-");
    }

    function updateLabel() {
        const month = months[currentDate.getMonth()];
        const year = String(currentDate.getFullYear()).slice(-2);
        label.textContent = `${month} ${year}`;

        document.querySelectorAll(".finance-day-row").forEach((row) => {
            const day = row.querySelector("span");
            const date = row.querySelector("strong");

            if (day && date) {
                const dayNumber = Number(day.textContent);
                const rowDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
                date.textContent = formatWeekday(rowDate);
            }
        });
    }

    previous.addEventListener("click", () => {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        updateLabel();
    });

    next.addEventListener("click", () => {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        updateLabel();
    });

    updateLabel();
}

function setupInsightsMore() {
    document.querySelectorAll("[data-insights-more-wrap]").forEach((wrap) => {
        const button = wrap.querySelector("[data-insights-more-button]");
        const moreList = wrap.parentElement ? wrap.parentElement.querySelector("[data-insights-more-list]") : null;

        if (!button || !moreList) {
            return;
        }

        const hiddenItems = moreList.querySelectorAll(".insight-feed-row");

        if (!hiddenItems.length) {
            wrap.hidden = true;
            return;
        }

        moreList.hidden = true;

        button.addEventListener("click", () => {
            moreList.hidden = false;
            wrap.hidden = true;
        });
    });
}

function setupDashboardPage() {
    if (!document.querySelector(".todo-checklist")) {
        return;
    }

    const openers = document.querySelectorAll("[data-dashboard-open]");
    const infoModal = document.getElementById("dashboard-todo-info-modal");
    const addModal = document.getElementById("dashboard-todo-add-modal");
    const alertModal = document.getElementById("dashboard-alert-modal");
    const messageModal = document.getElementById("dashboard-message-modal");
    const alertPill = document.querySelector("[data-dashboard-alert-pill]");
    const alertTitle = document.querySelector("[data-dashboard-alert-title]");
    const alertSubtitle = document.querySelector("[data-dashboard-alert-subtitle]");
    const alertList = document.querySelector("[data-dashboard-alert-list]");
    const taskBuilder = document.querySelector("[data-dashboard-task-builder]");
    const taskCounter = document.querySelector("[data-dashboard-task-counter]");
    const messageAvatar = document.querySelector("[data-dashboard-message-avatar]");
    const messageName = document.querySelector("[data-dashboard-message-name]");
    const messageSubtitle = document.querySelector("[data-dashboard-message-subtitle]");
    const messageText = document.querySelector("[data-dashboard-message-text]");
    const taskState = ["", "", "", "", "", ""];
    const alertData = {
        "alert-contacts": {
            pill: "Pendências",
            title: "Todas as pendências de contato",
            subtitle: "Até 10 contatos que pedem acompanhamento agora.",
            items: [
                { type: "contact", name: "Ana Souza", subtitle: "Pedido em aberto", button: "Mensagem" },
                { type: "contact", name: "Marina Oliveira", subtitle: "Retorno 2 semanas", button: "Mensagem" },
                { type: "contact", name: "Julia Santos", subtitle: "Retorno 2 dias", button: "Mensagem" },
                { type: "contact", name: "Renata Alves", subtitle: "Cliente interessada em kit de maquiagem", button: "Mensagem" },
                { type: "contact", name: "Carla Mendes", subtitle: "Aguardando confirmação de pagamento", button: "Mensagem" },
                { type: "contact", name: "Fernanda Lima", subtitle: "Solicitou nova sugestão de presente", button: "Mensagem" },
                { type: "contact", name: "Paula Rocha", subtitle: "Sem resposta após última mensagem", button: "Mensagem" },
                { type: "contact", name: "Bianca Freitas", subtitle: "Pediu envio de catálogo atualizado", button: "Mensagem" },
                { type: "contact", name: "Camila Prado", subtitle: "Acompanhamento pós-venda pendente", button: "Mensagem" },
                { type: "contact", name: "Mariana Torres", subtitle: "Deseja renegociar parcelamento", button: "Mensagem" }
            ]
        },
        "alert-birthdays": {
            pill: "Hoje",
            title: "Todos os aniversariantes",
            subtitle: "Até 10 clientes em datas especiais.",
            items: [
                { type: "birthday", name: "Ana Paula Santos", subtitle: "38 anos", button: "Mandar parabéns" },
                { type: "birthday", name: "Camila Lima", subtitle: "21 anos", button: "Mandar parabéns" },
                { type: "birthday", name: "Renata Freitas", subtitle: "25 anos", button: "Mandar parabéns" },
                { type: "birthday", name: "Juliana Prado", subtitle: "32 anos", button: "Mandar parabéns" },
                { type: "birthday", name: "Bianca Matos", subtitle: "29 anos", button: "Mandar parabéns" },
                { type: "birthday", name: "Paula Gomes", subtitle: "41 anos", button: "Mandar parabéns" },
                { type: "birthday", name: "Carla Andrade", subtitle: "36 anos", button: "Mandar parabéns" },
                { type: "birthday", name: "Patrícia Sousa", subtitle: "27 anos", button: "Mandar parabéns" },
                { type: "birthday", name: "Márcia Nunes", subtitle: "44 anos", button: "Mandar parabéns" },
                { type: "birthday", name: "Luciana Reis", subtitle: "31 anos", button: "Mandar parabéns" }
            ]
        },
        "alert-stock": {
            pill: "Crítico",
            title: "Todos os produtos em atenção",
            subtitle: "Até 10 itens com baixo estoque ou risco de ruptura.",
            items: [
                { type: "stock", name: "Batom Matte Rosa", amount: "2 un", stockWidth: 28 },
                { type: "stock", name: "Sérum Facial Glow", amount: "3 un", stockWidth: 35 },
                { type: "stock", name: "Perfume Velvet Night", amount: "1 un", stockWidth: 18 },
                { type: "stock", name: "Base Soft Matte", amount: "4 un", stockWidth: 42 },
                { type: "stock", name: "Máscara Volume Max", amount: "2 un", stockWidth: 25 },
                { type: "stock", name: "Perfume Bloom Gold", amount: "3 un", stockWidth: 33 },
                { type: "stock", name: "Paleta Sunset Glow", amount: "2 un", stockWidth: 21 },
                { type: "stock", name: "Base Coverage Pro", amount: "4 un", stockWidth: 39 },
                { type: "stock", name: "Gloss Crystal Shine", amount: "1 un", stockWidth: 16 },
                { type: "stock", name: "Hidratante Body Silk", amount: "3 un", stockWidth: 30 }
            ]
        }
    };

    function updateDashboardModalState() {
        const isOpen = [infoModal, addModal, alertModal, messageModal].some((modal) => modal && !modal.hidden);
        document.body.classList.toggle("modal-open", isOpen);
    }

    function closeDashboardModals() {
        [infoModal, addModal, alertModal, messageModal].forEach((modal) => {
            if (modal) {
                modal.hidden = true;
            }
        });
        updateDashboardModalState();
    }

    function openDashboardModal(modal) {
        closeDashboardModals();
        if (modal) {
            modal.hidden = false;
        }
        updateDashboardModalState();
    }

    function renderAlertModal(key) {
        const config = alertData[key];

        if (!config || !alertList) {
            return;
        }

        if (alertPill) {
            alertPill.textContent = config.pill || "Detalhes";
        }

        alertTitle.textContent = config.title;
        alertSubtitle.textContent = config.subtitle;
        alertList.innerHTML = "";

        config.items.slice(0, 10).forEach((itemData) => {
            const item = document.createElement("div");

            if (itemData.type === "stock") {
                item.className = "dashboard-alert-item dashboard-alert-item--stock";
                item.innerHTML = `
                    <div class="stock-row">
                        <div class="stock-main">
                            <div class="stock-copy">
                                <p>${itemData.name}</p>
                                <strong>${itemData.amount}</strong>
                            </div>
                            <div class="mini-progress" aria-hidden="true"><span style="width:${itemData.stockWidth}%"></span></div>
                        </div>
                        <button class="mini-action mini-action--stock" type="button">+ Carrinho</button>
                    </div>
                `;
            } else {
                item.className = "dashboard-alert-item dashboard-alert-item--person";
                item.innerHTML = `
                    <div class="person-profile dashboard-alert-item-main">
                        <img class="birthday-avatar avatar-image" src="../src/assets/customers/default.webp" alt="Foto de ${itemData.name}">
                        <div><strong>${itemData.name}</strong><span>${itemData.subtitle}</span></div>
                    </div>
                    <button class="mini-action" type="button" data-dashboard-message="${itemData.type}" data-person-name="${itemData.name}" data-person-subtitle="${itemData.subtitle}" data-person-avatar="../src/assets/customers/default.webp">${itemData.button}</button>
                `;
            }

            alertList.appendChild(item);
        });

        openDashboardModal(alertModal);
    }

    function updateTaskCounter() {
        if (!taskCounter) {
            return;
        }

        const count = taskState.filter(Boolean).length;
        taskCounter.textContent = `${count}/6 adicionadas`;
    }

    function renderTaskSlot(slot) {
        if (!taskBuilder) {
            return;
        }

        const element = taskBuilder.querySelector(`[data-task-slot="${slot + 1}"]`);

        if (!element) {
            return;
        }

        const currentValue = taskState[slot];

        function renderEditForm(initialValue = "") {
            element.innerHTML = `
                <span class="dashboard-task-index">${slot + 1}</span>
                <form class="dashboard-task-form">
                    <input type="text" maxlength="50" placeholder="Digite a tarefa de amanhã" value="${initialValue.replace(/"/g, "&quot;")}">
                    <button type="submit" class="dashboard-task-save">Salvar</button>
                </form>
            `;

            const form = element.querySelector(".dashboard-task-form");
            const input = form.querySelector("input");
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);

            form.addEventListener("submit", (event) => {
                event.preventDefault();
                const value = input.value.trim().slice(0, 50);

                if (!value) {
                    input.focus();
                    return;
                }

                taskState[slot] = value;
                updateTaskCounter();
                renderTaskSlot(slot);
            });
        }

        if (currentValue) {
            element.innerHTML = `
                <span class="dashboard-task-index">${slot + 1}</span>
                <div class="dashboard-task-display">
                    <div class="dashboard-task-text">${currentValue}</div>
                    <button type="button" class="dashboard-task-edit" aria-label="Editar tarefa">
                        <svg viewBox="0 0 256 256"><path d="M227.31,73.37,182.63,28.69a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96A16,16,0,0,0,227.31,73.37Z"></path></svg>
                    </button>
                </div>
            `;

            const editButton = element.querySelector(".dashboard-task-edit");
            editButton.addEventListener("click", () => {
                renderEditForm(currentValue);
            });
            return;
        }

        element.innerHTML = `
            <span class="dashboard-task-index">${slot + 1}</span>
            <button type="button" class="dashboard-task-add">Adicionar tarefa</button>
        `;
        const addButton = element.querySelector(".dashboard-task-add");

        addButton.addEventListener("click", () => {
            renderEditForm();
        });
    }

    function renderTaskBuilder() {
        taskState.forEach((_, index) => renderTaskSlot(index));
        updateTaskCounter();
    }

    function openMessageModal(button) {
        if (!messageModal || !messageAvatar || !messageName || !messageSubtitle || !messageText) {
            return;
        }

        const type = button.dataset.dashboardMessage;
        const name = button.dataset.personName || "Cliente";
        const subtitle = button.dataset.personSubtitle || "";
        const avatar = button.dataset.personAvatar || "../src/assets/customers/default.webp";
        const baseMessage = type === "birthday"
            ? `Olá, ${name}! Passando para desejar um feliz aniversário. Que seu dia seja muito especial, cheio de alegrias e momentos lindos. Preparei uma condição especial de aniversário para você e vou amar te contar mais.`
            : `Olá, ${name}! Tudo bem? Estou passando para retomar nosso contato sobre seu retorno de 2 dias e saber se posso te ajudar com alguma dúvida ou com uma sugestão ideal para este momento.`;

        messageAvatar.src = avatar;
        messageAvatar.alt = `Foto de ${name}`;
        messageName.textContent = name;
        messageSubtitle.textContent = subtitle;
        messageText.value = baseMessage;
        openDashboardModal(messageModal);
    }

    openers.forEach((trigger) => {
        trigger.addEventListener("click", (event) => {
            event.preventDefault();
            const action = trigger.dataset.dashboardOpen;

            if (action === "todo-info") {
                openDashboardModal(infoModal);
                return;
            }

            if (action === "todo-add") {
                openDashboardModal(addModal);
                return;
            }

            if (action.startsWith("alert-")) {
                renderAlertModal(action);
            }
        });
    });

    document.addEventListener("click", (event) => {
        const messageButton = event.target.closest("[data-dashboard-message]");

        if (messageButton) {
            openMessageModal(messageButton);
            return;
        }

        const stockButton = event.target.closest(".mini-action--stock");

        if (!stockButton) {
            return;
        }

        stockButton.classList.add("is-added");
        stockButton.textContent = "✓ Adiconado";
    });

    document.querySelectorAll("[data-dashboard-modal-close]").forEach((button) => {
        button.addEventListener("click", () => {
            closeDashboardModals();
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeDashboardModals();
        }
    });

    renderTaskBuilder();
}

function setupCalendarPage() {
    const calendarRoot = document.querySelector("[data-calendar-root]");

    if (!calendarRoot) {
        return;
    }

    const monthLabel = calendarRoot.querySelector("[data-calendar-month-label]");
    const grid = calendarRoot.querySelector("[data-calendar-grid]");
    const summaryList = calendarRoot.querySelector("[data-calendar-summary-list]");
    const agendaList = calendarRoot.querySelector("[data-calendar-agenda-list]");
    const previousButton = calendarRoot.querySelector("[data-calendar-prev]");
    const nextButton = calendarRoot.querySelector("[data-calendar-next]");
    const filterButtons = Array.from(calendarRoot.querySelectorAll("[data-calendar-filter]"));
    const detailModal = document.getElementById("calendar-event-modal");
    const summaryModal = document.getElementById("calendar-summary-modal");
    const dayModal = document.getElementById("calendar-day-modal");
    const summaryActionsWrap = document.querySelector("[data-calendar-summary-actions]");
    const summaryTitle = document.querySelector("[data-calendar-summary-title]");
    const summarySubtitle = document.querySelector("[data-calendar-summary-subtitle]");
    const dayTitle = document.querySelector("[data-calendar-day-title]");
    const daySubtitle = document.querySelector("[data-calendar-day-subtitle]");
    const dayActionsWrap = document.querySelector("[data-calendar-day-actions]");
    const detailType = document.querySelector("[data-calendar-modal-type]");
    const detailTitle = document.querySelector("[data-calendar-modal-title]");
    const detailDate = document.querySelector("[data-calendar-modal-date]");
    const detailDescription = document.querySelector("[data-calendar-modal-description]");
    const detailAction = document.querySelector("[data-calendar-modal-action]");
    const detailNoteLabel = document.querySelector("[data-calendar-modal-note-label]");
    const relatedActionWrap = document.querySelector("[data-calendar-related-action-wrap]");
    const relatedActionLink = document.querySelector("[data-calendar-related-action]");
    const addModal = document.getElementById("calendar-add-modal");
    const addForm = document.querySelector("[data-calendar-add-form]");
    const addButton = document.querySelector("[data-calendar-open-add]");
    const manualActions = document.querySelector("[data-calendar-manual-actions]");
    const editEventButton = document.querySelector("[data-calendar-edit-event]");
    const completeEventButton = document.querySelector("[data-calendar-complete-event]");
    const monthNames = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro"
    ];
    const weekdayNames = [
        "Domingo",
        "Segunda-feira",
        "Terça-feira",
        "Quarta-feira",
        "Quinta-feira",
        "Sexta-feira",
        "Sábado"
    ];
    const typeLabels = {
        formula: "2+2+2",
        birthday: "Aniversário",
        payment: "Pagamento",
        holiday: "Comemorativa",
        manual: "Meus Eventos"
    };
    const typeIcons = {
        formula: '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M117.25,157.75a8,8,0,0,1-11.32,0L80,131.88,54.06,157.75a8,8,0,0,1-11.31-11.32L68.69,120,42.75,94.06A8,8,0,0,1,54.06,82.75L80,108.69l25.93-25.94a8,8,0,0,1,11.32,11.31L91.31,120l25.94,25.94A8,8,0,0,1,117.25,157.75Zm96-75a8,8,0,0,0-11.31,0L176,108.69,150.06,82.75a8,8,0,0,0-11.31,11.31L164.69,120l-25.94,25.94a8,8,0,1,0,11.31,11.31L176,131.31l25.94,25.94a8,8,0,0,0,11.31-11.31L187.31,120l25.94-25.94A8,8,0,0,0,213.25,82.75Z"></path></svg>',
        birthday: '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M128,32a40,40,0,1,0,40,40A40,40,0,0,0,128,32Zm76,96H52A20,20,0,0,0,32,148v20a56,56,0,0,0,56,56h80a56,56,0,0,0,56-56V148A20,20,0,0,0,204,128Z"></path></svg>',
        payment: '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M224,56H32A16,16,0,0,0,16,72v112a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V72A16,16,0,0,0,224,56ZM96,152H48a8,8,0,0,1,0-16H96a8,8,0,0,1,0,16Zm112-32H48a8,8,0,0,1,0-16H208a8,8,0,0,1,0,16Z"></path></svg>',
        holiday: '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M128,24l24.71,50.08L208,82.38,168,121.35l9.44,55L128,150.32,78.56,176.36,88,121.35,48,82.38l55.29-8.3Z"></path></svg>',
        manual: '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M200,32H168V24a8,8,0,0,0-16,0v8H104V24a8,8,0,0,0-16,0v8H56A24,24,0,0,0,32,56V200a24,24,0,0,0,24,24H200a24,24,0,0,0,24-24V56A24,24,0,0,0,200,32ZM176,136H136v40a8,8,0,0,1-16,0V136H80a8,8,0,0,1,0-16h40V80a8,8,0,0,1,16,0v40h40a8,8,0,0,1,0,16Z"></path></svg>'
    };
    const activeFilters = new Set(["formula", "birthday", "payment", "holiday", "manual"]);
    const registrationDate = new Date(2026, 3, 1);
    const minCalendarDate = new Date(registrationDate.getFullYear(), 0, 1);
    const currentYear = new Date().getFullYear();
    const maxCalendarDate = new Date(currentYear + 2, 11, 1);
    let currentDate = new Date(registrationDate.getFullYear(), registrationDate.getMonth(), 1);
    let openedSummaryItem = null;
    let editingManualEventId = null;
    let openedManualEventId = null;
    const manualEvents = {
        "2026-3": [
            {
                id: "manual-apr-28-reuniao",
                type: "manual",
                day: 28,
                title: "Reunião com fornecedora",
                tag: "Reunião com fornecedora",
                description: "",
                location: "Rua das Camélias, 145 - Jardim Primavera - São Paulo/SP",
                notes: "Alinhar reposição de estoque e prazo de entrega dos próximos pedidos.",
                noteLabel: "Notas",
                time: "15:30",
                date: "28 Abril 2026 • Terça-feira",
                completed: false
            }
        ]
    };

    const calendarData = {
        "2026-2": {
            events: [
                {
                    id: "mar-03-business",
                    type: "business",
                    day: 5,
                    title: "Campanha do 5º dia útil",
                    tag: "Campanha do dia",
                    description: "Hoje é um ótimo momento para reforçar ofertas de pronta-entrega e kits com ticket médio acessível.",
                    action: "Criar uma campanha rápida com Produto X e enviar para a lista com histórico de compra recorrente."
                },
                {
                    id: "mar-08-holiday",
                    type: "holiday",
                    day: 8,
                    title: "Mês forte de maquiagem",
                    tag: "Comemorativa",
                    description: "Março concentra maior interesse por maquiagem. O momento é favorável para divulgar kits temáticos.",
                    action: "Publicar um conteúdo com o kit X no Instagram e reforçar nos stories com chamada direta para compra."
                },
                {
                    id: "mar-12-formula",
                    type: "formula",
                    day: 12,
                    title: "Rodada 2+2+2",
                    tag: "2+2+2",
                    description: "Dia ideal para retomar três clientes mornas, duas clientes quentes e duas clientes novas.",
                    action: "Separar os nomes com maior chance de conversão e organizar mensagens personalizadas."
                },
                {
                    id: "mar-12-payment",
                    type: "payment",
                    day: 12,
                    title: "Parcela de Kit Glow",
                    tag: "Parcela Kit Glow",
                    description: "Pagamento agendado referente ao pedido parcelado do Kit Glow.",
                    action: "Confirmar recebimento e registrar a baixa financeira no sistema."
                },
                {
                    id: "mar-19-birthday",
                    type: "birthday",
                    day: 19,
                    title: "Aniversário de Juliana Mendes",
                    tag: "Aniversário",
                    description: "Juliana costuma responder bem a abordagens com mimo e cupom em datas especiais.",
                    action: "Enviar parabéns com um cupom exclusivo de aniversário e sugestão de presente pessoal."
                },
                {
                    id: "mar-27-holiday",
                    type: "holiday",
                    day: 27,
                    title: "Aquecimento para kits de maquiagem",
                    tag: "Comemorativa",
                    description: "Última semana do mês com alta aderência a posts de transformação e kits prontos.",
                    action: "Ativar uma sequência de stories antes do fechamento do mês com foco em urgência."
                }
            ],
            summary: [
                {
                    type: "formula",
                    text: "2 rodadas estratégicas do método 2+2+2 no mês",
                    title: "Ações do método 2+2+2",
                    subtitle: "Selecione uma abordagem para abrir os detalhes.",
                    actions: [
                        {
                            type: "formula",
                            title: "Rodada de follow-up",
                            date: "12 Março 2026",
                            description: "Separar clientes mornas e quentes com potencial de compra ainda neste ciclo.",
                            action: "Enviar mensagens curtas com CTA direto e registrar respostas para segunda abordagem."
                        },
                        {
                            type: "formula",
                            title: "Rodada de recuperação",
                            date: "26 Março 2026",
                            description: "Nova tentativa com clientes que engajaram no início do mês e não converteram.",
                            action: "Oferecer condição especial por tempo limitado e reforçar reposição de itens populares."
                        }
                    ]
                },
                {
                    type: "holiday",
                    text: "1 janela comercial forte para maquiagem",
                    title: "Oportunidades comerciais do mês",
                    subtitle: "Aproveite as datas com maior aderência ao catálogo.",
                    actions: [
                        {
                            type: "holiday",
                            title: "Campanha Kit X",
                            date: "08 Março 2026",
                            description: "Maquiagem tende a ter maior saída em março, especialmente entre clientes com histórico de recompra.",
                            action: "Planejar publicação e disparo segmentado com chamada para o kit X."
                        }
                    ]
                }
            ]
        },
        "2026-3": {
            events: [
                {
                    id: "apr-15-birthday",
                    type: "birthday",
                    day: 15,
                    title: "Aniversário de Ana Paula Santos",
                    tag: "Ana Paula",
                    description: "Cliente VIP com bom histórico de recompra. Datas especiais costumam gerar resposta rápida quando há abordagem personalizada.",
                    action: "Enviar uma mensagem de parabéns com sugestão de presente e um desconto exclusivo de aniversário."
                },
                {
                    id: "apr-22-formula",
                    type: "formula",
                    day: 22,
                    title: "Rodada de follow-up 2+2+2",
                    tag: "Follow 2+2+2",
                    description: "Terça à noite é o melhor período de vendas. Vale organizar uma sequência de contato com clientes quentes e recentes.",
                    action: "Abrir a lista de clientes mais engajadas e disparar as mensagens no início da noite."
                },
                {
                    id: "apr-22-payment",
                    type: "payment",
                    day: 22,
                    title: "Recebimento Parcela Pedido #8821",
                    tag: "Parcela #8821",
                    description: "Parcela programada da venda direta de Mariana Silveira.",
                    action: "Conferir o recebimento e, se necessário, enviar lembrete amigável pela manhã."
                },
                {
                    id: "apr-22-holiday",
                    type: "holiday",
                    day: 22,
                    title: "Esquenta para campanha sazonal",
                    tag: "Esquenta",
                    description: "Data útil para iniciar aquecimento da campanha temática do fim do mês.",
                    action: "Publicar teaser com chamada suave e reservar disparo principal para sexta-feira."
                },
                {
                    id: "apr-22-birthday",
                    type: "birthday",
                    day: 22,
                    title: "Aniversário de Carla Mendes",
                    tag: "Carla Mendes",
                    description: "Cliente com bom histórico de resposta a mensagens personalizadas em datas especiais.",
                    action: "Enviar parabéns com uma oferta leve e indicação de produto com perfil aderente ao histórico."
                },
                {
                    id: "apr-25-holiday",
                    type: "holiday",
                    day: 25,
                    title: "Campanha Dia da Beleza",
                    tag: "Dia da Beleza",
                    description: "Data favorável para promover kits de autocuidado e maquiagem com ticket acessível.",
                    action: "Criar uma vitrine temática com Produto X e reforçar nos stories com chamada emocional."
                },
                {
                    id: "apr-27-business",
                    type: "business",
                    day: 27,
                    title: "Ação do 5º dia útil",
                    tag: "Campanha do dia",
                    description: "Quinto dia útil costuma ser um momento de compra rápida. Priorize ofertas simples e de fácil decisão.",
                    action: "Anunciar o Produto X para clientes com maior chance de recompra e pronta resposta."
                },
                {
                    id: "apr-29-birthday",
                    type: "birthday",
                    day: 29,
                    title: "Aniversário de Mariana Silveira",
                    tag: "Mariana",
                    description: "Mariana responde melhor a contato próximo e benefícios por tempo limitado.",
                    action: "Enviar parabéns com condição especial de 10% em itens da wishlist dela."
                },
                {
                    id: "apr-29-payment",
                    type: "payment",
                    day: 29,
                    title: "Vencimento Pedido #8894",
                    tag: "Pedido #8894",
                    description: "Pagamento previsto para uma compra parcelada com vencimento neste dia.",
                    action: "Acompanhar a liquidação e enviar mensagem preventiva caso o valor não seja compensado."
                },
                {
                    id: "apr-30-holiday",
                    type: "holiday",
                    day: 30,
                    title: "Pré Dia das Mães",
                    tag: "Pré Dia das Mães",
                    description: "Último aquecimento antes da campanha principal. Boa oportunidade para montar kits presenteáveis.",
                    action: "Preparar mensagem temática para mães e selecionar itens com boa margem."
                }
            ],
            summary: [
                {
                    type: "formula",
                    text: "1 ação do método 2+2+2 programada",
                    title: "Ações do método 2+2+2",
                    subtitle: "Escolha a ação que deseja revisar.",
                    actions: [
                        {
                            type: "formula",
                            title: "Rodada de follow-up com clientes quentes",
                            date: "22 Abril 2026",
                            description: "Contato direcionado com clientes que demonstraram interesse recente em Produto X e kit básico.",
                            action: "Enviar mensagem objetiva com destaque para urgência e possibilidade de upsell."
                        },
                        {
                            type: "formula",
                            title: "Retomada de clientes mornas",
                            date: "24 Abril 2026",
                            description: "Sequência para clientes que abriram mensagem, mas ainda não responderam.",
                            action: "Fazer segundo toque com argumento de benefício e janela curta de oferta."
                        }
                    ]
                },
                {
                    type: "birthday",
                    text: "2 aniversários de clientes VIP",
                    title: "Ações para aniversários do mês",
                    subtitle: "Abra uma ação para ver o roteiro recomendado.",
                    actions: [
                        {
                            type: "birthday",
                            title: "Ana Paula Santos",
                            date: "15 Abril 2026",
                            description: "Cliente VIP com potencial para compra emocional em datas especiais.",
                            action: "Mandar parabéns com presente sugerido e benefício de aniversário."
                        },
                        {
                            type: "birthday",
                            title: "Mariana Silveira",
                            date: "29 Abril 2026",
                            description: "Cliente com boa taxa de resposta a abordagens personalizadas.",
                            action: "Enviar uma mensagem com desconto de aniversário e sugestão alinhada ao histórico dela."
                        }
                    ]
                },
                {
                    type: "business",
                    text: "1 alerta de 5º dia útil",
                    title: "Ações do 5º dia útil",
                    subtitle: "Priorize campanhas com maior chance de conversão rápida.",
                    actions: [
                        {
                            type: "business",
                            title: "Campanha Produto X",
                            date: "27 Abril 2026",
                            description: "Data estratégica para oferta com foco em decisão simples e recompra.",
                            action: "Acionar a base com Produto X, kits enxutos e pronta-entrega."
                        }
                    ]
                },
                {
                    type: "holiday",
                    text: "2 datas comemorativas no radar",
                    title: "Campanhas comemorativas",
                    subtitle: "Veja as campanhas sazonais preparadas para o mês.",
                    actions: [
                        {
                            type: "holiday",
                            title: "Dia da Beleza",
                            date: "25 Abril 2026",
                            description: "Data temática ideal para impulsionar kits de autocuidado e maquiagem.",
                            action: "Criar storytelling visual e chamada forte para combos e presentes."
                        },
                        {
                            type: "holiday",
                            title: "Pré Dia das Mães",
                            date: "30 Abril 2026",
                            description: "Aquecimento da campanha principal de maio com foco em intenção de compra.",
                            action: "Montar lista de transmissão e conteúdo com apelo emocional."
                        }
                    ]
                }
            ]
        },
        "2026-4": {
            events: [
                {
                    id: "may-05-business",
                    type: "business",
                    day: 5,
                    title: "5º dia útil de maio",
                    tag: "Campanha do dia",
                    description: "Momento ideal para reforçar campanhas de pronta-entrega e itens com recompra rápida.",
                    action: "Disparar oferta do Produto X com CTA direto e prazo curto."
                },
                {
                    id: "may-10-holiday",
                    type: "holiday",
                    day: 10,
                    title: "Dia das Mães",
                    tag: "Dia das Mães",
                    description: "Data forte para kits presenteáveis, perfumes e itens de valor percebido alto.",
                    action: "Enviar mensagem temática com sugestão de presente e combinação de produtos."
                },
                {
                    id: "may-14-birthday",
                    type: "birthday",
                    day: 14,
                    title: "Aniversário de Fernanda Lima",
                    tag: "Fernanda",
                    description: "Cliente com histórico de compra sazonal e boa resposta a benefícios personalizados.",
                    action: "Mandar uma abordagem com parabéns, mimo e incentivo para recompra."
                },
                {
                    id: "may-19-formula",
                    type: "formula",
                    day: 19,
                    title: "Rodada de upsell 2+2+2",
                    tag: "Upsell 2+2+2",
                    description: "Boa oportunidade para converter clientes do kit básico no kit completo.",
                    action: "Priorizar quem comprou recentemente e apresentar o upgrade com condição especial."
                },
                {
                    id: "may-19-payment",
                    type: "payment",
                    day: 19,
                    title: "Cobrança programada Pedido #8940",
                    tag: "Cobrança #8940",
                    description: "Data de cobrança de parcela recorrente cadastrada no sistema.",
                    action: "Verificar o pagamento até o fim do dia e disparar aviso caso haja atraso."
                },
                {
                    id: "may-28-holiday",
                    type: "holiday",
                    day: 28,
                    title: "Fechamento do mês",
                    tag: "Fechamento",
                    description: "Últimos dias para ativar clientes indecisas e aproveitar o giro final do mês.",
                    action: "Criar contagem regressiva para última chamada com itens em destaque."
                }
            ],
            summary: [
                {
                    type: "holiday",
                    text: "2 campanhas sazonais com alto potencial",
                    title: "Campanhas sazonais de maio",
                    subtitle: "Selecione a ação para abrir o plano sugerido.",
                    actions: [
                        {
                            type: "holiday",
                            title: "Dia das Mães",
                            date: "10 Maio 2026",
                            description: "Principal data promocional do período, com alta chance de venda por presente.",
                            action: "Ativar lista com curadoria de kits presenteáveis e linguagem emocional."
                        },
                        {
                            type: "holiday",
                            title: "Fechamento do mês",
                            date: "28 Maio 2026",
                            description: "Janela curta para recuperação de oportunidade e reforço de urgência.",
                            action: "Montar última chamada para clientes que clicaram e não finalizaram compra."
                        }
                    ]
                },
                {
                    type: "formula",
                    text: "1 ação forte de upsell em andamento",
                    title: "Upsells do mês",
                    subtitle: "Abra para ver a abordagem sugerida.",
                    actions: [
                        {
                            type: "formula",
                            title: "Upgrade para kit completo",
                            date: "19 Maio 2026",
                            description: "Clientes que compraram o kit básico estão com maior propensão a ampliar o ticket.",
                            action: "Enviar oferta com desconto progressivo e destaque para valor agregado."
                        }
                    ]
                }
            ]
        }
    };

    function getMonthKey(date) {
        return `${date.getFullYear()}-${date.getMonth()}`;
    }

    function getMonthData(date) {
        const key = getMonthKey(date);
        const baseData = calendarData[key] || { events: [], summary: [] };
        const ownEvents = manualEvents[key] || [];
        return {
            events: [...baseData.events, ...ownEvents],
            summary: baseData.summary
        };
    }

    function formatDisplayDate(date) {
        return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()} • ${weekdayNames[date.getDay()]}`;
    }

    function updateModalState() {
        const isAnyOpen = [detailModal, summaryModal, dayModal, addModal].some((modal) => modal && !modal.hidden);
        document.body.classList.toggle("modal-open", isAnyOpen);
    }

    function closeCalendarModal(modal) {
        if (!modal) {
            return;
        }

        modal.hidden = true;
        updateModalState();
    }

    function openCalendarModal(modal) {
        if (!modal) {
            return;
        }

        modal.hidden = false;
        updateModalState();
    }

    function openDetailModal(item) {
        if (!item || !detailModal) {
            return;
        }

        openedManualEventId = item.type === "manual" ? item.id : null;
        detailType.textContent = typeLabels[item.type] || "Evento";
        detailType.className = `calendar-modal-pill calendar-tag--${item.type}`;
        detailTitle.textContent = item.title;
        if (item.type === "manual" && item.time) {
            const baseDate = item.date || formatDisplayDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), item.day || 1));
            detailDate.innerHTML = `${baseDate} • <strong>${item.time}</strong>`;
        } else {
            detailDate.textContent = item.date || formatDisplayDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), item.day || 1));
        }
        const locationText = item.type === "manual" && item.location ? `Local: ${item.location}` : item.description || "";
        detailDescription.textContent = locationText;
        detailDescription.hidden = !locationText;
        detailAction.textContent = item.notes || item.action || "Sem observações adicionais.";
        if (detailNoteLabel) {
            detailNoteLabel.textContent = item.noteLabel || "Ação recomendada";
        }
        if (relatedActionWrap && relatedActionLink) {
            relatedActionWrap.hidden = true;
            relatedActionLink.textContent = "Ver detalhe";
            relatedActionLink.removeAttribute("href");

            if (item.type === "formula" || item.type === "birthday") {
                relatedActionLink.textContent = "Ver cliente";
                relatedActionLink.setAttribute("href", "./cliente.html");
                relatedActionWrap.hidden = false;
            } else if (item.type === "payment") {
                relatedActionLink.textContent = "Ver compra";
                relatedActionLink.setAttribute("href", "./pedido.html");
                relatedActionWrap.hidden = false;
            }
        }
        if (manualActions) {
            manualActions.hidden = item.type !== "manual";
        }
        if (completeEventButton && item.type === "manual") {
            completeEventButton.textContent = item.completed ? "Reabrir" : "Concluído";
        }
        closeCalendarModal(summaryModal);
        closeCalendarModal(dayModal);
        closeCalendarModal(addModal);
        openCalendarModal(detailModal);
    }

    function findManualEventById(id) {
        for (const [key, events] of Object.entries(manualEvents)) {
            const eventItem = events.find((item) => item.id === id);
            if (eventItem) {
                return { key, eventItem };
            }
        }
        return null;
    }

    function openSummaryModal(summaryItem) {
        if (!summaryItem || !summaryModal || !summaryActionsWrap) {
            return;
        }

        openedSummaryItem = summaryItem;
        summaryTitle.textContent = summaryItem.title;
        summarySubtitle.textContent = summaryItem.subtitle;
        summaryActionsWrap.innerHTML = "";

        summaryItem.actions.forEach((actionItem) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "calendar-agenda-item calendar-summary-action-card";
            const dateParts = String(actionItem.date || "").split(" ");
            const shortDay = dateParts[0] || String(actionItem.day || "").padStart(2, "0");
            const shortMonth = (dateParts[1] || monthNames[currentDate.getMonth()]).slice(0, 3);
            button.innerHTML = `
                <strong>${shortDay} ${shortMonth}</strong>
                <div>
                    <span class="calendar-tag calendar-tag--${actionItem.type}">${typeLabels[actionItem.type] || typeLabels.holiday}</span>
                    <p>${actionItem.title}</p>
                </div>
            `;
            button.addEventListener("click", () => openDetailModal(actionItem));
            summaryActionsWrap.appendChild(button);
        });

        openCalendarModal(summaryModal);
    }

    function openDayModal(day, events) {
        if (!dayModal || !dayActionsWrap || !events.length) {
            return;
        }

        dayTitle.textContent = `Eventos do dia ${String(day).padStart(2, "0")}`;
        daySubtitle.textContent = `Selecione um dos ${events.length} itens para abrir os detalhes.`;
        dayActionsWrap.innerHTML = "";

        events.forEach((eventItem) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "calendar-summary-action calendar-day-action";
            button.innerHTML = `
                <span class="calendar-summary-action-icon">${typeIcons[eventItem.type] || typeIcons.holiday}</span>
                <div>
                    <strong>${eventItem.title}</strong>
                    <span>${typeLabels[eventItem.type]}</span>
                </div>
            `;
            button.addEventListener("click", () => openDetailModal({
                ...eventItem,
                date: formatDisplayDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), eventItem.day))
            }));
            dayActionsWrap.appendChild(button);
        });

        openCalendarModal(dayModal);
    }

    function syncFilterButtons() {
        const allButton = filterButtons.find((button) => button.dataset.calendarFilter === "all");
        const allActive = activeFilters.size === 5;

        filterButtons.forEach((button) => {
            const filter = button.dataset.calendarFilter;
            const isActive = filter === "all" ? allActive : activeFilters.has(filter);
            button.classList.toggle("is-active", isActive);
            button.classList.toggle("is-muted", !isActive);
        });

        if (allButton) {
            allButton.classList.toggle("is-muted", !allActive);
        }
    }

    function createTagButton(eventItem) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `calendar-tag calendar-tag--${eventItem.type}`;
        if (eventItem.completed) {
            button.classList.add("is-completed");
        }
        button.textContent = eventItem.tag;
        button.hidden = !activeFilters.has(eventItem.type);
        button.addEventListener("click", () => openDetailModal({
            ...eventItem,
            date: formatDisplayDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), eventItem.day))
        }));
        return button;
    }

    function renderGrid() {
        const monthData = getMonthData(currentDate);
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const totalCells = Math.ceil((firstDay.getDay() + daysInMonth) / 7) * 7;
        const startDate = new Date(firstDay);
        startDate.setDate(firstDay.getDate() - firstDay.getDay());
        const today = new Date();

        monthLabel.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        grid.innerHTML = "";

        for (let index = 0; index < totalCells; index += 1) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + index);

            const dayCard = document.createElement("article");
            dayCard.className = "calendar-day";

            if (date.getMonth() !== currentDate.getMonth()) {
                dayCard.classList.add("is-muted");
            }

            if (
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear()
            ) {
                dayCard.classList.add("is-today");
            }

            const dayNumber = document.createElement("strong");
            dayNumber.textContent = String(date.getDate());
            dayCard.appendChild(dayNumber);

            if (date.getMonth() === currentDate.getMonth()) {
                const dayEvents = monthData.events.filter((eventItem) => eventItem.day === date.getDate());
                const businessEvents = dayEvents.filter((eventItem) => eventItem.type === "business");
                const visibleEvents = dayEvents.filter((eventItem) => eventItem.type !== "business" && activeFilters.has(eventItem.type));

                businessEvents.forEach(() => {
                    const fixedNote = document.createElement("span");
                    fixedNote.className = "calendar-fixed-note";
                    fixedNote.textContent = "• 5º dia útil";
                    dayCard.appendChild(fixedNote);
                });

                visibleEvents.slice(0, 3).forEach((eventItem) => {
                        dayCard.appendChild(createTagButton(eventItem));
                    });

                if (visibleEvents.length > 3) {
                    const moreButton = document.createElement("button");
                    moreButton.type = "button";
                    moreButton.className = "calendar-day-more";
                    moreButton.textContent = "ver todos";
                    moreButton.addEventListener("click", () => openDayModal(date.getDate(), visibleEvents));
                    dayCard.appendChild(moreButton);
                }
            }

            grid.appendChild(dayCard);
        }
    }

    function renderSummary() {
        const monthData = getMonthData(currentDate);
        summaryList.innerHTML = "";

        monthData.summary.filter((summaryItem) => summaryItem.type !== "business").forEach((summaryItem) => {
            const item = document.createElement("li");
            const button = document.createElement("button");
            button.type = "button";
            button.className = "calendar-summary-button";
            button.innerHTML = `<span class="calendar-dot calendar-dot--${summaryItem.type}"></span>${summaryItem.text}`;
            button.addEventListener("click", () => openSummaryModal(summaryItem));
            item.appendChild(button);
            summaryList.appendChild(item);
        });
    }

    function renderAgenda() {
        const monthData = getMonthData(currentDate);
        agendaList.innerHTML = "";
        const ownEvents = monthData.events
            .filter((eventItem) => eventItem.type === "manual")
            .slice()
            .sort((a, b) => a.day - b.day);

        if (!ownEvents.length) {
            const emptyState = document.createElement("div");
            emptyState.className = "calendar-agenda-empty";
            emptyState.textContent = "Nenhum evento manual cadastrado para este mês.";
            agendaList.appendChild(emptyState);
            return;
        }

        ownEvents.slice(0, 4).forEach((eventItem) => {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "calendar-agenda-item";
            if (eventItem.completed) {
                item.classList.add("is-completed");
            }
            item.innerHTML = `
                <strong>${String(eventItem.day).padStart(2, "0")} ${monthNames[currentDate.getMonth()].slice(0, 3)}</strong>
                <div>
                    <span class="calendar-tag calendar-tag--${eventItem.type}">${typeLabels[eventItem.type]}</span>
                    <p>${eventItem.title}</p>
                </div>
            `;
            item.addEventListener("click", () => openDetailModal({
                ...eventItem,
                date: formatDisplayDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), eventItem.day))
            }));
            agendaList.appendChild(item);
        });
    }

    function renderCalendar() {
        renderGrid();
        renderSummary();
        renderAgenda();
        syncFilterButtons();
        previousButton.disabled = currentDate.getFullYear() === minCalendarDate.getFullYear()
            && currentDate.getMonth() === minCalendarDate.getMonth();
        nextButton.disabled = currentDate.getFullYear() === maxCalendarDate.getFullYear()
            && currentDate.getMonth() === maxCalendarDate.getMonth();
    }

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const filter = button.dataset.calendarFilter;

            if (filter === "all") {
                activeFilters.clear();
                ["formula", "birthday", "payment", "holiday", "manual"].forEach((type) => activeFilters.add(type));
                renderCalendar();
                return;
            }

            if (activeFilters.has(filter)) {
                activeFilters.delete(filter);
            } else {
                activeFilters.add(filter);
            }

            renderCalendar();
        });
    });

    previousButton.addEventListener("click", () => {
        if (
            currentDate.getFullYear() === minCalendarDate.getFullYear()
            && currentDate.getMonth() === minCalendarDate.getMonth()
        ) {
            return;
        }
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        renderCalendar();
    });

    nextButton.addEventListener("click", () => {
        if (
            currentDate.getFullYear() === maxCalendarDate.getFullYear()
            && currentDate.getMonth() === maxCalendarDate.getMonth()
        ) {
            return;
        }
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        renderCalendar();
    });

    document.querySelectorAll("[data-calendar-modal-close]").forEach((button) => {
        button.addEventListener("click", () => {
            closeCalendarModal(detailModal);
            closeCalendarModal(summaryModal);
            closeCalendarModal(dayModal);
            closeCalendarModal(addModal);
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeCalendarModal(detailModal);
            closeCalendarModal(summaryModal);
            closeCalendarModal(dayModal);
            closeCalendarModal(addModal);
        }
    });

    addButton?.addEventListener("click", () => {
        editingManualEventId = null;
        addForm?.reset();
        const now = new Date();
        const dateInput = addForm?.querySelector('[name="date"]');
        if (dateInput) {
            dateInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        }
        const timeInput = addForm?.querySelector('[name="time"]');
        if (timeInput) {
            timeInput.value = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        }
        const title = addModal?.querySelector("h2");
        if (title) {
            title.textContent = "Adicionar Evento";
        }
        const submit = addForm?.querySelector('button[type="submit"]');
        if (submit) {
            submit.textContent = "Salvar Evento";
        }
        openCalendarModal(addModal);
    });

    editEventButton?.addEventListener("click", () => {
        if (!openedManualEventId || !addForm) {
            return;
        }

        const found = findManualEventById(openedManualEventId);

        if (!found) {
            return;
        }

        editingManualEventId = found.eventItem.id;
        addForm.querySelector('[name="description"]').value = found.eventItem.title || "";
        addForm.querySelector('[name="date"]').value = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(found.eventItem.day).padStart(2, "0")}`;
        addForm.querySelector('[name="time"]').value = found.eventItem.time || "09:00";
        addForm.querySelector('[name="location"]').value = found.eventItem.location || "";
        addForm.querySelector('[name="notes"]').value = found.eventItem.notes || "";

        const title = addModal?.querySelector("h2");
        if (title) {
            title.textContent = "Editar Evento";
        }
        const submit = addForm.querySelector('button[type="submit"]');
        if (submit) {
            submit.textContent = "Salvar";
        }

        closeCalendarModal(detailModal);
        openCalendarModal(addModal);
    });

    completeEventButton?.addEventListener("click", () => {
        if (!openedManualEventId) {
            return;
        }

        const found = findManualEventById(openedManualEventId);

        if (!found) {
            return;
        }

        found.eventItem.completed = !found.eventItem.completed;
        closeCalendarModal(detailModal);
        renderCalendar();
    });

    addForm?.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!addForm.reportValidity()) {
            return;
        }

        const formData = new FormData(addForm);
        const description = String(formData.get("description") || "").trim();
        const dateValue = String(formData.get("date") || "");
        const timeValue = String(formData.get("time") || "");
        const location = String(formData.get("location") || "").trim();
        const notes = String(formData.get("notes") || "").trim();
        const eventDate = new Date(`${dateValue}T00:00:00`);
        const key = getMonthKey(eventDate);
        const timeLabel = timeValue || "09:00";
        const baseDate = `${String(eventDate.getDate()).padStart(2, "0")} ${monthNames[eventDate.getMonth()]} ${eventDate.getFullYear()} • ${weekdayNames[eventDate.getDay()]}`;

        if (editingManualEventId) {
            const found = findManualEventById(editingManualEventId);

            if (found) {
                found.eventItem.day = eventDate.getDate();
                found.eventItem.title = description;
                found.eventItem.location = location;
                found.eventItem.notes = notes || "Sem observações adicionais.";
                found.eventItem.time = timeLabel;
                found.eventItem.date = baseDate;

                if (found.key !== key) {
                    manualEvents[found.key] = manualEvents[found.key].filter((item) => item.id !== editingManualEventId);
                    if (!manualEvents[key]) {
                        manualEvents[key] = [];
                    }
                    manualEvents[key].push(found.eventItem);
                }
            }
        } else {
            if (!manualEvents[key]) {
                manualEvents[key] = [];
            }

            manualEvents[key].push({
                id: `manual-${Date.now()}`,
                type: "manual",
                day: eventDate.getDate(),
                title: description,
                tag: description,
                description: "",
                location,
                notes: notes || "Sem observações adicionais.",
                noteLabel: "Notas",
                time: timeLabel,
                date: baseDate,
                completed: false
            });
        }

        editingManualEventId = null;
        currentDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), 1);
        closeCalendarModal(addModal);
        renderCalendar();
    });

    renderCalendar();
}

window.addEventListener("load", () => {
    window.scrollTo(0, 0);
    document.body.classList.add("is-ready");
    updateCurrentMonth();
    updateCurrentYear();
    updateTodayPill();
    setupSidebarToggle();
    setupSidebarSubmenus();
    setupSidebarFooterLinks();
    setupPeriodMenu();
    setupNotificationMenu();
    setupProfileMenu();
    setupProfileImageUpload();
    setupProfileDescriptionEditor();
    setupProfileSectionEditors();
    setupModals();
    setupAccordions();
    setupJourneyFilters();
    setupClientDetailModals();
    setupClientProfileEditor();
    setupClientAccordionEditors();
    setupNewClientForm();
    setupClientPurchaseHistory();
    setupNotesPage();
    setupRowLinks();
    setupReceiptActions();
    setupActionMenus();
    setupClientFilters();
    setupProductFilters();
    setupSalesFilters();
    setupMkOrdersFilters();
    setupMkOrderSortMenu();
    setupMkOrderActions();
    setupMkOrderBuilder();
    setupManualProductAddPage();
    setupNewMkOrderPage();
    setupNewSalePage();
    setupSalesPage();
    setupProductPerformance();
    setupProductStockModal();
    setupFinancePage();
    setupFinanceGainModal();
    setupFinanceTableFilters();
    setupFinanceMonthNav();
    setupInsightsMore();
    setupDashboardPage();
    setupCalendarPage();
    animateProgressBar();
    animatePerformanceBars();
    animateStockBars();
    animateProfileRings();

    document.querySelectorAll("[data-target]").forEach((element) => {
        animateValue(element);
    });
});
