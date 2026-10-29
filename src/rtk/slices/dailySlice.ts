import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Daily } from "@/utils/dtos";
import instance from "@/lib/axios";

/* ===========================
   Types
=========================== */

interface DailyResponse {
  items: Daily[];
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
interface DailyState {
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  data: Daily[];
  selectedDaily: Daily | null;
  pagination: Omit<DailyResponse, "items"> | null;
  error: string | null;
}

const initialState: DailyState = {
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  data: [],
  selectedDaily: null,
  pagination: null,
  error: null,
};

/* ===========================
   Fetch All (Paginated)
=========================== */
export const fetchDailies = createAsyncThunk(
  "daily/fetchAll",
  async ({
    page = 1,
    pageSize = 1000,
  }: {
    page?: number;
    pageSize?: number;
  }) => {
    const res = await instance.get(`/Daily?page=${page}&pageSize=${pageSize}`);
    return res.data as DailyResponse;
  },
);

export const fetchDailyById = createAsyncThunk(
  "daily/fetchById",
  async (id: number) => {
    const res = await instance.get(`/Daily/${id}`);
    return res.data as Daily;
  },
);

/* ===========================
   Create
=========================== */
export const createDaily = createAsyncThunk(
  "daily/create",
  async (
    payload: Omit<Daily, "id" | "publicCategory">,
  ) => {
    const res = await instance.post(`/Daily`, {
      name: payload.name,
      category: payload.category,
      pricePerDay: payload.pricePerDay,
  
      note: payload.note
    });

    return res.data;
  },
);

/* ===========================
   Update
=========================== */
export const updateDaily = createAsyncThunk(
  "daily/update",
  async (payload: {
    id: number;
    name: string;
    category: number;
    pricePerDay: number;
    note:string
  }) => {
    const res = await instance.put(`/Daily`, {
      id: payload.id,
      name: payload.name,
      category: payload.category,
      pricePerDay: payload.pricePerDay,
      note:payload.note
    });

    return res.data;
  },
);

/* ===========================
   Delete
=========================== */
export const deleteDaily = createAsyncThunk(
  "daily/delete",
  async (id: number) => {
    await instance.delete(`/Daily/${id}`);
    return { id };
  },
);

/* ===========================
   Slice
=========================== */
const dailySlice = createSlice({
  name: "daily",
  initialState,
  reducers: {
    resetDailyState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* ===== Fetch ===== */
      .addCase(fetchDailies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDailies.fulfilled, (state, action) => {
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
      .addCase(fetchDailies.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to fetch dailies";
      })

      /* ===== Fetch By Id ===== */
      .addCase(fetchDailyById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDailyById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedDaily = action.payload;
      })
      .addCase(fetchDailyById.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to fetch dailies";
      })

      /* ===== Create ===== */
      .addCase(createDaily.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createDaily.fulfilled, (state, action) => {
        state.creating = false;
        state.data.unshift(action.payload);
      })
      .addCase(createDaily.rejected, (state) => {
        state.creating = false;
      })

      /* ===== Update ===== */
      .addCase(updateDaily.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateDaily.fulfilled, (state, action) => {
        state.updating = false;

        const index = state.data.findIndex(
          (item) => item.id === action.payload.id,
        );

        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })
      .addCase(updateDaily.rejected, (state) => {
        state.updating = false;
      })

      /* ===== Delete ===== */
      .addCase(deleteDaily.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteDaily.fulfilled, (state, action) => {
        state.deleting = false;
        state.data = state.data.filter((item) => item.id !== action.payload.id);
      })
      .addCase(deleteDaily.rejected, (state) => {
        state.deleting = false;
      });
  },
});

export const { resetDailyState } = dailySlice.actions;
export default dailySlice.reducer;
