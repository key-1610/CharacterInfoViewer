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
                customizeHeaderTitle();
                highlightCurrentNav();
            }
        })
        .catch(error => console.error(`Failed to load component from ${path}:`, error));
}

function customizeHeaderTitle() {
    const titleElement = document.querySelector("#header-container .page-title");
    if (!titleElement) return;

    const path = window.location.pathname;
    const currentPage = path.substring(path.lastIndexOf("/") + 1);

    if (currentPage === "" || currentPage === "index.html") {
        titleElement.textContent = "Character Info Viewer - CoC6版";
    } else if (currentPage === "coc7.html") {
        titleElement.textContent = "Character Info Viewer - CoC7版";
    } else {
        titleElement.textContent = "Character Info Viewer";
    }
}

function highlightCurrentNav() {
    const path = window.location.pathname;
    const currentPage = path.substring(path.lastIndexOf("/") + 1);

    const navMap = {
        "": "nav-coc6",
        "index.html": "nav-coc6",
        "coc7.html": "nav-coc7"
    };

    const activeId = navMap[currentPage];
    if (activeId) {
        const activeLink = document.getElementById(activeId);
        if (activeLink) {
            activeLink.classList.add("active");
        }
    }
}
