import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import instance from "@/lib/axios";

/* ===========================
   Types
=========================== */

export interface Profile {
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
  imageUrl: string | null;
  aboutMe: string | null;
  coverImage: string | null;
}

/* ===========================
   State
=========================== */

interface ProfileState {
  loading: boolean;
  updating: boolean;
  deleting: boolean;
  data: Profile | null;
  error: string | null;
}

const initialState: ProfileState = {
  loading: false,
  updating: false,
  deleting: false,
  data: null,
  error: null,
};

/* ===========================
   GET PROFILE
=========================== */

export const fetchProfile = createAsyncThunk("profile/fetch", async () => {
  const res = await instance.get(`/Profile`);
  return res.data as Profile;
});

/* ===========================
   DELETE PROFILE
=========================== */

export const deleteProfile = createAsyncThunk(
  "profile/delete",
  async (payload: { password: string }) => {
    await instance.delete(`/Profile`, { data: payload });
    return true;
  },
);

/* ===========================
   UPDATE NAME
=========================== */

export const updateProfileName = createAsyncThunk(
  "profile/updateName",
  async (payload: { fullName: string }) => {
    const res = await instance.put(`/Profile/name`, payload);
    return res.data;
  },
);

/* ===========================
   UPDATE EMAIL
=========================== */

export const updateProfileEmail = createAsyncThunk(
  "profile/updateEmail",
  async (payload: { newEmail: string }) => {
    const res = await instance.put(`/Profile/email`, payload);
    return res.data;
  },
);

/* ===========================
   UPDATE PHONE
=========================== */

export const updateProfilePhone = createAsyncThunk(
  "profile/updatePhone",
  async (payload: { newCountryCode: string; newPhone: string }) => {
    const res = await instance.put(`/Profile/phone`, payload);
    return res.data;
  },
);

/* ===========================
   UPDATE PASSWORD
=========================== */

export const updateProfilePassword = createAsyncThunk(
  "profile/updatePassword",
  async (payload: { currentPassword: string; newPassword: string }) => {
    const res = await instance.put(`/Profile/password`, payload);
    return res.data;
  },
);

/* ===========================
   UPDATE IMAGE
=========================== */

export const updateProfileImage = createAsyncThunk(
  "profile/updateImage",
  async (file: File) => {
    const formData = new FormData();
    formData.append("ImageUrl", file);

    const res = await instance.put(`/Profile/image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },
);

/* ===========================
   UPDATE ABOUT
=========================== */

export const updateProfileAbout = createAsyncThunk(
  "profile/updateAbout",
  async (payload: { aboutMe: string }) => {
    await instance.put(`/Profile/about`, payload);
    return payload;
  },
);

/* ===========================
   UPDATE COVER
=========================== */

export const updateProfileCover = createAsyncThunk(
  "profile/updateCover",
  async (file: File) => {
    const formData = new FormData();
    formData.append("CoverImage", file);

    const res = await instance.put(`/Profile/cover`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data;
  },
);

/* ===========================
   Slice
=========================== */

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    resetProfileState: () => initialState,
  },
  extraReducers: (builder) => {
    builder

      /* ===== GET PROFILE ===== */
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchProfile.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to fetch profile";
      })

      /* ===== DELETE ===== */
      .addCase(deleteProfile.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteProfile.fulfilled, (state) => {
        state.deleting = false;
        state.data = null;
      })
      .addCase(deleteProfile.rejected, (state) => {
        state.deleting = false;
      })

      /* ===== UPDATE NAME ===== */
      .addCase(updateProfileName.fulfilled, (state, action) => {
        if (state.data) {
          state.data.fullName = action.meta.arg.fullName;
        }
      })

      /* ===== UPDATE EMAIL ===== */
      .addCase(updateProfileEmail.fulfilled, (state, action) => {
        if (state.data) {
          state.data.email = action.meta.arg.newEmail;
        }
      })

      /* ===== UPDATE PHONE ===== */
      .addCase(updateProfilePhone.fulfilled, (state, action) => {
        if (state.data) {
          state.data.phone = action.meta.arg.newPhone;
          state.data.countryCode = action.meta.arg.newCountryCode;
        }
      })

      /* ===== UPDATE IMAGE ===== */
      .addCase(updateProfileImage.fulfilled, (state, action) => {
        if (state.data) {
          state.data.imageUrl = action.payload?.imageUrl ?? null;
        }
      })

      /* ===== UPDATE ABOUT ===== */
      .addCase(updateProfileAbout.fulfilled, (state, action) => {
        if (state.data) {
          state.data.aboutMe = action.meta.arg.aboutMe;
        }
      })

      /* ===== UPDATE COVER ===== */
      .addCase(updateProfileCover.fulfilled, (state, action) => {
        if (state.data) {
          state.data.coverImage = action.payload?.coverImage ?? null;
        }
      });
  },
});

export const { resetProfileState } = profileSlice.actions;
export default profileSlice.reducer;
