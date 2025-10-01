import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { AbsoluteFill, OffthreadVideo, Audio, Sequence, interpolate, useCurrentFrame } from "remotion";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
const EditorComposition = ({ clips = [], audioClips = [] }) => {
  return /* @__PURE__ */ jsxDEV(AbsoluteFill, { style: { backgroundColor: "#000" }, children: [
    clips.map((clip, index) => {
      const effects = clip.effects || {};
      const text = clip.text || {};
      const hasTransition = clip.transition && clip.transition !== "none";
      const transitionDuration = 15;
      return /* @__PURE__ */ jsxDEV(
        Sequence,
        {
          from: clip.startFrame || 0,
          durationInFrames: clip.durationFrames || 90,
          children: /* @__PURE__ */ jsxDEV(
            ClipWithEffects,
            {
              clip,
              effects,
              text,
              hasTransition,
              transitionType: clip.transition,
              transitionDuration
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 23,
              columnNumber: 13
            }
          )
        },
        index,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 18,
          columnNumber: 11
        }
      );
    }),
    audioClips.map((clip, index) => /* @__PURE__ */ jsxDEV(
      Sequence,
      {
        from: clip.startFrame || 0,
        durationInFrames: clip.durationFrames || 90,
        children: /* @__PURE__ */ jsxDEV(Audio, { src: clip.url, volume: clip.effects?.volume || 1 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 40,
          columnNumber: 11
        })
      },
      `audio-${index}`,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 35,
        columnNumber: 9
      }
    ))
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 10,
    columnNumber: 5
  });
};
const ClipWithEffects = ({ clip, effects, text, hasTransition, transitionType, transitionDuration }) => {
  const frame = useCurrentFrame();
  const opacity = effects.opacity !== void 0 ? effects.opacity : 1;
  const blur = effects.blur || 0;
  const brightness = effects.brightness || 1;
  const saturation = effects.saturation || 1;
  let transitionOpacity = 1;
  if (hasTransition && frame < transitionDuration) {
    if (transitionType === "fade") {
      transitionOpacity = interpolate(frame, [0, transitionDuration], [0, 1]);
    } else if (transitionType === "zoom") {
      transitionOpacity = interpolate(frame, [0, transitionDuration], [0, 1]);
    }
  }
  let transitionTransform = "";
  if (hasTransition && frame < transitionDuration) {
    if (transitionType === "slide") {
      const slideX = interpolate(frame, [0, transitionDuration], [100, 0]);
      transitionTransform = `translateX(${slideX}%)`;
    } else if (transitionType === "zoom") {
      const scale = interpolate(frame, [0, transitionDuration], [0.5, 1]);
      transitionTransform = `scale(${scale})`;
    }
  }
  const filterStyle = `blur(${blur}px) brightness(${brightness}) saturate(${saturation})`;
  return /* @__PURE__ */ jsxDEV(AbsoluteFill, { children: /* @__PURE__ */ jsxDEV("div", { style: {
    width: "100%",
    height: "100%",
    opacity: opacity * transitionOpacity,
    transform: transitionTransform,
    transition: "transform 0.1s ease-out"
  }, children: [
    /* @__PURE__ */ jsxDEV(
      OffthreadVideo,
      {
        src: clip.url,
        volume: effects.volume || 1,
        playbackRate: effects.speed || 1,
        startFrom: clip.trimStart || 0,
        endAt: clip.trimEnd || clip.durationFrames,
        style: {
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: filterStyle
        }
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 86,
        columnNumber: 9
      }
    ),
    text.content && /* @__PURE__ */ jsxDEV(
      AbsoluteFill,
      {
        style: {
          justifyContent: text.position === "top" ? "flex-start" : text.position === "bottom" ? "flex-end" : "center",
          alignItems: "center",
          padding: "2rem",
          pointerEvents: "none"
        },
        children: /* @__PURE__ */ jsxDEV("div", { style: {
          fontSize: `${text.fontSize || 48}px`,
          color: text.color || "#ffffff",
          fontWeight: "bold",
          textAlign: "center",
          textShadow: "0 2px 10px rgba(0,0,0,0.8)",
          maxWidth: "90%",
          wordWrap: "break-word"
        }, children: text.content }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 108,
          columnNumber: 13
        })
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 100,
        columnNumber: 11
      }
    )
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 79,
    columnNumber: 7
  }) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 78,
    columnNumber: 5
  });
};
export {
  EditorComposition
};
