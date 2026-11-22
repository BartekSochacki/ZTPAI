const { toAuditEntryResponse } = require("./audit.mapper");

function createAuditController(auditService) {
  return {
    async list(req, res) {
      const { page, limit } = req.validated.query;
      const { items, total } = await auditService.listEntries(req.validated.query);
      res.json({
        data: items.map(toAuditEntryResponse),
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
      });
    }
  };
}

module.exports = { createAuditController };
