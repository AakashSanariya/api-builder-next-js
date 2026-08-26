"use client";

import React from "react";
import { motion } from "framer-motion";
import { type PreviewDevice } from "../../store/useBuilderStore";

interface DeviceFrameProps {
  device: PreviewDevice;
  children: React.ReactNode;
}

const DEVICE_CONFIGS = {
  desktop: {
    width: "100%",
    maxWidth: "100%",
    frameClass: "rounded-xl overflow-hidden",
    viewportClass: "w-full",
  },
  tablet: {
    width: "768px",
    maxWidth: "100%",
    frameClass: "rounded-3xl",
    viewportClass: "w-[768px]",
  },
  phone: {
    width: "375px",
    maxWidth: "100%",
    frameClass: "rounded-[2.5rem]",
    viewportClass: "w-[375px]",
  },
} as const;

function DesktopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
      <div className="bg-gray-800 px-4 py-2.5 flex items-center gap-2 border-b border-gray-700/50">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-gray-700/50 rounded-md px-3 py-0.5 min-w-[200px] max-w-[400px] w-full">
            <div className="h-1.5 bg-gray-600/50 rounded-full w-3/4 mx-auto" />
          </div>
        </div>
        <div className="w-12" />
      </div>
      <div className="bg-background min-h-[500px] max-h-[70vh] overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </div>
  );
}

function TabletFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-3xl p-3 shadow-2xl">
      <div className="bg-gray-800 rounded-2xl px-4 py-2 flex items-center justify-center border-b border-gray-700/50">
        <div className="w-2 h-2 rounded-full bg-gray-600" />
      </div>
      <div className="bg-background rounded-b-2xl min-h-[600px] max-h-[70vh] overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </div>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-[2.5rem] p-2.5 shadow-2xl">
      <div className="bg-gray-800 rounded-t-[2rem] px-4 pt-3 pb-1 flex items-center justify-center">
        <div className="w-20 h-5 bg-gray-900 rounded-full" />
      </div>
      <div className="bg-background rounded-b-[2rem] min-h-[600px] max-h-[70vh] overflow-y-auto custom-scrollbar">
        {children}
      </div>
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-28 h-1 bg-gray-600 rounded-full" />
      </div>
    </div>
  );
}

export default function DeviceFrame({ device, children }: DeviceFrameProps) {
  const config = DEVICE_CONFIGS[device];

  const renderFrame = () => {
    switch (device) {
      case "tablet":
        return <TabletFrame>{children}</TabletFrame>;
      case "phone":
        return <PhoneFrame>{children}</PhoneFrame>;
      default:
        return <DesktopFrame>{children}</DesktopFrame>;
    }
  };

  return (
    <motion.div
      key={device}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex justify-center w-full"
    >
      <div
        className={`${config.frameClass} w-full`}
        style={{ maxWidth: config.maxWidth }}
      >
        {renderFrame()}
      </div>
    </motion.div>
  );
}
