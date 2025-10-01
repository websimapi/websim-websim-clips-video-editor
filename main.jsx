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
      const canvas = document.createElement("canvas");
      canvas.width = 540;
      canvas.height = 960;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!window.MediaRecorder) {
        throw new Error("MediaRecorder not supported in this browser");
      }
      const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");
      let mimeType;
      if (isFirefox) {
        if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
          mimeType = "video/webm;codecs=vp8,opus";
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
          mimeType = "video/webm;codecs=vp8";
        } else {
          mimeType = "video/webm";
        }
      } else {
        if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
          mimeType = "video/webm;codecs=vp9,opus";
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
          mimeType = "video/webm;codecs=vp8,opus";
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
          mimeType = "video/webm;codecs=vp9";
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
          mimeType = "video/webm;codecs=vp8";
        } else {
          mimeType = "video/webm";
        }
      }
      console.log("Using mimeType:", mimeType);
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48e3 });
      const audioDestination = audioContext.createMediaStreamDestination();
      const videoElements = await Promise.all(
        clips.map(async (clip) => {
          const video = document.createElement("video");
          video.src = clip.url;
          video.crossOrigin = "anonymous";
          video.preload = "auto";
          video.playsInline = true;
          await new Promise((resolve, reject) => {
            video.onloadeddata = resolve;
            video.onerror = reject;
          });
          return video;
        })
      );
      const audioSources = [];
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        const video = videoElements[i];
        try {
          const source = audioContext.createMediaElementSource(video);
          const clipGainNode = audioContext.createGain();
          clipGainNode.gain.value = 0;
          source.connect(clipGainNode);
          clipGainNode.connect(audioDestination);
          audioSources.push({
            element: video,
            clip,
            gainNode: clipGainNode,
            type: "video",
            index: i
          });
        } catch (err) {
          console.warn("Failed to connect video audio:", clip.name, err);
        }
      }
      for (const clip of audioClips) {
        if (!clip.url) continue;
        try {
          const audio = document.createElement("audio");
          audio.src = clip.url;
          audio.crossOrigin = "anonymous";
          audio.preload = "auto";
          await new Promise((resolve) => {
            audio.onloadeddata = resolve;
            audio.onerror = resolve;
          });
          const source = audioContext.createMediaElementSource(audio);
          const clipGainNode = audioContext.createGain();
          clipGainNode.gain.value = 0;
          source.connect(clipGainNode);
          clipGainNode.connect(audioDestination);
          audioSources.push({
            element: audio,
            clip,
            gainNode: clipGainNode,
            type: "audio"
          });
        } catch (err) {
          console.warn("Failed to load audio for clip:", clip.name, err);
        }
      }
      await Promise.all([...audioSources.map(async ({ element }) => {
        element.muted = false;
        element.volume = 1;
        try {
          await element.play();
          element.pause();
          element.currentTime = 0;
        } catch (err) {
          console.warn("Failed to initialize element:", err);
        }
      })]);
      const videoStream = canvas.captureStream(30);
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks()
      ]);
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 5e6,
        audioBitsPerSecond: 192e3
      });
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        setExportProgress(100);
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `websim-clips-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        videoElements.forEach((v) => {
          v.pause();
          v.src = "";
        });
        audioSources.forEach((a2) => {
          a2.element.pause();
          if (a2.element.src) a2.element.src = "";
        });
        audioContext.close();
        setTimeout(() => {
          URL.revokeObjectURL(url);
          setExporting(false);
          setExportProgress(0);
        }, 100);
      };
      mediaRecorder.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        throw new Error("Recording failed: " + (e.error?.message || "Unknown error"));
      };
      mediaRecorder.start(100);
      setExportProgress(5);
      const fps = 30;
      const frameDuration = 1e3 / fps;
      let currentFrame = 0;
      const maxFrames = totalDuration;
      let lastFrameTime = performance.now();
      let activeVideoIndex = -1;
      const renderFrame = async () => {
        const currentTime = currentFrame / fps;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        let renderedAnyVideo = false;
        for (let i = 0; i < clips.length; i++) {
          const clip = clips[i];
          const clipStartFrame = clip.startFrame || 0;
          const clipEndFrame = clipStartFrame + (clip.durationFrames || 90);
          if (currentFrame >= clipStartFrame && currentFrame < clipEndFrame) {
            const clipLocalFrame = currentFrame - clipStartFrame;
            const video = videoElements[i];
            const effects = clip.effects || {};
            const videoTime = ((clip.trimStart || 0) + clipLocalFrame) / fps;
            const targetTime = videoTime * (effects.speed || 1);
            if (Math.abs(video.currentTime - targetTime) > 0.016) {
              video.currentTime = targetTime;
              if (video.readyState < 2) {
                await new Promise((resolve) => {
                  const onSeeked = () => {
                    video.removeEventListener("seeked", onSeeked);
                    resolve();
                  };
                  video.addEventListener("seeked", onSeeked);
                  setTimeout(resolve, 100);
                });
              }
            }
            let attempts = 0;
            while (video.readyState < 2 && attempts < 5) {
              await new Promise((resolve) => setTimeout(resolve, 20));
              attempts++;
            }
            ctx.save();
            ctx.globalAlpha = effects.opacity !== void 0 ? effects.opacity : 1;
            if (effects.blur || effects.brightness !== void 0 || effects.saturation !== void 0) {
              let filter = "";
              if (effects.blur) filter += `blur(${effects.blur}px) `;
              if (effects.brightness !== void 0) filter += `brightness(${effects.brightness}) `;
              if (effects.saturation !== void 0) filter += `saturate(${effects.saturation})`;
              ctx.filter = filter;
            }
            try {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              renderedAnyVideo = true;
            } catch (err) {
              console.warn("Failed to draw video frame:", err);
            }
            if (clip.text?.content) {
              const text = clip.text;
              ctx.filter = "none";
              ctx.globalAlpha = 1;
              ctx.fillStyle = text.color || "#ffffff";
              ctx.font = `bold ${text.fontSize || 48}px Arial`;
              ctx.textAlign = "center";
              ctx.shadowColor = "rgba(0,0,0,0.8)";
              ctx.shadowBlur = 10;
              const y = text.position === "top" ? 100 : text.position === "bottom" ? canvas.height - 100 : canvas.height / 2;
              ctx.fillText(text.content, canvas.width / 2, y);
            }
            ctx.restore();
            activeVideoIndex = i;
            break;
          }
        }
        audioSources.forEach(({ gainNode }) => {
          gainNode.gain.value = 0;
        });
        audioSources.forEach(({ element, clip, gainNode, type, index }) => {
          const clipStartFrame = clip.startFrame || 0;
          const clipEndFrame = clipStartFrame + (clip.durationFrames || 90);
          if (currentFrame >= clipStartFrame && currentFrame < clipEndFrame) {
            const clipLocalTime = (currentFrame - clipStartFrame) / fps;
            const effects = clip.effects || {};
            gainNode.gain.value = effects.volume !== void 0 ? effects.volume : 1;
            const targetTime = clipLocalTime * (effects.speed || 1);
            if (Math.abs(element.currentTime - targetTime) > 0.1) {
              element.currentTime = targetTime;
            }
            if (element.paused) {
              element.play().catch((err) => console.warn("Audio play failed:", err));
            }
          } else {
            if (!element.paused) {
              element.pause();
            }
          }
        });
        currentFrame++;
        const progress = currentFrame / maxFrames * 100;
        setExportProgress(5 + Math.round(progress * 0.9));
        if (currentFrame < maxFrames) {
          const now = performance.now();
          const elapsed = now - lastFrameTime;
          const waitTime = Math.max(0, frameDuration - elapsed);
          lastFrameTime = now + waitTime;
          setTimeout(renderFrame, waitTime);
        } else {
          audioSources.forEach(({ element }) => {
            element.pause();
          });
          setTimeout(() => {
            mediaRecorder.stop();
          }, 500);
        }
      };
      renderFrame();
    } catch (error) {
      console.error("Export error:", error);
      alert(`Export failed: ${error.message}. Please make sure your browser supports video recording.`);
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
          lineNumber: 640,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "logo", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "logo-icon", children: "\u{1F3AC}" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 644,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("span", { children: "Websim Clips" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 645,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 643,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 639,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "header-actions", children: [
        /* @__PURE__ */ jsxDEV("button", { className: "btn", onClick: () => setShowGallery(true), children: [
          "\u{1F4DA} ",
          /* @__PURE__ */ jsxDEV("span", { children: "Gallery" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 650,
            columnNumber: 16
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 649,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("label", { className: `btn btn-primary ${uploading ? "disabled" : ""}`, children: [
          uploading ? "\u23F3" : "\u2B06\uFE0F",
          " ",
          /* @__PURE__ */ jsxDEV("span", { children: uploading ? "Uploading..." : "Upload" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 653,
            columnNumber: 38
          }),
          /* @__PURE__ */ jsxDEV("input", { type: "file", accept: "video/*", onChange: handleFileUpload, disabled: uploading }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 654,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 652,
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
                lineNumber: 661,
                columnNumber: 55
              })
            ]
          },
          void 0,
          true,
          {
            fileName: "<stdin>",
            lineNumber: 656,
            columnNumber: 11
          }
        ),
        /* @__PURE__ */ jsxDEV("button", { className: "mobile-toggle", onClick: () => setPropertiesOpen(!propertiesOpen), children: "\u2699\uFE0F" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 663,
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
            lineNumber: 667,
            columnNumber: 13
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 648,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 638,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "main-container", children: [
      /* @__PURE__ */ jsxDEV("div", { className: `sidebar ${sidebarOpen ? "open" : ""}`, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "sidebar-section", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "sidebar-title", children: "Video Library" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 679,
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
                  lineNumber: 690,
                  columnNumber: 19
                }),
                /* @__PURE__ */ jsxDEV("div", { className: "gallery-item-overlay", children: clip.name }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 691,
                  columnNumber: 19
                })
              ]
            },
            clip.id,
            true,
            {
              fileName: "<stdin>",
              lineNumber: 682,
              columnNumber: 17
            }
          )) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 680,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 678,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "sidebar-section", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "sidebar-title", children: "Assets" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 698,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("label", { className: "upload-area", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "upload-icon", children: "\u{1F3B5}" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 700,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "upload-text", children: uploading ? "Uploading..." : "Add Audio" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 701,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("input", { type: "file", accept: "audio/*", onChange: handleAudioUpload, disabled: uploading }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 702,
              columnNumber: 15
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 699,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 697,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 677,
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
                lineNumber: 710,
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
                lineNumber: 718,
                columnNumber: 15
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 709,
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
                lineNumber: 728,
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
                lineNumber: 736,
                columnNumber: 15
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 727,
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
                lineNumber: 746,
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
                lineNumber: 754,
                columnNumber: 15
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 745,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 708,
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
            lineNumber: 768,
            columnNumber: 17
          }
        ) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 767,
          columnNumber: 15
        }) : /* @__PURE__ */ jsxDEV("div", { className: "empty-state", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "empty-state-icon", children: "\u{1F3AC}" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 782,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "empty-state-text", children: "Upload a video or select from the gallery to get started" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 783,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 781,
          columnNumber: 15
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 765,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "timeline-container", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "timeline-header", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "timeline-title", children: "Timeline" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 792,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.75rem", color: "#666" }, children: [
              clips.length,
              " clips \u2022 ",
              Math.round(totalDuration / 30),
              "s"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 793,
              columnNumber: 15
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 791,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "timeline-tracks", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "track", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "track-header", children: /* @__PURE__ */ jsxDEV("div", { className: "track-label", children: "\u{1F3AC} Video" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 801,
                columnNumber: 19
              }) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 800,
                columnNumber: 17
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "track-clips", children: clips.length === 0 ? /* @__PURE__ */ jsxDEV("div", { style: { color: "#666", fontSize: "0.75rem", padding: "1rem" }, children: "Drop video clips here" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 805,
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
                          lineNumber: 825,
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
                          lineNumber: 835,
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
                          lineNumber: 845,
                          columnNumber: 27
                        }
                      )
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 824,
                      columnNumber: 25
                    }),
                    /* @__PURE__ */ jsxDEV("div", { className: "clip-name", children: clip.name?.substring(0, 15) || `Clip ${index + 1}` }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 856,
                      columnNumber: 25
                    }),
                    /* @__PURE__ */ jsxDEV("div", { className: "clip-duration", children: [
                      Math.round((clip.durationFrames || 90) / 30 * 10) / 10,
                      "s"
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 859,
                      columnNumber: 25
                    })
                  ]
                },
                index,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 810,
                  columnNumber: 23
                }
              )) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 803,
                columnNumber: 17
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 799,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "track", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "track-header", children: /* @__PURE__ */ jsxDEV("div", { className: "track-label", children: "\u{1F3B5} Audio" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 870,
                columnNumber: 19
              }) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 869,
                columnNumber: 17
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "track-clips", children: audioClips.length === 0 ? /* @__PURE__ */ jsxDEV("div", { style: { color: "#666", fontSize: "0.75rem", padding: "1rem" }, children: "No audio clips" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 874,
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
                        lineNumber: 895,
                        columnNumber: 27
                      }
                    ) }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 894,
                      columnNumber: 25
                    }),
                    /* @__PURE__ */ jsxDEV("div", { className: "clip-name", children: clip.name?.substring(0, 15) || `Audio ${index + 1}` }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 906,
                      columnNumber: 25
                    }),
                    /* @__PURE__ */ jsxDEV("div", { className: "clip-duration", children: [
                      Math.round((clip.durationFrames || 90) / 30 * 10) / 10,
                      "s"
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 909,
                      columnNumber: 25
                    })
                  ]
                },
                index,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 879,
                  columnNumber: 23
                }
              )) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 872,
                columnNumber: 17
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 868,
              columnNumber: 15
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 798,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 790,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 707,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `properties-panel ${propertiesOpen ? "open" : ""}`, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "sidebar-title", children: "Properties" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 922,
          columnNumber: 11
        }),
        selectedClip ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
          /* @__PURE__ */ jsxDEV("div", { className: "info-box", style: { marginBottom: "1rem" }, children: [
            /* @__PURE__ */ jsxDEV("p", { children: /* @__PURE__ */ jsxDEV("strong", { children: selectedClip.name || "Unnamed Clip" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 926,
              columnNumber: 20
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 926,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("p", { children: [
              "Duration: ",
              Math.round((selectedClip.durationFrames || 90) / 30 * 10) / 10,
              "s"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 927,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("p", { children: [
              "Type: ",
              selectedClip.type || "video"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 928,
              columnNumber: 17
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 925,
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
                lineNumber: 932,
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
                lineNumber: 938,
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
                lineNumber: 944,
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
                lineNumber: 950,
                columnNumber: 17
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 931,
            columnNumber: 15
          }),
          activeTab === "effects" && /* @__PURE__ */ jsxDEV(Fragment, { children: [
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Opacity" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 961,
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
                  lineNumber: 962,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: [
                Math.round((selectedClip.effects?.opacity || 1) * 100),
                "%"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 970,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 960,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Volume" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 973,
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
                  lineNumber: 974,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: [
                Math.round((selectedClip.effects?.volume || 1) * 100),
                "%"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 982,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 972,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Speed" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 985,
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
                  lineNumber: 986,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: [
                ((selectedClip.effects?.speed || 1) * 100).toFixed(0),
                "%"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 994,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 984,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Blur" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 997,
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
                  lineNumber: 998,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: [
                selectedClip.effects?.blur || 0,
                "px"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1006,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 996,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Brightness" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1009,
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
                  lineNumber: 1010,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: [
                Math.round((selectedClip.effects?.brightness || 1) * 100),
                "%"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1018,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1008,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Saturation" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1021,
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
                  lineNumber: 1022,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: [
                Math.round((selectedClip.effects?.saturation || 1) * 100),
                "%"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1030,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1020,
              columnNumber: 19
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 959,
            columnNumber: 17
          }),
          activeTab === "text" && /* @__PURE__ */ jsxDEV(Fragment, { children: [
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Text Content" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1038,
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
                  lineNumber: 1039,
                  columnNumber: 21
                }
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1037,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Font Size" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1048,
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
                  lineNumber: 1049,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: [
                selectedClip.text?.fontSize || 48,
                "px"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1057,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1047,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Text Color" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1060,
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
                  lineNumber: 1061,
                  columnNumber: 21
                }
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1059,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Position" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1069,
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
                      lineNumber: 1075,
                      columnNumber: 23
                    }),
                    /* @__PURE__ */ jsxDEV("option", { value: "center", children: "Center" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1076,
                      columnNumber: 23
                    }),
                    /* @__PURE__ */ jsxDEV("option", { value: "bottom", children: "Bottom" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1077,
                      columnNumber: 23
                    })
                  ]
                },
                void 0,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 1070,
                  columnNumber: 21
                }
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1068,
              columnNumber: 19
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1036,
            columnNumber: 17
          }),
          activeTab === "transitions" && /* @__PURE__ */ jsxDEV(Fragment, { children: [
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Transition Type" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1086,
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
                      lineNumber: 1092,
                      columnNumber: 23
                    }),
                    /* @__PURE__ */ jsxDEV("option", { value: "fade", children: "Fade" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1093,
                      columnNumber: 23
                    }),
                    /* @__PURE__ */ jsxDEV("option", { value: "slide", children: "Slide" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1094,
                      columnNumber: 23
                    }),
                    /* @__PURE__ */ jsxDEV("option", { value: "wipe", children: "Wipe" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1095,
                      columnNumber: 23
                    }),
                    /* @__PURE__ */ jsxDEV("option", { value: "zoom", children: "Zoom" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1096,
                      columnNumber: 23
                    })
                  ]
                },
                void 0,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 1087,
                  columnNumber: 21
                }
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1085,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "info-box", children: /* @__PURE__ */ jsxDEV("p", { children: "Transitions are applied at the start of each clip" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1100,
              columnNumber: 21
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1099,
              columnNumber: 19
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1084,
            columnNumber: 17
          }),
          activeTab === "trim" && /* @__PURE__ */ jsxDEV(Fragment, { children: [
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Trim Start (frames)" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1108,
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
                  lineNumber: 1109,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: selectedClip.trimStart || 0 }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1117,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1107,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "property-group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "property-label", children: "Trim End (frames)" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1120,
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
                  lineNumber: 1121,
                  columnNumber: 21
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "slider-value", children: selectedClip.trimEnd || selectedClip.durationFrames }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1129,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1119,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "info-box", children: /* @__PURE__ */ jsxDEV("p", { children: [
              "Current duration: ",
              Math.round((selectedClip.trimEnd - selectedClip.trimStart) / 30 * 10) / 10,
              "s"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1132,
              columnNumber: 21
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1131,
              columnNumber: 19
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1106,
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
                lineNumber: 1138,
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
                lineNumber: 1146,
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
                lineNumber: 1154,
                columnNumber: 17
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1137,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 924,
          columnNumber: 13
        }) : /* @__PURE__ */ jsxDEV("div", { className: "empty-state", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "empty-state-icon", children: "\u{1F3AC}" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1166,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "empty-state-text", children: "Select a clip to edit its properties" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1167,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1165,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "sidebar-section", style: { marginTop: "1.5rem" }, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "sidebar-title", children: "Composition Info" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1174,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "info-box", children: [
            /* @__PURE__ */ jsxDEV("p", { children: [
              "Total Clips: ",
              clips.length
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1176,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("p", { children: [
              "Duration: ",
              Math.round(totalDuration / 30),
              "s"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1177,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("p", { children: "Resolution: 540x960" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1178,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("p", { children: "FPS: 30" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1179,
              columnNumber: 15
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1175,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1173,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 921,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 676,
      columnNumber: 7
    }),
    showGallery && /* @__PURE__ */ jsxDEV("div", { className: "modal", onClick: () => setShowGallery(false), children: /* @__PURE__ */ jsxDEV("div", { className: "modal-content", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxDEV("div", { className: "modal-header", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "modal-title", children: "Community Gallery" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1189,
          columnNumber: 15
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "close-btn", onClick: () => setShowGallery(false), children: "\xD7" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1190,
          columnNumber: 15
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1188,
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
              lineNumber: 1201,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "gallery-item-overlay", children: [
              clip.name,
              /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1204,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("small", { children: [
                "by ",
                clip.username
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1205,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1202,
              columnNumber: 19
            })
          ]
        },
        clip.id,
        true,
        {
          fileName: "<stdin>",
          lineNumber: 1196,
          columnNumber: 17
        }
      )) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1194,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1187,
      columnNumber: 11
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1186,
      columnNumber: 9
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 637,
    columnNumber: 5
  });
};
createRoot(document.getElementById("app")).render(/* @__PURE__ */ jsxDEV(App, {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 1217,
  columnNumber: 51
}));
