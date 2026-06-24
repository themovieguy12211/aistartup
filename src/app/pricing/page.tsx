"use client";

import { useSession } from "@/lib/use-session";
import Navbar from "@/components/Navbar";
import ChatNavbar from "@/components/ChatNavbar";
import PricingSection from "@/components/PricingSection";

export default function PricingPage() {
  const { data: session } = useSession();

  return (
    <>
      {session ? <ChatNavbar credits={null} onCreditsChange={() => {}} /> : <Navbar />}
      <main>
        <div className="text-center pt-5 pb-3">
          <h1 className="display-5 fw-bold">Pricing Plans</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", maxWidth: "500px", margin: "0 auto" }}>
            Start for free. Scale when you&apos;re ready. All plans include access to every model.
          </p>
        </div>
        <PricingSection />
      </main>
    </>
  );
}
