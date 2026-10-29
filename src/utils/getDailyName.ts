export const getDailyCategoryName = (category: number) => {
  switch (category) {
    case 0:
      return "عمالة";
    case 1:
      return "معدة";
    default:
      return "غير معروف";
  }
};
