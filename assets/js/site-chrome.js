import './jamsedu/dom-watcher.js';

/**
 * Header chrome: open-menu min-height, footer height once, theme menu, breadcrumbs. Course `main.css`
 * uses `--jams-page-scroll-height` and may read `--jams-site-footer-px-once` on `html`.
 */

class SiteChrome {

    static #instance = null;

    static #MENU_MIN_VAR = '--jams-page-scroll-height';
    static #MENU_OPEN_ATTR = 'data-site-menu-open';
    static #FOOTER_H_VAR = '--jams-site-footer-px-once';

    #bootStarted = false;

    /** Footer height in px (first time we see it). */
    #siteFooterHOncePx = 0;

    static #get() {
        if (SiteChrome.#instance === null) {
            SiteChrome.#instance = new SiteChrome();
        }
        return SiteChrome.#instance;
    }

    /** Call once; safe to call again, does nothing. */
    static start() {
        const sc = SiteChrome.#get();
        if (sc.#bootStarted) {
            return;
        }
        sc.#bootStarted = true;
        sc.#install();
    }

    #install() {
        const w = window.DomWatcher;
        if (!w) {
            return;
        }
        w.watch('body > .content-grid > footer', (footer) => {
            this.#onFooterFirstSeen(footer);
        });
        w.watch(
            '#site-nav-toggle',
            (toggle) => {
                if (!(toggle instanceof HTMLInputElement)) {
                    return;
                }
                this.#bindNavOpenMinHeight(toggle);
            }
        );
        w.watch(
            '.theme-menu',
            (elem) => {
                if (!(elem instanceof HTMLDetailsElement)) {
                    return;
                }
                this.#bindThemeMenu(elem);
            },
            500
        );
        SiteChrome.syncBreadcrumbs();
        window.addEventListener('hashchange', () => {
            SiteChrome.syncBreadcrumbs();
        });
    }

    #onFooterFirstSeen(footer) {
        const h = Math.round(footer.getBoundingClientRect().height);
        this.#siteFooterHOncePx = h;
        document.documentElement.style.setProperty(SiteChrome.#FOOTER_H_VAR, `${h}px`);
    }

    /** Theme: save pick; close on pick, outside click, or panel (not icons or summary). */
    #bindThemeMenu(details) {
        const labels = details.querySelectorAll('label.theme-control');
        labels.forEach((label) => {
            label.addEventListener('click', (evt) => {
                evt.preventDefault();
                try {
                    localStorage.setItem('theme-preference', label.dataset.themePick);
                } catch {
                    /* ignore */
                }
                const input = label.querySelector('input');
                if (input) {
                    input.checked = true;
                }
                details.open = false;
            });
        });
        const closeIfNotPick = (evt) => {
            if (!details.open) {
                return;
            }
            const t = evt.target;
            if (!(t instanceof Element)) {
                return;
            }
            if (t.closest('label.theme-pick')) {
                return;
            }
            if (t.closest('summary')) {
                return;
            }
            details.open = false;
        };
        document.addEventListener('click', closeIfNotPick, true);
    }

    #bindNavOpenMinHeight = (toggle) => {
        const root = document.documentElement;
        let lastRoundedPx = -1;
        let roDebounce = 0;
        /** @type {number | null} */
        let openScrollH0 = null;
        /** @type {number | null} */
        let openNavH0 = null;

        const clear = () => {
            lastRoundedPx = -1;
            openScrollH0 = null;
            openNavH0 = null;
            root.removeAttribute(SiteChrome.#MENU_OPEN_ATTR);
            root.style.removeProperty(SiteChrome.#MENU_MIN_VAR);
        };

        const captureOpenBaseline = () => {
            const nav = document.querySelector('.site-primary-nav');
            if (!nav) {
                return;
            }
            lastRoundedPx = -1;
            openScrollH0 = root.scrollHeight;
            openNavH0 = nav.getBoundingClientRect().height;
        };

        const applyFromStoredBaseline = () => {
            if (!toggle.checked || openScrollH0 === null || openNavH0 === null) {
                return;
            }
            const nav = document.querySelector('.site-primary-nav');
            if (!nav) {
                return;
            }
            const navNow = nav.getBoundingClientRect().height;
            const footerH = this.#siteFooterHOncePx;
            const next = openScrollH0 + (navNow - openNavH0) + footerH;
            const nextRounded = Math.round(next);
            if (nextRounded === lastRoundedPx) {
                root.setAttribute(SiteChrome.#MENU_OPEN_ATTR, '');
                return;
            }
            lastRoundedPx = nextRounded;
            root.setAttribute(SiteChrome.#MENU_OPEN_ATTR, '');
            root.style.setProperty(SiteChrome.#MENU_MIN_VAR, `${nextRounded}px`);
        };

        const afterOpenLayout = () => {
            root.style.removeProperty(SiteChrome.#MENU_MIN_VAR);
            void root.offsetHeight;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    captureOpenBaseline();
                    applyFromStoredBaseline();
                });
            });
        };

        const scheduleNavDelta = () => {
            if (!toggle.checked) {
                return;
            }
            window.clearTimeout(roDebounce);
            roDebounce = window.setTimeout(() => {
                requestAnimationFrame(() => {
                    applyFromStoredBaseline();
                });
            }, 50);
        };

        const rebaseBaselineForResize = () => {
            if (!toggle.checked) {
                return;
            }
            afterOpenLayout();
        };

        toggle.addEventListener('change', () => {
            if (!toggle.checked) {
                clear();
                return;
            }
            afterOpenLayout();
        });

        window.addEventListener('resize', rebaseBaselineForResize, { passive: true });

        if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(() => {
                scheduleNavDelta();
            });
            const navEl = document.querySelector('.site-primary-nav');
            if (navEl) {
                ro.observe(navEl);
            }
        }

        if (toggle.checked) {
            afterOpenLayout();
        }
    };

    /** Path like `/unit/3/...` → `unit/3`, or null. */
    static segmentKeyFromPathname(pathname) {
        const p = pathname.replace(/\/+$/, '');
        const m = p.match(/\/(unit|module|week)\/(\d+)(?:\/.*)?$/);
        return m ? `${m[1]}/${m[2]}` : null;
    }

    /** Hash like `#unit-2` → `unit/2`, or null. */
    static segmentKeyFromHash() {
        const m = location.hash.replace(/^#/, '').match(/^(unit|module|week)-(\d+)$/);
        return m ? `${m[1]}/${m[2]}` : null;
    }

    /** Mark the matching breadcrumb link (or home on the index). */
    static syncBreadcrumbs() {
        const links = document.querySelectorAll('.course-breadcrumbs a');
        if (links.length === 0) {
            return;
        }

        links.forEach((anchor) => {
            anchor.removeAttribute('aria-current');
        });

        const currentKey =
            SiteChrome.segmentKeyFromPathname(location.pathname) || SiteChrome.segmentKeyFromHash();
        if (currentKey) {
            links.forEach((anchor) => {
                const href = anchor.getAttribute('href');
                if (!href || href.startsWith('#')) {
                    return;
                }
                try {
                    const url = new URL(href, location.href);
                    const key = SiteChrome.segmentKeyFromPathname(url.pathname);
                    if (key && key === currentKey) {
                        anchor.setAttribute('aria-current', 'page');
                    }
                } catch {
                    /* ignore invalid href */
                }
            });
            return;
        }

        const path = location.pathname;
        const onCourseHome = path === '/' || path === '/index.html';

        if (onCourseHome) {
            document.querySelectorAll('.course-breadcrumbs a[aria-label="Home"]').forEach((anchor) => {
                anchor.setAttribute('aria-current', 'page');
            });
        }

    }

}

export default SiteChrome;
