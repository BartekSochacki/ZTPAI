const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../../errors/AppError");

function createAuthService({ usersRepository, config }) {
  const dummyHash = bcrypt.hashSync("dummy-password-for-timing", config.BCRYPT_COST);

  async function register({ email, password }) {
    const passwordHash = await bcrypt.hash(password, config.BCRYPT_COST);
    return usersRepository.create({ email, passwordHash, role: "USER" });
  }

  async function login({ email, password }) {
    const user = await usersRepository.findByEmail(email);
    const passwordOk = await bcrypt.compare(password, user ? user.passwordHash : dummyHash);
    if (!user || !passwordOk) {
      throw new UnauthorizedError("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const accessToken = jwt.sign({ role: user.role }, config.JWT_SECRET, {
      algorithm: "HS256",
      subject: String(user.id),
      expiresIn: config.JWT_EXPIRES_IN
    });
    return { accessToken, tokenType: "Bearer", expiresIn: config.JWT_EXPIRES_IN };
  }

  async function getCurrentUser(currentUser) {
    const user = await usersRepository.findById(currentUser.id);
    if (!user) throw new UnauthorizedError("User no longer exists");
    return user;
  }

  return { register, login, getCurrentUser };
}

module.exports = { createAuthService };
