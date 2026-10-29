import type { Metadata } from "next";
import "./globals.css";
import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import MainProvider from "@/rtk/MainProvider";
import ResponsiveToaster from "@/components/responsiveToaster/ResponsiveToaster";
import NavigationStateRestorer from "@/components/navigation/NavigationStateRestorer";
import { AuthProvider } from "@/context/AuthContext";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: {
    default: "Construction Pricing",
    template: "%s | Construction Pricing",
  },
  description: "Construction Pricing management system for estimates, items, and supplier workflows.",
  applicationName: "Construction Pricing",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const token = (await cookies()).get("token")?.value || null;
  const roleCookie = (await cookies()).get("roles")?.value || null;
  const role = roleCookie ? JSON.parse(roleCookie) : null;
  const userCookie = (await cookies()).get("user")?.value || null;
  const user = userCookie ? JSON.parse(userCookie) : null;

  return (
    <html lang={locale} dir={"rtl"} data-scroll-behavior="smooth">
      <body className={`font-expo`}>
        <ResponsiveToaster />
        <NavigationStateRestorer />

        <NextIntlClientProvider messages={messages}>
          <AuthProvider initialToken={token} initialRole={role} initialUser={user} >
            <MainProvider lang={locale ?? "en"}>
              {children}
            </MainProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
