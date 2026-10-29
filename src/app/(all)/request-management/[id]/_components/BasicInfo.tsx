// import { User } from '@/utils/dtos'
// import React from 'react'

// type Props = {
//     userDetails: any;
// }

// export default function BasicInfo({ userDetails }: Props) {
//     return (
//         <div className="bg-white rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.08)] border border-gray-200 overflow-hidden">
//             <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
//                 <div className="flex items-center gap-2">
//                     <User className="w-5 h-5 text-blue-600" />
//                     <h2 className="text-lg font-semibold text-gray-900">المعلومات الأساسية</h2>
//                 </div>
//             </div>
//             <div className="p-6">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                         <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم بالكامل</label>
//                         <p className="text-gray-900 font-medium mt-1">{userDetails.name}</p>
//                     </div>
//                     <div>
//                         <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">البريد الإلكتروني</label>
//                         <div className="flex items-center gap-2 mt-1">
//                             <Mail className="w-4 h-4 text-gray-400" />
//                             <p className="text-gray-900">{userDetails.email}</p>
//                         </div>
//                     </div>
//                     <div>
//                         <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الهاتف</label>
//                         <div className="flex items-center gap-2 mt-1">
//                             <Phone className="w-4 h-4 text-gray-400" />
//                             <p className="text-gray-900">{userDetails.countryCode} {userDetails.phoneNumber}</p>
//                         </div>
//                     </div>
//                     <div>
//                         <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">الدور</label>
//                         <div className="flex items-center gap-2 mt-1">
//                             <Briefcase className="w-4 h-4 text-gray-400" />
//                             <p className="text-gray-900">{userDetails.role}</p>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }