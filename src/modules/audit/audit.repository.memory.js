function createAuditLogRepository(db) {
  db.auditLog ??= [];
  let nextId = Math.max(0, ...db.auditLog.map(e => e.id)) + 1;

  return {
    async create({ eventType, payload, createdAt }) {
      const entry = { id: nextId++, eventType, payload: structuredClone(payload), createdAt };
      db.auditLog.push(entry);
      return entry;
    },
    async findAll({ eventType, page = 1, limit = 20 } = {}) {
      const matching = db.auditLog
        .filter(e => eventType === undefined || e.eventType === eventType)
        .sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);
      return { items: matching.slice((page - 1) * limit, page * limit), total: matching.length };
    }
  };
}

module.exports = { createAuditLogRepository };
