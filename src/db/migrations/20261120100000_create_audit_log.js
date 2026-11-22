exports.up = async function (knex) {
  await knex.schema.createTable("audit_log", table => {
    table.bigIncrements("id").primary();
    table.string("event_type", 100).notNullable();
    table.jsonb("payload").notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index(["event_type"]);
    table.index(["created_at"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTable("audit_log");
};
