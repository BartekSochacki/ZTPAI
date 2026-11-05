const knex = require("knex");
const knexConfig = require("../../knexfile");

function createKnex() {
  return knex(knexConfig);
}

module.exports = { createKnex };
