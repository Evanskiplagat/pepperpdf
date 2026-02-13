import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pepperPdfPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL");
  }

  return new Pool({
    connectionString,
  });
}

export function getDbPool() {
  if (!global.__pepperPdfPool) {
    global.__pepperPdfPool = createPool();
  }

  return global.__pepperPdfPool;
}

