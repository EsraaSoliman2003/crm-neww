import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import instance from "@/lib/axios";

/* ===========================
   Types
=========================== */
export interface SubCategory {
  subCategoryId: number;
  subCategoryName: string;
  entityCategoryMappingId: number;
}

export interface Item {
  categoryId: number;
  categoryName: string;
  subCategories: SubCategory[];
}

interface SubCategoriesState {
  loading: boolean;
  creating: boolean;
  deleting: boolean;
  data: Item[];
  error: string | null;
}

/* ===========================
   Initial State
=========================== */
const initialState: SubCategoriesState = {
  loading: false,
  creating: false,
  deleting: false,
  data: [],
  error: null,
};

/* ===========================
   Fetch SubCategories
=========================== */
export const fetchSubCategories = createAsyncThunk<Item[], number>(
  "subCategories/fetchAll",
  async (entityTypeId: number) => {
    const res = await instance.get(
      `/EntityCategoryMapping/entity/${entityTypeId}/categories`,
    );
    return res.data;
  },
);

/* ===========================
   Create SubCategory
=========================== */
export interface AssignSubCategoryPayload {
  entityTypeId: number;
  categoryId: number;
  subCategoryId?: number;
  subCategoryName: string;
}
export const assignSubCategory = createAsyncThunk(
  "subCategories/assign",
  async (data: AssignSubCategoryPayload) => {
    const res = await instance.post(`/SubCategory/assign`, data);
    return res.data;
  },
);

/* ===========================
   Delete SubCategory
=========================== */
export const deleteSubCategory = createAsyncThunk(
  "subCategories/delete",
  async (id: number) => {
    await instance.delete(`/SubCategory/${id}`);
    return { id };
  },
);

/* ===========================
   Slice
=========================== */
const subCategoriesSlice = createSlice({
  name: "subCategories",
  initialState,
  reducers: {
    resetSubCategoriesState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* ===== Fetch ===== */
      .addCase(fetchSubCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchSubCategories.rejected, (state) => {
        state.loading = false;
        state.data = [];
      })

      /* ===== Create ===== */
      .addCase(assignSubCategory.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(assignSubCategory.fulfilled, (state, action) => {
        state.creating = false;
        state.data.unshift(action.payload);
      })
      .addCase(assignSubCategory.rejected, (state) => {
        state.creating = false;
      })

      /* ===== Delete ===== */
      .addCase(deleteSubCategory.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteSubCategory.fulfilled, (state) => {
        state.deleting = false;
        // state.data = state.data.filter((item) => item.subCategories[].entityCategoryMappingId !== action.payload.id);
      })
      .addCase(deleteSubCategory.rejected, (state) => {
        state.deleting = false;
      });
  },
});

export const { resetSubCategoriesState } = subCategoriesSlice.actions;
export default subCategoriesSlice.reducer;
