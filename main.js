// main.js

document.addEventListener('DOMContentLoaded', () => {
    const browseBtn = document.getElementById('browseBtn');
    const generateBtn = document.getElementById('generateBtn');

    // If these elements exist on the current page, add click listeners
    if (browseBtn) {
        browseBtn.addEventListener('click', () => {
            window.location.href = '/browse.html';
        });
    }

    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            window.location.href = '/login.html';
        });
    }
});
