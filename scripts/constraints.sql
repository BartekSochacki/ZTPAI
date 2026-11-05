INSERT INTO buildings (name, address) VALUES ('Budynek A', 'ul. Testowa 1, Kraków');

INSERT INTO rooms (building_id, name, capacity) VALUES (1, '101', 30);

INSERT INTO rooms (building_id, name, capacity) VALUES (1, '999', 0);

INSERT INTO rooms (building_id, name, capacity) VALUES (99, '101', 30);

INSERT INTO reservations (room_id, user_id, participants, start_time, end_time)
VALUES (99, 2, 10, '2026-12-01T10:00:00Z', '2026-12-01T12:00:00Z');

INSERT INTO reservations (room_id, user_id, participants, start_time, end_time)
VALUES (1, 2, 0, '2026-12-01T10:00:00Z', '2026-12-01T12:00:00Z');

INSERT INTO reservations (room_id, user_id, participants, start_time, end_time)
VALUES (1, 2, 10, '2026-12-01T12:00:00Z', '2026-12-01T10:00:00Z');

INSERT INTO reservations (room_id, user_id, participants, start_time, end_time, status)
VALUES (1, 2, 10, '2026-12-01T10:00:00Z', '2026-12-01T12:00:00Z', 'PENDING');

INSERT INTO reservations (room_id, user_id, participants, start_time, end_time)
VALUES (1, 2, 10, '2026-11-20T11:00:00Z', '2026-11-20T11:30:00Z');

DELETE FROM buildings WHERE id = 1;
DELETE FROM rooms WHERE id = 1;

BEGIN;
INSERT INTO reservations (room_id, user_id, participants, start_time, end_time)
VALUES (2, 2, 10, '2026-11-21T09:00:00Z', '2026-11-21T11:00:00Z');
INSERT INTO reservations (room_id, user_id, participants, start_time, end_time)
VALUES (1, 2, 10, '2026-11-20T13:00:00Z', '2026-11-20T14:00:00Z');
ROLLBACK;
