"use client";

import { Suspense } from "react";
import SubjectsPageInner from "./subjects-inner";
import GlobalSkeleton from "@/components/GlobalSkeleton";

export default function SubjectsPage() {
  return (
    <Suspense fallback={<GlobalSkeleton />}>
      <SubjectsPageInner />
    </Suspense>
  );
}