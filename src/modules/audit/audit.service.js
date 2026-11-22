function createAuditService({ auditLogRepository }) {
  async function listEntries(filters) {
    return auditLogRepository.findAll(filters);
  }

  return { listEntries };
}

module.exports = { createAuditService };
