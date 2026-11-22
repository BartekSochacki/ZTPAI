const { NotFoundError, ConflictError, ValidationError } = require("../../errors/AppError");
const { noopEventBus } = require("../../events/eventBus");

const MIN_DURATION_MS = 15 * 60 * 1000;
const MAX_DURATION_MS = 8 * 60 * 60 * 1000;

const ALLOWED_TRANSITIONS = {
  CONFIRMED: ["CANCELLED"],
  CANCELLED: []
};

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

const isAdmin = user => user.role === "ADMIN";

function createReservationsService({ reservationsRepository, runInTransaction, eventBus = noopEventBus, now = () => new Date() }) {
  async function createReservation(input, currentUser) {
    const start = new Date(input.startTime).getTime();
    const end = new Date(input.endTime).getTime();

    if (end <= start) {
      throw new ValidationError([{ location: "body", field: "endTime", message: "endTime must be later than startTime" }]);
    }
    const duration = end - start;
    if (duration < MIN_DURATION_MS || duration > MAX_DURATION_MS) {
      throw new ValidationError([{ location: "body", field: "endTime", message: "Reservation must last between 15 minutes and 8 hours" }]);
    }
    if (start < now().getTime()) {
      throw new ValidationError([{ location: "body", field: "startTime", message: "startTime cannot be in the past" }]);
    }

    const created = await runInTransaction(async ({ roomsRepository, reservationsRepository }) => {
      const room = await roomsRepository.findByIdForUpdate(input.roomId);
      if (!room) throw new NotFoundError("Room");

      if (input.participants > room.capacity) {
        throw new ConflictError("Room capacity exceeded", "ROOM_CAPACITY_EXCEEDED");
      }

      const active = await reservationsRepository.findConfirmedByRoom(room.id);
      const collision = active.some(r => overlaps(start, end, r.startTime.getTime(), r.endTime.getTime()));
      if (collision) {
        throw new ConflictError("Room is already booked in this time range", "ROOM_ALREADY_BOOKED");
      }

      return reservationsRepository.create({
        roomId: room.id,
        userId: currentUser.id,
        participants: input.participants,
        startTime: new Date(start),
        endTime: new Date(end),
        status: "CONFIRMED",
        createdAt: now(),
        cancelledAt: null
      });
    });

    eventBus.publish("reservation.created", {
      reservationId: created.id,
      roomId: created.roomId,
      userId: created.userId,
      startTime: created.startTime.toISOString(),
      endTime: created.endTime.toISOString()
    });
    return created;
  }

  async function listReservations(filters, currentUser) {
    const scoped = isAdmin(currentUser) ? filters : { ...filters, userId: currentUser.id };
    return reservationsRepository.findAll(scoped);
  }

  async function getReservation(id, currentUser) {
    const reservation = await reservationsRepository.findById(id);
    if (!reservation) throw new NotFoundError("Reservation");
    if (!isAdmin(currentUser) && reservation.userId !== currentUser.id) {
      throw new NotFoundError("Reservation");
    }
    return reservation;
  }

  async function cancelReservation(id, currentUser) {
    let changed = false;

    const reservation = await runInTransaction(async ({ reservationsRepository }) => {
      const current = await reservationsRepository.findById(id);
      if (!current || (!isAdmin(currentUser) && current.userId !== currentUser.id)) {
        throw new NotFoundError("Reservation");
      }

      if (current.status === "CANCELLED") return current;

      if (!ALLOWED_TRANSITIONS[current.status].includes("CANCELLED")) {
        throw new ConflictError(`Cannot change status from ${current.status} to CANCELLED`, "INVALID_STATUS_TRANSITION");
      }
      if (current.startTime.getTime() <= now().getTime()) {
        throw new ConflictError("Reservation has already started", "RESERVATION_ALREADY_STARTED");
      }

      changed = true;
      return reservationsRepository.update(id, { status: "CANCELLED", cancelledAt: now() });
    });

    if (changed) {
      eventBus.publish("reservation.cancelled", {
        reservationId: reservation.id,
        roomId: reservation.roomId,
        userId: reservation.userId,
        cancelledBy: currentUser.id
      });
    }
    return reservation;
  }

  return { createReservation, listReservations, getReservation, cancelReservation };
}

module.exports = { createReservationsService };
