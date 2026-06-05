import { MapPin, Phone, Instagram } from "lucide-react";

const VALLEY_IMG = "/images/pisc1.jpeg";

const contactInfo = [
  { Icon: Phone, text: "+57 (304) 664 3574" },
  { Icon: Instagram, text: "@glampingnaturalsound" },
  { Icon: MapPin, text: "San Felix, Bello, Antioquia" },
] as const;

export function Contact() {
  return (
    <section id="contacto" className="py-14 px-4 md:py-28 md:px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 md:gap-20 items-start">
        <div>
          <p
            className="text-accent text-xs tracking-[0.3em] uppercase mb-4"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            05 — Contacto
          </p>
          <h2
            className="text-foreground text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 md:mb-8"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Contáctanos.
            <br />
            Reserva en línea.
          </h2>
          <div className="space-y-4 mb-8 md:mb-12 bg-card/70 border border-border rounded-3xl p-5 md:p-8">
            {contactInfo.map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-4">
                <Icon size={16} className="text-primary shrink-0" />
                <span
                  className="text-muted-foreground text-sm"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>

          <div className="relative h-52 overflow-hidden bg-secondary">
            <img
              src={VALLEY_IMG}
              alt="Vista aérea del bosque Natural Sound"
              className="w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a0e]/50 to-transparent" />
            <p
              className="absolute bottom-4 left-4 text-foreground text-sm italic"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              San Felix, Bello, Antioquia — Natural sound
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-6">
          <p
            className="text-muted-foreground text-base leading-relaxed"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            Solicita tu reserva directamente desde aquí. El equipo de Natural Sound revisará
            la disponibilidad y te confirmará a la brevedad.
          </p>
          <a
            href="/reservar"
            className="inline-flex items-center justify-center rounded-full bg-[#8a6038] hover:bg-[#7a4c28] px-6 py-4 text-sm font-semibold text-white transition-colors w-full sm:w-auto text-center"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Solicitar reserva
          </a>
          <a
            href="https://wa.me/573046643574?text=Hola%20quiero%20reservar%20una%20estancia%20en%20Natural%20Sound"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-border px-6 py-4 text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors w-full sm:w-auto text-center"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            O escríbenos por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
