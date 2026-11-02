import { Check, Circle } from "lucide-react";

type Rule = { label: string; test: (value: string) => boolean };

// Mirror of the API rules (UserEntity.FullName regex, Identity password options)
export const nameRules: Rule[] = [
  { label: "3 أحرف على الأقل", test: (v) => v.trim().length >= 3 },
  {
    label: "حروف عربية أو إنجليزية فقط (بدون أرقام أو رموز)",
    test: (v) => v.trim().length > 0 && /^[A-Za-z؀-ۿ\s]+$/.test(v),
  },
];

export const emailRules: Rule[] = [
  {
    label: "بريد إلكتروني صحيح مثل name@example.com",
    test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  },
];

export const passwordRules: Rule[] = [
  { label: "8 أحرف على الأقل", test: (v) => v.length >= 8 },
  { label: "حرف إنجليزي كبير (A-Z)", test: (v) => /[A-Z]/.test(v) },
  { label: "حرف إنجليزي صغير (a-z)", test: (v) => /[a-z]/.test(v) },
  { label: "رقم واحد على الأقل (0-9)", test: (v) => /\d/.test(v) },
  { label: "رمز خاص مثل @ # $ !", test: (v) => /[^a-zA-Z0-9]/.test(v) },
];

/** Requirements shown under an input; each one turns green once met. */
export default function FieldRequirements({
  rules,
  value,
}: {
  rules: Rule[];
  value: string | undefined;
}) {
  const text = value ?? "";

  return (
    <ul className="mt-1.5 space-y-0.5 text-xs">
      {rules.map((rule) => {
        const ok = rule.test(text);
        return (
          <li
            key={rule.label}
            className={`flex items-center gap-1.5 ${ok ? "text-green-600" : "text-gray-500"}`}
          >
            {ok ? (
              <Check size={12} className="shrink-0" />
            ) : (
              <Circle size={6} className="shrink-0 fill-current" />
            )}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
