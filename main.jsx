import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Player } from "@websim/remotion/player";
import { EditorComposition } from "./composition.jsx";
import { Input, ALL_FORMATS, BlobSource } from "mediabunny";
const room = new WebsimSocket();
const App = () => {
  const [clips, setClips] = useState([]);
  const [audioClips, setAudioClips] = useState([]);
  const [selectedClip, setSelectedClip] = useState(null);
  const [selectedClipIndex, setSelectedClipIndex] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("effects");
  const videoClips = React.useSyncExternalStore(
    room.collection("video_clip_v2").subscribe,
    room.collection("video_clip_v2").getList
  );
  React.useEffect(() => {
    window.websim.getCurrentUser().then(setCurrentUser);
  }, []);
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await window.websim.upload(file);
      const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
      const durationSeconds = await input.computeDuration();
      const durationFrames = Math.round(durationSeconds * 30);
      const clip = await room.collection("video_clip_v2").create({
        url,
        name: file.name,
        duration: durationSeconds,
        durationFrames,
        type: "video"
      });
      const currentEndFrame = clips.reduce((max, c) => Math.max(max, (c.startFrame || 0) + (c.durationFrames || 90)), 0);
      setClips([...clips, {
        ...clip,
        startFrame: currentEndFrame,
        effects: { opacity: 1, volume: 1, speed: 1 },
        trimStart: 0,
        trimEnd: durationFrames
      }]);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading video. Please try again.");
    } finally {
      setUploading(false);
    }
  };
  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await window.websim.upload(file);
      const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
      const durationSeconds = await input.computeDuration();
      const durationFrames = Math.round(durationSeconds * 30);
      const audioClip = {
        id: Date.now().toString(),
        url,
        name: file.name,
        duration: durationSeconds,
        durationFrames,
        type: "audio",
        startFrame: 0,
        effects: { volume: 1 }
      };
      setAudioClips([...audioClips, audioClip]);
    } catch (error) {
      console.error("Audio upload error:", error);
      alert("Error uploading audio. Please try again.");
    } finally {
      setUploading(false);
    }
  };
  const handleAddToTimeline = (videoClip) => {
    const currentEndFrame = clips.reduce((max, c) => Math.max(max, (c.startFrame || 0) + (c.durationFrames || 90)), 0);
    const newClip = {
      ...videoClip,
      startFrame: currentEndFrame,
      effects: { opacity: 1, volume: 1, speed: 1 },
      trimStart: 0,
      trimEnd: videoClip.durationFrames || 90
    };
    setClips([...clips, newClip]);
    setShowGallery(false);
  };
  const handleRemoveClip = (index) => {
    setClips(clips.filter((_, i) => i !== index));
    if (selectedClipIndex === index) {
      setSelectedClip(null);
      setSelectedClipIndex(null);
    }
  };
  const handleSplitClip = (index) => {
    const clip = clips[index];
    const midPoint = Math.floor((clip.trimEnd - clip.trimStart) / 2);
    const firstClip = {
      ...clip,
      trimEnd: clip.trimStart + midPoint,
      durationFrames: midPoint
    };
    const secondClip = {
      ...clip,
      id: `${clip.id}-split-${Date.now()}`,
      startFrame: clip.startFrame + midPoint,
      trimStart: clip.trimStart + midPoint,
      durationFrames: clip.trimEnd - (clip.trimStart + midPoint)
    };
    const newClips = [...clips];
    newClips.splice(index, 1, firstClip, secondClip);
    setClips(newClips);
  };
  const handleUpdateClipEffect = (property, value) => {
    if (selectedClipIndex === null) return;
    const newClips = [...clips];
    if (!newClips[selectedClipIndex].effects) {
      newClips[selectedClipIndex].effects = {};
    }
    newClips[selectedClipIndex].effects[property] = value;
    setClips(newClips);
    setSelectedClip(newClips[selectedClipIndex]);
  };
  const handleUpdateClipText = (property, value) => {
    if (selectedClipIndex === null) return;
    const newClips = [...clips];
    if (!newClips[selectedClipIndex].text) {
      newClips[selectedClipIndex].text = {};
    }
    newClips[selectedClipIndex].text[property] = value;
    setClips(newClips);
    setSelectedClip(newClips[selectedClipIndex]);
  };
  const handleUpdateClipTransition = (value) => {
    if (selectedClipIndex === null) return;
    const newClips = [...clips];
    newClips[selectedClipIndex].transition = value;
    setClips(newClips);
    setSelectedClip(newClips[selectedClipIndex]);
  };
  const handleTrimClip = (start, end) => {
    if (selectedClipIndex === null) return;
    const newClips = [...clips];
    newClips[selectedClipIndex].trimStart = start;
    newClips[selectedClipIndex].trimEnd = end;
    newClips[selectedClipIndex].durationFrames = end - start;
    setClips(newClips);
    setSelectedClip(newClips[selectedClipIndex]);
  };
  const handleExportVideo = async () => {
    alert("Export functionality: This would render your composition to a final video file. In a production environment, this would use Remotion's server-side rendering API.");
  };
  const totalDuration = clips.reduce((acc, clip) => {
    return Math.max(acc, (clip.startFrame || 0) + (clip.durationFrames || 90));
  }, 90);
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("div", { className: "header", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "header-left", children: [
        /* @__PURE__ */ jsxDEV("button", { className: "mobile-toggle", onClick: () => setSidebarOpen(!sidebarOpen), children: "\u2630" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 209,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "logo", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "logo-icon", children: "\u{1F3AC}" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 213,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("span", { children: "Websim Clips" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 214,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 212,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 208,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "header-actions", children: [
        /* @__PURE__ */ jsxDEV("button", { className: "btn", onClick: () => setShowGallery(true), children: [
          "\u{1F4DA} ",
          /* @__PURE__ */ jsxDEV("span", { children: "Gallery" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 219,
            columnNumber: 16
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 218,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("label", { className: `btn btn-primary ${uploading ? "disabled" : ""}`, children: [
          uploading ? "\u23F3" : "\u2B06\uFE0F",
          " ",
          /* @__PURE__ */ jsxDEV("span", { children: uploading ? "Uploading..." : "Upload" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 222,
            columnNumber: 38
          }),
          /* @__PURE__ */ jsxDEV("input", { type: "file", accept: "video/*", onChange: handleFileUpload, disabled: uploading }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 223,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 221,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "btn btn-primary", onClick: handleExportVideo, disabled: clips.length === 0, children: [
          "\u{1F4BE} ",
          /* @__PURE__ */ jsxDEV("span", { children: "Export" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 226,
            columnNumber: 16
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 225,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "mobile-toggle", onClick: () => setPropertiesOpen(!propertiesOpen), children: "\u2699\uFE0F" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 228,
          columnNumber: 11
        }),
        currentUser && /* @__PURE__ */ jsxDEV(
          "img",
          {
            src: `https://images.websim.com/avatar/${currentUser.username}`,
            alt: currentUser.username,
            className: "user-avatar"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 232,
            columnNumber: 13
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 217,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 207,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "main-container", children: [
      /* @__PURE__ */ jsxDEV("div", { className: `sidebar ${sidebarOpen ? "open" : ""}`, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "sidebar-section", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "sidebar-title", children: "Video Library" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 244,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "gallery-grid", children: videoClips.slice(0).reverse().slice(0, 6).map((clip) => /* @__PURE__ */ jsxDEV(
            "div",
            {
              className: "gallery-item",
              onClick: () => {
                handleAddToTimeline(clip);
                setSidebarOpen(false);
              },
              children: [
                /* @__PURE__ */ jsxDEV("video", { src: clip.url }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 255,
                  columnNumber: 19
                }),
                /* @__PURE__ */ jsxDEV("div", { className: "gallery-item-overlay", children: clip.name }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 256,
                  columnNumber: 19
                })
              ]
            },
            clip.id,
            true,
            {
              fileName: "<stdin>",
              lineNumber: 247,
              columnNumber: 17
            }
          )) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 245,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 243,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "sidebar-section", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "sidebar-title", children: "Assets" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 263,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("label", { className: "upload-area", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "upload-icon", children: "\u{1F3B5}" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 265,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "upload-text", children: uploading ? "Uploading..." : "Add Audio" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 266,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("input", { type: "file", accept: "audio/*", onChange: handleAudioUpload, disabled: uploading }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 267,
              columnNumber: 15
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 264,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 262,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 242,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "editor-container", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "preview-area", children: clips.length > 0 ? /* @__PURE__ */ jsxDEV("div", { className: "player-wrapper", children: /* @__PURE__ */ jsxDEV(
          Player,
          {
            component: EditorComposition,
            durationInFrames: totalDuration,
            fps: 30,
            compositionWidth: 540,
            compositionHeight: 960,
            loop: true,
            controls: true,
            inputProps: { clips, audioClips },
            style: { width: "100%", height: "100%" }
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 276,
            columnNumber: 17
          }
        ) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 275,
          columnNumber: 15
        }) : /* @__PURE__ */ jsxDEV("div", { className: "empty-state", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "empty-state-icon", children: "\u{1F3AC}" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 290,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "empty-state-text", children: "Upload a video or select from the gallery to get started" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 291,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 289,
          columnNumber: 15
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 273,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "timeline-container", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "timeline-header", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "timeline-title", children: "Timeline" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 300,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.75rem", color: "#666" }, children: [
              Math.round(totalDuration / 30),
              "s"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 301,
              columnNumber: 15
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 299,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "timeline-tracks", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "track", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "track-header", children: /* @__PURE__ */ jsxDEV("div", { className: "track-label", children: "Video Track" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 309,
                columnNumber: 19
              }) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 308,
                columnNumber: 17
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "track-clips", children: clips.length === 0 ? /* @__PURE__ */ jsxDEV("div", { style: { color: "#666", fontSize: "0.75rem" }, children: "No clips yet" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 313,
                columnNumber: 21
              }) : clips.map((clip, index) => /* @__PURE__ */ jsxDEV(
                "div",
                {
                  className: "clip",
                  style: {
                    minWidth: `${(clip.durationFrames || 90) / 30 * 30}px`,
                    border: selectedClipIndex === index ? "2px solid #fff" : "none"
                  },
                  onClick: () => {
                    setSelectedClip(clip);
                    setSelectedClipIndex(index);
                    setPropertiesOpen(true);
                  },
                  children: clip.name?.substring(0, 12) || `Clip ${index + 1}`
                },
                index,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 318,
                  columnNumber: 23
                }
              )) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 311,
                columnNumber: 17
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 307,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "track", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "track-header", children: /* @__PURE__ */ jsxDEV("div", { className: "track-label", children: "Audio Track" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 340,
                columnNumber: 19
              }) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 339,
                columnNumber: 17
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "track-clips", children: audioClips.length === 0 ? /* @__PURE__ */ jsxDEV("div", { style: { color: "#666", fontSize: "0.75rem" }, children: "No audio clips" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 344,
                columnNumber: 21
              }) : audioClips.map((clip, index) => /* @__PURE__ */ jsxDEV(
                "div",
                {
                  className: "clip",
                  style: {
                    minWidth: `${(clip.durationFrames || 90) / 30 * 30}px`,
                    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                  },
                  onClick: () => {
                    setSelectedClip(clip);
                    setSelectedClipIndex(null);
                    setPropertiesOpen(true);
                  },
                  onDoubleClick: () => setAudioClips(audioClips.filter((_, i) => i !== index)),
                  children: clip.name?.substring(0, 12) || `Audio ${index + 1}`
                },
                index,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 349,
                  columnNumber: 23
                }
              )) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 342,
                columnNumber: 17
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 338,
              columnNumber: 15
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 306,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 298,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 272,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `properties-panel ${propertiesOpen ? "open" : ""}`, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "sidebar-title", children: "Editing Tools" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 374,
          columnNumber: 11
        }),
        selectedClip ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
          /* @__PURE__ */ jsxDEV("div", { className: "tabs-container", children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: `tab-btn ${activeTab === "effects" ? "active" : ""}`,
                onClick: () => setActiveTab("effects"),
                children: "Effects"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 378,
                columnNumber: 17
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: `tab-btn ${activeTab === "text" ? "active" : ""}`,
                onClick: () => setActiveTab("text"),
                children: "Text"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 384,
                columnNumber: 17
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: `tab-btn ${activeTab === "transitions" ? "active" : ""}`,
                onClick: () => setActiveTab("transitions"),
                children: "Transitions"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 390,
                columnNumber: 17
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: `tab-btn ${activeTab === "trim" ? "active" : ""}`,
                onClick: () => setActiveTab("trim"),
                children: "Trim"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 396,
                columnNumber: 17
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 377,
            columnNumber: 15
          }),
          activeTab === "effects" && /* @__PURE__ */ jsxDEV(Fragment, { children: [
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Opacity" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 407,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "range",
                  className: "slider",
                  min: "0",
                  max: "100",
                  value: (selectedClip.effects?.opacity || 1) * 100,
                  onChange: (e) => handleUpdateClipEffect("opacity", e.target.value / 100)
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 408,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: [
                Math.round((selectedClip.effects?.opacity || 1) * 100),
                "%"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 416,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 406,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Volume" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 419,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "range",
                  className: "slider",
                  min: "0",
                  max: "100",
                  value: (selectedClip.effects?.volume || 1) * 100,
                  onChange: (e) => handleUpdateClipEffect("volume", e.target.value / 100)
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 420,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: [
                Math.round((selectedClip.effects?.volume || 1) * 100),
                "%"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 428,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 418,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Speed" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 431,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "range",
                  className: "slider",
                  min: "25",
                  max: "200",
                  value: (selectedClip.effects?.speed || 1) * 100,
                  onChange: (e) => handleUpdateClipEffect("speed", e.target.value / 100)
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 432,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: [
                ((selectedClip.effects?.speed || 1) * 100).toFixed(0),
                "%"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 440,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 430,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Blur" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 443,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "range",
                  className: "slider",
                  min: "0",
                  max: "20",
                  value: selectedClip.effects?.blur || 0,
                  onChange: (e) => handleUpdateClipEffect("blur", parseFloat(e.target.value))
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 444,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: [
                selectedClip.effects?.blur || 0,
                "px"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 452,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 442,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Brightness" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 455,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "range",
                  className: "slider",
                  min: "0",
                  max: "200",
                  value: (selectedClip.effects?.brightness || 1) * 100,
                  onChange: (e) => handleUpdateClipEffect("brightness", e.target.value / 100)
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 456,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: [
                Math.round((selectedClip.effects?.brightness || 1) * 100),
                "%"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 464,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 454,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Saturation" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 467,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "range",
                  className: "slider",
                  min: "0",
                  max: "200",
                  value: (selectedClip.effects?.saturation || 1) * 100,
                  onChange: (e) => handleUpdateClipEffect("saturation", e.target.value / 100)
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 468,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: [
                Math.round((selectedClip.effects?.saturation || 1) * 100),
                "%"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 476,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 466,
              columnNumber: 19
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 405,
            columnNumber: 17
          }),
          activeTab === "text" && /* @__PURE__ */ jsxDEV(Fragment, { children: [
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Text Content" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 484,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "text",
                  className: "property-input",
                  placeholder: "Enter text...",
                  value: selectedClip.text?.content || "",
                  onChange: (e) => handleUpdateClipText("content", e.target.value)
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 485,
                  columnNumber: 21
                }
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 483,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Font Size" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 494,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "range",
                  className: "slider",
                  min: "24",
                  max: "120",
                  value: selectedClip.text?.fontSize || 48,
                  onChange: (e) => handleUpdateClipText("fontSize", parseInt(e.target.value))
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 495,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: [
                selectedClip.text?.fontSize || 48,
                "px"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 503,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 493,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Text Color" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 506,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "color",
                  className: "property-input",
                  value: selectedClip.text?.color || "#ffffff",
                  onChange: (e) => handleUpdateClipText("color", e.target.value)
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 507,
                  columnNumber: 21
                }
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 505,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Position" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 515,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV(
                "select",
                {
                  className: "property-input",
                  value: selectedClip.text?.position || "center",
                  onChange: (e) => handleUpdateClipText("position", e.target.value),
                  children: [
                    /* @__PURE__ */ jsxDEV("option", { value: "top", children: "Top" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 521,
                      columnNumber: 23
                    }),
                    /* @__PURE__ */ jsxDEV("option", { value: "center", children: "Center" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 522,
                      columnNumber: 23
                    }),
                    /* @__PURE__ */ jsxDEV("option", { value: "bottom", children: "Bottom" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 523,
                      columnNumber: 23
                    })
                  ]
                },
                void 0,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 516,
                  columnNumber: 21
                }
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 514,
              columnNumber: 19
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 482,
            columnNumber: 17
          }),
          activeTab === "transitions" && /* @__PURE__ */ jsxDEV(Fragment, { children: [
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Transition Type" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 532,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV(
                "select",
                {
                  className: "property-input",
                  value: selectedClip.transition || "none",
                  onChange: (e) => handleUpdateClipTransition(e.target.value),
                  children: [
                    /* @__PURE__ */ jsxDEV("option", { value: "none", children: "None" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 538,
                      columnNumber: 23
                    }),
                    /* @__PURE__ */ jsxDEV("option", { value: "fade", children: "Fade" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 539,
                      columnNumber: 23
                    }),
                    /* @__PURE__ */ jsxDEV("option", { value: "slide", children: "Slide" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 540,
                      columnNumber: 23
                    }),
                    /* @__PURE__ */ jsxDEV("option", { value: "wipe", children: "Wipe" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 541,
                      columnNumber: 23
                    }),
                    /* @__PURE__ */ jsxDEV("option", { value: "zoom", children: "Zoom" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 542,
                      columnNumber: 23
                    })
                  ]
                },
                void 0,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 533,
                  columnNumber: 21
                }
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 531,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "info-box", children: /* @__PURE__ */ jsxDEV("p", { children: "Transitions are applied at the start of each clip" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 546,
              columnNumber: 21
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 545,
              columnNumber: 19
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 530,
            columnNumber: 17
          }),
          activeTab === "trim" && /* @__PURE__ */ jsxDEV(Fragment, { children: [
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Trim Start (frames)" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 554,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "range",
                  className: "slider",
                  min: "0",
                  max: selectedClip.durationFrames || 90,
                  value: selectedClip.trimStart || 0,
                  onChange: (e) => handleTrimClip(parseInt(e.target.value), selectedClip.trimEnd || selectedClip.durationFrames)
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 555,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: selectedClip.trimStart || 0 }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 563,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 553,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Trim End (frames)" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 566,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "range",
                  className: "slider",
                  min: selectedClip.trimStart || 0,
                  max: selectedClip.durationFrames || 90,
                  value: selectedClip.trimEnd || selectedClip.durationFrames,
                  onChange: (e) => handleTrimClip(selectedClip.trimStart || 0, parseInt(e.target.value))
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 567,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: selectedClip.trimEnd || selectedClip.durationFrames }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 575,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 565,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "info-box", children: /* @__PURE__ */ jsxDEV("p", { children: [
              "Current duration: ",
              Math.round((selectedClip.trimEnd - selectedClip.trimStart) / 30 * 10) / 10,
              "s"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 578,
              columnNumber: 21
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 577,
              columnNumber: 19
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 552,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "property-group", style: { marginTop: "1.5rem" }, children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "btn",
                style: { width: "100%" },
                onClick: () => handleSplitClip(selectedClipIndex),
                disabled: selectedClipIndex === null,
                children: "\u2702\uFE0F Split Clip"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 584,
                columnNumber: 17
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "btn",
                style: { width: "100%", marginTop: "0.5rem", background: "#dc2626" },
                onClick: () => handleRemoveClip(selectedClipIndex),
                disabled: selectedClipIndex === null,
                children: "\u{1F5D1}\uFE0F Delete Clip"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 592,
                columnNumber: 17
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 583,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 376,
          columnNumber: 13
        }) : /* @__PURE__ */ jsxDEV("div", { className: "empty-state", children: /* @__PURE__ */ jsxDEV("div", { className: "empty-state-text", children: "Select a clip to edit" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 604,
          columnNumber: 15
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 603,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "sidebar-section", style: { marginTop: "1.5rem" }, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "sidebar-title", children: "Composition Info" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 611,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "info-box", children: [
            /* @__PURE__ */ jsxDEV("p", { children: [
              "Total Clips: ",
              clips.length
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 613,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("p", { children: [
              "Duration: ",
              Math.round(totalDuration / 30),
              "s"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 614,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("p", { children: "Resolution: 540x960" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 615,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("p", { children: "FPS: 30" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 616,
              columnNumber: 15
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 612,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 610,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 373,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 241,
      columnNumber: 7
    }),
    showGallery && /* @__PURE__ */ jsxDEV("div", { className: "modal", onClick: () => setShowGallery(false), children: /* @__PURE__ */ jsxDEV("div", { className: "modal-content", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxDEV("div", { className: "modal-header", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "modal-title", children: "Community Gallery" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 626,
          columnNumber: 15
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "close-btn", onClick: () => setShowGallery(false), children: "\xD7" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 627,
          columnNumber: 15
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 625,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "gallery-grid", children: videoClips.slice(0).reverse().map((clip) => /* @__PURE__ */ jsxDEV(
        "div",
        {
          className: "gallery-item",
          onClick: () => handleAddToTimeline(clip),
          children: [
            /* @__PURE__ */ jsxDEV("video", { src: clip.url }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 638,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "gallery-item-overlay", children: [
              clip.name,
              /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 641,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("small", { children: [
                "by ",
                clip.username
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 642,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 639,
              columnNumber: 19
            })
          ]
        },
        clip.id,
        true,
        {
          fileName: "<stdin>",
          lineNumber: 633,
          columnNumber: 17
        }
      )) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 631,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 624,
      columnNumber: 11
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 623,
      columnNumber: 9
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 206,
    columnNumber: 5
  });
};
createRoot(document.getElementById("app")).render(/* @__PURE__ */ jsxDEV(App, {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 654,
  columnNumber: 51
}));
