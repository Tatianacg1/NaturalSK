export function Footer() {
  const links = ["Nosotros", "Hospedaje", "Galería", "Contacto"];

  return (
    <footer className="border-t border-border py-8 px-4 md:py-12 md:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8">
        <div>
          <p
            className="text-primary text-xl md:text-2xl font-bold mb-1"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Natural Sound
          </p>
          <p
            className="text-muted-foreground text-xs tracking-wide"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Glamping & Hotel Boutique · San Felix, Bello.
          </p>
        </div>

        <div className="flex flex-wrap gap-6">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              className="text-muted-foreground text-xs tracking-wide hover:text-foreground transition-colors uppercase"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {l}
            </a>
          ))}
        </div>

        <p
          className="text-muted-foreground/50 text-xs"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          © 2026 Natural Sound
        </p>
      </div>
    </footer>
  );
}
