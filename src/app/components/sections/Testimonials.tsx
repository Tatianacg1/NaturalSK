import { Star } from "lucide-react";
import { testimonials } from "../../data/testimonials";

export function Testimonials() {
  return (
    <section className="py-14 px-4 md:py-28 md:px-6">
      <div className="max-w-7xl mx-auto">
        <p
          className="text-accent text-xs tracking-[0.3em] uppercase mb-4"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          04 — Testimonios
        </p>
        <h2
          className="text-foreground text-3xl md:text-4xl lg:text-5xl font-semibold mb-8 md:mb-16"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Lo que dicen
          <br />
          quienes ya vivieron Natural Sound.
        </h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((t) => (
            <div key={t.name} className="border border-border p-5 md:p-8 flex flex-col gap-4 md:gap-5">
              <div className="flex gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={12} className="fill-accent text-accent" />
                ))}
              </div>
              <p
                className="text-foreground text-base leading-relaxed flex-1 italic"
                style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
              >
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="border-t border-border pt-5">
                <p
                  className="text-foreground text-sm font-medium"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {t.name}
                </p>
                <p
                  className="text-muted-foreground text-xs tracking-wide mt-1"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {t.origin}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <a
            href="https://g.page/glampingnaturalsound/review"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
          >
            Ver opiniones en Google
          </a>
        </div>
      </div>
    </section>
  );
}
