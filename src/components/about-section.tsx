import { ShieldCheck, Zap, Globe2, Wallet } from "lucide-react";
import { Reveal } from "@/components/reveal";

const features = [
  {
    icon: Zap,
    title: "Instant settlement",
    description:
      "Payments confirm on the Stellar network in 3–5 seconds, with fees that round to fractions of a cent.",
  },
  {
    icon: ShieldCheck,
    title: "Self-custodial",
    description:
      "Keys never leave your Freighter wallet. Every transaction is signed locally and stays under your control.",
  },
  {
    icon: Globe2,
    title: "Built for everyone",
    description:
      "Send value across borders on an open, global ledger — no intermediaries, no gatekeepers.",
  },
  {
    icon: Wallet,
    title: "Testnet ready",
    description:
      "Fund your account with Friendbot and experiment freely before moving to mainnet.",
  },
];

export function AboutSection() {
  return (
    <section id="about" className="mx-auto w-full max-w-5xl px-4 py-16">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-primary text-sm font-medium tracking-wide uppercase">
          About
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          A modern gateway to the Stellar network
        </h2>
        <p className="text-muted-foreground mt-4 text-base leading-relaxed">
          Stellar Pay is a lightweight, self-custodial wallet interface for
          sending and receiving XLM. It focuses on speed, clarity, and security
          — everything you need to move value in seconds.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {features.map((feature, i) => (
          <Reveal key={feature.title} delay={i * 90}>
            <div className="group bg-card/60 hover:border-primary/40 h-full rounded-2xl border p-6 backdrop-blur transition-colors">
              <div className="bg-primary/15 text-primary flex size-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110">
                <feature.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
