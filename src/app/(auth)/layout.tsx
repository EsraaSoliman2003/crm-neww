export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: 'url("/1.webp")',
      }}
    >
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
