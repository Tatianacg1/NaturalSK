import { useEffect } from "react";
import { NavBar } from "./components/layout/NavBar";
import { Footer } from "./components/layout/Footer";
import { Hero } from "./components/sections/Hero";
import { About } from "./components/sections/About";
import { Accommodations } from "./components/sections/Accommodations";
import { Gallery } from "./components/sections/Gallery";
import { Testimonials } from "./components/sections/Testimonials";
import { Contact } from "./components/sections/Contact";
import { reservaPublicaAPI } from "../services/api";

interface AppProps {
  onLoginClick: () => void;
}

export default function App({ onLoginClick }: AppProps) {
  // Pre-carga la disponibilidad mientras el usuario navega la página principal,
  // así el calendario aparece al instante cuando entra a /reservar
  useEffect(() => {
    reservaPublicaAPI.disponibilidadGeneral().catch(() => {});
  }, []);

  return (
    <div className="bg-background text-foreground min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <NavBar onLoginClick={onLoginClick} />
      <Hero />
      <About />
      <Accommodations />
      <Gallery />
      <Testimonials />
      <Contact />
      <Footer />
    </div>
  );
}
