const { createSeedData } = require("../seed-data");

exports.seed = async function (knex) {
  const { buildings, rooms, reservations } = createSeedData();

  await knex("buildings").insert(buildings.map(b => ({
    name: b.name, address: b.address, created_at: b.createdAt
  })));
  await knex("rooms").insert(rooms.map(r => ({
    building_id: r.buildingId, name: r.name, capacity: r.capacity, created_at: r.createdAt
  })));
  await knex("reservations").insert(reservations.map(r => ({
    room_id: r.roomId, user_id: r.userId, participants: r.participants,
    start_time: r.startTime, end_time: r.endTime, status: r.status,
    created_at: r.createdAt, cancelled_at: r.cancelledAt
  })));
};
