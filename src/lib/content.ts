/**
 * Site copy. Kept deliberately short — this is a clinic, not a blog.
 * [PLACEHOLDER] marks anything still awaiting real detail.
 */

export const CLINIC = {
  brand: "The Skin Edit",
  tagline: "by Dr Akshi Bansal",
  doctor: {
    name: "Dr Akshi Bansal",
    first: "Akshi",
    title: "Dermatologist · Dermatosurgeon · Trichologist",
    registration: "KMC/99857",
    photo: "/dr-akshi-bansal.jpg",
    /** Where she consults. The Skin Edit is its own practice, not a hospital department. */
    consultsAt: "Manipal Hospital, Sarjapur Road & Whitefield",
    languages: ["English", "Hindi", "Kannada"],
  },
  phone: "+91 87929 82600",
  phoneHref: "+918792982600",
  whatsapp: "https://wa.me/918792982600",
  email: "hello@theskinedit.in", // [PLACEHOLDER] confirm public inbox
  timings: [
    { days: "Tue · Thu · Sat", hours: "1:30 – 5:30 pm" },
    { days: "Friday", hours: "5:00 – 8:00 pm" },
  ],
  city: "Bengaluru",
} as const;

export const HERO = {
  label: "Dermatology in Bengaluru",
  title: "Your skin deserves",
  accent: "a specialist's eye.",
  sub: "Dr Akshi Bansal treats skin, hair and ageing the way it should be treated — diagnosis first, then a plan you actually understand, with the time to ask about it.",
  cta: "Book an appointment",
  ctaSecondary: "Meet Dr Bansal",
};

/** Four things worth knowing in four seconds. */
export const HERO_FACTS = [
  { value: "12+", label: "Years in practice" },
  { value: "MD · DNB", label: "Dermatology" },
  { value: "MRCP-SCE", label: "Royal College, UK" },
  { value: "EBDVD", label: "European Board" },
];

export const ABOUT = {
  label: "About",
  title: "Trained across three",
  accent: "continents.",
  body: [
    "Dr Akshi Bansal is a Senior Consultant Dermatologist in Bengaluru, practising clinical dermatology, trichology, dermatosurgery and aesthetic medicine.",
    "She took her MD at Bangalore Medical College as a gold medallist, then added a fellowship in dermatosurgery, the Royal College of Physicians specialty certificate in the UK, and the European Board diploma — all in the same year. She reviews papers for the Journal of the American Academy of Dermatology.",
  ],
  credentials: [
    "MD (DVL)",
    "DNB (DVL)",
    "FRGUHS — Dermatosurgery",
    "MRCP-SCE — Royal College of Physicians, UK",
    "Diplomate, European Board of Dermatovenereology",
  ],
  /**
   * [VERIFY] Supplied in the project brief, not independently confirmed.
   * Stated as a credential rather than a marketing claim — remove the second
   * sentence if it cannot be substantiated.
   */
  distinction: {
    title: "European Board certified",
    body: "The EBDVD diploma is examined by the European Academy of Dermatology and Venereology and held by very few dermatologists in India.",
  },
  positions: [
    "Board member, IADVL Special Interest Group in Aesthetics",
    "Reviewer, Journal of the American Academy of Dermatology",
    "Contributor, IADVL Textbook of Dermatology (4th edition)",
    "Prof. C S Bhavani Kumar Memorial Award, DERMACON 2017",
  ],
};

export type Service = {
  slug: string;
  name: string;
  line: string;
  body: string;
  includes: string[];
  group: "Skin" | "Hair" | "Aesthetics" | "Surgery";
};

export const SERVICES: Service[] = [
  {
    slug: "acne",
    name: "Acne & scarring",
    line: "Settle the breakout, then repair the texture.",
    body: "Acne is rarely one thing — hormones, barrier health and habit all play a part. We find the driver first, calm the active lesions, and only then resurface the marks left behind.",
    includes: ["Medical protocols", "Peels", "Microneedling & RF", "Fractional laser", "Subcision"],
    group: "Skin",
  },
  {
    slug: "pigmentation",
    name: "Pigmentation & melasma",
    line: "For the marks that outstay their cause.",
    body: "Melasma, post-inflammatory pigment and sun damage each respond to a different lever. Careful diagnosis, then topicals, peels and conservatively dosed laser — with sun protection treated as part of the prescription.",
    includes: ["Depigmenting therapy", "Q-switched Nd:YAG", "Mesotherapy", "Peels"],
    group: "Skin",
  },
  {
    slug: "hair-loss",
    name: "Hair loss & trichology",
    line: "Diagnose the shedding before treating it.",
    body: "Trichoscopy and bloodwork separate androgenetic thinning from telogen effluvium, deficiency or scarring alopecia — because each has a different ceiling. Treatment is sequenced to what the scalp can realistically recover.",
    includes: ["Trichoscopy", "PRP", "GFC mesotherapy", "Medical management"],
    group: "Hair",
  },
  {
    slug: "hair-transplant",
    name: "Hair transplantation",
    line: "Density restored, hairline designed.",
    body: "Follicular unit extraction planned around your face rather than a template — hairline design, graft budgeting and long-term donor management discussed in full before anything is booked.",
    includes: ["Candidacy assessment", "Hairline design", "FUE", "Post-op care"],
    group: "Surgery",
  },
  {
    slug: "anti-ageing",
    name: "Anti-ageing & skin quality",
    line: "Skin that looks well, not worked on.",
    body: "Collagen stimulation, barrier repair and targeted volume, chosen for how your face actually moves and ages. A strong bias toward restraint.",
    includes: ["Skin boosters", "Collagen stimulators", "Medical-grade regimens"],
    group: "Aesthetics",
  },
  {
    slug: "botox-fillers",
    name: "Botox & fillers",
    line: "Every expression stays yours.",
    body: "Neuromodulators and hyaluronic acid placed in small, reversible steps — softening lines and restoring structure without changing the face you recognise. Reviewed at two weeks.",
    includes: ["Botulinum toxin", "HA fillers", "Lip & chin balance", "Jawline"],
    group: "Aesthetics",
  },
  {
    slug: "lasers",
    name: "Laser dermatology",
    line: "FDA-approved platforms, conservative settings.",
    body: "Laser is a tool, not a plan. Device and dose are matched to your skin type and the specific lesion — pigment, vessels, hair or texture — with a test patch wherever the skin warrants care.",
    includes: ["Q-switched Nd:YAG", "Hair reduction", "Vascular laser", "Resurfacing"],
    group: "Aesthetics",
  },
  {
    slug: "dermatosurgery",
    name: "Dermatosurgery",
    line: "Removed with the scar in mind.",
    body: "Moles, cysts, keloids, tags and suspicious lesions assessed and excised by a fellowship-trained dermatosurgeon — with histopathology whenever a lesion earns it.",
    includes: ["Mole & lesion excision", "Keloids", "Nail surgery", "Vitiligo surgery"],
    group: "Surgery",
  },
];

export const APPROACH = {
  label: "Approach",
  title: "Three rules, every",
  accent: "consultation.",
  items: [
    {
      n: "01",
      title: "Diagnose first",
      body: "Nothing is prescribed before the cause is understood. Where a lesion is uncertain, the test comes before the treatment.",
    },
    {
      n: "02",
      title: "Treat conservatively",
      body: "The least intervention that gets the result, staged over time. Skin rewards patience far more than aggression.",
    },
    {
      n: "03",
      title: "Explain fully",
      body: "What it costs, how long it lasts, what it will realistically look like — and what happens if you do nothing at all.",
    },
  ],
};

export const BOOKING = {
  label: "Appointments",
  title: "Pick a time that",
  accent: "actually suits you.",
  sub: "Live availability, confirmed the moment you book. No account, no waiting for a call back — and you can move or cancel it yourself later.",
};

export const FAQS = [
  {
    q: "How do I reschedule or cancel?",
    a: "Open Manage booking, enter your reference and the phone number you booked with, and change it yourself. Free up to 4 hours before your appointment — inside that window, please call the clinic.",
  },
  {
    q: "Online or in person?",
    a: "Online works well for follow-ups, report reviews and second opinions on an existing plan. Choose in person for a first visit, anything that needs examining under light or dermoscopy, and for every procedure.",
  },
  {
    q: "What happens at a first visit?",
    a: "Twenty to thirty minutes. History, then examination, often with dermoscopy. If the diagnosis is not certain, tests come before treatment. You leave with a written plan, its cost and its timeline.",
  },
  {
    q: "Do I need an account to book?",
    a: "No. Name, phone and email is all we take. A reference number arrives with your confirmation — keep it to manage the appointment later.",
  },
  {
    q: "How are my details handled?",
    a: "Only what is needed to hold the appointment is stored: name, phone, email and the slot. No medical records are kept in this system. Consent is recorded when you book, under the DPDP Act 2023, and you can ask for your details to be deleted any time.",
  },
  {
    q: "Are fees paid online?",
    a: "Not yet — consultation fees are settled in person. [PLACEHOLDER] Online payment is planned.",
  },
];

export const NAV = [
  { href: "#about", label: "About" },
  { href: "#treatments", label: "Treatments" },
  { href: "#approach", label: "Approach" },
  { href: "#book", label: "Book" },
  { href: "#voices", label: "Voices" },
  { href: "#contact", label: "Contact" },
];

/**
 * [PLACEHOLDER] Shown only until the first real patient note is approved in the
 * dashboard, and labelled on screen so it cannot be mistaken for a review.
 */
export const SAMPLE_TESTIMONIALS = [
  {
    id: "sample-1",
    name: "Sample",
    rating: 5,
    comment: "Placeholder for an approved patient note. Real notes replace these from the feedback inbox.",
    publishedAt: null,
  },
  {
    id: "sample-2",
    name: "Sample",
    rating: 5,
    comment: "Placeholder for an approved patient note. Nothing is published without Dr Bansal approving it.",
    publishedAt: null,
  },
  {
    id: "sample-3",
    name: "Sample",
    rating: 5,
    comment: "Placeholder for an approved patient note. Feedback is requested after every appointment.",
    publishedAt: null,
  },
];
