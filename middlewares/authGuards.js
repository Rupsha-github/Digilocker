// to block already logged in users from accessing login and signup paths
export const isLoggedIn = (req, res, next) => {
  // console.log("isLoggedIn middleware triggered. Session userId:", req.session.userId);
  if (req.session.userId) {
    req.flash('error', 'You are already logged in.');
    return res.redirect('/'); // redirecting to home
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