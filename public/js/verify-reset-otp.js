const boxes = document.querySelectorAll('input[name="otpBox"]');
  const hiddenInput = document.getElementById('otp-hidden');

  boxes.forEach((box, i) => {
    box.addEventListener('input', () => {
      if (box.value.length === 1 && i < boxes.length - 1) {
        boxes[i + 1].focus();
      }
      updateHiddenOtp();
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && i > 0) {
        boxes[i - 1].focus();
      }
    });
  });

  function updateHiddenOtp() {
    hiddenInput.value = Array.from(boxes).map(b => b.value).join('');
  }

  updateHiddenOtp();

  // Timer logic with sessionStorage
  const timerEl = document.getElementById('timer');
  let remaining = sessionStorage.getItem('resetOtpTimer') ? parseInt(sessionStorage.getItem('resetOtpTimer')) : 600;

  const countdown = setInterval(() => {
    const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
    const seconds = String(remaining % 60).padStart(2, '0');
    timerEl.textContent = `${minutes}:${seconds}`;
    remaining--;

    sessionStorage.setItem('resetOtpTimer', remaining);

    if (remaining < 0) {
      clearInterval(countdown);
      sessionStorage.removeItem('resetOtpTimer');
      alert('OTP expired. Please try again.');
      window.location.href = '/auth/forgot-password';
    }
  }, 1000);

  window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('resetOtpTimer', remaining);
  });