import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Player } from "@websim/remotion/player";
import { EditorComposition } from "./composition.jsx";
const room = new WebsimSocket();
const App = () => {
  const [clips, setClips] = useState([]);
  const [selectedClip, setSelectedClip] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
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
      const url = await window.websim.upload(file);
      const clip = await room.collection("video_clip_v2").create({
        url,
        name: file.name,
        duration: 0,
        type: "video"
      });
      setClips([...clips, { ...clip, startFrame: clips.length * 90 }]);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };
  const handleAddToTimeline = (videoClip) => {
    const newClip = {
      ...videoClip,
      startFrame: clips.length * 90
    };
    setClips([...clips, newClip]);
    setShowGallery(false);
  };
  const handleRemoveClip = (index) => {
    setClips(clips.filter((_, i) => i !== index));
  };
  const totalDuration = clips.reduce((acc, clip) => {
    return Math.max(acc, (clip.startFrame || 0) + 90);
  }, 90);
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("div", { className: "header", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "header-left", children: /* @__PURE__ */ jsxDEV("div", { className: "logo", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "logo-icon", children: "\u{1F3AC}" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 70,
          columnNumber: 13
        }),
        "Websim Clips"
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 69,
        columnNumber: 11
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 68,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "header-actions", children: [
        /* @__PURE__ */ jsxDEV("button", { className: "btn", onClick: () => setShowGallery(true), children: "\u{1F4DA} Gallery" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 75,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("label", { className: "btn btn-primary", children: [
          "\u2B06\uFE0F Upload Video",
          /* @__PURE__ */ jsxDEV("input", { type: "file", accept: "video/*", onChange: handleFileUpload }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 80,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 78,
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
            lineNumber: 83,
            columnNumber: 13
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 74,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 67,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "main-container", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "sidebar", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "sidebar-section", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "sidebar-title", children: "Video Library" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 95,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "gallery-grid", children: videoClips.reverse().slice(0, 6).map((clip) => /* @__PURE__ */ jsxDEV(
            "div",
            {
              className: "gallery-item",
              onClick: () => handleAddToTimeline(clip),
              children: [
                /* @__PURE__ */ jsxDEV("video", { src: clip.url }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 103,
                  columnNumber: 19
                }),
                /* @__PURE__ */ jsxDEV("div", { className: "gallery-item-overlay", children: clip.name }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 104,
                  columnNumber: 19
                })
              ]
            },
            clip.id,
            true,
            {
              fileName: "<stdin>",
              lineNumber: 98,
              columnNumber: 17
            }
          )) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 96,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 94,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "sidebar-section", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "sidebar-title", children: "Assets" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 111,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("label", { className: "upload-area", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "upload-icon", children: "\u{1F3B5}" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 113,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "upload-text", children: "Add Audio" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 114,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("input", { type: "file", accept: "audio/*" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 115,
              columnNumber: 15
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 112,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 110,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 93,
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
            inputProps: { clips },
            style: { width: "100%", height: "100%" }
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 124,
            columnNumber: 17
          }
        ) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 123,
          columnNumber: 15
        }) : /* @__PURE__ */ jsxDEV("div", { className: "empty-state", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "empty-state-icon", children: "\u{1F3AC}" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 138,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "empty-state-text", children: "Upload a video or select from the gallery to get started" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 139,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 137,
          columnNumber: 15
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 121,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "timeline-container", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "timeline-header", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "timeline-title", children: "Timeline" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 148,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.75rem", color: "#666" }, children: [
              Math.round(totalDuration / 30),
              "s"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 149,
              columnNumber: 15
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 147,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "timeline-tracks", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "track", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "track-header", children: /* @__PURE__ */ jsxDEV("div", { className: "track-label", children: "Video Track" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 157,
                columnNumber: 19
              }) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 156,
                columnNumber: 17
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "track-clips", children: clips.length === 0 ? /* @__PURE__ */ jsxDEV("div", { style: { color: "#666", fontSize: "0.75rem" }, children: "No clips yet" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 161,
                columnNumber: 21
              }) : clips.map((clip, index) => /* @__PURE__ */ jsxDEV(
                "div",
                {
                  className: "clip",
                  onClick: () => setSelectedClip(clip),
                  onDoubleClick: () => handleRemoveClip(index),
                  children: clip.name?.substring(0, 12) || `Clip ${index + 1}`
                },
                index,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 166,
                  columnNumber: 23
                }
              )) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 159,
                columnNumber: 17
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 155,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "track", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "track-header", children: /* @__PURE__ */ jsxDEV("div", { className: "track-label", children: "Audio Track" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 181,
                columnNumber: 19
              }) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 180,
                columnNumber: 17
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "track-clips", children: /* @__PURE__ */ jsxDEV("div", { style: { color: "#666", fontSize: "0.75rem" }, children: "No audio clips" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 184,
                columnNumber: 19
              }) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 183,
                columnNumber: 17
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 179,
              columnNumber: 15
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 154,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 146,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 120,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "properties-panel", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "sidebar-title", children: "Properties" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 194,
          columnNumber: 11
        }),
        selectedClip ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
          /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Clip Name" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 198,
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
                lineNumber: 199,
                columnNumber: 17
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 197,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Duration" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 207,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "text",
                className: "property-input",
                value: "3.0s",
                readOnly: true
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 208,
                columnNumber: 17
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 206,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Opacity" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 216,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("input", { type: "range", className: "slider", min: "0", max: "100", defaultValue: "100" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 217,
              columnNumber: 17
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 215,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Volume" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 220,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("input", { type: "range", className: "slider", min: "0", max: "100", defaultValue: "100" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 221,
              columnNumber: 17
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 219,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 196,
          columnNumber: 13
        }) : /* @__PURE__ */ jsxDEV("div", { className: "empty-state", children: /* @__PURE__ */ jsxDEV("div", { className: "empty-state-text", children: "Select a clip to view properties" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 226,
          columnNumber: 15
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 225,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "sidebar-section", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "sidebar-title", children: "History" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 233,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "history-list", children: /* @__PURE__ */ jsxDEV("div", { className: "history-item", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "history-action", children: "Added video clip" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 236,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "history-time", children: "Just now" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 237,
              columnNumber: 17
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 235,
            columnNumber: 15
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 234,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 232,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 193,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 92,
      columnNumber: 7
    }),
    showGallery && /* @__PURE__ */ jsxDEV("div", { className: "modal", onClick: () => setShowGallery(false), children: /* @__PURE__ */ jsxDEV("div", { className: "modal-content", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxDEV("div", { className: "modal-header", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "modal-title", children: "Community Gallery" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 248,
          columnNumber: 15
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "close-btn", onClick: () => setShowGallery(false), children: "\xD7" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 249,
          columnNumber: 15
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 247,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "gallery-grid", children: videoClips.reverse().map((clip) => /* @__PURE__ */ jsxDEV(
        "div",
        {
          className: "gallery-item",
          onClick: () => handleAddToTimeline(clip),
          children: [
            /* @__PURE__ */ jsxDEV("video", { src: clip.url }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 260,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "gallery-item-overlay", children: [
              clip.name,
              /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 263,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("small", { children: [
                "by ",
                clip.username
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 264,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 261,
              columnNumber: 19
            })
          ]
        },
        clip.id,
        true,
        {
          fileName: "<stdin>",
          lineNumber: 255,
          columnNumber: 17
        }
      )) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 253,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 246,
      columnNumber: 11
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 245,
      columnNumber: 9
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 66,
    columnNumber: 5
  });
};
createRoot(document.getElementById("app")).render(/* @__PURE__ */ jsxDEV(App, {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 276,
  columnNumber: 51
}));
