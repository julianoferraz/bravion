import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const benefits = [
  "Local expertise in Brazil and Latin America",
  "Complete creative and operational team",
  "Fast communication in English, Portuguese, and Spanish",
  "Experience with technology and betting sectors",
  "Cost-effective outsourcing model",
];

const WhyChoose = () => {
  return (
    <section className="py-24 px-6">
      <div className="container max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why Choose <span className="text-primary">Bravion Global</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Your trusted partner for Latin American expansion
          </p>
        </div>

        <Card className="p-8 md:p-12 bg-card border-border">
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <p className="text-lg">{benefit}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
};

export default WhyChoose;
