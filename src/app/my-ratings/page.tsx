"use client";

import React from "react";
import { MyRatingsView } from "@/features/series/components/my-ratings-view";

export default function MyRatingsPage() {
  return (
    <div className="w-full min-h-screen bg-[#09090B] text-white px-4 md:px-12 py-8">
      <div className="max-w-7xl mx-auto">
        <MyRatingsView />
      </div>
    </div>
  );
}
