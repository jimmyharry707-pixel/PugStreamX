import { PsAnimatedBackground } from "@/components/layout/ps-animated-background";
import { PsBrand } from "@/components/layout/ps-brand";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative isolate flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <PsAnimatedBackground />
      <PsBrand href="/signin" size="lg" className="drop-shadow" />
      {children}
    </div>
  );
}
