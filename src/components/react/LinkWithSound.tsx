import { playClickSound } from "@/utils/clickSound";

const LinkWithSound = ({
  href,
  target = "_blank",
  rel = "noopener noreferrer",
  className,
  children,
}: {
  href: string;
  target?: string;
  rel?: string;
  className?: string;
  children: React.ReactNode;
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setTimeout(() => {
      if (target === "_blank") {
        window.open(href, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = href;
      }
    }, 100);
    playClickSound();
  };
  return (
    <div className="flex items-center gap-2">
      <a
        href={href}
        target={target}
        rel={rel}
        onClick={handleClick}
        className={className}
      >
        {children}
      </a>
    </div>
  );
};

export default LinkWithSound;
