"use client";

interface FormModalProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading?: boolean;
  label?: string;
  placeholder?: string;
  buttonText?: string;
}

export default function FormModal({
  value,
  onChange,
  onSubmit,
  loading = false,
  label = "Name",
  placeholder = "Enter name...",
  buttonText = "Submit",
}: FormModalProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5"
    >
      {/* Input */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {label}
        </label>

        <input
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-14 w-full border border-gray-200 bg-gray-50 px-4 outline-none transition-all focus:border-orange-400 focus:bg-white"
        />
      </div>

      {/* Submit */}
      <button
        disabled={loading}
        className="h-14 w-full bg-red-700 text-lg font-medium text-white transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "حفظ..." : buttonText}
      </button>
    </form>
  );
}
