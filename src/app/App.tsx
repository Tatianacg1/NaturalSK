import { NavBar } from "./components/layout/NavBar";
import { Footer } from "./components/layout/Footer";
import { Hero } from "./components/sections/Hero";
import { About } from "./components/sections/About";
import { Accommodations } from "./components/sections/Accommodations";
import { Gallery } from "./components/sections/Gallery";
import { Testimonials } from "./components/sections/Testimonials";
import { Contact } from "./components/sections/Contact";

interface AppProps {
  onLoginClick: () => void;
}

export default function App({ onLoginClick }: AppProps) {
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
