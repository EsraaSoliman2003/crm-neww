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

interface AnotherSubCategoriesState {
  loading: boolean;
  data: Item[];
  error: string | null;
}

/* ===========================
   Initial State
=========================== */

const initialState: AnotherSubCategoriesState = {
  loading: false,
  data: [],
  error: null,
};

/* ===========================
   Fetch Another SubCategories
=========================== */

export const fetchAnotherSubCategories = createAsyncThunk<
  Item[],
  number
>(
  "anotherSubCategories/fetchAll",
  async (entityTypeId: number) => {
    const res = await instance.get(
      `/EntityCategoryMapping/entity/${entityTypeId}/categories`
    );
    return res.data;
  }
);

/* ===========================
   Slice
=========================== */

const anotherSubCategoriesSlice = createSlice({
  name: "anotherSubCategories",
  initialState,
  reducers: {
    resetAnotherSubCategoriesState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* ===== Fetch ===== */
      .addCase(fetchAnotherSubCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnotherSubCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchAnotherSubCategories.rejected, (state) => {
        state.loading = false;
        state.data = [];
      });
  },
});

export const { resetAnotherSubCategoriesState } =
  anotherSubCategoriesSlice.actions;

export default anotherSubCategoriesSlice.reducer;