function createReservationsRepository(db) {
  const withRelations = reservation => {
    const room = db.rooms.find(r => r.id === reservation.roomId);
    const building = db.buildings.find(b => b.id === room.buildingId);
    const user = db.users.find(u => u.id === reservation.userId);
    return {
      ...reservation,
      room: { id: room.id, name: room.name, building: { id: building.id, name: building.name } },
      user: { id: user.id, email: user.email }
    };
  };

  return {
    async findAll({ roomId, buildingId, userId, status, from, to, page = 1, limit = 20, sort = "startTime" } = {}) {
      const descending = sort.startsWith("-");
      const field = descending ? sort.slice(1) : sort;
      const value = r => (r[field] instanceof Date ? r[field].getTime() : r[field]);

      const matching = db.reservations
        .map(withRelations)
        .filter(r => roomId === undefined || r.roomId === roomId)
        .filter(r => buildingId === undefined || r.room.building.id === buildingId)
        .filter(r => userId === undefined || r.userId === userId)
        .filter(r => status === undefined || r.status === status)
        .filter(r => to === undefined || r.startTime < to)
        .filter(r => from === undefined || r.endTime > from)
        .sort((a, b) => (value(a) - value(b)) * (descending ? -1 : 1) || a.id - b.id);

      return { items: matching.slice((page - 1) * limit, page * limit), total: matching.length };
    },
    async findById(id) {
      const reservation = db.reservations.find(r => r.id === id);
      return reservation ? withRelations(reservation) : null;
    },
    async findConfirmedByRoom(roomId) {
      return db.reservations.filter(r => r.roomId === roomId && r.status === "CONFIRMED");
    },
    async create(data) {
      const reservation = { id: Math.max(0, ...db.reservations.map(r => r.id)) + 1, ...data };
      db.reservations.push(reservation);
      return withRelations(reservation);
    },
    async update(id, changes) {
      const reservation = db.reservations.find(r => r.id === id);
      Object.assign(reservation, changes);
      return withRelations(reservation);
    }
  };
}

module.exports = { createReservationsRepository };
