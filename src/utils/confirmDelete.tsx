import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const confirmDelete = async (
    id: number | string,
    action: (id: number | string) => Promise<unknown>
) => {
    return toast.custom((toastId) => (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-85 space-y-4">

            <p className="text-sm font-medium text-gray-800">
                هل أنت متأكد من تنفيذ هذا الإجراء؟ لا يمكن التراجع عنه.
            </p>

            <div className="flex justify-end gap-2">
                <button
                    className="px-3 py-1.5 rounded-md bg-gray-200 text-sm"
                    onClick={() => toast.dismiss(toastId)}
                >
                    إلغاء
                </button>

                <button
                    className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm"
                    onClick={async () => {
                        toast.dismiss(toastId);
                        try {
                            await action(id);
                            toast.success("تم تنفيذ الإجراء بنجاح");
                        } catch (err) {
                            console.log(err);
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
