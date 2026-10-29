
export default function HomeHeader() {
  return (
    <div className="mb-8 overflow-hidden bg-white border border-gray-200 shadow-sm">
      <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <span className="inline-flex w-fit border border-red-100 bg-red-50 px-3 py-1 text-sm font-semibold text-[#bf0200]">
            لوحة التحكم
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              مرحبا بك
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-500 md:text-base">
              متابعة سريعة لأهم بيانات النظام، المشاريع، المقايسات، الموردين
              والخامات من مكان واحد.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
