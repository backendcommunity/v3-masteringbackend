// app/ai/payment/page.tsx

import XPayment from "@/components/XPayment";

type SearchParams = Promise<{
  coupon?: string;
  from?: string;
  ref?: string;
  price?: string;
}>;

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const priceId = params.price ?? null;

  return (
    <XPayment
      coupon={params.coupon ?? null}
      from={params.from ?? null}
      refCode={params.ref ?? ""}
      priceId={priceId}
    />
  );
}
