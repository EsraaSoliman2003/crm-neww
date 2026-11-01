import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import instance from "@/lib/axios";
import axios from "axios";
import { User, AuthResponse, OtpSentResponse, ApiErrorBody } from "@/utils/dtos";

/* ===========================
   Types
=========================== */

interface AuthState {
  loading: boolean;
  logoutLoading: boolean;
  user: User | null;
  token: string | null;
  roles: string[] | null;
  message: string | null;
}

/* ===========================
   Initial State
=========================== */

const initialState: AuthState = {
  loading: false,
  logoutLoading: false,
  user: null,
  token: null,
  roles: null,
  message: null,
};

/* ===========================
   Register
=========================== */

export const registerUser = createAsyncThunk<
  AuthResponse,
  FormData
>(
  "auth/register",
  async (formData) => {

    const role = formData.get("Role");

    const endpoint =
      role === "EMPLOYEE"
        ? "Account/register"
        : "Account/register-role";

    const res = await instance.post(endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  }
);


/* ===========================
   Login
=========================== */

export const loginUser = createAsyncThunk<
  AuthResponse,
  unknown,
  { rejectValue: ApiErrorBody }
>(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      const res = await instance.post("Account/login", data);
      return res.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue({ title: "An unexpected error occurred" });
    }
  }
);

/* ===========================
   Phone verification (WhatsApp OTP)
   Errors are already shown as toasts by the axios interceptor.
=========================== */

const toApiError = (error: unknown): ApiErrorBody =>
  axios.isAxiosError(error) && error.response?.data
    ? error.response.data
    : { title: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقًا." };

export const verifyPhone = createAsyncThunk<
  { message: string },
  { userId: number; code: string },
  { rejectValue: ApiErrorBody }
>("auth/verifyPhone", async (data, { rejectWithValue }) => {
  try {
    const res = await instance.post("Account/verify-phone", data);
    return res.data;
  } catch (error: unknown) {
    return rejectWithValue(toApiError(error));
  }
});

export const resendOtp = createAsyncThunk<
  OtpSentResponse,
  { userId: number },
  { rejectValue: ApiErrorBody }
>("auth/resendOtp", async (data, { rejectWithValue }) => {
  try {
    const res = await instance.post("Account/resend-otp", data);
    return res.data;
  } catch (error: unknown) {
    return rejectWithValue(toApiError(error));
  }
});

/* ===========================
   Logout
=========================== */

export const logoutUser = createAsyncThunk<
  void,
  void,
  { rejectValue: { title: string } }
>("auth/logout", async () => {
  await instance.post("Account/logout");
});

/* ===========================
   Slice
=========================== */

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuthState: () => initialState,
  },
  extraReducers: (builder) => {
    builder

      // REGISTER
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.message = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        // Accounts waiting for phone verification get no token; don't treat
        // them as signed in.
        if (action.payload.requiresPhoneVerification) return;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.roles = action.payload.roles;
      })
      .addCase(registerUser.rejected, (state) => {
        state.loading = false;
      })

      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.message = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.roles = action.payload.roles;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.message = action.payload?.title || null;
      })

      // LOGOUT
      .addCase(logoutUser.pending, (state) => {
        state.logoutLoading = true;
        state.message = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.logoutLoading = false;
        state.user = null;
        state.token = null;
        state.roles = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.logoutLoading = false;
        state.message = action.payload?.title || null;
      });
  },
});

export const { resetAuthState } = authSlice.actions;
export default authSlice.reducer;
