import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import instance from "@/lib/axios";
import { Unit } from "@/utils/dtos";
import { Category } from "./categoriesSlice";

/* ===========================
   Types
=========================== */

export interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
}
export interface EntityCategoryMapping {
  id: number;
  category: Category;
  subCategory: SubCategory;
}
export interface Item {
  id: number;
  name: string;
  cost: number;
  costAfterRate: number;
  isAnalyzed: boolean;
  note: string | null;
  unit: Unit | null;
  entityCategoryMapping: EntityCategoryMapping | null;
  subCategoryName?:string
  categoryName?:string
}

interface ItemResponse {
  items: Item[];
  currentPage: number;
  nextPage: number;
  previousPage: number;
  firstPageLink: string;
  lastPageLink: string;
  nextPageLink: string;
  previousPageLink: string;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageCount: number;
}

// ================= Analyze Details =================
export interface AnalyzeItemDetails {
  id: number;
  name: string;
  cost: number;
  costAfterRate: number;
  note: string | null;

  totalMaterialPrice: number;
  totalTestPrice: number;
  totalManufacturingPrice: number;
  totalPrice: number;
  totalAddedValue?: number;

  itemManufacturings: {
    manufacturing: {
      id: number;
      name: string;
      performanceRate: number;
      totalDailyPrice: number;
      notes: string;
      dailies: {
        id: number;
        quantity: number;
        daily: {
          id: number;
          name: string;
          pricePerDay: number;
          category:number;
          publicCategory: {
            id: number;
            name: string;
          };
        };
      }[];
    };
  }[];

  itemTests: {
    test: {
      id: number;
      name: string;
      costPerUnit: number;
      note?: string | null;
    };
    unitRatePerTest: number;
  }[];

  itemSupplierMaterials: {
    supplierMaterial: {
      id: number;
      materialId?: number;
      materialName: string;
      categoryName?: string;
      subCategoryName?: string;
      unitName?: string;
      waste?: number;
      supplierId?: number;
      supplierName?: string;
      price: number;
      note?: string | null;
    };
    quantity: number;
  }[];
}

/* ===========================
   State
=========================== */

interface ItemState {
  loading: boolean;
  creating: boolean;
  analyzing: boolean;
  updatingAnalysisIds: number[];
  deleting: boolean;
  data: Item[];
  selectedItem: Item | null;
  analyzedItem: AnalyzeItemDetails | null;
  pagination: Omit<ItemResponse, "items"> | null;
  error: string | null;
}

const initialState: ItemState = {
  loading: false,
  creating: false,
  analyzing: false,
  updatingAnalysisIds: [],
  deleting: false,
  data: [],
  selectedItem: null,
  analyzedItem: null,
  pagination: null,
  error: null,
};

/* ===========================
   Fetch All
=========================== */

export const fetchItems = createAsyncThunk(
  "items/fetchAll",
  async ({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number }) => {
    const res = await instance.get(`/Item?page=${page}&pageSize=${pageSize}`);
    return res.data as ItemResponse;
  },
);

export const fetchItemById = createAsyncThunk(
  "items/fetchById",
  async (id: number) => {
    const res = await instance.get(`/Item/${id}`);
    return res.data as Item;
  },
);

/* ===========================
   Create
=========================== */

export const createItem = createAsyncThunk(
  "items/create",
  async (payload: {
    name: string;
    entityCategoryMappingId: number;
    unitId: number;
    cost: number;
    costAfterRate: number;
    note: string;
  }) => {
    const res = await instance.post(`/Item`, payload);
    return res.data as Item;
  },
);

/* ===========================
   Analyze 
=========================== */

interface AnalyzePayload {
  id: number;
  suppierMaterials: {
    supplierMaterialId: number;
    quantity: number;
  }[];
  tests: {
    testId: number;
    unitRatePerTest: number;
  }[];
  manufacturings: {
    manufacturingId: number;
  }[];
  totalAddedValue:number
}

export interface CreateSimilarItemPayload {
  name: string;
  entityCategoryMappingId: number;
  unitId: number | null;
  cost: number;
  costAfterRate: number;
  note: string | null;
  estimateId: number;
  totalAddedValue: number;
  suppierMaterials?: {
    supplierMaterialId: number;
    quantity: number;
  }[];
  tests?: {
    testId: number;
    unitRatePerTest: number;
  }[];
  manufacturings?: {
    manufacturingId: number;
  }[];
}

export const analyzeItem = createAsyncThunk(
  "items/analyze",
  async (payload: AnalyzePayload) => {
    const res = await instance.post(`/Item/analyze`, payload);
    return res.data;
  },
);

export const createSimilarItem = createAsyncThunk(
  "items/createSimilar",
  async (payload: CreateSimilarItemPayload) => {
    const res = await instance.post(`/Item/create-similar`, payload);
    return res.data as Item | null;
  },
);

/* ===========================
   Get Analyze Details 
=========================== */
export const fetchAnalyzeItem = createAsyncThunk(
  "items/fetchAnalyzeItem",
  async (id: number) => {
    const res = await instance.get(`/Item/analyze/${id}`);
    return res.data as AnalyzeItemDetails;
  },
);

export const updateItemBasicInfo = createAsyncThunk(
  "items/updateBasicInfo",
  async ({
    id,
    data,
  }: {
    id: number;
    data: {
      name: string;
      entityCategoryMappingId: number;
      unitId: number;
      cost: number;
      costAfterRate: number;
      note: string;
      id: number;
    };
  }) => {
    const res = await instance.put(`/Item/update-basic-info/${id}`, data);
    return res.data as Item;
  },
);

export const updateItemAnalyze = createAsyncThunk(
  "items/updateAnalyze",
  async (payload: AnalyzePayload) => {
    const res = await instance.put(
      `/Item/update-Analyze/${payload.id}`,
      payload,
    );
    return res.data;
  },
);

/* ===========================
   Delete
=========================== */

export const deleteItem = createAsyncThunk(
  "items/delete",
  async (id: number) => {
    await instance.delete(`/Item/${id}`);
    return { id };
  },
);

export const setItemAnalyzed = createAsyncThunk(
  "items/setAnalyzed",
  async (
    payload: { id: number; isAnalyzed: boolean },
    { rejectWithValue },
  ) => {
    try {
      await instance.put(`/Item/set-analyzed/${payload.id}`, null, {
        params: { isAnalyzed: payload.isAnalyzed },
      });
      return payload;
    } catch {
      return rejectWithValue("تعذر تغيير حالة تحليل البند");
    }
  },
  {
    condition: ({ id }, { getState }) => {
      const { items } = getState() as { items: ItemState };
      return !items.updatingAnalysisIds.includes(id);
    },
  },
);

/* ===========================
   Slice
=========================== */

const itemSlice = createSlice({
  name: "items",
  initialState,
  reducers: {
    resetItemState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* ===== Fetch ===== */
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.items;
        state.pagination = {
          currentPage: action.payload.currentPage,
          nextPage: action.payload.nextPage,
          previousPage: action.payload.previousPage,
          firstPageLink: action.payload.firstPageLink,
          lastPageLink: action.payload.lastPageLink,
          nextPageLink: action.payload.nextPageLink,
          previousPageLink: action.payload.previousPageLink,
          totalItems: action.payload.totalItems,
          hasNextPage: action.payload.hasNextPage,
          hasPreviousPage: action.payload.hasPreviousPage,
          pageCount: action.payload.pageCount,
        };
      })
      .addCase(fetchItems.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to fetch items";
      })

      /* ===== Fetch Item By Id ===== */
      .addCase(fetchItemById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItemById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchItemById.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to fetch item";
        state.selectedItem = null;
      })

      /* ===== Create ===== */
      .addCase(createItem.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createItem.fulfilled, (state, action) => {
        state.creating = false;
        state.data.unshift(action.payload);
      })
      .addCase(createItem.rejected, (state) => {
        state.creating = false;
      })

      /* ===== Analyze ===== */
      .addCase(analyzeItem.pending, (state) => {
        state.analyzing = true;
        state.error = null;
      })
      .addCase(analyzeItem.fulfilled, (state) => {
        state.analyzing = false;
      })
      .addCase(analyzeItem.rejected, (state) => {
        state.analyzing = false;
        state.error = "Failed to analyze item";
      })

      /* ===== Create Similar Item ===== */
      .addCase(createSimilarItem.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createSimilarItem.fulfilled, (state, action) => {
        state.creating = false;
        if (action.payload?.id) state.data.unshift(action.payload);
      })
      .addCase(createSimilarItem.rejected, (state) => {
        state.creating = false;
      })

      /* ===== Get Analyze Info ===== */
      .addCase(fetchAnalyzeItem.pending, (state) => {
        state.analyzing = true;
        state.error = null;
      })
      .addCase(fetchAnalyzeItem.fulfilled, (state, action) => {
        state.analyzing = false;
        state.analyzedItem = action.payload;
      })
      .addCase(fetchAnalyzeItem.rejected, (state) => {
        state.analyzing = false;
        state.error = "Failed to fetch analyzed item";
        state.analyzedItem = null;
      })

      /* ===== Update Basic Info ===== */
      .addCase(updateItemBasicInfo.pending, (state) => {
        state.creating = true;
      })
      .addCase(updateItemBasicInfo.fulfilled, (state, action) => {
        state.creating = false;

        const index = state.data.findIndex(
          (item) => item.id === action.payload.id,
        );

        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })
      .addCase(updateItemBasicInfo.rejected, (state) => {
        state.creating = false;
      })

      /* ===== Update Analyze ===== */
      .addCase(updateItemAnalyze.pending, (state) => {
        state.analyzing = true;
      })
      .addCase(updateItemAnalyze.fulfilled, (state) => {
        state.analyzing = false;
      })
      .addCase(updateItemAnalyze.rejected, (state) => {
        state.analyzing = false;
        state.error = "Failed to update analyze item";
      })

      /* ===== Analysis Status ===== */
      .addCase(setItemAnalyzed.pending, (state, action) => {
        state.updatingAnalysisIds.push(action.meta.arg.id);
      })
      .addCase(setItemAnalyzed.fulfilled, (state, action) => {
        const { id, isAnalyzed } = action.payload;
        state.updatingAnalysisIds = state.updatingAnalysisIds.filter(
          (itemId) => itemId !== id,
        );
        const item = state.data.find((item) => item.id === id);
        if (item) item.isAnalyzed = isAnalyzed;
        if (state.selectedItem?.id === id) {
          state.selectedItem.isAnalyzed = isAnalyzed;
        }
        if (state.analyzedItem?.id === id) state.analyzedItem = null;
      })
      .addCase(setItemAnalyzed.rejected, (state, action) => {
        state.updatingAnalysisIds = state.updatingAnalysisIds.filter(
          (itemId) => itemId !== action.meta.arg.id,
        );
      })

      /* ===== Delete ===== */
      .addCase(deleteItem.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.deleting = false;
        state.data = state.data.filter((item) => item.id !== action.payload.id);
      })
      .addCase(deleteItem.rejected, (state) => {
        state.deleting = false;
      });
  },
});

export const { resetItemState } = itemSlice.actions;
export default itemSlice.reducer;
