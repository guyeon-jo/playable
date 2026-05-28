import Link from "next/link";
import { ComponentExample } from "@/components/component-example";

export default function Page() {
  return (
    <div>
      <div style={{ padding: "12px 16px", background: "#111", borderBottom: "1px solid #333" }}>
        <Link href="/game" style={{ color: "#7ec8e3", fontSize: 14, fontFamily: "monospace" }}>
          🧟 Zombie Survivors →
        </Link>
      </div>
      <ComponentExample />
    </div>
  );
}