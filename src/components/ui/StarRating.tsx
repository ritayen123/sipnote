"use client";

import { useState } from "react";
import { StarIcon } from "./Icons";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
}

export default function StarRating({
  value,
  onChange,
  size = "md",
  readonly = false,
}: StarRatingProps) {
  const [hover, setHover] = useState(0);

  const iconSize = { sm: 16, md: 24, lg: 32 }[size];

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = (hover || value) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            aria-label={`${star} 星`}
            className={`transition-transform ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            onClick={() => !readonly && onChange(star)}
          >
            <StarIcon
              size={iconSize}
              color={active ? "#fbbf24" : "#444"}
              filled={active}
            />
          </button>
        );
      })}
    </div>
  );
}
