import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, SortAsc } from 'lucide-react';
import { Product, ProductFilters } from '@/types';
import { ProductService, MaterialService } from '@/services/api';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import ProductGrid from '@/components/products/product-grid';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProductFilters>({});
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, materialsData] = await Promise.all([
          ProductService.getProducts(),
          MaterialService.getMaterials()
        ]);
        
        setProducts(productsData);
        setFilteredProducts(productsData);
        setMaterials(materialsData.map(m => m.name));
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, products]);

  const applyFilters = () => {
    let filtered = [...products];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm) ||
        product.materials.some(material => 
          material.toLowerCase().includes(searchTerm)
        )
      );
    }

    // Price filters
    if (filters.min_price !== undefined) {
      filtered = filtered.filter(product => {
        const price = product.promotional_price || product.price;
        return price >= filters.min_price!;
      });
    }

    if (filters.max_price !== undefined) {
      filtered = filtered.filter(product => {
        const price = product.promotional_price || product.price;
        return price <= filters.max_price!;
      });
    }

    // Materials filter
    if (filters.materials && filters.materials.length > 0) {
      filtered = filtered.filter(product =>
        filters.materials!.some(material =>
          product.materials.includes(material)
        )
      );
    }

    // Sort
    if (filters.sort_by) {
      filtered.sort((a, b) => {
        switch (filters.sort_by) {
          case 'price_asc':
            const priceA = a.promotional_price || a.price;
            const priceB = b.promotional_price || b.price;
            return priceA - priceB;
          case 'price_desc':
            const priceDescA = a.promotional_price || a.price;
            const priceDescB = b.promotional_price || b.price;
            return priceDescB - priceDescA;
          case 'name_asc':
            return a.title.localeCompare(b.title);
          case 'name_desc':
            return b.title.localeCompare(a.title);
          case 'created_desc':
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });
    }

    setFilteredProducts(filtered);
  };

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value || undefined }));
  };

  const handleSortChange = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      sort_by: value as ProductFilters['sort_by'] 
    }));
  };

  const handleMaterialToggle = (material: string) => {
    setFilters(prev => {
      const currentMaterials = prev.materials || [];
      const newMaterials = currentMaterials.includes(material)
        ? currentMaterials.filter(m => m !== material)
        : [...currentMaterials, material];
      
      return {
        ...prev,
        materials: newMaterials.length > 0 ? newMaterials : undefined
      };
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const handleProductClick = (product: Product) => {
    navigate(`/produto/${product.id}`);
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key as keyof ProductFilters] !== undefined && 
    filters[key as keyof ProductFilters] !== ''
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Page Header - Mobile First */}
      <section className="bg-gradient-subtle py-8 sm:py-12">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-3 sm:mb-4">
              Nossos Produtos
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Descubra nossa coleção completa de produtos artesanais em crochê, 
              feitos com carinho especialmente para sua família.
            </p>
          </div>
        </div>
      </section>

      {/* Filters Section - Mobile First */}
      <section className="bg-card border-b">
        <div className="container mx-auto px-3 py-4">
          <div className="space-y-4">
            {/* Search - Full width on mobile */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Sort and Clear Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 flex-1">
                <SortAsc className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Select onValueChange={handleSortChange} value={filters.sort_by || ''}>
                  <SelectTrigger className="w-full sm:w-auto">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_desc">Mais recentes</SelectItem>
                    <SelectItem value="price_asc">Menor preço</SelectItem>
                    <SelectItem value="price_desc">Maior preço</SelectItem>
                    <SelectItem value="name_asc">Nome A-Z</SelectItem>
                    <SelectItem value="name_desc">Nome Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} size="sm" className="w-full sm:w-auto">
                  Limpar Filtros
                </Button>
              )}
            </div>

            {/* Material Filters - Responsive */}
            {materials.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="w-4 h-4" />
                  <span>Materiais:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {materials.map((material) => (
                    <Badge
                      key={material}
                      variant={filters.materials?.includes(material) ? "default" : "secondary"}
                      className="cursor-pointer hover:bg-primary/20 transition-colors text-xs px-2 py-1"
                      onClick={() => handleMaterialToggle(material)}
                    >
                      {material}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Products Grid - Mobile First */}
      <section className="py-6 sm:py-8 md:py-12">
        <div className="container mx-auto px-3 sm:px-4">
          {/* Results Info */}
          <div className="flex justify-between items-center mb-4 sm:mb-6 md:mb-8">
            <p className="text-sm sm:text-base text-muted-foreground">
              {loading ? 'Carregando...' : `${filteredProducts.length} produto${filteredProducts.length !== 1 ? 's' : ''} encontrado${filteredProducts.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Products Grid */}
          <ProductGrid
            products={filteredProducts}
            loading={loading}
            onProductClick={handleProductClick}
          />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Products;