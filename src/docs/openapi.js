const ref = name => ({ $ref: `#/components/schemas/${name}` });
const json = schema => ({ content: { "application/json": { schema } } });
const errorResponse = description => ({ description, ...json(ref("Error")) });

const R = {
  400: { $ref: "#/components/responses/BadRequest" },
  401: { $ref: "#/components/responses/Unauthorized" },
  403: { $ref: "#/components/responses/Forbidden" },
  404: { $ref: "#/components/responses/NotFound" },
  409: { $ref: "#/components/responses/Conflict" }
};
const pick = (...codes) => Object.fromEntries(codes.map(code => [code, R[code]]));

const idParam = { name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } };
const secured = [{ bearerAuth: [] }];

module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Room Booking API",
    version: "4.0.0",
    description: "ZTPAI - zestaw 04. Wszystkie endpointy poza /api/auth/register i /api/auth/login wymagaja tokenu JWT (przycisk Authorize)."
  },
  servers: [{ url: "http://localhost:3000" }],
  tags: [{ name: "Auth" }, { name: "Buildings" }, { name: "Rooms" }, { name: "Reservations" }],
  security: secured,
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Auth"], summary: "Rejestracja (zawsze rola USER)", security: [],
        requestBody: { required: true, ...json(ref("RegisterRequest")) },
        responses: { 201: { description: "Utworzony uzytkownik", ...json(ref("User")) }, ...pick(400, 409) }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"], summary: "Logowanie - zwraca token JWT", security: [],
        requestBody: { required: true, ...json(ref("LoginRequest")) },
        responses: { 200: { description: "Token", ...json(ref("LoginResponse")) }, ...pick(400, 401) }
      }
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"], summary: "Zalogowany uzytkownik",
        responses: { 200: { description: "Uzytkownik", ...json(ref("User")) }, ...pick(401) }
      }
    },
    "/api/buildings": {
      get: {
        tags: ["Buildings"], summary: "Lista budynkow z roomsCount",
        responses: { 200: { description: "Budynki", ...json({ type: "array", items: ref("Building") }) }, ...pick(401) }
      },
      post: {
        tags: ["Buildings"], summary: "Nowy budynek (ADMIN)",
        requestBody: { required: true, ...json(ref("BuildingInput")) },
        responses: { 201: { description: "Utworzony budynek", ...json(ref("Building")) }, ...pick(400, 401, 403, 409) }
      }
    },
    "/api/buildings/{id}": {
      parameters: [idParam],
      get: {
        tags: ["Buildings"], summary: "Jeden budynek",
        responses: { 200: { description: "Budynek", ...json(ref("Building")) }, ...pick(400, 401, 404) }
      },
      patch: {
        tags: ["Buildings"], summary: "Zmiana budynku (ADMIN)",
        requestBody: { required: true, ...json(ref("BuildingUpdate")) },
        responses: { 200: { description: "Zmieniony budynek", ...json(ref("Building")) }, ...pick(400, 401, 403, 404, 409) }
      },
      delete: {
        tags: ["Buildings"], summary: "Usuniecie budynku bez sal (ADMIN)",
        responses: { 204: { description: "Usuniety" }, ...pick(400, 401, 403, 404, 409) }
      }
    },
    "/api/buildings/{id}/rooms": {
      parameters: [idParam],
      get: {
        tags: ["Buildings"], summary: "Sale budynku",
        responses: { 200: { description: "Sale", ...json({ type: "array", items: ref("Room") }) }, ...pick(400, 401, 404) }
      }
    },
    "/api/rooms": {
      get: {
        tags: ["Rooms"], summary: "Lista sal",
        responses: { 200: { description: "Sale", ...json({ type: "array", items: ref("Room") }) }, ...pick(401) }
      },
      post: {
        tags: ["Rooms"], summary: "Nowa sala (ADMIN)",
        requestBody: { required: true, ...json(ref("RoomInput")) },
        responses: { 201: { description: "Utworzona sala", ...json(ref("Room")) }, ...pick(400, 401, 403, 404, 409) }
      }
    },
    "/api/rooms/{id}": {
      parameters: [idParam],
      get: {
        tags: ["Rooms"], summary: "Jedna sala z budynkiem",
        responses: { 200: { description: "Sala", ...json(ref("Room")) }, ...pick(400, 401, 404) }
      },
      patch: {
        tags: ["Rooms"], summary: "Zmiana sali (ADMIN)",
        requestBody: { required: true, ...json(ref("RoomUpdate")) },
        responses: { 200: { description: "Zmieniona sala", ...json(ref("Room")) }, ...pick(400, 401, 403, 404, 409) }
      },
      delete: {
        tags: ["Rooms"], summary: "Usuniecie sali bez rezerwacji (ADMIN)",
        responses: { 204: { description: "Usunieta" }, ...pick(400, 401, 403, 404, 409) }
      }
    },
    "/api/reservations": {
      get: {
        tags: ["Reservations"], summary: "Lista rezerwacji (USER widzi tylko swoje)",
        parameters: [
          { name: "roomId", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "buildingId", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "userId", in: "query", description: "Tylko dla ADMIN-a, u USER-a ignorowany", schema: { type: "integer", minimum: 1 } },
          { name: "status", in: "query", schema: { type: "string", enum: ["CONFIRMED", "CANCELLED"] } },
          { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
          { name: "sort", in: "query", schema: { type: "string", default: "startTime", enum: ["startTime", "-startTime", "createdAt", "-createdAt", "participants", "-participants"] } }
        ],
        responses: { 200: { description: "Strona rezerwacji", ...json(ref("ReservationPage")) }, ...pick(400, 401) }
      },
      post: {
        tags: ["Reservations"], summary: "Nowa rezerwacja (userId z tokenu)",
        requestBody: { required: true, ...json(ref("ReservationInput")) },
        responses: { 201: { description: "Utworzona rezerwacja", ...json(ref("Reservation")) }, ...pick(400, 401, 404, 409) }
      }
    },
    "/api/reservations/{id}": {
      parameters: [idParam],
      get: {
        tags: ["Reservations"], summary: "Rezerwacja (wlasciciel albo ADMIN, inaczej 404)",
        responses: { 200: { description: "Rezerwacja", ...json(ref("Reservation")) }, ...pick(400, 401, 404) }
      }
    },
    "/api/reservations/{id}/cancel": {
      parameters: [idParam],
      patch: {
        tags: ["Reservations"], summary: "Anulowanie rezerwacji (wlasciciel albo ADMIN)",
        responses: { 200: { description: "Anulowana rezerwacja", ...json(ref("Reservation")) }, ...pick(400, 401, 404, 409) }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
    },
    responses: {
      BadRequest: errorResponse("Niepoprawne dane (walidacja Zod albo niepoprawny JSON)"),
      Unauthorized: errorResponse("Brak tokenu, zly token, token wygasly albo zle dane logowania"),
      Forbidden: errorResponse("Brak uprawnien (wymagana rola ADMIN)"),
      NotFound: errorResponse("Zasob nie istnieje albo nie nalezy do uzytkownika"),
      Conflict: errorResponse("Konflikt (zajety email, duplikat nazwy, kolizja rezerwacji, pojemnosc sali)")
    },
    schemas: {
      Error: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message", "requestId"],
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "Validation failed" },
              details: {
                type: "array",
                items: {
                  type: "object",
                  properties: { location: { type: "string" }, field: { type: "string" }, message: { type: "string" } }
                }
              },
              requestId: { type: "string", format: "uuid" }
            }
          }
        }
      },
      RegisterRequest: {
        type: "object", required: ["email", "password"], additionalProperties: false,
        properties: {
          email: { type: "string", format: "email", example: "jan.kowalski@example.com" },
          password: { type: "string", minLength: 10, maxLength: 72, example: "bardzo-dlugie-haslo" }
        }
      },
      LoginRequest: {
        type: "object", required: ["email", "password"], additionalProperties: false,
        properties: { email: { type: "string", format: "email" }, password: { type: "string" } }
      },
      LoginResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          tokenType: { type: "string", example: "Bearer" },
          expiresIn: { type: "string", example: "15m" }
        }
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["USER", "ADMIN"] },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      Building: {
        type: "object",
        properties: {
          id: { type: "integer" }, name: { type: "string" }, address: { type: "string" },
          roomsCount: { type: "integer" }, createdAt: { type: "string", format: "date-time" }
        }
      },
      BuildingInput: {
        type: "object", required: ["name", "address"], additionalProperties: false,
        properties: { name: { type: "string", example: "Budynek C" }, address: { type: "string", example: "ul. Podchorążych 2, Kraków" } }
      },
      BuildingUpdate: {
        type: "object", additionalProperties: false, minProperties: 1,
        properties: { name: { type: "string" }, address: { type: "string" } }
      },
      Room: {
        type: "object",
        properties: {
          id: { type: "integer" }, name: { type: "string" }, capacity: { type: "integer" },
          building: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" } } }
        }
      },
      RoomInput: {
        type: "object", required: ["buildingId", "name", "capacity"], additionalProperties: false,
        properties: { buildingId: { type: "integer" }, name: { type: "string" }, capacity: { type: "integer", minimum: 1 } }
      },
      RoomUpdate: {
        type: "object", additionalProperties: false, minProperties: 1,
        properties: { name: { type: "string" }, capacity: { type: "integer", minimum: 1 } }
      },
      Reservation: {
        type: "object",
        properties: {
          id: { type: "integer" },
          room: {
            type: "object",
            properties: {
              id: { type: "integer" }, name: { type: "string" },
              building: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" } } }
            }
          },
          user: { type: "object", properties: { id: { type: "integer" }, email: { type: "string" } } },
          participants: { type: "integer" },
          startTime: { type: "string", format: "date-time" },
          endTime: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["CONFIRMED", "CANCELLED"] },
          createdAt: { type: "string", format: "date-time" },
          cancelledAt: { type: "string", format: "date-time", nullable: true }
        }
      },
      ReservationInput: {
        type: "object", required: ["roomId", "participants", "startTime", "endTime"], additionalProperties: false,
        properties: {
          roomId: { type: "integer", example: 1 },
          participants: { type: "integer", minimum: 1, example: 10 },
          startTime: { type: "string", format: "date-time", example: "2026-12-10T10:00:00Z" },
          endTime: { type: "string", format: "date-time", example: "2026-12-10T12:00:00Z" }
        }
      },
      ReservationPage: {
        type: "object",
        properties: {
          data: { type: "array", items: ref("Reservation") },
          meta: {
            type: "object",
            properties: {
              page: { type: "integer" }, limit: { type: "integer" },
              total: { type: "integer" }, totalPages: { type: "integer" }
            }
          }
        }
      }
    }
  }
};
