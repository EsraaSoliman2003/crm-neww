import LoadingSpinner from '@/components/loadingSpinner/LoadingSpinner';
import { useAppDispatch, useAppSelector } from '@/rtk/hooks';
import { deleteProject } from '@/rtk/slices/projectsSlice';
import { Project } from '@/utils/dtos';
import { FilePlus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';


type Props = {
    project: Project;
};

export default function ProjectCard({ project }: Props) {
    const dispatch = useAppDispatch();
    const { deleting } = useAppSelector((s) => s.projects);
    const handleDelete = async () => {
        toast.custom((toastId) => (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-[340px] space-y-4">

                {/* Message */}
                <p className="text-sm font-medium leading-relaxed text-gray-800">
                    هل أنت متأكد من تنفيذ هذا الإجراء؟ لا يمكنك التراجع عنه.
                </p>

                {/* Buttons */}
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        className="px-3 py-1.5 rounded-md bg-gray-200 text-gray-900 text-sm hover:bg-gray-300 transition"
                        onClick={() => toast.dismiss(toastId)}
                    >
                        إلغاء
                    </button>

                    <button
                        type="button"
                        className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 transition"
                        onClick={async () => {
                            toast.dismiss(toastId);
                            try {
                                await dispatch(deleteProject(Number(project.id))).unwrap();
                                toast.success("تم تنفيذ الإجراء بنجاح");
                            } catch (e) {
                                console.log(e)
                            }
                        }}
                        aria-label="تأكيد الإجراء"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        ));
    };

    return (
        <div className="bg-white rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.08)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between bg-[#EAEAEA] px-6 py-2 border-b border-gray-100">
                <div>
                    <p className="text-sm text-gray-500">اسم المشروع</p>
                    <p className="font-semibold text-gray-800">{project.name}</p>
                </div>
                <div className="flex">
                    {/* Add Estimate */}
                    <Link
                        href={`/projects/${project.id}`}
                        className="
                            relative p-2 rounded-full transition-all duration-200
                            text-blue-800 hover:bg-blue-50 hover:scale-105 active:scale-95
                        "
                    >
                        <FilePlus size={22} />
                    </Link>

                    {/* Delete */}
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className={`
                            relative p-2 rounded-full transition-all duration-200
                            ${deleting
                                ? "bg-red-50 text-red-400 cursor-not-allowed"
                                : "text-red-600 hover:bg-red-50 hover:scale-105 active:scale-95"
                            }
                        `}
                    >
                        {deleting ? (
                            <LoadingSpinner size={18} className="text-red-500" />
                        ) : (
                            <Trash2 size={22} />
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Location */}
                <div>
                    <p className="text-xs text-gray-500 mb-1">موقع المشروع</p>
                    <p className="font-semibold text-gray-800">{project.location}</p>
                </div>

                {/* Sector */}
                <div className="text-right">
                    <p className="text-sm text-gray-500">الجهة</p>
                    <p className="font-medium text-gray-700">{project.sector}</p>
                </div>

                {/* Start Date */}
                <div>
                    <p className="text-xs text-gray-500 mb-1">تاريخ البداية</p>
                    <p className="font-semibold text-gray-800">{project.startDate}</p>
                </div>

                {/* Estimated Value */}
                <div>
                    <p className="text-xs text-gray-500 mb-1">القيمة التقديرية</p>
                    <p className="font-semibold text-gray-800">{project.investmentCost} جنيه</p>
                </div>

                {/* Project Type */}
                <div>
                    <p className="text-xs text-gray-500 mb-1">نوع المشروع</p>
                    <p className="font-semibold text-gray-800">{project.projectType}</p>
                </div>

                {/* Desc */}
                <div>
                    <p className="text-xs text-gray-500 mb-1">الملاحظات</p>
                    <p className="font-semibold text-gray-800">{project.description}</p>
                </div>

                {/* Value with tax */}
                {/* <div>
                    <p className="text-xs text-gray-500 mb-1">قيمة المقايسات طبقا للتحليل شامل النسبة</p>
                    <p className="font-semibold text-gray-800">{project.valueWithTax} جنيه</p>
                </div> */}

                {/* Value without tax */}
                {/* <div>
                    <p className="text-xs text-gray-500 mb-1">قيمة المقايسات طبقا للتحليل غير شامل النسبة</p>
                    <p className="font-semibold text-gray-800">{project.valueWithoutTax} جنيه</p>
                </div> */}

            </div>
        </div>
    );
}
