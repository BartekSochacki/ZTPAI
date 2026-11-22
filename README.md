# Room Booking API – ZTPAI

![CI](https://github.com/BartekSochacki/ZTPAI/actions/workflows/ci.yml/badge.svg)

REST API do rezerwacji sal (Node.js 22, Express 5, PostgreSQL 16, Knex, Zod, JWT). Projekt rozwijany w zestawach 01–05: architektura warstwowa, walidacja, obsługa błędów, baza danych z migracjami, uwierzytelnianie i role USER/ADMIN, testy, Docker Compose, eventy z audit logiem oraz CI w GitHub Actions.

## Uruchomienie od zera (Docker)

Wymagany jest tylko Docker z Docker Compose v2.

```bash
git clone https://github.com/BartekSochacki/ZTPAI.git
cd ZTPAI
cp .env.example .env
docker compose up --build
```

- API: http://localhost:3000
- Swagger UI: http://localhost:3000/api/docs

Migracje wykonują się automatycznie przy starcie kontenera `api`. Konta testowe (w tym ADMIN, dane w `src/db/seed-data.js`) dodaje seed uruchamiany w działającym kontenerze:

```bash
docker compose exec api npx knex seed:run
```

Zatrzymanie: `docker compose down` (dane bazy zostają w volume `pgdata`), `docker compose down -v` usuwa także dane.

## Uruchomienie lokalne (bez kontenera API)

```bash
npm install
cp .env.example .env
docker compose up -d db
npm run migrate
npm run seed
npm start
```

## Testy

```bash
npm run test:unit         # unit testy service'ów, bez bazy danych
npm run test:integration  # Supertest + osobna baza testowa
npm test                  # wszystkie testy
```

Testy integracyjne korzystają z bazy `TEST_DATABASE_URL`, a jeżeli jej nie ustawiono, z bazy o nazwie z `DATABASE_URL` z dopiskiem `_test` (np. `roombooking_test`). Na bazie deweloperskiej testy się nie uruchomią. Bazę testową można utworzyć poleceniem:

```bash
docker compose exec db psql -U roombooking -d roombooking -c "CREATE DATABASE roombooking_test;"
```

## Najważniejsze endpointy

| Metoda | Ścieżka | Dostęp |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | publiczne |
| GET | `/api/auth/me` | zalogowany |
| GET/POST/PATCH/DELETE | `/api/buildings`, `/api/rooms` | odczyt: zalogowany, zmiany: ADMIN |
| GET/POST | `/api/reservations` | zalogowany (USER widzi swoje) |
| PATCH | `/api/reservations/:id/cancel` | właściciel albo ADMIN |
| GET | `/api/admin/audit-log?eventType=&page=&limit=` | ADMIN |

Pełna dokumentacja: Swagger UI pod `/api/docs`.

## Eventy

Service rezerwacji publikuje po zatwierdzeniu transakcji eventy `reservation.created` i `reservation.cancelled`. Listenery zapisują je do tabeli `audit_log` (payload `jsonb`) i logują powiadomienie, gdy ADMIN anuluje cudzą rezerwację. Błąd listenera nie wpływa na odpowiedź API.
