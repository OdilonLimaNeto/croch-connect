import React from 'react';
import { Heart, MessageCircle, Mail, Phone } from 'lucide-react';
import { SocialMediaLinks } from '@/components/ui/social-media-links';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Nó de Duas</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Criamos produtos artesanais em crochê com carinho e dedicação.
              Cada peça é única e feita especialmente para sua família.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="w-4 h-4 text-accent" />
              Feito com amor em cada ponto
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Links Rápidos</h4>
            <div className="space-y-2 text-sm">
              <div><a href="/" className="text-muted-foreground hover:text-foreground transition-colors">Início</a></div>
              <div><a href="/produtos" className="text-muted-foreground hover:text-foreground transition-colors">Produtos</a></div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Contato</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp: (68) 9 9283-1533</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>nodeduas2025@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="flex justify-center pt-6 border-t">
          <SocialMediaLinks className="justify-center" />
        </div>

        <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
          <p>© {currentYear} Nó de Duas. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;