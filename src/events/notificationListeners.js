function registerNotificationListeners(eventBus, usersRepository, logger = console) {
  eventBus.subscribe("reservation.cancelled", async ({ payload }) => {
    if (payload.cancelledBy === payload.userId) return;

    const [owner, canceller] = await Promise.all([
      usersRepository.findById(payload.userId),
      usersRepository.findById(payload.cancelledBy)
    ]);
    if (!owner || canceller?.role !== "ADMIN") return;

    logger.log(`[notification] to: ${owner.email} - Twoja rezerwacja #${payload.reservationId} w sali ${payload.roomId} została anulowana przez administratora`);
  });
}

module.exports = { registerNotificationListeners };
