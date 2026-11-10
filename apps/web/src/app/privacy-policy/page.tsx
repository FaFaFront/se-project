import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Tutorist",
  description: "How Tutorist handles information used to provide its tutoring platform.",
};

const sections = [
  {
    title: "Information used by Tutorist",
    content: [
      "When you create an account, Tutorist uses your email address, password, and account role (student or tutor) to provide sign-in and account features. Passwords are stored as password hashes.",
      "Profiles may include your name, profile image, biography, and role-specific details. Student profiles can include grade level and learning goals. Tutor profiles can include subjects and hourly rates. Tutor profile information may be visible to people browsing tutors.",
      "When you use the platform, it also handles messages, classroom and session details, reviews, and wallet transaction records. Tutors requesting a withdrawal provide bank and account details so the withdrawal can be processed; the app masks the account number in its stored withdrawal record.",
    ],
  },
  {
    title: "How information is used",
    content: [
      "Tutorist uses this information to operate accounts, show tutor listings, connect students and tutors, support classrooms and sessions, maintain reviews, and record wallet activity. It is also used to protect accounts and keep the service working.",
    ],
  },
  {
    title: "Service providers",
    content: [
      "Tutorist relies on infrastructure providers to run the service. Profile images are uploaded to configured cloud storage. Online meeting links may be created through Google Meet. Those providers process information under their own terms and privacy practices.",
    ],
  },
  {
    title: "Sharing and visibility",
    content: [
      "Tutorist shares information within the service when needed for its features. Public tutor profile details and reviews can be viewed by prospective students. Messages are made available to the conversation participants, while classroom and session details are available to the relevant student and tutor.",
      "We do not sell personal information. Information may also be disclosed if required by law or needed to protect the service and its users.",
    ],
  },
  {
    title: "Security and retention",
    content: [
      "Tutorist uses account authentication and password hashing to help protect information. No online service can guarantee absolute security. Information is retained for as long as needed to provide the service, maintain account and transaction records, and meet applicable obligations.",
    ],
  },
  {
    title: "Your choices and this policy",
    content: [
      "You can review and update profile details through the profile features available in the app. For questions about your information or requests concerning your account, contact the Tutorist project team through the project repository.",
      "This policy describes the current Tutorist project features and may be updated as the service changes. Last updated: November 10, 2026.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#faf9fc] px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm sm:p-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">Legal</p>
        <h1 className="font-outfit mb-3 text-4xl font-bold text-brand-plum-deepest sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mb-8 text-sm text-ink/60">Last updated: November 10, 2026</p>
        <div className="space-y-8">
          {sections.map(({ title, content }) => (
            <section key={title}>
              <h2 className="mb-3 text-xl font-semibold text-brand-plum-deepest">{title}</h2>
              <div className="space-y-3 text-base leading-7 text-ink/80">
                {content.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
