const authService = require("../services/auth.service");

const sendTokens = (res, accessToken, refreshToken) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true тільки на Render
    sameSite: "none", // Важливо для крос-доменних запитів (Vercel -> Render)
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 днів
  };

  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, cookieOptions);
};

const register = async (req, res) => {
  try {
    if (!req.body || !req.body.username) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const user = await authService.register(req.body);
    res.status(201).json(user);
  } catch (e) {
    if (e.code === "23505") {
      return res.status(400).json({ message: "Username already exists" });
    }
    res.status(500).json({ message: e.message });
  }
};

const login = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Invalid request body" });
    }

    const { user, accessToken, refreshToken } = await authService.login(
      req.body,
    );

    sendTokens(res, accessToken, refreshToken);

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
    });
  } catch (e) {
    res.status(401).json({ message: e.message }); // 401 - Unauthorized
  }
};

const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    const { accessToken, refreshToken } = await authService.refresh(token);

    sendTokens(res, accessToken, refreshToken);

    res.json({ ok: true });
  } catch {
    res.sendStatus(401);
  }
};

const logout = async (req, res) => {
  const token = req.cookies.refreshToken;

  await authService.logout(token);

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res.json({ ok: true });
};

module.exports = {
  register,
  login,
  refresh,
  logout,
};
