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

/**
 * Approved patient notes are the only thing this page needs from the database,
 * and they are the least important thing on it. A store that is unreachable or
 * not yet migrated used to take the whole site down with a 500 — a clinic's
 * front page should not depend on that. It renders without them instead, and
 * the booking section reports its own trouble in place.
 */
async function testimonialsOrNone() {
  try {
    return await listPublishedTestimonials();
  } catch (error) {
    console.error("Could not load testimonials; rendering the page without them.", error);
    return [];
  }
}

export default async function HomePage() {
  const testimonials = await testimonialsOrNone();

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
