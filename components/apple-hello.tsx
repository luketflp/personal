'use client' 

import { AppleHelloEnglishEffect } from "@/components/ui/shadcn-io/apple-hello-effect";
import React from "react";

const AppleHello = ({ onFinish }: { onFinish: () => void }) => {
  return (
    <div className="flex w-full h-screen flex-col justify-center items-center gap-16 bg-muted">
      <AppleHelloEnglishEffect speed={0.7} onAnimationComplete={onFinish}/>
    </div>
  )
};
export default AppleHello;
