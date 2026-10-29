import SubCategoriesAccordionPage from "@/components/SubCategoriesAccordionPage";
import { SuppliersNumber } from "@/constants/constantsNumbers";

export default function Page() {
  return (
    <SubCategoriesAccordionPage
      entityTypeId={SuppliersNumber}
      entityLabel="الموردين"
      baseRoute="/suppliers/subcategories"
      supText="اضافة تصنيف فرعي"
      supType="اجمالي عدد التصنيفات الفرعية"
    />
  );
}
