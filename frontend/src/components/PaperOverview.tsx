"use client";

import React from "react";
import { FileText, Users, BookOpen, List } from "lucide-react";
import type { PaperInfo } from "@/lib/api";

interface PaperOverviewProps {
  paper: PaperInfo;
  onSectionClick?: (section: string) => void;
}

export function PaperOverview({ paper, onSectionClick }: PaperOverviewProps) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-start gap-3">
        <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Title</p>
          <h2 className="font-semibold text-foreground">{paper.title}</h2>
        </div>
      </div>

      {/* Authors */}
      {paper.authors.length > 0 && (
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Authors</p>
            <p className="text-sm text-foreground">{paper.authors.join(", ")}</p>
          </div>
        </div>
      )}

      {/* Abstract */}
      {paper.abstract && (
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Abstract</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{paper.abstract}</p>
          </div>
        </div>
      )}

      {/* Sections */}
      {paper.sections.length > 0 && (
        <div className="flex items-start gap-3">
          <List className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Sections</p>
            <div className="flex flex-wrap gap-2">
              {paper.sections.map((section, index) => (
                <button
                  key={index}
                  onClick={() => onSectionClick?.(section.title)}
                  className="px-2.5 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
                >
                  {section.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Page count */}
      <div className="text-xs text-muted-foreground pt-2 border-t border-border">
        {paper.page_count} pages
      </div>
    </div>
  );
}
