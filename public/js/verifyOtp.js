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

  // Timer persistence using sessionStorage
  const timerEl = document.getElementById('timer');
  let remaining = sessionStorage.getItem('signupOtpTimer') ? parseInt(sessionStorage.getItem('signupOtpTimer')) : 600;

  const countdown = setInterval(() => {
    const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
    const seconds = String(remaining % 60).padStart(2, '0');
    timerEl.textContent = `${minutes}:${seconds}`;
    remaining--;

    sessionStorage.setItem('signupOtpTimer', remaining);

    if (remaining < 0) {
      clearInterval(countdown);
      sessionStorage.removeItem('signupOtpTimer');
      alert('OTP expired. Please sign up again.');
      window.location.href = '/signup';
    }
  }, 1000);

  window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('signupOtpTimer', remaining);
  });

  // Resend OTP countdown
  const resendBtn = document.getElementById('resendBtn');
  const resendTimer = document.getElementById('resendTimer');
  const resendForm = document.getElementById('resendForm');
  let resendCooldown = 30;

  const resendCountdown = setInterval(() => {
    resendCooldown--;
    resendTimer.textContent = resendCooldown;
    if (resendCooldown <= 0) {
      clearInterval(resendCountdown);
      resendBtn.disabled = false;
      resendBtn.textContent = 'Resend OTP';
    }
  }, 1000);

  resendBtn.addEventListener('click', () => {
    resendForm.submit();
  });
