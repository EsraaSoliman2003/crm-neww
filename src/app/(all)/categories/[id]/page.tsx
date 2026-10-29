"use client"

import { Trash2 } from "lucide-react"
import Button from "@/components/button/Button"

export default function CategoryPage() {
    // Mock data
    const data = [
        { id: "01", name: "رمل أرضيات", note: "تصنيف فرعي للرمل الذي يحتوي على مواد الخرسانة" },
        { id: "02", name: "رمل أرضيات", note: "تصنيف فرعي للرمل الذي يحتوي على مواد الخرسانة" },
        { id: "03", name: "رمل أرضيات", note: "تصنيف فرعي للرمل الذي يحتوي على مواد الخرسانة" },
        { id: "04", name: "رمل أرضيات", note: "تصنيف فرعي للرمل الذي يحتوي على مواد الخرسانة" },
    ]

    return (
        <div className="min-h-screen space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="text-right">
                    <h1 className="text-xl md:text-2xl font-bold">خرسانات</h1>
                </div>

                <Button text="+ إضافة تصنيف فرعي" href={"/categories/add-sub-category"} />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="overflow-x-auto w-full max-w-full">
                    <table className="min-w-175 w-full text-right table-auto">
                        <thead className="bg-gray-100 text-gray-600 text-sm">
                            <tr>
                                <th className="p-4">#</th>
                                <th className="p-4">اسم التصنيف</th>
                                <th className="p-4">ملاحظات</th>
                                <th className="p-4">خيارات</th>
                            </tr>
                        </thead>

                        <tbody>
                            {data.map((item, index) => (
                                <tr
                                    key={item.id}
                                    className={`hover:bg-gray-100
                                ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                >
                                    <td className="p-4">{item.id}</td>
                                    <td className="p-4">{item.name}</td>
                                    <td className="p-4 text-gray-600">{item.note}</td>
                                    <td className="p-4">
                                        <button className="text-red-500 hover:text-red-700">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
