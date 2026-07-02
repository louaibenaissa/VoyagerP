"use client";

import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  currentFile?: string;
}

export function FileUpload({ onFileSelect, isLoading, currentFile }: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: isLoading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/50",
        isLoading && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        {currentFile ? (
          <>
            <FileText className="w-10 h-10 text-primary" />
            <div>
              <p className="text-sm font-medium">{currentFile}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Drop a new PDF to replace
              </p>
            </div>
          </>
        ) : (
          <>
            <Upload className="w-10 h-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {isDragActive ? "Drop your PDF here" : "Upload a research paper"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag & drop or click to select a PDF file
              </p>
            </div>
          </>
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Processing...
          </div>
        )}
      </div>
    </div>
  );
}
