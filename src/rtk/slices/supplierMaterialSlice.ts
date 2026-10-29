import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import instance from "@/lib/axios";

/* ===========================
   Initial State
=========================== */
export type SupplierMaterialGlobal = {
  id: number;
  supplierId: number;
  supplierName: string;
  materialId: number;
  materialName: string;
  price: number;
  isAdminPrice: boolean;
  categoryName: string;
  subCategoryName: string;
  unitId: number;
  unitName: string;
  waste: number;
};

export type SupplierMaterialBySupplier = {
  materialId: number;
  materialName: string;
  price: number;
  categoryName: string;
  subCategoryName: string;
};

interface MaterialsState {
  loading: boolean;
  creating: boolean;
  deleting: boolean;
  assigning: boolean;
  settingPrice: boolean;
  data: SupplierMaterialGlobal[];
  supplierMaterials: SupplierMaterialBySupplier[];
  globalSupplierMaterials: SupplierMaterialGlobal[];
  error: string | null;
}

const initialState: MaterialsState = {
  loading: false,
  creating: false,
  deleting: false,
  assigning: false,
  settingPrice: false,
  data: [],
  supplierMaterials: [],
  globalSupplierMaterials: [],
  error: null,
};

/* ===========================
   Fetch Materials
=========================== */
export const fetchRows = createAsyncThunk("supplierMaterials/fetchAll", async () => {
  const res = await instance.get(`/SupplierMaterial/Show`);
  return res.data;
});

/* ===========================
   Fetch Materials By Supplier
=========================== */
export const fetchSupplierMaterialsBySupplier = createAsyncThunk(
  "materials/fetchBySupplier",
  async (supplierUserId: number) => {
    const res = await instance.get(
      `/SupplierMaterial/supplier/${supplierUserId}/materials`,
    );

    return res.data as SupplierMaterialBySupplier[];
  },
);

/* ===========================
   Create Material
=========================== */
export type CreateMaterialRequest = {
  materialId: number;
  supplierId: number;
  price: number;
};

export const createRow = createAsyncThunk(
  "materials/create",
  async (materialData: CreateMaterialRequest) => {
    const res = await instance.post(`SupplierMaterial`, materialData);
    return res.data;
  },
);

/* ===========================
   Delete Material
=========================== */
export const deleteRow = createAsyncThunk(
  "materials/delete",
  async ({
    supplierId,
    materialId,
  }: {
    supplierId: number;
    materialId: number;
  }) => {
    await instance.delete(`/SupplierMaterial`, {
      params: {
        supplierId,
        materialId,
      },
    });

    return { supplierId, materialId };
  },
);

/* ===========================
   Assign Material To Display
=========================== */
export const assignMaterialToDisplay = createAsyncThunk(
  "materials/assignToDisplay",
  async ({
    materialIds,
    supplierIds,
  }: {
    materialIds: number[];
    supplierIds: number[];
  }) => {
    const res = await instance.post(`/SupplierMaterial/assing-to-display`, {
      materialIds,
      supplierIds,
    });

    return res.data;
  },
);

/* ===========================
   Assign Material To Display
=========================== */
export const fetchGlobalSupplierMaterials = createAsyncThunk(
  "materials/fetchGlobal",
  async (supplierId: number) => {
    const res = await instance.get(`/SupplierMaterial/Show-Global`, {
      params: { supplierId },
    });

    return res.data as SupplierMaterialGlobal[];
  },
);

/* ===========================
   Set Supplier Material Price
=========================== */
export const setSupplierPrice = createAsyncThunk<
  { materialId: number; price: number; isAll: boolean },
  { supplierId: number; materialId: number; price: number; isAll: boolean }
>("suppliers/setPrice", async (data) => {
  await instance.post(`/Supplier/set-price?isAll=${data.isAll}`, {
    supplierId: data.supplierId,
    materialId: data.materialId,
    price: data.price,
  });

  return {
    materialId: data.materialId,
    price: data.price,
    isAll: data.isAll,
  };
});

/* ===========================
   Slice
=========================== */
const materialsSlice = createSlice({
  name: "materials",
  initialState,
  reducers: {
    resetMaterialsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* ===== Fetch ===== */
      .addCase(fetchRows.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRows.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchRows.rejected, (state) => {
        state.loading = false;
      })

      /* ===== Fetch By Supplier  ===== */
      .addCase(fetchSupplierMaterialsBySupplier.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSupplierMaterialsBySupplier.fulfilled, (state, action) => {
        state.loading = false;
        state.supplierMaterials = action.payload;
      })
      .addCase(fetchSupplierMaterialsBySupplier.rejected, (state) => {
        state.loading = false;
      })

      /* ===== Create ===== */
      .addCase(createRow.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createRow.fulfilled, (state, action) => {
        state.creating = false;
        state.data.unshift(action.payload); // newest first
      })
      .addCase(createRow.rejected, (state) => {
        state.creating = false;
      })

      /* ===== Delete ===== */
      .addCase(deleteRow.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteRow.fulfilled, (state, action) => {
        state.deleting = false;

        state.data = state.data.filter(
          (item) =>
            !(
              item.supplierId === action.payload.supplierId &&
              item.materialId === action.payload.materialId
            ),
        );
      })
      .addCase(deleteRow.rejected, (state) => {
        state.deleting = false;
      })

      /* ===== Assign To Display ===== */
      .addCase(assignMaterialToDisplay.pending, (state) => {
        state.assigning = true;
        state.error = null;
      })
      .addCase(assignMaterialToDisplay.fulfilled, (state) => {
        state.assigning = false;
      })
      .addCase(assignMaterialToDisplay.rejected, (state) => {
        state.assigning = false;
      })

      /* ===== Fetch Global ===== */
      .addCase(fetchGlobalSupplierMaterials.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGlobalSupplierMaterials.fulfilled, (state, action) => {
        state.loading = false;
        state.globalSupplierMaterials = action.payload;
      })
      .addCase(fetchGlobalSupplierMaterials.rejected, (state) => {
        state.loading = false;
      })

      /* ===== Set Price ===== */
      .addCase(setSupplierPrice.pending, (state) => {
        state.settingPrice = true;
        state.error = null;
      })
      .addCase(setSupplierPrice.fulfilled, (state, action) => {
        state.settingPrice = false;

        const { materialId, price, isAll } = action.payload;

        if (isAll) {
          state.supplierMaterials = state.supplierMaterials.map((m) => ({
            ...m,
            price,
          }));
        } else {
          const item = state.supplierMaterials.find(
            (m) => m.materialId === materialId,
          );
          if (item) {
            item.price = price;
          }
        }
      })
      .addCase(setSupplierPrice.rejected, (state) => {
        state.settingPrice = false;
      });
  },
});

export const { resetMaterialsState } = materialsSlice.actions;
export default materialsSlice.reducer;
