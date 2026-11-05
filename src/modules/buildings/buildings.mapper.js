const toIso = value => (value ? new Date(value).toISOString() : null);

function toBuildingResponse(building) {
  return {
    id: building.id,
    name: building.name,
    address: building.address,
    roomsCount: building.roomsCount,
    createdAt: toIso(building.createdAt)
  };
}

module.exports = { toBuildingResponse };
