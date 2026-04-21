const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" },
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" },
  );

  return { accessToken, refreshToken };
};

const register = async ({ username, password }) => {
  const hash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (username, password_hash)
     VALUES ($1, $2)
     RETURNING id, username, role`,
    [username, hash],
  );

  return result.rows[0];
};

const login = async ({ username, password }) => {
  const result = await pool.query("SELECT * FROM users WHERE username = $1", [
    username,
  ]);

  const user = result.rows[0];
  if (!user) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new Error("Invalid credentials");

  const tokens = generateTokens(user);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [user.id, tokens.refreshToken],
  );

  return { user, ...tokens };
};

const refresh = async (refreshToken) => {
  if (!refreshToken) throw new Error("No token");

  const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  const dbToken = await pool.query(
    "SELECT * FROM refresh_tokens WHERE token = $1",
    [refreshToken],
  );

  if (!dbToken.rows.length) throw new Error("Forbidden");

  const user = await pool.query("SELECT * FROM users WHERE id = $1", [
    payload.id,
  ]);

  const tokens = generateTokens(user.rows[0]);

  return tokens;
};

const logout = async (refreshToken) => {
  await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [
    refreshToken,
  ]);
};

module.exports = {
  register,
  login,
  refresh,
  logout,
};
