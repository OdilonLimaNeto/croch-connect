-- Insert sample products for testing
INSERT INTO public.products (title, description, price, stock_quantity, materials, is_active) VALUES
(
  'Kit Bebê Completo',
  'Conjunto completo com toquinha, luvinhas e sapatinhos para recém-nascidos. Feito em linha de algodão super macia e hipoalergênica.',
  89.90,
  15,
  ARRAY['Algodão', 'Linha Mercerizada'],
  true
),
(
  'Manta Aconchegante Terra',
  'Manta artesanal em tons terrosos, perfeita para momentos de carinho e aconchego. Tamanho ideal para sofá ou berço.',
  159.90,
  8,
  ARRAY['Barbante', 'Lã'],
  true
),
(
  'Tapete Redondo Bege',
  'Tapete redondo feito em barbante cru, ideal para decorar qualquer ambiente com estilo artesanal e acolhedor.',
  124.50,
  12,
  ARRAY['Barbante'],
  true
),
(
  'Cesta Organizadora Grande',
  'Cesta organizadora versátil em fio de malha reciclado. Perfeita para brinquedos, roupas ou decoração.',
  67.90,
  20,
  ARRAY['Fio de Malha'],
  true
),
(
  'Almofada Decorativa Rosa',
  'Linda almofada em ponto alto com detalhes em relevo. Capa removível para facilitar a lavagem.',
  45.00,
  0,
  ARRAY['Linha Mercerizada'],
  true
),
(
  'Xale Elegante Cinza',
  'Xale sofisticado em lã natural, ideal para ocasiões especiais ou para se aquecer com estilo.',
  98.90,
  6,
  ARRAY['Lã'],
  false
),
(
  'Porta-fraldas Coração',
  'Organizador de fraldas em formato de coração, perfeito para o quarto do bebê. Disponível em várias cores.',
  52.90,
  18,
  ARRAY['Algodão'],
  true
),
(
  'Jogo Americano Kit 4',
  'Kit com 4 jogos americanos artesanais em barbante colorido. Resistente e fácil de limpar.',
  78.90,
  10,
  ARRAY['Barbante'],
  true
);

-- Update some products with promotional prices
UPDATE public.products 
SET promotional_price = 67.90 
WHERE title = 'Kit Bebê Completo';

UPDATE public.products 
SET promotional_price = 119.90 
WHERE title = 'Manta Aconchegante Terra';

UPDATE public.products 
SET promotional_price = 38.90 
WHERE title = 'Almofada Decorativa Rosa';