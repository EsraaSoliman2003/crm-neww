import React from 'react'
import { Trash2 } from 'lucide-react'

type Props = {
    open: boolean
    setOpen: (open: boolean) => void
    handleDelete: () => void
}

export default function ConfirmDelete({ open, setOpen, handleDelete }: Props) {
    return (
        <div>
            {
                open && (
                    <div
                        onClick={() => setOpen(false)}
                        className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-xl p-6 w-[350px] shadow-xl"
                        >

                            <h2 className="text-lg font-semibold text-gray-800 mb-4">
                                {"تأكيد الإجراء"}
                            </h2>

                            <p className="text-gray-600 mb-6">
                                {"هل أنت متأكد من تنفيذ هذا الإجراء؟ لا يمكن التراجع عنه."}
                            </p>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setOpen(false)}
                                    className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                                >
                                    إلغاء
                                </button>

                                <button
                                    onClick={() => {
                                        handleDelete()
                                        setOpen(false)
                                    }}
                                    className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                                    aria-label="تأكيد الإجراء"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                        </div>
                    </div>
                )
            }
        </div>
    )
}
