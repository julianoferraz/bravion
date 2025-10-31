import { Card } from "@/components/ui/card";
import { Headphones, Palette, FileText, TrendingUp, Users } from "lucide-react";

const services = [
  {
    icon: Headphones,
    title: "Local Representation & Support",
    description: "24/7 customer success and support in Portuguese and Spanish for the Latin American market.",
  },
  {
    icon: Palette,
    title: "Creative Design & Video Production",
    description: "Professional visual content and campaigns adapted to local culture and preferences.",
  },
  {
    icon: FileText,
    title: "Copywriting & Content Creation",
    description: "SEO-optimized articles, captions, and strategic content tailored for Brazilian audiences.",
  },
  {
    icon: TrendingUp,
    title: "Social Media Ads & Campaign Management",
    description: "End-to-end campaign planning and optimization on Facebook, Google, and TikTok Ads.",
  },
  {
    icon: Users,
    title: "Affiliate & Partnership Acquisition",
    description: "Connect with influencers, affiliates, and strategic partners across Latin America.",
  },
];

const Services = () => {
  return (
    <section className="py-24 px-6">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            What <span className="text-primary">We Do</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete operational support to expand and strengthen your presence in Latin America
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {services.map((service, index) => (
            <Card 
              key={index}
              className="p-8 bg-card border-border hover:border-primary/50 transition-all hover:shadow-glow group"
            >
              <service.icon className="h-12 w-12 text-primary mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{service.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
