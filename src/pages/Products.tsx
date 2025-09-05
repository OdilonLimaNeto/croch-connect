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
      
      {/* Page Header */}
      <section className="bg-gradient-subtle py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary mb-4">
              Nossos Produtos
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Descubra nossa coleção completa de produtos artesanais em crochê, 
              feitos com carinho especialmente para sua família.
            </p>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-muted-foreground" />
              <Select onValueChange={handleSortChange} value={filters.sort_by || ''}>
                <SelectTrigger className="w-48">
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
              <Button variant="outline" onClick={clearFilters} size="sm">
                Limpar Filtros
              </Button>
            )}
          </div>

          {/* Material Filters */}
          {materials.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Materiais:
              </span>
              {materials.map((material) => (
                <Badge
                  key={material}
                  variant={filters.materials?.includes(material) ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => handleMaterialToggle(material)}
                >
                  {material}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Results Info */}
          <div className="flex justify-between items-center mb-8">
            <p className="text-muted-foreground">
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