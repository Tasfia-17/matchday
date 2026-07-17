import React from "react";
import PortfolioClient from "./PortfolioClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio | MatchDay",
  description: "Graphic & Motion Designer Portfolio.",
};

export default function PortfolioPage() {
  return <PortfolioClient />;
}
