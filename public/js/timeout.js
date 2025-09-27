// Timeout for flash messages disappearing after 3 secs of getting displayed
setTimeout(() => {
  const alert = document.querySelector('.alert');
  if (alert) {
    alert.style.transition = 'opacity 0.5s ease';
    alert.style.opacity = '0';
    setTimeout(() => alert.remove(), 500);
  }
}, 3000);