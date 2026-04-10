"use client";

import { useEffect } from "react";
import { startExperience } from "@/lib/experience/runtime";

export function useGretaExperience() {
  useEffect(() => {
    const teardown = startExperience();
    return () => teardown?.();
  }, []);
}
