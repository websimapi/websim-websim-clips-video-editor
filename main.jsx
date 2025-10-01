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
  const [showGallery, setShowGallery] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
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
      setClips([...clips, { ...clip, startFrame: currentEndFrame }]);
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
        startFrame: 0
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
      startFrame: currentEndFrame
    };
    setClips([...clips, newClip]);
    setShowGallery(false);
  };
  const handleRemoveClip = (index) => {
    setClips(clips.filter((_, i) => i !== index));
  };
  const totalDuration = clips.reduce((acc, clip) => {
    return Math.max(acc, (clip.startFrame || 0) + (clip.durationFrames || 90));
  }, 90);
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("div", { className: "header", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "header-left", children: [
        /* @__PURE__ */ jsxDEV("button", { className: "mobile-toggle", onClick: () => setSidebarOpen(!sidebarOpen), children: "\u2630" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 122,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "logo", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "logo-icon", children: "\u{1F3AC}" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 126,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("span", { children: "Websim Clips" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 127,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 125,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 121,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "header-actions", children: [
        /* @__PURE__ */ jsxDEV("button", { className: "btn", onClick: () => setShowGallery(true), children: [
          "\u{1F4DA} ",
          /* @__PURE__ */ jsxDEV("span", { children: "Gallery" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 132,
            columnNumber: 16
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 131,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("label", { className: `btn btn-primary ${uploading ? "disabled" : ""}`, children: [
          uploading ? "\u23F3" : "\u2B06\uFE0F",
          " ",
          /* @__PURE__ */ jsxDEV("span", { children: uploading ? "Uploading..." : "Upload" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 135,
            columnNumber: 38
          }),
          /* @__PURE__ */ jsxDEV("input", { type: "file", accept: "video/*", onChange: handleFileUpload, disabled: uploading }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 136,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 134,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "mobile-toggle", onClick: () => setPropertiesOpen(!propertiesOpen), children: "\u2699\uFE0F" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 138,
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
            lineNumber: 142,
            columnNumber: 13
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 130,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 120,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "main-container", children: [
      /* @__PURE__ */ jsxDEV("div", { className: `sidebar ${sidebarOpen ? "open" : ""}`, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "sidebar-section", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "sidebar-title", children: "Video Library" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 154,
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
                  lineNumber: 165,
                  columnNumber: 19
                }),
                /* @__PURE__ */ jsxDEV("div", { className: "gallery-item-overlay", children: clip.name }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 166,
                  columnNumber: 19
                })
              ]
            },
            clip.id,
            true,
            {
              fileName: "<stdin>",
              lineNumber: 157,
              columnNumber: 17
            }
          )) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 155,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 153,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "sidebar-section", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "sidebar-title", children: "Assets" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 173,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("label", { className: "upload-area", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "upload-icon", children: "\u{1F3B5}" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 175,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "upload-text", children: uploading ? "Uploading..." : "Add Audio" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 176,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("input", { type: "file", accept: "audio/*", onChange: handleAudioUpload, disabled: uploading }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 177,
              columnNumber: 15
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 174,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 172,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 152,
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
            lineNumber: 186,
            columnNumber: 17
          }
        ) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 185,
          columnNumber: 15
        }) : /* @__PURE__ */ jsxDEV("div", { className: "empty-state", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "empty-state-icon", children: "\u{1F3AC}" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 200,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "empty-state-text", children: "Upload a video or select from the gallery to get started" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 201,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 199,
          columnNumber: 15
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 183,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "timeline-container", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "timeline-header", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "timeline-title", children: "Timeline" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 210,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.75rem", color: "#666" }, children: [
              Math.round(totalDuration / 30),
              "s"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 211,
              columnNumber: 15
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 209,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "timeline-tracks", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "track", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "track-header", children: /* @__PURE__ */ jsxDEV("div", { className: "track-label", children: "Video Track" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 219,
                columnNumber: 19
              }) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 218,
                columnNumber: 17
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "track-clips", children: clips.length === 0 ? /* @__PURE__ */ jsxDEV("div", { style: { color: "#666", fontSize: "0.75rem" }, children: "No clips yet" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 223,
                columnNumber: 21
              }) : clips.map((clip, index) => /* @__PURE__ */ jsxDEV(
                "div",
                {
                  className: "clip",
                  style: { minWidth: `${(clip.durationFrames || 90) / 30 * 30}px` },
                  onClick: () => {
                    setSelectedClip(clip);
                    setPropertiesOpen(true);
                  },
                  onDoubleClick: () => handleRemoveClip(index),
                  children: clip.name?.substring(0, 12) || `Clip ${index + 1}`
                },
                index,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 228,
                  columnNumber: 23
                }
              )) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 221,
                columnNumber: 17
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 217,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "track", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "track-header", children: /* @__PURE__ */ jsxDEV("div", { className: "track-label", children: "Audio Track" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 247,
                columnNumber: 19
              }) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 246,
                columnNumber: 17
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "track-clips", children: audioClips.length === 0 ? /* @__PURE__ */ jsxDEV("div", { style: { color: "#666", fontSize: "0.75rem" }, children: "No audio clips" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 251,
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
                    setPropertiesOpen(true);
                  },
                  onDoubleClick: () => setAudioClips(audioClips.filter((_, i) => i !== index)),
                  children: clip.name?.substring(0, 12) || `Audio ${index + 1}`
                },
                index,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 256,
                  columnNumber: 23
                }
              )) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 249,
                columnNumber: 17
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 245,
              columnNumber: 15
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 216,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 208,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 182,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `properties-panel ${propertiesOpen ? "open" : ""}`, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "sidebar-title", children: "Properties" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 280,
          columnNumber: 11
        }),
        selectedClip ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
          /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Clip Name" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 284,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "text",
                className: "property-input",
                value: selectedClip.name || "",
                readOnly: true
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 285,
                columnNumber: 17
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 283,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Duration" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 293,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "text",
                className: "property-input",
                value: `${selectedClip.duration?.toFixed(1) || "3.0"}s`,
                readOnly: true
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 294,
                columnNumber: 17
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 292,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Opacity" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 302,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("input", { type: "range", className: "slider", min: "0", max: "100", defaultValue: "100" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 303,
              columnNumber: 17
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 301,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Volume" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 306,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("input", { type: "range", className: "slider", min: "0", max: "100", defaultValue: "100" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 307,
              columnNumber: 17
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 305,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 282,
          columnNumber: 13
        }) : /* @__PURE__ */ jsxDEV("div", { className: "empty-state", children: /* @__PURE__ */ jsxDEV("div", { className: "empty-state-text", children: "Select a clip to view properties" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 312,
          columnNumber: 15
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 311,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "sidebar-section", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "sidebar-title", children: "History" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 319,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "history-list", children: /* @__PURE__ */ jsxDEV("div", { className: "history-item", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "history-action", children: "Added video clip" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 322,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "history-time", children: "Just now" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 323,
              columnNumber: 17
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 321,
            columnNumber: 15
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 320,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 318,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 279,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 151,
      columnNumber: 7
    }),
    showGallery && /* @__PURE__ */ jsxDEV("div", { className: "modal", onClick: () => setShowGallery(false), children: /* @__PURE__ */ jsxDEV("div", { className: "modal-content", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxDEV("div", { className: "modal-header", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "modal-title", children: "Community Gallery" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 334,
          columnNumber: 15
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "close-btn", onClick: () => setShowGallery(false), children: "\xD7" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 335,
          columnNumber: 15
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 333,
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
              lineNumber: 346,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "gallery-item-overlay", children: [
              clip.name,
              /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 349,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("small", { children: [
                "by ",
                clip.username
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 350,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 347,
              columnNumber: 19
            })
          ]
        },
        clip.id,
        true,
        {
          fileName: "<stdin>",
          lineNumber: 341,
          columnNumber: 17
        }
      )) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 339,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 332,
      columnNumber: 11
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 331,
      columnNumber: 9
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 119,
    columnNumber: 5
  });
};
createRoot(document.getElementById("app")).render(/* @__PURE__ */ jsxDEV(App, {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 362,
  columnNumber: 51
}));
