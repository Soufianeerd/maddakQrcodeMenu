/**
 * 📄 LOGIQUE DU MENU MADDAK (Vertical Scroll & Multilingue)
 * ────────────────────────────────────────────────────────────────
 * - Défilement vertical 100% natif plein écran.
 * - Sélecteur déroulant de catégories interactif : [ Burgers ▾ ].
 * - Mise à jour automatique de la catégorie affichée lors du scroll.
 * - Système multilingue temps réel (FR / EN / DE / AR) sans rechargement.
 * - Bascule RTL automatique pour la langue arabe.
 * - Notification toast de bienvenue de 3 secondes à chaque changement de langue.
 * - Persistance du choix de langue via localStorage.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const langBtns = document.querySelectorAll('.lang-btn');
    const toast = document.getElementById('toast');
    const sections = document.querySelectorAll('.menu-section, .hero-cover, .section-divider');

    const dropdown = document.getElementById('categoryDropdown');
    const dropdownBtn = document.getElementById('categoryDropdownBtn');
    const dropdownLabel = document.getElementById('currentCategoryLabel');
    const dropdownItems = document.querySelectorAll('.category-dropdown-item');

    let currentLang = 'fr';
    let currentCategoryKey = 'nav.burgers';
    let toastTimeout = null;

    // Correspondance entre les IDs de sections et les clés de traduction des catégories
    const sectionCatMap = {
        'hero': 'nav.burgers',
        'burgers': 'nav.burgers',
        'assiettes': 'nav.assiettes',
        'sides-bowls': 'nav.bowls',
        'desserts': 'nav.desserts',
        'cocktails': 'nav.cocktails',
        'boissons': 'nav.boissons',
        'cafes': 'nav.cafes'
    };

    /* ── 1. GESTION DES NOTIFICATIONS TOAST (3 SECONDES) ── */
    function showWelcomeToast(lang) {
        if (!toast) return;

        const dict = (window.translations && window.translations[lang]) || {};
        const message = dict["toast.welcome"] || "Bienvenue chers amis";

        toast.textContent = message;
        toast.classList.add('show');

        if (toastTimeout) {
            clearTimeout(toastTimeout);
        }

        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    /* ── 2. MENU DÉROULANT DES CATÉGORIES [ Burger ▾ ] ── */
    function toggleDropdown(forceState) {
        if (!dropdown) return;
        const willOpen = (forceState !== undefined) ? forceState : !dropdown.classList.contains('open');
        dropdown.classList.toggle('open', willOpen);
        if (dropdownBtn) {
            dropdownBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        }
    }

    if (dropdownBtn) {
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown();
        });
    }

    // Fermer le menu déroulant si on clique en dehors
    document.addEventListener('click', (e) => {
        if (dropdown && !dropdown.contains(e.target)) {
            toggleDropdown(false);
        }
    });

    // Fermer avec la touche Échap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            toggleDropdown(false);
        }
    });

    /**
     * Définit la catégorie active dans le bouton [ Catégorie ▾ ]
     */
    function setActiveCategory(catKey) {
        currentCategoryKey = catKey;
        const dict = (window.translations && window.translations[currentLang]) || {};

        if (dropdownLabel) {
            dropdownLabel.setAttribute('data-i18n', catKey);
            dropdownLabel.textContent = dict[catKey] || 'Burgers';
        }

        dropdownItems.forEach((item) => {
            const itemKey = item.querySelector('[data-i18n]')?.getAttribute('data-i18n');
            const isActive = (itemKey === catKey);
            item.classList.toggle('active', isActive);
            item.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
    }

    // Clic sur un élément du menu déroulant
    dropdownItems.forEach((item) => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const itemKey = this.querySelector('[data-i18n]')?.getAttribute('data-i18n') || 'nav.burgers';

            setActiveCategory(itemKey);
            toggleDropdown(false);

            if (targetId && targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const navHeight = document.querySelector('.floating-nav')?.offsetHeight || 60;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - navHeight;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    /* ── 3. SYSTÈME MULTILINGUE (i18n) AVEC RTL POUR ARABE ── */
    function setLanguage(lang, triggerToast = true) {
        if (!window.translations || !window.translations[lang]) {
            console.warn(`[i18n] Langue '${lang}' non disponible, repli sur 'fr'.`);
            lang = 'fr';
        }

        currentLang = lang;
        const dict = window.translations[lang];

        // 1. Définir la langue et la direction du document (RTL pour Arabe)
        document.documentElement.lang = lang;
        document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

        // 2. Mettre à jour le titre du document
        if (dict["meta.title"]) {
            document.title = dict["meta.title"];
        }

        // 3. Traduire tous les éléments avec l'attribut data-i18n
        document.querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.getAttribute('data-i18n');
            if (dict[key] !== undefined) {
                el.innerHTML = dict[key];
            }
        });

        // 4. Traduire les attributs d'accessibilité (aria-label, title...)
        document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
            const attrDefs = el.getAttribute('data-i18n-attr').split('|');
            attrDefs.forEach((def) => {
                const [attr, key] = def.split(':');
                if (attr && key && dict[key.trim()] !== undefined) {
                    el.setAttribute(attr.trim(), dict[key.trim()]);
                }
            });
        });

        // 5. Mettre à jour l'étiquette de la catégorie courante dans le bouton déroulant
        if (dropdownLabel && dict[currentCategoryKey]) {
            dropdownLabel.textContent = dict[currentCategoryKey];
        }

        // 6. Mettre à jour l'état actif des boutons de langue
        langBtns.forEach((btn) => {
            const btnLang = btn.getAttribute('data-lang');
            const isActive = (btnLang === lang);
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        // 7. Sauvegarder dans localStorage
        try {
            localStorage.setItem('maddak-language', lang);
        } catch (e) {
            console.warn('[i18n] Sauvegarde localStorage impossible:', e);
        }

        // 8. Afficher la notification de bienvenue (3 secondes)
        if (triggerToast) {
            showWelcomeToast(lang);
        }
    }

    // Écoute des clics sur les boutons de langue
    langBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const chosenLang = btn.getAttribute('data-lang');
            if (chosenLang) {
                setLanguage(chosenLang, true);
            }
        });
    });

    /* ── 4. CHARGEMENT DE LA LANGUE INITIALE ── */
    function initLanguage() {
        let savedLang = null;
        try {
            savedLang = localStorage.getItem('maddak-language');
        } catch (e) {
            savedLang = null;
        }

        if (savedLang && window.translations && window.translations[savedLang]) {
            setLanguage(savedLang, false);
        } else {
            const browserLang = (navigator.language || 'fr').slice(0, 2).toLowerCase();
            const initialLang = (window.translations && window.translations[browserLang]) ? browserLang : 'fr';
            setLanguage(initialLang, false);
        }
    }

    /* ── 5. SUIVI DE LA SECTION ACTIVE LORS DU SCROLL (MAJ DU BOUTON DÉROULANT) ── */
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    if (id && sectionCatMap[id]) {
                        setActiveCategory(sectionCatMap[id]);
                    }
                }
            });
        }, observerOptions);

        sections.forEach((sec) => observer.observe(sec));
    }

    /* ── 6. SCROLL FLUIDE PERSONNALISÉ POUR LES ANCRES RESTANTES ── */
    document.querySelectorAll('a[href^="#"]:not(.category-dropdown-item)').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    const navHeight = document.querySelector('.floating-nav')?.offsetHeight || 60;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - navHeight;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Lancement
    initLanguage();
});
