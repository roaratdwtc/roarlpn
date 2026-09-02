import { initialBookings } from './initialBookingsData';

export { initialBookings };

export const safariPackages = [
  // Morning Desert Safari
  { id: 'morning_shared', name: 'Morning Safari 149AED', rate: 149, type: 'per_person', category: 'Morning Desert Safari' },
  { id: 'morning_quadbike', name: 'Morning+Quadbike 249AED', rate: 249, type: 'per_person', category: 'Morning Desert Safari' },
  { id: 'morning_private', name: 'Private Morning 499AED', rate: 499, type: 'flat', category: 'Morning Desert Safari', description: 'for 2-6 people' },

  // Evening Desert Safari
  { id: 'evening_standard', name: 'Evening Safari 79AED', rate: 79, type: 'per_person', category: 'Evening Desert Safari' },
  { id: 'evening_vip', name: 'VIP Safari Shared 129AED', rate: 129, type: 'per_person', category: 'Evening Desert Safari' },
  { id: 'evening_private_vip', name: 'VIP Safari Private Car 799AED', rate: 799, type: 'flat', category: 'Evening Desert Safari', description: 'for 2-6 people/car' },
  { id: 'evening_premium_quad', name: 'Evening+Quadbike 199AED', rate: 199, type: 'per_person', category: 'Evening Desert Safari' },

  // Self Drive Safari
  { id: 'self_drive', name: 'Self Drive 35AED', rate: 35, type: 'per_person', category: 'Self Drive Safari' },
  { id: 'self_drive_vip', name: 'VIP Self Drive 65AED', rate: 65, type: 'per_person', category: 'Self Drive Safari' },
  { id: 'self_drive_quad', name: 'Self Drive+Quadbike 149AED', rate: 149, type: 'per_person', category: 'Self Drive Safari' },

  // City Tours & Hatta
  { id: 'tour_dubai_private', name: 'Private Dubai Tour 499AED', rate: 499, type: 'flat', category: 'City Tours', description: 'for 2-6 people/car' },
  { id: 'tour_abu_dhabi_private', name: 'Private Abu Dhabi Tour 599AED', rate: 599, type: 'flat', category: 'City Tours', description: 'for 2-6 people/car' },
  { id: 'tour_hatta_private', name: 'Private Hatta Tour 499AED', rate: 499, type: 'flat', category: 'City Tours', description: 'for 2-6 people/car' },
  { id: 'tour_dubai_halfday_private', name: 'Half Day Private Dubai City Tour 300AED', rate: 300, type: 'flat', category: 'City Tours', description: 'for 2-6 people/car' },

  // Dune Buggy Ride
  { id: 'buggy_2_seater', name: '2 Seater Buggy 699AED', rate: 699, type: 'flat', category: 'Dune Buggy Ride', description: 'for 2 pax' },
  { id: 'buggy_4_seater', name: '4 Seater Buggy 999AED', rate: 999, type: 'flat', category: 'Dune Buggy Ride', description: 'for 4 pax' }
];

export const initialPackages = [
  // Morning Desert Safari
  { id: 'morning_shared', name: 'Morning Safari 149AED', rate: 149, peakRate: 149, offpeakRate: 149, type: 'per_person', category: 'Morning Desert Safari', campUse: 0, quadbikeExpense: 0, addons: [
    { name: "Long Camel Ride", price: 30 },
    { name: "Falcon Photography", price: 20 },
    { name: "Sheesha on Table", price: 50 },
    { name: "Professional Photos", price: 20 }
  ] },
  { id: 'morning_quadbike', name: 'Morning+Quadbike 249AED', rate: 249, peakRate: 249, offpeakRate: 249, type: 'per_person', category: 'Morning Desert Safari', campUse: 0, quadbikeExpense: 50, addons: [
    { name: "Long Camel Ride", price: 30 },
    { name: "Falcon Photography", price: 20 },
    { name: "Sheesha on Table", price: 50 },
    { name: "Professional Photos", price: 20 }
  ] },
  { id: 'morning_private', name: 'Private Morning 499AED', rate: 499, peakRate: 599, offpeakRate: 499, type: 'flat', category: 'Morning Desert Safari', description: 'for 2-6 people', campUse: 0, quadbikeExpense: 0, addons: [
    { name: "Long Camel Ride", price: 30 },
    { name: "Falcon Photography", price: 20 },
    { name: "Sheesha on Table", price: 50 },
    { name: "Professional Photos", price: 20 }
  ] },

  // Evening Desert Safari
  { id: 'evening_standard', name: 'Evening Safari 79AED', rate: 79, peakRate: 99, offpeakRate: 79, type: 'per_person', category: 'Evening Desert Safari', campUse: 20, quadbikeExpense: 0, addons: [
    { name: "Long Camel Ride", price: 30 },
    { name: "Falcon Photography", price: 20 },
    { name: "AC Seating Upgrade", price: 25 },
    { name: "Sheesha on Table", price: 50 },
    { name: "Professional Photos", price: 20 }
  ] },
  { id: 'evening_vip', name: 'VIP Safari Shared 129AED', rate: 129, peakRate: 149, offpeakRate: 129, type: 'per_person', category: 'Evening Desert Safari', campUse: 40, quadbikeExpense: 0, addons: [
    { name: "Long Camel Ride", price: 30 },
    { name: "Falcon Photography", price: 20 },
    { name: "AC Seating Upgrade", price: 25 },
    { name: "Sheesha on Table", price: 50 },
    { name: "Professional Photos", price: 20 }
  ] },
  { id: 'evening_private_vip', name: 'VIP Safari Private Car 799AED', rate: 799, peakRate: 999, offpeakRate: 799, type: 'flat', category: 'Evening Desert Safari', description: 'for 2-6 people/car', campUse: 40, quadbikeExpense: 0, addons: [
    { name: "Long Camel Ride", price: 30 },
    { name: "Falcon Photography", price: 20 },
    { name: "AC Seating Upgrade", price: 25 },
    { name: "Sheesha on Table", price: 50 },
    { name: "Professional Photos", price: 20 }
  ] },
  { id: 'evening_premium_quad', name: 'Evening+Quadbike 199AED', rate: 199, peakRate: 259, offpeakRate: 199, type: 'per_person', category: 'Evening Desert Safari', campUse: 40, quadbikeExpense: 50, addons: [
    { name: "Long Camel Ride", price: 30 },
    { name: "Falcon Photography", price: 20 },
    { name: "AC Seating Upgrade", price: 25 },
    { name: "Sheesha on Table", price: 50 },
    { name: "Professional Photos", price: 20 }
  ] },

  // Self Drive Safari
  { id: 'self_drive', name: 'Self Drive 35AED', rate: 35, peakRate: 35, offpeakRate: 35, type: 'per_person', category: 'Self Drive Safari', campUse: 0, quadbikeExpense: 0, addons: [
    { name: "Long Camel Ride", price: 30 },
    { name: "Falcon Photography", price: 20 },
    { name: "AC Seating Upgrade", price: 25 },
    { name: "Sheesha on Table", price: 50 },
    { name: "Professional Photos", price: 20 }
  ] },
  { id: 'self_drive_vip', name: 'VIP Self Drive 65AED', rate: 65, peakRate: 65, offpeakRate: 65, type: 'per_person', category: 'Self Drive Safari', campUse: 0, quadbikeExpense: 0, addons: [
    { name: "Long Camel Ride", price: 30 },
    { name: "Falcon Photography", price: 20 },
    { name: "AC Seating Upgrade", price: 25 },
    { name: "Sheesha on Table", price: 50 },
    { name: "Professional Photos", price: 20 }
  ] },
  { id: 'self_drive_quad', name: 'Self Drive+Quadbike 149AED', rate: 149, peakRate: 149, offpeakRate: 149, type: 'per_person', category: 'Self Drive Safari', campUse: 0, quadbikeExpense: 50, addons: [
    { name: "Long Camel Ride", price: 30 },
    { name: "Falcon Photography", price: 20 },
    { name: "AC Seating Upgrade", price: 25 },
    { name: "Sheesha on Table", price: 50 },
    { name: "Professional Photos", price: 20 }
  ] },

  // City Tours & Hatta
  { id: 'tour_dubai_private', name: 'Private Dubai Tour 499AED', rate: 499, peakRate: 499, offpeakRate: 499, type: 'flat', category: 'City Tours', description: 'for 2-6 people/car', campUse: 0, quadbikeExpense: 0, addons: [] },
  { id: 'tour_abu_dhabi_private', name: 'Private Abu Dhabi Tour 599AED', rate: 599, peakRate: 599, offpeakRate: 599, type: 'flat', category: 'City Tours', description: 'for 2-6 people/car', campUse: 0, quadbikeExpense: 0, addons: [] },
  { id: 'tour_hatta_private', name: 'Private Hatta Tour 499AED', rate: 499, peakRate: 499, offpeakRate: 499, type: 'flat', category: 'City Tours', description: 'for 2-6 people/car', campUse: 0, quadbikeExpense: 0, addons: [] },
  { id: 'tour_hatta_private_evening', name: 'Private evening Hatta Tour 799AED', rate: 799, peakRate: 999, offpeakRate: 799, type: 'flat', category: 'City Tours', description: 'for 2-6 people/car', campUse: 40, quadbikeExpense: 0, addons: [] },
  { id: 'tour_dubai_halfday_private', name: 'Half Day Private Dubai City Tour 300AED', rate: 300, peakRate: 300, offpeakRate: 300, type: 'flat', category: 'City Tours', description: 'for 2-6 people/car', campUse: 0, quadbikeExpense: 0, addons: [] },

  // Dune Buggy Ride
  { id: 'buggy_2_seater', name: '2 Seater Buggy 699AED', rate: 699, peakRate: 699, offpeakRate: 699, type: 'flat', category: 'Dune Buggy Ride', description: 'for 2 pax', campUse: 0, quadbikeExpense: 0, addons: [] },
  { id: 'buggy_4_seater', name: '4 Seater Buggy 999AED', rate: 999, peakRate: 999, offpeakRate: 999, type: 'flat', category: 'Dune Buggy Ride', description: 'for 4 pax', campUse: 0, quadbikeExpense: 0, addons: [] }
];

export const initialCoupons = [
  { id: 'coupon-1', code: 'RoarNYOfferDxb', packageId: 'all_safari', customPrice: 0, isActive: 1, startDate: '', endDate: '' },
  { id: 'coupon-2', code: 'RoarSummerOffer26', packageId: 'all_safari', customPrice: 0, isActive: 1, startDate: '2026-05-01', endDate: '2026-10-31' }
];

export const initialPartners = [
  { id: 'website', name: 'Website', commissionRate: 0, address: 'Online Direct Booking', contactPerson: 'Web Admin', whatsapp: '+971556054570', email: 'bookings@roaradventuretourism.com', packages: {} }
];

export const initialDrivers = [
  { id: 'driver-adnan', name: 'Mr Adnan', whatsapp: '+971586860301', carPlate: 'FF79157', regDate: '2026-07-02', defaultSalary: 100, defaultFuel: 150 },
  { id: 'driver-afzal', name: 'Mr Afzal', whatsapp: '+971563936028', carPlate: 'DD21596', regDate: '2026-07-02', defaultSalary: 100, defaultFuel: 150 },
  { id: 'driver-abbasi', name: 'Mr Abbasi', whatsapp: '+971556054570', carPlate: 'G25801', regDate: '2026-07-02', defaultSalary: 100, defaultFuel: 150 },
  { id: 'driver-shahid', name: 'Mr Shahid', whatsapp: '+971567576977', carPlate: 'D16197', regDate: '2026-07-02', defaultSalary: 100, defaultFuel: 150 },
  { id: 'driver-ibadat', name: 'Mr Ibadat', whatsapp: '+971545278478', carPlate: 'I49209', regDate: '2026-07-02', defaultSalary: 100, defaultFuel: 150 },
  { id: 'driver-shahmir', name: 'Mr Shahmir', whatsapp: '+971559210545', carPlate: 'BB23370', regDate: '2026-07-02', defaultSalary: 100, defaultFuel: 150 },
  { id: 'driver-bangash', name: 'Mr Bangash', whatsapp: '+971547042682', carPlate: 'DD50781', regDate: '2026-07-02', defaultSalary: 100, defaultFuel: 150 }
];

export const initialExpenses = [];

export const initialCars = [
  {
    "id": "car-p14286",
    "plateNo": "P14286",
    "bank": "No Bank",
    "brand": "Volkswagen",
    "model": "2020",
    "owner": "Nawaz Iduki",
    "installment": 0,
    "deferment": "No Bank",
    "instDate": 0,
    "currentValue": 10000,
    "ledger": []
  },
  {
    "id": "car-w20776",
    "plateNo": "W20776",
    "bank": "No Bank",
    "brand": "Honda Odyssey",
    "model": "2012",
    "owner": "Asad",
    "installment": 0,
    "deferment": "No Bank",
    "instDate": 0,
    "currentValue": 15000,
    "ledger": [
      {
        "id": "row-w20776-1",
        "month": "May",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-w20776-2",
        "month": "June",
        "salik": 0,
        "fine": 0,
        "others": 8,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-w20776-3",
        "month": "July",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-w20776-4",
        "month": "August",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-w20776-5",
        "month": "September",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-w20776-6",
        "month": "October",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-w20776-7",
        "month": "November",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-w20776-8",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-w20776-9",
        "month": "January",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-w20776-10",
        "month": "February",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-w20776-11",
        "month": "March",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-w20776-12",
        "month": "April",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-w20776-13",
        "month": "May",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-w20776-14",
        "month": "June",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-w20776-15",
        "month": "July",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-w20776-16",
        "month": "August",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-w20776-17",
        "month": "September",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-w20776-18",
        "month": "October",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-w20776-19",
        "month": "November",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-w20776-20",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      }
    ],
    "regDate": "25-09-2023",
    "expDate": "27-11-2026",
    "insCompany": "Adamjee Insurance",
    "policyNo": "2510131105",
    "insExp": "27-12-2026",
    "color": "Maroon",
    "chassisNo": "5FNRL5H68CB136600",
    "engineNo": "NILL",
    "passengers": 8
  },
  {
    "id": "car-z53732",
    "plateNo": "Z53732",
    "bank": "No Bank",
    "brand": "Land Cruiser",
    "model": "2019",
    "owner": "Asad",
    "installment": 0,
    "deferment": "No Bank",
    "instDate": 0,
    "currentValue": 15000,
    "ledger": [
      {
        "id": "row-z53732-1",
        "month": "May",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z53732-2",
        "month": "June",
        "salik": 0,
        "fine": 0,
        "others": 8,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z53732-3",
        "month": "July",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z53732-4",
        "month": "August",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z53732-5",
        "month": "September",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z53732-6",
        "month": "October",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z53732-7",
        "month": "November",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z53732-8",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z53732-9",
        "month": "January",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z53732-10",
        "month": "February",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z53732-11",
        "month": "March",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z53732-12",
        "month": "April",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z53732-13",
        "month": "May",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z53732-14",
        "month": "June",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z53732-15",
        "month": "July",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z53732-16",
        "month": "August",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z53732-17",
        "month": "September",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z53732-18",
        "month": "October",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z53732-19",
        "month": "November",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z53732-20",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      }
    ],
    "regDate": "06-06-2023",
    "expDate": "18-02-2027",
    "insCompany": "Orient Insurance (General Takaful)",
    "policyNo": "01/1354148",
    "insExp": "18-03-2027",
    "color": "White/Pearl",
    "chassisNo": "JTMHU01J1K4181796",
    "engineNo": "1GRB965831",
    "passengers": 8
  },
  {
    "id": "car-s24929",
    "plateNo": "S24929",
    "bank": "Emirates NBD",
    "brand": "Land Cruiser",
    "model": "2024",
    "owner": "Jaspreen",
    "installment": 4263,
    "deferment": "May+June",
    "instDate": 15,
    "currentValue": 220000,
    "ledger": [
      {
        "id": "row-s24929-1",
        "month": "October",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4600,
        "received": 4600,
        "note": ""
      },
      {
        "id": "row-s24929-2",
        "month": "November",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4600,
        "received": 4600,
        "note": ""
      },
      {
        "id": "row-s24929-3",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4600,
        "received": 4600,
        "note": ""
      },
      {
        "id": "row-s24929-4",
        "month": "January",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4600,
        "received": 4600,
        "note": ""
      },
      {
        "id": "row-s24929-5",
        "month": "February",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4600,
        "received": 4600,
        "note": ""
      },
      {
        "id": "row-s24929-6",
        "month": "March",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4600,
        "received": 4600,
        "note": ""
      },
      {
        "id": "row-s24929-7",
        "month": "April",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4600,
        "received": 4600,
        "note": ""
      },
      {
        "id": "row-s24929-8",
        "month": "May",
        "salik": 386,
        "fine": 0,
        "others": 1000,
        "installment": 0,
        "received": 0,
        "note": "May Deferment"
      },
      {
        "id": "row-s24929-9",
        "month": "June",
        "salik": 216,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": "June Deferment"
      }
    ],
    "regDate": "26-09-2025",
    "expDate": "24-09-2026",
    "insCompany": "Orient Insurance",
    "policyNo": "40/1056800",
    "insExp": "24-10-2026",
    "color": "White/Pearl",
    "chassisNo": "JTMAUCBJ3R4074082",
    "engineNo": "C957921",
    "passengers": 7
  },
  {
    "id": "car-d16197",
    "plateNo": "D16197",
    "bank": "Emirates Islamic",
    "brand": "Land Cruiser",
    "model": "2025",
    "owner": "Roar",
    "installment": 5200,
    "deferment": "June+July",
    "instDate": 15,
    "currentValue": 250000,
    "ledger": [],
    "regDate": "12-03-2026",
    "expDate": "10-03-2027",
    "insCompany": "Orient Insurance (General Takaful)",
    "policyNo": "40/1062365",
    "insExp": "10-04-2027",
    "color": "White",
    "chassisNo": "JTMAUCBJ0S4090827",
    "engineNo": "C992564",
    "passengers": 7
  },
  {
    "id": "car-dd26694",
    "plateNo": "DD26694",
    "bank": "Emirates Islamic",
    "brand": "Nissan Patrol",
    "model": "2023",
    "owner": "M. Aslam",
    "installment": 3760,
    "deferment": "May+June",
    "instDate": 20,
    "currentValue": 150000,
    "ledger": [
      {
        "id": "row-dd26694-1",
        "month": "October",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3770,
        "received": 3770,
        "note": ""
      },
      {
        "id": "row-dd26694-2",
        "month": "November",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3770,
        "received": 3770,
        "note": ""
      },
      {
        "id": "row-dd26694-3",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3770,
        "received": 3770,
        "note": ""
      },
      {
        "id": "row-dd26694-4",
        "month": "January",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3770,
        "received": 3770,
        "note": "48aed to Mr Imtiaz for salik from may to june"
      },
      {
        "id": "row-dd26694-5",
        "month": "February",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3770,
        "received": 3770,
        "note": ""
      },
      {
        "id": "row-dd26694-6",
        "month": "March",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3770,
        "received": 3770,
        "note": "M. Aslam +971547535622"
      },
      {
        "id": "row-dd26694-7",
        "month": "April",
        "salik": 80,
        "fine": 0,
        "others": 5815,
        "installment": 3770,
        "received": 0,
        "note": "Hemayat closing balance"
      },
      {
        "id": "row-dd26694-8",
        "month": "May",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3770,
        "received": 3770,
        "note": "MAY DEFERMENT"
      },
      {
        "id": "row-dd26694-9",
        "month": "June",
        "salik": 0,
        "fine": 0,
        "others": 15000,
        "installment": 3770,
        "received": 3770,
        "note": "JUNE DEFERMENT"
      }
    ],
    "regDate": "12-09-2025",
    "expDate": "10-09-2026",
    "insCompany": "Orient Insurance",
    "policyNo": "01/1310518",
    "insExp": "10-10-2026",
    "color": "White",
    "chassisNo": "JN8BY2NYXP9417115",
    "engineNo": "VQ40937956B",
    "passengers": 8
  },
  {
    "id": "car-g25801",
    "plateNo": "G25801",
    "bank": "Emirates Islamic",
    "brand": "Land Cruiser",
    "model": "2021",
    "owner": "Roar",
    "installment": 4518,
    "deferment": "April+May",
    "instDate": 20,
    "currentValue": 160000,
    "ledger": [
      {
        "id": "row-g25801-1",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4518,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-g25801-2",
        "month": "January",
        "salik": 0,
        "fine": 0,
        "others": 8,
        "installment": 4518,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-g25801-3",
        "month": "February",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4518,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-g25801-4",
        "month": "March",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4518,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-g25801-5",
        "month": "April",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4518,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-g25801-6",
        "month": "May",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4518,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-g25801-7",
        "month": "June",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4518,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-g25801-8",
        "month": "July",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4518,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-g25801-9",
        "month": "August",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4518,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-g25801-10",
        "month": "September",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4518,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-g25801-11",
        "month": "October",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4518,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-g25801-12",
        "month": "November",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4518,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-g25801-13",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4518,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-g25801-14",
        "month": "January",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4518,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-g25801-15",
        "month": "February",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4518,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-g25801-16",
        "month": "March",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4518,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-g25801-17",
        "month": "April",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4518,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-g25801-18",
        "month": "May",
        "salik": 0,
        "fine": 280,
        "others": 0,
        "installment": 4518,
        "received": 0,
        "note": ""
      }
    ],
    "regDate": "10-04-2023",
    "expDate": "11-12-2026",
    "insCompany": "Liva Insurance",
    "policyNo": "31691253",
    "insExp": "11-01-2027",
    "color": "Grey",
    "chassisNo": "JTMHU01J2M4219250",
    "engineNo": "1GRC308055",
    "passengers": 8
  },
  {
    "id": "car-i49209",
    "plateNo": "I49209",
    "bank": "Emirates NBD",
    "brand": "Land Cruiser",
    "model": "2025",
    "owner": "Roar",
    "installment": 4500,
    "deferment": "May+June",
    "instDate": 20,
    "currentValue": 250000,
    "ledger": [],
    "regDate": "15-12-2025",
    "expDate": "14-12-2026",
    "insCompany": "Orient Insurance",
    "policyNo": "40/1059129",
    "insExp": "14-01-2027",
    "color": "White/Pearl",
    "chassisNo": "JTMAUCBJ0S4081786",
    "engineNo": "C974218",
    "passengers": 7
  },
  {
    "id": "car-ff79157",
    "plateNo": "FF79157",
    "bank": "RAK Bank",
    "brand": "Land Cruiser",
    "model": "2026",
    "owner": "Roar",
    "installment": 4247,
    "deferment": "April+May",
    "instDate": 20,
    "currentValue": 280000,
    "ledger": [],
    "regDate": "20-02-2026",
    "expDate": "18-02-2027",
    "insCompany": "Orient Insurance",
    "policyNo": "01/1354067",
    "insExp": "18-03-2027",
    "color": "White/Pearl",
    "chassisNo": "JTMAUCBJXT4112057",
    "engineNo": "D036172",
    "passengers": 7
  },
  {
    "id": "car-bb20849",
    "plateNo": "BB20849",
    "bank": "Emirates NBD",
    "brand": "Land Cruiser",
    "model": "2025",
    "owner": "Bashar",
    "installment": 4700,
    "deferment": "May+June",
    "instDate": 20,
    "currentValue": 250000,
    "ledger": [
      {
        "id": "row-bb20849-1",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5190,
        "received": 5190,
        "note": "BB20849Salik84Trips268AED16Mayto15June"
      },
      {
        "id": "row-bb20849-2",
        "month": "January",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5190,
        "received": 5190,
        "note": ""
      },
      {
        "id": "row-bb20849-3",
        "month": "February",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5190,
        "received": 5190,
        "note": ""
      },
      {
        "id": "row-bb20849-4",
        "month": "March",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5190,
        "received": 5190,
        "note": ""
      },
      {
        "id": "row-bb20849-5",
        "month": "April",
        "salik": 128,
        "fine": 0,
        "others": 4840,
        "installment": 5190,
        "received": 5000,
        "note": ""
      },
      {
        "id": "row-bb20849-6",
        "month": "May",
        "salik": 164,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": "MAY DEFERMENT"
      },
      {
        "id": "row-bb20849-7",
        "month": "June",
        "salik": 268,
        "fine": 440,
        "others": 0,
        "installment": 0,
        "received": 4000,
        "note": "JUNE DEFERMENT 1ABUDHABI +1 RTAPARKING FINE"
      }
    ],
    "regDate": "19-11-2025",
    "expDate": "16-11-2026",
    "insCompany": "Orient Insurance",
    "policyNo": "40/1058277",
    "insExp": "16-12-2026",
    "color": "Silver",
    "chassisNo": "JTMAUCBJ1S4089864",
    "engineNo": "C990402",
    "passengers": 7
  },
  {
    "id": "car-bb23370",
    "plateNo": "BB23370",
    "bank": "Emirates NBD",
    "brand": "Land Cruiser",
    "model": "2024",
    "owner": "Shahmir",
    "installment": 4850,
    "deferment": "April+May",
    "instDate": 18,
    "currentValue": 250000,
    "ledger": [
      {
        "id": "row-bb23370-1",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4850,
        "received": 4850,
        "note": ""
      },
      {
        "id": "row-bb23370-2",
        "month": "January",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4850,
        "received": 4850,
        "note": ""
      },
      {
        "id": "row-bb23370-3",
        "month": "February",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4850,
        "received": 4850,
        "note": ""
      },
      {
        "id": "row-bb23370-5",
        "month": "March",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4850,
        "received": 4850,
        "note": ""
      },
      {
        "id": "row-bb23370-6",
        "month": "April",
        "salik": 30,
        "fine": 320,
        "others": 0,
        "installment": 4850,
        "received": 4850,
        "note": "APRIL DEFERMENT + city centre parking fines"
      },
      {
        "id": "row-bb23370-6",
        "month": "May",
        "salik": 22,
        "fine": 0,
        "others": 0,
        "installment": 4850,
        "received": 4850,
        "note": "MAY DEFERMENT"
      },
      {
        "id": "row-bb23370-6",
        "month": "June",
        "salik": 4,
        "fine": 0,
        "others": 0,
        "installment": 4850,
        "received": 0,
        "note": ""
      }
    ],
    "regDate": "18-11-2025",
    "expDate": "16-11-2026",
    "insCompany": "Orient Insurance",
    "policyNo": "40/1058280",
    "insExp": "16-12-2026",
    "color": "White",
    "chassisNo": "JTMAUCBJ9R4073440",
    "engineNo": "C956737",
    "passengers": 7
  },
  {
    "id": "car-dd21596",
    "plateNo": "DD21596",
    "bank": "RAK Bank",
    "brand": "Land Cruiser",
    "model": "2025",
    "owner": "Roar",
    "installment": 4888,
    "deferment": "April+May",
    "instDate": 15,
    "currentValue": 215000,
    "ledger": [
      {
        "id": "row-dd21596-1",
        "month": "March",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5000,
        "received": 5000,
        "note": ""
      },
      {
        "id": "row-dd21596-2",
        "month": "April",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5000,
        "received": 5000,
        "note": ""
      },
      {
        "id": "row-dd21596-3",
        "month": "May",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5000,
        "received": 5000,
        "note": ""
      },
      {
        "id": "row-dd21596-4",
        "month": "June",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5000,
        "received": 5000,
        "note": ""
      },
      {
        "id": "row-dd21596-5",
        "month": "July",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5000,
        "received": 5000,
        "note": ""
      },
      {
        "id": "row-dd21596-6",
        "month": "August",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5000,
        "received": 5000,
        "note": ""
      },
      {
        "id": "row-dd21596-7",
        "month": "September",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5000,
        "received": 5000,
        "note": ""
      },
      {
        "id": "row-dd21596-8",
        "month": "October",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5000,
        "received": 5000,
        "note": ""
      },
      {
        "id": "row-dd21596-9",
        "month": "November",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5000,
        "received": 5000,
        "note": ""
      },
      {
        "id": "row-dd21596-10",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5000,
        "received": 5000,
        "note": ""
      },
      {
        "id": "row-dd21596-11",
        "month": "January",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5000,
        "received": 5000,
        "note": ""
      },
      {
        "id": "row-dd21596-12",
        "month": "February",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5000,
        "received": 5000,
        "note": ""
      },
      {
        "id": "row-dd21596-13",
        "month": "March",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5000,
        "received": 5000,
        "note": ""
      },
      {
        "id": "row-dd21596-14",
        "month": "April",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5000,
        "received": 5000,
        "note": ""
      },
      {
        "id": "row-dd21596-15",
        "month": "May",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5000,
        "received": 5000,
        "note": ""
      }
    ],
    "regDate": "19-02-2025",
    "expDate": "23-02-2027",
    "insCompany": "Dar Insurance",
    "policyNo": "1011838486",
    "insExp": "23-03-2027",
    "color": "White/Pearl",
    "chassisNo": "JTMAUCBJ3S4076694",
    "engineNo": "C964687",
    "passengers": 7
  },
  {
    "id": "car-ee89121",
    "plateNo": "EE89121",
    "bank": "ADCB",
    "brand": "Land Cruiser",
    "model": "2025",
    "owner": "Zeeshan",
    "installment": 4942,
    "deferment": "May+June",
    "instDate": 10,
    "currentValue": 220000,
    "ledger": [
      {
        "id": "row-ee89121-1",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5440,
        "received": 5440,
        "note": ""
      },
      {
        "id": "row-ee89121-2",
        "month": "January",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5440,
        "received": 5440,
        "note": ""
      },
      {
        "id": "row-ee89121-3",
        "month": "February",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5440,
        "received": 5440,
        "note": ""
      },
      {
        "id": "row-ee89121-4",
        "month": "March",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5440,
        "received": 5440,
        "note": ""
      },
      {
        "id": "row-ee89121-5",
        "month": "April",
        "salik": 12,
        "fine": 0,
        "others": 0,
        "installment": 5440,
        "received": 4900,
        "note": "620AED 2 Fines paid by himself"
      },
      {
        "id": "row-ee89121-6",
        "month": "May",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5440,
        "received": 5440,
        "note": "May Deferment"
      },
      {
        "id": "row-ee89121-7",
        "month": "June",
        "salik": 644,
        "fine": 0,
        "others": 0,
        "installment": 5440,
        "received": 5440,
        "note": "June Deferment"
      }
    ],
    "regDate": "07-11-2025",
    "expDate": "03-11-2026",
    "insCompany": "Orient Insurance",
    "policyNo": "40/1057920",
    "insExp": "03-12-2026",
    "color": "White",
    "chassisNo": "JTMAUCBJ9S4081902",
    "engineNo": "C974444",
    "passengers": 7
  },
  {
    "id": "car-dd50781",
    "plateNo": "DD50781",
    "bank": "Emirates Islamic",
    "brand": "Toyota Fortuner",
    "model": "2025",
    "owner": "Roar",
    "installment": 3200,
    "deferment": "May+June",
    "instDate": 30,
    "currentValue": 130000,
    "ledger": [
      {
        "id": "row-dd50781-1",
        "month": "April",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3500,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-dd50781-2",
        "month": "May",
        "salik": 0,
        "fine": 0,
        "others": 8,
        "installment": 3500,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-dd50781-3",
        "month": "June",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3500,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-dd50781-4",
        "month": "July",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3500,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-dd50781-5",
        "month": "August",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3500,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-dd50781-6",
        "month": "September",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3500,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-dd50781-7",
        "month": "October",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3500,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-dd50781-8",
        "month": "November",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3500,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-dd50781-9",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3500,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-dd50781-10",
        "month": "January",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3500,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-dd50781-11",
        "month": "February",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3500,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-dd50781-12",
        "month": "March",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3500,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-dd50781-13",
        "month": "April",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3500,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-dd50781-14",
        "month": "May",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3500,
        "received": 0,
        "note": ""
      }
    ],
    "regDate": "27-03-2025",
    "expDate": "16-04-2027",
    "insCompany": "Al Ain Ahlia Insurance (Dubai Branch)",
    "policyNo": "T3/101130922",
    "insExp": "16-05-2027",
    "color": "Black",
    "chassisNo": "MHFKU8FS1S0206164",
    "engineNo": "C964498",
    "passengers": 7
  },
  {
    "id": "car-dd72562",
    "plateNo": "DD72562",
    "bank": "Emirates NBD",
    "brand": "Land Cruiser",
    "model": "2025",
    "owner": "Umar",
    "installment": 4667,
    "deferment": "April+May",
    "instDate": 30,
    "currentValue": 220000,
    "ledger": [
      {
        "id": "row-dd72562-1",
        "month": "May",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5200,
        "received": 5200,
        "note": ""
      },
      {
        "id": "row-dd72562-2",
        "month": "June",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5200,
        "received": 5200,
        "note": ""
      },
      {
        "id": "row-dd72562-3",
        "month": "July",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5200,
        "received": 5200,
        "note": ""
      },
      {
        "id": "row-dd72562-4",
        "month": "August",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5200,
        "received": 5200,
        "note": ""
      },
      {
        "id": "row-dd72562-5",
        "month": "September",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5200,
        "received": 5200,
        "note": ""
      },
      {
        "id": "row-dd72562-6",
        "month": "October",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5200,
        "received": 5200,
        "note": ""
      },
      {
        "id": "row-dd72562-7",
        "month": "November",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5200,
        "received": 5200,
        "note": ""
      },
      {
        "id": "row-dd72562-8",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5200,
        "received": 5200,
        "note": ""
      },
      {
        "id": "row-dd72562-9",
        "month": "January",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5200,
        "received": 5200,
        "note": ""
      },
      {
        "id": "row-dd72562-10",
        "month": "February",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5200,
        "received": 5200,
        "note": ""
      },
      {
        "id": "row-dd72562-11",
        "month": "March",
        "salik": 0,
        "fine": 0,
        "others": 659,
        "installment": 5200,
        "received": 5200,
        "note": ""
      },
      {
        "id": "row-dd72562-12",
        "month": "April",
        "salik": 0,
        "fine": 3940,
        "others": 2150,
        "installment": 0,
        "received": 4000,
        "note": "DEFERMENT"
      },
      {
        "id": "row-dd72562-13",
        "month": "May",
        "salik": 222,
        "fine": 0,
        "others": 400,
        "installment": 5200,
        "received": 5200,
        "note": "DEFERMENT+Mulkiya renewal"
      },
      {
        "id": "row-dd72562-14",
        "month": "June",
        "salik": 20,
        "fine": 60,
        "others": 380,
        "installment": 5200,
        "received": 4700,
        "note": "4700AED Given Cash to Ibadat+parkonic parking+parkin"
      }
    ],
    "regDate": "29-04-2025",
    "expDate": "27-04-2026",
    "insCompany": "Dubai National Insurance",
    "policyNo": "2565S33509",
    "insExp": "27-05-2026",
    "color": "White/Pearl",
    "chassisNo": "JTMAUCBJXS4086834",
    "engineNo": "C983717",
    "passengers": 7
  },
  {
    "id": "car-dd72575",
    "plateNo": "DD72575",
    "bank": "Emirates NBD",
    "brand": "Land Cruiser",
    "model": "2025",
    "owner": "Mirza",
    "installment": 5265,
    "deferment": "April+May",
    "instDate": 30,
    "currentValue": 250000,
    "ledger": [
      {
        "id": "row-dd72575-1",
        "month": "May",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5765,
        "received": 5765,
        "note": ""
      },
      {
        "id": "row-dd72575-2",
        "month": "June",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5765,
        "received": 5765,
        "note": ""
      },
      {
        "id": "row-dd72575-3",
        "month": "July",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5765,
        "received": 5765,
        "note": ""
      },
      {
        "id": "row-dd72575-4",
        "month": "August",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5765,
        "received": 5765,
        "note": ""
      },
      {
        "id": "row-dd72575-5",
        "month": "September",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5765,
        "received": 5765,
        "note": ""
      },
      {
        "id": "row-dd72575-6",
        "month": "October",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5765,
        "received": 5765,
        "note": ""
      },
      {
        "id": "row-dd72575-7",
        "month": "November",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5765,
        "received": 5765,
        "note": ""
      },
      {
        "id": "row-dd72575-8",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5765,
        "received": 5765,
        "note": ""
      },
      {
        "id": "row-dd72575-9",
        "month": "January",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5765,
        "received": 5765,
        "note": ""
      },
      {
        "id": "row-dd72575-10",
        "month": "February",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5765,
        "received": 5765,
        "note": ""
      },
      {
        "id": "row-dd72575-11",
        "month": "March",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5765,
        "received": 5765,
        "note": ""
      },
      {
        "id": "row-dd72575-12",
        "month": "April",
        "salik": 172,
        "fine": 0,
        "others": 0,
        "installment": 5765,
        "received": 5765,
        "note": "APRIL DEFERMENT"
      },
      {
        "id": "row-dd72575-13",
        "month": "May",
        "salik": 90,
        "fine": 0,
        "others": 400,
        "installment": 0,
        "received": 662,
        "note": "MAY DEFERMENT"
      },
      {
        "id": "row-dd72575-14",
        "month": "June",
        "salik": 74,
        "fine": 220,
        "others": 210,
        "installment": 5765,
        "received": 0,
        "note": "1Parking Fine+Salik+3pax camp use"
      }
    ],
    "regDate": "29-04-2025",
    "expDate": "27-04-2026",
    "insCompany": "Dubai National Insurance",
    "policyNo": "2565S33506",
    "insExp": "27-05-2026",
    "color": "White/Pearl",
    "chassisNo": "JTMAUBBJ3S4087270",
    "engineNo": "C984502",
    "passengers": 7
  },
  {
    "id": "car-ee66074",
    "plateNo": "EE66074",
    "bank": "Emirates Islamic",
    "brand": "Land Cruiser",
    "model": "2024",
    "owner": "Irshad",
    "installment": 3895,
    "deferment": "April+May",
    "instDate": 15,
    "currentValue": 230000,
    "ledger": [
      {
        "id": "row-ee66074-1",
        "month": "November",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4400,
        "received": 4400,
        "note": ""
      },
      {
        "id": "row-ee66074-2",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4400,
        "received": 4400,
        "note": ""
      },
      {
        "id": "row-ee66074-3",
        "month": "January",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4400,
        "received": 4400,
        "note": ""
      },
      {
        "id": "row-ee66074-4",
        "month": "February",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4400,
        "received": 4400,
        "note": ""
      },
      {
        "id": "row-ee66074-5",
        "month": "March",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4400,
        "received": 4400,
        "note": "Down Payment Pending 2125 + Pending from april 1404 & 1319 from jan 2723"
      },
      {
        "id": "row-ee66074-6",
        "month": "April",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": "April Deferment"
      },
      {
        "id": "row-ee66074-7",
        "month": "May",
        "salik": 28,
        "fine": 170,
        "others": 4848,
        "installment": 0,
        "received": 0,
        "note": "May Deferment"
      },
      {
        "id": "row-ee66074-8",
        "month": "June",
        "salik": 22,
        "fine": 320,
        "others": 0,
        "installment": 4400,
        "received": 3000,
        "note": "27/05 2026 4:47pm Abu Dhabi Traffic AED 300 for Speeding"
      }
    ],
    "regDate": "06-10-2025",
    "expDate": "03-10-2026",
    "insCompany": "Orient Insurance",
    "policyNo": "01/1316751",
    "insExp": "03-11-2026",
    "color": "White/Pearl",
    "chassisNo": "JTMAUCBJXR4044478",
    "engineNo": "1GRC798927",
    "passengers": 7
  },
  {
    "id": "car-ee99749",
    "plateNo": "EE99749",
    "bank": "RAK Bank",
    "brand": "Land Cruiser",
    "model": "2025",
    "owner": "Shafique",
    "installment": 4580,
    "deferment": "May+June",
    "instDate": 15,
    "currentValue": 280000,
    "ledger": [
      {
        "id": "row-ee99749-1",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5000,
        "received": 5000,
        "note": ""
      },
      {
        "id": "row-ee99749-2",
        "month": "January",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5000,
        "received": 5000,
        "note": ""
      },
      {
        "id": "row-ee99749-3",
        "month": "February",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5000,
        "received": 5000,
        "note": ""
      },
      {
        "id": "row-ee99749-4",
        "month": "March",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5000,
        "received": 5000,
        "note": ""
      },
      {
        "id": "row-ee99749-5",
        "month": "April",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5000,
        "received": 5000,
        "note": ""
      },
      {
        "id": "row-ee99749-6",
        "month": "May",
        "salik": 12,
        "fine": 0,
        "others": 0,
        "installment": 5000,
        "received": 5000,
        "note": ""
      },
      {
        "id": "row-ee99749-7",
        "month": "June",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 5000,
        "received": 5000,
        "note": ""
      }
    ],
    "regDate": "18-11-2025",
    "expDate": "17-11-2026",
    "insCompany": "Orient Insurance",
    "policyNo": "01/1328411",
    "insExp": "17-12-2026",
    "color": "Black",
    "chassisNo": "JTMAUBBJXS4108213",
    "engineNo": "D027299",
    "passengers": 7
  },
  {
    "id": "car-ee65627",
    "plateNo": "EE65627",
    "bank": "Emirates NBD",
    "brand": "Land Cruiser",
    "model": "2024",
    "owner": "Munawar",
    "installment": 4274,
    "deferment": "May+June",
    "instDate": 10,
    "currentValue": 220000,
    "ledger": [
      {
        "id": "row-ee65627-1",
        "month": "November",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4500,
        "received": 4500,
        "note": ""
      },
      {
        "id": "row-ee65627-2",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4500,
        "received": 4500,
        "note": ""
      },
      {
        "id": "row-ee65627-3",
        "month": "January",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4500,
        "received": 4500,
        "note": ""
      },
      {
        "id": "row-ee65627-4",
        "month": "February",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4500,
        "received": 4500,
        "note": ""
      },
      {
        "id": "row-ee65627-5",
        "month": "March",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4500,
        "received": 4500,
        "note": ""
      },
      {
        "id": "row-ee65627-6",
        "month": "April",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 4500,
        "received": 4500,
        "note": ""
      },
      {
        "id": "row-ee65627-7",
        "month": "May",
        "salik": 64,
        "fine": 1030,
        "others": 0,
        "installment": 4500,
        "received": 4500,
        "note": "May Deferment"
      },
      {
        "id": "row-ee65627-8",
        "month": "June",
        "salik": 0,
        "fine": 120,
        "others": 1000,
        "installment": 4500,
        "received": 5700,
        "note": "1000aed for late payment"
      }
    ],
    "regDate": "10-10-2025",
    "expDate": "08-10-2026",
    "insCompany": "Orient Insurance",
    "policyNo": "40/1057173",
    "insExp": "08-11-2026",
    "color": "White",
    "chassisNo": "JTMAUCBJ2R4069374",
    "engineNo": "C948679",
    "passengers": 7
  },
  {
    "id": "car-z72166",
    "plateNo": "Z72166",
    "bank": "No Bank",
    "brand": "Land Cruiser",
    "model": "2008",
    "owner": "Asad",
    "installment": 0,
    "deferment": "",
    "instDate": 15,
    "currentValue": 150000,
    "ledger": [
      {
        "id": "row-z72166-1",
        "month": "May",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z72166-2",
        "month": "June",
        "salik": 0,
        "fine": 0,
        "others": 8,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z72166-3",
        "month": "July",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z72166-4",
        "month": "August",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z72166-5",
        "month": "September",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z72166-6",
        "month": "October",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z72166-7",
        "month": "November",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z72166-8",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z72166-9",
        "month": "January",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z72166-10",
        "month": "February",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z72166-11",
        "month": "March",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z72166-12",
        "month": "April",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z72166-13",
        "month": "May",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z72166-14",
        "month": "June",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z72166-15",
        "month": "July",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z72166-16",
        "month": "August",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z72166-17",
        "month": "September",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z72166-18",
        "month": "October",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z72166-19",
        "month": "November",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-z72166-20",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 0,
        "received": 0,
        "note": ""
      }
    ],
    "regDate": "15-05-2023",
    "expDate": "14-05-2026",
    "insCompany": "Orient Insurance",
    "policyNo": "01/1354149",
    "insExp": "14-06-2026",
    "color": "White/Pearl",
    "chassisNo": "JTMHU01J1K4181799",
    "engineNo": "1GRB965899",
    "passengers": 8
  },
  {
    "id": "car-bb10138",
    "plateNo": "BB10138",
    "bank": "No Bank",
    "brand": "Land Cruiser",
    "model": "2024",
    "owner": "Asad",
    "installment": 0,
    "deferment": "",
    "instDate": 15,
    "currentValue": 150000,
    "ledger": [
      {
        "id": "row-bb10138-1",
        "month": "May",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-bb10138-2",
        "month": "June",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-bb10138-3",
        "month": "July",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-bb10138-4",
        "month": "August",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-bb10138-5",
        "month": "September",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-bb10138-6",
        "month": "October",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-bb10138-7",
        "month": "November",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-bb10138-8",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-bb10138-9",
        "month": "January",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-bb10138-10",
        "month": "February",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-bb10138-11",
        "month": "March",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-bb10138-12",
        "month": "April",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-bb10138-13",
        "month": "May",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-bb10138-14",
        "month": "June",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-bb10138-15",
        "month": "July",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-bb10138-16",
        "month": "August",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-bb10138-17",
        "month": "September",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-bb10138-18",
        "month": "October",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-bb10138-19",
        "month": "November",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-bb10138-20",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      }
    ],
    "regDate": "15-12-2025",
    "expDate": "14-12-2026",
    "insCompany": "Orient Insurance",
    "policyNo": "40/1059128",
    "insExp": "14-01-2027",
    "color": "White",
    "chassisNo": "JTMAUCBJ0S4081788",
    "engineNo": "C974219",
    "passengers": 7
  },
  {
    "id": "car-q98865",
    "plateNo": "Q98865",
    "bank": "No Bank",
    "brand": "Land Cruiser",
    "model": "2016",
    "owner": "Asad",
    "installment": 0,
    "deferment": "",
    "instDate": 15,
    "currentValue": 150000,
    "ledger": [
      {
        "id": "row-q98865-1",
        "month": "May",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-q98865-2",
        "month": "June",
        "salik": 0,
        "fine": 0,
        "others": 8,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-q98865-3",
        "month": "July",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-q98865-4",
        "month": "August",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-q98865-5",
        "month": "September",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-q98865-6",
        "month": "October",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-q98865-7",
        "month": "November",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-q98865-8",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-q98865-9",
        "month": "January",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-q98865-10",
        "month": "February",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-q98865-11",
        "month": "March",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-q98865-12",
        "month": "April",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-q98865-13",
        "month": "May",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-q98865-14",
        "month": "June",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-q98865-15",
        "month": "July",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-q98865-16",
        "month": "August",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-q98865-17",
        "month": "September",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-q98865-18",
        "month": "October",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-q98865-19",
        "month": "November",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      },
      {
        "id": "row-q98865-20",
        "month": "December",
        "salik": 0,
        "fine": 0,
        "others": 0,
        "installment": 3650,
        "received": 0,
        "note": ""
      }
    ],
    "regDate": "15-12-2025",
    "expDate": "14-12-2026",
    "insCompany": "Orient Insurance",
    "policyNo": "40/1059127",
    "insExp": "14-01-2027",
    "color": "White",
    "chassisNo": "JTMAUCBJ0S4081787",
    "engineNo": "C974217",
    "passengers": 7
  }
];

export const initialCarExpenses = [
  {
    id: "carexp-100",
    carId: "car-ff79157",
    plateNo: "FF79157",
    category: "Oil Change",
    amount: 420,
    date: "2026-09-01",
    paymentMethod: "Card",
    status: "paid",
    notes: "10,000 KM major oil & filter service at Al Futtaim quick lube"
  },
  {
    id: "carexp-100b",
    carId: "car-dd21596",
    plateNo: "DD21596",
    category: "Battery & Brake Pads",
    amount: 680,
    date: "2026-09-02",
    paymentMethod: "Cash",
    status: "paid",
    notes: "AC Delco heavy duty battery replacement and OEM front brake pads"
  },
  {
    id: "carexp-101",
    carId: "car-ff79157",
    plateNo: "FF79157",
    category: "Car Passing",
    amount: 170,
    date: "2026-08-15",
    paymentMethod: "Card",
    status: "paid",
    notes: "Annual RTA Technical passing passed with zero defects"
  },
  {
    id: "carexp-102",
    carId: "car-dd21596",
    plateNo: "DD21596",
    category: "Tyre Change",
    amount: 1600,
    date: "2026-08-18",
    paymentMethod: "Bank Transfer",
    status: "paid",
    notes: "Replaced 4x Bridgestone Desert Dueller 285/65R17 tyres"
  },
  {
    id: "carexp-103",
    carId: "car-bb23370",
    plateNo: "BB23370",
    category: "Oil Change",
    amount: 380,
    date: "2026-08-20",
    paymentMethod: "Cash",
    status: "paid",
    notes: "Mobil 1 10,000 KM synthetic oil + OEM oil filter & air filter clean"
  },
  {
    id: "carexp-104",
    carId: "car-i49209",
    plateNo: "I49209",
    category: "Floor Mats & Detailing",
    amount: 250,
    date: "2026-08-22",
    paymentMethod: "Cash",
    status: "paid",
    notes: "Heavy duty 7D all-weather sand floor mats and interior steam detailing"
  },
  {
    id: "carexp-105",
    carId: "car-d16197",
    plateNo: "D16197",
    category: "Accidents & Body Repair",
    amount: 950,
    date: "2026-08-24",
    paymentMethod: "Bank Transfer",
    status: "paid",
    notes: "Front right fender minor dune dent repair and paint touchup"
  },
  {
    id: "carexp-106",
    carId: "car-i49209",
    plateNo: "I49209",
    category: "Insurance Renewal",
    amount: 2450,
    date: "2026-08-25",
    paymentMethod: "Bank Transfer",
    status: "paid",
    notes: "Annual comprehensive commercial motor insurance policy with desert safari cover"
  },
  {
    id: "carexp-107",
    carId: "car-g25801",
    plateNo: "G25801",
    category: "Mulkiya Renewals",
    amount: 350,
    date: "2026-08-26",
    paymentMethod: "Card",
    status: "paid",
    notes: "Vehicle electronic Mulkiya registration card renewal fee"
  },
  {
    id: "carexp-108",
    carId: "car-dd50781",
    plateNo: "DD50781",
    category: "Battery & Brake Pads",
    amount: 580,
    date: "2026-08-28",
    paymentMethod: "Cash",
    status: "paid",
    notes: "Installed new AC Delco heavy battery and front ceramic brake pads"
  }
];

export const initialCompanyExpenses = [
  {
    id: "compexp-201",
    category: "Trade License Renewal",
    amount: 14500,
    date: "2026-08-10",
    dueDate: "2026-12-15",
    paymentMethod: "Bank Transfer",
    invoiceNo: "DET-2026-8819",
    status: "paid",
    notes: "DET / DTCM commercial tourism license renewal and chamber fees"
  },
  {
    id: "compexp-202",
    category: "Establishment Card Renewal",
    amount: 1850,
    date: "2026-08-12",
    dueDate: "2026-11-20",
    paymentMethod: "Card",
    invoiceNo: "GDRFA-55219",
    status: "paid",
    notes: "GDRFA Immigration 3-year establishment card and smart gate access"
  },
  {
    id: "compexp-203",
    category: "Office Rent & Ejari",
    amount: 18500,
    date: "2026-08-01",
    dueDate: "2026-08-01",
    paymentMethod: "Bank Cheque",
    invoiceNo: "DWTC-RENT-Q3",
    status: "paid",
    notes: "DWTC Complex Suite 402 commercial office Q3 quarterly lease"
  },
  {
    id: "compexp-204",
    category: "Company Main Phone Bill",
    amount: 650,
    date: "2026-08-25",
    dueDate: "2026-09-05",
    paymentMethod: "Auto Debit",
    invoiceNo: "DU-HOTLINE-0826",
    status: "paid",
    notes: "Du main booking hotline (+971 58 934 4077) business postpaid plan"
  },
  {
    id: "compexp-205",
    category: "Office Internet & Telephony Bill",
    amount: 899,
    date: "2026-08-25",
    dueDate: "2026-09-05",
    paymentMethod: "Card",
    invoiceNo: "DU-INTERNET-0826",
    status: "paid",
    notes: "Office high-speed fiber internet 500Mbps and static IP"
  },
  {
    id: "compexp-206",
    category: "Office Expenses & Supplies",
    amount: 480,
    date: "2026-08-16",
    dueDate: "2026-08-16",
    paymentMethod: "Petty Cash",
    invoiceNo: "OF-4419",
    status: "paid",
    notes: "Monthly stationery, A4 reams, bottled drinking water and espresso beans"
  },
  {
    id: "compexp-207",
    category: "Petty Cash Disbursements",
    amount: 350,
    date: "2026-08-20",
    dueDate: "2026-08-20",
    paymentMethod: "Cash",
    invoiceNo: "PC-AUG-02",
    status: "paid",
    notes: "Daily office petty cash top-up, agency courier and office refreshments"
  },
  {
    id: "compexp-208",
    category: "Miscellaneous & Legal",
    amount: 1200,
    date: "2026-08-22",
    dueDate: "2026-08-22",
    paymentMethod: "Bank Transfer",
    invoiceNo: "CT-8831",
    status: "paid",
    notes: "Google Workspace emails, cloud server backup and financial auditing"
  }
];

export const initialCompanySims = [
  {
    id: "sim-1",
    phoneNumber: "+971 58 934 4077",
    provider: "Du",
    planName: "Business Unlimited 300",
    monthlyCost: 300,
    assignedAgent: "Asad (Sales Lead)",
    agentRole: "Inbound Sales & VIP Bookings",
    simCardNumber: "89971032194019283",
    status: "active",
    assignedDate: "2025-01-10",
    notes: "Primary WhatsApp marketing hotline & VIP client management"
  },
  {
    id: "sim-2",
    phoneNumber: "+971 55 135 6738",
    provider: "Du",
    planName: "Business Executive 200",
    monthlyCost: 200,
    assignedAgent: "Jaspreen",
    agentRole: "Outbound Leads & Partner Relations",
    simCardNumber: "89971032194019284",
    status: "active",
    assignedDate: "2025-02-15",
    notes: "B2B travel agent coordination & hotel concierge desk desk outreach"
  },
  {
    id: "sim-3",
    phoneNumber: "+971 55 806 6595",
    provider: "Etisalat",
    planName: "Business Freedom 250",
    monthlyCost: 250,
    assignedAgent: "Bashar",
    agentRole: "Operations & Driver Dispatch",
    simCardNumber: "89971032194019285",
    status: "active",
    assignedDate: "2025-03-01",
    notes: "Safari convoy logistics, desert camp coordination & driver allocations"
  },
  {
    id: "sim-4",
    phoneNumber: "+971 56 484 7249",
    provider: "Du",
    planName: "Business Smart 150",
    monthlyCost: 150,
    assignedAgent: "Shahmir",
    agentRole: "Sales & Customer Support",
    simCardNumber: "89971032194019286",
    status: "active",
    assignedDate: "2025-04-10",
    notes: "Website live chat handling & direct booking followups"
  },
  {
    id: "sim-5",
    phoneNumber: "+971 52 226 2975",
    provider: "Etisalat",
    planName: "Business Smart 150",
    monthlyCost: 150,
    assignedAgent: "Umar",
    agentRole: "Inbound Leads & WhatsApp Agent",
    simCardNumber: "89971032194019287",
    status: "active",
    assignedDate: "2025-05-12",
    notes: "Social media ad inquiry response & payment link distribution"
  },
  {
    id: "sim-6",
    phoneNumber: "+971 52 474 8814",
    provider: "Du",
    planName: "Business Smart 150",
    monthlyCost: 150,
    assignedAgent: "Mirza",
    agentRole: "Driver Dispatch Support",
    simCardNumber: "89971032194019288",
    status: "active",
    assignedDate: "2025-06-01",
    notes: "City tours and airport transfer driver communication"
  },
  {
    id: "sim-7",
    phoneNumber: "+971 55 432 1940",
    provider: "Virgin",
    planName: "Corporate Standby 100",
    monthlyCost: 100,
    assignedAgent: "Office Standby SIM 1",
    agentRole: "Spare / Standby Line",
    simCardNumber: "89971032194019289",
    status: "spare",
    assignedDate: "2025-06-15",
    notes: "Emergency standby line for temporary staff / seasonal peak drivers"
  }
];

// Helper sample base64 generator for official vehicle documents
const generateSampleDocData = (title, plate, category, expiry) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="480" viewBox="0 0 700 480">
    <rect width="700" height="480" rx="16" fill="#fdfbf7" stroke="#ede6d9" stroke-width="4"/>
    <rect x="24" y="24" width="652" height="70" rx="10" fill="#8c5b30"/>
    <text x="50" y="52" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold">ROAR ADVENTURE TOURISM LLC</text>
    <text x="50" y="76" fill="#f5ede4" font-family="sans-serif" font-size="13">OFFICIAL FLEET DOCUMENT • DUBAI, UAE</text>
    <text x="640" y="65" fill="#ffffff" font-family="monospace" font-size="18" font-weight="bold" text-anchor="end">${plate}</text>
    
    <rect x="40" y="120" width="620" height="40" rx="6" fill="#ede6d9"/>
    <text x="60" y="146" fill="#543c2b" font-family="sans-serif" font-size="16" font-weight="bold">${title.toUpperCase()}</text>
    <text x="630" y="146" fill="#8c5b30" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="end">${category.toUpperCase()}</text>
    
    <rect x="40" y="180" width="295" height="110" rx="8" fill="#ffffff" stroke="#ede6d9" stroke-width="1.5"/>
    <text x="60" y="210" fill="#6b7280" font-family="sans-serif" font-size="11" font-weight="bold">VEHICLE IDENTIFICATION</text>
    <text x="60" y="238" fill="#111827" font-family="monospace" font-size="18" font-weight="bold">PLATE: ${plate}</text>
    <text x="60" y="265" fill="#4b5563" font-family="sans-serif" font-size="12">Fleet Code: ROAR-DESERT-4X4</text>
    
    <rect x="365" y="180" width="295" height="110" rx="8" fill="#ffffff" stroke="#ede6d9" stroke-width="1.5"/>
    <text x="385" y="210" fill="#6b7280" font-family="sans-serif" font-size="11" font-weight="bold">VALIDITY & EXPIRATION</text>
    <text x="385" y="238" fill="#047857" font-family="sans-serif" font-size="16" font-weight="bold">EXPIRY: ${expiry || 'PERMANENT'}</text>
    <text x="385" y="265" fill="#4b5563" font-family="sans-serif" font-size="12">Status: Officially Verified</text>
    
    <rect x="40" y="310" width="620" height="90" rx="8" fill="#ffffff" stroke="#ede6d9" stroke-width="1.5"/>
    <text x="60" y="338" fill="#6b7280" font-family="sans-serif" font-size="11" font-weight="bold">DOCUMENT DETAILS & REGISTRATION</text>
    <text x="60" y="365" fill="#374151" font-family="sans-serif" font-size="13">Digital electronic record stored securely in Roar Tourism CRM Vault.</text>
    <text x="60" y="385" fill="#8c5b30" font-family="sans-serif" font-size="12" font-weight="bold">Verified by Operations Dispatch • Dubai Tourism Authority Compliance</text>
    
    <text x="50" y="445" fill="#9ca3af" font-family="sans-serif" font-size="11">Generated electronically by Roar Tourism ERP Vault. Valid without physical stamp.</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const initialCarDocuments = [
  // 1. Car #FF79157
  {
    id: "cardoc-1",
    carPlate: "FF79157",
    title: "Mulkiya Vehicle Registration 2026-2027",
    category: "Mulkiya",
    issueDate: "2026-01-15",
    expiryDate: "2027-01-15",
    fileName: "Mulkiya_FF79157_2026.svg",
    fileType: "image/svg+xml",
    fileSize: "185 KB",
    fileData: generateSampleDocData("Mulkiya Vehicle Registration Card", "FF79157", "Mulkiya", "15/01/2027"),
    notes: "RTA Dubai electronic vehicle license card (Gold Class Safari 4x4)",
    uploadedAt: "2026-01-16"
  },
  {
    id: "cardoc-2",
    carPlate: "FF79157",
    title: "Orient Comprehensive Motor Insurance Policy",
    category: "Insurance",
    issueDate: "2026-01-15",
    expiryDate: "2027-01-15",
    fileName: "Insurance_Policy_FF79157.svg",
    fileType: "image/svg+xml",
    fileSize: "240 KB",
    fileData: generateSampleDocData("Orient Comprehensive Motor Insurance", "FF79157", "Insurance", "15/01/2027"),
    notes: "Comprehensive safari commercial coverage with roadside assist & off-road recovery",
    uploadedAt: "2026-01-16"
  },
  {
    id: "cardoc-3",
    carPlate: "FF79157",
    title: "RTA Technical Inspection Passing Certificate",
    category: "RTA Passing",
    issueDate: "2026-01-10",
    expiryDate: "2027-01-10",
    fileName: "RTA_Passing_FF79157.svg",
    fileType: "image/svg+xml",
    fileSize: "160 KB",
    fileData: generateSampleDocData("RTA Technical Inspection Certificate", "FF79157", "RTA Passing", "10/01/2027"),
    notes: "Tasjeel Al Qusais passed with zero minor defects",
    uploadedAt: "2026-01-11"
  },
  {
    id: "cardoc-4",
    carPlate: "FF79157",
    title: "GPS Security & Dubai Police Tracker Passing",
    category: "Tracker Passing",
    issueDate: "2026-01-08",
    expiryDate: "2027-01-08",
    fileName: "Tracker_Passing_FF79157.svg",
    fileType: "image/svg+xml",
    fileSize: "175 KB",
    fileData: generateSampleDocData("GPS Security Tracker Passing Certificate", "FF79157", "Tracker Passing", "08/01/2027"),
    notes: "Connected to SecurePath Dubai police tracking gateway",
    uploadedAt: "2026-01-09"
  },

  // 2. Car #DD21596
  {
    id: "cardoc-5",
    carPlate: "DD21596",
    title: "Mulkiya Vehicle Registration (Expiring Soon)",
    category: "Mulkiya",
    issueDate: "2025-09-28",
    expiryDate: "2026-09-28",
    fileName: "Mulkiya_DD21596_2025.svg",
    fileType: "image/svg+xml",
    fileSize: "190 KB",
    fileData: generateSampleDocData("Mulkiya Vehicle Registration Card", "DD21596", "Mulkiya", "28/09/2026"),
    notes: "Renewal due within 26 days. RTA passing required before renewal.",
    uploadedAt: "2025-09-29"
  },
  {
    id: "cardoc-6",
    carPlate: "DD21596",
    title: "Oman Insurance Commercial Policy",
    category: "Insurance",
    issueDate: "2025-10-05",
    expiryDate: "2026-10-05",
    fileName: "Insurance_DD21596.svg",
    fileType: "image/svg+xml",
    fileSize: "210 KB",
    fileData: generateSampleDocData("Oman Insurance Commercial Motor Policy", "DD21596", "Insurance", "05/10/2026"),
    notes: "Commercial passenger liability included for desert safari operations",
    uploadedAt: "2025-10-06"
  },
  {
    id: "cardoc-7",
    carPlate: "DD21596",
    title: "RTA Technical Inspection Passing Certificate",
    category: "RTA Passing",
    issueDate: "2025-09-20",
    expiryDate: "2026-09-20",
    fileName: "RTA_Passing_DD21596.svg",
    fileType: "image/svg+xml",
    fileSize: "155 KB",
    fileData: generateSampleDocData("RTA Technical Inspection Certificate", "DD21596", "RTA Passing", "20/09/2026"),
    notes: "Al Mutakamela testing center passing report",
    uploadedAt: "2025-09-21"
  },

  // 3. Car #G25801
  {
    id: "cardoc-8",
    carPlate: "G25801",
    title: "Mulkiya Vehicle Registration Card 2026",
    category: "Mulkiya",
    issueDate: "2026-03-10",
    expiryDate: "2027-03-10",
    fileName: "Mulkiya_G25801.svg",
    fileType: "image/svg+xml",
    fileSize: "180 KB",
    fileData: generateSampleDocData("Mulkiya Vehicle Registration Card", "G25801", "Mulkiya", "10/03/2027"),
    notes: "Official Dubai commercial vehicle registration card",
    uploadedAt: "2026-03-11"
  },
  {
    id: "cardoc-9",
    carPlate: "G25801",
    title: "SecurePath GPS Tracker Annual Certificate",
    category: "Tracker Passing",
    issueDate: "2026-03-05",
    expiryDate: "2027-03-05",
    fileName: "Tracker_G25801.svg",
    fileType: "image/svg+xml",
    fileSize: "165 KB",
    fileData: generateSampleDocData("SecurePath GPS Tracker Passing Certificate", "G25801", "Tracker Passing", "05/03/2027"),
    notes: "SIRA & Dubai Police compliance tracker certificate",
    uploadedAt: "2026-03-06"
  },

  // 4. Car #D16197
  {
    id: "cardoc-10",
    carPlate: "D16197",
    title: "Dubai Police Accident Report #AR-2026-904",
    category: "Accident Report",
    issueDate: "2026-08-24",
    expiryDate: "",
    fileName: "Accident_Report_D16197.svg",
    fileType: "image/svg+xml",
    fileSize: "220 KB",
    fileData: generateSampleDocData("Dubai Police Official Accident Report #AR-904", "D16197", "Accident Report", "N/A - CLAIM FILED"),
    notes: "Desert dune bumper dent claim filed. Repaired at Al Quoz Precision Workshop (950 AED).",
    uploadedAt: "2026-08-24"
  },
  {
    id: "cardoc-11",
    carPlate: "D16197",
    title: "Mulkiya Vehicle Registration Card 2026",
    category: "Mulkiya",
    issueDate: "2026-04-12",
    expiryDate: "2027-04-12",
    fileName: "Mulkiya_D16197.svg",
    fileType: "image/svg+xml",
    fileSize: "185 KB",
    fileData: generateSampleDocData("Mulkiya Vehicle Registration Card", "D16197", "Mulkiya", "12/04/2027"),
    notes: "Commercial license valid until April 2027",
    uploadedAt: "2026-04-13"
  },

  // 5. Car #I49209
  {
    id: "cardoc-12",
    carPlate: "I49209",
    title: "Mulkiya Vehicle Registration Card",
    category: "Mulkiya",
    issueDate: "2026-05-18",
    expiryDate: "2027-05-18",
    fileName: "Mulkiya_I49209.svg",
    fileType: "image/svg+xml",
    fileSize: "180 KB",
    fileData: generateSampleDocData("Mulkiya Vehicle Registration Card", "I49209", "Mulkiya", "18/05/2027"),
    notes: "Active Land Cruiser commercial license",
    uploadedAt: "2026-05-19"
  },
  {
    id: "cardoc-13",
    carPlate: "I49209",
    title: "Commercial Motor Insurance Certificate",
    category: "Insurance",
    issueDate: "2026-05-20",
    expiryDate: "2027-05-20",
    fileName: "Insurance_I49209.svg",
    fileType: "image/svg+xml",
    fileSize: "230 KB",
    fileData: generateSampleDocData("Commercial Motor Insurance Certificate", "I49209", "Insurance", "20/05/2027"),
    notes: "Full passenger & vehicle comprehensive motor insurance policy (2,450 AED)",
    uploadedAt: "2026-05-21"
  },

  // 6. Car #BB23370
  {
    id: "cardoc-14",
    carPlate: "BB23370",
    title: "Mulkiya Vehicle Registration Card",
    category: "Mulkiya",
    issueDate: "2026-06-01",
    expiryDate: "2027-06-01",
    fileName: "Mulkiya_BB23370.svg",
    fileType: "image/svg+xml",
    fileSize: "175 KB",
    fileData: generateSampleDocData("Mulkiya Vehicle Registration Card", "BB23370", "Mulkiya", "01/06/2027"),
    notes: "RTA Dubai electronic vehicle license card",
    uploadedAt: "2026-06-02"
  },
  {
    id: "cardoc-15",
    carPlate: "BB23370",
    title: "GPS Security & SIRA Tracker Passing",
    category: "Tracker Passing",
    issueDate: "2026-05-28",
    expiryDate: "2027-05-28",
    fileName: "Tracker_BB23370.svg",
    fileType: "image/svg+xml",
    fileSize: "170 KB",
    fileData: generateSampleDocData("GPS Security Tracker Passing Certificate", "BB23370", "Tracker Passing", "28/05/2027"),
    notes: "SecurePath operational certificate on file",
    uploadedAt: "2026-05-29"
  },

  // 7. Car #DD50781
  {
    id: "cardoc-16",
    carPlate: "DD50781",
    title: "Mulkiya Vehicle Registration Card",
    category: "Mulkiya",
    issueDate: "2026-07-14",
    expiryDate: "2027-07-14",
    fileName: "Mulkiya_DD50781.svg",
    fileType: "image/svg+xml",
    fileSize: "185 KB",
    fileData: generateSampleDocData("Mulkiya Vehicle Registration Card", "DD50781", "Mulkiya", "14/07/2027"),
    notes: "RTA Dubai electronic commercial registration",
    uploadedAt: "2026-07-15"
  },
  {
    id: "cardoc-17",
    carPlate: "DD50781",
    title: "Motor Fleet Comprehensive Policy",
    category: "Insurance",
    issueDate: "2026-07-15",
    expiryDate: "2027-07-15",
    fileName: "Insurance_DD50781.svg",
    fileType: "image/svg+xml",
    fileSize: "225 KB",
    fileData: generateSampleDocData("Motor Fleet Comprehensive Insurance Policy", "DD50781", "Insurance", "15/07/2027"),
    notes: "Comprehensive tourist safari coverage",
    uploadedAt: "2026-07-16"
  }
];