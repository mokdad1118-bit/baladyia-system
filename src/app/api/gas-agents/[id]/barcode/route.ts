import { NextResponse } from "next/server";
import { code128Svg } from "@/lib/code128-svg";
import { gasAgentBarcodeValue } from "@/lib/gas-agent-barcode";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const svg = code128Svg(gasAgentBarcodeValue(id));

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "private, max-age=300",
    },
  });
}

