import React, { useState, useRef } from 'react';
import { Sparkles, UploadCloud, CheckCircle2, AlertCircle, Loader2, FileText, Check } from 'lucide-react';
import { performDocumentOCR } from '../utils/ocrService';

export default function DocumentOcrUploader({ 
  onExtracted, 
  documentTypeHint = 'vehicle', // 'vehicle' | 'company' | 'all'
  label = 'Auto-Fill Details via Document OCR' 
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [scanPercent, setScanPercent] = useState(0);
  const [lastExtractedSummary, setLastExtractedSummary] = useState(null);
  const [attachedFileName, setAttachedFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;

    // Check if image or pdf (case insensitive)
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || (file.name || '').toLowerCase().endsWith('.pdf');
    if (!isImage && !isPdf) {
      setErrorMsg('Please upload a document file (PDF, JPG, PNG, WEBP) for OCR scanning.');
      return;
    }

    setIsScanning(true);
    setErrorMsg('');
    setLastExtractedSummary(null);
    setProgressMsg('Reading file...');
    setScanPercent(10);

    // 1. Read file as Base64 Data URL to preserve attachment with original filename
    const fileSizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    let fileData = '';
    try {
      fileData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } catch (readErr) {
      console.warn("FileReader error:", readErr);
    }

    setAttachedFileName(file.name);

    try {
      const result = await performDocumentOCR(file, ({ status, progress }) => {
        setProgressMsg(status);
        setScanPercent(progress);
      });

      const d = (result && result.data) ? result.data : {};
      
      // Build readable summary of what was found
      const foundList = [];
      if (d.plateNo) foundList.push(`Plate: ${d.plateNo}`);
      if (d.brand) foundList.push(`Brand: ${d.brand}`);
      if (d.model) foundList.push(`Model: ${d.model}`);
      if (d.owner) foundList.push(`Owner: ${d.owner}`);
      if (d.licenseNo) foundList.push(`License #: ${d.licenseNo}`);
      if (d.regDate) foundList.push(`Reg Date: ${d.regDate}`);
      if (d.expDate) foundList.push(`Expiry Date: ${d.expDate}`);
      if (d.insCompany) foundList.push(`Insurer: ${d.insCompany}`);
      if (d.insExp) foundList.push(`Ins Exp: ${d.insExp}`);

      setLastExtractedSummary({
        fileName: file.name,
        fileSize: fileSizeFormatted,
        type: d.detectedDocumentType || (isPdf ? 'PDF Document' : 'Image Document'),
        items: foundList
      });

      // Pass complete payload including original file name and fileData to parent handler
      if (onExtracted) {
        onExtracted({
          ...d,
          fileName: file.name,
          fileData: fileData,
          fileType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
          fileSize: fileSizeFormatted
        }, file);
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setErrorMsg('Could not read all text fields automatically, but the file has been attached. You can review and save.');
      // Even if OCR has an issue, attach the file!
      if (onExtracted) {
        onExtracted({
          fileName: file.name,
          fileData: fileData,
          fileType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
          fileSize: fileSizeFormatted
        }, file);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*,.pdf,.PDF,application/pdf" 
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => !isScanning && fileInputRef.current?.click()}
        style={{
          border: attachedFileName ? '1.8px solid #16a34a' : '1.8px dashed #8c5b30',
          borderRadius: '12px',
          padding: '14px 16px',
          background: isScanning ? 'rgba(140, 91, 48, 0.04)' : (attachedFileName ? '#f0fdf4' : '#fdfbf7'),
          cursor: isScanning ? 'wait' : 'pointer',
          textAlign: 'center',
          transition: 'all 0.2s ease',
          boxSizing: 'border-box'
        }}
      >
        {isScanning ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8c5b30', fontWeight: '800', fontSize: '13px' }}>
              <Loader2 size={18} className="spin" />
              <span>{progressMsg}</span>
            </div>
            {/* Progress bar */}
            <div style={{ width: '100%', maxWidth: '280px', height: '6px', background: '#ede6d9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${scanPercent}%`, height: '100%', background: '#8c5b30', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        ) : attachedFileName ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.15)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#166534' }}>
                  ✓ {attachedFileName} Attached
                </div>
                <div style={{ fontSize: '11px', color: '#15803d' }}>
                  File uploaded & scanned • All matching details auto-filled below (Click to replace)
                </div>
              </div>
            </div>
            <button 
              type="button" 
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '4px 10px', pointerEvents: 'none', background: '#ffffff', color: '#166534', borderColor: '#bbf7d0' }}
            >
              Replace File
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(140, 91, 48, 0.12)', color: '#8c5b30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={18} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#543c2b' }}>
                {label}
              </div>
              <div style={{ fontSize: '11px', color: '#8c7361' }}>
                Upload or drag & drop PDF document, Mulkiya, Insurance policy, or Trade License
              </div>
            </div>
            <button 
              type="button" 
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '4px 10px', marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px', pointerEvents: 'none' }}
            >
              <UploadCloud size={13} /> Select File
            </button>
          </div>
        )}
      </div>

      {/* Success Auto-Fill Notification */}
      {lastExtractedSummary && (
        <div style={{ 
          marginTop: '8px', 
          background: '#f0fdf4', 
          border: '1px solid #bbf7d0', 
          borderRadius: '8px', 
          padding: '9px 12px',
          fontSize: '11.5px',
          color: '#166534'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', marginBottom: '4px' }}>
            <CheckCircle2 size={14} style={{ color: '#16a34a' }} />
            <span>✨ Auto-Filled from {lastExtractedSummary.type}:</span>
          </div>
          {lastExtractedSummary.items.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
              {lastExtractedSummary.items.map((item, idx) => (
                <span key={idx} style={{ background: '#ffffff', border: '1px solid #bbf7d0', padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '700' }}>
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '11px' }}>Document analyzed & attached. Review and modify fields as needed.</div>
          )}
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div style={{ 
          marginTop: '8px', 
          background: '#fff1f2', 
          border: '1px solid #fecdd3', 
          borderRadius: '8px', 
          padding: '8px 12px',
          fontSize: '11.5px',
          color: '#be123c',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
