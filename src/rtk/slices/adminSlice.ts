import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import instance from "@/lib/axios";

/* ===========================
   Types
=========================== */

export interface UnApprovedUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  countryCode: string;
  imageUrl: string | null;
  images: string[];
  email: string;
  role: string;
}

export interface Employee extends UnApprovedUser {
  isApproved: boolean;
  isSystem: boolean;
}

/* ===========================
   State
=========================== */

interface AdminState {
  loading: boolean;
  approving: boolean;
  employeesLoading: boolean;
  updatingEmployee: boolean;
  deletingEmployee: boolean;
  data: UnApprovedUser[];
  employees: Employee[];
  selectedUser: UnApprovedUser | null;
  error: string | null;
}

const initialState: AdminState = {
  loading: false,
  approving: false,
  employeesLoading: false,
  updatingEmployee: false,
  deletingEmployee: false,
  data: [],
  employees: [],
  selectedUser: null,
  error: null,
};

/* ===========================
   Fetch UnApproved Users
=========================== */

export const fetchUnApprovedUsers = createAsyncThunk(
  "admin/fetchUnApprovedUsers",
  async () => {
    const res = await instance.get("/Admin/GetUnApprovedUsers");
    return res.data as UnApprovedUser[];
  },
);

export const fetchEmployees = createAsyncThunk(
  "admin/fetchEmployees",
  async () => {
    const res = await instance.get("/User/employees");
    return res.data as Employee[];
  },
);

export const updateEmployee = createAsyncThunk(
  "admin/updateEmployee",
  async (employeeData: {
    id: string;
    fullName: string;
    email: string;
    countryCode: string;
    phoneNumber: string;
  }) => {
    const formData = new FormData();
    formData.append("Id", employeeData.id);
    formData.append("FullName", employeeData.fullName);
    formData.append("PhoneNumber", employeeData.phoneNumber);
    formData.append("CountryCode", employeeData.countryCode);
    formData.append("Email", employeeData.email);

    await instance.put("/User", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return employeeData;
  },
);

export const deleteEmployee = createAsyncThunk(
  "admin/deleteEmployee",
  async (id: string) => {
    await instance.delete(`/User/${id}`);
    return id;
  },
);

/* ===========================
   Approve / Reject User
=========================== */

export const approveOrRejectUser = createAsyncThunk(
  "admin/approveOrRejectUser",
  async (payload: { id: number; isApproved: boolean }) => {
    await instance.get(
      `/Admin/approve-or-reject-user/${payload.id}?isApproved=${payload.isApproved}`,
    );

    return payload;
  },
);

/* ===========================
   Get User Details (NEW)
=========================== */

export const getUserDetails = createAsyncThunk(
  "admin/getUserDetails",
  async (id: number) => {
    const res = await instance.get(`/Admin/GetUserDetails/${id}`);
    return res.data as UnApprovedUser;
  },
);

/* ===========================
   Slice
=========================== */

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    resetAdminState: () => initialState,
  },
  extraReducers: (builder) => {
    builder

      /* ===== Fetch Users ===== */
      .addCase(fetchUnApprovedUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUnApprovedUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUnApprovedUsers.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to fetch users";
      })

      .addCase(fetchEmployees.pending, (state) => {
        state.employeesLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.employeesLoading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state) => {
        state.employeesLoading = false;
        state.error = "Failed to fetch employees";
      })

      .addCase(updateEmployee.pending, (state) => {
        state.updatingEmployee = true;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.updatingEmployee = false;
        const employeeIndex = state.employees.findIndex(
          (employee) => employee.id === action.payload.id,
        );

        if (employeeIndex !== -1) {
          state.employees[employeeIndex] = {
            ...state.employees[employeeIndex],
            ...action.payload,
          };
        }
      })
      .addCase(updateEmployee.rejected, (state) => {
        state.updatingEmployee = false;
      })

      .addCase(deleteEmployee.pending, (state) => {
        state.deletingEmployee = true;
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.deletingEmployee = false;
        state.employees = state.employees.filter(
          (employee) => employee.id !== action.payload,
        );
      })
      .addCase(deleteEmployee.rejected, (state) => {
        state.deletingEmployee = false;
      })

      /* ===== Approve / Reject ===== */
      .addCase(approveOrRejectUser.pending, (state) => {
        state.approving = true;
      })
      .addCase(approveOrRejectUser.fulfilled, (state, action) => {
        state.approving = false;

        state.data = state.data.filter(
          (user) => user.id !== action.payload.id.toString(),
        );
      })
      .addCase(approveOrRejectUser.rejected, (state) => {
        state.approving = false;
      })

      /* ===== Get User Details (NEW) ===== */
      .addCase(getUserDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedUser = action.payload;
      })
      .addCase(getUserDetails.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to fetch user details";
      });
  },
});

export const { resetAdminState } = adminSlice.actions;
export default adminSlice.reducer;
