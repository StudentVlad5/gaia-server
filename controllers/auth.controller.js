const authService = require("../services/auth.service");

const sendTokens = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
};

const register = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    res.json(user);
  } catch (e) {
    if (e.code === "23505") {
      return res.status(400).json({ message: "Username exists" });
    }
    res.status(500).json({ message: e.message });
  }
};

const login = async (req, res) => {
  try {
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
    res.status(400).json({ message: e.message });
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
