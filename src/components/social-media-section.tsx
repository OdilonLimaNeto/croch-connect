import React from 'react';
import { SocialMediaLinks } from '@/components/ui/social-media-links';

const SocialMediaSection = () => {
  return (
    <section className="py-16 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary mb-4">Conecte-se Conosco</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Acompanhe nosso trabalho e novidades nas redes sociais
          </p>
          
          <div className="flex justify-center">
            <SocialMediaLinks className="justify-center" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialMediaSection;