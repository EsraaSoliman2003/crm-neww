type Props = {
    size?: number;
    className?: string;
};

export default function LoadingSpinner({ size = 20, className = "" }: Props) {
    return (
        <svg
            className={`animate-spin text-current ${className}`}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
        >
            <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                className="opacity-25"
            />
            <path
                fill="currentColor"
                className="opacity-75"
                d="M4 12a8 8 0 018-8v8H4z"
            />
        </svg>
    );
}