import React from 'react';
import '../styles/pages/HomePage.css';

const AboutSection: React.FC = () => {
  return (
    <section id="about-section" className="about-section-home">
      {/* Floating Donuts Background */}
      <div className="about-floating-donuts">
        <div className="about-donut-circle about-donut-1">
          <img 
            src="/Assets/Home Page/Donut Image/Chocolate.png" 
            alt="Chocolate Donut" 
            className="about-donut-image"
          />
        </div>
        <div className="about-donut-circle about-donut-2">
          <img 
            src="/Assets/Home Page/Donut Image/Strawberry.png" 
            alt="Strawberry Donut" 
            className="about-donut-image"
          />
        </div>
        <div className="about-donut-circle about-donut-3">
          <img 
            src="/Assets/Home Page/Donut Image/Matcha.png" 
            alt="Matcha Donut" 
            className="about-donut-image"
          />
        </div>
        <div className="about-donut-circle about-donut-4">
          <img 
            src="/Assets/Home Page/Donut Image/Cookies and cream.png" 
            alt="Cookies and Cream Donut" 
            className="about-donut-image"
          />
        </div>
        <div className="about-donut-circle about-donut-5">
          <img 
            src="/Assets/Home Page/Donut Image/Ube.png" 
            alt="Ube Donut" 
            className="about-donut-image"
          />
        </div>
        <div className="about-donut-circle about-donut-6">
          <img 
            src="/Assets/Home Page/Donut Image/Glazed nut.png" 
            alt="Glazed Nut Donut" 
            className="about-donut-image"
          />
        </div>
        <div className="about-donut-circle about-donut-7">
          <img 
            src="/Assets/Home Page/Donut Image/Chocolate.png" 
            alt="Chocolate Donut" 
            className="about-donut-image"
          />
        </div>
        <div className="about-donut-circle about-donut-8">
          <img 
            src="/Assets/Home Page/Donut Image/Strawberry.png" 
            alt="Strawberry Donut" 
            className="about-donut-image"
          />
        </div>
        <div className="about-donut-circle about-donut-9">
          <img 
            src="/Assets/Home Page/Donut Image/Matcha.png" 
            alt="Matcha Donut" 
            className="about-donut-image"
          />
        </div>
        <div className="about-donut-circle about-donut-10">
          <img 
            src="/Assets/Home Page/Donut Image/Ube.png" 
            alt="Ube Donut" 
            className="about-donut-image"
          />
        </div>
        <div className="about-donut-circle about-donut-11">
          <img 
            src="/Assets/Home Page/Donut Image/Cookies and cream.png" 
            alt="Cookies and Cream Donut" 
            className="about-donut-image"
          />
        </div>
        <div className="about-donut-circle about-donut-12">
          <img 
            src="/Assets/Home Page/Donut Image/Glazed nut.png" 
            alt="Glazed Nut Donut" 
            className="about-donut-image"
          />
        </div>
      </div>
      <div className="about-container">
        <div className="about-hero-home">
          <h2 className="about-title-home">About Us</h2>
          <p className="about-subtitle-home">
            Crafting sweet moments, one mini donut at a time
          </p>
        </div>

        <div className="about-content-home">
          <div className="about-text-wrapper">
            <div className="about-description-card">
              <div className="about-description-header">
                <div className="about-icon-decoration">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7564 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.39464C21.7564 5.72717 21.351 5.12075 20.84 4.61Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="about-description-title">Our Story</h3>
              </div>
              <div className="about-description-content">
                <p className="about-description-home">
                  Welcome to <strong>Crazy Mini Donuts</strong>, where passion meets perfection! 
                  We're dedicated to creating the most delicious, freshly-made mini donuts and 
                  refreshing beverages that bring joy to every bite and sip.
                </p>
                <p className="about-description-home">
                  Our journey began with a simple mission: to provide our customers with 
                  premium quality treats made with love and the finest ingredients. Every donut 
                  is handcrafted with care, ensuring that each flavor explosion is a memorable experience.
                </p>
              </div>
            </div>
          </div>

          <div className="about-features-grid">
            <div className="about-feature-card">
              <div className="feature-icon-wrapper">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Premium Quality</h3>
              <p>We use only the finest ingredients to ensure every donut meets our high standards of excellence.</p>
            </div>

            <div className="about-feature-card">
              <div className="feature-icon-wrapper">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
                </svg>
              </div>
              <h3>Fresh Daily</h3>
              <p>All our donuts are made fresh daily, ensuring you get the best taste and texture every time.</p>
            </div>

            <div className="about-feature-card">
              <div className="feature-icon-wrapper">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7564 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.39464C21.7564 5.72717 21.351 5.12075 20.84 4.61Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Made with Love</h3>
              <p>Every donut is crafted with passion and care, bringing you the perfect balance of flavors.</p>
            </div>

            <div className="about-feature-card">
              <div className="feature-icon-wrapper">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Quick Service</h3>
              <p>We value your time. Fast, friendly service without compromising on quality or taste.</p>
            </div>
          </div>

          <div className="about-stats">
            <div className="stat-item">
              <div className="stat-number">1000+</div>
              <div className="stat-label">Happy Customers</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">Donut Flavors</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">5+</div>
              <div className="stat-label">Years Experience</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Online Ordering</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
