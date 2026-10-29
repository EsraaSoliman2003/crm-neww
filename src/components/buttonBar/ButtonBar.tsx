type Props = {
  title: string;
  data: Record<string, unknown>[];
};

export default function ButtonBar({ title, data }: Props) {
  if (!data || data.length === 0) return null;

  return (
    <div className="flex items-center justify-between border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
      <div className="text-xs font-bold text-gray-800">
        {title}
      </div>

      <div className="text-xs text-gray-500">
        عدد العناصر:{" "}
        <span className="font-bold text-gray-800">
          {data.length}
        </span>
      </div>
    </div>
  );
}