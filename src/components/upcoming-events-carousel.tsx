"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const events = [
  {
    title: "Gartner Marketing Symposium 2026",
    date: "May 11-12, 2026",
    description:
      "This year's marketing conference 2026 theme is Build What's Next: Marketing Leadership in an AI-Driven World.",
    imageSrc: "/Gartner_Marketing_Symposium_UK.png",
    tag: "Event",
  },
  {
    title: "MoneyLive Summit 2026",
    date: "Oct 5-6, 2026",
    description:
      "Global banking and payments event focused on AI, digital transformation, and next-gen customer experience.",
    imageSrc: "/MoneyLive_Summit_UK.png",
    tag: "Event",
  },
  {
    title: "Shoptalk Europe 2026",
    date: "Jun 2-4, 2026",
    description:
      "A retail conference for commerce leaders covering customer journeys, unified retail, and growth strategy.",
    imageSrc: "/Shoptalk_Europe.png",
    tag: "Event",
  },
];

export function UpcomingEventsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const carouselId = useId();

  const total = events.length;
  const current = events[activeIndex];

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  useEffect(() => {
    if (hovering) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [hovering, total]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-[color:var(--text-secondary-text-tarmac-grey-n-700)]">
          Upcoming Events
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-[12px] font-semibold text-[color:var(--color-brand)]"
        >
          See All (5)
        </Button>
      </div>

      <div
        className="carouselViewport carouselCont"
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={`Events carousel: Item ${activeIndex + 1} of ${total}`}
        aria-live="polite"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div
          className={`carouselSlidesWrapper ${hovering ? "hovering" : ""}`}
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          aria-describedby={carouselId}
        >
          {events.map((event, index) => (
            <div
              className="carouselSlide"
              key={event.title}
              role="group"
              aria-roledescription="slide"
              aria-label={`Item ${index + 1} of ${total}: ${event.title}`}
            >
              <div className="carouselCont">
                <Image
                  src={event.imageSrc}
                  alt={event.title}
                  width={800}
                  height={500}
                  className="carouselImage"
                  priority={event.title === "Gartner Marketing Symposium 2026"}
                />
                <span
                  className="carouselTag mt-2 inline-flex w-fit max-w-fit items-center self-start rounded-md border border-[color:var(--color-border)] px-2 py-0.5 text-[11px] font-medium tracking-normal text-[color:var(--color-muted)]"
                  aria-hidden="true"
                >
                  {event.tag}
                </span>
                <div>
                  <p className="display-inline text-[14px] font-semibold text-[color:var(--color-foreground)]">
                    {event.title}
                  </p>
                  <p className="display-inline text-[13px] font-normal text-[color:var(--color-muted)]">
                    {" "}
                    | {event.date}
                  </p>
                </div>
                <p className="carouselDescription singleLine text-[12px] leading-[18px] text-[color:var(--color-muted)]">
                  {event.description}
                </p>
                <div className="carouselActionCont">
                  <div className="carousel-button-ellipse">
                    <Button
                      variant="outline"
                      size="sm"
                      className="carousel-button h-7 rounded-md px-3 text-[12px] text-[color:var(--color-brand)]"
                      aria-label={`Register for ${event.title}`}
                    >
                      Register
                    </Button>
                  </div>
                  <div className="carouselNav inline-flex items-center gap-4 whitespace-nowrap">
                    <button
                      type="button"
                      className="carousel-button flex items-center gap-1 whitespace-nowrap text-[13px] font-semibold text-[color:var(--color-brand)]"
                      onClick={handlePrevious}
                      aria-label={`Previous event: Item ${activeIndex + 1} of ${total}`}
                    >
                      <ChevronLeft className="h-6 w-6" />
                      Previous
                    </button>
                    <button
                      type="button"
                      className="carousel-button flex items-center gap-1 whitespace-nowrap text-[13px] font-semibold text-[color:var(--color-brand)]"
                      onClick={handleNext}
                      aria-label={`Next event: Item ${activeIndex + 1} of ${total}`}
                    >
                      Next
                      <ChevronRight className="h-6 w-6" />
                  </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <span id={carouselId} className="sr-only">
          Showing {activeIndex + 1} of {total}: {current.title}
        </span>
      </div>
    </div>
  );
}
