export type Project = {
  id: number;
  name: string;
  location: string;
  sector: string;
  startDate: string;
  projectType: string;
  investmentCost: number;
  description: string;
  estimates: Estimate[];
};

export interface User {
  id: string;
  fullName: string;
  phoneNumber: string;
  imageUrl: string | null;
  email: string;
  countryCode: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  roles: string[];
  // Supplier, company and engineer sign-ups: no token yet; the phone must be
  // verified with the WhatsApp code, then an admin approves the account.
  requiresPhoneVerification?: boolean;
  otpSent?: boolean;
  otpError?: string | null;
}

export interface OtpSentResponse {
  userId: number;
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

// Shape of the API's error body (ValidationProblemDetails).
export interface ApiErrorBody {
  title: string;
  errors?: Record<string, string[]>;
}

export interface Company {
  id: number;
  companyName: string;
  email: string;
  password: string;
  countryCode: string;
  phoneNumber: string;
}

export interface Estimate {
  id: number;
  estimateNumber: string;
  name: string;
  companyId: number;
  companyName: string;
  projectId: number;
  projectName: string;
  estimateComplete: {
    id: number;
    name: string;
  };
  estimateStage: {
    id: number;
    name: string;
  };

  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  adminOfferPrice: number;
  isAdminOffer: boolean;
  notes: string;
  createdAt: string;

  totalItemPriceBefore: number;
  totalItemPriceAfter: number;
}

export interface Material {
  id: number;
  name: string;
  waste: number;
  unitId: number;
  unitName: string;
  entityCategoryMappingId: number;
  categoryName?: string;
  subCategoryName?: string;
  notes?: string;
  supplierName?: string | null;
  price?: string | null;
  validUntil?: string | null;
  image: string | null;
  suppliers: {
    id: number;
    price: number;
    supplierName: string;
    isAdmin: boolean;
  }[];
  subCategoryId:number;
  categoryId:number
}

export interface Daily {
  id: number;
  name: string;
  category: number;
  pricePerDay: number;
  note: string;
}

export interface ManufacturingDaily {
  id: number;
  quantity: number;
  daily: {
    id: number;
    name: string;
    category: number;
    pricePerDay: number;
    note?: string;
    publicCategory: {
      id: number;
      name: string;
    };
  };
}

export interface MaterialWithSuppliers {
  id: number;
  supplierId: number;
  supplierName: string;
  materialId: number;
  materialName: string;
  price: number;
  isAdminPrice: boolean;
  categoryName: string;
  subCategoryName: string;
  unitId: number;
  unitName: string;
  waste: number;
}

export interface Supplier {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  password?: string;
  countryCode?: string;
  entityCategoryMappingId: number;
  categoryName?: string;
  subCategoryName?: string;
  materials?: Material[] | null;
}

export interface Unit {
  id: number;
  value: string;
}

export interface Test {
  id: number;
  name: string;
  costPerUnit: number;
  note: string;
  entityCategoryMappingId: number;
  categoryName: string;
  subCategoryName: string;
}
