import React, { createContext, useContext, useState, ReactNode } from "react";

export interface VideoUploadState {
  leftFile: File | null;
  rightFile: File | null;
  leftPreview: string | null;
  rightPreview: string | null;
}

export interface GaitMetrics {
  speed: number; // m/s
  speedChange: number; // %
  cadence: number; // steps/min
  cadenceChange: number;
  strideLength: number; // cm
  strideLengthChange: number;
  symmetryIndex: number; // %
  stabilityScore: number; // /100
  gaitScore: number; // /100
}

export interface AssessmentContextType {
  videos: VideoUploadState;
  setVideos: (v: VideoUploadState) => void;
  reportReady: boolean;
  setReportReady: (v: boolean) => void;
  metrics: GaitMetrics;
  patientName: string;
  setPatientName: (n: string) => void;
}

const defaultMetrics: GaitMetrics = {
  speed: 0.65,
  speedChange: -38,
  cadence: 89,
  cadenceChange: -23,
  strideLength: 52,
  strideLengthChange: -20,
  symmetryIndex: 71,
  stabilityScore: 64,
  gaitScore: 58,
};

const AssessmentContext = createContext<AssessmentContextType | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [videos, setVideos] = useState<VideoUploadState>({
    leftFile: null,
    rightFile: null,
    leftPreview: null,
    rightPreview: null,
  });
  const [reportReady, setReportReady] = useState(false);
  const [patientName, setPatientName] = useState("James Thornton");

  return (
    <AssessmentContext.Provider
      value={{
        videos,
        setVideos,
        reportReady,
        setReportReady,
        metrics: defaultMetrics,
        patientName,
        setPatientName,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx)
    throw new Error("useAssessment must be used within AssessmentProvider");
  return ctx;
}
