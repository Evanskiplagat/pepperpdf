import { NextResponse } from "next/server";
import { getDbPool } from "../../../lib/db";

const MAX_ID_LENGTH = 128;
const DEFAULT_DOC_ID = "editor-main";

type SaveBody = {
  sessionId?: unknown;
  docId?: unknown;
  title?: unknown;
  content?: unknown;
};

function asTrimmedString(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function validateId(value: string, fieldName: string) {
  if (!value) {
    throw new Error(`${fieldName} is required`);
  }
  if (value.length > MAX_ID_LENGTH) {
    throw new Error(`${fieldName} is too long`);
  }
}

async function cleanupExpired() {
  const pool = getDbPool();
  await pool.query("DELETE FROM temporary_documents WHERE expires_at <= NOW()");
}

function toErrorResponse(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage;
  const status = message === "Missing DATABASE_URL" ? 503 : 400;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = asTrimmedString(searchParams.get("sessionId"));
    const docId = asTrimmedString(searchParams.get("docId")) || DEFAULT_DOC_ID;

    validateId(sessionId, "sessionId");
    validateId(docId, "docId");

    await cleanupExpired();

    const pool = getDbPool();
    const result = await pool.query(
      `SELECT doc_id, title, content, updated_at, expires_at
       FROM temporary_documents
       WHERE session_id = $1 AND doc_id = $2 AND expires_at > NOW()
       LIMIT 1`,
      [sessionId, docId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ document: null }, { status: 404 });
    }

    return NextResponse.json({
      document: result.rows[0],
    });
  } catch (error) {
    return toErrorResponse(error, "Unable to load document");
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as SaveBody;
    const sessionId = asTrimmedString(body.sessionId);
    const docId = asTrimmedString(body.docId) || DEFAULT_DOC_ID;
    const title = asTrimmedString(body.title) || "Untitled Design";
    const content = typeof body.content === "object" && body.content !== null ? body.content : {};

    validateId(sessionId, "sessionId");
    validateId(docId, "docId");

    await cleanupExpired();

    const pool = getDbPool();
    const result = await pool.query(
      `INSERT INTO temporary_documents (session_id, doc_id, title, content, expires_at)
       VALUES ($1, $2, $3, $4::jsonb, NOW() + INTERVAL '1 day')
       ON CONFLICT (session_id, doc_id)
       DO UPDATE
       SET title = EXCLUDED.title,
           content = EXCLUDED.content,
           updated_at = NOW(),
           expires_at = NOW() + INTERVAL '1 day'
       RETURNING doc_id, title, content, updated_at, expires_at`,
      [sessionId, docId, title, JSON.stringify(content)]
    );

    return NextResponse.json({
      document: result.rows[0],
    });
  } catch (error) {
    return toErrorResponse(error, "Unable to save document");
  }
}
