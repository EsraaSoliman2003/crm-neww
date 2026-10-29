import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Estimate } from "@/utils/dtos";
import instance from "@/lib/axios";

/* ===========================
   Initial State
=========================== */
interface EstimatesState {
  loading: boolean;
  creating: boolean;
  deleting: boolean;
  updating: boolean;
  assigning: boolean;
  data: Estimate[];
  selectedEstimate: Estimate | null;
  error: string | null;
}

const initialState: EstimatesState = {
  loading: false,
  creating: false,
  deleting: false,
  updating: false,
  assigning: false,
  data: [],
  selectedEstimate: null,
  error: null,
};

/* ===========================
   Fetch Estimates
=========================== */
export const fetchEstimates = createAsyncThunk(
  "estimates/fetchAll",
  async () => {
    const res = await instance.get(`/Estimate/get-all`);
    return res.data;
  },
);

/* ===========================
   Fetch Estimate By Id (NEW)
=========================== */
export const fetchEstimateById = createAsyncThunk(
  "estimates/fetchById",
  async (id: number) => {
    const res = await instance.get(`/Estimate/${id}`);
    return res.data;
  },
);

/* ===========================
   Assign Estimate
=========================== */
export type AssignEstimateRequest = {
  estimateId: number;
  itemIds: number[];
};

export const assignEstimate = createAsyncThunk(
  "estimates/assign",
  async (payload: AssignEstimateRequest) => {
    const res = await instance.post(`/Estimate/Assign?isUpdate=false`, payload);
    return res.data;
  },
);

/* ===========================
   Create Estimate
=========================== */
export type CreateEstimateRequest = {
  estimateNumber: string;
  name: string;
  projectId: number;
  companyId: number;
  quantity: number;
  pricePerUnit: number;
  adminOfferPrice: number | null;
  notes: string;
  itemIds: number[];
  estimateCompleteId: number;
  estimateStageId: number;
};

export const createEstimate = createAsyncThunk(
  "estimates/create",
  async (estimateData: CreateEstimateRequest) => {
    const res = await instance.post(`/Estimate`, estimateData);
    return res.data;
  },
);

/* ===========================
   Update Estimate
=========================== */
export type UpdateEstimateRequest = Omit<
  CreateEstimateRequest,
  "quantity" | "itemIds"
> & {
  id: number;
};

export const updateEstimate = createAsyncThunk(
  "estimates/update",
  async (estimateData: UpdateEstimateRequest) => {
    const res = await instance.put(`/Estimate`, estimateData);
    return res.data;
  },
);

/* ===========================
   Delete Estimate
=========================== */
export const deleteEstimate = createAsyncThunk(
  "estimates/delete",
  async (id: number) => {
    await instance.delete(`/Estimate/${id}`);
    return { id };
  },
);

/* ===========================
   Slice
=========================== */
const estimatesSlice = createSlice({
  name: "estimates",
  initialState,
  reducers: {
    resetEstimatesState: () => initialState,
    clearSelectedEstimate: (state) => {
      state.selectedEstimate = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* ===== Fetch All ===== */
      .addCase(fetchEstimates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEstimates.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchEstimates.rejected, (state) => {
        state.loading = false;
      })

      /* ===== Fetch By Id (NEW) ===== */
      .addCase(fetchEstimateById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEstimateById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedEstimate = action.payload;
      })
      .addCase(fetchEstimateById.rejected, (state) => {
        state.loading = false;
      })

      /* ===== Create ===== */
      .addCase(createEstimate.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createEstimate.fulfilled, (state, action) => {
        state.creating = false;
        state.data.unshift(action.payload);
      })
      .addCase(createEstimate.rejected, (state) => {
        state.creating = false;
      })

      /* ===== Update ===== */
      .addCase(updateEstimate.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateEstimate.fulfilled, (state, action) => {
        state.updating = false;
        const index = state.data.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
        state.selectedEstimate = action.payload;
      })
      .addCase(updateEstimate.rejected, (state) => {
        state.updating = false;
      })

      /* ===== Assign ===== */
      .addCase(assignEstimate.pending, (state) => {
        state.assigning = true;
        state.error = null;
      })
      .addCase(assignEstimate.fulfilled, (state) => {
        state.assigning = false;
      })
      .addCase(assignEstimate.rejected, (state) => {
        state.assigning = false;
      })

      /* ===== Delete ===== */
      .addCase(deleteEstimate.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteEstimate.fulfilled, (state, action) => {
        state.deleting = false;
        state.data = state.data.filter(
          (estimate) => estimate.id !== action.payload.id,
        );
      })
      .addCase(deleteEstimate.rejected, (state) => {
        state.deleting = false;
      });
  },
});

export const { resetEstimatesState, clearSelectedEstimate } =
  estimatesSlice.actions;

export default estimatesSlice.reducer;
