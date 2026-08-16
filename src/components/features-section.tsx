import { Send, Download, RefreshCcw, Lock, Gauge, Coins } from "lucide-react";
import { Reveal } from "@/components/reveal";

const features = [
  {
    icon: Send,
    title: "Send instantly",
    description:
      "Fire off XLM payments to any Stellar address and watch them settle in seconds.",
  },
  {
    icon: Download,
    title: "Receive with ease",
    description:
      "Share your address in a tap and accept funds from anywhere on the network.",
  },
  {
    icon: RefreshCcw,
    title: "Live balances",
    description:
      "Balances refresh straight from Horizon so what you see is always current.",
  },
  {
    icon: Lock,
    title: "Non-custodial",
    description:
      "Your keys stay inside Freighter. We never see or store your secrets.",
  },
  {
    icon: Gauge,
    title: "Near-zero fees",
    description:
      "Stellar fees round to fractions of a cent — keep more of every transfer.",
  },
  {
    icon: Coins,
    title: "Free testnet XLM",
    description:
      "Fund your account with Friendbot and experiment without spending a thing.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto w-full max-w-5xl px-4 py-16">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-primary text-sm font-medium tracking-wide uppercase">
          Features
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Everything you need to move XLM
        </h2>
        <p className="text-muted-foreground mt-4 text-base">
          A focused set of tools that make sending value on Stellar feel
          effortless.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => (
          <Reveal key={feature.title} delay={i * 80}>
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
