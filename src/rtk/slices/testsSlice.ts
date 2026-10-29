import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import instance from "@/lib/axios";
import { Test } from "@/utils/dtos";

/* ===========================
   State
=========================== */

interface TestState {
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  data: Test[];
  error: string | null;
}

const initialState: TestState = {
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  data: [],
  error: null,
};

/* ===========================
   Fetch All
=========================== */

export const fetchTests = createAsyncThunk("test/fetchAll", async () => {
  const res = await instance.get(`/Test`);
  return res.data as Test[];
});

/* ===========================
   Create
=========================== */

export const createTest = createAsyncThunk(
  "test/create",
  async (payload: {
    name: string;
    costPerUnit: number;
    note: string;
    entityCategoryMappingId: number;
  }) => {
    const res = await instance.post(`/Test`, payload);
    return res.data as Test;
  },
);
/* ===========================
   Update
=========================== */

export const updateTest = createAsyncThunk(
  "test/update",
  async (payload: {
    id: number;
    name: string;
    costPerUnit: number;
    note: string;
    entityCategoryMappingId: number;
  }) => {
    const res = await instance.put(`/Test/${payload.id}`, payload);

    return res.data as Test;
  },
);

/* ===========================
   Delete
=========================== */

export const deleteTest = createAsyncThunk(
  "test/delete",
  async (id: number) => {
    await instance.delete(`/Test/${id}`);
    return { id };
  },
);

/* ===========================
   Slice
=========================== */

const testSlice = createSlice({
  name: "test",
  initialState,
  reducers: {
    resetTestState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* ===== Fetch ===== */
      .addCase(fetchTests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTests.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchTests.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to fetch tests";
      })

      /* ===== Create ===== */
      .addCase(createTest.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createTest.fulfilled, (state, action) => {
        state.creating = false;
        state.data.unshift(action.payload);
      })
      .addCase(createTest.rejected, (state) => {
        state.creating = false;
      })
      /* ===== Update ===== */
      .addCase(updateTest.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateTest.fulfilled, (state, action) => {
        state.updating = false;

        state.data = state.data.map((item) =>
          item.id === action.payload.id ? action.payload : item,
        );
      })
      .addCase(updateTest.rejected, (state) => {
        state.updating = false;
      })

      /* ===== Delete ===== */
      .addCase(deleteTest.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteTest.fulfilled, (state, action) => {
        state.deleting = false;
        state.data = state.data.filter((item) => item.id !== action.payload.id);
      })
      .addCase(deleteTest.rejected, (state) => {
        state.deleting = false;
      });
  },
});

export const { resetTestState } = testSlice.actions;
export default testSlice.reducer;
