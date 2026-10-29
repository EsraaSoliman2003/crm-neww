import { Trash2 } from 'lucide-react'
import Link from 'next/link'

type Props = {
    id: number
    title: string
}

export default function CategoryCard({ id, title }: Props) {
    return (
        <Link
            href={`/categories/${id}`}
            key={id}
            className="bg-white rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.08)] p-6 flex justify-between gap-3 text-center 
             hover:shadow-md hover:border-gray-300 transition-all duration-200"
        >
            <h3 className="text-xl font-semibold text-gray-700">{title}</h3>
            <Trash2 size={24} className="text-red-500 cursor-pointer" />
        </Link>
    )
}