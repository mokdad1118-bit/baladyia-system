import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { gasAgentBarcodeValue } from "@/lib/gas-agent-barcode";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const svg = await QRCode.toString(gasAgentBarcodeValue(id), {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 360,
    color: {
      dark: "#111827",
      light: "#ffffff",
    },
  });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "private, max-age=300",
    },
  });
}
