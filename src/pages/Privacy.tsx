import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />

      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <ScrollReveal>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Privacy Policy</h1>
            <p className="text-muted-foreground mb-12">Last Updated: October 2023</p>

            <div className="prose prose-invert prose-blue max-w-none">
              <p className="lead text-lg text-muted-foreground leading-relaxed">
                At JAS CONNECT, we take your privacy seriously. This Privacy Policy describes how we collect, use, process, and disclose your information, including personal information, in conjunction with your access to and use of our Opportunity Intelligence platform.
              </p>

              <h2 className="text-2xl font-semibold mt-10 mb-4 text-foreground">1. Information We Collect</h2>
              <h3 className="text-xl font-medium mt-6 mb-3 text-foreground/90">1.1 Information You Give Us</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We collect information you share with us when you use JAS CONNECT.
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
                <li><strong>Account Information:</strong> When you sign up, we require certain information such as your first name, last name, email address, and company details.</li>
                <li><strong>Profile and Listing Information:</strong> To use certain features of the Marketplace, we may ask you to provide additional profile information, which may include your address, phone number, and business capabilities.</li>
              </ul>

              <h3 className="text-xl font-medium mt-6 mb-3 text-foreground/90">1.2 Information Automatically Collected</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you use the Platform, we automatically collect information about the services you use and how you use them.
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
                <li><strong>Usage Data:</strong> We collect information about your interactions with the platform such as the pages or content you view, your searches for opportunities, and other actions.</li>
                <li><strong>Log Data and Device Information:</strong> We automatically collect log data and device information when you access and use the Platform.</li>
              </ul>

              <h2 className="text-2xl font-semibold mt-10 mb-4 text-foreground">2. How We Use Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use, store, and process information, including personal information, about you to provide, understand, improve, and develop the Platform, create and maintain a trusted and safer environment, and comply with our legal obligations.
              </p>
              
              <h2 className="text-2xl font-semibold mt-10 mb-4 text-foreground">3. Sharing & Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you create a Business Profile or publish a Product Listing, certain information may be visible to other verified members of the JAS CONNECT Marketplace to facilitate business connections. We do not sell your personal data to third parties.
              </p>

              <h2 className="text-2xl font-semibold mt-10 mb-4 text-foreground">4. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions or complaints about this Privacy Policy or our information handling practices, you may email us at <strong>jasinfra.connect@gmail.com</strong>.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
