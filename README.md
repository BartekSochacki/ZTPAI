# Room Booking API – ZTPAI, Zadanie 04

Room Booking API z zadania 03 z kontami użytkowników, JWT, rolami USER/ADMIN i dokumentacją Swagger.

## Uruchomienie

```bash
npm install
cp .env.example .env      # uzupełnij POSTGRES_PASSWORD, DATABASE_URL i JWT_SECRET (min. 32 znaki)
npm run db:up             # docker compose up -d
npm run migrate
npm run seed              # konta testowe: src/db/seed-data.js
npm start                 # http://localhost:3000, Swagger UI: http://localhost:3000/api/docs
npm run start:memory      # repositories in-memory
```

Bez poprawnej konfiguracji (`src/config`) aplikacja nie startuje.

## Skrypty

- `scripts/parallel-register.js` – 10 równoległych rejestracji tego samego emaila
- `scripts/double-booking.js` – 10 równoległych rezerwacji tego samego terminu
- `scripts/decode-token.js <jwt>` – podgląd nagłówka i payloadu tokenu
- `requests.http` – requesty ze sprawozdania (tokeny w zmiennych `{{admin_token}}`, `{{jan_token}}`, `{{anna_token}}`)
