# User API

## Deployment environment

Set these variables in Vercel Project Settings before deploying:

- `MONGO_URI`: the MongoDB Atlas connection string. Add the Vercel deployment IP access policy in Atlas, or use `0.0.0.0/0` with strong database credentials.
- `BLOB_READ_WRITE_TOKEN`: the token from a Vercel Blob store connected to this project.
- `JWT_SECRET`: a long random value shared by all deployments.
- `JWT_EXPIRES_IN` and `ADMIN_EMAIL`: optional application settings.

The upload endpoint uses Multer memory storage and sends the file buffer directly to Vercel Blob. No uploaded file is written to the Vercel function filesystem.

Copy `.env.example` to `.env` and replace `JWT_SECRET` with a long random value.

| Method | Endpoint | Body / result |
| --- | --- | --- |
| POST | `/api/auth/register` | `name`, `email`, `password`, `preferredLanguage` → token + user |
| POST | `/api/auth/login` | `email`, `password` → token + user |
| GET | `/api/auth/me` | Header `Authorization: Bearer <token>` |
| PATCH | `/api/auth/me` | Header token, any of `name`, `avatarUrl`, `preferredLanguage` |

Passwords are hashed with bcrypt before storage. Password values are never returned by the API.
