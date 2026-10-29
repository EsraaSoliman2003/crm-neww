import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import instance from "@/lib/axios";

/* ===========================
   Types
=========================== */

export interface AddedValue {
  id: number;
  name: string;
  percentage: number;
  entityTypeId: number;
  categoryId: number;
  rateCategoryId?: number;
  rateCategoryName: string;
  notes: string;
}

/* ===========================
   State
=========================== */

interface AddedValueState {
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  data: AddedValue[];
  error: string | null;
}

const initialState: AddedValueState = {
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  data: [],
  error: null,
};

/* ===========================
   GET ALL
=========================== */

export const fetchAddedValues = createAsyncThunk(
  "addedValue/fetchAll",
  async () => {
    const res = await instance.get(`/AddedValue`);
    return res.data as AddedValue[];
  }
);

/* ===========================
   CREATE
=========================== */

export const createAddedValue = createAsyncThunk(
  "addedValue/create",
  async (payload: {
    name: string;
    percentage: number;
    entityTypeId: number;
    rateCategoryId: number;
    notes: string;
  }) => {
    const res = await instance.post(`/AddedValue`, payload);
    return res.data as AddedValue;
  }
);

/* ===========================
   UPDATE (NEW ENDPOINT)
=========================== */

export const updateAddedValue = createAsyncThunk(
  "addedValue/update",
  async ({
    id,
    data,
  }: {
    id: number;
    data: {
      name: string;
      percentage: number;
      rateCategoryId: number;
      rateCategoryName: string;
      notes: string;
    };
  }) => {
    await instance.put(`/AddedValue/${id}`, {
      name: data.name,
      percentage: data.percentage,
      rateCategoryId: data.rateCategoryId,
      notes: data.notes,
    });
    return { id, ...data };
  }
);

/* ===========================
   DELETE
=========================== */

export const deleteAddedValue = createAsyncThunk(
  "addedValue/delete",
  async (id: number) => {
    await instance.delete(`/AddedValue/${id}`);
    return { id };
  }
);

/* ===========================
   Slice
=========================== */

const addedValueSlice = createSlice({
  name: "addedValue",
  initialState,
  reducers: {
    resetAddedValue: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* ===== GET ===== */
      .addCase(fetchAddedValues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAddedValues.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchAddedValues.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to fetch added values";
      })

      /* ===== CREATE ===== */
      .addCase(createAddedValue.pending, (state) => {
        state.creating = true;
      })
      .addCase(createAddedValue.fulfilled, (state, action) => {
        state.creating = false;
        state.data.unshift(action.payload);
      })
      .addCase(createAddedValue.rejected, (state) => {
        state.creating = false;
      })

      /* ===== UPDATE ===== */
      .addCase(updateAddedValue.pending, (state) => {
        state.updating = true;
      })
      .addCase(updateAddedValue.fulfilled, (state, action) => {
        state.updating = false;
        const index = state.data.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.data[index] = { ...state.data[index], ...action.payload };
        }
      })
      .addCase(updateAddedValue.rejected, (state) => {
        state.updating = false;
      })

      /* ===== DELETE ===== */
      .addCase(deleteAddedValue.fulfilled, (state, action) => {
        state.data = state.data.filter(
          (item) => item.id !== action.payload.id
        );
      });
  },
});

export const { resetAddedValue } = addedValueSlice.actions;
export default addedValueSlice.reducer;
