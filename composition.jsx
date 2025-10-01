import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence } from "remotion";
const EditorComposition = ({ clips = [] }) => {
  return /* @__PURE__ */ jsxDEV(AbsoluteFill, { style: { backgroundColor: "#000" }, children: clips.map((clip, index) => /* @__PURE__ */ jsxDEV(Sequence, { from: clip.startFrame || 0, durationInFrames: 90, children: /* @__PURE__ */ jsxDEV(AbsoluteFill, { children: /* @__PURE__ */ jsxDEV(
    OffthreadVideo,
    {
      src: clip.url,
      style: {
        width: "100%",
        height: "100%",
        objectFit: "cover"
      }
    },
    void 0,
    false,
    {
      fileName: "<stdin>",
      lineNumber: 10,
      columnNumber: 13
    }
  ) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 9,
    columnNumber: 11
  }) }, index, false, {
    fileName: "<stdin>",
    lineNumber: 8,
    columnNumber: 9
  })) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 6,
    columnNumber: 5
  });
};
export {
  EditorComposition
};
