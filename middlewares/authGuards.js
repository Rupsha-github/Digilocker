// to block already logged in users from accessing login and signup paths
export const isLoggedIn = (req, res, next) => {
  // console.log("isLoggedIn middleware triggered. Session userId:", req.session.userId);
  if (req.session.userId) {
    req.flash('error', 'You are already logged in.');
    return res.redirect('/'); // redirecting to home
  }
  next();
};

export const ensureLoggedIn = (req, res, next) => {
  if (!req.session.userId) {
    req.flash('error', 'You are not yet logged in.');
    return req.session.save(() => res.redirect('/login'));
  }
  next();
};

// to block unauthenticated users from accessing dashboard and logout paths
export const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    req.flash('error', 'Please log in to continue.');
    return res.redirect('/login');
  }
  next();
};

// to block non-registered users fromm accessing email verification via otp or resend otp routes
export function requirePendingUser(req, res, next) {
  if (!req.session.pendingUser) {
    return res.redirect('/auth/signup');
  }
  next();
}

// to block users from directly accessing otp verification route for forgot password
export function requireResetSession(req, res, next) {
  const { resetOtp, resetEmail, resetExpires } = req.session;
  if (!resetOtp || !resetEmail || Date.now() > resetExpires) {
    req.flash('error', 'Invalid request. Please enter your registered email id first.');
    return res.redirect('/auth/forgot-password');
  }
  next();
}
