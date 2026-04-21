const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) return res.sendStatus(401);

  try {
    const user = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = user;
    next();
  } catch {
    res.sendStatus(401);
  }
};
