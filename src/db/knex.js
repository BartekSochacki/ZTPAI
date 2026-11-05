const knex = require("knex");
const config = require("../../knexfile");

function createKnex() {
  return knex(config);
}

module.exports = { createKnex };
