export function getTagIconSvg() {
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
  <path d="M20.59 13.41L10.59 3.41C10.21 3.03 9.7 2.83 9.17 2.83H4C2.9 2.83 2 3.73 2 4.83V10C2 10.53 2.21 11.04 2.59 11.41L12.59 21.41C13.37 22.19 14.63 22.19 15.41 21.41L20.59 16.24C21.37 15.46 21.37 14.2 20.59 13.41ZM7 7.83C6.45 7.83 6 7.38 6 6.83C6 6.28 6.45 5.83 7 5.83C7.55 5.83 8 6.28 8 6.83C8 7.38 7.55 7.83 7 7.83Z"/>
</svg>`.trim();
}

export function getCopyIconSvg() {
    return `
<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14
             c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
</svg>`.trim();
}

export function getPlayIconSvg() {
    return `
<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
</svg>`.trim();
}

export function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

export function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}