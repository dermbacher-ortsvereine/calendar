import { Suspense } from "react";
import { Kalender, KalenderPlatzhalter } from "@/components/kalender/kalender";

export default function KalenderPage(props: PageProps<"/">) {
  return (
    <Suspense fallback={<KalenderPlatzhalter />}>
      <Kalender searchParams={props.searchParams} />
    </Suspense>
  );
}
