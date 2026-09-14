import { About } from "@/components/sections/About";
import { Approach } from "@/components/sections/Approach";
import { Booking } from "@/components/sections/Booking";
import { Contact } from "@/components/sections/Contact";
import { ExpertiseRibbon } from "@/components/sections/ExpertiseRibbon";
import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
import { Journey } from "@/components/sections/Journey";
import { Papers } from "@/components/sections/Papers";
import { Treatments } from "@/components/sections/Treatments";
import { Voices } from "@/components/sections/Voices";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { listPublishedTestimonials } from "@/server/booking/service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const testimonials = await listPublishedTestimonials();

  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <ExpertiseRibbon />
        <About />
        <Treatments />
        <Approach />
        <Journey />
        <Papers />
        <Booking />
        <Voices testimonials={testimonials} />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
