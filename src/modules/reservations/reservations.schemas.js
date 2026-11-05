const { z } = require("zod");

const idParams = z.object({
  id: z.coerce.number().int().positive()
});

const SORT_FIELDS = ["startTime", "createdAt", "participants"];
const SORT_VALUES = SORT_FIELDS.flatMap(field => [field, `-${field}`]);

const isoDate = z.iso.datetime({ offset: true }).transform(value => new Date(value));

const listReservationsQuery = z.object({
  roomId: z.coerce.number().int().positive().optional(),
  buildingId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
  status: z.enum(["CONFIRMED", "CANCELLED"]).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(SORT_VALUES).default("startTime")
}).strict().refine(q => !q.from || !q.to || q.from < q.to, {
  message: "from must be earlier than to",
  path: ["from"]
});

const createReservationBody = z.object({
  roomId: z.number().int().positive(),
  participants: z.number().int().positive(),
  startTime: z.iso.datetime({ offset: true }),
  endTime: z.iso.datetime({ offset: true })
}).strict();

module.exports = { idParams, listReservationsQuery, createReservationBody };
