import Input from "@/components/form/Input";
import { useAppSelector } from "@/rtk/hooks";

export type PercentageMode = "calculated" | "manual";

type Props = {
  calculatedPercentage?: number;
  mode?: PercentageMode;
  manualPercentage?: string;
  loading?: boolean;
  onModeChange?: (mode: PercentageMode) => void;
  onManualPercentageChange?: (value: string) => void;
};

export default function AppliedPercentAge({
  calculatedPercentage,
  mode,
  manualPercentage,
  loading,
  onModeChange,
  onManualPercentageChange,
}: Props = {}) {
  const { data, loading: storedLoading } = useAppSelector(
    (state) => state.addedValue,
  );
  const storedPercentage = Math.min(
    data.reduce((sum, item) => sum + (item.percentage || 0), 0),
    100,
  );
  const displayedPercentage = calculatedPercentage ?? storedPercentage;
  const isControlled = mode !== undefined;
  const isLoading = loading ?? storedLoading;

  if (!isControlled) {
    return (
      <div className="border border-gray-300 bg-white p-4 shadow">
        <h1 className="font-bold text-gray-700">النسبة المضافة</h1>
        <div className="mt-3 flex h-13.75 items-center border border-gray-200 px-4 font-medium">
          {isLoading ? "..." : `${displayedPercentage}%`}
        </div>
      </div>
    );
  }

  const options: { value: PercentageMode; label: string; description: string }[] = [
    {
      value: "calculated",
      label: "مجموع النسب المسجلة",
      description: isLoading ? "جاري الحساب..." : `${displayedPercentage}%`,
    },
    // {
    //   value: "manual",
    //   label: "نسبة يدوية",
    //   description: "حدد النسبة لهذا التحليل",
    // },
  ];

  return (
    <div className="border border-gray-300 bg-white p-4 shadow">
      <h1 className="font-bold text-gray-700">النسبة المضافة</h1>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
              mode === option.value
                ? "border-red-400 bg-red-50"
                : "border-gray-200 hover:border-red-200"
            }`}
          >
            <input
              type="radio"
              name="percentageMode"
              value={option.value}
              checked={mode === option.value}
              onChange={() => onModeChange?.(option.value)}
              className="h-4 w-4 accent-red-600"
            />
            <span>
              <span className="block font-semibold text-gray-800">
                {option.label}
              </span>
              <span className="mt-1 block text-xs text-gray-500">
                {option.description}
              </span>
            </span>
          </label>
        ))}
      </div>

      {mode === "manual" && (
        <div className="mt-4 max-w-sm">
          <Input
            label="قيمة النسبة اليدوية"
            type="number"
            name="manualPercentage"
            min={0}
            max={100}
            step="any"
            value={manualPercentage ?? ""}
            placeholder="أدخل نسبة من 0 إلى 100"
            onChange={(event) =>
              onManualPercentageChange?.(event.target.value)
            }
          />
        </div>
      )}
    </div>
  );
}
