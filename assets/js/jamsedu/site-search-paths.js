/**
 * Derives the deploy base path from the URL used to load `sitemap.json`.
 *
 * @param {string} sitemapUrl Absolute URL of the loaded sitemap file
 * @returns {string} Base path with leading slash (e.g. `/repo-name`), or empty at site root
 */
export const siteBasePathFromSitemapUrl = (sitemapUrl) => {
    let url;
    try {
        url = new URL(sitemapUrl);
    } catch {
        return '';
    }
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length === 0 || parts[parts.length - 1] !== 'sitemap.json') {
        return '';
    }
    const dirParts = parts.slice(0, -1);
    if (dirParts.length === 0) {
        return '';
    }
    return `/${dirParts.join('/')}`;
};

/**
 * Resolves a sitemap page path for use as a result link on subdirectory hosts.
 *
 * @param {string} storedPath Path from `sitemap.json` (usually `/features/page.html`)
 * @param {string} siteBasePath Deploy base from {@link siteBasePathFromSitemapUrl}
 * @returns {string} Pathname suitable for an anchor `href`
 */
export const resolveSiteResultHref = (storedPath, siteBasePath) => {
    const raw = typeof storedPath === 'string' ? storedPath.trim() : '';
    if (!raw) {
        return '/';
    }
    const pathPart = raw.startsWith('/') ? raw : `/${raw}`;
    const baseRaw = typeof siteBasePath === 'string' ? siteBasePath.trim() : '';
    const normalizedBase = baseRaw === '/' ? '' : baseRaw.replace(/\/+$/u, '');
    if (!normalizedBase) {
        return pathPart.replace(/\/{2,}/g, '/');
    }
    if (pathPart === normalizedBase || pathPart.startsWith(`${normalizedBase}/`)) {
        return pathPart.replace(/\/{2,}/g, '/');
    }
    return `${normalizedBase}${pathPart}`.replace(/\/{2,}/g, '/');
};
