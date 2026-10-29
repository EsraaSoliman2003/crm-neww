"use client"
import { card2BG } from '@/assets'
import EmptyState from '@/components/emptyState/EmptyState'
import FilterDropdown from '@/components/filterDropdown/FilterDropdown'

export default function MetricsSection() {
    return (
        <div className="mb-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-gray-700 text-base">
                    عروض المقاييس
                </h2>

                <FilterDropdown
                    options={[
                        { label: "الأحدث", value: "latest" },
                        { label: "الأقدم", value: "oldest" },
                        { label: "الأكثر طلبًا", value: "popular" },
                    ]}
                    onSelect={(value: string | null) => {
                        console.log("Selected filter:", value)

                        if (!value) {
                            // reset logic
                            console.log("Reset filter")
                            return
                        }

                        // filter logic
                    }}
                />
            </div>
            <EmptyState
                image={card2BG}
                title="لا يوجد لديك مقاييس"
            />
        </div>
    )
}
