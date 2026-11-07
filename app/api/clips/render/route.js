import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { renderClip } from "@/lib/clips/renderer.mjs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { inputPath, start, end, width, height, captions, jobId } = body;

    if (!inputPath || start === undefined || end === undefined) {
      return NextResponse.json(
        { error: "Faltan inputPath, start o end" },
        { status: 400 }
      );
    }

    if (!fs.existsSync(inputPath)) {
      return NextResponse.json(
        { error: `Input no existe: ${inputPath}` },
        { status: 404 }
      );
    }

    const safeJobId = String(jobId || `clip-${Date.now()}`).replace(/[^a-zA-Z0-9-_]/g, "");
    const outputPath = path.join(os.tmpdir(), `${safeJobId}.mp4`);

    const result = await renderClip({
      inputPath,
      outputPath,
      start: Number(start),
      end: Number(end),
      width: Number(width || 1080),
      height: Number(height || 1920),
      captions: Array.isArray(captions) ? captions : [],
      jobId: safeJobId,
    });

    return NextResponse.json({
      ok: true,
      jobId: safeJobId,
      outputPath: result.outputPath,
    });
  } catch (e) {
    console.error("[render]", e);
    return NextResponse.json(
      { error: e.message || "Error renderizando" },
      { status: 500 }
    );
  }
}
