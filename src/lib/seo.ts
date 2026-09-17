import { ABOUT, CLINIC, EXPERIENCE, FAQS, SERVICES } from "@/lib/content";

/**
 * JSON-LD for the single public page.
 *
 * Everything here mirrors copy that is actually visible on the page — no review
 * or rating schema, and no aggregate figures, because there is nothing genuine
 * to describe yet.
 */
export function structuredData(siteUrl: string) {
  const doctorId = `${siteUrl}/#doctor`;
  const practiceId = `${siteUrl}/#practice`;
  const websiteId = `${siteUrl}/#website`;

  const qualifications = [
    ...ABOUT.credentials.map((name) => ({
      "@type": "EducationalOccupationalCredential" as const,
      name,
    })),
  ];

  const person = {
    "@type": ["Person", "Physician"],
    "@id": doctorId,
    name: CLINIC.doctor.name,
    givenName: CLINIC.doctor.first,
    familyName: "Bansal",
    jobTitle: "Senior Dermatologist",
    description:
      "Dr Akshi Bansal is a senior dermatologist, dermatosurgeon and trichologist in Bengaluru, practising clinical dermatology, trichology, dermatosurgery and aesthetic dermatology.",
    url: siteUrl,
    image: `${siteUrl}${CLINIC.doctor.photo}`,
    telephone: CLINIC.phone,
    email: CLINIC.email,
    medicalSpecialty: ["Dermatology", "Dermatologic Surgery"],
    knowsLanguage: [...CLINIC.doctor.languages],
    knowsAbout: SERVICES.map((service) => service.name),
    hasCredential: qualifications,
    alumniOf: [
      "Bangalore Medical College and Research Institute",
      "Kasturba Medical College, Mangalore",
    ].map((name) => ({ "@type": "EducationalOrganization" as const, name })),
    worksFor: { "@id": practiceId },
    workLocation: {
      "@type": "Place",
      name: CLINIC.doctor.consultsAt,
      address: {
        "@type": "PostalAddress",
        addressLocality: CLINIC.city,
        addressRegion: "Karnataka",
        addressCountry: "IN",
      },
    },
    identifier: {
      "@type": "PropertyValue",
      name: "Karnataka Medical Council registration",
      value: CLINIC.doctor.registrationShort,
    },
    affiliation: EXPERIENCE.map((entry) => ({
      "@type": "Organization" as const,
      name: entry.place,
    })),
  };

  const practice = {
    "@type": ["MedicalBusiness", "MedicalClinic"],
    "@id": practiceId,
    name: CLINIC.brand,
    url: siteUrl,
    image: `${siteUrl}${CLINIC.doctor.photo}`,
    telephone: CLINIC.phone,
    email: CLINIC.email,
    medicalSpecialty: "Dermatology",
    areaServed: { "@type": "City", name: CLINIC.city },
    address: {
      "@type": "PostalAddress",
      addressLocality: CLINIC.city,
      addressRegion: "Karnataka",
      addressCountry: "IN",
    },
    availableService: SERVICES.map((service) => ({
      "@type": "MedicalProcedure" as const,
      name: service.name,
      description: service.body,
    })),
    employee: { "@id": doctorId },
    founder: { "@id": doctorId },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Tuesday", "Thursday", "Saturday"],
        opens: "13:30",
        closes: "17:30",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Friday"],
        opens: "17:00",
        closes: "20:00",
      },
    ],
  };

  const website = {
    "@type": "WebSite",
    "@id": websiteId,
    url: siteUrl,
    name: `${CLINIC.brand} — ${CLINIC.doctor.name}`,
    inLanguage: "en-IN",
    publisher: { "@id": practiceId },
  };

  const breadcrumbs = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "About Dr Akshi Bansal", item: `${siteUrl}/#about` },
      { "@type": "ListItem", position: 3, name: "Treatments", item: `${siteUrl}/#treatments` },
      { "@type": "ListItem", position: 4, name: "Book an appointment", item: `${siteUrl}/#book` },
    ],
  };

  /** Every entry below is rendered verbatim in the visible FAQ accordion. */
  const faq = {
    "@type": "FAQPage",
    "@id": `${siteUrl}/#faq`,
    mainEntity: FAQS.map((item) => ({
      "@type": "Question" as const,
      name: item.q,
      acceptedAnswer: { "@type": "Answer" as const, text: item.a },
    })),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [person, practice, website, breadcrumbs, faq],
  };
}
