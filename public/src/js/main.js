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
                        <button class="mini-action mini-action--stock" type="button">+ Lista de Pedidos</button>
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
        business: "5º dia útil",
        holiday: "Comemorativa"
    };
    const typeIcons = {
        formula: '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M117.25,157.75a8,8,0,0,1-11.32,0L80,131.88,54.06,157.75a8,8,0,0,1-11.31-11.32L68.69,120,42.75,94.06A8,8,0,0,1,54.06,82.75L80,108.69l25.93-25.94a8,8,0,0,1,11.32,11.31L91.31,120l25.94,25.94A8,8,0,0,1,117.25,157.75Zm96-75a8,8,0,0,0-11.31,0L176,108.69,150.06,82.75a8,8,0,0,0-11.31,11.31L164.69,120l-25.94,25.94a8,8,0,1,0,11.31,11.31L176,131.31l25.94,25.94a8,8,0,0,0,11.31-11.31L187.31,120l25.94-25.94A8,8,0,0,0,213.25,82.75Z"></path></svg>',
        birthday: '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M128,32a40,40,0,1,0,40,40A40,40,0,0,0,128,32Zm76,96H52A20,20,0,0,0,32,148v20a56,56,0,0,0,56,56h80a56,56,0,0,0,56-56V148A20,20,0,0,0,204,128Z"></path></svg>',
        payment: '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M224,56H32A16,16,0,0,0,16,72v112a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V72A16,16,0,0,0,224,56ZM96,152H48a8,8,0,0,1,0-16H96a8,8,0,0,1,0,16Zm112-32H48a8,8,0,0,1,0-16H208a8,8,0,0,1,0,16Z"></path></svg>',
        business: '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M224,56H32A16,16,0,0,0,16,72v40a8,8,0,0,0,8,8H232a8,8,0,0,0,8-8V72A16,16,0,0,0,224,56ZM80,144H32a16,16,0,0,0-16,16v40a16,16,0,0,0,16,16H80a16,16,0,0,0,16-16V160A16,16,0,0,0,80,144Zm144,0H128a16,16,0,0,0-16,16v40a16,16,0,0,0,16,16h96a16,16,0,0,0,16-16V160A16,16,0,0,0,224,144Z"></path></svg>',
        holiday: '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M128,24l24.71,50.08L208,82.38,168,121.35l9.44,55L128,150.32,78.56,176.36,88,121.35,48,82.38l55.29-8.3Z"></path></svg>'
    };
    const activeFilters = new Set(["formula", "birthday", "payment", "business", "holiday"]);
    let currentDate = new Date(2026, 3, 1);
    let openedSummaryItem = null;

    const calendarData = {
        "2026-2": {
            events: [
                {
                    id: "mar-03-business",
                    type: "business",
                    day: 5,
                    title: "Campanha do 5º dia útil",
                    tag: "5º dia útil",
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
                    tag: "5º dia útil",
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
                    tag: "5º dia útil",
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
        return calendarData[getMonthKey(date)] || { events: [], summary: [] };
    }

    function formatDisplayDate(date) {
        return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()} • ${weekdayNames[date.getDay()]}`;
    }

    function updateModalState() {
        const isAnyOpen = [detailModal, summaryModal, dayModal].some((modal) => modal && !modal.hidden);
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

        detailType.textContent = typeLabels[item.type] || "Evento";
        detailType.className = `calendar-modal-pill calendar-tag--${item.type}`;
        detailTitle.textContent = item.title;
        detailDate.textContent = item.date || formatDisplayDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), item.day || 1));
        detailDescription.textContent = item.description;
        detailAction.textContent = item.action;
        closeCalendarModal(summaryModal);
        closeCalendarModal(dayModal);
        openCalendarModal(detailModal);
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
            button.className = "calendar-summary-action";
            button.innerHTML = `
                <span class="calendar-summary-action-icon">${typeIcons[actionItem.type] || typeIcons.holiday}</span>
                <strong>${actionItem.title}</strong>
                <span>${actionItem.date}</span>
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
        const startDate = new Date(firstDay);
        startDate.setDate(firstDay.getDate() - firstDay.getDay());
        const today = new Date();

        monthLabel.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        grid.innerHTML = "";

        for (let index = 0; index < 42; index += 1) {
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
                const visibleEvents = dayEvents.filter((eventItem) => activeFilters.has(eventItem.type));

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

        monthData.summary.forEach((summaryItem) => {
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

        monthData.events.slice().sort((a, b) => a.day - b.day).slice(0, 4).forEach((eventItem) => {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "calendar-agenda-item";
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
    }

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const filter = button.dataset.calendarFilter;

            if (filter === "all") {
                activeFilters.clear();
                ["formula", "birthday", "payment", "business", "holiday"].forEach((type) => activeFilters.add(type));
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
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        renderCalendar();
    });

    nextButton.addEventListener("click", () => {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        renderCalendar();
    });

    document.querySelectorAll("[data-calendar-modal-close]").forEach((button) => {
        button.addEventListener("click", () => {
            closeCalendarModal(detailModal);
            closeCalendarModal(summaryModal);
            closeCalendarModal(dayModal);
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeCalendarModal(detailModal);
            closeCalendarModal(summaryModal);
            closeCalendarModal(dayModal);
        }
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
    setupPeriodMenu();
    setupNotificationMenu();
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
