import { Badge } from "@/components/ui/badge";
import { Code, Shield, Gamepad2, Smartphone, Package } from "lucide-react";

const industries = [
  { icon: Code, name: "SaaS & Software Companies" },
  { icon: Shield, name: "Proxy & Multilogin Platforms" },
  { icon: Gamepad2, name: "Betting & Gaming Brands" },
  { icon: Smartphone, name: "Mobile Apps & Tech Startups" },
  { icon: Package, name: "Digital Product Businesses" },
];

const Industries = () => {
  return (
    <section className="py-24 px-6 bg-gradient-subtle">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Industries <span className="text-primary">We Serve</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Specialized expertise in technology and digital sectors expanding into Latin America
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
          {industries.map((industry, index) => (
            <Badge
              key={index}
              variant="outline"
              className="px-6 py-4 text-base border-border hover:border-primary hover:bg-primary/10 transition-all group cursor-default"
            >
              <industry.icon className="h-5 w-5 mr-3 text-primary group-hover:scale-110 transition-transform" />
              {industry.name}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Industries;
