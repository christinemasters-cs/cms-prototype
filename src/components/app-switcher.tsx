"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Info, LayoutGrid, Star } from "lucide-react";

import { Button } from "@/components/ui/button";

type AppItem = {
  label: string;
  icon: () => JSX.Element;
  active?: boolean;
  href?: string;
};

function HomeIcon() {
  const id = `home-${useId()}`;
  const paint0 = `${id}-paint0`;
  const paint1 = `${id}-paint1`;
  const paint2 = `${id}-paint2`;

  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 26 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M25.5 13.342v5.314l-12.526 1.772L.5 18.656v-5.314l12.474-1.773L25.5 13.342z"
        fill={`url(#${paint0})`}
      />
      <path
        d="M.5 25.742v-5.314l7.292 3.986L25.5 20.428v5.314L7.792 31.5.5 25.742z"
        fill={`url(#${paint1})`}
      />
      <path
        d="M25.5 6.258v5.314l-7.292-3.986L.5 11.572V6.258L18.208.5 25.5 6.258z"
        fill={`url(#${paint2})`}
      />
      <defs>
        <linearGradient
          id={paint0}
          x1="-1.723"
          y1="-0.742"
          x2="37.211"
          y2="20.356"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
        <linearGradient
          id={paint1}
          x1="-1.723"
          y1="-0.742"
          x2="37.211"
          y2="20.356"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
        <linearGradient
          id={paint2}
          x1="-1.723"
          y1="-0.742"
          x2="37.211"
          y2="20.356"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CmsIcon() {
  const id = `cms-${useId()}`;
  const paint0 = `${id}-paint0`;
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M15.966 31.065l-13.833-10.8 3.433-2.633 10.4 8.1 10.467-8.1 3.433 2.633-13.9 10.8zm0-8.666L2.133 11.632 15.966.865 29.8 11.632 15.966 22.399z"
        fill={`url(#${paint0})`}
      />
      <defs>
        <linearGradient
          id={paint0}
          x1="-0.333"
          y1="-0.345"
          x2="40.133"
          y2="24.625"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function PersonalizeIcon() {
  const id = `personalize-${useId()}`;
  const paint0 = `${id}-paint0`;
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M15.99 31.364c-2.127 0-4.125-.4-5.992-1.2a15.424 15.424 0 01-4.883-3.283 15.4 15.4 0 01-3.283-4.891c-.8-1.872-1.2-3.872-1.2-6s.4-4.126 1.2-5.992A15.474 15.474 0 015.11 5.113C6.495 3.723 8.126 2.63 9.998 1.83c1.873-.8 3.875-1.2 6.004-1.2 2.13 0 4.131.4 6.003 1.2 1.87.8 3.499 1.894 4.883 3.283 1.384 1.39 2.476 3.02 3.276 4.892.8 1.872 1.2 3.872 1.2 6s-.4 4.126-1.2 5.992a15.423 15.423 0 01-3.283 4.884 15.4 15.4 0 01-4.891 3.283c-1.872.8-3.872 1.2-6 1.2zm.008-3.666c3.245 0 6.006-1.137 8.284-3.41 2.278-2.273 3.416-5.037 3.416-8.29 0-3.245-1.138-6.006-3.416-8.284-2.278-2.278-5.04-3.416-8.284-3.416-3.244 0-6.005 1.138-8.283 3.416-2.278 2.278-3.417 5.04-3.417 8.284 0 3.244 1.14 6.005 3.417 8.283 2.278 2.278 5.04 3.417 8.284 3.417zm.005-2.167c-2.648 0-4.899-.927-6.755-2.78-1.855-1.852-2.783-4.102-2.783-6.75 0-2.647.927-4.898 2.78-6.753 1.852-1.856 4.102-2.784 6.75-2.784 2.647 0 4.898.927 6.754 2.78 1.855 1.852 2.783 4.102 2.783 6.75 0 2.647-.927 4.898-2.78 6.753-1.852 1.856-4.102 2.784-6.75 2.784zm-.009-3.7c1.603 0 2.977-.57 4.121-1.712 1.145-1.142 1.717-2.514 1.717-4.117 0-1.603-.57-2.977-1.713-4.121-1.14-1.145-2.513-1.717-4.116-1.717-1.603 0-2.977.575-4.121 1.724-1.145 1.149-1.717 2.52-1.717 4.114 0 1.603.57 2.975 1.713 4.117 1.14 1.141 2.513 1.712 4.116 1.712zm0-2.133a3.571 3.571 0 01-2.612-1.077c-.722-.718-1.083-1.59-1.083-2.618 0-1.02.362-1.892 1.088-2.617.725-.726 1.598-1.088 2.616-1.088 1.02 0 1.89.362 2.612 1.088.722.725 1.084 1.598 1.084 2.617 0 1.018-.363 1.889-1.089 2.611-.725.722-1.598 1.084-2.617 1.084z"
        fill={`url(#${paint0})`}
      />
      <defs>
        <linearGradient
          id={paint0}
          x1="-2.101"
          y1="-0.601"
          x2="40.557"
          y2="28.063"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function DataInsightsIcon() {
  const id = `lytics-${useId()}`;
  const paint0 = `${id}-paint0`;
  const paint1 = `${id}-paint1`;
  const paint2 = `${id}-paint2`;
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8.88 13.026a3.742 3.742 0 01-1.857-6.988l7.821-4.478a3.734 3.734 0 015.098 1.391 3.746 3.746 0 01-1.39 5.106l-7.818 4.475a3.733 3.733 0 01-1.854.494z"
        fill={`url(#${paint0})`}
      />
      <path
        d="M8.88 23.726a3.742 3.742 0 01-1.857-6.988l7.818-4.474a3.734 3.734 0 015.098 1.39 3.739 3.739 0 01-1.386 5.104l-7.82 4.474a3.698 3.698 0 01-1.853.494z"
        fill={`url(#${paint1})`}
      />
      <path
        d="M15.309 30.933a3.742 3.742 0 01-1.857-6.988l7.818-4.475a3.734 3.734 0 015.098 1.391 3.742 3.742 0 01-1.39 5.103L17.16 30.44a3.729 3.729 0 01-1.85.494z"
        fill={`url(#${paint2})`}
      />
      <defs>
        <linearGradient
          id={paint0}
          x1="3.208"
          y1="-0.131"
          x2="38.533"
          y2="17.132"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
        <linearGradient
          id={paint1}
          x1="3.208"
          y1="-0.131"
          x2="38.533"
          y2="17.132"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
        <linearGradient
          id={paint2}
          x1="3.208"
          y1="-0.131"
          x2="38.533"
          y2="17.132"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function AutomateIcon() {
  const id = `automate-${useId()}`;
  const paint0 = `${id}-paint0`;
  const paint1 = `${id}-paint1`;
  const paint2 = `${id}-paint2`;
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8 7.44a4.952 4.952 0 01-.394-.92L1.614 17.358c-.854 1.544-.347 3.517 1.131 4.409 1.478.891 3.368.362 4.222-1.182l4.15-7.507L8 7.44z"
        fill={`url(#${paint0})`}
      />
      <path
        d="M15.998 7.44l-3.117 5.639 4.15 7.507c.854 1.544 2.744 2.073 4.222 1.182 1.479-.892 1.985-2.865 1.132-4.41L16.392 6.52a4.955 4.955 0 01-.394.921z"
        fill={`url(#${paint1})`}
      />
      <path
        d="M14.676 3.415A3.119 3.119 0 0013.21 2.06a2.993 2.993 0 00-1.212-.258 2.993 2.993 0 00-1.545.433 3.119 3.119 0 00-1.132 1.181l-.017.032a3.35 3.35 0 00.018 3.196l2.676 4.84 2.677-4.84a3.35 3.35 0 00.017-3.196l-.017-.032z"
        fill={`url(#${paint2})`}
      />
      <defs>
        <linearGradient
          id={paint0}
          x1="-0.721"
          y1="0.983"
          x2="28.171"
          y2="21.539"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
        <linearGradient
          id={paint1}
          x1="-0.721"
          y1="0.983"
          x2="28.171"
          y2="21.539"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
        <linearGradient
          id={paint2}
          x1="-0.721"
          y1="0.983"
          x2="28.171"
          y2="21.539"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function BrandKitIcon() {
  const id = `brandkit-${useId()}`;
  const paint0 = `${id}-paint0`;
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M1.533 29.43v-9.533H12v2.666h8v-2.666h10.466v9.533H1.534zm13.133-9.533V17.23h2.667v2.667h-2.666zM1.534 17.23V7.697h8.1V.83h12.733v6.867h8.1v9.533H20v-2.667h-8v2.667H1.533zm12.3-9.533h4.333V5.03h-4.333v2.667z"
        fill={`url(#${paint0})`}
      />
      <defs>
        <linearGradient
          id={paint0}
          x1="-1.039"
          y1="-0.316"
          x2="38.829"
          y2="26.785"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function LaunchIcon() {
  const id = `launch-${useId()}`;
  const paint0 = `${id}-paint0`;
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3.299 31.366v-8.6c0-.711.166-1.372.5-1.983a4.363 4.363 0 011.366-1.517l1.6-1.1c.178 2.089.467 3.922.867 5.5.4 1.578.99 3.345 1.767 5.3l-6.1 2.4zm8.4-3.567c-.845-2.11-1.467-4.088-1.867-5.933-.4-1.844-.6-3.666-.6-5.466 0-2.756.617-5.428 1.85-8.017 1.233-2.59 2.872-4.672 4.917-6.25 2.044 1.578 3.683 3.66 4.917 6.25 1.233 2.589 1.85 5.26 1.85 8.017 0 1.8-.2 3.616-.6 5.45-.4 1.833-1.023 3.816-1.867 5.95h-8.6zm4.3-10.633c.667 0 1.233-.239 1.7-.716.466-.478.7-1.05.7-1.717s-.233-1.234-.7-1.7a2.314 2.314 0 00-1.7-.7c-.667 0-1.234.233-1.7.7a2.315 2.315 0 00-.7 1.7c0 .666.233 1.239.7 1.716a2.288 2.288 0 001.7.717zm12.7 14.2l-6.1-2.4c.778-1.955 1.366-3.722 1.767-5.3.4-1.578.688-3.411.866-5.5l1.6 1.1c.578.4 1.034.906 1.367 1.517.333.61.5 1.272.5 1.983v8.6z"
        fill={`url(#${paint0})`}
      />
      <defs>
        <linearGradient
          id={paint0}
          x1="1.04"
          y1="0.961"
          x2="39.205"
          y2="23.243"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function DeveloperHubIcon() {
  const id = `developerhub-${useId()}`;
  const paint0 = `${id}-paint0`;
  const paint1 = `${id}-paint1`;
  const paint2 = `${id}-paint2`;
  const paint3 = `${id}-paint3`;
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8 14a2.002 2.002 0 012 2v1h5v3.128a4.003 4.003 0 00-1.828 1.044 3.998 3.998 0 001.828 6.7V30H2V17h4v-1l.01-.197A2.002 2.002 0 018 14z"
        fill={`url(#${paint0})`}
      />
      <path
        d="M20.128 17a4.003 4.003 0 001.044 1.828 3.998 3.998 0 006.7-1.828H30v13H17v-4h-1a2.001 2.001 0 01-1.414-3.414 2 2 0 011.217-.576L16 22h1v-5h3.128z"
        fill={`url(#${paint1})`}
      />
      <path
        d="M30 15h-4v1a2.001 2.001 0 01-3.414 1.414 2.002 2.002 0 01-.576-1.217L22 16v-1h-5v-3.128a3.998 3.998 0 002.695-5.402A3.998 3.998 0 0017 4.127V2h13v13z"
        fill={`url(#${paint2})`}
      />
      <path
        d="M15 6h1a2.001 2.001 0 010 4h-1v5h-3.128a3.998 3.998 0 00-5.402-2.695A3.998 3.998 0 004.127 15H2V2h13v4z"
        fill={`url(#${paint3})`}
      />
      <defs>
        <linearGradient
          id={paint0}
          x1="-0.49"
          y1="0.878"
          x2="38.374"
          y2="26.992"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
        <linearGradient
          id={paint1}
          x1="-0.49"
          y1="0.878"
          x2="38.374"
          y2="26.992"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
        <linearGradient
          id={paint2}
          x1="-0.49"
          y1="0.878"
          x2="38.374"
          y2="26.992"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
        <linearGradient
          id={paint3}
          x1="-0.49"
          y1="0.878"
          x2="38.374"
          y2="26.992"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MarketplaceIcon() {
  const id = `marketplace-${useId()}`;
  const paint0 = `${id}-paint0`;
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4.566 10.108v-4.2h22.867v4.2H4.566zm-.012 20.2v-8H3.066v-4.2l1.5-6.667h22.867l1.5 6.667v4.2h-1.5v8h-4.2v-8h-3.8v8H4.554zm4.212-4.2h6.467v-3.8H8.766v3.8z"
        fill={`url(#${paint0})`}
      />
      <defs>
        <linearGradient
          id={paint0}
          x1="0.767"
          y1="4.93"
          x2="35.337"
          y2="29.556"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function AcademyIcon() {
  const id = `academy-${useId()}`;
  const paint0 = `${id}-paint0`;
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M27.934 23.165V14.03L16 20.531.367 11.998 16 3.498l15.634 8.5v11.167h-3.7zM16 28.465l-9.8-5.267v-6.167l9.8 5.334 9.8-5.334v6.167L16 28.465z"
        fill={`url(#${paint0})`}
      />
      <defs>
        <linearGradient
          id={paint0}
          x1="-2.413"
          y1="2.497"
          x2="34.465"
          y2="33.53"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function AnalyticsIcon() {
  const id = `analytics-${useId()}`;
  const paint0 = `${id}-paint0`;
  const paint1 = `${id}-paint1`;
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M29 12.505V28l-26-.216v-6.346l5.503-4.709a2.158 2.158 0 001.992 0l4.535 3.88a2.164 2.164 0 002.053 2.85 2.164 2.164 0 002.167-2.162c0-.434-.13-.838-.351-1.177l5.281-7.528a2.161 2.161 0 002.208-.797l2.612.71z"
        fill={`url(#${paint0})`}
      />
      <path
        d="M29 4v6.824l-2.184-.593a2.164 2.164 0 00-2.15-1.907 2.164 2.164 0 00-2.166 2.162c0 .434.129.837.35 1.175l-5.283 7.53a2.16 2.16 0 00-1.479.187l-4.536-3.88a2.15 2.15 0 00.115-.687c0-1.194-.97-2.162-2.167-2.162a2.164 2.164 0 00-2.053 2.85L3 19.301V4h26z"
        fill={`url(#${paint1})`}
      />
      <defs>
        <linearGradient
          id={paint0}
          x1="0.688"
          y1="3.038"
          x2="34.927"
          y2="27.962"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
        <linearGradient
          id={paint1}
          x1="0.688"
          y1="3.038"
          x2="34.927"
          y2="27.962"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function AdminIcon() {
  const id = `admin-${useId()}`;
  const paint0 = `${id}-paint0`;
  const paint1 = `${id}-paint1`;
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.844 1.668v4.447h12.444v8.304a9.93 9.93 0 00-4.666-1.156c-5.441 0-9.852 4.343-9.852 9.7 0 1.663.425 3.228 1.174 4.596H2.399V7.46l12.445-5.792zM6.548 24.785h4.148V22.52H6.548v2.264zm0-6.127h4.148v-2.263H6.548v2.263zm0-6.127h4.148v-2.263H6.548v2.263zm12.444-1.498h4.148V8.77h-4.148v2.263z"
        fill={`url(#${paint0})`}
      />
      <path
        d="M30.266 21.637a.506.506 0 00-.252-.344l-1.933-1.085-.008-2.145a.503.503 0 00-.184-.388 7.285 7.285 0 00-2.38-1.319.525.525 0 00-.418.038l-1.95 1.073-1.952-1.075a.524.524 0 00-.42-.038c-.87.289-1.677.738-2.377 1.323a.509.509 0 00-.183.388l-.01 2.147-1.933 1.084a.517.517 0 00-.252.345 6.69 6.69 0 000 2.652.505.505 0 00.252.344l1.933 1.085.008 2.146a.503.503 0 00.183.388 7.285 7.285 0 002.38 1.318.525.525 0 00.419-.037l1.952-1.077 1.952 1.075a.52.52 0 00.42.037 7.295 7.295 0 002.376-1.322.51.51 0 00.184-.387l.01-2.148 1.933-1.084a.517.517 0 00.252-.345 6.69 6.69 0 00-.002-2.649zm-7.125 3.879c-.513 0-1.014-.15-1.44-.43a2.561 2.561 0 01-.955-1.146 2.515 2.515 0 01-.148-1.474c.1-.495.347-.95.71-1.307.362-.357.824-.6 1.327-.698a2.63 2.63 0 011.498.145c.474.193.878.52 1.163.94a2.524 2.524 0 01-.322 3.222 2.613 2.613 0 01-1.833.748z"
        fill={`url(#${paint1})`}
      />
      <defs>
        <linearGradient
          id={paint0}
          x1="-0.09"
          y1="0.548"
          x2="38.716"
          y2="26.686"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
        <linearGradient
          id={paint1}
          x1="-0.09"
          y1="0.548"
          x2="38.716"
          y2="26.686"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const appItems: AppItem[] = [
  { label: "Home", icon: HomeIcon },
  { label: "CMS", icon: CmsIcon },
  { label: "Personalize", icon: PersonalizeIcon },
  { label: "Data & Insights", icon: DataInsightsIcon },
  {
    label: "Automate",
    icon: AutomateIcon,
    active: true,
    href: "/automations/projects",
  },
  { label: "Brand Kit", icon: BrandKitIcon },
  { label: "Launch", icon: LaunchIcon },
  { label: "Developer Hub", icon: DeveloperHubIcon },
  { label: "Marketplace", icon: MarketplaceIcon },
  { label: "Academy", icon: AcademyIcon },
  { label: "Analytics", icon: AnalyticsIcon },
  { label: "Administration", icon: AdminIcon },
];

export function AppSwitcher() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      if (!panelRef.current) {
        return;
      }
      if (!panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Apps"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="h-8 w-8"
      >
        <LayoutGrid className="h-5 w-5" />
      </Button>
      {open ? (
        <div className="absolute right-0 top-12 z-40 w-[420px] rounded-2xl border border-[color:var(--color-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.18)]">
          <div className="grid grid-cols-3 gap-y-6 text-center">
            {appItems.map((item) => {
              const Icon = item.icon;
              const content = (
                <>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-surface-muted)]/60">
                    <Icon />
                  </span>
                  <span
                    className={`font-medium ${
                      item.active ? "text-[color:var(--color-brand)]" : ""
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              );

              if (item.href) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="group flex flex-col items-center gap-2 text-[13px] text-[color:var(--color-foreground)]"
                    onClick={() => setOpen(false)}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={item.label}
                  type="button"
                  className="group flex flex-col items-center gap-2 text-[13px] text-[color:var(--color-foreground)]"
                >
                  {content}
                </button>
              );
            })}
          </div>
          <div className="mt-6 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-[13px] text-[color:var(--color-foreground)]">
            <div className="flex items-center gap-3">
              <Star className="h-4 w-4 text-[color:var(--color-muted)]" />
              <span className="font-semibold">Favorites</span>
              <span className="ml-auto text-[color:var(--color-brand)]">
                <Info className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
