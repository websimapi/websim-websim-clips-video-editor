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
  const [clipboardClip, setClipboardClip] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
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
  const handleDuplicateClip = (index) => {
    const clip = clips[index];
    const currentEndFrame = clips.reduce((max, c) => Math.max(max, (c.startFrame || 0) + (c.durationFrames || 90)), 0);
    const duplicatedClip = {
      ...clip,
      id: `${clip.id}-dup-${Date.now()}`,
      startFrame: currentEndFrame
    };
    setClips([...clips, duplicatedClip]);
  };
  const handleCopyClip = (index) => {
    setClipboardClip(clips[index]);
  };
  const handlePasteClip = () => {
    if (!clipboardClip) return;
    const currentEndFrame = clips.reduce((max, c) => Math.max(max, (c.startFrame || 0) + (c.durationFrames || 90)), 0);
    const pastedClip = {
      ...clipboardClip,
      id: `${clipboardClip.id}-paste-${Date.now()}`,
      startFrame: currentEndFrame
    };
    setClips([...clips, pastedClip]);
  };
  const handleMoveClipLeft = (index) => {
    if (index === 0) return;
    const newClips = [...clips];
    [newClips[index - 1], newClips[index]] = [newClips[index], newClips[index - 1]];
    let currentFrame = 0;
    newClips.forEach((clip) => {
      clip.startFrame = currentFrame;
      currentFrame += clip.durationFrames || 90;
    });
    setClips(newClips);
    setSelectedClipIndex(index - 1);
  };
  const handleMoveClipRight = (index) => {
    if (index === clips.length - 1) return;
    const newClips = [...clips];
    [newClips[index], newClips[index + 1]] = [newClips[index + 1], newClips[index]];
    let currentFrame = 0;
    newClips.forEach((clip) => {
      clip.startFrame = currentFrame;
      currentFrame += clip.durationFrames || 90;
    });
    setClips(newClips);
    setSelectedClipIndex(index + 1);
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
    if (clips.length === 0) {
      alert("Please add clips to your timeline before exporting.");
      return;
    }
    try {
      setExporting(true);
      setExportProgress(0);
      const compositionId = `export-${Date.now()}`;
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      const canvas = document.createElement("canvas");
      canvas.width = 540;
      canvas.height = 960;
      const ctx = canvas.getContext("2d");
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
        videoBitsPerSecond: 5e6
      });
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        clearInterval(progressInterval);
        setExportProgress(100);
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `websim-clips-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => {
          URL.revokeObjectURL(url);
          setExporting(false);
          setExportProgress(0);
        }, 100);
      };
      mediaRecorder.start();
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";
      ctx.font = "32px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Websim Clips Export", canvas.width / 2, canvas.height / 2 - 40);
      ctx.font = "18px Arial";
      ctx.fillText(`${clips.length} clips \u2022 ${Math.round(totalDuration / 30)}s`, canvas.width / 2, canvas.height / 2);
      ctx.fillText("Click to view your composition", canvas.width / 2, canvas.height / 2 + 40);
      setTimeout(() => {
        mediaRecorder.stop();
      }, Math.min(totalDuration / 30 * 1e3, 1e4));
    } catch (error) {
      console.error("Export error:", error);
      alert("Export failed. In production, this would use Remotion server-side rendering. For now, try using screen recording software to capture your composition.");
      setExporting(false);
      setExportProgress(0);
    }
  };
  const totalDuration = clips.reduce((acc, clip) => {
    return Math.max(acc, (clip.startFrame || 0) + (clip.durationFrames || 90));
  }, 90);
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("div", { className: "header", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "header-left", children: [
        /* @__PURE__ */ jsxDEV("button", { className: "mobile-toggle", onClick: () => setSidebarOpen(!sidebarOpen), children: "\u2630" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 359,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "logo", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "logo-icon", children: "\u{1F3AC}" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 363,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("span", { children: "Websim Clips" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 364,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 362,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 358,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "header-actions", children: [
        /* @__PURE__ */ jsxDEV("button", { className: "btn", onClick: () => setShowGallery(true), children: [
          "\u{1F4DA} ",
          /* @__PURE__ */ jsxDEV("span", { children: "Gallery" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 369,
            columnNumber: 16
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 368,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("label", { className: `btn btn-primary ${uploading ? "disabled" : ""}`, children: [
          uploading ? "\u23F3" : "\u2B06\uFE0F",
          " ",
          /* @__PURE__ */ jsxDEV("span", { children: uploading ? "Uploading..." : "Upload" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 372,
            columnNumber: 38
          }),
          /* @__PURE__ */ jsxDEV("input", { type: "file", accept: "video/*", onChange: handleFileUpload, disabled: uploading }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 373,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 371,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            className: `btn btn-primary ${exporting ? "disabled" : ""}`,
            onClick: handleExportVideo,
            disabled: clips.length === 0 || exporting,
            children: [
              exporting ? `${exportProgress}%` : "\u{1F4BE}",
              " ",
              /* @__PURE__ */ jsxDEV("span", { children: exporting ? "Exporting..." : "Export" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 380,
                columnNumber: 55
              })
            ]
          },
          void 0,
          true,
          {
            fileName: "<stdin>",
            lineNumber: 375,
            columnNumber: 11
          }
        ),
        /* @__PURE__ */ jsxDEV("button", { className: "mobile-toggle", onClick: () => setPropertiesOpen(!propertiesOpen), children: "\u2699\uFE0F" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 382,
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
            lineNumber: 386,
            columnNumber: 13
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 367,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 357,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "main-container", children: [
      /* @__PURE__ */ jsxDEV("div", { className: `sidebar ${sidebarOpen ? "open" : ""}`, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "sidebar-section", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "sidebar-title", children: "Video Library" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 398,
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
                  lineNumber: 409,
                  columnNumber: 19
                }),
                /* @__PURE__ */ jsxDEV("div", { className: "gallery-item-overlay", children: clip.name }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 410,
                  columnNumber: 19
                })
              ]
            },
            clip.id,
            true,
            {
              fileName: "<stdin>",
              lineNumber: 401,
              columnNumber: 17
            }
          )) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 399,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 397,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "sidebar-section", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "sidebar-title", children: "Assets" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 417,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("label", { className: "upload-area", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "upload-icon", children: "\u{1F3B5}" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 419,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "upload-text", children: uploading ? "Uploading..." : "Add Audio" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 420,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("input", { type: "file", accept: "audio/*", onChange: handleAudioUpload, disabled: uploading }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 421,
              columnNumber: 15
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 418,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 416,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 396,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "editor-container", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "toolbar", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "toolbar-group", children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "toolbar-btn",
                onClick: handlePasteClip,
                disabled: !clipboardClip,
                title: "Paste Clip",
                children: "\u{1F4CB} Paste"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 429,
                columnNumber: 15
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "toolbar-btn",
                onClick: () => setClips([]),
                disabled: clips.length === 0,
                title: "Clear Timeline",
                children: "\u{1F5D1}\uFE0F Clear All"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 437,
                columnNumber: 15
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 428,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "toolbar-group", children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "toolbar-btn",
                onClick: () => handleDuplicateClip(selectedClipIndex),
                disabled: selectedClipIndex === null,
                title: "Duplicate Selected Clip",
                children: "\u{1F4D1} Duplicate"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 447,
                columnNumber: 15
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "toolbar-btn",
                onClick: () => handleSplitClip(selectedClipIndex),
                disabled: selectedClipIndex === null,
                title: "Split at Playhead",
                children: "\u2702\uFE0F Split"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 455,
                columnNumber: 15
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 446,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "toolbar-group", children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "toolbar-btn",
                onClick: () => handleMoveClipLeft(selectedClipIndex),
                disabled: selectedClipIndex === null || selectedClipIndex === 0,
                title: "Move Left",
                children: "\u2B05\uFE0F"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 465,
                columnNumber: 15
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "toolbar-btn",
                onClick: () => handleMoveClipRight(selectedClipIndex),
                disabled: selectedClipIndex === null || selectedClipIndex === clips.length - 1,
                title: "Move Right",
                children: "\u27A1\uFE0F"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 473,
                columnNumber: 15
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 464,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 427,
          columnNumber: 11
        }),
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
            lineNumber: 487,
            columnNumber: 17
          }
        ) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 486,
          columnNumber: 15
        }) : /* @__PURE__ */ jsxDEV("div", { className: "empty-state", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "empty-state-icon", children: "\u{1F3AC}" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 501,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "empty-state-text", children: "Upload a video or select from the gallery to get started" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 502,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 500,
          columnNumber: 15
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 484,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "timeline-container", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "timeline-header", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "timeline-title", children: "Timeline" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 511,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.75rem", color: "#666" }, children: [
              clips.length,
              " clips \u2022 ",
              Math.round(totalDuration / 30),
              "s"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 512,
              columnNumber: 15
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 510,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "timeline-tracks", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "track", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "track-header", children: /* @__PURE__ */ jsxDEV("div", { className: "track-label", children: "\u{1F3AC} Video" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 520,
                columnNumber: 19
              }) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 519,
                columnNumber: 17
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "track-clips", children: clips.length === 0 ? /* @__PURE__ */ jsxDEV("div", { style: { color: "#666", fontSize: "0.75rem", padding: "1rem" }, children: "Drop video clips here" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 524,
                columnNumber: 21
              }) : clips.map((clip, index) => /* @__PURE__ */ jsxDEV(
                "div",
                {
                  className: `clip ${selectedClipIndex === index ? "selected" : ""}`,
                  style: {
                    minWidth: `${Math.max(100, (clip.durationFrames || 90) / 30 * 40)}px`
                  },
                  onClick: () => {
                    setSelectedClip(clip);
                    setSelectedClipIndex(index);
                    if (window.innerWidth <= 1024) {
                      setPropertiesOpen(true);
                    }
                  },
                  children: [
                    /* @__PURE__ */ jsxDEV("div", { className: "clip-actions", children: [
                      /* @__PURE__ */ jsxDEV(
                        "button",
                        {
                          className: "clip-action-btn",
                          onClick: (e) => {
                            e.stopPropagation();
                            handleCopyClip(index);
                          },
                          title: "Copy",
                          children: "\u{1F4CB}"
                        },
                        void 0,
                        false,
                        {
                          fileName: "<stdin>",
                          lineNumber: 544,
                          columnNumber: 27
                        }
                      ),
                      /* @__PURE__ */ jsxDEV(
                        "button",
                        {
                          className: "clip-action-btn",
                          onClick: (e) => {
                            e.stopPropagation();
                            handleDuplicateClip(index);
                          },
                          title: "Duplicate",
                          children: "\u{1F4D1}"
                        },
                        void 0,
                        false,
                        {
                          fileName: "<stdin>",
                          lineNumber: 554,
                          columnNumber: 27
                        }
                      ),
                      /* @__PURE__ */ jsxDEV(
                        "button",
                        {
                          className: "clip-action-btn danger",
                          onClick: (e) => {
                            e.stopPropagation();
                            handleRemoveClip(index);
                          },
                          title: "Delete",
                          children: "\u{1F5D1}\uFE0F"
                        },
                        void 0,
                        false,
                        {
                          fileName: "<stdin>",
                          lineNumber: 564,
                          columnNumber: 27
                        }
                      )
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 543,
                      columnNumber: 25
                    }),
                    /* @__PURE__ */ jsxDEV("div", { className: "clip-name", children: clip.name?.substring(0, 15) || `Clip ${index + 1}` }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 575,
                      columnNumber: 25
                    }),
                    /* @__PURE__ */ jsxDEV("div", { className: "clip-duration", children: [
                      Math.round((clip.durationFrames || 90) / 30 * 10) / 10,
                      "s"
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 578,
                      columnNumber: 25
                    })
                  ]
                },
                index,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 529,
                  columnNumber: 23
                }
              )) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 522,
                columnNumber: 17
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 518,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "track", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "track-header", children: /* @__PURE__ */ jsxDEV("div", { className: "track-label", children: "\u{1F3B5} Audio" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 589,
                columnNumber: 19
              }) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 588,
                columnNumber: 17
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "track-clips", children: audioClips.length === 0 ? /* @__PURE__ */ jsxDEV("div", { style: { color: "#666", fontSize: "0.75rem", padding: "1rem" }, children: "No audio clips" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 593,
                columnNumber: 21
              }) : audioClips.map((clip, index) => /* @__PURE__ */ jsxDEV(
                "div",
                {
                  className: "clip",
                  style: {
                    minWidth: `${Math.max(100, (clip.durationFrames || 90) / 30 * 40)}px`,
                    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                  },
                  onClick: () => {
                    setSelectedClip(clip);
                    setSelectedClipIndex(null);
                    if (window.innerWidth <= 1024) {
                      setPropertiesOpen(true);
                    }
                  },
                  children: [
                    /* @__PURE__ */ jsxDEV("div", { className: "clip-actions", children: /* @__PURE__ */ jsxDEV(
                      "button",
                      {
                        className: "clip-action-btn danger",
                        onClick: (e) => {
                          e.stopPropagation();
                          setAudioClips(audioClips.filter((_, i) => i !== index));
                        },
                        title: "Delete",
                        children: "\u{1F5D1}\uFE0F"
                      },
                      void 0,
                      false,
                      {
                        fileName: "<stdin>",
                        lineNumber: 614,
                        columnNumber: 27
                      }
                    ) }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 613,
                      columnNumber: 25
                    }),
                    /* @__PURE__ */ jsxDEV("div", { className: "clip-name", children: clip.name?.substring(0, 15) || `Audio ${index + 1}` }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 625,
                      columnNumber: 25
                    }),
                    /* @__PURE__ */ jsxDEV("div", { className: "clip-duration", children: [
                      Math.round((clip.durationFrames || 90) / 30 * 10) / 10,
                      "s"
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 628,
                      columnNumber: 25
                    })
                  ]
                },
                index,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 598,
                  columnNumber: 23
                }
              )) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 591,
                columnNumber: 17
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 587,
              columnNumber: 15
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 517,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 509,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 426,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `properties-panel ${propertiesOpen ? "open" : ""}`, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "sidebar-title", children: "Properties" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 641,
          columnNumber: 11
        }),
        selectedClip ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
          /* @__PURE__ */ jsxDEV("div", { className: "info-box", style: { marginBottom: "1rem" }, children: [
            /* @__PURE__ */ jsxDEV("p", { children: /* @__PURE__ */ jsxDEV("strong", { children: selectedClip.name || "Unnamed Clip" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 645,
              columnNumber: 20
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 645,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("p", { children: [
              "Duration: ",
              Math.round((selectedClip.durationFrames || 90) / 30 * 10) / 10,
              "s"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 646,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("p", { children: [
              "Type: ",
              selectedClip.type || "video"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 647,
              columnNumber: 17
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 644,
            columnNumber: 15
          }),
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
                lineNumber: 651,
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
                lineNumber: 657,
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
                lineNumber: 663,
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
                lineNumber: 669,
                columnNumber: 17
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 650,
            columnNumber: 15
          }),
          activeTab === "effects" && /* @__PURE__ */ jsxDEV(Fragment, { children: [
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Opacity" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 680,
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
                  lineNumber: 681,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: [
                Math.round((selectedClip.effects?.opacity || 1) * 100),
                "%"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 689,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 679,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Volume" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 692,
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
                  lineNumber: 693,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: [
                Math.round((selectedClip.effects?.volume || 1) * 100),
                "%"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 701,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 691,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Speed" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 704,
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
                  lineNumber: 705,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: [
                ((selectedClip.effects?.speed || 1) * 100).toFixed(0),
                "%"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 713,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 703,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Blur" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 716,
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
                  lineNumber: 717,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: [
                selectedClip.effects?.blur || 0,
                "px"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 725,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 715,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Brightness" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 728,
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
                  lineNumber: 729,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: [
                Math.round((selectedClip.effects?.brightness || 1) * 100),
                "%"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 737,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 727,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Saturation" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 740,
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
                  lineNumber: 741,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: [
                Math.round((selectedClip.effects?.saturation || 1) * 100),
                "%"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 749,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 739,
              columnNumber: 19
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 678,
            columnNumber: 17
          }),
          activeTab === "text" && /* @__PURE__ */ jsxDEV(Fragment, { children: [
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Text Content" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 757,
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
                  lineNumber: 758,
                  columnNumber: 21
                }
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 756,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Font Size" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 767,
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
                  lineNumber: 768,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: [
                selectedClip.text?.fontSize || 48,
                "px"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 776,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 766,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Text Color" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 779,
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
                  lineNumber: 780,
                  columnNumber: 21
                }
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 778,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Position" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 788,
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
                      lineNumber: 794,
                      columnNumber: 23
                    }),
                    /* @__PURE__ */ jsxDEV("option", { value: "center", children: "Center" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 795,
                      columnNumber: 23
                    }),
                    /* @__PURE__ */ jsxDEV("option", { value: "bottom", children: "Bottom" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 796,
                      columnNumber: 23
                    })
                  ]
                },
                void 0,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 789,
                  columnNumber: 21
                }
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 787,
              columnNumber: 19
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 755,
            columnNumber: 17
          }),
          activeTab === "transitions" && /* @__PURE__ */ jsxDEV(Fragment, { children: [
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Transition Type" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 805,
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
                      lineNumber: 811,
                      columnNumber: 23
                    }),
                    /* @__PURE__ */ jsxDEV("option", { value: "fade", children: "Fade" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 812,
                      columnNumber: 23
                    }),
                    /* @__PURE__ */ jsxDEV("option", { value: "slide", children: "Slide" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 813,
                      columnNumber: 23
                    }),
                    /* @__PURE__ */ jsxDEV("option", { value: "wipe", children: "Wipe" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 814,
                      columnNumber: 23
                    }),
                    /* @__PURE__ */ jsxDEV("option", { value: "zoom", children: "Zoom" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 815,
                      columnNumber: 23
                    })
                  ]
                },
                void 0,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 806,
                  columnNumber: 21
                }
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 804,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "info-box", children: /* @__PURE__ */ jsxDEV("p", { children: "Transitions are applied at the start of each clip" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 819,
              columnNumber: 21
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 818,
              columnNumber: 19
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 803,
            columnNumber: 17
          }),
          activeTab === "trim" && /* @__PURE__ */ jsxDEV(Fragment, { children: [
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Trim Start (frames)" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 827,
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
                  lineNumber: 828,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: selectedClip.trimStart || 0 }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 836,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 826,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Trim End (frames)" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 839,
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
                  lineNumber: 840,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: selectedClip.trimEnd || selectedClip.durationFrames }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 848,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 838,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "info-box", children: /* @__PURE__ */ jsxDEV("p", { children: [
              "Current duration: ",
              Math.round((selectedClip.trimEnd - selectedClip.trimStart) / 30 * 10) / 10,
              "s"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 851,
              columnNumber: 21
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 850,
              columnNumber: 19
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 825,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "property-group", style: { marginTop: "1.5rem" }, children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "btn",
                style: { width: "100%" },
                onClick: () => handleDuplicateClip(selectedClipIndex),
                disabled: selectedClipIndex === null,
                children: "\u{1F4D1} Duplicate Clip"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 857,
                columnNumber: 17
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "btn",
                style: { width: "100%", marginTop: "0.5rem" },
                onClick: () => handleSplitClip(selectedClipIndex),
                disabled: selectedClipIndex === null,
                children: "\u2702\uFE0F Split Clip"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 865,
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
                lineNumber: 873,
                columnNumber: 17
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 856,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 643,
          columnNumber: 13
        }) : /* @__PURE__ */ jsxDEV("div", { className: "empty-state", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "empty-state-icon", children: "\u{1F3AC}" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 885,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "empty-state-text", children: "Select a clip to edit its properties" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 886,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 884,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "sidebar-section", style: { marginTop: "1.5rem" }, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "sidebar-title", children: "Composition Info" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 893,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "info-box", children: [
            /* @__PURE__ */ jsxDEV("p", { children: [
              "Total Clips: ",
              clips.length
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 895,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("p", { children: [
              "Duration: ",
              Math.round(totalDuration / 30),
              "s"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 896,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("p", { children: "Resolution: 540x960" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 897,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("p", { children: "FPS: 30" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 898,
              columnNumber: 15
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 894,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 892,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 640,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 395,
      columnNumber: 7
    }),
    showGallery && /* @__PURE__ */ jsxDEV("div", { className: "modal", onClick: () => setShowGallery(false), children: /* @__PURE__ */ jsxDEV("div", { className: "modal-content", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxDEV("div", { className: "modal-header", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "modal-title", children: "Community Gallery" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 908,
          columnNumber: 15
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "close-btn", onClick: () => setShowGallery(false), children: "\xD7" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 909,
          columnNumber: 15
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 907,
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
              lineNumber: 920,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "gallery-item-overlay", children: [
              clip.name,
              /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 923,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("small", { children: [
                "by ",
                clip.username
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 924,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 921,
              columnNumber: 19
            })
          ]
        },
        clip.id,
        true,
        {
          fileName: "<stdin>",
          lineNumber: 915,
          columnNumber: 17
        }
      )) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 913,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 906,
      columnNumber: 11
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 905,
      columnNumber: 9
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 356,
    columnNumber: 5
  });
};
createRoot(document.getElementById("app")).render(/* @__PURE__ */ jsxDEV(App, {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 936,
  columnNumber: 51
}));
