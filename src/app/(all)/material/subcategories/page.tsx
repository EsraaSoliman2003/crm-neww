import SubCategoriesAccordionPage from "@/components/SubCategoriesAccordionPage";
import { MaterialsNumber } from "@/constants/constantsNumbers";

export default function Page() {
  return (
    <SubCategoriesAccordionPage
      entityTypeId={MaterialsNumber}
      entityLabel="الخامات"
      baseRoute="/material/subcategories"
    />
  );
}
