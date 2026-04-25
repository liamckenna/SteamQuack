import { ReactNode, useState } from "react";
import "./FolderPager.css";
import nextArrow from "../../assets/images/Corner-Right.png"; 
import prevArrow from "../../assets/images/Corner-Left.png";

type FolderPagerProps = {
  pages: ReactNode[];
  className?: string;
};

type CornerButtonProps = {
  direction: "prev" | "next";
  onClick: () => void;
};

function CornerButton({ direction, onClick }: CornerButtonProps) {
  const imageSrc = direction === "next" ? nextArrow : prevArrow;
  const altText = direction === "next" ? "Next page" : "Previous page";

  return (
    <button
      type="button"
      className={`folder-corner folder-corner--${direction}`}
      onClick={onClick}
      aria-label={altText}
    >
      <img src={imageSrc} alt={altText} className="folder-corner__img" />
    </button>
  );
}

export default function FolderPager({
  pages,
  className = "",
}: FolderPagerProps) {
  const [pageIndex, setPageIndex] = useState(0);

  if (!pages.length) return null;

  const hasPrev = pageIndex > 0;
  const hasNext = pageIndex < pages.length - 1;

  return (
    <div className={`folder-pager ${className}`.trim()}>
      <div className="folder-pager__page">{pages[pageIndex]}</div>

      {hasPrev && (
        <CornerButton
          direction="prev"
          onClick={() => setPageIndex((prev) => prev - 1)}
        />
      )}

      {hasNext && (
        <CornerButton
          direction="next"
          onClick={() => setPageIndex((prev) => prev + 1)}
        />
      )}
    </div>
  );
}