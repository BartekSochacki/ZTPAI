function toEntry(row) {
  return {
    id: Number(row.id),
    eventType: row.event_type,
    payload: row.payload,
    createdAt: row.created_at
  };
}

function createAuditLogRepository(db) {
  return {
    async create({ eventType, payload, createdAt }) {
      const [row] = await db("audit_log")
        .insert({ event_type: eventType, payload, created_at: createdAt })
        .returning("*");
      return toEntry(row);
    },
    async findAll({ eventType, page = 1, limit = 20 } = {}) {
      const filtered = () => {
        const query = db("audit_log");
        if (eventType !== undefined) query.where("event_type", eventType);
        return query;
      };

      const rows = await filtered()
        .orderBy("created_at", "desc")
        .orderBy("id", "desc")
        .limit(limit)
        .offset((page - 1) * limit);
      const [{ total }] = await filtered().count("id as total");

      return { items: rows.map(toEntry), total: Number(total) };
    }
  };
}

module.exports = { createAuditLogRepository };
