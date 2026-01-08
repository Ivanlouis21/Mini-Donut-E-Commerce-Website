import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { contactAPI } from '../services/api';
import '../styles/pages/HomePage.css';

interface User {
  firstName: string;
  lastName: string;
  email: string;
}

const ContactSection: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  // Check if user is logged in and populate form fields
  useEffect(() => {
    const userString = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userString && token) {
      try {
        const userData: User = JSON.parse(userString);
        setUser(userData);
        setName(`${userData.firstName} ${userData.lastName}`);
        setEmail(userData.email);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Map embed / open URLs (configurable via .env)
  const mapQuery =
    process.env.REACT_APP_MAP_QUERY || 'Crazy Mini Donuts Sweet City';
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    mapQuery
  )}&output=embed`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.warning('Please log in to send a message.');
      navigate('/login');
      return;
    }

    try {
      await contactAPI.sendMessage({
        name,
        email,
        message,
      });
      toast.success('Thank you! Your message has been sent. We\'ll get back to you shortly.');
      // Reset form
      setMessage('');
      if (!user) {
        setName('');
        setEmail('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send message. Please try again.');
    }
  };

  return (
    <section id="contact-section" className="contact-section-home">
      <div className="contact-hero-home">
        <h2>Contact Us</h2>
        <p>
          Need an expert? Share your details and we'll get back to you shortly.
        </p>
      </div>

      <div className="contact-grid-home">
        <div className="contact-card-home">
          <div className="contact-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Visit Us</h3>
          <p>123 Donut Street, Sweet City, SC 12345</p>
        </div>
        <div className="contact-card-home">
          <div className="contact-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7292C21.7209 20.9842 21.5573 21.2126 21.352 21.399C21.1467 21.5854 20.9041 21.7261 20.6391 21.8122C20.3741 21.8982 20.0925 21.9279 19.814 21.899C16.7426 21.5486 13.787 20.5291 11.19 19C8.49997 17.4 6.29997 15.2 4.69997 12.51C3.17097 9.91305 2.15152 6.95743 1.80097 3.88605C1.77197 3.60755 1.80172 3.32594 1.88779 3.06094C1.97387 2.79594 2.11457 2.55334 2.30097 2.34805C2.48737 2.14276 2.71579 1.97919 2.97079 1.86758C3.22579 1.75597 3.50152 1.69897 3.77997 1.70005H6.77997C7.24397 1.69659 7.69614 1.86193 8.05297 2.16805C8.4098 2.47417 8.64814 2.90199 8.72997 3.36505C8.88779 4.22386 9.15597 5.06073 9.52997 5.85505C9.69297 6.20224 9.77797 6.58219 9.77997 6.96705C9.78197 7.35191 9.70097 7.73256 9.54197 8.08105L8.08997 10.82C9.51397 13.198 11.802 15.486 14.18 16.91L16.92 15.46C17.2685 15.301 17.6491 15.22 18.034 15.222C18.4189 15.224 18.7988 15.309 19.146 15.472C19.9403 15.846 20.7771 16.1142 21.636 16.272L21.648 16.274C22.1104 16.3571 22.5374 16.5962 22.8434 16.9535C23.1494 17.3108 23.3144 17.7632 23.31 18.227L22 16.92Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Call Us</h3>
          <p>+1 (555) 123-4567</p>
        </div>
        <div className="contact-card-home">
          <div className="contact-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Email Us</h3>
          <p>hello@crazyminidonuts.com</p>
        </div>
      </div>

      <div className="contact-body-home">
        <div className="contact-form-wrapper">
          <h3>Send a Message</h3>
          {user ? (
            <p>Fill out the form below and we'll get back to you shortly.</p>
          ) : (
            <p>Please log in before sending a message.</p>
          )}
          <form
            className="contact-form-home"
            onSubmit={handleSubmit}
          >
            <div className="form-row-home">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={!!user}
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!!user}
              />
            </div>
            <textarea
              name="message"
              placeholder="Your Message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-hero-primary">
              Send Message
            </button>
          </form>
        </div>

        <div className="contact-map-home">
          <div className="map-embed">
            <iframe
              title="Crazy Mini Donuts Location"
              src={mapEmbedUrl}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
