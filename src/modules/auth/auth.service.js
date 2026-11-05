const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../../errors/AppError");

const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

function createAuthService({ usersRepository, config }) {
  async function register({ email, password }) {
    const passwordHash = await bcrypt.hash(password, config.BCRYPT_COST);
    return usersRepository.create({ email, passwordHash, role: "USER" });
  }

  async function login({ email, password }) {
    const user = await usersRepository.findByEmail(email);
    const passwordOk = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
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
