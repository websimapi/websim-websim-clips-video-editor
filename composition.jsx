import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { AbsoluteFill, OffthreadVideo, Audio, Sequence } from "remotion";
const EditorComposition = ({ clips = [], audioClips = [] }) => {
  return /* @__PURE__ */ jsxDEV(AbsoluteFill, { style: { backgroundColor: "#000" }, children: [
    clips.map((clip, index) => /* @__PURE__ */ jsxDEV(
      Sequence,
      {
        from: clip.startFrame || 0,
        durationInFrames: clip.durationFrames || 90,
        children: /* @__PURE__ */ jsxDEV(AbsoluteFill, { children: /* @__PURE__ */ jsxDEV(
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
            lineNumber: 14,
            columnNumber: 13
          }
        ) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 13,
          columnNumber: 11
        })
      },
      index,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 8,
        columnNumber: 9
      }
    )),
    audioClips.map((clip, index) => /* @__PURE__ */ jsxDEV(
      Sequence,
      {
        from: clip.startFrame || 0,
        durationInFrames: clip.durationFrames || 90,
        children: /* @__PURE__ */ jsxDEV(Audio, { src: clip.url }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 31,
          columnNumber: 11
        })
      },
      `audio-${index}`,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 26,
        columnNumber: 9
      }
    ))
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 6,
    columnNumber: 5
  });
};
export {
  EditorComposition
};
