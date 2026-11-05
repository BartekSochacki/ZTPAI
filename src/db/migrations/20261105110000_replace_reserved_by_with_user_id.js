const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");

const POLISH = "ąćęłńóśźżĄĆĘŁŃÓŚŹŻ";
const ASCII = "acelnoszzACELNOSZZ";

function emailFromName(name) {
  const ascii = [...name].map(ch => (POLISH.includes(ch) ? ASCII[POLISH.indexOf(ch)] : ch)).join("");
  return `${ascii.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "")}@example.com`;
}

exports.up = async function (knex) {
  await knex.schema.alterTable("reservations", table => {
    table.integer("user_id").references("id").inTable("users").onDelete("RESTRICT");
  });

  const names = await knex("reservations").distinct("reserved_by").pluck("reserved_by");
  for (const name of names) {
    const email = emailFromName(name);
    const existing = await knex("users").where({ email }).first();
    const userId = existing
      ? existing.id
      : (await knex("users")
          .insert({ email, password_hash: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10), role: "USER" })
          .returning("id"))[0].id;
    await knex("reservations").where({ reserved_by: name }).update({ user_id: userId });
  }

  await knex.schema.alterTable("reservations", table => {
    table.integer("user_id").notNullable().alter();
    table.index(["user_id"]);
    table.dropColumn("reserved_by");
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("reservations", table => {
    table.string("reserved_by", 100);
  });
  await knex.raw("UPDATE reservations SET reserved_by = users.email FROM users WHERE users.id = reservations.user_id");
  await knex.schema.alterTable("reservations", table => {
    table.string("reserved_by", 100).notNullable().alter();
    table.dropIndex(["user_id"]);
    table.dropColumn("user_id");
  });
};
