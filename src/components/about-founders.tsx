import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Award, Star, User } from "lucide-react";
import { FounderService } from "@/services/founderService";
import { Founder } from "@/types";

export const AboutFounders = () => {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback data for when there's no data in the database
  const fallbackFounders: Founder[] = [{
    id: "fallback-1",
    name: "Ana Carolina",
    role: "Fundadora & Artesã",
    description: "Especialista em técnicas tradicionais e inovadoras.",
    expertise: ["Crochê Tradicional", "Peças Infantis"],
    image_url: "/founder-ana.jpg",
    display_order: 0,
    is_active: true,
    created_at: "",
    updated_at: ""
  }, {
    id: "fallback-2",
    name: "Thayná Feitosa",
    role: "Co-Fundadora & Artesã",
    description: "Sua paixão por detalhes garante que cada produto seja perfeito.",
    expertise: ["Controle de Qualidade", "Seleção de Materiais", "Acabamentos"],
    image_url: "/founder-thayna.jpg",
    display_order: 1,
    is_active: true,
    created_at: "",
    updated_at: ""
  }];

  useEffect(() => {
    const loadFounders = async () => {
      try {
        const data = await FounderService.getFounders(true); // Only active founders
        setFounders(data);
      } catch (error) {
        console.error('Error loading founders:', error);
        setFounders([]);
      } finally {
        setLoading(false);
      }
    };

    loadFounders();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse">Carregando...</div>
          </div>
        </div>
      </section>
    );
  }

  // Hide section if no active founders
  if (founders.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mx-auto w-fit bg-accent/10 text-accent border-accent/20 mb-4">
            <User className="w-4 h-4 mr-2" />
            Conheça Nossa História
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            As Artesãs por Trás da Nó de Duas
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Somos duas amigas apaixonadas por crochê que transformaram seu hobby em um negócio 
            dedicado a criar produtos únicos e especiais para pessoas em todo o Acre.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {founders.map((founder, index) => (
            <Card key={founder.id} className="group hover:shadow-elegant transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/20 group-hover:border-primary/30 transition-all duration-300">
                      {founder.image_url ? (
                        <img 
                          src={founder.image_url} 
                          alt={`${founder.name} - ${founder.role}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to icon if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-full h-full bg-primary/10 flex items-center justify-center" 
                        style={{ display: founder.image_url ? 'none' : 'flex' }}
                      >
                        <User className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      {founder.name}
                    </h3>
                    <Badge variant="secondary" className="mb-4">
                      {founder.role}
                    </Badge>
                    
                    {founder.description && (
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        {founder.description}
                      </p>
                    )}
                    
                    {founder.expertise.length > 0 && (
                      <div>
                        <div className="flex flex-wrap gap-2">
                          {founder.expertise.map((skill, skillIndex) => (
                            <Badge 
                              key={skillIndex} 
                              variant="outline" 
                              className="text-xs border-primary/30 text-primary hover:bg-primary/10"
                            >
                              <Star className="w-3 h-3 mr-1" />
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-foreground mb-4">Nossa Missão</h3>
              <p className="text-muted-foreground">
                Criar produtos artesanais únicos que trazem carinho, conforto e alegria para 
                as famílias, mantendo viva a tradição do crochê brasileiro com qualidade e amor em cada ponto.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AboutFounders;