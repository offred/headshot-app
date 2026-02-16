"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, motion, animate } from "framer-motion";
import Image from "next/image";

interface SliderItem {
  bgColor: string;
  src: string;
  alt: string;
}

const items: SliderItem[] = [
  { bgColor: "bg-red-300", src: "survivor/Jawan-Pitts.png", alt: "Jawan Pitts" },
  { bgColor: "bg-amber-300", src: "bb/ashley-hollis.png", alt: "Ashley Hollis" },
  { bgColor: "bg-blue-300", src: "bb/zach-cornell.png", alt: "Zach Cornell" },
  { bgColor: "bg-fuchsia-300", src: "survivor/Sage-Ahrens-Nichols.png", alt: "Sage Ahrens-Nichols" },
  { bgColor: "bg-emerald-300", src: "survivor/Steven-Ramm.png", alt: "Steven Ramm" },
  { bgColor: "bg-violet-300", src: "bb/morgan-pope.png", alt: "Morgan Pope" },
  { bgColor: "bg-amber-200", src: "survivor/Savannah-Louie.png", alt: "Savannah Louie" },
  { bgColor: "bg-pink-300", src: "bb/vince-panaro.png", alt: "Vince Panaro" },
  { bgColor: "bg-orange-300", src: "bb/adrian-rocha.png", alt: "Adrian Rocha" },
  { bgColor: "bg-indigo-300", src: "survivor/Nate-Moore.png", alt: "Nate Moore" },
];

const ImageCard = ({ bgColor, src, alt }: SliderItem) => (
  <div
    className={`flex shrink-0 w-16 h-16 items-center justify-center rounded-full overflow-hidden ${bgColor}`}
  >
    <div className="relative h-full w-full mt-1.5">
      <Image
        fill
        alt={alt}
        src={`/assets/images/tellydraft/${src}`}
        className="object-cover"
        sizes="64px"
      />
    </div>
  </div>
);

// Repeat enough times to always fill the viewport during scroll
const repeated = [...items, ...items, ...items];

export function SlidingImages() {
  const contentRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  useEffect(() => {
    if (!contentRef.current) return;

    // Measure the width of one full set of items (including gaps)
    const children = contentRef.current.children;
    const firstItem = children[0] as HTMLElement;
    const firstClone = children[items.length] as HTMLElement;
    const oneSetWidth = firstClone.offsetLeft - firstItem.offsetLeft;

    const controls = animate(x, -oneSetWidth, {
      duration: 30,
      ease: "linear",
      repeat: Infinity,
      repeatType: "loop",
    });

    return () => controls.stop();
  }, [x]);

  return (
    <div
      className="w-full overflow-hidden relative mt-10"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
      }}
    >
      <motion.div
        ref={contentRef}
        style={{ x }}
        className="flex items-center gap-5 w-max"
      >
        {repeated.map((item, index) => (
          <ImageCard key={`${item.alt}-${index}`} {...item} />
        ))}
      </motion.div>
    </div>
  );
}
