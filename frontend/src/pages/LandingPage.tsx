import * as React from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Button } from "../components/ui/Button";
import heroImage from "../assets/images/mentora.png";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../constants/routes.constants";
import { Users, Target, TrendingUp, Star, CheckCircle } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  // Navigation handlers for Header buttons
  const handleLoginClick = () => {
    navigate(ROUTES.LOGIN);
  };

  const handleGetStartedClick = () => {
    navigate(ROUTES.REGISTER);
  };

  return (
    <>
      <Header onLoginClick={handleLoginClick} onGetStartedClick={handleGetStartedClick} />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#49BBBD]/80 via-[#49BBBD]/60 to-[#49BBBD]/40 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-20 lg:grid lg:grid-cols-2 lg:items-center lg:px-6 relative z-10">
          <div className="space-y-6">
            <p className="text-sm font-semibold tracking-wider text-white/90">
              Mentoring that moves you
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
              Your <span className="text-white/90">Learning</span>, Our
              Mentoring
            </h1>
            <p className="max-w-prose text-white/80">
              Live interactions, comprehensive study materials, and flexible
              schedules — designed to match your pace.
            </p>
            <div className="flex flex-wrap gap-4 mt-6">
              <Button onClick={() => navigate(ROUTES.REGISTER)}>Get Started</Button>
              <Button variant="secondary">View Courses</Button>
            </div>
          </div>

          <div className="mt-10 lg:mt-0 relative">
            <img
              src={heroImage}
              alt="Professional mentor"
              className="rounded-2xl shadow-2xl"
            />
            <div className="absolute top-4 -right-4 bg-white p-3 rounded-lg shadow-lg flex items-center space-x-2">
              <CheckCircle className="text-green-500" size={20} />
              <span className="text-sm font-semibold text-gray-800">
                1000+ Success Stories
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* WHY SECTION */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Why choose <span className="text-teal-600">Aptus?</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We provide the best platform to connect mentors and mentees for
            meaningful growth
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FeatureCard
            icon={<Users className="text-teal-600" size={32} />}
            title="Live Interactive Classes"
            desc="Real-time doubts & feedback."
          />
          <FeatureCard
            icon={<Target className="text-teal-600" size={32} />}
            title="Comprehensive Study Materials"
            desc="Organized, updated content."
          />
          <FeatureCard
            icon={<TrendingUp className="text-teal-600" size={32} />}
            title="Flexible Schedules"
            desc="Learn without disrupting life."
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 text-center">
          <h2 className="text-3xl font-bold mb-8">How it works</h2>
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Step n={1} title="Choose a Mentor" />
            <Step n={2} title="Book a Slot" />
            <Step n={3} title="Join Live Session" />
            <Step n={4} title="Track Progress" />
          </ol>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
          <h2 className="text-3xl font-bold">What they say</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Testimonial name="Aisha" text="Hands down the best mentoring!" />
          <Testimonial name="Rahul" text="Structured, friendly, effective." />
          <Testimonial name="Meera" text="Flex schedules saved my routine." />
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 lg:px-6">
          <h2 className="text-2xl font-bold text-center mb-6">
            Frequently Asked Questions
          </h2>
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
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-[#49BBBD] to-[#2FA9A7] text-white text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          Ready to Transform Your Career?
        </h2>
        <p className="text-xl mb-6">
          Join thousands of professionals who have accelerated their growth
          through mentoring
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mx-auto max-w-md">
          <input
            type="email"
            placeholder="Enter your email"
            className="px-6 py-3 rounded-full text-gray-900 w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <Button>Get Started</Button>
        </div>
      </section>

      <Footer />
    </>
  );
}

/** --- Components --- */
function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1 text-center">
      <div className="mb-4 flex justify-center">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{desc}</p>
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
      <div className="flex items-center mb-2">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="text-yellow-400 fill-yellow-400" size={16} />
        ))}
      </div>
      <p className="italic text-gray-700">“{text}”</p>
      <p className="mt-3 text-sm font-semibold text-gray-900">— {name}</p>
    </div>
  );
}
function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-xl border border-slate-200 bg-white mb-3">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="font-medium text-gray-900">{q}</span>
        <span className="text-gray-500">{open ? "–" : "+"}</span>
      </button>
      {open && <p className="px-4 pb-4 text-sm text-gray-600">{a}</p>}
    </div>
  );
}
