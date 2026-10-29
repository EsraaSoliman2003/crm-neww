import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import instance from "@/lib/axios";

/* ===========================
   Types
=========================== */
export interface Category {
  id: number;
  name: string;
}

interface CategoriesState {
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  selected?: Category;
  data: Category[];
  error: string | null;
}

/* ===========================
   Initial State
=========================== */
const initialState: CategoriesState = {
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  selected: undefined,
  data: [],
  error: null,
};

/* ===========================
   Fetch Categories
=========================== */
export const fetchCategories = createAsyncThunk(
  "categories/fetchAll",
  async () => {
    const res = await instance.get(`/Category`);
    return res.data;
  },
);

/* ===========================
   Fetch Category Bi Id
=========================== */
export const fetchCategoryById = createAsyncThunk<Category, number>(
  "categories/fetchById",
  async (id) => {
    const res = await instance.get(`/Category/${id}`);
    return res.data;
  },
);

/* ===========================
   Create Category
=========================== */
export const createCategory = createAsyncThunk(
  "categories/create",
  async (category: { name: string }) => {
    const res = await instance.post(`/Category`, category);
    return res.data;
  },
);

/* ===========================
   Update Category
=========================== */
/* ===========================
   Update Category (PUT /api/Category)
=========================== */
export const updateCategory = createAsyncThunk(
  "categories/update",
  async (category: { id: number; name: string }) => {
    const res = await instance.put(`/Category`, {
      id: category.id,
      name: category.name,
    });

    return (res.data?.id ? res.data : category) as Category;
  },
);

/* ===========================
   Delete Category
=========================== */
export const deleteCategory = createAsyncThunk(
  "categories/delete",
  async (id: number) => {
    await instance.delete(`/Category/${id}`);
    return { id };
  },
);

/* ===========================
   Slice
=========================== */
const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    resetCategoriesState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* ===== Fetch ===== */
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchCategories.rejected, (state) => {
        state.loading = false;
      })

      /* ===== Create ===== */
      .addCase(createCategory.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.creating = false;
        state.data.unshift(action.payload);
      })
      .addCase(createCategory.rejected, (state) => {
        state.creating = false;
      })

      /* ===== Update ===== */
      .addCase(updateCategory.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.updating = false;

        const index = state.data.findIndex(
          (item) => item.id === action.payload.id,
        );

        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })
      .addCase(updateCategory.rejected, (state) => {
        state.updating = false;
      })

      /* ===== Delete ===== */
      .addCase(deleteCategory.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.deleting = false;
        state.data = state.data.filter((item) => item.id !== action.payload.id);
      })
      .addCase(deleteCategory.rejected, (state) => {
        state.deleting = false;
      })

      /* ===== Get Category By Id ===== */
      .addCase(fetchCategoryById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchCategoryById.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { resetCategoriesState } = categoriesSlice.actions;
export default categoriesSlice.reducer;
