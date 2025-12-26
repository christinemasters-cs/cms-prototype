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
        aria-label="Upcoming events"
        aria-live="polite"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div
          className={`carouselSlidesWrapper ${hovering ? "hovering" : ""}`}
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          aria-describedby={carouselId}
        >
          {events.map((event) => (
            <div className="carouselSlide" key={event.title}>
              <Image
                src={event.imageSrc}
                alt={event.title}
                width={640}
                height={360}
                className="carouselImage"
                priority={event.title === "Gartner Marketing Symposium 2026"}
              />
              <Badge
                variant="outline"
                className="carouselTag dashboard-tag text-[10px] font-semibold uppercase"
              >
                {event.tag}
              </Badge>
              <div className="carouselMeta">
                <span>{event.title}</span>
                <span className="carouselMetaDate">| {event.date}</span>
              </div>
              <p className="carouselDescription">
                {event.description}
              </p>
              <div className="carouselActionCont">
                <div className="carousel-button-ellipse">
                  <Button
                    variant="outline"
                    size="sm"
                    className="carousel-button h-7 rounded-md px-3 text-[12px] text-[color:var(--color-brand)]"
                  >
                    Register
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="carousel-button flex items-center gap-1 text-[11px] font-semibold text-[color:var(--color-muted)] transition hover:text-[color:var(--color-brand)]"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="h-3 w-3" />
                    Previous
                  </button>
                  <button
                    type="button"
                    className="carousel-button flex items-center gap-1 text-[11px] font-semibold text-[color:var(--color-muted)] transition hover:text-[color:var(--color-brand)]"
                    onClick={handleNext}
                  >
                    Next
                    <ChevronRight className="h-3 w-3" />
                  </button>
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
