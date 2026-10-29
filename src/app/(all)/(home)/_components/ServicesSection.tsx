"use client"

import { bagsBG } from '@/assets'
import EmptyState from '@/components/emptyState/EmptyState'
import FilterDropdown from '@/components/filterDropdown/FilterDropdown'


export default function ServicesSection() {

    const filterOptions = [
        { label: "الأحدث", value: "latest" },
        { label: "الأقدم", value: "oldest" },
        { label: "الأكثر طلبًا", value: "popular" },
    ]

    const handleFilter = (value: string | null) => {
        console.log("Selected filter:", value)

        if (!value) {
            // reset logic
            console.log("Reset filter")
            return
        }

        // filter logic
    }

    return (
        <div className="mb-6">

            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-gray-700 text-base">
                    أحدث الخدمات
                </h2>

                <div className="flex items-center gap-2">
                    <FilterDropdown
                        options={filterOptions}
                        onSelect={handleFilter}
                    />
                </div>
            </div>

            <EmptyState
                image={bagsBG}
                title="لا يوجد خامات حتى الآن"
                actionText="+ أضف جديد"
                href='/material/add-material'
            />
        </div>
    )
}