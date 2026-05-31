"use client";

import { useEffect } from "react";
import { markAreaNewsReadAction } from "@/actions/area-news-read";

export function AreaNewsReadMarker() {
  useEffect(() => {
    void markAreaNewsReadAction();
  }, []);

  return null;
}
