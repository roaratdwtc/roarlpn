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
  ChevronRight,
  CheckCircle,
  HelpCircle,
  ThumbsUp
} from 'lucide-react';
import './LandingPageView.css';

// Exact 26 tours list from sitemap-post-type-tour.xml with respective live URLs and live images
// @@ANCHOR_RANDOMIZER_START@@
const TOURS_DATA = [
  {
    id: 'evening-safari',
    title: 'Desert Safari with BBQ Dinner',
    url: 'https://roaradventuretourism.com/tour/evening-desert-safari/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/11/EveningDesertSafarin.webp',
    category: 'safari',
    price: 149,
    rating: 4.9,
    reviews: 1540,
    desc: 'The classic evening safari package in Lehbab Red Dunes. Includes dune bashing in 4x4 Land Cruisers, live shows (Belly dance, fire show, Tanoura), short camel ride, sandboarding, and a full BBQ buffet dinner with vegetarian and non-vegetarian selections.',
    inclusions: [
      'Home/Hotel Pickup & Dropoff',
      'Dune Bashing in 4x4 Land Cruisers',
      'Live Entertainment Shows',
      'Short Camel Ride',
      'Unlimited Water & Soft Drinks',
      'BBQ Buffet Dinner (Veg & Non-Veg)',
      'Henna Tattoo for Ladies',
      'Arabic Costumes',
      'Sunset Photography',
    ],
    anchorVariations: [
      'Evening Desert Safari',
      'Evening Desert Safari Dubai',
      'VIP Evening Desert Safari Deals',
      'Dubai Evening Safari Tour 2026',
      'Desert Safari with BBQ Dinner',
    ]
  },
  {
    id: 'vip-desert-safari-dubai',
    title: 'VIP Safari with Sofa Seating',
    url: 'https://roaradventuretourism.com/tour/vip-desert-safari-in-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/VIPDesertSafari.webp',
    category: 'safari',
    price: 199,
    rating: 4.9,
    reviews: 1820,
    desc: 'Premium desert experience with VIP treatment. Skip the campsite queues and enjoy dedicated sofa seating, table service, separate BBQ areas, and personalized guides, alongside standard dune bashing and live campsite shows.',
    inclusions: [
      'All Evening Safari Inclusions',
      'Separate BBQ for VIPs',
      'VIP Sofa Seating',
      'Table Service for Drinks & Food',
      'AC VIP Seating Upgrade Available',
      'Priority Camel Riding Access',
    ],
    anchorVariations: [
      'VIP Desert Safari in Dubai',
      'VIP Desert Safari Dubai Deals',
      'Luxury Desert Safari Dubai',
      'VIP Safari with Sofa Seating',
      'VIP Desert Camp Dubai',
    ]
  },
  {
    id: 'premium-desert-safari',
    title: 'Premium Campsite Dinner Tour',
    url: 'https://roaradventuretourism.com/tour/premium-desert-safari/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/10/PremiumDesertSafariDubai.webp',
    category: 'safari',
    price: 249,
    rating: 4.9,
    reviews: 980,
    desc: 'Top-tier red dunes safari package containing direct pickup/dropoff in high-end Land Cruisers, a 30-minute quad bike session, private campgrounds access, and VIP table dining service.',
    inclusions: [
      'Pickup & Dropoff in Land Cruiser',
      '30 Minutes Quad Biking',
      'VIP Sofa Seating',
      'Separate BBQ Buffet Area',
      'Belly Dance, Fire & Tanoura Shows',
      'Henna Tattooing & Sunset Photo Stops',
    ],
    anchorVariations: [
      'Premium Desert Safari',
      'Premium Desert Safari Dubai',
      'Premium Safari with Quadbike',
      'Luxury Red Dunes Safari Package',
      'Premium Campsite Dinner Tour',
    ]
  },
  {
    id: 'morning-desert-safari',
    title: 'Morning Desert Safari Dubai',
    url: 'https://roaradventuretourism.com/tour/morning-desert-safari-in-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/MorningDesertSafari.webp',
    category: 'safari',
    price: 120,
    rating: 4.8,
    reviews: 640,
    desc: 'Perfect for morning adventurers. Experience the refreshing desert breeze, early morning dune bashing, camel riding, sandboarding, and photography stops under clear blue skies before the midday heat.',
    inclusions: [
      'Home/Hotel Pickup & Dropoff',
      'Dune Bashing in 4x4 Land Cruisers',
      'Land Cruiser Pickup & Dropoff',
      'Short Camel Ride',
      'Long Camel Ride (Extra)',
      'Quad Bike & Buggy (Extra)',
      'Falcon Pictures Stop',
    ],
    anchorVariations: [
      'Morning Desert Safari in Dubai',
      'Morning Desert Safari Dubai',
      'Morning Safari with Camel Ride',
      'Early Morning Desert Safari',
      'Morning Safari In Al Awir',
    ]
  },
  {
    id: 'overnight-desert-safari',
    title: 'Sleep in Desert Safari Package',
    url: 'https://roaradventuretourism.com/tour/overnight-desert-safari-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/OvernightDesertSafari.webp',
    category: 'safari',
    price: 349,
    rating: 4.8,
    reviews: 410,
    desc: 'Spend the night under the stars in Al Awir or Lahbab desert. Includes the entire evening desert safari program, overnight camping in comfortable tents with pillows and blankets, stargazing, and morning breakfast.',
    inclusions: [
      'All Evening Safari Inclusions',
      'Pillow, Blanket & Private Tent',
      'Overnight Camping Setup',
      'Stargazing & Campfire Session',
      'Fresh Arabic Breakfast',
      'All Time Slots Available on Request',
    ],
    anchorVariations: [
      'Overnight Desert Safari Dubai',
      'Sleep in Desert Safari Package',
      'Overnight Camping Safari Dubai',
      'Desert Camping with Breakfast',
      '24 Hour Desert Safari Dubai',
    ]
  },
  {
    id: 'private-desert-safari',
    title: 'Private Desert Safari Dubai',
    url: 'https://roaradventuretourism.com/tour/private-desert-safari-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/PrivateDesertSafariDubai.webp',
    category: 'safari',
    price: 799,
    rating: 4.9,
    reviews: 320,
    desc: 'An exclusive desert tour designed for families, honeymooners, or corporate groups. Enjoy a dedicated 4x4 Land Cruiser, customized timing schedules, and private dinner tables/campsite spaces.',
    inclusions: [
      'Exclusive Private 4x4 Cruiser',
      'doorstep Pickup & Dropoff',
      'Customized Tour Schedule',
      'Private VIP Table & Seating',
      'Dune Bashing or Gentle Nature Drive',
      'Full Evening Campsite Inclusions',
    ],
    anchorVariations: [
      'Private Desert Safari Dubai',
      'Private 4x4 Desert Safari',
      'Exclusive Private Safari Dubai',
      'Private Family Desert Safari',
      'Custom Private Desert Tour',
    ]
  },
  {
    id: 'dune-buggy-dubai',
    title: 'Can-Am Buggy Tour Dubai',
    url: 'https://roaradventuretourism.com/tour/dune-buggy-in-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/canam-scaled-4-Seater.jpg',
    category: 'buggy',
    price: 450,
    rating: 4.8,
    reviews: 1120,
    desc: 'Command your own premium multi-seater Can-Am Maverick buggy. Take on high red dunes under the instruction of certified guides. Fully equipped with automatic transmissions and safety roll cages.',
    inclusions: [
      'Self-Drive Can-Am Buggy',
      'Safety Gear (Helmets, Goggles)',
      'Certified Desert Tour Guide',
      'Open Desert Dunes Driving',
      'Refreshments & Soft Drinks',
      'Doorstep Transfer Included',
    ],
    anchorVariations: [
      'Dune Buggy in Dubai',
      'Dubai Dune Buggy Rental',
      'Can-Am Buggy Tour Dubai',
      'Self Drive Dune Buggy Dubai',
      'Offroad Buggy Tour Lahbab',
    ]
  },
  {
    id: 'polaris-rzr-buggy',
    title: 'High Performance Polaris Buggy',
    url: 'https://roaradventuretourism.com/tour/polaris-rzr-1000cc-dune-buggy-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/dxbsafari-Dune-Buggy4.jpg',
    category: 'buggy',
    price: 599,
    rating: 4.9,
    reviews: 290,
    desc: 'Drive the pinnacle of dune buggy performance: the Polaris RZR 1000cc. Engineered with high-clearance suspension travel and raw power to climb the steepest red dunes with ease.',
    inclusions: [
      'Self-Drive Polaris RZR 1000cc',
      'Professional Instructors',
      'Full Safety Briefing & Gear',
      'Guided Red Dunes Excursion',
      'Soft Drinks & Ice Water',
      'Hotel Pickup & Dropoff Option',
    ],
    anchorVariations: [
      'Polaris RZR 1000cc Dune Buggy Dubai',
      'Polaris RZR Dune Buggy Dubai 1000 CC',
      'Polaris 1000cc Buggy Ride',
      'Polaris RZR Red Dunes Rental',
      'High Performance Polaris Buggy',
    ]
  },
  {
    id: 'quad-bike-tour',
    title: 'Quad Bike Tour in Dubai',
    url: 'https://roaradventuretourism.com/tour/quad-bike-tour-in-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/desert-safari-dubai-with-atv-qua.jpg',
    category: 'buggy',
    price: 150,
    rating: 4.7,
    reviews: 840,
    desc: 'Drive powerful all-terrain ATVs across custom sand circuits and open desert dunes. Ideal for beginners and expert riders looking for high-octane desert motorsports.',
    inclusions: [
      'ATV Quad Bike Self-Drive',
      'Helmets & Protection Gear',
      'Safety Instructor & Guiding',
      'Dune Photostop Opportunities',
      'Water & Soft Drinks',
    ],
    anchorVariations: [
      'Quad Bike Tour in Dubai',
      'Single Quad Bike Adventure',
      'Dubai Quad Biking Tour',
      'All Terrain Quad Bike Dubai',
      'Open Desert Quad Biking Ride',
    ]
  },
  {
    id: 'dubai-city-tour',
    title: 'Dubai City Tour Booking',
    url: 'https://roaradventuretourism.com/tour/dubai-city-tour/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/12/dubaicitytour.webp',
    category: 'city',
    price: 99,
    rating: 4.7,
    reviews: 1380,
    desc: 'Discover the contrasts of Dubai. A comprehensive tour highlighting modern architectural wonders (Burj Khalifa, Burj Al Arab, Palm Jumeirah) alongside historic markets (Gold & Spice Souk).',
    inclusions: [
      'Air-Conditioned Tourism Bus/Coach',
      'Professional English-Speaking Guide',
      'doorstep Pickup & Dropoff',
      'Visit Burj Al Arab (Photostop)',
      'Visit Palm Jumeirah & Atlantis',
      'Explore Deira Souks & Creek',
    ],
    anchorVariations: [
      'Dubai City Tour',
      'Dubai City Tour Booking',
      'Dubai Guided Sightseeing Tour',
      'Half Day Dubai City Tour',
      'Dubai Landmarks Tour',
    ]
  },
  {
    id: 'abu-dhabi-city-tour',
    title: 'Abu Dhabi City Tour',
    url: 'https://roaradventuretourism.com/tour/book-abu-dhabi-city-tour/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/12/Abudhabicitytourmosque.webp',
    category: 'city',
    price: 199,
    rating: 4.8,
    reviews: 1040,
    desc: 'Embark on a full-day trip to the UAE’s capital. Tour the spectacular Sheikh Zayed Grand Mosque, Yas Island, Heritage Village, and capture photos at Emirates Palace.',
    inclusions: [
      'Full-Day Guided Tour from Dubai',
      'Sheikh Zayed Grand Mosque Access',
      'Explore Yas Island & Marina Mall',
      'Emirates Palace (Photostop)',
      'Professional Tour Guide',
      'All Entrance Tickets Included',
    ],
    anchorVariations: [
      'Abu Dhabi City Tour',
      'Book Abu Dhabi City Tour',
      'Abu Dhabi Day Trip from Dubai',
      'Grand Mosque Tour Abu Dhabi',
      'Abu Dhabi Guided Sightseeing',
    ]
  },
  {
    id: 'sharjah-city-tour',
    title: 'Sightseeing Tour in Sharjah',
    url: 'https://roaradventuretourism.com/tour/sharjah-city-tour/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/12/dubaicitytour.webp',
    category: 'city',
    price: 130,
    rating: 4.6,
    reviews: 190,
    desc: 'Explore the Cultural Capital of the UAE. Tour historical sites, traditional souks (Blue Souk), the magnificent King Faisal Mosque, and the Sharjah museum district.',
    inclusions: [
      'Guided Sightseeing Program',
      'Visit Central Blue Souk',
      'King Faisal Mosque (Photostop)',
      'Historical Museum entry tickets',
      'Pickup & Dropoff from Dubai/Sharjah',
    ],
    anchorVariations: [
      'Sharjah City Tour',
      'Sharjah Guided City Tour',
      'Sharjah Cultural Heritage Tour',
      'Sightseeing Tour in Sharjah',
      'Sharjah Museum Tour',
    ]
  },
  {
    id: 'hatta-day-trip',
    title: 'Hatta Day Trip Booking',
    url: 'https://roaradventuretourism.com/tour/hatta-day-trip-with-mountain-tour/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/12/hattamountaintourdubai.webp',
    category: 'city',
    price: 220,
    rating: 4.6,
    reviews: 310,
    desc: 'Journey to the Hajar Mountains. Kayak across the clear waters of Hatta Dam, hike scenic trails, and explore the ancient Hatta Heritage Village.',
    inclusions: [
      'Pickup & Dropoff in SUV/4x4',
      'Scenic Mountain Drive to Hatta',
      'Visit Hatta Dam & Kayak stop',
      'Explore Hatta Heritage Village',
      'Hatta Hill Park & Honeybee Discovery',
    ],
    anchorVariations: [
      'Hatta Day Trip with Mountain Tour',
      'Hatta Mountain Tour from Dubai',
      'Hatta Kayaking & Heritage Tour',
      'Hatta Day Trip Booking',
      'Dubai to Hatta Mountain Excursion',
    ]
  },
  {
    id: 'marina-cruise-dinner',
    title: 'Luxury Marina Cruise Dubai',
    url: 'https://roaradventuretourism.com/tour/dubai-marina-cruise-dinner/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/12/dubaimarinacruisedinner.webp',
    category: 'cruise',
    price: 120,
    rating: 4.7,
    reviews: 860,
    desc: 'Glance at Dubai Marina’s illuminated skyscrapers on a double-decker glass boat or luxury yacht. Includes an upscale international buffet dinner and traditional Tanoura performances.',
    inclusions: [
      '2 Hours Luxury Marina Cruise',
      'International Buffet Dinner (Veg & Non-Veg)',
      'Live Tanoura Dance Performance',
      'Welcome Arabic Coffee & Dates',
      'Air-Conditioned Lower Deck',
      'Open-Air Scenic Upper Deck',
    ],
    anchorVariations: [
      'Dubai Marina Cruise Dinner',
      'Marina Yacht Dinner Cruise',
      'Luxury Marina Cruise Dubai',
      'Marina Buffet Cruise Dinner',
      'Dubai Marina Dhow Cruise',
    ]
  },
  {
    id: 'dhow-cruise-dinner',
    title: 'Dubai Creek Dhow Cruise Dinner',
    url: 'https://roaradventuretourism.com/tour/dhow-cruise-dinner-in-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/91auwe9632in9yhrixuqzuznmolq_155-scaled.jpg',
    category: 'cruise',
    price: 85,
    rating: 4.6,
    reviews: 580,
    desc: 'Float along the historic Dubai Creek on a traditional rustic wooden dhow. Enjoy classic Arabic BBQ dishes, soft background music, and Tanoura dance shows.',
    inclusions: [
      '2 Hours Traditional Creek Cruise',
      'Arabic BBQ Buffet Dinner',
      'Tanoura Dance Performance',
      'Unlimited Refreshments',
      'Background Melodic Music',
    ],
    anchorVariations: [
      'Dhow Cruise Dinner in Dubai',
      'Creek Dhow Cruise Dinner',
      'Traditional Dhow Cruise Buffet',
      'Creek Yacht Buffet Dinner',
      'Dubai Creek Dhow Cruise Dinner',
    ]
  },
  {
    id: 'hot-air-balloon',
    title: 'Sunrise Hot Air Balloon Flight',
    url: 'https://roaradventuretourism.com/tour/hot-air-balloon-ride-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/1theUB87jbw7r532MtQFn8w.jpg',
    category: 'cruise',
    price: 999,
    rating: 4.9,
    reviews: 280,
    desc: 'Ascend 4,000 feet above the Dubai desert at sunrise. Catch panoramic views of the sand dunes, watch a live in-flight falcon display, followed by a gourmet breakfast.',
    inclusions: [
      'Gourmet Bedouin Breakfast',
      'In-Flight Falcon Show',
      'Sunrise Balloon Flight (1 Hour)',
      'Flight Certificate Signed by Pilot',
      'doorstep Hotel Transfers',
    ],
    anchorVariations: [
      'Hot Air Balloon Ride Dubai',
      'Sunrise Hot Air Balloon Flight',
      'Luxury Balloon Ride over Desert',
      'Hot Air Balloon Dubai Booking',
      'Dubai Desert Hot Air Balloon Tour',
    ]
  },
  {
    id: 'camel-riding-safari',
    title: 'Desert Safari with Camel Ride',
    url: 'https://roaradventuretourism.com/tour/camel-riding-safari-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/10/camelriding.avif',
    category: 'safari',
    price: 110,
    rating: 4.8,
    reviews: 510,
    desc: 'A dedicated, slow-paced desert journey on camelback. Spot native wildlife like Arabian Oryx and gazelles in the Dubai Desert Conservation Reserve.',
    inclusions: [
      'Guided Camel Caravan Ride',
      'Wildlife Spotting Walks',
      'Traditional Bedouin Camp Visit',
      'doorstep Desert Transfer',
      'Water & Coffee Refreshments',
    ],
    anchorVariations: [
      'Camel Riding Safari Dubai',
      'Desert Safari with Camel Ride',
      'Traditional Camel Caravan Dubai',
      'Camel Trekking Tour Dubai',
      'Bedouin Camel Riding Safari',
    ]
  },
  {
    id: 'safari-without-dune-bashing',
    title: 'Safari for Pregnant Ladies Dubai',
    url: 'https://roaradventuretourism.com/tour/dubai-desert-safari-without-dune-bashing/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2026/02/desertsafariwithoutdunebashingindubai.avif',
    category: 'safari',
    price: 130,
    rating: 4.7,
    reviews: 240,
    desc: 'Specifically designed for pregnant women, families with toddlers, elderly guests, or anyone wanting to skip high-impact off-roading. Drive straight to camp.',
    inclusions: [
      'Direct Camp SUV Transfer',
      'Nature & Stargazing Walks',
      'Camel Ride & Henna Painting',
      'Live Dance & Fire shows',
      'BBQ Buffet Dinner',
    ],
    anchorVariations: [
      'Dubai Desert Safari without Dune Bashing',
      'Desert Safari without Dune Bashing',
      'Safari for Pregnant Ladies Dubai',
      'Gentle Desert Safari Dubai',
      'Safari for Seniors Citizens',
    ]
  },
  {
    id: 'vip-safari-quad-bike',
    title: 'VIP Desert Safari with Quad Bike',
    url: 'https://roaradventuretourism.com/tour/vip-desert-safari-with-quad-bike/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/12/vipdesertsafariwithquadbike.webp',
    category: 'buggy',
    price: 349,
    rating: 4.9,
    reviews: 490,
    desc: 'Double the excitement. Combine the high-end VIP Evening Safari and private camp table service with an open-desert quad biking excursion.',
    inclusions: [
      '30 Minutes Quad Biking Session',
      'All VIP Desert Safari Inclusions',
      'priority access at Camp activities',
      'Private Sofa Table Service',
    ],
    anchorVariations: [
      'VIP Desert Safari with Quad Bike',
      'VIP Safari with Quad Bike Ride',
      'VIP Quad Biking Safari Dubai',
      'Luxury Safari and Quad Bike',
      'VIP Red Dunes Quad Safari',
    ]
  },
  {
    id: 'dune-buggy-adventure',
    title: 'Offroad Buggy Excursion Dubai',
    url: 'https://roaradventuretourism.com/tour/dune-buggy-adventure-in-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/QuadBikingAndDuneBuggyDubai.jpg',
    category: 'buggy',
    price: 399,
    rating: 4.8,
    reviews: 350,
    desc: 'Self-drive buggy rental packages built for pure adventure. Conquer steep sand hills, make custom photo stops, and enjoy driving high-powered engines.',
    inclusions: [
      'Self-Drive ATV/Buggy Session',
      'Safety Instruction & Guiding',
      'Helmet, Goggles, and Safety Harness',
      'Soft Drinks & Chilled Water',
    ],
    anchorVariations: [
      'Dune Buggy Adventure in Dubai',
      'Self Drive Buggy Rental Dubai',
      'Dune Buggy Adventure Ride',
      'Offroad Buggy Excursion Dubai',
      'Desert Buggy Ride Lahbab',
    ]
  },
  {
    id: 'safari-quad-bike',
    title: 'Evening Safari and Quad Bike',
    url: 'https://roaradventuretourism.com/tour/dubai-desert-safari-with-quad-bike/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/desert-safari-dubai-with-atv-qua.jpg',
    category: 'buggy',
    price: 199,
    rating: 4.7,
    reviews: 1210,
    desc: 'The best-value combo. Enjoy our complete Evening Desert Safari package bundled together with a 30-minute self-drive quad biking session in our designated tracks.',
    inclusions: [
      '30 Minutes Quad Bike Ride',
      'Home/Hotel Pickup & Dropoff',
      'Dune Bashing in 4x4 Land Cruisers',
      'BBQ Buffet Dinner & Entertainment',
    ],
    anchorVariations: [
      'Dubai Desert Safari with Quad Bike',
      'Desert Safari with Quad Bike Ride',
      'Evening Safari and Quad Bike',
      'Red Dunes Safari with ATV',
      'Dubai Quad Biking Safari Deal',
    ]
  },
  {
    id: 'morning-safari-quadbike',
    title: 'Morning Safari With Quadbike',
    url: 'https://roaradventuretourism.com/tour/morning-desert-safari-with-quadbike/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/Quad-biking-in-Dubai-desert-safa.jpg',
    category: 'buggy',
    price: 179,
    rating: 4.8,
    reviews: 580,
    desc: 'Beat the heat with a morning tour. Includes active sand dune quad biking, sandboarding, short camel ride, and refreshments before returning by noon.',
    inclusions: [
      '30 Minutes Quad Biking Session',
      'Dune Bashing in 4x4 Cruiser',
      'Short Camel Ride & Sandboarding',
      'chilled Mineral Water & Soft Drinks',
    ],
    anchorVariations: [
      'Morning Desert Safari with Quadbike',
      'Morning Safari With Quadbike',
      'Morning Quad Bike Safari Dubai',
      'Early Morning ATV Tour',
      'Morning Red Dunes ATV Ride',
    ]
  },
  {
    id: 'evening-safari-bbq',
    title: 'Campsite BBQ Safari Dubai',
    url: 'https://roaradventuretourism.com/tour/evening-desert-safari-with-bbq-dinner/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/11/EveningDesertSafariwithbbqdinnerroaradventureswl.webp',
    category: 'safari',
    price: 139,
    rating: 4.8,
    reviews: 790,
    desc: 'Focuses deeply on local Emirati cuisine and campsite hospitality. Includes dune drives, live shows, henna, Arabic dress up, and a large BBQ buffet.',
    inclusions: [
      'Standard Evening Safari inclusions',
      'Unlimited BBQ Buffet Dinner',
      'Henna Painting for Ladies',
      'Belly Dance & Fire performance',
    ],
    anchorVariations: [
      'Evening Desert Safari with BBQ Dinner',
      'Evening Safari with BBQ Dinner',
      'Campsite BBQ Safari Dubai',
      'Red Dunes Buffet Safari Dinner',
      'Evening Desert Safari Package',
    ]
  },
  {
    id: 'dune-bashing-adventure',
    title: 'Extreme Dune Bashing Dubai',
    url: 'https://roaradventuretourism.com/tour/dune-bashing-adventure-in-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/tour_649_63e8b2d97a090.jpg',
    category: 'safari',
    price: 120,
    rating: 4.8,
    reviews: 690,
    desc: 'For high-impact adrenaline lovers. A dedicated, longer session of high-speed desert dune drifting in custom Land Cruisers driven by licensed pilots.',
    inclusions: [
      '45 Minutes Extreme Dune Bashing',
      'Experienced DTCM Safari Driver',
      'Red Dunes Photography Stops',
      'chilled Water & Refreshments',
    ],
    anchorVariations: [
      'Dune Bashing Adventure in Dubai',
      'Dune Bashing Adventure Dubai',
      'Extreme Dune Bashing Dubai',
      'High Dunes Drifting Excursion',
      '4x4 Sand Dune Drifting Tour',
    ]
  },
  {
    id: 'red-dunes-safari',
    title: 'Premium Red Dunes Safari',
    url: 'https://roaradventuretourism.com/tour/red-dunes-safari/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/desert-safari-header1.jpg',
    category: 'safari',
    price: 160,
    rating: 4.9,
    reviews: 1020,
    desc: 'Discover Lahbab Red Dunes, famous for their steep heights and red crimson sands. Best for premium sandboarding, dune drifting, and camp stays.',
    inclusions: [
      'Lahbab Red Dunes Excursion',
      'Home/Hotel pickup in SUV',
      'Premium Sandboarding session',
      'Bedouin camp dining & live shows',
    ],
    anchorVariations: [
      'Red Dunes Safari',
      'Premium Red Dunes Safari',
      'Lahbab Red Dunes Desert Safari',
      'Al Lahbab Desert Safari Dubai',
      'Red Sand Dunes Safari Tour',
    ]
  },
  {
    id: 'sunrise-desert-safari',
    title: 'Sunrise Red Dunes Photography',
    url: 'https://roaradventuretourism.com/tour/sunrise-desert-safari-dubai/',
    image: 'https://roaradventuretourism.com/wp-content/uploads/2025/07/gallery-01709121792-sunrise-dese.jpg',
    category: 'safari',
    price: 140,
    rating: 4.7,
    reviews: 150,
    desc: 'Watch the sun rise over the high desert dunes. Perfect for morning photography enthusiasts, camel rides, and fresh Arabian coffee setups.',
    inclusions: [
      'Early Morning Hotel Pickup',
      'Sunrise Stargazing to Dawn',
      'Arabic Coffee & Dates at camp',
      'Gentle Dunes Drive & Photoshoots',
    ],
    anchorVariations: [
      'Sunrise Desert Safari Dubai',
      'Sunrise Desert Safari',
      'Early Morning Sunrise Safari',
      'Sunrise Red Dunes Photography',
      'Sunrise Safari with Camel Ride',
    ]
  }
];
// @@ANCHOR_RANDOMIZER_END@@

// Locations data for doorstep pickup descriptions
const LOCATIONS_DATA = [
  {
    name: 'Dubai Marina & JBR',
    desc: 'Living in Dubai Marina or JBR? Get ready for a Premium Safari Tour Pick/Drop from your Residence/Hotel like Promenade, Time Place Tower, Intercontinental by IHG, Marina Mall, Marsa, Sulafa Tower, Cayan Tower, Crowne Hotel, Hilton The Walk, Rimal 6, Amwaj, Bahar & Murjan, Rixos Premium, Sofitel, Amwaj Rotana, FIVE LUXE JBR, The Ritz-Carlton Dubai, Le Royal Meridien, Ramada, Sheraton, and Habtoor Grand.',
    hotels: ['Atlantis The Palm', 'Rixos Premium JBR', 'Sofitel JBR', 'Cayan Tower', 'Promenade Marina']
  },
  {
    name: 'Bur Dubai & Karama',
    desc: 'doorstep Pickup & Dropoff from Al Karama, Jafiliya, Al Mankhool, Oud Metha, and Bur Dubai. Pickup points include Grand Excelsior, Holiday Inn, Orchid Vue, Novotel, Omega Hotel, Xclusive Maples, Citymax, Al Fahidi, Admiral Plaza, Gateway, Park Regis Kris Kin, Golden Sands 10, Arabian Courtyard, Four Points, and Dolphin Show Creek Hotel.',
    hotels: ['Park Regis Kris Kin', 'Holiday Inn Bur Dubai', 'Citymax Bur Dubai', 'Golden Sands']
  },
  {
    name: 'Deira & Al Rigga',
    desc: 'Book your safari from Deira City Center, Abu Hail, Hor Al Anz, Al Nahda, Al Rigga, Baniyas, Khabaisi, Naif, and Gold Souk. We offer pickups from hotels like Ramada by Wyndham, Hyatt Regency Galleria, Landmark, Ibis, Novotel Gold District, Fortune Pearl, and Boonmax.',
    hotels: ['Deira City Center Hotel', 'Ramada Deira', 'Hyatt Regency Galleria', 'Ibis Deira']
  },
  {
    name: 'Downtown, Business Bay & DWTC',
    desc: 'doorstep Pickup/Dropoff from DWTC, Al Satwa, Zabeel, Al Jafiliya, Jumeirah 1, DIFC, Downtown, Business Bay, Jumeirah, Al Wasl, and Al Mina. Ideal for corporate groups and tourists staying at Downtown luxury hotels.',
    hotels: ['Burj Khalifa area', 'Address Downtown', 'JW Marriott Marquis', 'DIFC Residences']
  },
  {
    name: 'Palm Jumeirah & Jebel Ali',
    desc: 'We offer doorstep Pickup/Dropoff from Palm Jumeirah hotels like Marriott Resort, The View At The Palm, Atlantis The Palm, Atlantis The Royal, East Crescent residences, Anantara Residences, Pullman, and Sofitel. Also covering Discovery Gardens, Jebel Ali, and Dubai Sports City.',
    hotels: ['Atlantis The Royal', 'Atlantis The Palm', 'Anantara Palm Jumeirah', 'Marriott Resort']
  }
];

export default function LandingPageView() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLocationIndex, setActiveLocationIndex] = useState(0);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Monitor scroll for glass header sticky effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsHeaderScrolled(true);
      } else {
        setIsHeaderScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


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
            <span className="lp-logo-text">ROAR ADVENTURE</span>
          </a>

          <ul className="lp-nav-links">
            <li><a href="#about" className="lp-nav-link">About Us</a></li>
            <li><a href="#locations" className="lp-nav-link">Pickup Locations</a></li>
            <li><a href="#process" className="lp-nav-link">Booking Process</a></li>
            <li><a href="#contact" className="lp-nav-link">Contact</a></li>
          </ul>

          <div className="lp-nav-actions">
            <a href="https://wa.me/971589344077" className="lp-btn-contact" target="_blank" rel="noopener noreferrer">
              <Phone size={14} /> <span>+971 58 934 4077</span>
            </a>
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
          <li><a href="#locations" className="lp-mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Pickup Locations</a></li>
          <li><a href="#process" className="lp-mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Booking Process</a></li>
          <li><a href="#contact" className="lp-mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Contact</a></li>
        </ul>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a href="https://wa.me/971589344077" className="lp-btn-secondary" style={{ justifyContent: 'center' }} target="_blank" rel="noopener noreferrer">
            <Phone size={14} /> WhatsApp Inquiry
          </a>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="lp-hero">
        <div className="lp-hero-bg" style={{ backgroundImage: 'url(https://roaradventuretourism.com/wp-content/uploads/2025/07/Untitled-design-7.png)' }}></div>
        <div className="lp-hero-content lp-container">
          <span className="lp-hero-tagline">
            <Sparkles size={14} /> DET & DTCM Approved Safari Operator
          </span>
          <h1 className="lp-hero-title">
            VIP Desert Safari Dubai <br />
            <span>Best Safari Deals & Packages 2026</span>
          </h1>
          <p className="lp-hero-desc">
            Experience premium Desert Safaris in Lehbab Red Dunes & Al Awir Desert. Trusted by tourists from the USA, UK, Germany, France, Italy, and beyond. Book directly with Roar Adventure Tourism LLC for best rates and licensed quality.
          </p>

          <div className="lp-hero-badges">
            <div className="lp-hero-badge-item">
              <CheckCircle size={16} className="lp-hero-badge-icon" />
              <span>DET & DTCM Licensed</span>
            </div>
            <div className="lp-hero-badge-item">
              <CheckCircle size={16} className="lp-hero-badge-icon" />
              <span>Instant Confirmation</span>
            </div>
            <div className="lp-hero-badge-item">
              <CheckCircle size={16} className="lp-hero-badge-icon" />
              <span>Book Now Pay Later</span>
            </div>
            <div className="lp-hero-badge-item">
              <CheckCircle size={16} className="lp-hero-badge-icon" />
              <span>FREE Cancellation</span>
            </div>
          </div>

          <div className="lp-hero-btns">
            <a href="https://wa.me/971589344077" target="_blank" rel="noopener noreferrer" className="lp-btn-primary lp-btn-pulse">
              WhatsApp Inquiry <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* MAIN SAFARI PACKAGES EXPLORER (WITH ALL 26 TOURS) */}
      <section id="packages" className="lp-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-subtitle">Dubai Adventure Packages</span>
            <h2 className="lp-section-title">VIP Desert Safari Prices & Timings</h2>
            <p className="lp-section-desc">
              Choose from shared, private, or luxury tours. VIP prices start from 149aed/person with doorstep pickup & dropoff from hotels, apartments, and villas across Dubai and Sharjah.
            </p>
          </div>

          {/* Search and Tabs Filter Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', marginBottom: '40px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '460px' }}>
              <input 
                type="text" 
                placeholder="Search packages (e.g. Can-Am, BBQ, VIP, Sunrise...)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 18px 12px 42px',
                  borderRadius: '25px',
                  border: '1.5px solid var(--lp-border)',
                  background: 'var(--lp-bg-white)',
                  color: 'var(--lp-text-body)',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxShadow: 'var(--lp-card-shadow)',
                  transition: 'border-color 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--lp-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--lp-border)'}
              />
              <Search size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--lp-text-muted)' }} />
            </div>

            <div className="lp-packages-tabs">
              <button className={`lp-packages-tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Packages</button>
              <button className={`lp-packages-tab-btn ${activeTab === 'safari' ? 'active' : ''}`} onClick={() => setActiveTab('safari')}>Desert Safaris</button>
              <button className={`lp-packages-tab-btn ${activeTab === 'buggy' ? 'active' : ''}`} onClick={() => setActiveTab('buggy')}>Dune Buggy & ATVs</button>
              <button className={`lp-packages-tab-btn ${activeTab === 'city' ? 'active' : ''}`} onClick={() => setActiveTab('city')}>City Excursions</button>
              <button className={`lp-packages-tab-btn ${activeTab === 'cruise' ? 'active' : ''}`} onClick={() => setActiveTab('cruise')}>Yacht Cruises & Sky</button>
            </div>
          </div>

          {/* Grid of Redesigned Packages */}
          <div className="lp-packages-grid">
            {filteredTours.map((tour) => (
              <article key={tour.id} className="lp-package-card">
                <span className="lp-package-badge">{tour.category === 'safari' ? 'Safari Deal' : tour.category === 'buggy' ? 'Offroad ATV' : tour.category === 'city' ? 'Sightseeing' : 'Cruising'}</span>
                <h3 className="lp-package-title">{tour.title}</h3>
                
                <div className="lp-package-meta">
                  <div className="lp-package-meta-item">
                    <Star size={14} fill="var(--lp-accent)" className="lp-package-meta-icon" />
                    <strong>{tour.rating}</strong>
                    <span>({tour.reviews} reviews)</span>
                  </div>
                  <div className="lp-package-meta-item">
                    <Compass size={14} className="lp-package-meta-icon" />
                    <span>2026 Timings</span>
                  </div>
                </div>

                <p style={{ fontSize: '13.5px', color: 'var(--lp-text-body)', marginBottom: '16px', lineHeight: '1.4' }}>
                  {tour.desc}
                </p>

                {tour.inclusions && (
                  <ul className="lp-package-features-list">
                    {tour.inclusions.slice(0, 5).map((inc, index) => (
                      <li key={index} className="lp-package-feature-item">
                        <CheckCircle size={14} className="lp-package-feature-check" />
                        <span>{inc}</span>
                      </li>
                    ))}
                    {tour.inclusions.length > 5 && (
                      <li className="lp-package-feature-item" style={{ color: 'var(--lp-primary)', fontWeight: '600', fontStyle: 'italic' }}>
                        + {tour.inclusions.length - 5} more inclusions
                      </li>
                    )}
                  </ul>
                )}

                <div className="lp-package-footer">
                  <div className="lp-package-price-wrap">
                    <span className="lp-package-price-label">Price Start</span>
                    <div className="lp-package-price-value">{tour.price} <span>AED</span></div>
                  </div>
                  <a 
                    href={tour.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="lp-btn-primary"
                    style={{ padding: '8px 16px', fontSize: '12px' }}
                    title={`Go to live details for ${tour.title}`}
                  >
                    View Details
                  </a>
                </div>
              </article>
            ))}
          </div>

          {filteredTours.length === 0 && (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--lp-text-muted)' }}>
              <Compass size={32} style={{ marginBottom: '12px', color: 'var(--lp-primary)' }} />
              <p>No safari deals found. Try a different search filter.</p>
            </div>
          )}
        </div>
      </section>

      {/* WHY CHOOSE ROAR SECTION */}
      <section id="why-us" className="lp-section alt-bg">
        <div className="lp-container lp-why-container">
          <div className="lp-why-text-col">
            <span className="lp-section-subtitle">Trusted Safari Operator</span>
            <h2 className="lp-section-title">Best Desert Safari Company in Dubai</h2>
            <p className="lp-hero-desc" style={{ marginBottom: '24px' }}>
              Roar Adventure Tourism LLC stands out with over 80,000 satisfied customers and 1500+ five-star reviews on Google, TripAdvisor, and major travel booking channels. We operate our own fleet of Land Cruisers and quad bikes directly.
            </p>
            <div className="lp-why-stats">
              <div className="lp-why-stat-item">
                <span className="lp-why-stat-num">80k+</span>
                <span className="lp-why-stat-label">Happy Guests</span>
              </div>
              <div className="lp-why-stat-item">
                <span className="lp-why-stat-num">1500+</span>
                <span className="lp-why-stat-label">5★ Reviews</span>
              </div>
              <div className="lp-why-stat-item">
                <span className="lp-why-stat-num">100%</span>
                <span className="lp-why-stat-label">DTCM Approved</span>
              </div>
            </div>
          </div>

          <div className="lp-why-card-grid">
            <div className="lp-why-feature-card">
              <div className="lp-why-icon-wrap"><Award /></div>
              <h3 className="lp-why-card-title">Best Rates Guarantee</h3>
              <p className="lp-why-card-desc">Direct operator bookings ensure you bypass agency commissions and get local wholesale rates.</p>
            </div>
            <div className="lp-why-feature-card">
              <div className="lp-why-icon-wrap"><Shield /></div>
              <h3 className="lp-why-card-title">Book Now Pay Later</h3>
              <p className="lp-why-card-desc">No upfront credit card deposit needed for standard tours. Secure reservations instantly.</p>
            </div>
            <div className="lp-why-feature-card">
              <div className="lp-why-icon-wrap"><Clock /></div>
              <h3 className="lp-why-card-title">24/7 Live Support</h3>
              <p className="lp-why-card-desc">Direct lines to tour supervisors on WhatsApp for instant timing customisations.</p>
            </div>
            <div className="lp-why-feature-card">
              <div className="lp-why-icon-wrap"><Sparkles /></div>
              <h3 className="lp-why-card-title">Customizable Tours</h3>
              <p className="lp-why-card-desc">Easily add camel rides, quad biking, private seating upgrades, or skip dune bashing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE DOORSTEP PICKUP LOCATIONS PANEL */}
      <section id="locations" className="lp-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-subtitle">Convenient Pickups</span>
            <h2 className="lp-section-title">Doorstep Pick/Drop Locations</h2>
            <p className="lp-section-desc">
              We offer doorstep pickups in comfortable 4x4 Land Cruisers or modern vehicles across all major neighborhoods in Dubai and Sharjah. Click on a zone below to see detailed pickup options.
            </p>
          </div>

          <div className="lp-locations-grid">
            {LOCATIONS_DATA.map((loc, idx) => (
              <div 
                key={idx} 
                className={`lp-location-card ${activeLocationIndex === idx ? 'active' : ''}`}
                onClick={() => setActiveLocationIndex(idx)}
              >
                <MapPin size={18} className="lp-package-meta-icon" style={{ margin: '0 auto 8px auto' }} />
                <div className="lp-location-name">{loc.name}</div>
              </div>
            ))}
          </div>

          <div className="lp-locations-details-panel">
            <h3 className="lp-location-details-title">Pickup details for {LOCATIONS_DATA[activeLocationIndex].name}</h3>
            <p className="lp-location-details-text" style={{ marginBottom: '20px' }}>
              {LOCATIONS_DATA[activeLocationIndex].desc}
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <strong style={{ fontSize: '13px', color: 'var(--lp-text-title)' }}>Key Pick-up Hotels covered:</strong>
              {LOCATIONS_DATA[activeLocationIndex].hotels.map((h, i) => (
                <span key={i} style={{ background: 'var(--lp-bg-sand)', border: '1px solid var(--lp-border)', padding: '4px 10px', borderRadius: '15px', fontSize: '12px' }}>
                  {h}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TARGET AUDIENCE AUDIENCE SEGMENT DEALS */}
      <section className="lp-section alt-bg">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-subtitle">Tailored Desert Safaris</span>
            <h2 className="lp-section-title">Special Packages for Every Traveler</h2>
            <p className="lp-section-desc">
              Whether you are traveling solo, planning a family trip with toddlers, celebrating an anniversary, or organizing corporate outings, we customize our camps to support your needs.
            </p>
          </div>

          <div className="lp-why-card-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="lp-why-feature-card">
              <h3 className="lp-why-card-title" style={{ fontSize: '18px', color: 'var(--lp-primary)', marginBottom: '10px' }}>Family & Toddler Safaris</h3>
              <p className="lp-why-card-desc" style={{ fontSize: '13.5px' }}>
                Skips aggressive dune bashing. Direct camp transfers allow young children (ages 1-8) and mothers to enjoy camel rides and shows safely.
              </p>
            </div>
            <div className="lp-why-feature-card">
              <h3 className="lp-why-card-title" style={{ fontSize: '18px', color: 'var(--lp-primary)', marginBottom: '10px' }}>Romantic Safari for Couples</h3>
              <p className="lp-why-card-desc" style={{ fontSize: '13.5px' }}>
                Honeymooners, birthday, or anniversary setups. Premium seating space, personalized sunset tables, and gourmet grills.
              </p>
            </div>
            <div className="lp-why-feature-card">
              <h3 className="lp-why-card-title" style={{ fontSize: '18px', color: 'var(--lp-primary)', marginBottom: '10px' }}>Gentle / Senior Citizens Safari</h3>
              <p className="lp-why-card-desc" style={{ fontSize: '13.5px' }}>
                Designed for pregnant women, people with back pain or heart health concerns. Gentle drives straight to campgrounds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STEPS TO BOOK CORNER */}
      <section id="process" className="lp-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-subtitle">How It Works</span>
            <h2 className="lp-section-title">Our Easy 4-Step Booking Process</h2>
            <p className="lp-section-desc">
              Secure your desert tour in less than 2 minutes. No advance credit card details required for standard packages.
            </p>
          </div>

          <div className="lp-process-flow">
            <div className="lp-process-step">
              <span className="lp-process-num">1</span>
              <div className="lp-process-icon"><Compass size={20} /></div>
              <h3 className="lp-process-title">Choose Package</h3>
              <p className="lp-process-desc">Select from Standard, VIP, Premium, or Private Desert Safari deals.</p>
            </div>
            <div className="lp-process-step">
              <span className="lp-process-num">2</span>
              <div className="lp-process-icon"><Phone size={20} /></div>
              <h3 className="lp-process-title">WhatsApp Inquiry</h3>
              <p className="lp-process-desc">Send WhatsApp with your guest count, selected package, and hotel pickup location.</p>
            </div>
            <div className="lp-process-step">
              <span className="lp-process-num">3</span>
              <div className="lp-process-icon"><ThumbsUp size={20} /></div>
              <h3 className="lp-process-title">Confirm Booking</h3>
              <p className="lp-process-desc">Receive instant e-booking confirmation. Free cancellations up to 24 hours.</p>
            </div>
            <div className="lp-process-step">
              <span className="lp-process-num">4</span>
              <div className="lp-process-icon"><CheckCircle size={20} /></div>
              <h3 className="lp-process-title">Enjoy Tour</h3>
              <p className="lp-process-desc">Our Land Cruiser driver picks you up from your doorstep. Pay cash/card on arrival.</p>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK INQUIRY CALL ACTION BOX */}
      <section id="contact" className="lp-section alt-bg">
        <div className="lp-container">
          <div className="lp-cta-box">
            <span className="lp-cta-subtitle">Instantly Confirm Your Tour</span>
            <h2 className="lp-cta-title">Don’t miss out on premium desert safari adventure experiences</h2>
            <p className="lp-cta-desc">
              Talk directly to our desert supervisors to customize your timing, request private tables, or query quad bike availability. 
            </p>
            <div className="lp-hero-btns">
              <a href="https://wa.me/971589344077" className="lp-btn-primary lp-btn-pulse" target="_blank" rel="noopener noreferrer" style={{ padding: '14px 32px' }}>
                WhatsApp Call +971 58 934 4077
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER DIRECTORY OF ALL 26 TOURS */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-info">
              <span className="lp-logo-text" style={{ fontSize: '22px' }}>ROAR ADVENTURE</span>
              <p className="lp-footer-desc">
                Roar Adventure Tourism LLC is a premier licensed tour operator based in Dubai, UAE, specializing in VIP desert safaris, high-power Can-Am buggies, and luxurious creek and yacht cruise dinning.
              </p>
              <div className="lp-footer-socials">
                <a href="#" className="lp-social-btn"><Heart size={14} /></a>
                <a href="#" className="lp-social-btn"><Compass size={14} /></a>
                <a href="#" className="lp-social-btn"><Star size={14} fill="currentColor" /></a>
              </div>
            </div>

            <div>
              <h3 className="lp-footer-col-title">Navigation Links</h3>
              <ul className="lp-footer-links">
                <li><a href="#about" className="lp-footer-link"><ChevronRight size={10} /> About Us</a></li>
                <li><a href="#packages" className="lp-footer-link"><ChevronRight size={10} /> Packages & Prices</a></li>
                <li><a href="#locations" className="lp-footer-link"><ChevronRight size={10} /> doorStep Pickups</a></li>
                <li><a href="#process" className="lp-footer-link"><ChevronRight size={10} /> Stepped Guide</a></li>
              </ul>
            </div>

            <div>
              <h3 className="lp-footer-col-title">Key Areas covered</h3>
              <ul className="lp-footer-links">
                <li><a href="#locations" className="lp-footer-link"><ChevronRight size={10} /> Dubai Marina & JBR</a></li>
                <li><a href="#locations" className="lp-footer-link"><ChevronRight size={10} /> Bur Dubai & Karama</a></li>
                <li><a href="#locations" className="lp-footer-link"><ChevronRight size={10} /> Deira & Al Rigga</a></li>
                <li><a href="#locations" className="lp-footer-link"><ChevronRight size={10} /> Downtown & DWTC</a></li>
              </ul>
            </div>

            <div className="lp-footer-contact">
              <h3 className="lp-footer-col-title">Licensed Office</h3>
              <div className="lp-footer-contact-item">
                <MapPin className="lp-footer-contact-icon" />
                <span>Dubai World Trade Centre (DWTC), Sheikh Zayed Rd, Dubai, UAE</span>
              </div>
              <div className="lp-footer-contact-item">
                <Phone className="lp-footer-contact-icon" />
                <span>+971589344077 (Office)</span>
              </div>
              <div className="lp-footer-contact-item">
                <Compass className="lp-footer-contact-icon" />
                <span>info@roaradventuretourism.com</span>
              </div>
            </div>
          </div>

          {/* SITEMAP LINK INTEGRATION SECTION */}
          <div className="lp-footer-directory">
            <h4 className="lp-directory-title">Roar Adventure Tourism LLC - Sitemap Tour Index</h4>
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
            <p>&copy; {new Date().getFullYear()} Roar Adventure Tourism LLC. Approved by Dubai Department of Economy and Tourism (DET). All rights reserved.</p>
            <p style={{ display: 'flex', gap: '16px' }}>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms & Conditions</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
