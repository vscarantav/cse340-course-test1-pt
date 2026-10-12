import { DomWatcher, initJamsEdu } from './jamsedu/index.js';
import './jamsedu/site-search.js';
import SiteChrome from './site-chrome.js';

/**
 * Change settings here; only add keys you care about. Everything else uses `defaultJamsEduConfig`
 * from `jamsedu/index.js`. Use `false` to turn a loader off (for example `katex: false`).
 *
 * @type {import('./jamsedu/index.js').JamsEduConfig}
 */
const jamsEduConfig = {
    // katex: false,
    // katex: { version: '0.16.11' },
    // mermaid: { version: '11.4.0', theme: 'dark' },
    // embedPdf: { minZoom: 0.5, maxZoom: 4, fullscreenProxy: false }
};

initJamsEdu(jamsEduConfig);
SiteChrome.start();

/**
 * `DomWatcher` is also on `window`; see `dom-watcher.js`.
 *
 * Example:
 *   DomWatcher.watch('.my-element', (element) => { console.log(element); });
 */
export { DomWatcher };
