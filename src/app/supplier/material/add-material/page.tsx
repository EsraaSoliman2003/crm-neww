import AddMatreial from "@/app/(all)/material/add-material/AddMaterial";
import ImportMaterials from "./_components/ImportMaterials";

export default function AddSupplierMaterialPage() {
  return (
    <div className="min-h-screen space-y-6 p-6 md:p-8">
      <ImportMaterials />
      <AddMatreial supplierMode />
    </div>
  );
}
