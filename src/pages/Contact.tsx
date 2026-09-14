import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const Contact = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="flex-1">
        {/* Header */}
        <section className="py-12 relative border-b" style={{ background: 'linear-gradient(180deg, hsl(222 47% 4%), hsl(222 47% 6%))', borderColor: 'rgba(255,255,255,0.04)' }}>
          
          <div className="container mx-auto px-4 relative z-10">
            <h1 className="text-4xl font-bold mb-4 text-foreground">Talk to us</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Whether you need platform access or growth services, we're here to talk.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <ScrollReveal>
                <Card>
                  <CardHeader>
                    <CardTitle>Tell us what you're looking for</CardTitle>
                    <CardDescription>
                      Leave your details and a brief message, and a team member will reach out.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" placeholder="John" className="bg-white/[0.03] border-white/[0.08]" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" placeholder="Doe" className="bg-white/[0.03] border-white/[0.08]" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="john@example.com" className="bg-white/[0.03] border-white/[0.08]" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" type="tel" placeholder="+91 1234567890" className="bg-white/[0.03] border-white/[0.08]" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input id="subject" placeholder="How can we help?" className="bg-white/[0.03] border-white/[0.08]" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          placeholder="Tell us more about your inquiry..."
                          rows={5}
                          className="bg-white/[0.03] border-white/[0.08]"
                        />
                      </div>
                      <Button className="w-full" size="lg">
                        Send Message
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </ScrollReveal>

              {/* Contact Information */}
              <ScrollReveal delay={0.15}>
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Information</CardTitle>
                      <CardDescription>
                        Reach out to us through any of these channels
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {[
                        { icon: MapPin, title: "Office Address", content: <>JAS CONNECT<br />Delta-1, Greater Noida, India</> },
                        { icon: Mail, title: "Email", content: <>General: jasinfra.connect@gmail.com</> },
                        { icon: Phone, title: "Phone", content: <>Office: +91 9971867719<br />Support: +91 9971867719</> },
                      ].map((item, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="p-3 rounded-lg h-fit" style={{ background: 'rgba(56,130,246,0.1)', border: '1px solid rgba(56,130,246,0.15)' }}>
                            <item.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold mb-1 text-foreground">{item.title}</h3>
                            <p className="text-muted-foreground">{item.content}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card style={{ background: 'linear-gradient(135deg, hsl(217 91% 50%), hsl(217 91% 40%))', borderColor: 'transparent' }}>
                    <CardContent className="py-8">
                      <h3 className="text-xl font-bold mb-2 text-white">Business Hours</h3>
                      <div className="space-y-2 text-white/90">
                        <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
