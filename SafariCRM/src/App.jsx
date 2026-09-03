import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  CalendarRange, 
  Users, 
  Car, 
  Receipt, 
  Handshake, 
  Compass,
  Menu,
  X,
  Database,
  Key,
  ShieldCheck,
  ShieldAlert,
  Settings,
  RefreshCw,
  Sparkles,
  FileText,
  Wrench,
  Building2
} from 'lucide-react';
import DashboardView from './components/DashboardView';
import BookingsView from './components/BookingsView';
import CustomersView from './components/CustomersView';
import DriversView from './components/DriversView';
import PackagesView from './components/PackagesView';
import PartnersView from './components/PartnersView';
import CarFinanceView from './components/CarFinanceView';
import CustomerBookingView from './components/CustomerBookingView';
import LoginView from './components/LoginView';
import AdminAssistantView from './components/AdminAssistantView';
import CompanyDetailsView from './components/CompanyDetailsView';
import CompanyDocumentsView from './components/CompanyDocumentsView';
import CarExpensesView from './components/CarExpensesView';
import CompanyExpensesView from './components/CompanyExpensesView';
import BookingVerificationModal from './components/BookingVerificationModal';
// import MasterAdminView from './components/MasterAdminView';
import { initialBookings, initialDrivers, initialExpenses, initialPartners, initialCars, initialPackages, initialCoupons, initialCarExpenses, initialCompanyExpenses, initialCompanySims, initialCarDocuments } from './mockData';
// Database configuration layer

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const [profileTab, setProfileTab] = useState('adminInfo'); // 'adminInfo' or 'companyInfo'

  // Database version reset check
  const DB_VERSION = 'v39.0';
  useEffect(() => {
    localStorage.setItem('safari_db_version', DB_VERSION);
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('safari_admin_authenticated') === 'true';
  });
  const [userRole, setUserRole] = useState(() => {
    return sessionStorage.getItem('safari_user_role') || null;
  });
  const [companyId, setCompanyId] = useState(() => {
    return sessionStorage.getItem('safari_company_id') || 'roar';
  });
  const [isImpersonating, setIsImpersonating] = useState(() => {
    return sessionStorage.getItem('safari_is_impersonating') === 'true';
  });
  const [isCustomerView, setIsCustomerView] = useState(() => {
    return window.location.hash === '#/book' || window.location.search.includes('view=customer');
  });

  // Track Direct QR Scan Verification Pass from URL
  const [verifyBookingData, setVerifyBookingData] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const verifyId = params.get('verifyBooking') || params.get('verify');
      if (verifyId) {
        return {
          id: verifyId,
          customerName: params.get('name') || 'Valued Guest',
          whatsapp: params.get('phone') || '',
          pax: params.get('pax') || '1',
          packageName: params.get('pkg') || 'Dubai Desert Safari',
          date: params.get('date') || '',
          price: params.get('price') || '0',
          status: params.get('status') || 'confirmed',
          pickupLocation: params.get('loc') || '',
          pickupTime: params.get('time') || '',
          driverId: params.get('driver') || ''
        };
      }
    } catch (e) {}
    return null;
  });

  // Track Hash Route Changes for Shared Link Navigation
  useEffect(() => {
    const handleHashChange = () => {
      setIsCustomerView(window.location.hash === '#/book' || window.location.search.includes('view=customer'));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Helper for safe localStorage parsing
  const getLocalStorageItemSafe = (key, fallback) => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved || saved === 'undefined') return fallback;
      return JSON.parse(saved);
    } catch (e) {
      console.error(`Failed to parse localStorage key ${key}:`, e);
      return fallback;
    }
  };

  // central state with dynamic loading & persistent cache
  const [bookings, setBookings] = useState(() => {
    const stored = getLocalStorageItemSafe('safari_bookings', null);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    localStorage.setItem('safari_bookings', JSON.stringify(initialBookings));
    return initialBookings;
  });

  const [drivers, setDrivers] = useState(() => {
    const stored = getLocalStorageItemSafe('safari_drivers', null);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    localStorage.setItem('safari_drivers', JSON.stringify(initialDrivers));
    return initialDrivers;
  });

  const [expenses, setExpenses] = useState(() => {
    const stored = getLocalStorageItemSafe('safari_expenses', null);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    localStorage.setItem('safari_expenses', JSON.stringify(initialExpenses));
    return initialExpenses;
  });

  const [partners, setPartners] = useState(() => {
    const stored = getLocalStorageItemSafe('safari_partners', null);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    localStorage.setItem('safari_partners', JSON.stringify(initialPartners));
    return initialPartners;
  });

  const [cars, setCars] = useState(() => {
    const stored = getLocalStorageItemSafe('safari_cars', null);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    localStorage.setItem('safari_cars', JSON.stringify(initialCars));
    return initialCars;
  });

  const [packages, setPackages] = useState(() => {
    const stored = getLocalStorageItemSafe('safari_packages', initialPackages);
    const missing = initialPackages.filter(initPkg => !stored.some(p => p.id === initPkg.id));
    if (missing.length > 0) {
      const merged = [...stored, ...missing];
      localStorage.setItem('safari_packages', JSON.stringify(merged));
      return merged;
    }
    return stored;
  });

  const [coupons, setCoupons] = useState(() => {
    const stored = getLocalStorageItemSafe('safari_coupons', null);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    localStorage.setItem('safari_coupons', JSON.stringify(initialCoupons));
    return initialCoupons;
  });

  const [carExpenses, setCarExpenses] = useState(() => {
    const stored = getLocalStorageItemSafe('safari_car_expenses', null);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    localStorage.setItem('safari_car_expenses', JSON.stringify(initialCarExpenses));
    return initialCarExpenses;
  });

  const [companyExpenses, setCompanyExpenses] = useState(() => {
    const stored = getLocalStorageItemSafe('safari_company_expenses', null);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    localStorage.setItem('safari_company_expenses', JSON.stringify(initialCompanyExpenses));
    return initialCompanyExpenses;
  });

  const [companySims, setCompanySims] = useState(() => {
    const stored = getLocalStorageItemSafe('safari_company_sims', null);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    localStorage.setItem('safari_company_sims', JSON.stringify(initialCompanySims));
    return initialCompanySims;
  });

  const [customers, setCustomers] = useState(() => {
    return getLocalStorageItemSafe('safari_customers', []);
  });

  const [settings, setSettings] = useState(() => {
    return getLocalStorageItemSafe('safari_settings', []);
  });

  const todayStrToday = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const [filterPartner, setFilterPartner] = useState('');
  const [filterDriver, setFilterDriver] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState(todayStrToday);
  const [customEndDate, setCustomEndDate] = useState(todayStrToday);
  const [viewingBookingFromDashboard, setViewingBookingFromDashboard] = useState(null);
  const [viewingDriverFromDashboard, setViewingDriverFromDashboard] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const [companyDocuments, setCompanyDocuments] = useState(() => {
    return getLocalStorageItemSafe('safari_company_documents', []);
  });

  useEffect(() => {
    try {
      const documentsMetadata = (companyDocuments || []).map(({ fileData, ...rest }) => rest);
      localStorage.setItem('safari_company_documents', JSON.stringify(documentsMetadata));
    } catch (e) {
      console.warn("Failed to write company documents metadata to localStorage:", e);
    }
  }, [companyDocuments]);

  const [carDocuments, setCarDocuments] = useState(() => {
    const isNewVersion = localStorage.getItem('safari_db_version') !== DB_VERSION;
    if (isNewVersion) {
      localStorage.setItem('safari_car_documents', JSON.stringify(initialCarDocuments));
      return initialCarDocuments;
    }
    return getLocalStorageItemSafe('safari_car_documents', initialCarDocuments);
  });

  useEffect(() => {
    try {
      localStorage.setItem('safari_car_documents', JSON.stringify(carDocuments));
    } catch (e) {
      console.warn("Failed to write car documents to localStorage:", e);
    }
  }, [carDocuments]);

  const setCarDocumentsCustom = (newDocs) => {
    setCarDocuments(newDocs);
    try {
      localStorage.setItem('safari_car_documents', JSON.stringify(newDocs));
    } catch (e) {
      console.warn("Failed to write car documents to localStorage:", e);
    }
  };

  const [companyDetails, setCompanyDetails] = useState(() => {
    return getLocalStorageItemSafe('safari_company_details', {
      id: 'company_info',
      fullName: 'Roar Adventure Tourism LLC',
      address: 'Dubai World Trade Centre (DWTC), Sheikh Zayed Rd, Dubai, UAE',
      contactPerson: 'Mr. Abid Ali',
      whatsapp: '+97145578679',
      email: 'info@roaradventuretourism.com',
      regDate: '2016-01-01',
      licenseNo: 'DET/DTCM Licensed Tour Operator',
      whatWeOffer: 'Morning Desert Safari, Evening Desert Safari, VIP Desert Safari, Private Desert Safari, City Tours, Chauffeur Services, Private Transfers, Marina Cruise Dinner Services'
    });
  });

  useEffect(() => {
    localStorage.setItem('safari_company_details', JSON.stringify(companyDetails));
  }, [companyDetails]);

  const updateCompanyDetails = async (newDetails) => {
    setCompanyDetails(newDetails);
    try {
      const res = await fetch(`api.php?action=save&table=company_details&company_id=${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDetails)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (result.status !== 'success') {
        throw new Error(result.message || 'Database rejected company details payload.');
      }
    } catch (err) {
      console.error("Failed to sync company details with MySQL:", err);
    }
  };

  // 1. Initial MySQL load effect
  const [dbStatus, setDbStatus] = useState(''); // 'loading', 'success', 'error', 'offline'
  useEffect(() => {
    if (userRole === 'master_admin' || userRole === 'register_wizard') {
      setDbStatus('success');
      return;
    }
    const loadDatabase = async () => {
      setDbStatus('loading');
      try {
        const res = await fetch(`api.php?action=load&company_id=${companyId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();
        if (result.status === 'success' && result.data) {
          const { bookings: bList, drivers: dList, expenses: eList, partners: pList, cars: cList, packages: pkgList, coupons: cpnList, customers: custList, settings: settingsList, company_details: compDetails, company_documents: docList, car_expenses: ceList, company_expenses: compExpList, company_sims: simList, car_documents: carDocList } = result.data;
          
          if (bList && bList.length > 0) {
            let processedBList = bList;
            let listUpdated = false;

            // Ensure all bookings have 7-digit IDs (1000000 - 9999999)
            let max7DigitId = 1000000;
            processedBList.forEach(b => {
              const numId = parseInt(b.id);
              if (!isNaN(numId) && numId >= 1000000 && numId <= 9999999) {
                if (numId > max7DigitId) {
                  max7DigitId = numId;
                }
              }
            });

            processedBList = processedBList.map(b => {
              const numId = parseInt(b.id);
              const is7Digit = !isNaN(numId) && numId >= 1000000 && numId <= 9999999;
              if (!is7Digit) {
                listUpdated = true;
                const oldId = b.id;
                max7DigitId += 1;
                const newId = String(max7DigitId);
                const updatedB = { ...b, id: newId };
                
                fetch(`api.php?action=delete&table=bookings&company_id=${companyId}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: oldId })
                });

                fetch(`api.php?action=save&table=bookings&company_id=${companyId}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updatedB)
                });

                return updatedB;
              }
              return b;
            });

            const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
            processedBList = processedBList.map(b => {
               if (b.date < todayStr) {
                 if (b.status !== 'completed' && b.status !== 'cancelled') {
                   listUpdated = true;
                   const updatedB = { ...b, status: 'completed' };
                   fetch(`api.php?action=save&table=bookings&company_id=${companyId}`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify(updatedB)
                   });
                   return updatedB;
                 }
               } else {
                 if (!b.status) {
                   listUpdated = true;
                   const updatedB = { ...b, status: 'confirmed' };
                   fetch(`api.php?action=save&table=bookings&company_id=${companyId}`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify(updatedB)
                   });
                   return updatedB;
                 }
               }
               return b;
            });

            setBookings(processedBList);
            localStorage.setItem('safari_bookings', JSON.stringify(processedBList));

            const savedRefSetting = settingsList ? settingsList.find(s => s.setting_key === 'last_booking_ref') : null;
            const currentRefSettingVal = savedRefSetting ? parseInt(savedRefSetting.setting_value) : 0;
            if (max7DigitId > currentRefSettingVal) {
              fetch(`api.php?action=save_setting&company_id=${companyId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'last_booking_ref', value: String(max7DigitId) })
              });
              const updatedSettings = (settingsList || []).some(s => s.setting_key === 'last_booking_ref')
                ? settingsList.map(s => s.setting_key === 'last_booking_ref' ? { ...s, setting_value: String(max7DigitId) } : s)
                : [...(settingsList || []), { setting_key: 'last_booking_ref', setting_value: String(max7DigitId) }];
              setSettings(updatedSettings);
              localStorage.setItem('safari_settings', JSON.stringify(updatedSettings));
            }
          }
          
          if (dList && dList.length > 0) {
            setDrivers(dList);
            localStorage.setItem('safari_drivers', JSON.stringify(dList));
          }
          
          if (eList && eList.length > 0) {
            setExpenses(eList);
            localStorage.setItem('safari_expenses', JSON.stringify(eList));
          }
          
          if (pList && pList.length > 0) {
            setPartners(pList);
            localStorage.setItem('safari_partners', JSON.stringify(pList));
          }
          
          if (cList && cList.length > 0) {
            setCars(cList);
            localStorage.setItem('safari_cars', JSON.stringify(cList));
          }

          if (pkgList && pkgList.length > 0) {
             const missing = initialPackages.filter(initPkg => !pkgList.some(p => p.id === initPkg.id));
             if (missing.length > 0) {
               const merged = [...pkgList, ...missing];
               setPackages(merged);
               localStorage.setItem('safari_packages', JSON.stringify(merged));
               missing.forEach(m => {
                 fetch(`api.php?action=save&table=packages&company_id=${companyId}`, {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify(m)
                 });
               });
             } else {
               setPackages(pkgList);
               localStorage.setItem('safari_packages', JSON.stringify(pkgList));
             }
          }

          if (cpnList && cpnList.length > 0) {
            setCoupons(cpnList);
            localStorage.setItem('safari_coupons', JSON.stringify(cpnList));
          }

          if (custList && custList.length > 0) {
            setCustomers(custList);
            localStorage.setItem('safari_customers', JSON.stringify(custList));
          }

          if (settingsList && settingsList.length > 0) {
            setSettings(settingsList);
            localStorage.setItem('safari_settings', JSON.stringify(settingsList));
          }
          
          if (compDetails && compDetails.length > 0) {
            setCompanyDetails(compDetails[0]);
            localStorage.setItem('safari_company_details', JSON.stringify(compDetails[0]));
          } else if (compDetails && compDetails.id) {
            setCompanyDetails(compDetails);
            localStorage.setItem('safari_company_details', JSON.stringify(compDetails));
          }
          if (docList && docList.length > 0) {
            setCompanyDocuments(docList);
            try {
              const docMetadata = docList.map(({ fileData, ...rest }) => rest);
              localStorage.setItem('safari_company_documents', JSON.stringify(docMetadata));
            } catch (e) {
              console.warn("Failed to write loaded company documents to localStorage:", e);
            }
          }
          if (ceList && ceList.length > 0) {
            setCarExpenses(ceList);
            localStorage.setItem('safari_car_expenses', JSON.stringify(ceList));
          }
          if (compExpList && compExpList.length > 0) {
            setCompanyExpenses(compExpList);
            localStorage.setItem('safari_company_expenses', JSON.stringify(compExpList));
          }
          if (simList && simList.length > 0) {
            setCompanySims(simList);
            localStorage.setItem('safari_company_sims', JSON.stringify(simList));
          }
          if (carDocList && carDocList.length > 0) {
            setCarDocuments(carDocList);
            try {
              localStorage.setItem('safari_car_documents', JSON.stringify(carDocList));
            } catch (e) {
              console.warn("Failed to write loaded car documents to localStorage:", e);
            }
          }
          
          setDbStatus('success');
        } else {
          console.warn("MySQL returned error, using local storage cache:", result.message);
          setDbStatus('offline');
        }
      } catch (e) {
        console.error("MySQL loading failed, using local storage cache:", e);
        setDbStatus('offline');
      }
    };
    loadDatabase();
  }, [companyId, userRole]);

  const saveSetting = async (key, value) => {
    try {
      const res = await fetch(`api.php?action=save_setting&company_id=${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      const r = await res.json();
      if (r.status === 'success') {
        const updated = settings.some(s => s.setting_key === key)
          ? settings.map(s => s.setting_key === key ? { ...s, setting_value: value } : s)
          : [...settings, { setting_key: key, setting_value: value }];
        setSettings(updated);
        localStorage.setItem('safari_settings', JSON.stringify(updated));
      }
    } catch (err) {
      console.error("Failed to save setting:", err);
    }
  };

  // 2. Always keep localStorage cache updated
  useEffect(() => {
    localStorage.setItem('safari_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('safari_drivers', JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    localStorage.setItem('safari_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('safari_partners', JSON.stringify(partners));
  }, [partners]);

  useEffect(() => {
    localStorage.setItem('safari_cars', JSON.stringify(cars));
  }, [cars]);

  useEffect(() => {
    localStorage.setItem('safari_packages', JSON.stringify(packages));
  }, [packages]);

  useEffect(() => {
    localStorage.setItem('safari_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('safari_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('safari_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('safari_car_expenses', JSON.stringify(carExpenses));
  }, [carExpenses]);

  useEffect(() => {
    localStorage.setItem('safari_company_expenses', JSON.stringify(companyExpenses));
  }, [companyExpenses]);

  useEffect(() => {
    localStorage.setItem('safari_company_sims', JSON.stringify(companySims));
  }, [companySims]);

  const bookingsRef = useRef(bookings);
  const driversRef = useRef(drivers);
  const expensesRef = useRef(expenses);
  const partnersRef = useRef(partners);
  const carsRef = useRef(cars);
  const packagesRef = useRef(packages);
  const couponsRef = useRef(coupons);
  const customersRef = useRef(customers);
  const settingsRef = useRef(settings);
  const companyDocumentsRef = useRef(companyDocuments);
  const carExpensesRef = useRef(carExpenses);
  const companyExpensesRef = useRef(companyExpenses);
  const companySimsRef = useRef(companySims);

  useEffect(() => { bookingsRef.current = bookings; }, [bookings]);
  useEffect(() => { driversRef.current = drivers; }, [drivers]);
  useEffect(() => { expensesRef.current = expenses; }, [expenses]);
  useEffect(() => { partnersRef.current = partners; }, [partners]);
  useEffect(() => { carsRef.current = cars; }, [cars]);
  useEffect(() => { packagesRef.current = packages; }, [packages]);
  useEffect(() => { couponsRef.current = coupons; }, [coupons]);
  useEffect(() => { customersRef.current = customers; }, [customers]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { companyDocumentsRef.current = companyDocuments; }, [companyDocuments]);
  useEffect(() => { carExpensesRef.current = carExpenses; }, [carExpenses]);
  useEffect(() => { companyExpensesRef.current = companyExpenses; }, [companyExpenses]);
  useEffect(() => { companySimsRef.current = companySims; }, [companySims]);

  const getLatestStateRef = (colName) => {
    switch (colName) {
      case 'bookings': return bookingsRef;
      case 'drivers': return driversRef;
      case 'expenses': return expensesRef;
      case 'partners': return partnersRef;
      case 'cars': return carsRef;
      case 'packages': return packagesRef;
      case 'coupons': return couponsRef;
      case 'customers': return customersRef;
      case 'settings': return settingsRef;
      case 'company_documents': return companyDocumentsRef;
      case 'car_expenses': return carExpensesRef;
      case 'company_expenses': return companyExpensesRef;
      case 'company_sims': return companySimsRef;
      default: return null;
    }
  };

  // 3. MySQL REST Sync Factory
  const createFirestoreSync = (colName, currentStateDummy, localSetter) => {
    return async (value) => {
      const stateRef = getLatestStateRef(colName);
      const currentState = stateRef ? stateRef.current : [];
      
      let nextList;
      if (typeof value === 'function') {
        nextList = value(currentState);
      } else {
        nextList = value;
      }
      
      // Update local state synchronously for instant UI
      localSetter(nextList);

      try {
        // Find added or modified items
        for (const nextItem of nextList) {
          const currentItem = currentState.find(c => c.id === nextItem.id);
          if (!currentItem || JSON.stringify(currentItem) !== JSON.stringify(nextItem)) {
            const res = await fetch(`api.php?action=save&table=${colName}&company_id=${companyId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(nextItem)
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const result = await res.json();
            if (result.status !== 'success') {
              throw new Error(result.message || 'Database rejected payload.');
            }
          }
        }

        // Find deleted items
        for (const currentItem of currentState) {
          if (!nextList.some(n => n.id === currentItem.id)) {
            const res = await fetch(`api.php?action=delete&table=${colName}&company_id=${companyId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: currentItem.id })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const result = await res.json();
            if (result.status !== 'success') {
              throw new Error(result.message || 'Database rejected deletion.');
            }
          }
        }
      } catch (e) {
        console.error(`Error syncing ${colName} update to MySQL:`, e);
        alert(`Database Sync Error: Failed to save changes in '${colName}' table on your hosting server.\n\nDetails: ${e.message || e}\n\nNote: Changes are saved in your browser locally, but please verify your database connection.`);
      }
    };
  };

  const [syncStatus, setSyncStatus] = useState(''); // 'saving', 'saved', 'error', ''

  const handleSyncDatabase = async () => {
    setSyncStatus('saving');
    try {
      const payload = { bookings, drivers, expenses, partners, cars };
      const res = await fetch(`api.php?action=reseed&company_id=${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.status === 'success') {
        setSyncStatus('saved');
        setTimeout(() => setSyncStatus(''), 2500);
      } else {
        throw new Error(result.message);
      }
    } catch (e) {
      console.error("Manual database sync failed:", e);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus(''), 4000);
      alert(`Failed to save database. Error: ${e.message || e}`);
    }
  };

  const handleReseedDatabase = async () => {
    const confirmReseed = window.confirm(
      "CAUTION: This will overwrite ALL data in the database with the local template files (including the latest bookings imported from the PDF). " +
      "Any modifications done directly on the web app which were not committed will be lost. Do you want to proceed?"
    );
    if (!confirmReseed) return;
    
    setSyncStatus('saving');
    try {
      const payload = {
        bookings: initialBookings,
        drivers: initialDrivers,
        expenses: initialExpenses,
        partners: initialPartners,
        cars: initialCars
      };
      
      const res = await fetch(`api.php?action=reseed&company_id=${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      if (result.status !== 'success') {
        throw new Error(result.message);
      }

      // Clear local storage cache of current variables
      localStorage.removeItem('safari_bookings');
      localStorage.removeItem('safari_cars');
      localStorage.removeItem('safari_drivers');
      localStorage.removeItem('safari_partners');
      localStorage.removeItem('safari_expenses');

      alert("Database reset and reseeded successfully from local template files! The page will now reload.");
      window.location.reload();
    } catch (e) {
      console.error("Reseed failed:", e);
      alert(`Reseed failed. Error: ${e.message || e}`);
    }
  };

  const handleForceSyncBooking = async (booking) => {
    try {
      const res = await fetch(`api.php?action=save&table=bookings&company_id=${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking)
      });
      const result = await res.json();
      if (result.status === 'success') {
        alert(`Booking ${booking.customerName} (Ref: ${booking.id}) synced to database successfully!`);
      } else {
        throw new Error(result.message);
      }
    } catch (e) {
      console.error("Force sync booking failed:", e);
      alert(`Failed to sync booking to database. Error: ${e.message || e}`);
    }
  };

  const setBookingsCustom = createFirestoreSync('bookings', bookings, setBookings);
  const setDriversCustom = createFirestoreSync('drivers', drivers, setDrivers);
  const setExpensesCustom = createFirestoreSync('expenses', expenses, setExpenses);
  const setPartnersCustom = createFirestoreSync('partners', partners, setPartners);
  const setCarsCustom = createFirestoreSync('cars', cars, setCars);
  const setPackagesCustom = createFirestoreSync('packages', packages, setPackages);
  const setCouponsCustom = createFirestoreSync('coupons', coupons, setCoupons);
  const setCustomersCustom = createFirestoreSync('customers', customers, setCustomers);
  const setCompanyDocumentsCustom = createFirestoreSync('company_documents', companyDocuments, setCompanyDocuments);
  const setCarExpensesCustom = createFirestoreSync('car_expenses', carExpenses, setCarExpenses);
  const setCompanyExpensesCustom = createFirestoreSync('company_expenses', companyExpenses, setCompanyExpenses);
  const setCompanySimsCustom = createFirestoreSync('company_sims', companySims, setCompanySims);

  // Tab Header Mapping
  const tabTitles = {
    dashboard: 'Dashboard',
    bookings: 'Bookings',
    customers: 'Customers',
    drivers: 'Drivers',
    expenses: 'Trip Expenses',
    packages: 'Packages & Coupons',
    partners: 'Partners & Invoices',
    carsFreelancers: 'Cars & Freelancers',
    carFinance: 'Car Finance',
    carExpenses: 'Car Expenses',
    companyExpenses: 'Company Expenses',
    whatsappAgent: 'WhatsApp Sandbox',
    adminAssistant: 'AI Assistant',
    companyDetails: 'Company Setup',
    companyDocuments: 'Company Documents'
  };

  // Update browser window tab title to match current panel
  useEffect(() => {
    if (isCustomerView) {
      document.title = "Roar Adventure Tourism - Special Safari Packages Booking";
    } else {
      document.title = `Roar Safari ERP - ${tabTitles[activeTab] || 'Dashboard'}`;
    }
  }, [activeTab, isCustomerView]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
  };

  if (isCustomerView) {
    return (
      <CustomerBookingView 
        bookings={bookings} 
        setBookings={setBookingsCustom} 
        partners={partners} 
        packages={packages}
        coupons={coupons}
        customers={customers}
        setCustomers={setCustomersCustom}
        settings={settings}
      />
    );
  }

  const handleLoginSuccess = (role, company_id, company) => {
    if (role === 'register_wizard') {
      setUserRole('register_wizard');
      setIsAuthenticated(true);
      return;
    }

    sessionStorage.setItem('safari_admin_authenticated', 'true');
    sessionStorage.setItem('safari_user_role', role);
    setIsAuthenticated(true);
    setUserRole(role);

    if (role === 'company_admin') {
      sessionStorage.setItem('safari_company_id', company_id);
      setCompanyId(company_id);
      if (company) {
        const mappedDetails = {
          id: company.id,
          fullName: company.name,
          address: company.address,
          contactPerson: company.contactPerson,
          whatsapp: company.whatsapp,
          email: company.email,
          regDate: company.createdAt ? company.createdAt.split(' ')[0] : '2016-01-01',
          licenseNo: 'DET/DTCM Licensed Tour Operator',
          whatWeOffer: 'Morning Safari, Evening Safari, VIP Safari, City Tours',
          logo: company.logo || ''
        };
        setCompanyDetails(mappedDetails);
        localStorage.setItem('safari_company_details', JSON.stringify(mappedDetails));
      }
    }
  };

  const handleSignOut = () => {
    sessionStorage.removeItem('safari_admin_authenticated');
    sessionStorage.removeItem('safari_user_role');
    sessionStorage.removeItem('safari_company_id');
    sessionStorage.removeItem('safari_is_impersonating');
    localStorage.removeItem('safari_company_details');
    setIsAuthenticated(false);
    setUserRole(null);
    setCompanyId('roar');
    setIsImpersonating(false);
  };

  const handleImpersonate = (compId, company) => {
    sessionStorage.setItem('safari_is_impersonating', 'true');
    sessionStorage.setItem('safari_company_id', compId);
    sessionStorage.setItem('safari_user_role', 'company_admin');
    
    setCompanyId(compId);
    setUserRole('company_admin');
    setIsImpersonating(true);

    if (company) {
      const mappedDetails = {
        id: company.id,
        fullName: company.name,
        address: company.address,
        contactPerson: company.contactPerson,
        whatsapp: company.whatsapp,
        email: company.email,
        regDate: company.createdAt ? company.createdAt.split(' ')[0] : '2016-01-01',
        licenseNo: 'DET/DTCM Licensed Tour Operator',
        whatWeOffer: 'Morning Safari, Evening Safari, VIP Safari, City Tours',
        logo: company.logo || '',
        features: typeof company.features === 'string' ? JSON.parse(company.features) : company.features
      };
      setCompanyDetails(mappedDetails);
      localStorage.setItem('safari_company_details', JSON.stringify(mappedDetails));
    }
  };

  const handleExitImpersonation = () => {
    sessionStorage.removeItem('safari_is_impersonating');
    sessionStorage.setItem('safari_user_role', 'master_admin');
    sessionStorage.removeItem('safari_company_id');
    localStorage.removeItem('safari_company_details');
    
    setIsImpersonating(false);
    setUserRole('master_admin');
    setCompanyId('roar');
  };

  if (!isAuthenticated) {
    return (
      <LoginView 
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }



  if (userRole === 'master_admin') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Master Admin Portal</h2>
        <p>Master Admin View is currently offline.</p>
        <button onClick={handleSignOut} className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 'bold' }}>Sign Out</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {isImpersonating && (
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: '#ffffff',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: '800',
          fontSize: '13.5px',
          zIndex: 9999,
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={16} /> Impersonation Mode Active: Logged in as {companyDetails.fullName || 'Tenant'} (Master Admin Session)
          </span>
          <button 
            onClick={handleExitImpersonation} 
            className="btn" 
            style={{ 
              background: '#ffffff', 
              color: '#d97706', 
              padding: '6px 14px', 
              fontSize: '12px', 
              fontWeight: '700', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#fef3c7'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
          >
            Return to Master Admin Control Panel
          </button>
        </div>
      )}
      <div className="app-container" style={{ flex: 1, display: 'flex' }}>
        {/* Sidebar mobile overlay background click */}
        {isMobileSidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
        )}

        {/* Sidebar Navigation */}
        <aside className={`sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="logo-section" style={{ position: 'relative', background: '#ffffff', borderRadius: '10px', margin: '14px', padding: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.05)' }}>
          <img src={companyDetails.logo || "/logo.jpg"} alt="Company Logo" style={{ width: '100%', maxHeight: '48px', objectFit: 'contain' }} />
          {isMobileSidebarOpen && (
            <button 
              onClick={() => setIsMobileSidebarOpen(false)} 
              style={{ 
                position: 'absolute', 
                top: '12px', 
                right: '12px', 
                background: 'rgba(255,255,255,0.8)', 
                border: '1px solid var(--border)', 
                color: 'var(--text-muted)', 
                cursor: 'pointer',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <ul className="nav-links">
          <li>
            <div 
              onClick={() => handleTabChange('dashboard')} 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              <LayoutDashboard /> Dashboard BI
            </div>
          </li>
          <li>
            <div 
              onClick={() => handleTabChange('bookings')} 
              className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
            >
              <CalendarRange /> Bookings
            </div>
          </li>
          <li>
            <div 
              onClick={() => handleTabChange('customers')} 
              className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
            >
              <Users /> Customers
            </div>
          </li>
          <li>
            <div 
              onClick={() => handleTabChange('drivers')} 
              className={`nav-item ${activeTab === 'drivers' ? 'active' : ''}`}
            >
              <Car /> Drivers
            </div>
          </li>
          {(!companyDetails.features || companyDetails.features.coupons !== false) && (
            <li>
              <div 
                onClick={() => handleTabChange('packages')} 
                className={`nav-item ${activeTab === 'packages' ? 'active' : ''}`}
              >
                <Compass /> Packages & Coupons
              </div>
            </li>
          )}
          {(!companyDetails.features || companyDetails.features.partners_portal !== false) && (
            <li>
              <div 
                onClick={() => handleTabChange('partners')} 
                className={`nav-item ${activeTab === 'partners' ? 'active' : ''}`}
              >
                <Handshake /> Partners & Invoices
              </div>
            </li>
          )}
          <li>
            <div 
              onClick={() => handleTabChange('carsFreelancers')} 
              className={`nav-item ${activeTab === 'carsFreelancers' ? 'active' : ''}`}
            >
              <Car /> Cars / Freelancers
            </div>
          </li>
          {(!companyDetails.features || companyDetails.features.finance_ledger !== false) && (
            <li>
              <div 
                onClick={() => handleTabChange('carFinance')} 
                className={`nav-item ${activeTab === 'carFinance' ? 'active' : ''}`}
              >
                <Receipt /> Car Finance Ledger
              </div>
            </li>
          )}
          <li>
            <div 
              onClick={() => handleTabChange('carExpenses')} 
              className={`nav-item ${activeTab === 'carExpenses' ? 'active' : ''}`}
            >
              <Wrench /> Car Expenses
            </div>
          </li>
          <li>
            <div 
              onClick={() => handleTabChange('companyExpenses')} 
              className={`nav-item ${activeTab === 'companyExpenses' ? 'active' : ''}`}
            >
              <Building2 /> Company Expenses
            </div>
          </li>
          <li>
            <div 
              onClick={() => handleTabChange('companyDocuments')} 
              className={`nav-item ${activeTab === 'companyDocuments' ? 'active' : ''}`}
            >
              <FileText /> Company Documents
            </div>
          </li>
          {(!companyDetails.features || companyDetails.features.ai_assistant !== false) && (
            <li>
              <div 
                onClick={() => handleTabChange('adminAssistant')} 
                className={`nav-item ${activeTab === 'adminAssistant' ? 'active' : ''}`}
              >
                <Sparkles /> AI Admin Assistant
              </div>
            </li>
          )}
        </ul>

        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            onClick={handleSignOut}
            className="btn btn-secondary" 
            style={{ width: '100%', fontSize: '11px', padding: '6px 12px', justifyContent: 'center' }}
          >
            Sign Out
          </button>
          <div style={{ textAlign: 'center' }}>
            <div>Dubai Desert Safari</div>
            <div style={{ fontSize: '10px', marginTop: '4px', color: 'var(--text-muted)' }}>v2.0 Premium ERP</div>
          </div>
        </div>
      </aside>

      {/* Main Panel View */}
      <main className="main-content">
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="mobile-hamburger" onClick={() => setIsMobileSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <img 
              src={companyDetails.logo || "/logo.jpg"} 
              alt="Company Logo" 
              className="mobile-logo-topbar" 
              style={{ maxHeight: '36px', objectFit: 'contain' }}
            />
            <h2 className="topbar-title">{tabTitles[activeTab]}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            <div 
              onClick={() => setIsProfilePopupOpen(true)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                cursor: 'pointer', 
                background: 'rgba(140, 91, 48, 0.05)', 
                padding: '6px 12px', 
                borderRadius: '30px', 
                border: '1px solid rgba(140, 91, 48, 0.1)', 
                transition: 'all 0.2s',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(140, 91, 48, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(140, 91, 48, 0.05)'}
            >
              <img 
                src={companyDetails.logo || "/logo.jpg"} 
                alt="Company Icon" 
                style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'contain', background: '#fff', border: '1px solid rgba(0,0,0,0.05)' }} 
              />
              <span style={{ fontSize: '12.5px', fontWeight: '800', color: 'var(--text-dark)' }}>Admin</span>
            </div>
          </div>
        </header>

        <section className="view-container">
          {activeTab === 'dashboard' && (
            <DashboardView 
              bookings={bookings} 
              drivers={drivers} 
              expenses={expenses} 
              partners={partners}
              packages={packages}
              setActiveTab={handleTabChange}
              dateFilter={filterDateRange}
              setDateFilter={setFilterDateRange}
              startDate={customStartDate}
              setStartDate={setCustomStartDate}
              endDate={customEndDate}
              setEndDate={setCustomEndDate}
              setFilterPartner={setFilterPartner}
              setFilterDriver={setFilterDriver}
              setViewingBookingFromDashboard={setViewingBookingFromDashboard}
              setViewingDriverFromDashboard={setViewingDriverFromDashboard}
              setActiveCardFilter={setFilterStatus}
              settings={settings}
              onSaveSetting={saveSetting}
            />
          )}

          {activeTab === 'bookings' && (
            <BookingsView 
              bookings={bookings} 
              setBookings={setBookingsCustom} 
              drivers={drivers} 
              partners={partners} 
              expenses={expenses}
              packages={packages}
              coupons={coupons}
              onForceSyncBooking={handleForceSyncBooking}
              settings={settings}
              onSaveSetting={saveSetting}
              filterPartner={filterPartner}
              setFilterPartner={setFilterPartner}
              filterDriver={filterDriver}
              setFilterDriver={setFilterDriver}
              filterDateRange={filterDateRange}
              setFilterDateRange={setFilterDateRange}
              customStartDate={customStartDate}
              setCustomStartDate={setCustomStartDate}
              customEndDate={customEndDate}
              setCustomEndDate={setCustomEndDate}
              viewingBookingFromDashboard={viewingBookingFromDashboard}
              setViewingBookingFromDashboard={setViewingBookingFromDashboard}
              activeCardFilter={filterStatus}
              setActiveCardFilter={setFilterStatus}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView 
              bookings={bookings} 
              drivers={drivers}
              packages={packages}
              registeredCustomers={customers}
            />
          )}

          {activeTab === 'drivers' && (
            <DriversView 
              drivers={drivers} 
              setDrivers={setDriversCustom} 
              bookings={bookings} 
              expenses={expenses} 
              packages={packages}
              setActiveTab={handleTabChange}
              viewingDriverFromDashboard={viewingDriverFromDashboard}
              setViewingDriverFromDashboard={setViewingDriverFromDashboard}
            />
          )}

          {activeTab === 'packages' && (
            <PackagesView 
              packages={packages} 
              setPackages={setPackagesCustom} 
              coupons={coupons} 
              setCoupons={setCouponsCustom} 
              settings={settings}
              onSaveSetting={saveSetting}
            />
          )}

          {activeTab === 'partners' && (
            <PartnersView 
              partners={partners} 
              setPartners={setPartnersCustom} 
              bookings={bookings} 
              packages={packages}
            />
          )}

          {activeTab === 'carsFreelancers' && (
            <CarFinanceView 
              cars={cars} 
              setCars={setCarsCustom} 
              drivers={drivers}
              viewMode="registry"
              carDocuments={carDocuments}
              setCarDocuments={setCarDocumentsCustom}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'carFinance' && (
            <CarFinanceView 
              cars={cars} 
              setCars={setCarsCustom} 
              drivers={drivers}
              viewMode="ledger"
              carDocuments={carDocuments}
              setCarDocuments={setCarDocumentsCustom}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'carExpenses' && (
            <CarExpensesView 
              carExpenses={carExpenses} 
              setCarExpenses={setCarExpensesCustom} 
              cars={cars} 
              drivers={drivers}
              companyId={companyId}
              carDocuments={carDocuments}
              setCarDocuments={setCarDocumentsCustom}
            />
          )}

          {activeTab === 'companyExpenses' && (
            <CompanyExpensesView 
              companyExpenses={companyExpenses} 
              setCompanyExpenses={setCompanyExpensesCustom} 
              companySims={companySims} 
              setCompanySims={setCompanySimsCustom} 
              companyDetails={companyDetails}
              companyId={companyId}
            />
          )}

          {activeTab === 'companyDocuments' && (
            <CompanyDocumentsView 
              documents={companyDocuments} 
              setDocuments={setCompanyDocumentsCustom} 
              settings={settings}
              onSaveSetting={saveSetting}
            />
          )}

          {activeTab === 'adminAssistant' && (
            <AdminAssistantView 
              bookings={bookings}
              setBookings={setBookingsCustom}
              drivers={drivers}
              coupons={coupons}
              setCoupons={setCouponsCustom}
              cars={cars}
              carDocuments={carDocuments}
              packages={packages}
              partners={partners}
              carExpenses={carExpenses}
              companyExpenses={companyExpenses}
            />
          )}
        </section>
      </main>
      {/* Admin Profile Details Modal */}
      {isProfilePopupOpen && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div 
            className="modal-content" 
            style={{ 
              maxWidth: profileTab === 'companyInfo' ? '900px' : '450px', 
              textAlign: 'center', 
              padding: '24px 32px 32px 32px',
              transition: 'max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {/* Tab Bar Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              borderBottom: '1px solid var(--border-light)', 
              paddingBottom: '12px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', gap: '20px' }}>
                <button 
                  onClick={() => setProfileTab('adminInfo')}
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    border: 'none',
                    background: 'none',
                    color: profileTab === 'adminInfo' ? 'var(--primary-dark)' : 'var(--text-muted)',
                    borderBottom: profileTab === 'adminInfo' ? '3px solid var(--primary)' : '3px solid transparent',
                    paddingBottom: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                >
                  Admin Info
                </button>
                <button 
                  onClick={() => setProfileTab('companyInfo')}
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    border: 'none',
                    background: 'none',
                    color: profileTab === 'companyInfo' ? 'var(--primary-dark)' : 'var(--text-muted)',
                    borderBottom: profileTab === 'companyInfo' ? '3px solid var(--primary)' : '3px solid transparent',
                    paddingBottom: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                >
                  Company Setup
                </button>
              </div>
              <button 
                onClick={() => setIsProfilePopupOpen(false)} 
                className="modal-close" 
                style={{ 
                  position: 'static', 
                  fontSize: '22px', 
                  color: 'var(--text-muted)', 
                  border: 'none', 
                  background: 'none', 
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                &times;
              </button>
            </div>
            
            {profileTab === 'adminInfo' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '12px 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)' }}>
                  <img src={companyDetails.logo || "/logo.jpg"} alt={companyDetails.fullName || "Company Logo"} style={{ maxHeight: '42px', objectFit: 'contain' }} />
                </div>
                
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.015)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', fontSize: '13px', textAlign: 'left', marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Name:</span>
                    <span style={{ fontWeight: '700', color: 'var(--text-dark)' }}>{companyDetails.contactPerson || "Operations Manager"}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Company:</span>
                    <span style={{ fontWeight: '700' }}>{companyDetails.fullName || "Desert Safari Company"}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Email:</span>
                    <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{companyDetails.email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Phone:</span>
                    <span style={{ fontWeight: '700' }}>{companyDetails.whatsapp}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Database Status:</span>
                    <span style={{ fontWeight: '700', color: dbStatus === 'success' ? 'var(--success)' : '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {dbStatus === 'success' ? (
                        <>
                          <ShieldCheck size={14} /> MySQL Connected
                        </>
                      ) : (
                        <>
                          <Database size={14} /> Local Offline Mode
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '8px' }}>
                  <button 
                    onClick={() => setIsProfilePopupOpen(false)} 
                    className="btn btn-secondary"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      setIsProfilePopupOpen(false);
                      handleSignOut();
                    }} 
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: 'center', background: '#ef4444', borderColor: '#ef4444' }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ maxHeight: 'calc(90vh - 120px)', overflowY: 'auto', paddingRight: '4px', textAlign: 'left' }}>
                <CompanyDetailsView 
                  companyDetails={companyDetails}
                  onSave={updateCompanyDetails}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Direct QR Scan Booking Verification Pass Modal */}
      {verifyBookingData && (
        <BookingVerificationModal 
          booking={(() => {
            const found = (bookings || []).find(b => 
              b.id === verifyBookingData.id || 
              (b.id || '').replace(/^book-/, '').toLowerCase() === (verifyBookingData.id || '').replace(/^book-/, '').toLowerCase()
            );
            return found || verifyBookingData;
          })()} 
          onClose={() => {
            setVerifyBookingData(null);
            const cleanUrl = window.location.pathname + (window.location.hash || '');
            window.history.replaceState({}, document.title, cleanUrl);
          }}
          onUpdateBookingStatus={(id, newStatus) => {
            setBookings(prev => (prev || []).map(b => b.id === id ? { ...b, status: newStatus } : b));
          }}
          drivers={drivers}
          partners={partners}
        />
      )}
      </div>
    </div>
  );
}
