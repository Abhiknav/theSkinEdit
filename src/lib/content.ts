/**
 * Site copy. Kept deliberately short — this is a clinic, not a blog.
 *
 * Everything here is either factual (qualifications, roles, publications) or
 * plain description. Nothing in this file should claim seniority through
 * adjectives; the credentials carry that on their own.
 */

export const CLINIC = {
  brand: "The Skin Edit",
  tagline: "by Dr Akshi Bansal",
  doctor: {
    name: "Dr Akshi Bansal",
    first: "Akshi",
    title: "Senior Dermatologist · Dermatosurgeon · Trichologist",
    registration: "KMC Registration No. 99857",
    /** Short form, for the footer line and structured data. */
    registrationShort: "KMC/99857",
    photo: "/dr-akshi-bansal.jpg",
    photoAlt: "Dr Akshi Bansal, senior dermatologist in Bengaluru",
    /** Where she consults. The Skin Edit is its own practice, not a hospital department. */
    consultsAt: "Manipal Hospital, Sarjapur Road & Whitefield",
    languages: ["English", "Hindi", "Kannada"],
  },
  phone: "+91 87929 82600",
  phoneHref: "+918792982600",
  whatsapp: "https://wa.me/918792982600",
  email: "hello@theskinedit.in",
  timings: [
    { days: "Tue · Thu · Sat", hours: "1:30 – 5:30 pm" },
    { days: "Friday", hours: "5:00 – 8:00 pm" },
  ],
  city: "Bengaluru",
} as const;

export const HERO = {
  label: "Senior Dermatologist · Dermatosurgeon · Trichologist in Bengaluru",
  title: "Your skin deserves",
  accent: "a specialist’s eye.",
  sub: "Dr Akshi Bansal is a senior dermatologist, dermatosurgeon and trichologist in Bengaluru. Her approach is simple: understand the problem first, explain your options clearly, and recommend only what you actually need.",
  cta: "Book an appointment",
  ctaSecondary: "Meet Dr Bansal",
};

/** Four things worth knowing in four seconds. */
export const HERO_FACTS = [
  { value: "13+", label: "Years of clinical experience" },
  { value: "MD · DNB", label: "Dermatology" },
  { value: "MRCP-SCE", label: "Royal College of Physicians, UK" },
  { value: "EBDVD", label: "European Board of Dermatology" },
];

export const ABOUT = {
  label: "About",
  title: "Specialist dermatology,",
  accent: "grounded in diagnosis.",
  body: [
    "Dr Akshi Bansal is a senior dermatologist in Bengaluru with expertise spanning clinical dermatology, trichology, dermatosurgery and aesthetic dermatology.",
    "She completed her MD in Dermatology at Bangalore Medical College and Research Institute as a College Gold Medallist, followed by DNB Dermatology, FRGUHS in Dermatosurgery, MRCP-SCE from the Royal College of Physicians, UK, and the Diplomate European Board of Dermatology.",
  ],
  credentials: [
    "MD (DVL)",
    "DNB (DVL)",
    "FRGUHS — Dermatosurgery",
    "MRCP-SCE — Royal College of Physicians, UK",
    "Diplomate — European Board of Dermatology",
  ],
  distinction: {
    label: "European Board qualification",
    title: "European Board qualification in Dermatology",
    body: "The Diplomate of the European Board of Dermatology is examined by the European Academy of Dermatology and Venereology.",
  },
  /** Roles held alongside clinical practice. Awards live in the Papers section. */
  roles: [
    { role: "Board member", detail: "IADVL Special Interest Group in Aesthetics" },
    { role: "Reviewer", detail: "Journal of the American Academy of Dermatology" },
  ],
};

export type Service = {
  slug: string;
  name: string;
  line: string;
  body: string;
  includes: string[];
  /** Label on the card's booking link — names the consultation being booked. */
  cta: string;
  group: "Skin" | "Hair" | "Aesthetics" | "Surgery";
};

export const SERVICES: Service[] = [
  {
    slug: "acne",
    name: "Acne & scarring",
    line: "Settle the breakout, then repair the texture.",
    body: "Acne treatment starts with understanding what is driving the breakouts — from hormones and oil production to inflammation, skincare habits and the skin barrier. Once active acne is controlled, treatment can focus on the marks and scarring it has left behind.",
    includes: [
      "Medical acne treatment",
      "Chemical peels",
      "Microneedling & radiofrequency",
      "Fractional laser",
      "Subcision",
    ],
    cta: "Book an acne consultation",
    group: "Skin",
  },
  {
    slug: "pigmentation",
    name: "Pigmentation & melasma",
    line: "For the marks that outstay their cause.",
    body: "Melasma, post-inflammatory pigmentation and sun damage each respond to a different lever, so treatment begins with identifying which is in play. Topical therapy, peels and carefully dosed laser are then sequenced together, with sun protection treated as part of the prescription.",
    includes: ["Melasma treatment", "Depigmenting therapy", "Q-switched Nd:YAG", "Chemical peels"],
    cta: "Book a pigmentation consultation",
    group: "Skin",
  },
  {
    slug: "hair-loss",
    name: "Hair loss & trichology",
    line: "Diagnose the shedding before treating it.",
    body: "Trichoscopy and blood investigations separate androgenetic thinning from telogen effluvium, nutritional deficiency and scarring alopecia — each has a different ceiling. Hair loss treatment is then sequenced to what the scalp can realistically recover.",
    includes: ["Trichoscopy", "PRP therapy", "GFC mesotherapy", "Medical management"],
    cta: "Book a hair loss consultation",
    group: "Hair",
  },
  {
    slug: "hair-transplant",
    name: "Hair transplantation",
    line: "Density restored, hairline designed.",
    body: "Follicular unit extraction planned around your face rather than a template. Candidacy, hairline design, graft numbers and long-term donor management are discussed in full before anything is booked.",
    includes: ["Candidacy assessment", "Hairline design", "FUE", "Post-operative care"],
    cta: "Book a hair transplant consultation",
    group: "Surgery",
  },
  {
    slug: "anti-ageing",
    name: "Anti-ageing & skin quality",
    line: "Skin that looks well, not worked on.",
    body: "Collagen stimulation, barrier repair and targeted volume, chosen for how your face actually moves and ages. The bias is toward restraint and toward treatments that hold up over years rather than weeks.",
    includes: ["Skin boosters", "Collagen stimulators", "Medical-grade regimens"],
    cta: "Book a skin quality consultation",
    group: "Aesthetics",
  },
  {
    slug: "botox-fillers",
    name: "Botox & fillers",
    line: "Every expression stays yours.",
    body: "Botulinum toxin and hyaluronic acid fillers placed in small, considered steps — softening lines and restoring structure without changing the face you recognise. Every plan is reviewed at two weeks.",
    includes: ["Botulinum toxin", "HA fillers", "Lip & chin balance", "Jawline"],
    cta: "Book an aesthetic consultation",
    group: "Aesthetics",
  },
  {
    slug: "lasers",
    name: "Laser dermatology",
    line: "Approved platforms, conservative settings.",
    body: "Laser is a tool, not a plan. Device and dose are matched to your skin type and to the specific concern — pigment, vessels, hair or texture — with a test patch wherever the skin warrants it.",
    includes: ["Q-switched Nd:YAG", "Laser hair reduction", "Vascular laser", "Resurfacing"],
    cta: "Book a laser consultation",
    group: "Aesthetics",
  },
  {
    slug: "dermatosurgery",
    name: "Dermatosurgery",
    line: "Removed with the scar in mind.",
    body: "Moles, cysts, keloids, skin tags and suspicious lesions assessed and excised by a fellowship-trained dermatosurgeon, with histopathology whenever a lesion warrants it.",
    includes: ["Mole & lesion excision", "Keloids", "Nail surgery", "Vitiligo surgery"],
    cta: "Book a dermatosurgery consultation",
    group: "Surgery",
  },
];

export const APPROACH = {
  label: "Approach",
  title: "Three principles guide",
  accent: "every consultation.",
  items: [
    {
      n: "01",
      title: "Diagnose first",
      body: "Nothing is prescribed before the cause is understood. Where a lesion or condition is uncertain, the appropriate investigation comes before treatment.",
    },
    {
      n: "02",
      title: "Treat thoughtfully",
      body: "The goal is the right intervention at the right time — not the most intervention. Treatment is planned around what your skin actually needs, with changes made gradually when appropriate.",
    },
    {
      n: "03",
      title: "Explain everything",
      body: "You should know what a treatment involves, what it costs, how long it may take, what results are realistic and what your alternatives are — including doing nothing.",
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
    a: "You can manage your appointment using the booking link provided after you book. If you need help, contact the clinic.",
  },
  {
    q: "Online or in person?",
    a: "In-person consultations are suitable for first visits, examinations and procedures. Online consultations can be used for appropriate follow-ups, reports and second opinions.",
  },
  {
    q: "What happens at a first visit?",
    a: "The consultation begins with understanding your concerns, medical history and relevant symptoms. Dr Bansal will examine the skin, hair or scalp as appropriate, explain the likely diagnosis and discuss suitable treatment options with you.",
  },
  {
    q: "What should I bring to my appointment?",
    a: "Bring any relevant previous prescriptions, reports, investigation results or treatment details that may help explain your skin, hair or scalp concern.",
  },
  {
    q: "Can I book a second opinion?",
    a: "Yes. Second-opinion consultations can be booked online where appropriate. Bring your previous diagnosis, prescriptions, reports and treatment history so they can be reviewed during the consultation.",
  },
  {
    q: "Do I need an account to book?",
    a: "No. You can book without creating an account.",
  },
  {
    q: "How are my details handled?",
    a: "Please share only the information needed to arrange your appointment. Avoid entering detailed medical records or sensitive medical information into the booking form.",
  },
  {
    q: "Are fees paid online?",
    a: "Consultation fees are settled at the consultation.",
  },
];

export const NAV = [
  { href: "#about", label: "About" },
  { href: "#treatments", label: "Treatments" },
  { href: "#journey", label: "Experience" },
  { href: "#papers", label: "Publications" },
  { href: "#book", label: "Book" },
  { href: "#voices", label: "Patients" },
  { href: "#contact", label: "Contact" },
];

/** The ribbon that runs under the hero — the broad areas of care, on a loop. */
export const RIBBON = [
  "Acne & acne scarring",
  "Pigmentation & melasma",
  "Hair loss & trichology",
  "Hair transplantation",
  "Anti-ageing & skin quality",
  "Botox & fillers",
  "Laser dermatology",
  "Dermatosurgery",
];

export const JOURNEY = {
  label: "Experience",
  title: "Clinical experience &",
  accent: "advanced training.",
  lede: "Years of clinical practice alongside postgraduate training, professional examinations and academic work have shaped the way Dr Bansal approaches dermatology today.",
};

/** Career and training. */
export const EXPERIENCE = [
  {
    period: "Present",
    role: "Sr. Consultant Dermatologist",
    place: "Manipal Hospital, Sarjapur Road & Whitefield",
  },
  { period: "Earlier", role: "Consultant Dermatologist", place: "Sakra World Hospital, Bengaluru" },
  { period: "Earlier", role: "Consultant Dermatologist", place: "Olivia Skin & Hair Clinics" },
  { period: "Earlier", role: "Consultant Dermatologist", place: "Apollo Hospitals, Bengaluru" },
  {
    period: "Residency",
    role: "Dermatology residency",
    place: "Victoria Hospital and Bowring & Lady Curzon Hospital, Bengaluru",
  },
  { period: "Residency", role: "Dermatology residency", place: "Sir Gangaram Hospital, New Delhi" },
];

export const EDUCATION = [
  {
    year: "2021",
    title: "Advanced postgraduate qualifications",
    detail:
      "FRGUHS — Dermatosurgery · MRCP-SCE, Royal College of Physicians, UK · Diplomate, European Board of Dermatology",
  },
  { year: "2021", title: "DNB, Dermatology", detail: "National Board of Examinations in Medical Sciences" },
  {
    year: "2017",
    title: "MD, Dermatology",
    detail: "Bangalore Medical College & Research Institute — College Gold Medallist",
  },
  { year: "2012", title: "MBBS", detail: "Kasturba Medical College, Mangalore" },
];

export const PAPERS = {
  label: "Academic work",
  title: "Publications &",
  accent: "academic work.",
  lede: "Clinical practice is complemented by academic work, including peer-reviewed publications, book chapters, textbook contributions and conference presentations.",
  publications: [
    {
      title:
        "A minimally invasive, novel technique to improve outcomes in surgical management of pseudocyst of auricle",
      detail: "Journal of the American Academy of Dermatology",
    },
    {
      title:
        "A novel point of care technique to improve graft uptake in melanocyte-keratinocyte transplantation procedure for vitiligo of contoured areas like external ear",
      detail: "Journal of the American Academy of Dermatology",
    },
    {
      title: "Clinical Correlation and Diagnostic Implications",
      detail: "Book chapters",
    },
    { title: "IADVL Color Atlas of Dermatology", detail: "Contributor" },
    { title: "IADVL Textbook of Dermatology, 4th edition", detail: "Chapter editor" },
  ],
  presentations: [
    {
      venue: "World Congress of Cosmetic Dermatology, 2017",
      topic: "Comparative study of NCECS v/s NCFCS in stable vitiligo",
    },
    {
      venue: "10th Asia Pacific Dermatology Conference, Melbourne",
      topic: "NCECS in stable vitiligo",
    },
    { venue: "DERMACON 2017, Kolkata", topic: "Award paper on NCECS in stable vitiligo" },
    { venue: "CUTICON-KN 2016, Hubli", topic: "NCECS in stable vitiligo" },
    { venue: "CUTICON-KN 2015, Davangere", topic: "Award paper on eccrine porocarcinoma" },
  ],
  recognition: [
    { year: "2017", text: "Prof. C S Bhavani Kumar Memorial Award, DERMACON" },
    { year: "2014", text: "Research grant, Bangalore Dermatological Society" },
    { year: "—", text: "College Gold Medallist — Bangalore Medical College" },
  ],
  roles: [
    { role: "Board member", detail: "IADVL Special Interest Group in Aesthetics" },
    { role: "Editorial Board", detail: "IADVL newsletter RESIDREAM" },
  ],
};

export const VOICES = {
  label: "Patients",
  title: "Patient",
  accent: "experiences.",
  /** Shown until the first genuine note is approved in the dashboard. */
  empty: "Patient feedback will appear here as genuine, approved experiences become available.",
};

export const CONTACT = {
  label: "Contact",
  title: "Visit Dr Bansal in",
  accent: "Bengaluru.",
  lede: "Booking online is the quickest way to find an available appointment. You can also contact the clinic directly if you need help.",
  where:
    "Your appointment confirmation will include the location, address and directions.",
};

export const FOOTER = {
  tagline:
    "Dermatology, trichology and aesthetic medicine in Bengaluru — thoughtful care, clearly explained.",
  note: "Appointment details only — please do not enter medical records into the booking form.",
};
