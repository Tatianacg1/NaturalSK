import { MapPin, Phone, Instagram } from "lucide-react";

const VALLEY_IMG = "/images/pisc1.jpeg";

const contactInfo = [
  {
    Icon: Phone,
    text: "+57 (304) 664 3574",
    href: "https://wa.me/573046643574?text=Hola%20quiero%20reservar%20una%20estancia%20en%20Natural%20Sound",
  },
  {
    Icon: Instagram,
    text: "@glampingnaturalsound",
    href: "https://www.instagram.com/glampingnaturalsound",
  },
  {
    Icon: MapPin,
    text: "San Felix, Bello, Antioquia",
    href: "https://www.google.com/maps/place/Glamping+Natural+Sound/@6.3950059,-75.6092608,17z/data=!3m1!4b1!4m6!3m5!1s0x8e44319493fda8a3:0x773575a3a81207a0!8m2!3d6.3950059!4d-75.6066859!16s%2Fg%2F11qgcn931k?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D",
  },
];

export function Contact() {
  return (
    <section id="contacto" className="py-14 px-4 md:py-28 md:px-6 overflow-hidden">
      <div className="max-w-3xl mx-auto flex flex-col items-center text-center gap-8">

        <div>
          <p
            className="text-accent text-xs tracking-[0.3em] uppercase mb-4"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            05 — Contacto
          </p>
          <h2
            className="text-foreground text-3xl md:text-4xl lg:text-5xl font-semibold mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Contáctanos.
            <br />
            Reserva en línea.
          </h2>
          <p
            className="text-muted-foreground text-base leading-relaxed"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            Solicita tu reserva directamente desde aquí. El equipo de Natural Sound revisará
            la disponibilidad y te confirmará a la brevedad.
          </p>
        </div>

        <div className="w-full bg-card/70 border border-border rounded-3xl p-5 md:p-8 space-y-4">
          {contactInfo.map(({ Icon, text, href }) => (
            <div key={text} className="flex items-center justify-center gap-4">
              <Icon size={16} className="text-primary shrink-0" />
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground text-sm hover:text-primary transition-colors underline-offset-2 hover:underline"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {text}
              </a>
            </div>
          ))}
        </div>

        <div className="w-full relative h-52 overflow-hidden bg-secondary rounded-2xl">
          <img
            src={VALLEY_IMG}
            alt="Vista aérea del bosque Natural Sound"
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a0e]/50 to-transparent" />
          <p
            className="absolute bottom-4 left-0 right-0 text-center text-foreground text-sm italic"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            San Felix, Bello, Antioquia — Natural sound
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:justify-center">
          <a
            href="/reservar"
            className="inline-flex items-center justify-center rounded-full bg-[#8a6038] hover:bg-[#7a4c28] px-8 py-4 text-sm font-semibold text-white transition-colors text-center"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Solicitar reserva
          </a>
          <a
            href="https://wa.me/573046643574?text=Hola%20quiero%20reservar%20una%20estancia%20en%20Natural%20Sound"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-border px-8 py-4 text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors text-center"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            O escríbenos por WhatsApp
          </a>
        </div>

      </div>
    </section>
  );
}
