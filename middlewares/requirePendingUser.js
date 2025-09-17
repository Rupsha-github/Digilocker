export function requirePendingUser(req, res, next) {
  if (!req.session.pendingUser) {
    return res.redirect('/auth/signup');
  }
  next();
}