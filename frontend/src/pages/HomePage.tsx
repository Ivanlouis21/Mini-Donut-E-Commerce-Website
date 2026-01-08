import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { productsAPI, cartAPI } from '../services/api';
import HeroSection from '../sections/HeroSection';
import ProductsSection from '../sections/ProductsSection';
import AboutSection from '../sections/AboutSection';
import ContactSection from '../sections/ContactSection';
import '../styles/pages/HomePage.css';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  imageUrl?: string;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [addingToCart, setAddingToCart] = useState<{ [key: number]: boolean }>({});
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchProducts();
  }, []);

  // Scroll to section based on ?section= query parameter
  useEffect(() => {
    const section = searchParams.get('section') || 'home';

    const sectionId =
      section === 'products'
        ? 'products-section'
        : section === 'about'
        ? 'about-section'
        : section === 'contact'
        ? 'contact-section'
        : 'home-section';

    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [searchParams]);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        }
      });
    }, observerOptions);

    // Observe all sections
    const sections = document.querySelectorAll(
      '.menu-section, .about-section-home, .contact-section-home'
    );
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, [products, loading]);

  const fetchProducts = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId: number, quantity: number = 1): Promise<void> => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      toast.info('You need to login to add items to cart. Redirecting to login page...', {
        onClose: () => navigate('/login'),
        autoClose: 2000,
      });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    try {
      setAddingToCart({ ...addingToCart, [productId]: true });
      await cartAPI.addItem({ productId, quantity });
      toast.success('Product added to cart!');
      // Dispatch event to update cart count
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.warning('Your session has expired. Please login again.');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to add product to cart');
      }
    } finally {
      setAddingToCart({ ...addingToCart, [productId]: false });
    }
  };

  return (
    <div className="homepage">
      <HeroSection />
      <ProductsSection 
        products={products}
        loading={loading}
        addingToCart={addingToCart}
        onAddToCart={handleAddToCart}
      />
      <AboutSection />
      <ContactSection />
    </div>
  );
};

export default HomePage;
