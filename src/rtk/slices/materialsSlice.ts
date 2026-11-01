import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Material } from "@/utils/dtos";
import instance from "@/lib/axios";
import { UpdateMaterialDto } from "@/lib/dtos";

/* ===========================
   Initial State
=========================== */
interface MaterialsState {
  loading: boolean;
  unapprovedLoading: boolean;
  approvingId: number | null;
  creating: boolean;
  deleting: boolean;
  data: Material[];
  unapprovedData: Material[];
  error: string | null;
}

const initialState: MaterialsState = {
  loading: false,
  unapprovedLoading: false,
  approvingId: null,
  creating: false,
  deleting: false,
  data: [],
  unapprovedData: [],
  error: null,
};

/* ===========================
   Fetch Materials
=========================== */
export const fetchMaterials = createAsyncThunk(
  "materials/fetchAll",
  async () => {
    const res = await instance.get(`/Material`);
    return res.data;
  },
);

/* ===========================
   Create Material
=========================== */
export type CreateMaterialDto = {
  name: string;
  unitId: number;
  waste: number;
  entityCategoryMappingId: number;
  supplierId: number;
  price: number;
  notes: string;
  // المصدر / الماركة (optional)
  brand?: string;
  image: File | null;
};
export const createMaterial = createAsyncThunk(
  "materials/create",
  async (materialData: CreateMaterialDto) => {
    const formData = new FormData();

    formData.append("name", materialData.name);
    formData.append("unitId", String(materialData.unitId));
    formData.append("waste", String(materialData.waste));
    formData.append(
      "entityCategoryMappingId",
      String(materialData.entityCategoryMappingId),
    );
    formData.append("supplierId", String(materialData.supplierId));
    formData.append("price", String(materialData.price));
    formData.append("notes", materialData.notes);
    formData.append("brand", materialData.brand ?? "");
    if (materialData.image) {
      formData.append("image", materialData.image);
    }

    const res = await instance.post("Material", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },
);

export const fetchUnapprovedMaterials = createAsyncThunk(
  "materials/fetchUnapproved",
  async () => {
    const res = await instance.get(`/Material/unApproved`);
    return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
  },
);

export const approveMaterial = createAsyncThunk(
  "materials/approve",
  async (id: number) => {
    await instance.post(`/Material/approved/${id}`);
    return id;
  },
);

export type CreateMaterialBySupplierDto = Omit<
  CreateMaterialDto,
  "supplierId"
> & {
  validUntil: string;
};

export const createMaterialBySupplier = createAsyncThunk(
  "materials/createBySupplier",
  async (materialData: CreateMaterialBySupplierDto) => {
    const formData = new FormData();

    formData.append("Price", String(materialData.price));
    if (materialData.validUntil) {
      formData.append("ValidUntil", materialData.validUntil);
    }
    formData.append("Name", materialData.name);
    formData.append("Waste", String(materialData.waste));
    formData.append("UnitId", String(materialData.unitId));
    formData.append(
      "EntityCategoryMappingId",
      String(materialData.entityCategoryMappingId),
    );
    formData.append("Notes", materialData.notes);
    formData.append("Brand", materialData.brand ?? "");
    if (materialData.image) {
      formData.append("Image", materialData.image);
    }

    const res = await instance.post("Material/AddBySupplier", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },
);

/* ===========================
   Update Material
=========================== */
export const updateMaterial = createAsyncThunk(
  "materials/update",
  async (materialData: UpdateMaterialDto) => {
    const formData = new FormData();

    formData.append("name", materialData.name);
    formData.append("unitId", String(materialData.unitId));
    formData.append("waste", String(materialData.waste));
    formData.append(
      "entityCategoryMappingId",
      String(materialData.entityCategoryMappingId),
    );
    formData.append("supplierId", String(materialData.supplierId));
    formData.append("price", String(materialData.price));
    formData.append("notes", materialData.notes);
    formData.append("brand", materialData.brand ?? "");

    if (materialData.image) {
      formData.append("image", materialData.image);
    }

    const res = await instance.put(`/Material/${materialData.id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },
);

/* ===========================
   Delete Material
=========================== */
export const deleteMaterial = createAsyncThunk(
  "materials/delete",
  async (id: number) => {
    await instance.delete(`/Material/${id}`);
    return { id };
  },
);
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
      .addCase(fetchMaterials.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMaterials.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchMaterials.rejected, (state) => {
        state.loading = false;
      })

      /* ===== Unapproved Materials ===== */
      .addCase(fetchUnapprovedMaterials.pending, (state) => {
        state.unapprovedLoading = true;
        state.error = null;
      })
      .addCase(fetchUnapprovedMaterials.fulfilled, (state, action) => {
        state.unapprovedLoading = false;
        state.unapprovedData = action.payload;
      })
      .addCase(fetchUnapprovedMaterials.rejected, (state) => {
        state.unapprovedLoading = false;
      })

      /* ===== Approve ===== */
      .addCase(approveMaterial.pending, (state, action) => {
        state.approvingId = action.meta.arg;
        state.error = null;
      })
      .addCase(approveMaterial.fulfilled, (state, action) => {
        state.approvingId = null;
        state.unapprovedData = state.unapprovedData.filter(
          (material) => material.id !== action.payload,
        );
      })
      .addCase(approveMaterial.rejected, (state) => {
        state.approvingId = null;
      })

      /* ===== Create ===== */
      .addCase(createMaterial.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createMaterial.fulfilled, (state, action) => {
        state.creating = false;
        state.data.unshift(action.payload);
      })
      .addCase(createMaterial.rejected, (state) => {
        state.creating = false;
      })

      /* ===== Create By Supplier ===== */
      .addCase(createMaterialBySupplier.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createMaterialBySupplier.fulfilled, (state, action) => {
        state.creating = false;
        if (action.payload) state.data.unshift(action.payload);
      })
      .addCase(createMaterialBySupplier.rejected, (state) => {
        state.creating = false;
      })

      /* ===== Update ===== */
      .addCase(updateMaterial.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(updateMaterial.fulfilled, (state, action) => {
        state.creating = false;

        state.data = state.data.map((material) =>
          material.id === action.payload.id ? action.payload : material,
        );
      })
      .addCase(updateMaterial.rejected, (state) => {
        state.creating = false;
      })

      /* ===== Delete ===== */
      .addCase(deleteMaterial.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteMaterial.fulfilled, (state, action) => {
        state.deleting = false;

        state.data = state.data.filter(
          (material) => material.id !== action.payload.id,
        );
      })
      .addCase(deleteMaterial.rejected, (state) => {
        state.deleting = false;
      });
  },
});

export const { resetMaterialsState } = materialsSlice.actions;
export default materialsSlice.reducer;
