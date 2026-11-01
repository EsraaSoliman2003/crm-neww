import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Supplier } from "@/utils/dtos";
import instance from "@/lib/axios";

/* ===========================
   Initial State
=========================== */
interface SuppliersState {
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  data: Supplier[];
  error: string | null;
}

const initialState: SuppliersState = {
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  data: [],
  error: null,
};

/* ===========================
   Fetch Suppliers
=========================== */
export const fetchSuppliers = createAsyncThunk<Supplier[], void>(
  "suppliers/fetchAll",
  async () => {
    const res = await instance.get("/Supplier");
    return res.data;
  },
);

/* ===========================
   Create Supplier
=========================== */
export const createSupplier = createAsyncThunk<string, Omit<Supplier, "id">>(
  "suppliers/create",
  async (supplierData) => {
    const res = await instance.post("/Supplier", {
      fullName: supplierData.name,
      email: supplierData.email,
      phoneNumber: supplierData.phoneNumber,
      password: supplierData.password,
      countryCode: supplierData.countryCode,
      categoryId: supplierData.categoryId,
      brand: supplierData.brand,
    });

    return res.data;
  },
);

export const updateSupplier = createAsyncThunk(
  "suppliers/update",
  async (supplierData: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
    countryCode: string;
    categoryId: number;
    categoryName?: string;
    brand: string | null;
  }) => {
    await instance.put(`/Supplier/${supplierData.id}`, {
      fullName: supplierData.name,
      email: supplierData.email,
      phoneNumber: supplierData.phoneNumber,
      countryCode: supplierData.countryCode,
      categoryId: supplierData.categoryId,
      brand: supplierData.brand,
    });
    return supplierData;
  },
);

/* ===========================
   Delete Supplier
=========================== */
export const deleteSupplier = createAsyncThunk<{ id: number }, number>(
  "suppliers/delete",
  async (id) => {
    await instance.delete(`/Supplier/${id}`);
    return { id };
  },
);

/* ===========================
   Slice
=========================== */
const suppliersSlice = createSlice({
  name: "suppliers",
  initialState,
  reducers: {
    resetSuppliersState: () => initialState,
  },
  extraReducers: (builder) => {
    builder

      /* ===== Fetch ===== */
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchSuppliers.rejected, (state) => {
        state.loading = false;
      })

      /* ===== Create ===== */
      .addCase(createSupplier.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createSupplier.fulfilled, (state) => {
        state.creating = false;
      })
      .addCase(createSupplier.rejected, (state) => {
        state.creating = false;
      })

      /* ===== Update ===== */
      .addCase(updateSupplier.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateSupplier.fulfilled, (state, action) => {
        state.updating = false;
        const index = state.data.findIndex(
          (supplier) => supplier.id === action.payload.id,
        );
        if (index !== -1) {
          state.data[index] = { ...state.data[index], ...action.payload };
        }
      })
      .addCase(updateSupplier.rejected, (state) => {
        state.updating = false;
      })

      /* ===== Delete ===== */
      .addCase(deleteSupplier.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteSupplier.fulfilled, (state, action) => {
        state.deleting = false;
        state.data = state.data.filter(
          (supplier) => supplier.id !== action.payload.id,
        );
      })
      .addCase(deleteSupplier.rejected, (state) => {
        state.deleting = false;
      });
  },
});

export const { resetSuppliersState } = suppliersSlice.actions;
export default suppliersSlice.reducer;
