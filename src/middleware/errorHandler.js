const { AppError } = require("../errors/AppError");

const PG_CONFLICTS = {
  users_email_unique: ["EMAIL_TAKEN", "Email is already registered"],
  buildings_name_unique: ["BUILDING_NAME_TAKEN", "Building with this name already exists"],
  rooms_building_id_name_unique: ["ROOM_NAME_TAKEN", "Room with this name already exists in this building"]
};

const PG_RESTRICT = {
  rooms_building_id_foreign: ["BUILDING_HAS_ROOMS", "Building still has rooms"],
  reservations_room_id_foreign: ["ROOM_HAS_RESERVATIONS", "Room still has reservations"]
};

function sendError(res, req, status, code, message) {
  return res.status(status).json({ error: { code, message, requestId: req.id } });
}

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
    return sendError(res, req, 400, "INVALID_JSON", "Request body is not valid JSON");
  }

  if (err.code === "23505") {
    const [code, message] = PG_CONFLICTS[err.constraint] ?? ["CONFLICT", "Resource already exists"];
    return sendError(res, req, 409, code, message);
  }

  if (err.code === "23503" && PG_RESTRICT[err.constraint]) {
    const [code, message] = PG_RESTRICT[err.constraint];
    return sendError(res, req, 409, code, message);
  }

  const overlapConflict = err.code === "23P01" && err.constraint === "reservations_no_overlap";
  const overlapDeadlock = err.code === "40P01" && err.where?.includes("exclusion constraint");
  if (overlapConflict || overlapDeadlock) {
    return sendError(res, req, 409, "ROOM_ALREADY_BOOKED", "Room is already booked in this time range");
  }

  console.error(`[${req.id}]`, err);
  sendError(res, req, 500, "INTERNAL_ERROR", "Unexpected error");
}

module.exports = errorHandler;
