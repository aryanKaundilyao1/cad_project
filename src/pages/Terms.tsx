import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />

      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <ScrollReveal>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Terms of Service</h1>
            <p className="text-muted-foreground mb-12">Last Updated: October 2023</p>

            <div className="prose prose-invert prose-blue max-w-none">
              <p className="lead text-lg text-muted-foreground leading-relaxed">
                Welcome to JAS CONNECT. These Terms of Service ("Terms") govern your access to and use of the JAS CONNECT website, services, and applications (collectively, the "Platform"). Please read these Terms carefully.
              </p>

              <h2 className="text-2xl font-semibold mt-10 mb-4 text-foreground">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                By accessing or using our Platform, you agree to be bound by these Terms and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use our services.
              </p>

              <h2 className="text-2xl font-semibold mt-10 mb-4 text-foreground">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                JAS CONNECT provides an Opportunity Intelligence platform that researches, structures, and qualifies business opportunities for its users. The Platform also includes a marketplace for business discovery and growth services.
              </p>

              <h2 className="text-2xl font-semibold mt-10 mb-4 text-foreground">3. User Obligations</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When using the Platform, you agree to:
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
                <li>Provide accurate, current, and complete information during registration.</li>
                <li>Maintain the security and confidentiality of your account credentials.</li>
                <li>Use the Platform solely for lawful business purposes.</li>
                <li>Not engage in data scraping, harvesting, or bulk extraction of intelligence without explicit written permission.</li>
              </ul>

              <h2 className="text-2xl font-semibold mt-10 mb-4 text-foreground">4. Payment & Subscriptions</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Certain features of JAS CONNECT require a paid subscription or purchase of credits. By selecting a premium plan, you agree to pay the specified fees. Subscriptions are billed in advance on a recurring basis as per the selected billing cycle.
              </p>
              
              <h2 className="text-2xl font-semibold mt-10 mb-4 text-foreground">5. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The Platform, including its original content, features, functionality, structured templates, and qualification algorithms, are owned by JAS CONNECT and are protected by international copyright, trademark, and other intellectual property laws.
              </p>

              <h2 className="text-2xl font-semibold mt-10 mb-4 text-foreground">6. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                JAS CONNECT qualifies public information to the best of its ability but does not guarantee the outcome of any opportunity, contract, or tender. In no event shall JAS CONNECT be liable for any indirect, incidental, special, consequential or punitive damages arising out of your use of the Platform.
              </p>

              <h2 className="text-2xl font-semibold mt-10 mb-4 text-foreground">7. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions about these Terms, please contact us at <strong>jasinfra.connect@gmail.com</strong>.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
