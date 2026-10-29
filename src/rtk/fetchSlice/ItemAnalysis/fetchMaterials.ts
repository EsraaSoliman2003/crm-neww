
import { createSlice } from "@reduxjs/toolkit";
import { materialsItems } from "../thunks/fetchMaterials";
import { MaterialWithSuppliers } from "@/lib/dtos";

interface MaterialsState {
  data: MaterialWithSuppliers[];
  loading: boolean;
  error: string | null;
}

const initialState: MaterialsState = {
  data: [],
  loading: false,
  error: null,
};

const materialsItemsSlice = createSlice({
  name: "materialsItems",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(materialsItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(materialsItems.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(materialsItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error";
      });
  },
});

export default materialsItemsSlice.reducer;
