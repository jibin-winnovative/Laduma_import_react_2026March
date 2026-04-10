import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  X,
  Save,
  Loader2,
  Plus,
  Trash2,
  FileUp,
  ClipboardList,
  FilePenLine,
  Upload,
  FileText,
  Download,
  RefreshCw,
  Trash,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { companiesService } from '../../services/companiesService';
import { suppliersService } from '../../services/suppliersService';
import { portsService } from '../../services/portsService';
import { currencyService, Currency } from '../../services/currencyService';
import { shipmentTypesService, ShipmentType } from '../../services/shipmentTypesService';
import { addonChargesService, AddonCharge } from '../../services/addonChargesService';
import { attachmentService, Attachment as ExistingAttachment } from '../../services/attachmentService';
import { SearchProductModal } from './SearchProductModal';
import type { SearchProductResult } from '../../services/productSearchService';
import { purchaseOrdersService } from '../../services/purchaseOrdersService';
import { removeTrailingZeros } from '../../utils/numberUtils';
import { SupplierForm } from '../Masters/SupplierForm';
import { Modal } from '../../components/ui/Modal';
import { multiply, divide, subtract, toMoney, toNumber, sum } from '../../utils/moneyUtils';
import Decimal from 'decimal.js';
import { ExcelImportErrorModal } from './ExcelImportErrorModal';
import type { MissingItem } from '../../services/purchaseOrdersService';

// Simple validation schema that works with string values from select elements
const poSchema = z.object({
  companyId: z.string().min(1, 'Please select a company'),
  poNumber: z.string().min(1, 'PO Number is required'),
  poDate: z.string().min(1, 'PO Date is required'),
  currencyId: z.string().min(1, 'Please select a currency'),
  supplierId: z.string().min(1, 'Please select a supplier'),
  exportPortId: z.string().min(1, 'Please select an exporter port'),
  importPortId: z.string().min(1, 'Please select an importer port'),
  priceTerms: z.string().min(1, 'Price Terms is required'),
  shipmentTypeId: z.string().min(1, 'Please select a shipment type'),
  modeOfPayment: z.string().min(1, 'Please select mode of payment'),
  modeOfShipment: z.string().min(1, 'Please select mode of shipment'),
  expectedDeliveryMonth: z.string().optional(),
  remarks: z.string().max(500, 'Remarks cannot exceed 500 characters').optional(),
});

type POFormData = z.infer<typeof poSchema>;

interface POItem {
  id: string;
  purchaseOrderItemId?: number | null;
  productId?: number;
  itemCode: string;
  barcode: string;
  itemName: string;
  qty: number;
  uom: string;
  priceUSD: number;
  cbm: number;
  amount: number;
  totalCBM: number;
  receivedQty: number;
  balanceQty: number;
}

interface Charge {
  id: string;
  addonChargeId: number;
  amount: number;
}

interface PaymentTerm {
  id: string;
  purchaseOrderPaymentId?: number | null;
  description: string;
  percentage: number;
  amount: number;
  expectedDate: string;
  status?: string;
  isPaid?: boolean;
  percentageDisplay?: string;
  amountDisplay?: string;
}

interface PendingAttachment {
  id: string;
  type: string;
  file: File;
  status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  progress: number;
  error?: string;
  retryCount: number;
}

interface PurchaseOrderFormProps {
  mode: 'add' | 'edit';
  purchaseOrderId?: number;
  onClose: () => void;
  onSuccess?: (savedPurchaseOrderId?: number) => void;
}

export const PurchaseOrderForm = ({ mode, purchaseOrderId, onClose, onSuccess }: PurchaseOrderFormProps) => {
  const [loading, setLoading] = useState(mode === 'edit' && !!purchaseOrderId);
  const [companies, setCompanies] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [exportPorts, setExportPorts] = useState<any[]>([]);
  const [importPorts, setImportPorts] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [shipmentTypes, setShipmentTypes] = useState<ShipmentType[]>([]);
  const [addonChargeOptions, setAddonChargeOptions] = useState<AddonCharge[]>([]);

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [items, setItems] = useState<POItem[]>([]);
  const [charges, setCharges] = useState<Charge[]>([
    { id: `ch-${Date.now()}`, addonChargeId: 0, amount: 0 }
  ]);
  const [itemValidationErrors, setItemValidationErrors] = useState<Set<string>>(new Set());
  const [chargeValidationErrors, setChargeValidationErrors] = useState<Set<string>>(new Set());
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([
    { id: `pt-${Date.now()}`, description: '', percentage: 0, amount: 0, expectedDate: '' }
  ]);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<number | null>(null);
  const [poNumberError, setPONumberError] = useState<string>('');
  const [checkingPONumber, setCheckingPONumber] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExcelErrorModal, setShowExcelErrorModal] = useState(false);
  const [excelErrorMessage, setExcelErrorMessage] = useState<string>('');
  const [excelErrors, setExcelErrors] = useState<string[]>([]);
  const [excelMissingItems, setExcelMissingItems] = useState<MissingItem[]>([]);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null)[0];

  const roundTo4Decimals = (value: number): number => {
    return Math.round(value * 10000) / 10000;
  };

  const roundTo10Decimals = (value: number): number => {
    return Math.round(value * 10000000000) / 10000000000;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
    getValues,
  } = useForm<POFormData>({
    resolver: zodResolver(poSchema),
    mode: 'onSubmit',
    defaultValues: {
      companyId: '',
      poNumber: '',
      poDate: new Date().toISOString().split('T')[0],
      currencyId: '',
      supplierId: '',
      exportPortId: '',
      importPortId: '',
      priceTerms: '',
      shipmentTypeId: '',
      modeOfPayment: '',
      modeOfShipment: '',
      expectedDeliveryMonth: '',
      remarks: '',
    },
  });

  const selectedSupplierId = watch('supplierId');
  const poNumber = watch('poNumber');
  const companyId = watch('companyId');

  const [displayCurrencyCode, setDisplayCurrencyCode] = useState('');

  const invoiceTotal = useMemo(() => {
    const sub = sum(items.map(item => item.amount));
    const chg = sum(charges.map(charge => charge.amount));
    return roundTo4Decimals(toNumber(sub.plus(chg)));
  }, [items, charges]);

  useEffect(() => {
    setPaymentTerms((prev) =>
      prev.map((term) => {
        if (term.amount > 0) {
          const calculatedPercentage = invoiceTotal > 0 ? toNumber(multiply(divide(term.amount, invoiceTotal), 100)) : 0;
          return {
            ...term,
            percentage: calculatedPercentage,
          };
        } else if (term.percentage > 0) {
          const calculatedAmount = toNumber(divide(multiply(invoiceTotal, term.percentage), 100));
          return {
            ...term,
            amount: calculatedAmount,
          };
        }
        return term;
      })
    );
  }, [invoiceTotal]);

  useEffect(() => {
    let isMounted = true;

    const initializeForm = async () => {
      try {
        console.log('Initializing form - mode:', mode, 'purchaseOrderId:', purchaseOrderId);
        const loadedCurrencies = await fetchDropdownData();
        console.log('Dropdown data fetched');
        if (isMounted && mode === 'edit' && purchaseOrderId) {
          console.log('Loading purchase order data...');
          await fetchPurchaseOrderData(loadedCurrencies);
          console.log('Purchase order data loaded');
        } else {
          // If not in edit mode, clear loading state after dropdown data is loaded
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to initialize form:', error);
        setLoading(false);
      }
    };

    initializeForm();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedSupplierId) return;
    if (mode === 'add') {
      fetchSupplierPaymentTerms(Number(selectedSupplierId));
    }
    suppliersService.getTopPort(Number(selectedSupplierId)).then((topPort) => {
      if (!topPort) return;
      setValue('exportPortId', String(topPort.portId), { shouldValidate: true });
    });
  }, [selectedSupplierId]);

  // Check PO number exists (debounced)
  useEffect(() => {
    if (!poNumber || poNumber.trim() === '') {
      setPONumberError('');
      clearErrors('poNumber');
      return;
    }

    // Skip check in edit mode for the original PO number
    if (mode === 'edit' && purchaseOrderId) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCheckingPONumber(true);
      try {
        console.log('Checking PO Number:', poNumber, 'CompanyId:', companyId);
        const result = await purchaseOrdersService.checkPONumber(
          poNumber,
          companyId && Number(companyId) > 0 ? Number(companyId) : undefined
        );
        console.log('PO Check Result:', result);

        if (result.exists) {
          const errorMsg = 'This PO Number already exists';
          setPONumberError(errorMsg);
          setError('poNumber', { type: 'manual', message: errorMsg });
        } else {
          setPONumberError('');
          clearErrors('poNumber');
        }
      } catch (error) {
        console.error('Failed to check PO number:', error);
      } finally {
        setCheckingPONumber(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [poNumber, companyId, mode, purchaseOrderId, setError, clearErrors]);

  const fetchDropdownData = async (): Promise<Currency[]> => {
    const results = await Promise.allSettled([
      companiesService.getActive(),
      suppliersService.getDropdown(),
      portsService.getByDirection('Export'),
      portsService.getByDirection('Import'),
      currencyService.getActive(),
      shipmentTypesService.getActive(),
      addonChargesService.getActive(),
    ]);

    const [companiesRes, suppliersRes, exportPortsRes, importPortsRes, currenciesRes, shipmentTypesRes, addonChargesRes] = results;

    if (companiesRes.status === 'fulfilled') setCompanies(companiesRes.value || []);
    else console.error('Failed to fetch companies:', companiesRes.reason);

    if (suppliersRes.status === 'fulfilled') setSuppliers(suppliersRes.value || []);
    else console.error('Failed to fetch suppliers:', suppliersRes.reason);

    if (exportPortsRes.status === 'fulfilled') setExportPorts(exportPortsRes.value || []);
    else console.error('Failed to fetch export ports:', exportPortsRes.reason);

    if (importPortsRes.status === 'fulfilled') setImportPorts(importPortsRes.value || []);
    else console.error('Failed to fetch import ports:', importPortsRes.reason);

    if (currenciesRes.status === 'fulfilled') setCurrencies(currenciesRes.value || []);
    else console.error('Failed to fetch currencies:', currenciesRes.reason);

    if (shipmentTypesRes.status === 'fulfilled') setShipmentTypes(shipmentTypesRes.value || []);
    else console.error('Failed to fetch shipment types:', shipmentTypesRes.reason);

    if (addonChargesRes.status === 'fulfilled') setAddonChargeOptions(addonChargesRes.value || []);
    else console.error('Failed to fetch addon charges:', addonChargesRes.reason);

    return currenciesRes.status === 'fulfilled' ? (currenciesRes.value || []) : [];
  };

  const fetchPurchaseOrderData = async (loadedCurrencies: Currency[] = []) => {
    if (!purchaseOrderId) {
      console.error('fetchPurchaseOrderData called without purchaseOrderId');
      return;
    }

    try {
      console.log('Fetching purchase order data for ID:', purchaseOrderId);
      setLoading(true);
      const data = await purchaseOrdersService.getById(purchaseOrderId);
      console.log('Purchase order data loaded:', data);

      // Store current status - API returns 'poStatus' field
      const status = data.poStatus || data.status || '';
      setCurrentStatus(status);

      // Populate form fields
      setValue('companyId', String(data.companyId));
      setValue('poNumber', data.poNumber);
      setValue('poDate', data.poDate.split('T')[0]);
      setValue('currencyId', String(data.currencyId));
      const matchedCurrency = loadedCurrencies.find((c) => c.currencyId === Number(data.currencyId));
      if (matchedCurrency) setDisplayCurrencyCode(matchedCurrency.currencyCode);
      setValue('supplierId', String(data.supplierId));
      setValue('exportPortId', String(data.exportPortId || ''));
      setValue('importPortId', String(data.importPortId || ''));
      setValue('priceTerms', data.priceTerms || '');
      setValue('shipmentTypeId', String(data.shipmentTypeId));
      setValue('modeOfPayment', data.modeOfPayment || '');
      setValue('modeOfShipment', data.modeOfShipment || '');
      setValue('expectedDeliveryMonth', data.expectedShipmentPeriod || '');
      setValue('remarks', data.remarks || '');

      // Populate items
      if (data.items && data.items.length > 0) {
        setItems(data.items.map((item: any) => ({
          id: `item-${item.purchaseOrderItemId}`,
          purchaseOrderItemId: item.purchaseOrderItemId,
          productId: item.productId,
          itemCode: item.itemCode,
          barcode: item.barcode || '',
          itemName: item.itemName,
          qty: item.orderedQty,
          uom: item.uom,
          priceUSD: item.unitPriceForeign,
          cbm: item.cbm || 0,
          amount: item.lineTotalForeign,
          totalCBM: item.totalCBM || 0,
          receivedQty: item.receivedQty || 0,
          balanceQty: item.pendingQty || 0,
        })));
      }

      // Populate charges
      if (data.charges && data.charges.length > 0) {
        setCharges(data.charges.map((charge: any) => ({
          id: `charge-${charge.purchaseOrderChargeId}`,
          addonChargeId: charge.addonChargeId,
          amount: charge.amountForeign,
        })));
      }

      // Populate payment terms
      if (data.payments && data.payments.length > 0) {
        setPaymentTerms(data.payments.map((payment: any) => ({
          id: `pt-${payment.purchaseOrderPaymentId}`,
          purchaseOrderPaymentId: payment.purchaseOrderPaymentId,
          description: payment.description,
          percentage: payment.percentage,
          amount: payment.expectedAmount,
          expectedDate: payment.expectedDate ? payment.expectedDate.split('T')[0] : '',
          status: payment.status,
          isPaid: payment.isPaid,
        })));
      }

      // Populate existing attachments
      if (data.attachments && data.attachments.length > 0) {
        setExistingAttachments(data.attachments.map((att: any) => ({
          attachmentId: att.attachmentId,
          fileName: att.fileName,
          fileUrl: att.fileUrl,
          uploadedAt: att.uploadedAt,
        })));
      }

    } catch (error: any) {
      console.error('Failed to fetch purchase order:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Failed to load purchase order data: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierPaymentTerms = async (supplierId: number) => {
    try {
      const response = await suppliersService.getPaymentTerms(supplierId);
      let terms: any[] = [];

      if (response?.data?.paymentTerms) {
        terms = response.data.paymentTerms;
      } else if (response?.paymentTerms) {
        terms = response.paymentTerms;
      } else if (Array.isArray(response)) {
        terms = response;
      }

      if (terms && terms.length > 0) {
        setPaymentTerms(terms.map((term: any, index: number) => ({
          id: `pt-${Date.now()}-${index}`,
          description: term.description || '',
          percentage: term.percentage || 0,
          amount: 0,
          expectedDate: '',
        })));
      } else {
        setPaymentTerms([
          { id: `pt-${Date.now()}`, description: '', percentage: 0, amount: 0, expectedDate: '' }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch payment terms:', error);
      setPaymentTerms([
        { id: `pt-${Date.now()}`, description: '', percentage: 0, amount: 0, expectedDate: '' }
      ]);
    }
  };

  const calculateItemTotals = (item: Partial<POItem>, fieldChanged?: 'qty' | 'priceUSD' | 'amount' | 'cbm' | 'totalCBM'): Partial<POItem> => {
    const qty = item.qty || 0;
    const priceUSD = item.priceUSD || 0;
    let cbm = item.cbm || 0;
    let amount = item.amount || 0;
    let totalCBM = item.totalCBM || 0;

    // Auto-calculate based on which field changed
    if (fieldChanged === 'qty' || fieldChanged === 'priceUSD') {
      // If qty or price changed, recalculate amount = qty * price
      amount = roundTo4Decimals(toNumber(multiply(qty, priceUSD)));
      totalCBM = roundTo10Decimals(toNumber(multiply(qty, cbm)));
      return {
        ...item,
        priceUSD: priceUSD,
        amount: roundTo4Decimals(amount),
        cbm: cbm,
        totalCBM: roundTo10Decimals(totalCBM),
        balanceQty: toNumber(subtract(qty, item.receivedQty || 0)),
      };
    } else if (fieldChanged === 'amount' && qty > 0) {
      // If amount changed, recalculate price = amount / qty
      const calculatedPrice = toNumber(divide(amount, qty));
      const calculatedTotalCBM = roundTo10Decimals(toNumber(multiply(qty, cbm)));
      return {
        ...item,
        priceUSD: calculatedPrice,
        amount: roundTo4Decimals(amount),
        cbm: cbm,
        totalCBM: calculatedTotalCBM,
        balanceQty: toNumber(subtract(qty, item.receivedQty || 0)),
      };
    } else if (fieldChanged === 'cbm') {
      // If CBM changed, recalculate total CBM = qty * cbm
      totalCBM = roundTo10Decimals(toNumber(multiply(qty, cbm)));
      return {
        ...item,
        cbm: cbm,
        totalCBM: roundTo10Decimals(totalCBM),
        balanceQty: toNumber(subtract(qty, item.receivedQty || 0)),
      };
    } else if (fieldChanged === 'totalCBM' && qty > 0) {
      // If total CBM changed, recalculate cbm = totalCBM / qty
      cbm = toNumber(divide(totalCBM, qty));
      return {
        ...item,
        cbm: cbm,
        totalCBM: roundTo10Decimals(totalCBM),
        balanceQty: toNumber(subtract(qty, item.receivedQty || 0)),
      };
    }

    return {
      ...item,
      balanceQty: toNumber(subtract(qty, item.receivedQty || 0)),
    };
  };

  const updateItem = (id: string, updates: Partial<POItem>, fieldChanged?: 'qty' | 'priceUSD' | 'amount' | 'cbm' | 'totalCBM') => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, ...updates };
        if (updates.qty !== undefined && item.receivedQty > 0 && updates.qty < item.receivedQty) {
          alert(`Quantity cannot be less than received quantity (${item.receivedQty})`);
          return item;
        }
        return calculateItemTotals(updatedItem, fieldChanged);
      }
      return item;
    }));
  };

  const deleteItem = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item && item.receivedQty > 0) {
      alert(`Cannot delete this item because ${item.receivedQty} units have already been received.`);
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const addCharge = () => {
    setCharges([...charges, { id: `ch-${Date.now()}`, addonChargeId: 0, amount: 0 }]);
  };

  const updateCharge = (id: string, updates: Partial<Charge>) => {
    setCharges(charges.map(charge => charge.id === id ? { ...charge, ...updates } : charge));
  };

  const deleteCharge = (id: string) => {
    setCharges(charges.filter(charge => charge.id !== id));
  };

  const addPaymentTerm = () => {
    setPaymentTerms([...paymentTerms, {
      id: `pt-${Date.now()}`,
      description: '',
      percentage: 0,
      amount: 0,
      expectedDate: '',
    }]);
  };

  const updatePaymentTerm = (id: string, field: keyof PaymentTerm, value: any) => {
    const term = paymentTerms.find(t => t.id === id);
    if (term && term.status && ['Requested', 'Approved', 'Paid'].includes(term.status)) {
      alert(`Cannot edit this payment term because its status is "${term.status}".`);
      return;
    }
    setPaymentTerms(paymentTerms.map(term => {
      if (term.id === id) {
        if (field === 'percentage') {
          const pct = value;
          const calculatedAmount = toNumber(divide(multiply(invoiceTotal, pct), 100));
          return {
            ...term,
            percentage: pct,
            amount: calculatedAmount
          };
        } else if (field === 'amount') {
          const amt = value;
          const calculatedPercentage = invoiceTotal > 0 ? toNumber(multiply(divide(amt, invoiceTotal), 100)) : 0;
          return {
            ...term,
            amount: amt,
            percentage: calculatedPercentage
          };
        }
        return { ...term, [field]: value };
      }
      return term;
    }));
  };

  const deletePaymentTerm = (id: string) => {
    const term = paymentTerms.find(t => t.id === id);
    if (term && term.status && ['Requested', 'Approved', 'Paid'].includes(term.status)) {
      alert(`Cannot delete this payment term because its status is "${term.status}".`);
      return;
    }
    setPaymentTerms(paymentTerms.filter(term => term.id !== id));
  };

  const addAttachment = (type: string, file: File) => {
    const newAttachment: PendingAttachment = {
      id: `att-${Date.now()}-${Math.random()}`,
      type,
      file,
      status: 'pending',
      progress: 0,
      retryCount: 0,
    };
    setPendingAttachments(prev => [...prev, newAttachment]);
  };

  const updateAttachmentType = (id: string, type: string) => {
    setPendingAttachments(prev => prev.map(att =>
      att.id === id ? { ...att, type } : att
    ));
  };

  const removePendingAttachment = (id: string) => {
    setPendingAttachments(prev => prev.filter(att => att.id !== id));
  };

  const removeExistingAttachment = async (attachmentId: number) => {
    if (!confirm('Are you sure you want to remove this attachment?')) return;

    try {
      await attachmentService.delete(attachmentId);
      setExistingAttachments(prev => prev.filter(att => att.attachmentId !== attachmentId));
      alert('Attachment removed successfully');
    } catch (error) {
      console.error('Failed to remove attachment:', error);
      alert('Failed to remove attachment');
    }
  };

  const handleDownloadAttachment = async (attachmentId: number, fileName: string) => {
    try {
      setDownloadingAttachmentId(attachmentId);
      const downloadUrl = await attachmentService.getDownloadUrl(attachmentId, 60, false);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download attachment:', err);
      alert('Failed to download file. Please try again.');
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  const handleViewAttachment = async (attachmentId: number) => {
    try {
      const viewUrl = await attachmentService.getDownloadUrl(attachmentId, 60, true);
      window.open(viewUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Failed to view attachment:', err);
      alert('Failed to view file. Please try again.');
    }
  };

  const uploadSingleAttachment = async (
    index: number,
    attachment: PendingAttachment,
    entityId: number
  ): Promise<boolean> => {
    const MAX_RETRIES = 3;
    let currentRetry = attachment.retryCount;

    while (currentRetry <= MAX_RETRIES) {
      try {
        console.log(`📤 [${index + 1}] Uploading: ${attachment.file.name} (Attempt ${currentRetry + 1}/${MAX_RETRIES + 1})`);

        setPendingAttachments(prev => {
          const updated = [...prev];
          const idx = updated.findIndex(a => a.id === attachment.id);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], status: 'uploading', progress: 10 };
          }
          return updated;
        });

        console.log(`  → Step 1/3: Requesting presigned upload URL...`);
        const presignedResponse = await attachmentService.requestPresignedUpload({
          fileName: attachment.file.name,
          contentType: attachment.file.type,
          entityType: 'PurchaseOrder',
          entityId: entityId,
        });
        console.log(`  ✓ Got presigned URL, attachmentId: ${presignedResponse.attachmentId}`);

        setPendingAttachments(prev => {
          const updated = [...prev];
          const idx = updated.findIndex(a => a.id === attachment.id);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], progress: 40 };
          }
          return updated;
        });

        console.log(`  → Step 2/3: Uploading to S3...`);
        await attachmentService.uploadToS3(presignedResponse.uploadUrl, attachment.file);
        console.log(`  ✓ File uploaded to S3 successfully`);

        setPendingAttachments(prev => {
          const updated = [...prev];
          const idx = updated.findIndex(a => a.id === attachment.id);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], progress: 70 };
          }
          return updated;
        });

        console.log(`  → Step 3/3: Confirming upload...`);
        await attachmentService.confirmUpload(presignedResponse.attachmentId);
        console.log(`  ✓ Upload confirmed successfully`);

        setPendingAttachments(prev => {
          const updated = [...prev];
          const idx = updated.findIndex(a => a.id === attachment.id);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], status: 'uploaded', progress: 100 };
          }
          return updated;
        });

        console.log(`✅ File uploaded successfully: ${attachment.file.name}`);
        return true;
      } catch (error) {
        currentRetry++;
        console.error(`❌ Upload attempt ${currentRetry} failed for: ${attachment.file.name}`, error);

        if (currentRetry <= MAX_RETRIES) {
          console.log(`🔄 Retrying upload... (${currentRetry}/${MAX_RETRIES})`);
          setPendingAttachments(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(a => a.id === attachment.id);
            if (idx !== -1) {
              updated[idx] = {
                ...updated[idx],
                retryCount: currentRetry,
                progress: 0,
                error: `Retry ${currentRetry}/${MAX_RETRIES}...`,
              };
            }
            return updated;
          });
          await new Promise(resolve => setTimeout(resolve, 1000 * currentRetry));
        } else {
          setPendingAttachments(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(a => a.id === attachment.id);
            if (idx !== -1) {
              updated[idx] = {
                ...updated[idx],
                status: 'failed',
                error: 'Upload failed after 3 retries',
                progress: 0,
              };
            }
            return updated;
          });
          console.error(`❌ Upload failed after ${MAX_RETRIES} retries: ${attachment.file.name}`);
          return false;
        }
      }
    }
    return false;
  };

  const uploadAttachments = async (entityId: number): Promise<{ success: boolean; failedCount: number }> => {
    if (pendingAttachments.length === 0) {
      return { success: true, failedCount: 0 };
    }

    const filesToUpload = pendingAttachments.filter(f => f.status === 'pending' || f.status === 'failed');
    if (filesToUpload.length === 0) {
      return { success: true, failedCount: 0 };
    }

    let failedCount = 0;
    console.log(`📎 Starting upload for ${filesToUpload.length} attachment(s)...`);

    for (let i = 0; i < filesToUpload.length; i++) {
      const attachment = filesToUpload[i];
      const success = await uploadSingleAttachment(i, attachment, entityId);
      if (!success) {
        failedCount++;
      }
    }

    return { success: failedCount === 0, failedCount };
  };

  const retryFailedAttachment = async (attachmentId: string, entityId: number) => {
    const attachment = pendingAttachments.find(a => a.id === attachmentId);
    if (!attachment || !entityId) return;

    setPendingAttachments(prev => prev.map(a =>
      a.id === attachmentId ? { ...a, status: 'pending', retryCount: 0, error: undefined } : a
    ));

    const index = pendingAttachments.findIndex(a => a.id === attachmentId);
    await uploadSingleAttachment(index, { ...attachment, status: 'pending', retryCount: 0 }, entityId);
  };

  const subtotal = useMemo(() => roundTo4Decimals(toNumber(sum(items.map(item => item.amount)))), [items]);

  const totalCharges = useMemo(() => roundTo4Decimals(toNumber(sum(charges.map(charge => charge.amount)))), [charges]);

  const totalPaymentPercentage = useMemo(() => toNumber(sum(paymentTerms.map(term => term.percentage))), [paymentTerms]);

  const totalPaymentAmount = useMemo(() => {
    return paymentTerms.reduce((sum, t) => sum + t.amount, 0);
  }, [paymentTerms]);

  const totalProducts = useMemo(() => items.length, [items]);

  const totalQuantity = useMemo(() => toNumber(sum(items.map(item => item.qty))), [items]);

  const totalCBM = useMemo(() => toNumber(sum(items.map(item => item.totalCBM))), [items]);

  const existingProductIds = useMemo(
    () => new Set(items.map((item) => parseInt(item.id.replace('item-', ''), 10)).filter((id) => !isNaN(id))),
    [items]
  );

  const selectedSupplierName = useMemo(() => {
    if (!selectedSupplierId) return '';
    const supplier = suppliers.find((s: any) => s.supplierId === Number(selectedSupplierId));
    return supplier?.supplierName || '';
  }, [selectedSupplierId, suppliers]);

  const handleImportProducts = () => {
    if (!selectedSupplierId) {
      alert('Please select a Supplier first.');
      return;
    }
    setShowSearchModal(true);
  };

  const handleSupplierAdded = async (supplierId?: number) => {
    try {
      const suppliersRes = await suppliersService.getDropdown();
      setSuppliers(suppliersRes || []);
      if (supplierId) {
        setValue('supplierId', String(supplierId), { shouldValidate: true });
      }
    } catch (error) {
      console.error('Failed to refresh suppliers:', error);
    }
    setShowSupplierModal(false);
  };

  const handleAddSearchedProducts = (searchResults: SearchProductResult[]) => {
    const newItems: POItem[] = searchResults
      .filter((p) => !items.some((existing) => existing.id === `item-${p.productId}`))
      .map((product) => {
        const qty = product.editableFinalQty ?? 1;
        const priceUSD = product.editablePrice ?? product.priceUsd ?? 0;
        return {
          id: `item-${product.productId}`,
          productId: product.productId,
          itemCode: product.itemCode,
          barcode: product.barcode || '',
          itemName: product.itemName,
          qty,
          uom: product.uom || '',
          priceUSD: priceUSD,
          cbm: product.cbm || 0,
          amount: toNumber(multiply(qty, priceUSD)),
          totalCBM: toNumber(multiply(qty, product.cbm || 0)),
          receivedQty: 0,
          balanceQty: qty,
        };
      });

    setItems((prev) => [...prev, ...newItems]);
  };

  const handleExcelImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (!file.name.endsWith('.xlsx')) {
        alert('Please select a valid Excel file (.xlsx)');
        return;
      }

      setUploadingExcel(true);
      try {
        const response = await purchaseOrdersService.importItemsFromExcel(file);

        if (response.isValid) {
          setItems([]);
          const newItems: POItem[] = response.items.map((product) => {
            const qty = product.editableFinalQty ?? 1;
            const priceUSD = product.editablePrice ?? product.priceUsd ?? 0;
            return {
              id: `item-${product.productId}`,
              productId: product.productId,
              itemCode: product.itemCode,
              barcode: product.barcode || '',
              itemName: product.itemName,
              qty,
              uom: product.uom || '',
              priceUSD: priceUSD,
              cbm: product.cbm || 0,
              amount: toNumber(multiply(qty, priceUSD)),
              totalCBM: toNumber(multiply(qty, product.cbm || 0)),
              receivedQty: 0,
              balanceQty: qty,
            };
          });
          setItems(newItems);
        } else {
          setExcelErrorMessage(response.message);
          setExcelErrors([]);
          setExcelMissingItems(response.missingItems);
          setShowExcelErrorModal(true);
        }
      } catch (error: any) {
        const errorMsg = error?.response?.data?.message || error?.message || 'Failed to import Excel file';
        const errorsList = error?.response?.data?.errors || [];
        setExcelErrorMessage(errorMsg);
        setExcelErrors(errorsList);
        setExcelMissingItems([]);
        setShowExcelErrorModal(true);
      } finally {
        setUploadingExcel(false);
      }
    };
    input.click();
  };

  const onError = (errors: any) => {
    console.log('=== FORM VALIDATION ERRORS ===');
    console.log('Raw errors object:', errors);
    console.log('Current form values:', getValues());
    Object.entries(errors).forEach(([field, error]: [string, any]) => {
      console.log(`Field "${field}" error:`, error.message);
      const value = getValues(field as any);
      console.log(`  Current value:`, value, `(type: ${typeof value})`);
    });
    console.log('==============================');
  };

  const onSubmit = async (data: POFormData, submitForApproval: boolean = false, actionType: 'save' | 'approve' | 'reject' = 'save') => {
    console.log('=== FORM SUBMISSION SUCCESS ===');
    console.log('Form data passed validation:', data);
    console.log('Submit for approval:', submitForApproval);
    console.log('Action type:', actionType);
    console.log('==============================');

    // Check for PO number duplicate
    if (poNumberError) {
      alert('Please fix the PO Number error before submitting');
      return;
    }

    // Validate items
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    // Validate item quantities and prices
    const invalidItems = items.filter(item => item.qty <= 0 || item.priceUSD <= 0);
    if (invalidItems.length > 0) {
      const errorIds = new Set(invalidItems.map(item => item.id));
      setItemValidationErrors(errorIds);
      alert('All items must have quantity and price greater than 0');
      return;
    }
    setItemValidationErrors(new Set());

    // Validate payment terms
    if (paymentTerms.length === 0) {
      alert('At least one payment term is required');
      return;
    }

    const roundedPaymentTotal = Math.round(totalPaymentAmount * 100) / 100;
    const roundedInvoiceTotal = Math.round(invoiceTotal * 100) / 100;

    if (Math.abs(roundedPaymentTotal - roundedInvoiceTotal) > 0.01) {
      alert(`Total payment amount (${displayCurrencyCode} ${roundedPaymentTotal.toFixed(2)}) must equal Total Invoice Amount (${displayCurrencyCode} ${roundedInvoiceTotal.toFixed(2)})`);
      return;
    }

    const missingDates = paymentTerms.some(term => !term.expectedDate);
    if (missingDates) {
      alert('Expected Date is required for all payment terms');
      return;
    }

    // Validate addon charges
    const invalidCharges = charges.filter(charge => charge.addonChargeId > 0 && charge.amount <= 0);
    if (invalidCharges.length > 0) {
      const errorIds = new Set(invalidCharges.map(charge => charge.id));
      setChargeValidationErrors(errorIds);
      alert('All selected add-on charges must have amount greater than 0');
      return;
    }
    setChargeValidationErrors(new Set());

    const missingTypes = pendingAttachments.some(att => !att.type);
    if (missingTypes) {
      alert('Please select a type for all attachments before submitting');
      return;
    }

    setLoading(true);
    try {
      // Split expectedDeliveryMonth into year and month
      let expectedShipmentYear: number | undefined;
      let expectedShipmentMonth: number | undefined;

      if (data.expectedDeliveryMonth) {
        const [year, month] = data.expectedDeliveryMonth.split('-');
        expectedShipmentYear = parseInt(year, 10);
        expectedShipmentMonth = parseInt(month, 10);
      }

      // Transform items to backend format
      const transformedItems = items.map(item => {
        // Use productId if available, otherwise extract from id (format: "item-{productId}")
        let productId = item.productId;
        if (!productId) {
          productId = parseInt(item.id.replace('item-', ''), 10);
        }

        return {
          purchaseOrderItemId: item.purchaseOrderItemId || null,
          productId: productId && !isNaN(productId) ? productId : 0,
          itemCode: item.itemCode,
          barcode: item.barcode,
          itemName: item.itemName,
          uom: item.uom,
          orderedQty: item.qty,
          unitPriceForeign: item.priceUSD,
          cbm: item.cbm,
          grossWeight: 0,
        };
      });

      // Transform charges to backend format
      const transformedCharges = charges
        .filter(charge => charge.addonChargeId > 0)
        .map(charge => ({
          addonChargeId: charge.addonChargeId,
          amount: charge.amount,
        }));

      // Transform payment terms to payments
      const transformedPayments = paymentTerms.map(term => ({
        purchaseOrderPaymentId: term.purchaseOrderPaymentId || null,
        description: term.description,
        percentage: term.percentage,
        amount: term.amount,
        expectedDate: term.expectedDate,
      }));

      // Build payload according to backend API contract - convert string IDs to numbers
      const payload = {
        companyId: Number(data.companyId),
        poNumber: data.poNumber,
        poDate: data.poDate,
        supplierId: Number(data.supplierId),
        currencyId: Number(data.currencyId),
        incoterm: null, // Always null as per user instruction
        priceTerms: data.priceTerms,
        modeOfPayment: data.modeOfPayment,
        modeOfShipment: data.modeOfShipment,
        remarks: data.remarks || '',
        exportPortId: Number(data.exportPortId),
        importPortId: Number(data.importPortId),
        shipmentTypeId: Number(data.shipmentTypeId),
        expectedShipmentYear,
        expectedShipmentMonth,
        items: transformedItems,
        charges: transformedCharges,
        payments: transformedPayments,
      };

      console.log('=== PAYLOAD DEBUG ===');
      console.log('companyId:', payload.companyId, 'type:', typeof payload.companyId);
      console.log('supplierId:', payload.supplierId, 'type:', typeof payload.supplierId);
      console.log('currencyId:', payload.currencyId, 'type:', typeof payload.currencyId);
      console.log('exportPortId:', payload.exportPortId, 'type:', typeof payload.exportPortId);
      console.log('importPortId:', payload.importPortId, 'type:', typeof payload.importPortId);
      console.log('shipmentTypeId:', payload.shipmentTypeId, 'type:', typeof payload.shipmentTypeId);
      console.log('Full Payload:', JSON.stringify(payload, null, 2));
      console.log('===================');

      // Call backend API to save purchase order
      let savedPurchaseOrderId: number;
      let actionText: string;

      if (mode === 'edit' && purchaseOrderId) {
        const updatePayload = { ...payload, purchaseOrderId };
        let response: any;

        if (actionType === 'approve') {
          response = await purchaseOrdersService.approve(purchaseOrderId, updatePayload);
          savedPurchaseOrderId = response.purchaseOrderId;
          actionText = 'approved';
          console.log('Purchase Order approved successfully:', response);
        } else if (actionType === 'reject') {
          response = await purchaseOrdersService.reject(purchaseOrderId, updatePayload);
          savedPurchaseOrderId = purchaseOrderId;
          actionText = 'rejected';
          console.log('Purchase Order rejected successfully:', response);
        } else {
          response = await purchaseOrdersService.update(updatePayload, submitForApproval);
          savedPurchaseOrderId = response.purchaseOrderId;
          actionText = submitForApproval ? 'submitted for approval' : 'saved as draft';
          console.log('Purchase Order updated successfully:', response);
        }
      } else {
        const response = await purchaseOrdersService.create(payload, submitForApproval);
        savedPurchaseOrderId = response.purchaseOrderId;
        actionText = submitForApproval ? 'submitted for approval' : 'saved as draft';
        console.log('Purchase Order created successfully:', response);
      }

      if (pendingAttachments.length > 0) {
        console.log(`📎 Starting upload for ${pendingAttachments.length} attachment(s)...`);
        const uploadResult = await uploadAttachments(savedPurchaseOrderId);

        if (uploadResult.success) {
          console.log('✅ All attachments uploaded successfully');
        } else {
          console.log('⚠️ Some attachments failed to upload. Failed count:', uploadResult.failedCount);
          alert(
            `Purchase Order ${actionText} successfully, but ${uploadResult.failedCount} attachment(s) failed to upload after multiple retries.\n\n` +
            `You can retry failed uploads by clicking the retry button, or edit the purchase order later to upload them.`
          );
        }
      } else {
        console.log('✅ No attachments to upload');
      }

      onSuccess?.(savedPurchaseOrderId);
      onClose();
    } catch (error: any) {
      console.error('Failed to save Purchase Order:', error);
      let errorMessage = error.message || 'Failed to save Purchase Order';

      if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        const errorDetails = error.errors.map((err: any) => {
          if (typeof err === 'string') return err;
          if (err.message) return err.message;
          if (err.description) return err.description;
          return JSON.stringify(err);
        }).join('\n');
        errorMessage = `${errorMessage}\n\nDetails:\n${errorDetails}`;
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    handleSubmit((data) => onSubmit(data, false))();
  };

  const handleSubmitForApproval = () => {
    setShowConfirmDialog(true);
  };

  const confirmSubmitForApproval = () => {
    setShowConfirmDialog(false);
    handleSubmit((data) => onSubmit(data, true, 'save'))();
  };

  const handleApprove = () => {
    setShowApproveDialog(true);
  };

  const confirmApprove = () => {
    setShowApproveDialog(false);
    handleSubmit((data) => onSubmit(data, false, 'approve'))();
  };

  const handleReject = () => {
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    setShowRejectDialog(false);
    handleSubmit((data) => onSubmit(data, false, 'reject'))();
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!purchaseOrderId) return;

    setShowDeleteDialog(false);
    setLoading(true);

    try {
      await purchaseOrdersService.delete(purchaseOrderId);
      alert('Purchase Order deleted successfully!');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Failed to delete Purchase Order:', error);
      alert(error.message || 'Failed to delete Purchase Order');
    } finally {
      setLoading(false);
    }
  };

  // Determine if we can submit for approval (only if status is Draft or in add mode)
  const canSubmitForApproval = mode === 'add' || currentStatus === 'Draft';
  const isSubmittedStatus = currentStatus === 'Submitted';
  const isApprovedStatus = currentStatus === 'Approved';
  const canDelete = mode === 'edit' && (currentStatus === 'Draft' || currentStatus === 'Rejected');

  return (
    <div className="w-full relative">
      {loading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <div className="bg-white dark:bg-gray-800 px-8 py-10 rounded-xl shadow-2xl flex flex-col items-center gap-4 border border-gray-200 dark:border-gray-700">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
              <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-[var(--color-text)] mb-1">Loading Purchase Order</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Please wait...</p>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--color-primary)]">
            {mode === 'edit' ? (
              <FilePenLine className="w-6 h-6 text-white" />
            ) : (
              <ClipboardList className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text)]">
              {mode === 'edit' ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
              {mode === 'edit' ? 'Update purchase order details' : 'Fill in the details to create a new purchase order'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-[var(--color-border)] transition-colors"
        >
          <X className="w-5 h-5 text-[var(--color-textSecondary)]" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">Header Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <select
                  id="companyId"
                  {...register('companyId')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  <option value="">Select Company</option>
                  {companies.map((company) => (
                    <option key={company.companyId} value={company.companyId}>
                      {company.companyName}
                    </option>
                  ))}
                </select>
                {errors.companyId && (
                  <p className="mt-1 text-sm text-red-500">{errors.companyId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  PO Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="poNumber"
                    type="text"
                    {...register('poNumber')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    placeholder="Enter PO Number"
                  />
                  {checkingPONumber && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                {errors.poNumber && (
                  <p className="mt-1 text-sm text-red-500">{errors.poNumber.message}</p>
                )}
                {poNumberError && !errors.poNumber && (
                  <p className="mt-1 text-sm text-red-500">{poNumberError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  PO Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="poDate"
                  type="date"
                  {...register('poDate')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
                {errors.poDate && (
                  <p className="mt-1 text-sm text-red-500">{errors.poDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  id="currencyId"
                  {...register('currencyId')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  <option value="">Select Currency</option>
                  {currencies.map((c) => (
                    <option key={c.currencyId} value={c.currencyId}>
                      {c.currencyCode} - {c.country}
                    </option>
                  ))}
                </select>
                {errors.currencyId && (
                  <p className="mt-1 text-sm text-red-500">{errors.currencyId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SearchableSelect
                      id="supplierId"
                      name="supplierId"
                      options={suppliers.map((s) => ({
                        value: s.supplierId,
                        label: s.supplierName,
                      }))}
                      value={selectedSupplierId ? Number(selectedSupplierId) : null}
                      onChange={(val) => {
                        console.log('Supplier changed:', val, 'type:', typeof val);
                        setValue('supplierId', String(val), { shouldValidate: true });
                      }}
                      placeholder="Search & select supplier"
                      error={errors.supplierId?.message}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSupplierModal(true)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                    title="Add New Supplier"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Exporter Port <span className="text-red-500">*</span>
                </label>
                <select
                  id="exportPortId"
                  {...register('exportPortId')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  <option value="">Select Export Port</option>
                  {exportPorts.map((port) => (
                    <option key={port.portId} value={port.portId}>
                      {port.portName} ({port.country})
                    </option>
                  ))}
                </select>
                {errors.exportPortId && (
                  <p className="mt-1 text-sm text-red-500">{errors.exportPortId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Importer Port <span className="text-red-500">*</span>
                </label>
                <select
                  id="importPortId"
                  {...register('importPortId')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  <option value="">Select Import Port</option>
                  {importPorts.map((port) => (
                    <option key={port.portId} value={port.portId}>
                      {port.portName} ({port.country})
                    </option>
                  ))}
                </select>
                {errors.importPortId && (
                  <p className="mt-1 text-sm text-red-500">{errors.importPortId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Price Terms <span className="text-red-500">*</span>
                </label>
                <select
                  id="priceTerms"
                  {...register('priceTerms')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  <option value="">Select Price Terms</option>
                  <option value="FAS">FAS</option>
                  <option value="FOB">FOB</option>
                  <option value="CFR">CFR</option>
                  <option value="CIF">CIF</option>
                </select>
                {errors.priceTerms && (
                  <p className="mt-1 text-sm text-red-500">{errors.priceTerms.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Type of Shipment <span className="text-red-500">*</span>
                </label>
                <select
                  id="shipmentTypeId"
                  {...register('shipmentTypeId')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  <option value="">Select Shipment Type</option>
                  {shipmentTypes.map((st) => (
                    <option key={st.shipmentTypeId} value={st.shipmentTypeId}>
                      {st.shipmentTypeName}
                    </option>
                  ))}
                </select>
                {errors.shipmentTypeId && (
                  <p className="mt-1 text-sm text-red-500">{errors.shipmentTypeId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Mode of Payment <span className="text-red-500">*</span>
                </label>
                <select
                  id="modeOfPayment"
                  {...register('modeOfPayment')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  <option value="">Select Mode of Payment</option>
                  <option value="Direct">Direct</option>
                  <option value="Credit">Credit</option>
                </select>
                {errors.modeOfPayment && (
                  <p className="mt-1 text-sm text-red-500">{errors.modeOfPayment.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Mode of Shipment <span className="text-red-500">*</span>
                </label>
                <select
                  id="modeOfShipment"
                  {...register('modeOfShipment')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  <option value="">Select Mode of Shipment</option>
                  <option value="Ship">Ship</option>
                  <option value="Road">Road</option>
                  <option value="Air">Air</option>
                </select>
                {errors.modeOfShipment && (
                  <p className="mt-1 text-sm text-red-500">{errors.modeOfShipment.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Expected Delivery Month
                </label>
                <input
                  id="expectedDeliveryMonth"
                  type="month"
                  {...register('expectedDeliveryMonth')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Remark
              </label>
              <textarea
                id="remarks"
                {...register('remarks')}
                rows={3}
                maxLength={500}
                placeholder="Enter any additional remarks or notes..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-none"
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
              <h3 className="text-lg font-semibold text-[var(--color-primary)]">Items</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleExcelImport}
                  className="bg-sky-600 hover:bg-sky-700"
                  disabled={uploadingExcel}
                >
                  {uploadingExcel ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Excel Import
                    </>
                  )}
                </Button>
                <Button type="button" onClick={handleImportProducts} className="bg-green-600 hover:bg-green-700">
                  <FileUp className="w-4 h-4 mr-2" />
                  Import Products
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UOM</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price (USD)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CBM</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total CBM</th>
                    {mode === 'edit' && (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance Qty</th>
                      </>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={mode === 'edit' ? 13 : 11} className="px-4 py-8 text-center text-sm text-gray-500">
                        No items added. Click "Import Products" to add items.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => {
                      const hasError = itemValidationErrors.has(item.id);
                      return (
                      <tr key={item.id} className={`hover:bg-gray-50 ${hasError ? 'bg-red-50 border-l-4 border-l-red-500' : ''}`}>
                        <td className="px-4 py-2 text-sm">{index + 1}</td>
                        <td className="px-4 py-2 text-sm">{item.itemCode}</td>
                        <td className="px-4 py-2 text-sm">{item.barcode}</td>
                        <td className="px-4 py-2 text-sm">{item.itemName}</td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={item.qty === 0 ? '' : item.qty}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Allow empty or valid integers only
                              if (value === '') {
                                updateItem(item.id, { qty: 0 }, 'qty');
                              } else if (/^\d+$/.test(value)) {
                                const qty = parseInt(value, 10);
                                if (qty >= 0) {
                                  updateItem(item.id, { qty }, 'qty');
                                }
                              }
                            }}
                            placeholder="0"
                            className={`w-20 px-2 py-1 border rounded text-sm ${hasError ? 'border-red-500' : 'border-gray-300'}`}
                          />
                        </td>
                        <td className="px-4 py-2 text-sm">{item.uom}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="any"
                            value={item.priceUSD}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || value === '-') {
                                updateItem(item.id, { priceUSD: 0 }, 'priceUSD');
                              } else {
                                const price = parseFloat(value);
                                if (!isNaN(price) && price >= 0) {
                                  updateItem(item.id, { priceUSD: price }, 'priceUSD');
                                }
                              }
                            }}
                            placeholder="0"
                            className={`w-24 px-2 py-1 border rounded text-sm ${hasError ? 'border-red-500' : 'border-gray-300'}`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="any"
                            value={item.cbm}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || value === '-') {
                                updateItem(item.id, { cbm: 0 }, 'cbm');
                              } else {
                                const cbm = parseFloat(value);
                                if (!isNaN(cbm) && cbm >= 0) {
                                  updateItem(item.id, { cbm: cbm }, 'cbm');
                                }
                              }
                            }}
                            placeholder="0"
                            className={`w-24 px-2 py-1 border rounded text-sm ${hasError ? 'border-red-500' : 'border-gray-300'}`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="any"
                            value={item.amount}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || value === '-') {
                                updateItem(item.id, { amount: 0 }, 'amount');
                              } else {
                                const amount = parseFloat(value);
                                if (!isNaN(amount) && amount >= 0) {
                                  updateItem(item.id, { amount: amount }, 'amount');
                                }
                              }
                            }}
                            placeholder="0"
                            className={`w-24 px-2 py-1 border rounded text-sm ${hasError ? 'border-red-500' : 'border-gray-300'}`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="any"
                            value={item.totalCBM}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || value === '-') {
                                updateItem(item.id, { totalCBM: 0 }, 'totalCBM');
                              } else {
                                const totalCBM = parseFloat(value);
                                if (!isNaN(totalCBM) && totalCBM >= 0) {
                                  updateItem(item.id, { totalCBM: totalCBM }, 'totalCBM');
                                }
                              }
                            }}
                            placeholder="0"
                            className={`w-24 px-2 py-1 border rounded text-sm ${hasError ? 'border-red-500' : 'border-gray-300'}`}
                          />
                        </td>
                        {mode === 'edit' && (
                          <>
                            <td className="px-4 py-2 text-sm">{item.receivedQty}</td>
                            <td className="px-4 py-2 text-sm">{item.balanceQty}</td>
                          </>
                        )}
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={() => deleteItem(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {items.length > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-teal-50 to-green-50 border-2 border-teal-300 rounded-lg shadow-sm">
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Total Products</p>
                    <p className="text-2xl font-bold text-teal-700">{totalProducts}</p>
                  </div>
                  <div className="text-center border-l border-teal-200">
                    <p className="text-sm text-gray-600 mb-1">Total Quantity</p>
                    <p className="text-2xl font-bold text-teal-700">{totalQuantity.toFixed(0)}</p>
                  </div>
                  <div className="text-center border-l border-teal-200">
                    <p className="text-sm text-gray-600 mb-1">Total CBM</p>
                    <p className="text-2xl font-bold text-teal-700">{removeTrailingZeros(totalCBM)}</p>
                  </div>
                  <div className="text-center border-l border-teal-200 bg-green-100 -m-4 ml-0 p-4 rounded-r-lg">
                    <p className="text-sm text-gray-700 mb-1 font-medium">Total Amount</p>
                    <p className="text-2xl font-bold text-green-700">$ {removeTrailingZeros(subtotal)}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
              <h3 className="text-lg font-semibold text-[var(--color-primary)]">Add-on Charges</h3>
              <Button type="button" onClick={addCharge} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      S.No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Charge Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      Amount in USD
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {charges.map((charge, index) => {
                    const hasError = chargeValidationErrors.has(charge.id);
                    return (
                    <tr key={charge.id} className={`hover:bg-gray-50 ${hasError ? 'bg-red-50 border-l-4 border-l-red-500' : ''}`}>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={charge.addonChargeId}
                          onChange={(e) => updateCharge(charge.id, { addonChargeId: parseInt(e.target.value, 10) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                        >
                          <option value={0}>Select Charge</option>
                          {addonChargeOptions.map((ac) => (
                            <option key={ac.addonChargeId} value={ac.addonChargeId}>
                              {ac.chargeName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="any"
                          value={charge.amount}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || value === '-') {
                              updateCharge(charge.id, { amount: 0 });
                            } else {
                              const amount = parseFloat(value);
                              if (!isNaN(amount) && amount >= 0) {
                                updateCharge(charge.id, { amount: amount });
                              }
                            }
                          }}
                          placeholder="0"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${hasError ? 'border-red-500' : 'border-gray-300'}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => deleteCharge(charge.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {charges.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Total Charges:</span>
                  <span className="font-semibold text-gray-900">{displayCurrencyCode} {removeTrailingZeros(totalCharges)}</span>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">Invoice Summary</h3>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Invoice:</span>
                  <span className="font-medium">{displayCurrencyCode} {removeTrailingZeros(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Add-on Charges:</span>
                  <span className="font-medium">{displayCurrencyCode} {removeTrailingZeros(totalCharges)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-2 border-t border-blue-300">
                  <span>Total Invoice Amount:</span>
                  <span className="text-blue-700">{displayCurrencyCode} {removeTrailingZeros(invoiceTotal)}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
              <h3 className="text-lg font-semibold text-[var(--color-primary)]">Payment Terms</h3>
              <Button type="button" onClick={addPaymentTerm} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      %
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      Expected Date <span className="text-red-500">*</span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentTerms.map((term, index) => {
                    const isProtected = term.status && ['Requested', 'Approved', 'Paid'].includes(term.status);
                    return (
                    <tr key={term.id} className={`${isProtected ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={term.description}
                          onChange={(e) => updatePaymentTerm(term.id, 'description', e.target.value)}
                          placeholder="Enter payment description"
                          disabled={isProtected}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${isProtected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={term.percentageDisplay ?? term.percentage}
                          onFocus={(e) => e.target.select()}
                          disabled={isProtected}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setPaymentTerms(paymentTerms.map(t =>
                                t.id === term.id ? { ...t, percentage: 0, percentageDisplay: undefined } : t
                              ));
                            } else if (/^\d*\.?\d*$/.test(value)) {
                              if (value.endsWith('.') || /\.\d*0$/.test(value)) {
                                setPaymentTerms(paymentTerms.map(t =>
                                  t.id === term.id ? { ...t, percentageDisplay: value } : t
                                ));
                              } else {
                                const percentage = parseFloat(value);
                                if (!isNaN(percentage) && percentage >= 0) {
                                  updatePaymentTerm(term.id, 'percentage', percentage);
                                  setPaymentTerms(prev => prev.map(t =>
                                    t.id === term.id ? { ...t, percentageDisplay: undefined } : t
                                  ));
                                }
                              }
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === '.' && e.currentTarget.value.includes('.')) {
                              e.preventDefault();
                            }
                          }}
                          placeholder="0.00"
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${isProtected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={term.amountDisplay ?? term.amount}
                          onFocus={(e) => e.target.select()}
                          disabled={isProtected}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setPaymentTerms(paymentTerms.map(t =>
                                t.id === term.id ? { ...t, amount: 0, amountDisplay: undefined } : t
                              ));
                            } else if (/^\d*\.?\d*$/.test(value)) {
                              if (value.endsWith('.') || /\.\d*0$/.test(value)) {
                                setPaymentTerms(paymentTerms.map(t =>
                                  t.id === term.id ? { ...t, amountDisplay: value } : t
                                ));
                              } else {
                                const amount = parseFloat(value);
                                if (!isNaN(amount) && amount >= 0) {
                                  updatePaymentTerm(term.id, 'amount', amount);
                                  setPaymentTerms(prev => prev.map(t =>
                                    t.id === term.id ? { ...t, amountDisplay: undefined } : t
                                  ));
                                }
                              }
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === '.' && e.currentTarget.value.includes('.')) {
                              e.preventDefault();
                            }
                          }}
                          placeholder="0.00"
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${isProtected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={term.expectedDate}
                          onChange={(e) => updatePaymentTerm(term.id, 'expectedDate', e.target.value)}
                          disabled={isProtected}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${isProtected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {term.status ? (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            term.status === 'Paid' ? 'bg-green-100 text-green-800' :
                            term.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                            term.status === 'Requested' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {term.status}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Draft</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => deletePaymentTerm(term.id)}
                          disabled={isProtected}
                          className={`transition-colors ${isProtected ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}`}
                          title={isProtected ? 'Cannot delete - status is ' + term.status : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>

              {paymentTerms.length > 0 && (() => {
                const roundedPaymentTotal = Math.round(totalPaymentAmount * 100) / 100;
                const roundedInvoiceTotal = Math.round(invoiceTotal * 100) / 100;
                const isValid = Math.abs(roundedPaymentTotal - roundedInvoiceTotal) <= 0.01;

                return (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Total:</span>
                      <div className="flex gap-6">
                        <span className={`font-semibold ${!isValid ? 'text-red-600' : 'text-green-600'}`}>
                          {totalPaymentPercentage.toFixed(2)}%
                        </span>
                        <span className={`font-semibold ${!isValid ? 'text-red-600' : 'text-gray-900'}`}>
                          {displayCurrencyCode} {removeTrailingZeros(roundTo4Decimals(totalPaymentAmount))}
                        </span>
                      </div>
                    </div>
                    {!isValid && (
                      <p className="text-sm text-red-600 mt-2">
                        Total payment amount must equal Total Invoice Amount ({displayCurrencyCode} {roundedInvoiceTotal.toFixed(2)})
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-[var(--color-secondary)]">
              <h3 className="text-lg font-semibold text-[var(--color-primary)]">Attachments</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Files
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[var(--color-primary)] transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach(file => {
                        addAttachment('', file);
                      });
                      e.target.value = '';
                    }}
                    className="hidden"
                    id="po-file-upload"
                  />
                  <label
                    htmlFor="po-file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-gray-500">
                      PDF, DOC, XLS, PNG, JPG (Max 10MB per file)
                    </span>
                  </label>
                </div>
              </div>

              {existingAttachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Existing Attachments</p>
                  {existingAttachments.map((attachment) => (
                    <div
                      key={attachment.attachmentId}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">
                          {attachment.fileName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadAttachment(attachment.attachmentId, attachment.fileName)}
                          disabled={downloadingAttachmentId === attachment.attachmentId}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Download"
                        >
                          {downloadingAttachmentId === attachment.attachmentId ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewAttachment(attachment.attachmentId)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="View"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExistingAttachment(attachment.attachmentId)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pendingAttachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Selected Files</p>
                  {pendingAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="p-3 bg-white border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-gray-700 truncate">
                                {attachment.file.name}
                              </span>
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                {(attachment.file.size / 1024).toFixed(0)} KB
                              </span>
                            </div>
                            <select
                              value={attachment.type}
                              onChange={(e) => updateAttachmentType(attachment.id, e.target.value)}
                              className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                              disabled={attachment.status === 'uploading'}
                            >
                              <option value="">Select Type</option>
                              <option value="Proforma Invoice">Proforma Invoice</option>
                              <option value="Initial Deposit POP">Initial Deposit POP</option>
                              <option value="Bill of Lading">Bill of Lading</option>
                              <option value="Commercial Invoice">Commercial Invoice</option>
                              <option value="Packing List">Packing List</option>
                              <option value="Master Bill of Lading (MBL)">Master Bill of Lading (MBL)</option>
                              <option value="Balance Payment POP">Balance Payment POP</option>
                              <option value="Telex Release">Telex Release</option>
                              <option value="CA Invoice">CA Invoice</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          {attachment.status === 'failed' && purchaseOrderId && (
                            <button
                              type="button"
                              onClick={() => retryFailedAttachment(attachment.id, purchaseOrderId)}
                              className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                              title="Retry Upload"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removePendingAttachment(attachment.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            disabled={attachment.status === 'uploading'}
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {attachment.status === 'pending' && (
                        <p className="text-xs text-gray-600">Pending upload</p>
                      )}
                      {attachment.status === 'uploading' && (
                        <div>
                          <p className="text-xs text-blue-600 mb-1">
                            Uploading{attachment.retryCount > 0 ? ` (Retry ${attachment.retryCount})` : ''}...
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-[var(--color-primary)] h-2 rounded-full transition-all"
                              style={{ width: `${attachment.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {attachment.status === 'uploaded' && (
                        <p className="text-xs text-green-600">✓ Uploaded successfully</p>
                      )}
                      {attachment.status === 'failed' && (
                        <p className="text-xs text-red-600">
                          ✗ {attachment.error || 'Upload failed'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <div className="flex items-center justify-between pt-6 border-t border-[var(--color-border)]">
            <div>
              {canDelete && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>

            {/* Show different buttons based on PO status */}
            {isSubmittedStatus && (
              <>
                <Button type="button" variant="outline" onClick={handleReject} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  Reject
                </Button>
                <Button type="button" onClick={handleApprove} disabled={loading} className="bg-green-600 hover:bg-green-700">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {pendingAttachments.some(a => a.status === 'uploading')
                        ? 'Uploading attachments...'
                        : 'Approving...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save and Approve
                    </>
                  )}
                </Button>
              </>
            )}

            {isApprovedStatus && (
              <>
                <Button type="button" onClick={handleApprove} disabled={loading} className="bg-green-600 hover:bg-green-700">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {pendingAttachments.some(a => a.status === 'uploading')
                        ? 'Uploading attachments...'
                        : 'Approving...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save and Approve
                    </>
                  )}
                </Button>
              </>
            )}

            {!isSubmittedStatus && !isApprovedStatus && (
              <>
                <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Draft
                </Button>
                {canSubmitForApproval && (
                  <Button type="button" onClick={handleSubmitForApproval} disabled={loading} className="bg-green-600 hover:bg-green-700">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {pendingAttachments.some(a => a.status === 'uploading')
                          ? 'Uploading attachments...'
                          : 'Submitting...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Submit for Approval
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
            </div>
          </div>
        </form>

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Submit for Approval
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Do you want to submit this purchase order for approval? Once submitted, you may not be able to edit it until it's reviewed.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmSubmitForApproval}
                className="bg-green-600 hover:bg-green-700"
              >
                Yes, Submit
              </Button>
            </div>
          </div>
        </div>
      )}

      {showApproveDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Approve Purchase Order
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Do you want to approve this purchase order? This will mark it as approved and ready for processing.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowApproveDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmApprove}
                className="bg-green-600 hover:bg-green-700"
              >
                Yes, Approve
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Reject Purchase Order
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Do you want to reject this purchase order? This will mark it as rejected and it will need to be revised.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowRejectDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmReject}
                className="bg-red-600 hover:bg-red-700"
              >
                Yes, Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Delete Purchase Order
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this purchase order? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <SearchProductModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        supplierName={selectedSupplierName}
        supplierId={selectedSupplierId || 0}
        onAddProducts={handleAddSearchedProducts}
        existingProductIds={existingProductIds}
      />

      <ExcelImportErrorModal
        isOpen={showExcelErrorModal}
        onClose={() => setShowExcelErrorModal(false)}
        message={excelErrorMessage}
        errors={excelErrors}
        missingItems={excelMissingItems}
      />

      {showSupplierModal && (
        <Modal isOpen={showSupplierModal} onClose={() => setShowSupplierModal(false)} title="">
          <SupplierForm
            mode="add"
            onClose={() => setShowSupplierModal(false)}
            onSuccess={handleSupplierAdded}
          />
        </Modal>
      )}
    </div>
  );
};
