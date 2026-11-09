import { Suspense } from "react";
import { Kalender, KalenderPlatzhalter } from "@/components/kalender/kalender";

export default function KalenderPage() {
  return (
    <Suspense fallback={<KalenderPlatzhalter />}>
      <Kalender />
    </Suspense>
  );
}
