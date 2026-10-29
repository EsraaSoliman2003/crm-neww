
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type MenuState = {
  value: boolean;
};

const initialState: MenuState = { value: false };

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    toggle: (state) => {
      state.value = !state.value;
    },
    setTrue: (state) => {
      state.value = true;
    },
    setFalse: (state) => {
      state.value = false;
    },
    setTo: (state, action: PayloadAction<boolean>) => {
      state.value = action.payload;
    },
  },
});

export const { toggle, setTrue, setFalse, setTo } = menuSlice.actions;
export default menuSlice.reducer;
