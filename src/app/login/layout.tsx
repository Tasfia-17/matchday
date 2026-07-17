import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign In | MatchDay",
    description: "Sign in to your MatchDay account to watch movies and videos together with friends.",
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
