function checkRole(requiredRole) {
    return (req, res, next) => {
      if (!res.locals.user) {
        return res.status(401).json({ message: "Unauthorized access!" });
      }
  
      if (res.locals.user.role !== requiredRole) {
        return res.status(403).json({ message: "Forbidden: Insufficient privileges!" });
      }
  
      next(); // User has the required role, proceed
    };
  }
  
  module.exports = { checkRole };
  