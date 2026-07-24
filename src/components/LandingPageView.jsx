import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  MapPin, 
  Star, 
  ArrowRight, 
  Phone, 
  Shield, 
  Clock, 
  Award, 
  Sparkles, 
  Menu, 
  X, 
  Search, 
  Heart,
  ChevronRight
} from 'lucide-react';
import './LandingPageView.css';

// Exact 26 tours list from sitemap-post-type-tour.xml with respective live URLs and live images
const TOURS_DATA = [
  {
    id: 'evening-safari',
    title: 'Evening Desert Safari',
    url: 'https://roaradventuretourism.com/tour/evening-desert-safari/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/11/EveningDesertSafarin.webp',
    category: 'safari',
    price: 150,
    rating: 4.9,
    reviews: 1240,
    desc: 'Experience the magical Dubai desert at sunset. Includes dune bashing, camel rides, henna painting, live belly dancing, Tanoura shows, and a premium BBQ buffet dinner.',
    featured: true
  },
  {
    id: 'dune-buggy-dubai',
    title: 'Dune Buggy in Dubai',
    url: 'https://roaradventuretourism.com/tour/dune-buggy-in-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/canam-scaled-4-Seater.jpg',
    category: 'buggy',
    price: 450,
    rating: 4.8,
    reviews: 980,
    desc: 'Take command of a high-performance Can-Am Maverick buggy. Climb the highest red dunes of Dubai with your professional desert guide guiding the way.',
    featured: true
  },
  {
    id: 'vip-desert-safari',
    title: 'VIP Desert Safari in Dubai',
    url: 'https://roaradventuretourism.com/tour/vip-desert-safari-in-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/VIPDesertSafari.webp',
    category: 'safari',
    price: 299,
    rating: 4.9,
    reviews: 820,
    desc: 'Unmatched desert luxury. Enjoy VIP table service with private air-conditioned seating, high-end international dining, and personalized adventure guides.',
    featured: true
  },
  {
    id: 'dubai-city-tour',
    title: 'Dubai City Tour',
    url: 'https://roaradventuretourism.com/tour/dubai-city-tour/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/12/dubaicitytour.webp',
    category: 'city',
    price: 99,
    rating: 4.7,
    reviews: 1450,
    desc: 'Discover Dubai’s iconic landmarks. Visit Burj Al Arab, Palm Jumeirah, Dubai Marina, and explore historic neighborhoods like Al Fahidi and the gold souks.',
    featured: true
  },
  {
    id: 'abu-dhabi-city-tour',
    title: 'Abu Dhabi City Tour',
    url: 'https://roaradventuretourism.com/tour/book-abu-dhabi-city-tour/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/12/Abudhabicitytourmosque.webp',
    category: 'city',
    price: 199,
    rating: 4.8,
    reviews: 1120,
    desc: 'A full-day trip to the capital city of UAE. Visit the spectacular Sheikh Zayed Grand Mosque, Emirates Palace, Heritage Village, and Ferrari World.',
    featured: true
  },
  {
    id: 'marina-cruise-dinner',
    title: 'Dubai Marina Cruise Dinner',
    url: 'https://roaradventuretourism.com/tour/dubai-marina-cruise-dinner/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/12/dubaimarinacruisedinner.webp',
    category: 'cruise',
    price: 120,
    rating: 4.7,
    reviews: 730,
    desc: 'Settle into a glass-enclosed traditional wooden dhow or modern yacht at Dubai Marina. Enjoy an upscale buffet dinner with live performances against Dubai’s skyline.',
    featured: true
  },
  {
    id: 'camel-riding-safari',
    title: 'Camel Riding Safari Dubai',
    url: 'https://roaradventuretourism.com/tour/camel-riding-safari-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/10/camelriding.avif',
    category: 'safari',
    price: 110,
    rating: 4.8,
    reviews: 640,
    desc: 'Take a relaxed journey through Dubai’s conservation reserve on camelback, experiencing the desert’s ecosystem as ancient Bedouins did.',
    featured: false
  },
  {
    id: 'hatta-day-trip',
    title: 'Hatta Day Trip with Mountain Tour',
    url: 'https://roaradventuretourism.com/tour/hatta-day-trip-with-mountain-tour/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/12/hattamountaintourdubai.webp',
    category: 'city',
    price: 220,
    rating: 4.6,
    reviews: 410,
    desc: 'Escape the city to the historic mountain enclave of Hatta. Kayak on the turquoise Hatta Dam, hike the trails, and visit Hatta Heritage Village.',
    featured: false
  },
  {
    id: 'morning-desert-safari',
    title: 'Morning Desert Safari in Dubai',
    url: 'https://roaradventuretourism.com/tour/morning-desert-safari-in-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/MorningDesertSafari.webp',
    category: 'safari',
    price: 120,
    rating: 4.8,
    reviews: 890,
    desc: 'Witness the desert wake up. Includes early-morning dune bashing, sandboarding down steep slopes, camel rides, and light Arabic breakfast packages.',
    featured: false
  },
  {
    id: 'safari-without-dune-bashing',
    title: 'Dubai Desert Safari without Dune Bashing',
    url: 'https://roaradventuretourism.com/tour/dubai-desert-safari-without-dune-bashing/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2026/02/desertsafariwithoutdunebashingindubai.avif',
    category: 'safari',
    price: 130,
    rating: 4.7,
    reviews: 350,
    desc: 'A peaceful, scenic desert encounter designed for families, pregnant ladies, or elderly guests. Focuses directly on nature walks and campsite entertainment.',
    featured: false
  },
  {
    id: 'private-desert-safari',
    title: 'Private Desert Safari Dubai',
    url: 'https://roaradventuretourism.com/tour/private-desert-safari-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/PrivateDesertSafariDubai.webp',
    category: 'safari',
    price: 799,
    rating: 4.9,
    reviews: 290,
    desc: 'A private 4x4 land cruiser for you and your family/group. Fully customizable schedule, private dinner setup, and dedicated driver-guide.',
    featured: false
  },
  {
    id: 'vip-safari-quad-bike',
    title: 'VIP Desert Safari with Quad Bike',
    url: 'https://roaradventuretourism.com/tour/vip-desert-safari-with-quad-bike/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/12/vipdesertsafariwithquadbike.webp',
    category: 'buggy',
    price: 349,
    rating: 4.9,
    reviews: 580,
    desc: 'Luxury safari bundle combined with a thrilling session of all-terrain quad biking. Enjoy VIP table service and priority access at the Bedouin campsite.',
    featured: false
  },
  {
    id: 'sharjah-city-tour',
    title: 'Sharjah City Tour',
    url: 'https://roaradventuretourism.com/tour/sharjah-city-tour/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/12/dubaicitytour.webp', // fallback
    category: 'city',
    price: 130,
    rating: 4.6,
    reviews: 210,
    desc: 'Tour the Cultural Capital of the UAE. Explore the historic souks, grand mosques, and the King Faisal Mosque, with museum entry tickets included.',
    featured: false
  },
  {
    id: 'dune-buggy-adventure',
    title: 'Dune Buggy Adventure in Dubai',
    url: 'https://roaradventuretourism.com/tour/dune-buggy-adventure-in-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/QuadBikingAndDuneBuggyDubai.jpg',
    category: 'buggy',
    price: 399,
    rating: 4.8,
    reviews: 460,
    desc: 'Unleash your inner adventurer with raw engine power. Conquer custom dune tracks and enjoy spectacular desert photography stops with our guides.',
    featured: false
  },
  {
    id: 'safari-quad-bike',
    title: 'Dubai Desert Safari with Quad Bike',
    url: 'https://roaradventuretourism.com/tour/dubai-desert-safari-with-quad-bike/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/desert-safari-dubai-with-atv-qua.jpg',
    category: 'buggy',
    price: 199,
    rating: 4.7,
    reviews: 1320,
    desc: 'Our bestselling evening desert safari package bundled together with a 30-minute self-drive quad biking session in our desert arenas.',
    featured: false
  },
  {
    id: 'morning-safari-quadbike',
    title: 'Morning Desert Safari with Quadbike',
    url: 'https://roaradventuretourism.com/tour/morning-desert-safari-with-quadbike/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/Quad-biking-in-Dubai-desert-safa.jpg',
    category: 'buggy',
    price: 179,
    rating: 4.8,
    reviews: 790,
    desc: 'An action-packed morning safari. Ride high-powered quad bikes, sandboard down slopes, and enjoy traditional Arabic hospitality before the midday heat.',
    featured: false
  },
  {
    id: 'evening-safari-bbq',
    title: 'Evening Desert Safari with BBQ Dinner',
    url: 'https://roaradventuretourism.com/tour/evening-desert-safari-with-bbq-dinner/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/11/EveningDesertSafariwithbbqdinnerroaradventureswl.webp',
    category: 'safari',
    price: 139,
    rating: 4.8,
    reviews: 910,
    desc: 'A premium evening package highlighting traditional Emirati cuisines, freshly grilled BBQ, live tanoura, belly dancing, and stargazing.',
    featured: false
  },
  {
    id: 'hot-air-balloon',
    title: 'Hot Air Balloon Ride Dubai',
    url: 'https://roaradventuretourism.com/tour/hot-air-balloon-ride-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/1theUB87jbw7r532MtQFn8w.jpg',
    category: 'cruise',
    price: 999,
    rating: 4.9,
    reviews: 310,
    desc: 'Float peacefully 4,000 feet above the pristine Arabian desert. Enjoy sunrise views, in-flight falcon shows, followed by a gourmet Bedouin breakfast.',
    featured: true
  },
  {
    id: 'dune-bashing-adventure',
    title: 'Dune Bashing Adventure in Dubai',
    url: 'https://roaradventuretourism.com/tour/dune-bashing-adventure-in-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/tour_649_63e8b2d97a090.jpg',
    category: 'safari',
    price: 120,
    rating: 4.8,
    reviews: 840,
    desc: 'A dedicated roller-coaster ride over high desert dunes. Fast-paced, thrilling 4x4 maneuvers with professional safari-licensed drivers.',
    featured: false
  },
  {
    id: 'red-dunes-safari',
    title: 'Red Dunes Safari',
    url: 'https://roaradventuretourism.com/tour/red-dunes-safari/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/desert-safari-header1.jpg',
    category: 'safari',
    price: 160,
    rating: 4.9,
    reviews: 1180,
    desc: 'Explore the high-altitude crimson sand dunes of Al Lahbab. Ideal for premium dune bashing, sandboarding, and authentic desert camp experiences.',
    featured: false
  },
  {
    id: 'overnight-safari',
    title: 'Overnight Desert Safari Dubai',
    url: 'https://roaradventuretourism.com/tour/overnight-desert-safari-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/OvernightDesertSafari.webp',
    category: 'safari',
    price: 349,
    rating: 4.8,
    reviews: 260,
    desc: 'Sleep under the starry desert sky. Includes evening safari events, overnight stay in premium Bedouin tents, sleeping bags, and cooked breakfast.',
    featured: false
  },
  {
    id: 'sunrise-safari',
    title: 'Sunrise Desert Safari Dubai',
    url: 'https://roaradventuretourism.com/tour/sunrise-desert-safari-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/gallery-01709121792-sunrise-dese.jpg',
    category: 'safari',
    price: 140,
    rating: 4.7,
    reviews: 190,
    desc: 'Witness a brilliant sunrise over desert dunes. Great for morning photography, camel rides, dune drives, and fresh Arabian coffee setups.',
    featured: false
  },
  {
    id: 'dhow-cruise-dinner',
    title: 'Dhow Cruise Dinner in Dubai',
    url: 'https://roaradventuretourism.com/tour/dhow-cruise-dinner-in-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/91auwe9632in9yhrixuqzuznmolq_155-scaled.jpg',
    category: 'cruise',
    price: 85,
    rating: 4.6,
    reviews: 670,
    desc: 'Cruise along the historic Dubai Creek on a traditional wooden boat. Feast on international barbecue items and watch Tanoura dancers spin under the stars.',
    featured: false
  },
  {
    id: 'polaris-rzr-buggy',
    title: 'Polaris RZR 1000cc Dune Buggy Dubai',
    url: 'https://roaradventuretourism.com/tour/polaris-rzr-1000cc-dune-buggy-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/dxbsafari-Dune-Buggy4.jpg',
    category: 'buggy',
    price: 599,
    rating: 4.9,
    reviews: 320,
    desc: 'Drive the absolute apex of off-road engineering: the Polaris RZR 1000. Features massive suspension travel and immense torque for serious thrill-seekers.',
    featured: true
  },
  {
    id: 'quad-bike-tour',
    title: 'Quad Bike Tour in Dubai',
    url: 'https://roaradventuretourism.com/tour/quad-bike-tour-in-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/desert-safari-dubai-with-atv-qua.jpg', // reuse
    category: 'buggy',
    price: 150,
    rating: 4.7,
    reviews: 540,
    desc: 'Drive your own all-terrain vehicle through wide-open desert playgrounds. Safe, thrilling, and suitable for all skill levels under guiding rangers.',
    featured: false
  },
  {
    id: 'premium-desert-safari',
    title: 'Premium Desert Safari',
    url: 'https://roaradventuretourism.com/tour/premium-desert-safari/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/10/PremiumDesertSafariDubai.webp',
    category: 'safari',
    price: 249,
    rating: 4.9,
    reviews: 410,
    desc: 'Elevate your desert experience with high-end buffet spreads, comfortable seating areas, personalized guides, and faster tracks for dune drives.',
    featured: false
  }
];

export default function LandingPageView() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Monitor scroll for glass header sticky effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsHeaderScrolled(true);
      } else {
        setIsHeaderScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBookNowClick = () => {
    window.location.hash = '#/book';
  };

  const filteredTours = TOURS_DATA.filter(tour => {
    const matchesCategory = activeTab === 'all' || tour.category === activeTab;
    const matchesSearch = tour.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tour.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="landing-page">
      {/* GLOBAL HEADER NAVBAR */}
      <header className={`lp-header ${isHeaderScrolled ? 'scrolled' : ''}`}>
        <div className="lp-container lp-nav">
          <a href="#" className="lp-logo">
            <img src="/logo.jpg" alt="Roar Adventure Tourism LLC Logo" />
            <span className="lp-logo-text">ROAR ADVENTURE</span>
          </a>

          <ul className="lp-nav-links">
            <li><a href="#about" className="lp-nav-link">About Us</a></li>
            <li><a href="#tours" className="lp-nav-link active">Experiences</a></li>
            <li><a href="#why-us" className="lp-nav-link">Why Choose Us</a></li>
            <li><a href="#contact" className="lp-nav-link">Contact</a></li>
          </ul>

          <div className="lp-nav-actions">
            <a href="https://wa.me/97145578679" className="lp-btn-contact" target="_blank" rel="noopener noreferrer">
              <Phone size={16} /> <span>+971 4 557 8679</span>
            </a>
            <button onClick={handleBookNowClick} className="lp-btn-primary header-btn">
              Book Online
            </button>
            <button className="lp-mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAV DRAWER */}
      <div className={`lp-mobile-overlay ${isMobileMenuOpen ? 'visible' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>
      <div className={`lp-mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="lp-mobile-drawer-header">
          <span className="lp-logo-text">ROAR ADVENTURE</span>
          <button className="lp-mobile-drawer-close" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <ul className="lp-mobile-nav-links">
          <li><a href="#about" className="lp-mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>About Us</a></li>
          <li><a href="#tours" className="lp-mobile-nav-link active" onClick={() => setIsMobileMenuOpen(false)}>Experiences</a></li>
          <li><a href="#why-us" className="lp-mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Why Choose Us</a></li>
          <li><a href="#contact" className="lp-mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Contact</a></li>
        </ul>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <a href="https://wa.me/97145578679" className="lp-btn-secondary" style={{ justifyContent: 'center' }} target="_blank" rel="noopener noreferrer">
            <Phone size={16} /> WhatsApp Call
          </a>
          <button onClick={() => { setIsMobileMenuOpen(false); handleBookNowClick(); }} className="lp-btn-primary" style={{ justifyContent: 'center' }}>
            Book Online
          </button>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="lp-hero">
        <div className="lp-hero-bg" style={{ backgroundImage: 'url(https://roaradventuretourism.com/wp-content/uploads/2025/07/desert-safari-header1.jpg)' }}></div>
        <div className="lp-hero-bg-overlay"></div>
        <div className="lp-container">
          <div className="lp-hero-content">
            <span className="lp-hero-tagline">
              <Sparkles size={14} /> Dubai's Premier Adventure Operator
            </span>
            <h1 className="lp-hero-title">
              Experience the True Spirit of <span>Arabian Adventure</span>
            </h1>
            <p className="lp-hero-desc">
              Explore Dubai's red desert dunes in custom Can-Am buggies, ride majestic camels at sunset, and dine in luxury Bedouin camps. Book premium tours backed by DTCM licensing and high-end security.
            </p>
            <div className="lp-hero-btns">
              <button onClick={handleBookNowClick} className="lp-btn-primary lp-btn-pulse">
                Instantly Book Safaris <ArrowRight size={16} />
              </button>
              <a href="#tours" className="lp-btn-secondary">
                View All Experiences
              </a>
            </div>

            <div className="lp-hero-stats">
              <div className="lp-stat-item">
                <span className="lp-stat-number">150K+</span>
                <span className="lp-stat-label">Happy Guests</span>
              </div>
              <div className="lp-stat-item">
                <span className="lp-stat-number">26+</span>
                <span className="lp-stat-label">Luxury Packages</span>
              </div>
              <div className="lp-stat-item">
                <span className="lp-stat-number">4.9/5</span>
                <span className="lp-stat-label">TripAdvisor Rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EXPLORER SECTION (WITH ALL 26 TOURS) */}
      <section id="tours" className="lp-explorer">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-subtitle">Premium Adventures</span>
            <h2 className="lp-section-title">Discover Our Curated Experiences</h2>
            <p className="lp-section-desc">
              Explore the rich variety of Dubai adventures. Filter through our 26 signature safaris, off-road self-drives, creek cruises, and scenic city excursions.
            </p>
          </div>

          {/* Search & Tabs control bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', marginBottom: '48px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
              <input 
                type="text" 
                placeholder="Search packages (e.g. Can-Am, BBQ, Overnight...)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 20px 14px 46px',
                  borderRadius: '30px',
                  border: '1.5px solid var(--lp-border)',
                  background: 'var(--lp-glass)',
                  color: 'var(--lp-light)',
                  fontSize: '14px',
                  outline: 'none',
                  backdropFilter: 'blur(8px)',
                  transition: 'border-color 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--lp-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--lp-border)'}
              />
              <Search size={18} style={{ position: 'absolute', left: '18px', top: '16px', color: 'var(--lp-muted)' }} />
            </div>

            <div className="lp-filter-tabs">
              <button className={`lp-tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Experiences</button>
              <button className={`lp-tab-btn ${activeTab === 'safari' ? 'active' : ''}`} onClick={() => setActiveTab('safari')}>Desert Safaris</button>
              <button className={`lp-tab-btn ${activeTab === 'buggy' ? 'active' : ''}`} onClick={() => setActiveTab('buggy')}>Buggy & ATV Rides</button>
              <button className={`lp-tab-btn ${activeTab === 'city' ? 'active' : ''}`} onClick={() => setActiveTab('city')}>City Tours & Day Trips</button>
              <button className={`lp-tab-btn ${activeTab === 'cruise' ? 'active' : ''}`} onClick={() => setActiveTab('cruise')}>Cruises & Sky Escapes</button>
            </div>
          </div>

          {/* Grid of Tours */}
          <div className="lp-grid">
            {filteredTours.map((tour) => (
              <article key={tour.id} className="lp-card">
                <div className="lp-card-img-wrapper">
                  <img src={tour.image} alt={`${tour.title} Redesigned Card Image`} className="lp-card-img" loading="lazy" />
                  <span className="lp-card-badge">{tour.category === 'safari' ? 'Desert Safari' : tour.category === 'buggy' ? 'Offroad' : tour.category === 'city' ? 'City Tour' : 'Sightseeing'}</span>
                  <div className="lp-card-overlay"></div>
                </div>
                <div className="lp-card-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 className="lp-card-title">{tour.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--lp-secondary)', fontSize: '13px', fontWeight: '700' }}>
                      <Star size={14} fill="currentColor" /> {tour.rating}
                    </div>
                  </div>
                  <p className="lp-card-desc">{tour.desc}</p>
                  <div className="lp-card-meta">
                    <div>
                      <span className="lp-card-price-label">Price from</span>
                      <div className="lp-card-price-value">{tour.price} <span>AED</span></div>
                    </div>
                    {/* Crucial requirement: anchor text explicitly points to exact live URLs */}
                    <a 
                      href={tour.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="lp-card-btn"
                      title={`Book live session for ${tour.title}`}
                    >
                      Explore Tour <ChevronRight size={14} />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredTours.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--lp-muted)' }}>
              <Compass size={40} style={{ marginBottom: '16px' }} />
              <p>No experiences found matching your criteria. Try another search or filter.</p>
            </div>
          )}
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section id="why-us" className="lp-why-choose">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-subtitle">Why Choose Roar</span>
            <h2 className="lp-section-title">The Roar Quality Guarantee</h2>
            <p className="lp-section-desc">
              We own our fleet of vehicles, operate under direct regulatory compliance, and recruit the finest Bedouin campsite hosts in Dubai.
            </p>
          </div>

          <div className="lp-features-grid">
            <div className="lp-feature-card">
              <div className="lp-feature-icon">
                <Award />
              </div>
              <h3 className="lp-feature-title">DTCM Licensed Operator</h3>
              <p className="lp-feature-desc">Certified by the Department of Economy and Tourism in Dubai. We host and operate 100% of our tours directly.</p>
            </div>

            <div className="lp-feature-card">
              <div className="lp-feature-icon">
                <Shield />
              </div>
              <h3 className="lp-feature-title">5-Star Safety Protocol</h3>
              <p className="lp-feature-desc">All buggies have full roll-cages, multi-point harness seatbelts, and off-road safety tracking.</p>
            </div>

            <div className="lp-feature-card">
              <div className="lp-feature-icon">
                <Clock />
              </div>
              <h3 className="lp-feature-title">Flexible Cancellations</h3>
              <p className="lp-feature-desc">Cancel up to 24 hours in advance for a full refund. Quick weather re-booking supports all guests.</p>
            </div>

            <div className="lp-feature-card">
              <div className="lp-feature-icon">
                <Sparkles />
              </div>
              <h3 className="lp-feature-title">Custom Bedouin Camps</h3>
              <p className="lp-feature-desc">Our campgrounds offer genuine hospitality, clean facilities, premium seating, and gourmet food choices.</p>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE BOOKING CTA BANNER */}
      <section className="lp-cta">
        <div className="lp-container">
          <div className="lp-cta-box">
            <span className="lp-cta-subtitle">Ready for the adventure?</span>
            <h2 className="lp-cta-title">Build Your Custom Dream Desert Adventure Package</h2>
            <p className="lp-cta-desc">
              Mix and match Evening Safaris with dune buggy upgrades, long camel rides, and custom photography services in our real-time interactive booking builder.
            </p>
            <div className="lp-cta-btn-group">
              <button onClick={handleBookNowClick} className="lp-btn-primary lp-btn-pulse" style={{ fontSize: '15px', padding: '14px 36px' }}>
                Open Interactive Builder <ArrowRight size={18} />
              </button>
              <a href="https://wa.me/97145578679" target="_blank" rel="noopener noreferrer" className="lp-btn-secondary" style={{ fontSize: '15px', padding: '14px 36px' }}>
                Chat with Tour Planner
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER WITH COMPREHENSIVE DIRECTORY OF ALL 26 TOURS */}
      <footer id="contact" className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-info">
              <span className="lp-logo-text" style={{ fontSize: '22px' }}>ROAR ADVENTURE</span>
              <p className="lp-footer-desc">
                Roar Adventure Tourism LLC is an award-winning tour operator providing desert safaris, offroad dune buggies, city tours, and cruise dinning inside Dubai, UAE.
              </p>
              <div className="lp-footer-socials">
                <a href="#" className="lp-social-btn"><Heart size={16} /></a>
                <a href="#" className="lp-social-btn"><Compass size={16} /></a>
                <a href="#" className="lp-social-btn"><Star size={16} /></a>
              </div>
            </div>

            <div>
              <h3 className="lp-footer-col-title">Quick Links</h3>
              <ul className="lp-footer-links">
                <li><a href="#about" className="lp-footer-link"><ChevronRight size={12} /> About Our Agency</a></li>
                <li><a href="#tours" className="lp-footer-link"><ChevronRight size={12} /> Explore Packages</a></li>
                <li><a href="#why-us" className="lp-footer-link"><ChevronRight size={12} /> Quality Guarantees</a></li>
                <li><button onClick={handleBookNowClick} className="lp-footer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}><ChevronRight size={12} /> Interactive Builder</button></li>
              </ul>
            </div>

            <div>
              <h3 className="lp-footer-col-title">Safari Categories</h3>
              <ul className="lp-footer-links">
                <li><a href="#tours" onClick={() => setActiveTab('safari')} className="lp-footer-link"><ChevronRight size={12} /> Desert Safaris</a></li>
                <li><a href="#tours" onClick={() => setActiveTab('buggy')} className="lp-footer-link"><ChevronRight size={12} /> Offroad ATV & Buggy</a></li>
                <li><a href="#tours" onClick={() => setActiveTab('city')} className="lp-footer-link"><ChevronRight size={12} /> City Sightseeing</a></li>
                <li><a href="#tours" onClick={() => setActiveTab('cruise')} className="lp-footer-link"><ChevronRight size={12} /> Yacht Cruises</a></li>
              </ul>
            </div>

            <div className="lp-footer-contact">
              <h3 className="lp-footer-col-title">Get In Touch</h3>
              <div className="lp-footer-contact-item">
                <MapPin className="lp-footer-contact-icon" />
                <span>Dubai World Trade Centre (DWTC), Sheikh Zayed Rd, Dubai, UAE</span>
              </div>
              <div className="lp-footer-contact-item">
                <Phone className="lp-footer-contact-icon" />
                <span>+971 4 557 8679</span>
              </div>
              <div className="lp-footer-contact-item">
                <Compass className="lp-footer-contact-icon" />
                <span>info@roaradventuretourism.com</span>
              </div>
            </div>
          </div>

          {/* ALL 26 SITEMAP TOUR PAGES LINKED IN THE COMPREHENSIVE DIRECTORY */}
          <div className="lp-footer-directory">
            <h4 className="lp-directory-title">All Adventure Packages & Live Tour Links</h4>
            <div className="lp-directory-tags">
              {TOURS_DATA.map((tour) => (
                <a 
                  key={tour.id} 
                  href={tour.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="lp-directory-tag"
                  title={`Live view of ${tour.title} on Roar Adventure Tourism`}
                >
                  {tour.title}
                </a>
              ))}
            </div>
          </div>

          <div className="lp-footer-bottom">
            <p>&copy; {new Date().getFullYear()} Roar Adventure Tourism LLC. Licensed DTCM Tour Operator. All rights reserved.</p>
            <p style={{ display: 'flex', gap: '20px' }}>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms & Conditions</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
