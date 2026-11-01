export interface Supplier {
  supplierId: number;
  name: string;
  supplierMaterialId: number;
  price: number;
}

export interface Material {
  id: number;
  name: string;
  waste: number;
  unitId: number;
  unitName: string;
  entityCategoryMappingId: number;
  categoryName: string;
  subCategoryName: string;
  notes: string;
  brand?: string;
}

export interface MaterialWithSuppliers {
  material: Material;
  suppliers: Supplier[];
}

export interface SelectedMaterialItem {
  materialId: number;
  materialName: string;
  categoryName?: string;
  subCategoryName?: string;
  unitName: string;
  waste: number;
  note?: string;

  supplierId: number;
  supplierName: string;
  price: number;
  supplierMaterialId:number;

  quantity: number;
}

export interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
  imageUrl: string | null;
  aboutMe: string | null;
  coverImage: string | null;
}

export interface Estimate {
  id: number;
  estimateNumber: string;
  name: string;

  companyId: number;
  companyName: string;
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
  totalItemPriceBefore: number;
  totalItemPriceAfter: number;

  adminOfferPrice: number;
  isAdminOffer: boolean;

  notes: string;
  createdAt: string;
  updatedAt: string;

  items: EstimateItem[];
}

export interface EstimateItem {
  id: number;
  name: string;

  categoryName: string;
  subCategoryName: string;

  cost: number;
  costAfterRate: number;

  isAnalyzed: boolean;
  note: string;

  unit: {
    id: number;
    value: string;
  };

  entityCategoryMapping: {
    id: number;
    category: {
      id: number;
      name: string;
    };
    subCategory: {
      id: number;
      name: string;
      categoryId: number;
    };
  };
}


export type UpdateMaterialDto = {
  id: number;
  name: string;
  unitId: number;
  waste: number;
  entityCategoryMappingId: number;
  supplierId: number;
  price: number;
  notes: string;
  brand?: string;
  image:File | null
};