const { AppError } = require("../errors/AppError");

const PG_CONFLICTS = {
  buildings_name_unique: ["BUILDING_NAME_TAKEN", "Building with this name already exists"],
  rooms_building_id_name_unique: ["ROOM_NAME_TAKEN", "Room with this name already exists in this building"]
};

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId: req.id
      }
    });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: { code: "INVALID_JSON", message: "Request body is not valid JSON", requestId: req.id }
    });
  }

  if (err.code === "23505") {
    const [code, message] = PG_CONFLICTS[err.constraint] ?? ["CONFLICT", "Resource already exists"];
    return res.status(409).json({ error: { code, message, requestId: req.id } });
  }

  const overlapConflict = err.code === "23P01" && err.constraint === "reservations_no_overlap";
  const overlapDeadlock = err.code === "40P01" && err.where?.includes("exclusion constraint");
  if (overlapConflict || overlapDeadlock) {
    return res.status(409).json({
      error: { code: "ROOM_ALREADY_BOOKED", message: "Room is already booked in this time range", requestId: req.id }
    });
  }

  console.error(`[${req.id}]`, err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Unexpected error", requestId: req.id }
  });
}

module.exports = errorHandler;
