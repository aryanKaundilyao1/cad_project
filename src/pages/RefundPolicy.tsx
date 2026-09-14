import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />

      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <ScrollReveal>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Refund & Cancellation Policy</h1>
            <p className="text-muted-foreground mb-12">Last Updated: October 2023</p>

            <div className="prose prose-invert prose-blue max-w-none">
              <p className="lead text-lg text-muted-foreground leading-relaxed">
                At JAS CONNECT, we strive to ensure our clients are fully satisfied with our Opportunity Intelligence and Growth Services. This policy outlines our guidelines for refunds, cancellations, and subscription changes.
              </p>

              <h2 className="text-2xl font-semibold mt-10 mb-4 text-foreground">1. Subscription Cancellations</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You can cancel your subscription at any time. When you cancel, your subscription will remain active until the end of your current billing cycle (monthly, quarterly, or yearly). After the cycle ends, your account will automatically downgrade to the Free plan. We do not provide prorated refunds for mid-cycle cancellations.
              </p>

              <h2 className="text-2xl font-semibold mt-10 mb-4 text-foreground">2. Refund Eligibility</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We evaluate refund requests on a case-by-case basis. Generally, refunds are only issued under the following circumstances:
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
                <li><strong>Technical Issues:</strong> If a persistent technical issue on our end prevented you from accessing the platform for an extended period.</li>
                <li><strong>Billing Errors:</strong> If you were charged incorrectly due to a system error.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Refunds are <strong>not</strong> issued for lack of usage, or because you did not find an opportunity that matched your specific criteria during a given month. Our platform provides access to intelligence, but we do not guarantee the volume of opportunities available in highly niche sectors at any specific time.
              </p>

              <h2 className="text-2xl font-semibold mt-10 mb-4 text-foreground">3. Growth Services & Custom Packages</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                For Growth Services (e.g., Lead Generation, Brand Strategy, CRM Setup), terms of cancellation and refunds are governed by the specific Statement of Work (SOW) or contract signed prior to engagement. Standard software subscription policies do not apply to these custom services.
              </p>
              
              <h2 className="text-2xl font-semibold mt-10 mb-4 text-foreground">4. Add-ons and Lead Packs</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                One-time purchases, such as additional lead packs or specific industry modules, are non-refundable once the credits or data have been allocated to your account.
              </p>

              <h2 className="text-2xl font-semibold mt-10 mb-4 text-foreground">5. How to Request a Refund</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you believe you are eligible for a refund based on the criteria above, please contact our support team at <strong>jasinfra.connect@gmail.com</strong> within 7 days of the charge. Include your account email, billing details, and a clear explanation of the issue.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RefundPolicy;
