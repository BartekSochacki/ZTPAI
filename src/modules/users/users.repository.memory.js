const { uniqueViolation } = require("../../db/memory-errors");

function createUsersRepository(db) {
  return {
    async findById(id) {
      return db.users.find(u => u.id === id) ?? null;
    },
    async findByEmail(email) {
      return db.users.find(u => u.email === email) ?? null;
    },
    async create(data) {
      if (db.users.some(u => u.email === data.email)) {
        throw uniqueViolation("users_email_unique");
      }
      const user = { id: Math.max(0, ...db.users.map(u => u.id)) + 1, ...data, createdAt: new Date() };
      db.users.push(user);
      return user;
    }
  };
}

module.exports = { createUsersRepository };
