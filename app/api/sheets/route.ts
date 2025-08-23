import { NextRequest } from "next/server";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export const runtime = "nodejs";

function getDb() {
  if (!getApps().length) {
    const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } =
      process.env;
    if (
      !FIREBASE_PROJECT_ID ||
      !FIREBASE_CLIENT_EMAIL ||
      !FIREBASE_PRIVATE_KEY
    ) {
      throw new Error("Missing Firebase admin envs");
    }
    initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}

function assertSheetsApiKey() {
  const key = process.env.GOOGLE_SHEETS_API_KEY;
  if (!key) throw new Error("Missing GOOGLE_SHEETS_API_KEY");
  return key;
}

function slugify(s: string) {
  return (
    s
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase()
      .slice(0, 120) || "untitled"
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function stableIdFromRow(row: Record<string, unknown>, fallback: string) {
  // Prefer "id" column if present and non-empty
  for (const key of ["id", "ID", "Id", "_id", "uid", "UUID"]) {
    const v = row[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  // Otherwise make a stable hash of the row to avoid re-order duplicates
  const json = JSON.stringify(row);
  let h = 0;
  for (let i = 0; i < json.length; i++) {
    h = (h * 31 + json.charCodeAt(i)) | 0;
  }
  return `row_${(h >>> 0).toString(36)}_${fallback}`;
}

type ParsedSheet = {
  title: string;
  headers: string[];
  rows: Record<string, string | number | null>[];
  rawValues: (string | number)[][];
};

async function fetchAndParse(sheetId: string): Promise<ParsedSheet[]> {
  const apiKey = assertSheetsApiKey();

  // 1) list tab titles
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets(properties(title))&key=${apiKey}`
  );
  if (!metaRes.ok) {
    const body = await metaRes.text();
    throw new Error(`Meta fetch failed (${metaRes.status}): ${body}`);
  }
  const meta = await metaRes.json();
  const titles: string[] = (meta.sheets ?? [])
    .map((s: any) => s.properties?.title)
    .filter(Boolean);

  if (!titles.length) return [];

  // 2) batch get values
  const ranges = titles
    .map((t) => encodeURIComponent(`'${t}'`))
    .join("&ranges=");
  const valuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchGet?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING&ranges=${ranges}&key=${apiKey}`
  );
  if (!valuesRes.ok) {
    const body = await valuesRes.text();
    throw new Error(`Values fetch failed (${valuesRes.status}): ${body}`);
  }
  const values = await valuesRes.json();

  const results: ParsedSheet[] = (values.valueRanges || []).map(
    (vr: any, i: number) => {
      const title = titles[i];
      const rows = (vr.values as (string | number)[][]) ?? [];
      if (!rows.length) return { title, headers: [], rows: [], rawValues: [] };

      const headers = rows[0].map((h) => String(h ?? ""));
      const data = rows.slice(1).map((r) => {
        const obj: Record<string, string | number | null> = {};
        headers.forEach((h, j) => {
          const cell = r[j];
          obj[h] =
            cell === undefined
              ? null
              : typeof cell === "number"
                ? cell
                : String(cell);
        });
        return obj;
      });
      return { title, headers, rows: data, rawValues: rows };
    }
  );

  return results;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sheetId = searchParams.get("sheetId")?.trim();
    if (!sheetId) {
      return new Response(JSON.stringify({ error: "Missing ?sheetId=" }), {
        status: 400,
      });
    }

    // If you want *exact* tab names as collection names (dangerous if they contain slashes),
    // pass ?useExactName=true. Otherwise we slugify safely.
    const useExactName = searchParams.get("useExactName") === "true";

    // Optional: replace vs append
    const mode = (searchParams.get("mode") as "append" | "replace") || "append";

    // 1) fetch + parse
    const parsed = await fetchAndParse(sheetId);

    // 2) write: each tab = top-level collection (tab name)
    const db = getDb();
    const results: Array<{
      tab: string;
      collection: string;
      wrote: number;
      deleted?: number;
      headers: string[];
    }> = [];

    for (const sheet of parsed) {
      const collectionName = useExactName
        ? sheet.title || "untitled"
        : slugify(sheet.title || "untitled");
      const colRef = db.collection(collectionName);

      // If replace, clear the whole collection
      let deleted: number | undefined;
      if (mode === "replace") {
        // Delete in pages of 500
        deleted = 0;
        while (true) {
          const snap = await colRef.limit(500).get();
          if (snap.empty) break;
          const batch = db.batch();
          snap.docs.forEach((d) => batch.delete(d.ref));
          await batch.commit();
          deleted += snap.size;
        }
      }

      // Upsert each row as a doc
      let wrote = 0;
      const rows = sheet.rows;

      // prepare docs with deterministic IDs:
      const docs = rows.map((r, idx) => {
        const docId = stableIdFromRow(r, String(idx + 1));
        return { id: docId, data: r };
      });

      for (const pack of chunk(docs, 500)) {
        const batch = db.batch();
        for (const { id, data } of pack) {
          batch.set(
            colRef.doc(id),
            {
              __sheetId: sheetId,
              __tab: sheet.title,
              __ingestedAt: new Date().toISOString(),
              ...data,
            },
            { merge: true }
          );
        }
        await batch.commit();
        wrote += pack.length;
      }

      results.push({
        tab: sheet.title,
        collection: collectionName,
        wrote,
        deleted,
        headers: sheet.headers,
      });
    }

    return new Response(
      JSON.stringify({ ok: true, sheetId, mode, results }, null, 2),
      { status: 200 }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message || "Unknown error" }),
      { status: 500 }
    );
  }
}
