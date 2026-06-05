import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

interface NavBarProps {
  onLoginClick: () => void;
}

export function NavBar({ onLoginClick }: NavBarProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    handler();
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = ["Nosotros", "Hospedaje", "Galería", "Contacto"];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-[#1a100a]/95 backdrop-blur-md border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <img
          src="/images/sk.png"
          alt="Natural Sound"
          className="h-14 sm:h-16 md:h-20 max-w-[120px] md:max-w-[160px] w-auto object-contain mr-4 md:mr-8"
        />

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm tracking-wide"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {l}
            </a>
          ))}
          <a
            href="/reservar"
            className="bg-[#8a6038] hover:bg-[#7a4c28] text-white px-5 py-2 text-sm tracking-wide transition-colors"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Reservar
          </a>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[#1a100a]/98 backdrop-blur-md border-t border-border px-6 py-6 flex flex-col gap-5">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              className="text-foreground text-lg"
              style={{ fontFamily: "'Playfair Display', serif" }}
              onClick={() => setOpen(false)}
            >
              {l}
            </a>
          ))}
          <a
            href="/reservar"
            className="bg-[#8a6038] hover:bg-[#7a4c28] text-white px-5 py-3 text-center text-sm tracking-wide mt-2 transition-colors"
            onClick={() => setOpen(false)}
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Reservar
          </a>
        </div>
      )}
    </nav>
  );
}
