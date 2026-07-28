import { AdvertiserLayout } from "@/features/advertiser-dashboard/components/advertiser-layout";

export default function AdvertiserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // We let the page control the activeView by passing it down if necessary,
    // or we can just render the AdvertiserLayout with a fixed activeView in the page itself.
    // However, since Next.js layouts don't easily know the current route state without client hooks,
    // we will wrap the children with nothing here, and put AdvertiserLayout in page.tsx
    // OR we put the client-side logic here.
    <>
      {children}
    </>
  );
}
