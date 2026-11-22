function registerAuditListeners(eventBus, auditLogRepository) {
  const save = event =>
    auditLogRepository.create({
      eventType: event.name,
      payload: event.payload,
      createdAt: new Date(event.occurredAt)
    });

  eventBus.subscribe("reservation.created", save);
  eventBus.subscribe("reservation.cancelled", save);
}

module.exports = { registerAuditListeners };
