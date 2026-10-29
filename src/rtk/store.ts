// store.ts
import { configureStore } from "@reduxjs/toolkit";
import menuReducer from "./slices/openMenu";
import projectsReducer from "./slices/projectsSlice";
import companiesReducer from "./slices/companiesSlice";
import estimatesReducer from "./slices/estimatesSlice";
import categoriesReducer from "./slices/categoriesSlice";
import subCategoriesReducer from "./slices/subCategoriesSlice";
import anotherSubCategoriesReducer from "./slices/anotherSubCategories";
import unitsReducer from "./slices/unitsSlice";
import suppliersReducer from "./slices/suppliersSlice";
import materialsReducer from "./slices/materialsSlice";
import materialsWithSuppliersReducer from "./slices/supplierMaterialSlice";
import authReducer from "./slices/authSlice";
import dailyReducer from "./slices/dailySlice";
import manufacturingReducer from "./slices/ManufacturingSlice";
import addedValueReducer from "./slices/addedValueSlice";
import testsReducer from "./slices/testsSlice";
import itemsReducer from "./slices/itemSlice";
import adminReducer from "./slices/adminSlice";
import matrialsItemsReducer from "./fetchSlice/ItemAnalysis/fetchMaterials";

export const store = configureStore({
  reducer: {
    menu: menuReducer,
    projects: projectsReducer,
    companies: companiesReducer,
    estimates: estimatesReducer,
    categories: categoriesReducer,
    subCategories: subCategoriesReducer,
    anotherSubCategories: anotherSubCategoriesReducer,
    units: unitsReducer,
    suppliers: suppliersReducer,
    materials: materialsReducer,
    materialsWithSuppliers: materialsWithSuppliersReducer,
    auth: authReducer,
    daily: dailyReducer,
    manufacturing: manufacturingReducer,
    addedValue: addedValueReducer,
    tests: testsReducer,
    items: itemsReducer,
    admin: adminReducer,
    // new menu
    matrialsItems: matrialsItemsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
