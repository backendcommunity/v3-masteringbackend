"use client";

import { useEffect, useState } from "react";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { useTheme } from "next-themes";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const PADDLE_TOKEN = process.env.NEXT_PUBLIC_PADDLE_TOKEN as string;
const NODE_ENV = process.env.NEXT_PUBLIC_NODE_ENV;
const PADDLE_ENVIRONMENT = NODE_ENV === "dev" ? "sandbox" : "production";
const DEFAULT_PRICE_ID = "pri_01kc68wvad2nfdd5a7s5zphemt";

export default function XPayment() {
  const { theme } = useTheme();
  const searchParams = useSearchParams();
  const priceId = searchParams?.get("priceid") || DEFAULT_PRICE_ID;
  const [paddle, setPaddle] = useState<Paddle>();

  useEffect(() => {
    initializePaddle({
      token: PADDLE_TOKEN,
      eventCallback: function (data: any) {
        switch (data.name) {
          case "checkout.loaded":
            console.log("Checkout loaded", data);
            break;
          case "checkout.closed":
            console.log("Checkout closed");
            break;
          case "checkout.completed":
            console.log("Checkout completed", data?.custom_data);
            break;
        }
      },
      environment: PADDLE_ENVIRONMENT,
    }).then((paddleInstance: Paddle | undefined) => {
      if (paddleInstance) {
        setPaddle(paddleInstance);
      }
    });
  }, []);

  // Auto-open checkout once Paddle is ready and priceId is present
  useEffect(() => {
    if (paddle && priceId) {
      openCheckout(priceId);
    }
  }, [paddle, priceId]);

  const openCheckout = (id: string) => {
    paddle?.Checkout.open({
      settings: {
        allowedPaymentMethods: [
          "alipay",
          "apple_pay",
          "bancontact",
          "card",
          "google_pay",
          "ideal",
          "paypal",
        ],
        theme: theme?.includes("dark") ? "dark" : "light",
      },
      discountCode: "AIEARLYBIRD",
      items: [{ priceId: id }],
    });
  };

  if (!priceId) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Unable to load payment. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="w-full"
        onClick={() => openCheckout(priceId)}
      >
        Click here to proceed with payment
      </Button>
    </div>
  );
}
