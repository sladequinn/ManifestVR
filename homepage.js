document.addEventListener('DOMContentLoaded', () => {
  const browseBtn = document.getElementById('browseBtn');
  const generateBtn = document.getElementById('generateBtn');

  if (browseBtn) {
    browseBtn.addEventListener('click', () => {
      // Navigate to the viewer page directly for now
      // or if you have a browse page, go there
      window.location.href = '/viewer.html';
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      // Eventually you’ll lead to a login page, but for now just show viewer
      window.location.href = '/viewer.html';
    });
  }
});
