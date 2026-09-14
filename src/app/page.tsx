import { About } from "@/components/sections/About";
import { Approach } from "@/components/sections/Approach";
import { Booking } from "@/components/sections/Booking";
import { Contact } from "@/components/sections/Contact";
import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
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
        <About />
        <Treatments />
        <Approach />
        <Booking />
        <Voices testimonials={testimonials} />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
