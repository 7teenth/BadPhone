import React from "react";

interface FormRowProps {
  align?: "start" | "center" | "end";
  children: React.ReactNode;
}

export const FormRow: React.FC<FormRowProps> = ({
  align = "start",
  children,
}) => {
  const justifyMap: Record<string, string> = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
  };

  return (
    <div
      className={`flex flex-col md:flex-row gap-4 items-${align} ${justifyMap[align]}`}
    >
      {children}
    </div>
  );
};
