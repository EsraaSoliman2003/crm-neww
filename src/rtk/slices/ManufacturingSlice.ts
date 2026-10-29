import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { ManufacturingDaily } from "@/utils/dtos";
import instance from "@/lib/axios";

/* ===========================
   Types
=========================== */

export interface Manufacturing {
  id: number;
  name: string;
  dailies: ManufacturingDaily[];
  performanceRate: number;
  unitId?: number;
  unitName?: string;
  unit?: { id: number; value: string } | string;
  notes: string;
  categoryId?: number;
  publicCategory?: {
    id: number;
    name: string;
  };
  performanceRateImage: string | null;
}

interface ManufacturingResponse {
  items: Manufacturing[];
  currentPage: number;
  nextPage: number;
  previousPage: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageCount: number;
}

/* ===========================
   State
=========================== */

interface ManufacturingState {
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  data: Manufacturing[];
  pagination: Omit<ManufacturingResponse, "items"> | null;
  error: string | null;
}

const initialState: ManufacturingState = {
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  data: [],
  pagination: null,
  error: null,
};

/* ===========================
   Fetch All
=========================== */

export const fetchManufacturing = createAsyncThunk(
  "manufacturing/fetchAll",
  async ({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number }) => {
    const res = await instance.get(
      `/Manufacturing?page=${page}&pageSize=${pageSize}`,
    );
    return res.data as ManufacturingResponse;
  },
);

/* ===========================
   Create
=========================== */

export const createManufacturing = createAsyncThunk(
  "manufacturing/create",
  async (payload: {
    name: string;
    categoryId: number;
    dailies: { quantity: number; dailyId: number }[];
    performanceRate: number;
    unitId?: number;
    notes: string;
    image: File | null;
  }) => {
    const formData = new FormData();

    formData.append("name", payload.name);
    formData.append("categoryId", String(payload.categoryId));
    formData.append("performanceRate", String(payload.performanceRate));
    if (payload.unitId) formData.append("UnitId", String(payload.unitId));
    formData.append("notes", payload.notes);
    payload.dailies.forEach((item, index) => {
      formData.append(`dailies[${index}].quantity`, String(item.quantity));
      formData.append(`dailies[${index}].dailyId`, String(item.dailyId));
    });
    if (payload.image) {
      formData.append("PerformanceRateImage", payload.image);
    }

    const res = await instance.post("/Manufacturing", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data as Manufacturing;
  },
);

/* ===========================
   Update
=========================== */

export const updateManufacturing = createAsyncThunk(
  "manufacturing/update",
  async (payload: {
    id: number;
    name: string;
    categoryId: number;
    dailies: { quantity: number; dailyId: number }[];
    performanceRate: number;
    unitId?: number;
    notes: string;
    image?: File | null;
  }) => {
    const formData = new FormData();

    formData.append("id", String(payload.id));
    formData.append("name", payload.name);
    formData.append("categoryId", String(payload.categoryId));
    formData.append("performanceRate", String(payload.performanceRate));
    if (payload.unitId) formData.append("UnitId", String(payload.unitId));
    formData.append("notes", payload.notes);

    payload.dailies.forEach((item, index) => {
      formData.append(`dailies[${index}].quantity`, String(item.quantity));
      formData.append(`dailies[${index}].dailyId`, String(item.dailyId));
    });

    if (payload.image) {
      formData.append("PerformanceRateImage", payload.image);
    }

    const res = await instance.put(`/Manufacturing/${payload.id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data as Manufacturing;
  },
);

/* ===========================
   Delete
=========================== */

export const deleteManufacturing = createAsyncThunk(
  "manufacturing/delete",
  async (id: number) => {
    await instance.delete(`/Manufacturing/${id}`);
    return { id };
  },
);

/* ===========================
   Slice
=========================== */

const manufacturingSlice = createSlice({
  name: "manufacturing",
  initialState,
  reducers: {
    resetManufacturingState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* ===== Fetch ===== */
      .addCase(fetchManufacturing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchManufacturing.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.items;
        state.pagination = {
          currentPage: action.payload.currentPage,
          nextPage: action.payload.nextPage,
          previousPage: action.payload.previousPage,
          totalItems: action.payload.totalItems,
          hasNextPage: action.payload.hasNextPage,
          hasPreviousPage: action.payload.hasPreviousPage,
          pageCount: action.payload.pageCount,
        };
      })
      .addCase(fetchManufacturing.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to fetch manufacturing";
      })

      /* ===== Create ===== */
      .addCase(createManufacturing.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createManufacturing.fulfilled, (state, action) => {
        state.creating = false;
        state.data.unshift(action.payload);
      })
      .addCase(createManufacturing.rejected, (state) => {
        state.creating = false;
      })

      /* ===== Update ===== */
      .addCase(updateManufacturing.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateManufacturing.fulfilled, (state, action) => {
        state.updating = false;

        const index = state.data.findIndex(
          (item) => item.id === action.payload.id,
        );

        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })
      .addCase(updateManufacturing.rejected, (state) => {
        state.updating = false;
      })

      /* ===== Delete ===== */
      .addCase(deleteManufacturing.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteManufacturing.fulfilled, (state, action) => {
        state.deleting = false;
        state.data = state.data.filter((item) => item.id !== action.payload.id);
      })
      .addCase(deleteManufacturing.rejected, (state) => {
        state.deleting = false;
      });
  },
});

export const { resetManufacturingState } = manufacturingSlice.actions;
export default manufacturingSlice.reducer;
