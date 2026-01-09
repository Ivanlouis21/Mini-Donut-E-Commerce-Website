import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { productsAPI } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import '../styles/pages/AdminPage.css';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  category?: string;
}

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    imageUrl: '',
    category: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      stock: '',
      imageUrl: '',
      category: '',
    });
    setSelectedImage(null);
    setImagePreview(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      imageUrl: product.imageUrl || '',
      category: product.category || '',
    });
    setSelectedImage(null);
    setImagePreview(product.imageUrl || null);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await productsAPI.delete(id);
      setProducts(products.filter(p => p.id !== id));
      toast.success('Product deleted successfully');
      window.dispatchEvent(new Event('productUpdated'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete product');
    }
  };

  const handleUpdateStock = async (id: number, newStock: number) => {
    if (newStock < 0) {
      toast.warning('Stock cannot be negative');
      return;
    }

    try {
      await productsAPI.update(id, { stock: newStock });
      setProducts(products.map(p => p.id === id ? { ...p, stock: newStock } : p));
      toast.success('Stock updated successfully');
      window.dispatchEvent(new Event('productUpdated'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update stock');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
        toast.error('Please select a valid image file (jpg, jpeg, png, gif, or webp)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.description || !productForm.price || !productForm.stock || !productForm.category) {
      toast.warning('Please fill in all required fields including category');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('description', productForm.description);
      formData.append('price', productForm.price);
      formData.append('stock', productForm.stock);
      formData.append('category', productForm.category);
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, formData);
      } else {
        await productsAPI.create(formData);
      }

      setShowProductModal(false);
      setSelectedImage(null);
      setImagePreview(null);
      fetchProducts();
      toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
      window.dispatchEvent(new Event('productUpdated'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save product');
    }
  };

  const normalizeCategory = (category: string | undefined): string => {
    if (!category) return 'Others';
    const normalized = category.trim();
    if (normalized.toLowerCase() === 'classic') return 'Classic';
    if (normalized.toLowerCase() === 'best seller' || normalized.toLowerCase() === 'bestseller') return 'Best Seller';
    if (normalized.toLowerCase() === 'beverages' || normalized.toLowerCase() === 'beverage') return 'Beverages';
    if (normalized.toLowerCase() === 'others' || normalized.toLowerCase() === 'other') return 'Others';
    return normalized;
  };

  const groupProductsByCategory = () => {
    const grouped: { [key: string]: Product[] } = {};
    products.forEach(product => {
      const category = normalizeCategory(product.category);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(product);
    });
    return grouped;
  };

  const getCategoriesToDisplay = () => {
    if (selectedCategory === 'All') {
      return ['Classic', 'Best Seller', 'Beverages', 'Others'];
    }
    return [selectedCategory];
  };

  const categories = ['All', 'Classic', 'Best Seller', 'Beverages', 'Others'];

  if (loading && products.length === 0) {
    return (
      <AdminLayout>
        <div className="loading">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {error && <div className="admin-error">Error: {error}</div>}

      <div className="admin-products">
        <div className="products-header">
          <h2>Products Management</h2>
          <button className="btn btn-primary" onClick={handleAddProduct}>
            + Add Product
          </button>
        </div>
        <div className="category-filters">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-filter-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        {products.length === 0 ? (
          <div className="empty-state">No products found</div>
        ) : (
          <div className="products-by-category">
            {getCategoriesToDisplay().map((categoryName) => {
              const groupedProducts = groupProductsByCategory();
              const categoryProducts = groupedProducts[categoryName] || [];
              
              if (categoryProducts.length === 0) {
                return null;
              }

              return (
                <div key={categoryName} className="category-section">
                  <div className="category-section-header">
                    <h3 className="category-section-title">{categoryName}</h3>
                  </div>
                  <div className="products-grid">
                    {categoryProducts.map((product) => (
                      <div key={product.id} className="product-card">
                        <div className="product-image">
                          {product.imageUrl ? (
                            <img 
                              src={(() => {
                                if (product.imageUrl?.startsWith('http')) return product.imageUrl;
                                if (product.imageUrl?.startsWith('/Assets/')) return product.imageUrl;
                                if (product.imageUrl?.startsWith('/uploads/')) return `http://localhost:3001${product.imageUrl}`;
                                return `http://localhost:3001${product.imageUrl}`;
                              })()}
                              alt={product.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/Assets/Products/placeholder.jpg';
                              }}
                            />
                          ) : (
                            <div className="product-image-placeholder">No Image</div>
                          )}
                        </div>
                        <div className="product-info">
                          <h3>{product.name}</h3>
                          <p className="product-description">{product.description}</p>
                          <div className="product-details">
                            <div className="product-price">₱{parseFloat(product.price.toString()).toFixed(2)}</div>
                            <div className="product-stock">
                              <label>Stock:</label>
                              <input
                                type="number"
                                min="0"
                                value={product.stock}
                                onChange={(e) => handleUpdateStock(product.id, parseInt(e.target.value) || 0)}
                                className="stock-input"
                              />
                            </div>
                          </div>
                          <div className="product-actions">
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleEditProduct(product)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {getCategoriesToDisplay().every(cat => {
              const grouped = groupProductsByCategory();
              return (grouped[cat] || []).length === 0;
            }) && (
              <div className="empty-state">No products found in {selectedCategory} category</div>
            )}
          </div>
        )}
      </div>

      {showProductModal && (
        <div className="modal-backdrop" onClick={() => setShowProductModal(false)}>
          <div className="modal-content product-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
              <button className="modal-close" onClick={() => setShowProductModal(false)}>✕</button>
            </div>
            <div className="modal-body product-modal-body">
              <div className="product-form-grid">
                <div className="product-form-left">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description *</label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Enter product description"
                      rows={5}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Price (₱) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="form-group">
                      <label>Stock *</label>
                      <input
                        type="number"
                        min="0"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="category-select"
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="Classic">Classic</option>
                      <option value="Best Seller">Best Seller</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Product Image</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleImageChange}
                      className="file-input"
                    />
                    {!imagePreview && editingProduct?.imageUrl && (
                      <p className="image-note">Current image will be kept if no new image is selected</p>
                    )}
                  </div>
                </div>
                <div className="product-form-right">
                  <div className="image-preview-section">
                    <label className="preview-label">Image Preview</label>
                    {imagePreview ? (
                      <div className="image-preview-wrapper">
                        <img src={imagePreview} alt="Preview" className="image-preview-large" />
                        {selectedImage && (
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => {
                              setSelectedImage(null);
                              setImagePreview(editingProduct?.imageUrl || null);
                            }}
                          >
                            Remove Image
                          </button>
                        )}
                      </div>
                    ) : editingProduct?.imageUrl ? (
                      <div className="image-preview-wrapper">
                        <img 
                          src={(() => {
                            if (editingProduct.imageUrl?.startsWith('http')) return editingProduct.imageUrl;
                            if (editingProduct.imageUrl?.startsWith('/Assets/')) return editingProduct.imageUrl;
                            if (editingProduct.imageUrl?.startsWith('/uploads/')) return `http://localhost:3001${editingProduct.imageUrl}`;
                            return `http://localhost:3001${editingProduct.imageUrl}`;
                          })()}
                          alt="Current" 
                          className="image-preview-large" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/Assets/Products/placeholder.jpg';
                          }}
                        />
                        <p className="current-image-note">Current Image</p>
                      </div>
                    ) : (
                      <div className="image-placeholder">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8.5 13.5C9.32843 13.5 10 12.8284 10 12C10 11.1716 9.32843 10.5 8.5 10.5C7.67157 10.5 7 11.1716 7 12C7 12.8284 7.67157 13.5 8.5 13.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <p>No image selected</p>
                        <p className="placeholder-hint">Upload an image to see preview</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowProductModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveProduct}>
                {editingProduct ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProducts;
