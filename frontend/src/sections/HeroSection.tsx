import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/HomePage.css';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="home-section" className="hero-section">
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">
            INDULGE IN DELICIOUS <span className="highlight">MINI DONUTS</span> & REFRESHING BEVERAGES
          </h1>
          <p className="hero-description">
            Freshly made mini donuts in amazing flavors paired with your favorite drinks. Experience the perfect sweet treat combination that will satisfy your cravings!
          </p>
          <div className="hero-buttons">
            <button 
              className="btn btn-hero-primary"
              onClick={() => navigate('/products')}
            >
              Order Now
            </button>
            <button 
              className="btn btn-hero-secondary"
              onClick={() => navigate('/products')}
            >
              Browse Products
            </button>
          </div>
          <div className="hero-social">
            <a 
              href="https://www.facebook.com/share/1EiHeBTRmB/" 
              className="social-icon social-icon-facebook" 
              aria-label="Facebook"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img 
                src="/Assets/Social Icons/Facebook.png" 
                alt="Facebook" 
                className="social-logo"
              />
            </a>
            <a 
              href="https://www.instagram.com/3yyvan?igsh=azVxMWlqcTB3dDZj" 
              className="social-icon social-icon-instagram" 
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img 
                src="/Assets/Social Icons/Instagram.png" 
                alt="Instagram" 
                className="social-logo"
              />
            </a>
            <a 
              href="https://x.com/" 
              className="social-icon social-icon-twitter" 
              aria-label="Twitter"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img 
                src="/Assets/Social Icons/Twitter.png" 
                alt="Twitter" 
                className="social-logo"
              />
            </a>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-image-placeholder">
            <div className="product-showcase">
              <div className="showcase-circle circle-1">
                <img 
                  src="/Assets/Home Page/Donut Image/Chocolate.png" 
                  alt="Chocolate Donut" 
                  className="circle-image"
                />
              </div>
              <div className="showcase-circle circle-2">
                <img 
                  src="/Assets/Home Page/Donut Image/Strawberry.png" 
                  alt="Strawberry Donut" 
                  className="circle-image"
                />
              </div>
              <div className="showcase-circle circle-3">
                <img 
                  src="/Assets/Home Page/Donut Image/Matcha.png" 
                  alt="Matcha Donut" 
                  className="circle-image"
                />
              </div>
              <div className="showcase-circle circle-4">
                <img 
                  src="/Assets/Home Page/Donut Image/Cookies and cream.png" 
                  alt="Cookies and Cream Donut" 
                  className="circle-image"
                />
              </div>
              <div className="showcase-circle circle-5">
                <img 
                  src="/Assets/Home Page/Donut Image/Glazed nut.png" 
                  alt="Glazed Nut Donut" 
                  className="circle-image"
                />
              </div>
              <div className="showcase-circle circle-6">
                <img 
                  src="/Assets/Home Page/Donut Image/Ube.png" 
                  alt="Ube Donut" 
                  className="circle-image"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="hero-wave"></div>
    </section>
  );
};

export default HeroSection;
