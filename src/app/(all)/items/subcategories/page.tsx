import SubCategoriesAccordionPage from "@/components/SubCategoriesAccordionPage";
import { ItemsNumber } from "@/constants/constantsNumbers";

export default function Page() {
  return (
    <SubCategoriesAccordionPage
      entityTypeId={ItemsNumber}
      entityLabel="البنود"
      baseRoute="/items/subcategories"
    />
  );
}
