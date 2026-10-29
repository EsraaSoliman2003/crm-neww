import { createAsyncThunk } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import axios from "@/lib/axios";
import { MaterialWithSuppliers } from "@/lib/dtos";


export const materialsItems = createAsyncThunk<
  MaterialWithSuppliers[],
  void,
  { rejectValue: string }
>("materialsItems/fetchMaterialsItems", async (_, thunkAPI) => {
  try {
    const res = await axios.get(
      "SupplierMaterial/get-materials-with-its-suppliers"
    );

    return res.data as MaterialWithSuppliers[];
  } catch (err) {
    if (isAxiosError(err)) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "فشل تحميل الخامات"
      );
    }

    return thunkAPI.rejectWithValue("حدث خطأ غير متوقع");
  }
});