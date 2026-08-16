"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/reveal";

const faqs = [
  {
    question: "What is Freighter?",
    answer:
      "Freighter is a browser-extension wallet for the Stellar network. It stores your keys securely and signs transactions locally, so your secret key never touches this app.",
  },
  {
    question: "Is this using real money?",
    answer:
      "No. Stellar Pay currently runs on the Stellar Testnet. The XLM here has no real-world value and is meant for testing and learning.",
  },
  {
    question: "How do I get testnet XLM?",
    answer:
      "Once your wallet is connected, use the “Fund with Friendbot” button. Friendbot instantly credits your account with 10,000 testnet XLM.",
  },
  {
    question: "How fast are payments?",
    answer:
      "Stellar closes a new ledger roughly every 3–5 seconds, so payments typically confirm within a few seconds at a fraction of a cent in fees.",
  },
  {
    question: "Are my funds safe?",
    answer:
      "Your keys stay in Freighter and are never shared with this interface. Every transaction requires your explicit approval inside the wallet.",
  },
];

function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-card/60 overflow-hidden rounded-2xl border backdrop-blur">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-medium">{question}</span>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-5 shrink-0 transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <p className="text-muted-foreground px-5 pb-5 text-sm leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto w-full max-w-3xl px-4 py-16">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-primary text-sm font-medium tracking-wide uppercase">
          FAQ
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h2>
        <p className="text-muted-foreground mt-4 text-base">
          Everything you need to know about using Stellar Pay.
        </p>
      </Reveal>

      <div className="mt-10 flex flex-col gap-3">
        {faqs.map((faq, i) => (
          <Reveal key={faq.question} delay={i * 70}>
            <FaqItem
              {...faq}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
