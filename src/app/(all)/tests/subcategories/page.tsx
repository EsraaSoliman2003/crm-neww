import SubCategoriesAccordionPage from "@/components/SubCategoriesAccordionPage";
import { TestsNumber } from "@/constants/constantsNumbers";

export default function Page() {
  return (
    <SubCategoriesAccordionPage
      entityTypeId={TestsNumber}
      entityLabel="الاختبارات"
      baseRoute="/tests/subcategories"
    />
  );
}
