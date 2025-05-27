import Link from "next/link";

interface NavLinkProps {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}

export function NavLink({ href, active, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center px-3 py-2 rounded-md transition-colors ${active
        ? "bg-gray-800 text-white"
        : "text-gray-400 hover:text-white hover:bg-gray-800"
        }`}
    >
      {children}
    </Link>
  );
}
