const bcrypt = require("bcryptjs");
const config = require("../../config");
const { createSeedData } = require("../seed-data");

exports.seed = async function (knex) {
  const { users } = createSeedData();

  await knex.raw("TRUNCATE reservations, rooms, buildings, users RESTART IDENTITY CASCADE");

  const rows = [];
  for (const u of users) {
    rows.push({
      email: u.email,
      password_hash: await bcrypt.hash(u.password, config.BCRYPT_COST),
      role: u.role,
      created_at: u.createdAt
    });
  }
  await knex("users").insert(rows);
};
