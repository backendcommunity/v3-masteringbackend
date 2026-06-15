"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import type { CertificateVerification } from "@/lib/portfolio-types";
import {
  Award,
  BadgeCheck,
  ShieldCheck,
  XCircle,
  Loader2,
  Calendar,
  Hash,
  GraduationCap,
} from "lucide-react";

type VerifyStatus = "loading" | "valid" | "invalid" | "error";

export default function VerifyCertificatePage() {
  const params = useParams();
  const code = (params?.code ?? "") as string;
  const store = useAppStore();

  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [result, setResult] = useState<CertificateVerification | null>(null);

  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      if (!code) {
        if (!cancelled) setStatus("invalid");
        return;
      }
      try {
        setStatus("loading");
        const data = await store.verifyCertificate(code);
        if (cancelled) return;
        if (!data) {
          setStatus("error");
        } else if (data.valid && data.certificate) {
          setResult(data);
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    };
    verify();
    return () => {
      cancelled = true;
    };
  }, [code, store]);

  const cert = result?.certificate;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      {/* Branded hero card */}
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-2xl bg-[#0c1222] p-6 text-center mb-4">
          <div className="hero-grid absolute inset-0" aria-hidden="true" />
          <div className="absolute -top-20 -left-20 w-44 h-44 bg-primary/15 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <Link href="/" aria-label="MasteringBackend">
              <Image
                src="/logo-trimed.png"
                alt="Mastering Backend"
                width={180}
                height={36}
                priority
                className="h-8 w-auto object-contain"
              />
            </Link>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/60">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Certificate Verification
            </span>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-center">
              {status === "loading" && "Verifying certificate…"}
              {status === "valid" && "Certificate Verified"}
              {status === "invalid" && "Certificate Not Valid"}
              {status === "error" && "Verification Unavailable"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Loading */}
            {status === "loading" && (
              <div className="flex flex-col items-center gap-3 py-6 text-muted-foreground">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p className="text-sm">Checking credential authenticity…</p>
              </div>
            )}

            {/* Valid */}
            {status === "valid" && cert && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="h-14 w-14 rounded-full bg-[#27AE60]/15 flex items-center justify-center">
                    <BadgeCheck className="h-8 w-8 text-[#27AE60]" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    This is a genuine MasteringBackend credential.
                  </p>
                </div>

                <dl className="space-y-3 rounded-lg border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Holder
                      </dt>
                      <dd className="text-sm font-medium break-words">
                        {cert.holderName}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Course
                      </dt>
                      <dd className="text-sm font-medium break-words">
                        {cert.courseName}
                      </dd>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start gap-3">
                      <BadgeCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Score
                        </dt>
                        <dd className="text-sm font-medium tabular-nums">
                          {cert.finalScore}%
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Issued
                        </dt>
                        <dd className="text-sm font-medium">
                          {new Date(cert.issuedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </dd>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 border-t pt-3">
                    <Hash className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Credential code
                      </dt>
                      <dd className="text-xs font-mono break-all text-muted-foreground">
                        {cert.code}
                      </dd>
                    </div>
                  </div>
                </dl>
              </div>
            )}

            {/* Invalid / Error */}
            {(status === "invalid" || status === "error") && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {status === "invalid"
                    ? "We couldn't find a valid certificate for this code. It may be incorrect or revoked."
                    : "We couldn't verify this certificate right now. Please try again shortly."}
                </p>
                {code && (
                  <p className="text-xs font-mono text-muted-foreground break-all">
                    {code}
                  </p>
                )}
              </div>
            )}

            <Button asChild variant="outline" className="w-full">
              <Link href="/">Back to MasteringBackend</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
