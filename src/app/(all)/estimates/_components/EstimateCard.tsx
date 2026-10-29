// import { useAppDispatch } from '@/rtk/hooks';
// import { deleteEstimate } from '@/rtk/slices/estimatesSlice';
// import { confirmDelete } from '@/utils/confirmDelete';
// import { Estimate } from '@/utils/dtos';
// import { Trash2 } from 'lucide-react';

// type Props = {
//     estimate: Estimate;
// };

// export default function EstimateCard({ estimate }: Props) {
//     const dispatch = useAppDispatch();
//     const handleDelete = () => {
//         confirmDelete(estimate.id, (id) =>
//             dispatch(deleteEstimate(Number(id))).unwrap()
//         );
//     };
// console.log(estimate);

//     return (
//         <div className="bg-white rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.08)] overflow-hidden">
//             {/* Header */}
//             <div className="flex items-center justify-between bg-[#EAEAEA] px-6 py-2 border-b border-gray-100">
//                 <div>
//                     <p className="text-sm text-gray-500">رقم المقايسة</p>
//                     <p className="font-semibold text-gray-800">{estimate.estimateNumber}</p>
//                 </div>
//                 <button
//                     onClick={handleDelete}
//                     className="text-red-600 hover:bg-gray-100 p-2 rounded-full transition-colors duration-200"
//                 >
//                     <Trash2 size={22} />
//                 </button>
//             </div>

//             {/* Main Content */}
//             <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

//                 {/* Location */}
//                 <div>
//                     <p className="text-xs text-gray-500 mb-1">اسم المقايسة</p>
//                     <p className="font-semibold text-gray-800">{estimate.name}</p>
//                 </div>

//                 {/* Estimated Value */}
//                 <div>
//                     <p className="text-xs text-gray-500 mb-1">اسم الشركة</p>
//                     <p className="font-semibold text-gray-800">{estimate.companyName}</p>
//                 </div>

//                 {/* Location */}
//                 <div>
//                     <p className="text-xs text-gray-500 mb-1">اسم المشروع</p>
//                     <p className="font-semibold text-gray-800">{estimate.projectName}</p>
//                 </div>

//                 {/* Sector */}
//                 <div className="text-right">
//                     <p className="text-sm text-gray-500">مرحلة المقايسة</p>
//                     <p className="font-medium text-gray-700">{estimate?.estimateStage}</p>
//                 </div>

//                 {/* Start Date */}
//                 <div>
//                     <p className="text-xs text-gray-500 mb-1">تمام المقايسة</p>
//                     <p className="font-semibold text-gray-800">{estimate.exactness}</p>
//                 </div>

//                 {/* Value with tax */}
//                 <div>
//                     <p className="text-xs text-gray-500 mb-1">قيمة المقايسة طبقا للتحليل شامل النسية</p>
//                     <p className="font-semibold text-gray-800">0</p>
//                 </div>

//                 {/* Value without tax */}
//                 <div>
//                     <p className="text-xs text-gray-500 mb-1">قيمة المقايسة طبقا للتحليل غير شامل النسية</p>
//                     <p className="font-semibold text-gray-800">0</p>
//                 </div>



//                 {/* estimate Type */}
//                 <div>
//                     <p className="text-xs text-gray-500 mb-1">عرض المشروع</p>
//                     <p className="font-semibold text-gray-800">{estimate.adminOfferPrice}</p>
//                 </div>

//             </div>
//         </div>
//     );
// }