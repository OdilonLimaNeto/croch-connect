import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Star, Award, User } from 'lucide-react';

const AboutFounders = () => {
  const founders = [
    {
      name: "Ana Kaleny",
      role: "Fundadora & Artesã",
      description: "Especialista em técnicas tradicionais e inovadoras.",
      expertise: ["Crochê Tradicional", "Peças Infantis"],
      icon: <Heart className="w-6 h-6" />
    },
    {
      name: "Thayná Feitosa",
      role: "Co-Fundadora & Artesã",
      description: "Sua paixão por detalhes garante que cada produto seja perfeito.",
      expertise: ["Controle de Qualidade", "Seleção de Materiais", "Acabamentos"],
      icon: <Award className="w-6 h-6" />
    }
  ];

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
            <Card key={index} className="group hover:shadow-elegant transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      {founder.icon}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      {founder.name}
                    </h3>
                    <Badge variant="secondary" className="mb-4">
                      {founder.role}
                    </Badge>
                    
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {founder.description}
                    </p>
                    
                    <div>
                      <h4 className="font-semibold text-foreground mb-3"></h4>
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