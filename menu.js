/* 
 * 📄 LOGIQUE DU MENU FLIPBOOK (Maddak)
 * ────────────────────────────────────────────────────────────────
 * Gère l'effet de livre 3D, la superposition des pages (z-index),
 * les interactions tactiles (swipe) pour mobile et le système
 * multilingue complet (FR / EN / DE) avec persistance localStorage.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const pages = [...document.querySelectorAll('.page')];
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const pgind = document.getElementById('pgind');
    const langBtns = document.querySelectorAll('.lang-btn');
    const TOTAL = pages.length;

    let cur = 0;
    let animating = false;
    const transitionTime = 820; // 0.82s
    let currentLang = 'fr';

    /* ── SYSTÈME MULTILINGUE (i18n) ── */

    /**
     * Applique une langue au menu
     * @param {string} lang - 'fr' | 'en' | 'de'
     */
    function setLanguage(lang) {
        if (!window.translations || !window.translations[lang]) {
            console.warn(`[i18n] Langue '${lang}' introuvable, repli sur 'fr'.`);
            lang = 'fr';
        }

        currentLang = lang;
        const dict = window.translations[lang];

        // 1. Mettre à jour l'attribut de langue HTML
        document.documentElement.lang = lang;

        // 2. Mettre à jour le titre du document si disponible
        if (dict["meta.title"]) {
            document.title = dict["meta.title"];
        }

        // 3. Traduire tous les éléments textuels
        document.querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.getAttribute('data-i18n');
            if (dict[key] !== undefined) {
                el.innerHTML = dict[key];
            }
        });

        // 4. Traduire les attributs d'accessibilité (aria-label, title, etc.)
        document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
            const attrDefs = el.getAttribute('data-i18n-attr').split('|');
            attrDefs.forEach((def) => {
                const [attr, key] = def.split(':');
                if (attr && key && dict[key] !== undefined) {
                    el.setAttribute(attr.trim(), dict[key]);
                }
            });
        });

        // 5. Mettre à jour l'état visuel et accessible des boutons de langue
        langBtns.forEach((btn) => {
            const btnLang = btn.getAttribute('data-lang');
            const isActive = btnLang === lang;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        // 6. Sauvegarder dans localStorage
        try {
            localStorage.setItem('maddak-language', lang);
        } catch (e) {
            console.warn('[i18n] Impossible de sauvegarder la langue dans localStorage:', e);
        }

        // 7. Mettre à jour l'indicateur de pagination avec le bon libellé
        syncUI();
    }

    // Gestion des clics sur le sélecteur de langue (avec stopPropagation pour ne pas tourner la page)
    langBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const chosenLang = btn.getAttribute('data-lang');
            if (chosenLang && chosenLang !== currentLang) {
                setLanguage(chosenLang);
            }
        });

        btn.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        }, { passive: true });
    });

    /**
     * Initialise dynamiquement les compteurs de pages intérieurs (ex: 1 / 13 ... 13 / 13).
     */
    function initPageNumbers() {
        const totalInterior = TOTAL - 1;
        pages.forEach((page, idx) => {
            if (idx === 0) return;
            const numEl = page.querySelector('.phd-num');
            if (numEl) {
                numEl.textContent = `${idx} / ${totalInterior}`;
            }
        });
    }

    /**
     * Met à jour l'indicateur de page et l'état des boutons.
     */
    function syncUI() {
        if (pgind) {
            const dict = (window.translations && window.translations[currentLang]) || (window.translations && window.translations.fr);
            const labelKey = `labels.${cur}`;
            const pagePrefix = dict && dict["nav.page"] ? dict["nav.page"] : "Page";
            pgind.textContent = (dict && dict[labelKey]) || `${pagePrefix} ${cur}`;
        }
        if (btnPrev) btnPrev.disabled = cur <= 0;
        if (btnNext) btnNext.disabled = cur >= TOTAL - 1;
    }

    /**
     * Initialise et met à jour la pile physique des pages.
     */
    function updateStacking() {
        pages.forEach((page, i) => {
            page.style.transition = `transform ${transitionTime}ms cubic-bezier(.645, .045, .355, 1)`;
            
            if (i < cur) {
                // PAGES TOURNÉES (à gauche)
                page.classList.add('flipped');
                page.style.zIndex = i + 1;
                page.style.transform = `rotateY(-180deg) translateZ(${(i + 1) * 1}px)`; 
            } else if (i === cur) {
                // PAGE ACTIVE (au-dessus de la pile)
                page.classList.remove('flipped');
                page.style.zIndex = TOTAL + 1;
                page.style.transform = `rotateY(0deg) translateZ(${(TOTAL + 1) * 1}px)`;
            } else {
                // PAGES À VENIR (sous la pile droite)
                page.classList.remove('flipped');
                page.style.zIndex = TOTAL - i;
                page.style.transform = `rotateY(0deg) translateZ(${(TOTAL - i) * 1}px)`;
            }
        });
    }

    /**
     * Avance d'une page
     */
    function next() {
        if (animating) return;

        // ── Dernière page → retour à la couverture ──
        if (cur >= TOTAL - 1) {
            animating = true;
            pages.forEach(p => {
                p.style.transition = 'none';
                p.classList.remove('flipped');
            });
            cur = 0;
            updateStacking();
            syncUI();
            void pages[0].offsetWidth; // Forcer reflow
            pages.forEach(p => {
                p.style.transition = `transform ${transitionTime}ms cubic-bezier(.645, .045, .355, 1)`;
            });
            animating = false;
            return;
        }

        animating = true;
        hideHint();

        const page = pages[cur];
        page.style.zIndex = 200;
        page.style.transform = `rotateY(-180deg) translateZ(60px)`;
        page.classList.add('flipped');
        
        cur++;

        setTimeout(() => {
            updateStacking();
            syncUI();
            animating = false;
        }, transitionTime);
    }

    /**
     * Recule d'une page
     */
    function prev() {
        if (animating || cur <= 0) return;
        animating = true;

        cur--;
        const page = pages[cur];
        
        page.style.zIndex = 200;
        page.style.transform = `rotateY(0deg) translateZ(60px)`;
        page.classList.remove('flipped');
        
        setTimeout(() => {
            updateStacking();
            syncUI();
            animating = false;
        }, transitionTime);
    }

    /**
     * Masque l'indice de glissement au premier clic/swipe
     */
    function hideHint() {
        const hint = document.querySelector('.swipe-hint');
        if (hint) {
            hint.style.opacity = '0';
            setTimeout(() => hint.remove(), 400);
        }
    }

    // Exposer les fonctions globalement pour les onclick du HTML
    window.next = next;
    window.prev = prev;
    window.openBook = next;
    window.setLanguage = setLanguage;

    // Charger la langue sauvegardée ou par défaut 'fr'
    let initialLang = 'fr';
    try {
        const saved = localStorage.getItem('maddak-language');
        if (saved && (saved === 'fr' || saved === 'en' || saved === 'de')) {
            initialLang = saved;
        }
    } catch (e) {
        console.warn('[i18n] Erreur lecture localStorage:', e);
    }

    // Initialisation
    setLanguage(initialLang);
    initPageNumbers();
    updateStacking();
    syncUI();

    /* ── GESTION TACTILE (Swipe) ── */
    let startX = 0;
    let startY = 0;

    document.addEventListener('touchstart', (e) => {
        if (e.target.closest('#langSelector')) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (e.target.closest('#langSelector')) return;
        const diffX = startX - e.changedTouches[0].clientX;
        const diffY = startY - e.changedTouches[0].clientY;
        
        // Détecte un swipe horizontal net (> 50px et plus horizontal que vertical)
        if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
            if (diffX > 0) next(); // Vers la gauche = suivant
            else prev();           // Vers la droite = précédent
        }
    }, { passive: true });

    /* ── REDIMENSIONNEMENT RÉACTIF ── */
    const root = document.documentElement;
    function resizeBook() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        
        // Calcul des dimensions idéales (Ratio 2/3)
        const availW = vw - 32;
        const availH = vh - Math.min(Math.max(80, vh * 0.12), 120);
        
        let maxWidth = 400;
        if (vw >= 1440) maxWidth = 500;
        if (vw >= 1920) maxWidth = 580;
        
        let width = Math.min(Math.floor(availH * 0.66), availW, maxWidth);
        
        if (vw < 480) width = Math.max(width, Math.min(vw - 20, 320));
        
        const height = Math.floor(width * 1.5);
        
        root.style.setProperty('--pw', `${width}px`);
        root.style.setProperty('--ph', `${height}px`);
    }

    window.addEventListener('resize', resizeBook);
    resizeBook();

    /* ── ACCESSIBILITÉ CLAVIER ── */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === ' ') next();
        if (e.key === 'ArrowLeft') prev();
    });

    // Empêcher le scroll élastique sur iOS à l'intérieur du livre
    document.addEventListener('touchmove', (e) => {
        if (e.target.closest('#book') && !e.target.closest('#langSelector')) {
            e.preventDefault();
        }
    }, { passive: false });
});
