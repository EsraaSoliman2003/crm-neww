import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Company } from "@/utils/dtos";
import instance from "@/lib/axios";

/* ===========================
   Initial State
=========================== */
export interface CompanyEstimate {
  estimateId: number;
  estimateName: string;
  categoryName: string | null;
  subCategoryName: string | null;
  price: number;
  isAdminPrice: boolean;
  stageName?:string
  completeName?:string
  id?:number
}

export interface CompanyGlobalEstimate extends CompanyEstimate {
  companyId: number;
  companyName: string;
}
interface CompaniesState {
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;

  estimatesLoading: boolean;
  globalEstimatesLoading: boolean;
  assigning: boolean;
  settingPrice: boolean;

  data: Company[];
  estimates: CompanyEstimate[];
  globalEstimates: CompanyGlobalEstimate[];

  error: string | null;
}

const initialState: CompaniesState = {
  loading: false,
  creating: false,
  updating: false,
  deleting: false,

  estimatesLoading: false,
  globalEstimatesLoading: false,
  assigning: false,
  settingPrice: false,

  data: [],
  estimates: [],
  globalEstimates: [],

  error: null,
};

/* ===========================
   Fetch Projects
=========================== */
export const fetchCompanies = createAsyncThunk(
  "companies/fetchAll",
  async () => {
    const res = await instance.get(`/Company/all-companies`);
    return res.data;
  },
);

/* ===========================
   Create Company
=========================== */
export const createCompany = createAsyncThunk(
  "companies/create",
  async (companyData: Omit<Company, "id">) => {
    const res = await instance.post(`Company/create-company`, {
      companyName: companyData.companyName,
      email: companyData.email,
      password: companyData.password,
      countryCode: companyData.countryCode,
      phoneNumber: companyData.phoneNumber,
    });

    return res.data;
  },
);

export const updateCompany = createAsyncThunk(
  "companies/update",
  async (companyData: {
    id: number;
    companyName: string;
    email: string;
    countryCode: string;
    phoneNumber: string;
  }) => {
    const formData = new FormData();
    formData.append("Id", String(companyData.id));
    formData.append("FullName", companyData.companyName);
    formData.append("PhoneNumber", companyData.phoneNumber);
    formData.append("CountryCode", companyData.countryCode);
    formData.append("Email", companyData.email);
    await instance.put("/User", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return companyData;
  },
);

/* ===========================
   Delete Company
=========================== */
export const deleteCompany = createAsyncThunk(
  "companies/delete",
  async (id: number) => {
    await instance.delete(`/Company/${id}`);
    return { id };
  },
);

export const fetchCompanyEstimates = createAsyncThunk(
  "companies/fetchEstimates",
  async (companyId: number) => {
    const res = await instance.get(`/Company/${companyId}/estimates`);
    return res.data;
  },
);

export const fetchCompanyGlobalEstimates = createAsyncThunk(
  "companies/fetchGlobalEstimates",
  async (companyId: number) => {
    const res = await instance.get(`/Company/${companyId}/estimates-global`);
    return res.data;
  },
);

export const setCompanyPrice = createAsyncThunk(
  "companies/setPrice",
  async ({
    companyId,
    estimateId,
    price,
    isAll,
  }: {
    companyId: number;
    estimateId: number;
    price: number;
    isAll: boolean;
  }) => {
    const res = await instance.post(
      `/Company/set-company-price?IsAll=${isAll}`,
      {
        companyId,
        estimateId,
        price,
      },
    );

    return res.data;
  },
);

export const assignEstimatesToCompanies = createAsyncThunk(
  "companies/assignEstimates",
  async ({
    estimateIds,
    companyIds,
  }: {
    estimateIds: number[];
    companyIds: number[];
  }) => {
    const res = await instance.post(`Company/assign-estimates-display`, {
      estimateIds,
      companyIds,
    });

    return res.data;
  },
);

/* ===========================
   Slice
=========================== */
const companiesSlice = createSlice({
  name: "companies",
  initialState,
  reducers: {
    resetCompaniesState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* ===== Fetch ===== */
      .addCase(fetchCompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchCompanies.rejected, (state) => {
        state.loading = false;
      })

      /* ===== Create ===== */
      .addCase(createCompany.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createCompany.fulfilled, (state, action) => {
        state.creating = false;
        state.data.unshift(action.payload); // newest first
      })
      .addCase(createCompany.rejected, (state) => {
        state.creating = false;
      })

      /* ===== Update ===== */
      .addCase(updateCompany.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateCompany.fulfilled, (state, action) => {
        state.updating = false;
        const index = state.data.findIndex(
          (company) => company.id === action.payload.id,
        );
        if (index !== -1) {
          state.data[index] = { ...state.data[index], ...action.payload };
        }
      })
      .addCase(updateCompany.rejected, (state) => {
        state.updating = false;
      })

      /* ===== Delete ===== */
      .addCase(deleteCompany.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.deleting = false;
        state.data = state.data.filter(
          (company) => company.id !== action.payload.id,
        );
      })
      .addCase(deleteCompany.rejected, (state) => {
        state.deleting = false;
      })

      /* ===== Company Estimates ===== */
      .addCase(fetchCompanyEstimates.pending, (state) => {
        state.estimatesLoading = true;
      })
      .addCase(fetchCompanyEstimates.fulfilled, (state, action) => {
        state.estimatesLoading = false;
        state.estimates = action.payload;
      })
      .addCase(fetchCompanyEstimates.rejected, (state) => {
        state.estimatesLoading = false;
      })

      /* ===== Global Estimates ===== */
      .addCase(fetchCompanyGlobalEstimates.pending, (state) => {
        state.globalEstimatesLoading = true;
      })
      .addCase(fetchCompanyGlobalEstimates.fulfilled, (state, action) => {
        state.globalEstimatesLoading = false;
        state.globalEstimates = action.payload;
      })
      .addCase(fetchCompanyGlobalEstimates.rejected, (state) => {
        state.globalEstimatesLoading = false;
      })

      /* ===== Set Price ===== */
      .addCase(setCompanyPrice.pending, (state) => {
        state.settingPrice = true;
      })
      .addCase(setCompanyPrice.fulfilled, (state, action) => {
        state.settingPrice = false;

        const { estimateId, price, isAll } = action.meta.arg;

        if (isAll) {
          state.estimates = state.estimates.map((m) => ({
            ...m,
            price,
          }));
        } else {
          const item = state.estimates.find((m) => m.estimateId === estimateId);
          if (item) item.price = price;
        }

        state.globalEstimates = state.globalEstimates.map((m) => {
          if (isAll || m.estimateId === estimateId) {
            return { ...m, price };
          }
          return m;
        });
      })
      .addCase(setCompanyPrice.rejected, (state) => {
        state.settingPrice = false;
      })

      /* ===== Assign Estimates ===== */
      .addCase(assignEstimatesToCompanies.pending, (state) => {
        state.assigning = true;
      })
      .addCase(assignEstimatesToCompanies.fulfilled, (state) => {
        state.assigning = false;
      })
      .addCase(assignEstimatesToCompanies.rejected, (state) => {
        state.assigning = false;
      });
  },
});

export const { resetCompaniesState } = companiesSlice.actions;
export default companiesSlice.reducer;
