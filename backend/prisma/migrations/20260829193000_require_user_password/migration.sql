-- Applied only after every existing user initialized an Argon2id password.
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;
