import { NextResponse } from "next/server";
import { runClipPipeline } from "@/lib/clips/pipeline.mjs";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      jobId,
      inputBucket,
      inputPath,
      outputBucket,
      outputPath,
      start,
      end,
      width,
      height,
      captions,
    } = body;

    if (!inputBucket || !inputPath || !outputBucket || !outputPath) {
      return NextResponse.json(
        { error: "Faltan inputBucket, inputPath, outputBucket o outputPath" },
        { status: 400 }
      );
    }

    if (start === undefined || end === undefined || Number(end) <= Number(start)) {
      return NextResponse.json(
        { error: "Rango invalido: end debe ser mayor que start" },
        { status: 400 }
      );
    }

    const result = await runClipPipeline({
      jobId: jobId || `clip-${Date.now()}`,
      inputBucket,
      inputPath,
      outputBucket,
      outputPath,
      start: Number(start),
      end: Number(end),
      width: Number(width || 1080),
      height: Number(height || 1920),
      captions: Array.isArray(captions) ? captions : [],
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[process]", e);
    return NextResponse.json(
      { error: e.message || "Error en pipeline" },
      { status: 500 }
    );
  }
}
