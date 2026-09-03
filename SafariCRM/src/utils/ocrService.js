import Tesseract from 'tesseract.js';

/**
 * Standardize dates to YYYY-MM-DD or DD-MM-YYYY
 */
function normalizeDate(str) {
  if (!str) return '';
  // match DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/(\b\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4}\b)/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  // match YYYY/MM/DD or YYYY-MM-DD
  const ymdMatch = str.match(/(\b\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2}\b)/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return '';
}

/**
 * Pre-process image via Canvas for highest OCR accuracy
 */
function preprocessImage(imageSource) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxDim = 1800;
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        // Enhance contrast and binarize for clean text edges
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          // Greyscale
          const grey = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          // High contrast threshold
          const contrast = grey > 135 ? 255 : (grey < 90 ? 0 : grey);
          data[i] = contrast;
          data[i + 1] = contrast;
          data[i + 2] = contrast;
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        // Fallback to original image
        resolve(imageSource);
      }
    };
    img.onerror = () => resolve(imageSource);
    img.src = imageSource;
  });
}

/**
 * Parse OCR raw text to extract UAE Mulkiya, License, Insurance, and vehicle details
 */
export function parseDocumentOCRText(rawText = '') {
  const text = rawText.replace(/\r\n/g, '\n');
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const result = {
    brand: '',
    model: '',
    owner: '',
    plateNo: '',
    licenseNo: '',
    regDate: '',
    expDate: '',
    insCompany: '',
    policyNo: '',
    insExp: '',
    chassisNo: '',
    color: '',
    passengers: '',
    category: 'Other',
    detectedDocumentType: 'Document',
    rawText: text
  };

  // 1. Detect Brand & Vehicle Model
  const knownBrands = [
    { brand: 'Toyota', model: 'Land Cruiser' },
    { brand: 'Toyota', model: 'Prado' },
    { brand: 'Toyota', model: 'Fortuner' },
    { brand: 'Toyota', model: 'Hilux' },
    { brand: 'Nissan', model: 'Patrol' },
    { brand: 'Nissan', model: 'Armada' },
    { brand: 'Nissan', model: 'Pathfinder' },
    { brand: 'Lexus', model: 'LX600' },
    { brand: 'Lexus', model: 'LX570' },
    { brand: 'Lexus', model: 'GX460' },
    { brand: 'Ford', model: 'Expedition' },
    { brand: 'Ford', model: 'Explorer' },
    { brand: 'Mitsubishi', model: 'Pajero' },
    { brand: 'GMC', model: 'Yukon' },
    { brand: 'Chevrolet', model: 'Tahoe' },
    { brand: 'Mercedes-Benz', model: 'G-Class' },
    { brand: 'Land Rover', model: 'Defender' }
  ];

  for (const kb of knownBrands) {
    const regBrand = new RegExp(kb.brand, 'i');
    const regModel = new RegExp(kb.model, 'i');
    if (regModel.test(text)) {
      result.brand = `${kb.brand} ${kb.model}`;
      break;
    } else if (regBrand.test(text) && !result.brand) {
      result.brand = kb.brand;
    }
  }

  // 2. Year / Model Year (e.g. 2021, 2022, 2023, 2024, 2025, 2026)
  const yearMatch = text.match(/\b(201[5-9]|202[0-9])\b/);
  if (yearMatch) {
    result.model = yearMatch[1];
  }

  // 3. Plate Number / Registration Number
  // Matches UAE plates: e.g. FF79157, EE66074, BB23370, DD21596, DXB 12345, or code + number
  const plateMatch = text.match(/\b([A-Z]{1,3}\s*\d{3,6})\b/i) || 
                     text.match(/\bPlate\s*(?:No|Number|\#)?[:\s]*([A-Z0-9\s]+)\b/i) ||
                     text.match(/\bReg(?:istration)?\s*(?:No|\#)?[:\s]*([A-Z0-9\s]+)\b/i);
  if (plateMatch) {
    result.plateNo = plateMatch[1].replace(/\s+/g, '').toUpperCase();
  }

  // 4. Trade License Number (if commercial license)
  const licMatch = text.match(/\b(?:License|Licence|Trade License|CN)\s*(?:No|Number|\#)?[:\s]*(\d{5,10})\b/i) ||
                   text.match(/\b(?:رقم الرخصة|رخصة تجارية)\s*[:\s]*(\d{5,10})\b/);
  if (licMatch) {
    result.licenseNo = licMatch[1].trim();
  }

  // 5. Chassis Number (VIN - 17 alphanumeric characters, usually starts with JTM for Toyota Land Cruiser)
  const vinMatch = text.match(/\b([A-HJ-NPR-Z0-9]{17})\b/i) ||
                   text.match(/Chassis\s*(?:No|\#)?[:\s]*([A-Z0-9]{10,17})/i);
  if (vinMatch) {
    result.chassisNo = vinMatch[1].toUpperCase();
  }

  // 6. Owner / Company Name
  // Look for "Owner:", "Name:", "Issued To:", "Customer:", "M/s", "LLC"
  const ownerMatch = text.match(/(?:Owner|Issued To|Name|Customer|Holder|Client|Company|M\/s|السيد|المالك)[:\s]+([A-Za-z0-9\s\.\,\&]{3,40})/i);
  if (ownerMatch) {
    const cleanedOwner = ownerMatch[1].split('\n')[0].replace(/^(Name|Mr|Mrs|Ms|Company)\s*/i, '').trim();
    if (cleanedOwner.length > 2 && !cleanedOwner.match(/Date|Expiry|Plate|Chassis/i)) {
      result.owner = cleanedOwner;
    }
  } else if (/Roar Adventure/i.test(text)) {
    result.owner = 'Roar Adventure Tourism LLC';
  }

  // 7. Dates Extraction (Issue Date / Registration Date vs Expiry Date)
  // Look specifically for lines with keywords
  lines.forEach(line => {
    const lower = line.toLowerCase();
    const dateInLine = normalizeDate(line);

    if (dateInLine) {
      if (lower.includes('expiry') || lower.includes('expire') || lower.includes('valid until') || lower.includes('to date') || lower.includes('انتهاء')) {
        if (!result.expDate) result.expDate = dateInLine;
      } else if (lower.includes('issue') || lower.includes('reg') || lower.includes('from date') || lower.includes('اصدار') || lower.includes('تسجيل')) {
        if (!result.regDate) result.regDate = dateInLine;
      } else if (lower.includes('insurance') || lower.includes('policy')) {
        if (!result.insExp) result.insExp = dateInLine;
      }
    }
  });

  // Fallback dates if keywords didn't catch all
  const allDates = [...text.matchAll(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/g)]
    .map(m => normalizeDate(m[0]))
    .filter(Boolean);

  if (allDates.length > 0) {
    if (!result.regDate) result.regDate = allDates[0];
    if (!result.expDate && allDates.length > 1) {
      // Pick the latest date as expiry
      const sorted = [...allDates].sort();
      result.expDate = sorted[sorted.length - 1];
    }
  }

  // 8. Insurance Company & Policy Number
  const knownInsurers = [
    'Orient Insurance',
    'Sukoon Insurance',
    'Oman Insurance',
    'Dubai Insurance',
    'Al Sagr Insurance',
    'Tokio Marine',
    'GIG Gulf',
    'AXA Insurance',
    'Abu Dhabi National Insurance (ADNIC)',
    'Watania Takaful',
    'Takaful Emarat',
    'Salama Islamic Arab Insurance',
    'Al Buhaira Insurance'
  ];

  for (const ins of knownInsurers) {
    if (new RegExp(ins, 'i').test(text)) {
      result.insCompany = ins;
      break;
    }
  }

  const policyMatch = text.match(/\b(?:Policy|Certificate|Cert)\s*(?:No|Number|\#)?[:\s]*([A-Z0-9\/\-]{5,20})\b/i);
  if (policyMatch) {
    result.policyNo = policyMatch[1].trim();
  }

  // Insurance expiry often aligns with vehicle expiry or +1 month
  if (!result.insExp && result.expDate) {
    result.insExp = result.expDate;
  }

  // 9. Color & Capacity
  const colors = ['White', 'Pearl White', 'Black', 'Silver', 'Grey', 'Gray', 'Gold', 'Beige', 'Blue', 'Red', 'Brown'];
  for (const c of colors) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(text)) {
      result.color = c;
      break;
    }
  }

  const passMatch = text.match(/(?:Capacity|Passengers|Seats|Pass)[:\s]*(\d{1,2})/i);
  if (passMatch) {
    result.passengers = parseInt(passMatch[1], 10);
  } else if (/Land Cruiser|Patrol/i.test(result.brand)) {
    result.passengers = 7;
  }

  // 10. Document Classification
  if (/Registration|Mulkiya|Veh(?:icle)?\s*Reg|ملكيه|ملكية/i.test(text)) {
    result.category = 'Mulkiya';
    result.detectedDocumentType = 'Vehicle Registration (Mulkiya)';
  } else if (/Insurance|Policy|Takaful|تأمين/i.test(text)) {
    result.category = 'Insurance';
    result.detectedDocumentType = 'Insurance Certificate';
  } else if (/Passing|Inspection|RTA Test|فحص/i.test(text)) {
    result.category = 'Passing';
    result.detectedDocumentType = 'RTA Technical Passing Test';
  } else if (/Tracker|GPS|Telematics|تتبع/i.test(text)) {
    result.category = 'Tracker';
    result.detectedDocumentType = 'GPS Tracker Certificate';
  } else if (/License|Trade License|Commercial|رخصة/i.test(text)) {
    result.category = 'License';
    result.detectedDocumentType = 'Commercial Trade License';
  } else if (/Tenancy|Ejari|Lease|عقد ايجار|إيجاري/i.test(text)) {
    result.category = 'Lease';
    result.detectedDocumentType = 'Ejari Tenancy Contract';
  }

  return result;
}

/**
 * Main OCR recognition function
 * Accepts file (File/Blob) or Data URL string, runs Tesseract OCR and parses fields
 */
export async function performDocumentOCR(fileOrDataUrl, onProgress = null) {
  let dataUrl = '';
  
  if (typeof fileOrDataUrl === 'string') {
    dataUrl = fileOrDataUrl;
  } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
    dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    });
  } else {
    throw new Error('Invalid file format provided to OCR engine.');
  }

  if (onProgress) onProgress({ status: 'Enhancing document image contrast...', progress: 15 });

  // Pre-process image via canvas
  const preprocessed = await preprocessImage(dataUrl);

  if (onProgress) onProgress({ status: 'Scanning text with Tesseract OCR engine...', progress: 35 });

  try {
    const { data: { text } } = await Tesseract.recognize(
      preprocessed,
      'eng',
      {
        logger: (m) => {
          if (onProgress && m.status === 'recognizing text') {
            const pct = Math.round(35 + (m.progress || 0) * 55);
            onProgress({ status: `Reading document (${Math.round((m.progress || 0) * 100)}%)...`, progress: pct });
          }
        }
      }
    );

    if (onProgress) onProgress({ status: 'Analyzing and extracting fields...', progress: 95 });

    const extracted = parseDocumentOCRText(text || '');

    if (onProgress) onProgress({ status: 'OCR Complete!', progress: 100 });

    return {
      success: true,
      data: extracted,
      rawText: text
    };
  } catch (err) {
    console.warn('Tesseract OCR engine encountered an issue:', err);
    // Fallback parser if text can be detected
    return {
      success: false,
      error: err.message || 'Failed to extract text from document',
      data: parseDocumentOCRText('')
    };
  }
}
