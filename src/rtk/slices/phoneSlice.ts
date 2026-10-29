import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PhoneState {
  phoneNumber: string;
  countryCode: string;
}

const initialState: PhoneState = {
  phoneNumber: "",
  countryCode: "",
};

const phoneSlice = createSlice({
  name: "phone",
  initialState,
  reducers: {
    setPhoneData: (
      state,
      action: PayloadAction<{ phoneNumber: string; countryCode: string }>
    ) => {
      state.phoneNumber = action.payload.phoneNumber;
      state.countryCode = action.payload.countryCode;
    },
    resetPhoneData: () => initialState,
  },
});

export const { setPhoneData, resetPhoneData } = phoneSlice.actions;
export default phoneSlice.reducer;
