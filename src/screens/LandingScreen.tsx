/** @format */

import React from "react";
import { useExperience } from "@/context/ExperienceContext";
import { Button } from "@/components/ui/button";
import { Sparkles, FlaskConical, PencilRuler, Stars } from "lucide-react";

export default function LandingScreen() {
  const { setScreen } = useExperience();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      {/* 📄 Fundo estilo papel */}
      <div
        className="
          absolute inset-0 opacity-40 pointer-events-none
          bg-[linear-gradient(to_right,hsl(var(--border)/0.08)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.08)_1px,transparent_1px)]
          bg-[size:42px_42px]
        "
      />

      {/* ✨ manchas coloridas */}
      <div className="pointer-events-none absolute top-10 left-10 w-72 h-72 rounded-full bg-primary/15 blur-3xl animate-float" />
      <div
        className="pointer-events-none absolute bottom-10 right-10 w-96 h-96 rounded-full bg-accent/15 blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />

      {/* 🌟 doodles */}
      <div className="absolute top-20 right-24 text-primary text-4xl rotate-12 opacity-70">
        ✦
      </div>

      <div className="absolute bottom-32 left-24 text-accent text-3xl -rotate-12 opacity-70">
        ✎
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8 text-center sm:px-6 sm:py-12 md:py-16">
        {/* Badge */}
        <div className="paper-tag mb-5 flex items-center gap-2 animate-fade-in sm:mb-6 md:mb-8">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm">Ciência Aberta • CNPEM • Ilum</span>
        </div>

        {/* 🧪 Ícone */}
        <div className="relative mb-5 sm:mb-6 md:mb-8">
          <div className="gradient-bg yellow atom-shadow flex h-20 w-20 rotate-[-6deg] items-center justify-center rounded-[38%_62%_55%_45%/45%_45%_55%_55%] sm:h-24 sm:w-24 md:h-28 md:w-28">
            <FlaskConical className="h-10 w-10 text-foreground sm:h-12 sm:w-12 md:h-14 md:w-14" />
          </div>

          <div className="absolute -top-3 -right-4 text-2xl animate-bounceSoft">
            ⭐
          </div>
        </div>

        {/* 📝 Título */}
        <h1
          className="
            font-display
            text-4xl
            sm:text-5xl
            md:text-7xl
            xl:text-8xl
            leading-[0.95]
            max-w-5xl
            animate-fade-in
          "
          style={{
            animationDelay: "0.1s",
            animationFillMode: "backwards",
          }}
        >
          Sobrevive ao calor?
          <br />
          <span className="gradient-text">Desafie sua molécula</span>
        </h1>

        {/* 📒 Subtítulo */}
        <div
          className="
            mt-5
            max-w-2xl
            gradient-bg-subtle
            p-4
            rotate-[0.4deg]
            animate-fade-in
            sm:mt-6
            md:mt-8
            md:p-6
          "
          style={{
            animationDelay: "0.2s",
            animationFillMode: "backwards",
          }}
        >
          <p className="text-base leading-relaxed text-muted-foreground md:text-xl">
            Monte moléculas, aumente a temperatura e descubra quais estruturas
            conseguem sobreviver ao caos térmico.
          </p>

          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:mt-4 sm:gap-3">
            <span className="marker-highlight">Interativo</span>

            <span className="marker-highlight">Educacional</span>

            <span className="marker-highlight">Científico</span>
          </div>
        </div>

        {/* 🎮 CTA */}
        <div
          className="mt-6 animate-fade-in md:mt-10"
          style={{
            animationDelay: "0.3s",
            animationFillMode: "backwards",
          }}
        >
          <Button
            variant="hero"
            size="xl"
            onClick={() => setScreen("builder")}
            className="
              sticker-btn
              wiggle
              px-6
              py-4
              text-lg
              rotate-[-2deg]
              sm:px-8
              sm:py-5
              sm:text-xl
              md:px-10
              md:py-7
              md:text-2xl
            "
          >
            <PencilRuler className="mr-2 h-5 w-5 md:h-6 md:w-6" />
            Começar Experimento
          </Button>
        </div>

        {/* ⭐ mini info */}
        <div className="mt-4 flex rotate-[1deg] items-center gap-2 text-sm text-muted-foreground md:mt-6">
          <Stars className="w-4 h-4 text-primary" />
          Crie • Teste • Descubra
        </div>

        {/* 📚 Steps */}
        {/* <div className="mt-16 w-full max-w-5xl">
          <IntroSteps />
        </div> */}
      </div>
    </div>
  );
}
