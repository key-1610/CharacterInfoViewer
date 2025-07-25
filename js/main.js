// import * as utility from './utility.js';

window.addEventListener("DOMContentLoaded", () => {
    ["header", "footer"].forEach(section =>
        loadComponent(`components/${section}.html`, `${section}-container`)
    );
});

function loadComponent(path, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container with ID "${containerId}" not found.`);
        return;
    }

    fetch(path)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            container.innerHTML = html;
            
            if (containerId === "header-container") {
                initMenuModal();
            }
        })
        .catch(error => console.error(`Failed to load component from ${path}:`, error));
}

function initMenuModal() {
    const menuToggle = document.getElementById("menuToggle");
    const menuModal = document.getElementById("menuModal");

    if (!menuToggle || !menuModal) return;

    menuToggle.addEventListener("click", () => {
        menuModal.style.display = "block";
    });

    window.addEventListener("click", (event) => {
        if (event.target === menuModal) {
            menuModal.style.display = "none";
        }
    });
}
