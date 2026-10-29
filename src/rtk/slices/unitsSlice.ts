import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Unit } from "@/utils/dtos";
import instance from "@/lib/axios";

/* ===========================
   Initial State
=========================== */
interface UnitsState {
  loading: boolean;
  creating: boolean;
  deleting: boolean;
  data: Unit[];
  error: string | null;
}

const initialState: UnitsState = {
  loading: false,
  creating: false,
  deleting: false,
  data: [],
  error: null,
};

/* ===========================
   Fetch Units
=========================== */
export const fetchUnits = createAsyncThunk("units/fetchAll", async () => {
  const res = await instance.get(`/Unit`);
  return res.data;
});

/* ===========================
   Create Unit
=========================== */
export const createUnit = createAsyncThunk(
  "units/create",
  async (value: string) => {
    const res = await instance.post(`/Unit`, {
      value: value,
    });
    return res.data;
  },
);

/* ===========================
   Delete Unit
=========================== */
export const deleteUnit = createAsyncThunk(
  "units/delete",
  async (id: number) => {
    await instance.delete(`/Unit/${id}`);
    return { id };
  },
);

/* ===========================
   Slice
=========================== */
const unitsSlice = createSlice({
  name: "units",
  initialState,
  reducers: {
    resetUnitsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* ===== Fetch ===== */
      .addCase(fetchUnits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUnits.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUnits.rejected, (state) => {
        state.loading = false;
      })

      /* ===== Create ===== */
      .addCase(createUnit.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createUnit.fulfilled, (state, action) => {
        state.creating = false;
        state.data.unshift(action.payload); // newest first
      })
      .addCase(createUnit.rejected, (state) => {
        state.creating = false;
      })

      /* ===== Delete ===== */
      .addCase(deleteUnit.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteUnit.fulfilled, (state, action) => {
        state.deleting = false;
        state.data = state.data.filter((unit) => unit.id !== action.payload.id);
      })
      .addCase(deleteUnit.rejected, (state) => {
        state.deleting = false;
      });
  },
});

export const { resetUnitsState } = unitsSlice.actions;
export default unitsSlice.reducer;
