/* 
 * 📄 LOGIQUE DU MENU FLIPBOOK (Maddak)
 * ────────────────────────────────────────────────────────────────
 * Gère l'effet de livre 3D, la superposition des pages (z-index)
 * et les interactions tactiles (swipe) pour mobile.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const pages = [...document.querySelectorAll('.page')];
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const pgind = document.getElementById('pgind');
    const TOTAL = pages.length;
    
    // Libellés des pages pour l'indicateur
    const LABELS = [
        'Couverture', 
        "Smash & Philly's", 
        'Gourmets 1/2', 
        'Gourmets 2/2',
        'Assiettes', 
        'Bowls & Salades', 
        'Desserts', 
        'Boissons', 
        'Fin'
    ];

    let cur = 0;
    let animating = false;
    const transitionTime = 820; // 0.82s

    /**
     * Met à jour l'indicateur de page et l'état des boutons.
     */
    function syncUI() {
        // Indicateur texte
        if (pgind) {
            pgind.textContent = LABELS[cur] || `Page ${cur}`;
        }
        // Boutons prev / next
        if (btnPrev) btnPrev.disabled = cur <= 0;
        if (btnNext) btnNext.disabled = cur >= TOTAL - 1;
    }

    /**
     * Initialise et met à jour la pile physique des pages.
     * Pour éviter l'effritement (Z-fighting), chaque page est décalée 
     * sur l'axe Z (profondeur) d'une valeur unique.
     */
    function updateStacking() {
        pages.forEach((page, i) => {
            // Configuration de base
            page.style.transition = `transform ${transitionTime}ms cubic-bezier(.645, .045, .355, 1)`;
            
            if (i < cur) {
                // PAGES TOURNÉES (à gauche)
                page.classList.add('flipped');
                page.style.zIndex = i + 1;
                // Écart Z plus grand (1px par page) pour éviter le Z-fighting mobile
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
            // Désactiver les transitions pour un reset instantané
            pages.forEach(p => {
                p.style.transition = 'none';
                p.classList.remove('flipped');
            });
            cur = 0;
            updateStacking();
            syncUI();
            // Forcer le reflow puis réactiver les transitions
            void pages[0].offsetWidth;
            pages.forEach(p => {
                p.style.transition = `transform ${transitionTime}ms cubic-bezier(.645, .045, .355, 1)`;
            });
            animating = false;
            return;
        }

        animating = true;
        hideHint();

        const page = pages[cur];
        
        // 1. On donne un élan Z pour que la page "survole" le livre pendant le pliage
        page.style.zIndex = 200;
        page.style.transform = `rotateY(-180deg) translateZ(60px)`;
        page.classList.add('flipped');
        
        cur++;

        // 2. Une fois le pliage fini, on remet tout au propre
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
        
        // 1. On "tire" la page vers le haut en Z pour qu'elle survole le retour
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

    // Exposer les fonctions globalement pour les onclick du HTML (si conservés)
    window.next = next;
    window.prev = prev;
    window.openBook = next;

    // Initialisation
    updateStacking();
    syncUI();

    /* ── GESTION TACTILE (Swipe) ── */
    let startX = 0;
    let startY = 0;

    document.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        const diffX = startX - e.changedTouches[0].clientX;
        const diffY = startY - e.changedTouches[0].clientY;
        
        // Détecte un swipe horizontal net (> 50px et plus horizontal que vertical)
        if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
            if (diffX > 0) next(); // Vers la gauche = suivant
            else prev();           // Vers la droite = précédent
        }
    }, { passive: true });

    /* ── REDIMENTIONNEMENT RÉACTIF ── */
    const root = document.documentElement;
    function resizeBook() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        
        // Calcul des dimensions idéales (Ratio 2/3)
        const availW = vw - 32;
        const availH = vh - Math.min(Math.max(80, vh * 0.12), 120); // Espace adaptatif pour la navigation
        
        // Calcul de la largeur max selon le profil d'écran
        let maxWidth = 400;
        if (vw >= 1440) maxWidth = 500; // Plus grand sur moniteur PC
        if (vw >= 1920) maxWidth = 580; // Très grand sur 4K/UHD
        
        let width = Math.min(Math.floor(availH * 0.66), availW, maxWidth);
        
        // Assure que le livre n'est pas trop petit sur mobile
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

    // Empêcher le scroll élastique sur iOS
    document.addEventListener('touchmove', (e) => {
        if (e.target.closest('#book')) e.preventDefault();
    }, { passive: false });
});
