import * as React from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Button } from "../components/ui/Button";
import heroImage from "../assets/images/mentora.png";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <>
      <Header />

      {/* MAIN */}
      <main id="content">
        {/* HERO */}
        <section
          id="home"
          className="relative overflow-hidden bg-gradient-to-b from-teal-200/40 to-white"
        >
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-20 lg:grid-cols-2 lg:items-center lg:px-6">
            <div>
              <p className="text-sm font-semibold tracking-wider text-blue-700">
                Mentoring that moves you
              </p>
              <h1 className="mt-2 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
                Your <span className="text-blue-600">Learning</span>, Our
                Mentoring
              </h1>
              <p className="mt-4 max-w-prose text-slate-600">
                Live interactions, comprehensive study materials, and flexible
                schedules — designed to match your pace.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={()=> navigate("/register")}>Get Started</Button>
                <Button variant="secondary">View Courses</Button>
              </div>
            </div>

            {/* Right-side hero image placeholder */}
            <div className="inline-block rounded-3xl bg-slate-100 shadow-inner mx-auto my-8 p-4">
              <img
                src={heroImage}
                alt="Professional mentor"
                className="rounded-2xl shadow-2xl max-w-full h-auto"
              />
            </div>
          </div>
        </section>

        {/* WHY SECTION */}
        <section id="why" className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
          <h2 className="text-2xl font-bold text-center">
            Why choose Mentora?
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title="Live Interactive Classes"
              desc="Real-time doubts & feedback."
            />
            <FeatureCard
              title="Comprehensive Study Materials"
              desc="Organized, updated content."
            />
            <FeatureCard
              title="Flexible Schedules"
              desc="Learn without disrupting life."
            />
          </div>
        </section>

        {/* HOW SECTION */}
        <section id="how" className="bg-slate-50 py-16">
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <h2 className="text-2xl font-bold text-center">How it works</h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Step n={1} title="Choose a Mentor" />
              <Step n={2} title="Book a Slot" />
              <Step n={3} title="Join Live Session" />
              <Step n={4} title="Track Progress" />
            </ol>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section
          id="testimonials"
          className="mx-auto max-w-7xl px-4 py-16 lg:px-6"
        >
          <h2 className="text-2xl font-bold text-center">What they say</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Testimonial name="Aisha" text="Hands down the best mentoring!" />
            <Testimonial name="Rahul" text="Structured, friendly, effective." />
            <Testimonial name="Meera" text="Flex schedules saved my routine." />
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-slate-50 py-16">
          <div className="mx-auto max-w-3xl px-4 lg:px-6">
            <h2 className="text-2xl font-bold text-center">
              Frequently Asked Questions
            </h2>
            <div className="mt-6 space-y-3">
              <FAQ
                q="Can I join anytime?"
                a="Yes, batches are rolling with flexible slots."
              />
              <FAQ
                q="Do you provide materials?"
                a="Yes, included with every plan."
              />
              <FAQ
                q="Are sessions recorded?"
                a="Yes, recordings are available to revisit."
              />
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <Footer />
    </>
  );
}

/** --- tiny local UI (you can move these into components/ui later) --- */
function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
    </div>
  );
}
function Step({ n, title }: { n: number; title: string }) {
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
        {n}
      </div>
      <p className="mt-3 font-medium">{title}</p>
    </li>
  );
}
function Testimonial({ name, text }: { name: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="italic text-slate-700">“{text}”</p>
      <p className="mt-3 text-sm font-semibold text-slate-900">— {name}</p>
    </div>
  );
}
function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
      >
        <span className="font-medium text-slate-900">{q}</span>
        <span className="text-slate-500">{open ? "–" : "+"}</span>
      </button>
      {open && <p className="px-4 pb-4 text-sm text-slate-600">{a}</p>}
    </div>
  );
}
