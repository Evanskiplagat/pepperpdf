"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Canvas, FabricImage, Rect, Textbox } from "fabric";
import { PDFDocument, rgb } from "pdf-lib";

type PdfJsModule = {
  GlobalWorkerOptions: { workerSrc: string };
  version: string;
  getDocument: (src: unknown) => {
    promise: Promise<{ getPage: (num: number) => Promise<any> }>;
  };
};

type PdfCanvasProps = {
  url?: string;
  bytes?: Uint8Array;
  scale?: number;
  onUploadPdf?: (event: ChangeEvent<HTMLInputElement>) => void;
};

export type PdfCanvasHandle = {
  exportPdf: () => Promise<Uint8Array | null>;
  addTextBox: () => void;
  addRectangle: () => void;
};

type PdfStatus = "idle" | "loading" | "ready" | "error";

const DEFAULT_CANVAS_WIDTH = 900;
const PAGE_ASPECT_RATIO = 1.4142;
const CANVAS_VIEWPORT_PADDING = 24;

const PdfCanvas = forwardRef<PdfCanvasHandle, PdfCanvasProps>(function PdfCanvas(
  { url, bytes, scale = 1.2, onUploadPdf },
  ref
) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const domCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const pdfBytesRef = useRef<Uint8Array | null>(null);
  const lineEditsRef = useRef<Map<string, Textbox>>(new Map());
  const lineBoxesRef = useRef<
    Array<{
      id: string;
      text: string;
      left: number;
      top: number;
      width: number;
      height: number;
      fontSize: number;
    }>
  >([]);
  const [status, setStatus] = useState<PdfStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [useNativePreview, setUseNativePreview] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const [textItemCount, setTextItemCount] = useState(0);
  const [boxesCount, setBoxesCount] = useState(0);
  const previewUrl = url
    ? (url.includes("#") ? url : `${url}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`)
    : "";

  const getFittedCanvasSize = useCallback(
    (sourceWidth: number, sourceHeight: number) => {
      const hostWidth = canvasHostRef.current?.clientWidth ?? DEFAULT_CANVAS_WIDTH;
      const availableWidth = Math.max(320, hostWidth - CANVAS_VIEWPORT_PADDING);
      const scaleFactor = availableWidth / sourceWidth;
      return {
        width: Math.round(sourceWidth * scaleFactor),
        height: Math.max(420, Math.round(sourceHeight * scaleFactor)),
      };
    },
    []
  );

  const getOrCreateCanvas = useCallback(() => {
    if (fabricRef.current) {
      return fabricRef.current;
    }

    const host = canvasHostRef.current;
    if (!host) {
      return null;
    }

    const targetCanvas = document.createElement("canvas");
    targetCanvas.className =
      "h-auto max-w-full rounded-2xl border border-slate-200 bg-transparent shadow-[0_8px_20px_rgba(15,23,42,0.10)]";
    host.replaceChildren(targetCanvas);
    domCanvasRef.current = targetCanvas;

    const fabricCanvas = new Canvas(targetCanvas, {
      selection: true,
      preserveObjectStacking: true,
    });
    fabricCanvas.selection = false;
    fabricCanvas.targetFindTolerance = 12;

    const defaultPageWidth = DEFAULT_CANVAS_WIDTH;
    const defaultPageHeight = Math.round(DEFAULT_CANVAS_WIDTH * PAGE_ASPECT_RATIO);
    const { width, height } = getFittedCanvasSize(defaultPageWidth, defaultPageHeight);

    fabricCanvas.setDimensions({ width, height });
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.requestRenderAll();
    fabricCanvas.on("mouse:wheel", (event) => {
      if (!scrollRef.current) {
        return;
      }
      scrollRef.current.scrollTop += event.e.deltaY;
      scrollRef.current.scrollLeft += event.e.deltaX;
      event.e.preventDefault();
      event.e.stopPropagation();
    });
    fabricCanvas.on("mouse:down", (event) => {
      const target = event.target as (Rect & { data?: Record<string, unknown> }) | null;
      let lineData:
        | {
            id: string;
            text: string;
            left: number;
            top: number;
            width: number;
            height: number;
            fontSize: number;
          }
        | null = null;

      const targetData = (target as { data?: Record<string, unknown> })?.data;
      if (targetData && targetData.kind === "pdf-line") {
        lineData = {
          id: String(targetData.id ?? ""),
          text: String(targetData.text ?? ""),
          left: Number(targetData.left ?? target.left ?? 0),
          top: Number(targetData.top ?? target.top ?? 0),
          width: Number(targetData.width ?? target.width ?? 160),
          height: Number(targetData.height ?? target.height ?? 24),
          fontSize: Number(targetData.fontSize ?? Math.max(12, (target.height ?? 24) * 0.85)),
        };
      } else {
        const canvasElement = domCanvasRef.current;
        if (!canvasElement) {
          return;
        }
        const rect = canvasElement.getBoundingClientRect();
        const scaleX = rect.width ? fabricCanvas.getWidth() / rect.width : 1;
        const scaleY = rect.height ? fabricCanvas.getHeight() / rect.height : 1;
        const sourceEvent = event.e as MouseEvent | TouchEvent;
        const clientX =
          "touches" in sourceEvent && sourceEvent.touches.length
            ? sourceEvent.touches[0].clientX
            : (sourceEvent as MouseEvent).clientX;
        const clientY =
          "touches" in sourceEvent && sourceEvent.touches.length
            ? sourceEvent.touches[0].clientY
            : (sourceEvent as MouseEvent).clientY;
        const pointer = {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY,
        };
        lineData =
          lineBoxesRef.current.find(
            (box) =>
              pointer.x >= box.left &&
              pointer.x <= box.left + box.width &&
              pointer.y >= box.top &&
              pointer.y <= box.top + box.height
          ) ?? null;
      }

      if (!lineData || !lineData.id) {
        return;
      }

      const existing = lineEditsRef.current.get(lineData.id);
      if (existing) {
        setTimeout(() => {
          fabricCanvas.setActiveObject(existing);
          existing.enterEditing();
          existing.selectAll();
          fabricCanvas.requestRenderAll();
        }, 0);
        return;
      }

      const textbox = new Textbox(lineData.text.trim() || "Edit text", {
        left: lineData.left,
        top: lineData.top,
        width: lineData.width,
        fontSize: lineData.fontSize,
        fontWeight: 500,
        fill: "#111827",
        backgroundColor: "transparent",
        editable: true,
      });
      (textbox as unknown as { data?: Record<string, unknown> }).data = {
        kind: "pdf-edit",
        lineId: lineData.id,
        originalRect: {
          left: lineData.left,
          top: lineData.top,
          width: lineData.width,
          height: lineData.height,
        },
      };

      lineEditsRef.current.set(lineData.id, textbox);
      const rectTarget = fabricCanvas
        .getObjects()
        .find((obj) => (obj as { data?: Record<string, unknown> })?.data?.id === lineData?.id);
      if (rectTarget) {
        fabricCanvas.remove(rectTarget);
      }
      fabricCanvas.add(textbox);
      fabricCanvas.requestRenderAll();
      setTimeout(() => {
        fabricCanvas.setActiveObject(textbox);
        textbox.enterEditing();
        textbox.selectAll();
        fabricCanvas.requestRenderAll();
      }, 0);
    });

    fabricRef.current = fabricCanvas;
    return fabricCanvas;
  }, [getFittedCanvasSize]);

  const addTextBox = useCallback(() => {
    const canvas = getOrCreateCanvas();
    if (!canvas) {
      return;
    }

    const textbox = new Textbox("Edit text", {
      left: 80,
      top: 80,
      fontSize: 32,
      fontWeight: 600,
      fill: "#1f2937",
    });

    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    textbox.enterEditing();
    textbox.selectAll();
    canvas.requestRenderAll();
  }, [getOrCreateCanvas]);

  const addRectangle = useCallback(() => {
    const canvas = getOrCreateCanvas();
    if (!canvas) {
      return;
    }

    const rect = new Rect({
      left: 140,
      top: 160,
      width: 180,
      height: 120,
      rx: 16,
      ry: 16,
      fill: "rgba(100,116,139,0.15)",
      stroke: "#334155",
      strokeWidth: 2,
    });

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.requestRenderAll();
  }, [getOrCreateCanvas]);

  useEffect(() => {
    getOrCreateCanvas();

    return () => {
      fabricRef.current?.dispose();
      fabricRef.current = null;
      domCanvasRef.current = null;
    };
  }, [getOrCreateCanvas]);

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel?: () => void } | null = null;
    let hasCanvasBackground = false;
    let renderStage = "init";

    const loadPdfBackground = async () => {
      const canvas = getOrCreateCanvas();
      if (!canvas) {
        return;
      }

      if (!url && !bytes) {
        pdfBytesRef.current = null;
        lineEditsRef.current.clear();
        lineBoxesRef.current = [];
        canvas.backgroundImage = undefined;
        canvas.clear();
        canvas.backgroundColor = "#ffffff";
        canvas.requestRenderAll();
        setStatus("idle");
        setErrorMessage(null);
        setUseNativePreview(false);
        setLineCount(0);
        setTextItemCount(0);
        setBoxesCount(0);
        return;
      }

      setStatus("loading");
      setErrorMessage(null);
      setUseNativePreview(false);
      pdfBytesRef.current = null;
      lineEditsRef.current.clear();
      lineBoxesRef.current = [];
      setLineCount(0);
      setTextItemCount(0);
      setBoxesCount(0);

      try {
        renderStage = "load-pdfjs";
        const pdfjs = (await import("pdfjs-dist/build/pdf.mjs")) as PdfJsModule;
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        renderStage = "read-pdf-bytes";
        let sourceBytes: Uint8Array;
        if (bytes?.byteLength) {
          sourceBytes = new Uint8Array(bytes);
        } else {
          if (!url) {
            throw new Error("No PDF source provided");
          }
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error("Unable to load PDF file");
          }
          sourceBytes = new Uint8Array(await response.arrayBuffer());
        }
        pdfBytesRef.current = new Uint8Array(sourceBytes);

        renderStage = "parse-pdf";
        const loadingTask = pdfjs.getDocument({ data: sourceBytes });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale });

        const pdfCanvas = document.createElement("canvas");
        const pdfContext = pdfCanvas.getContext("2d");
        if (!pdfContext) {
          throw new Error("PDF canvas context not available");
        }

        pdfCanvas.width = Math.floor(viewport.width);
        pdfCanvas.height = Math.floor(viewport.height);

        pdfContext.fillStyle = "#ffffff";
        pdfContext.fillRect(0, 0, pdfCanvas.width, pdfCanvas.height);

        renderStage = "render-page";
        renderTask = page.render({ canvasContext: pdfContext, viewport });
        await (renderTask as { promise: Promise<void> }).promise;

        if (cancelled) {
          return;
        }

        renderStage = "create-background";
        const dataUrl = pdfCanvas.toDataURL("image/png");

        const { width: pageWidth, height: pageHeight } = getFittedCanvasSize(
          pdfCanvas.width,
          pdfCanvas.height
        );
        canvas.setDimensions({ width: pageWidth, height: pageHeight });

        let backgroundImage: FabricImage;
        try {
          backgroundImage = await FabricImage.fromURL(dataUrl);
        } catch {
          const imageElement = document.createElement("img");
          imageElement.src = dataUrl;
          await imageElement.decode();
          backgroundImage = new FabricImage(imageElement);
        }
        backgroundImage.set({
          selectable: false,
          evented: false,
          left: 0,
          top: 0,
        });
        backgroundImage.scaleToWidth(pageWidth);

        canvas.backgroundImage = backgroundImage;
        canvas.requestRenderAll();
        hasCanvasBackground = true;

        try {
          renderStage = "extract-text";
          const textContent = await page.getTextContent();
          const items = textContent.items as Array<{
            str?: string;
            transform?: number[];
            width?: number;
            height?: number;
          }>;
          setTextItemCount(items.length);

          canvas.getObjects().forEach((obj) => {
            canvas.remove(obj);
          });

          const scaleFactor = pageWidth / pdfCanvas.width;
          const multiply = (m1: number[], m2: number[]) => [
            m1[0] * m2[0] + m1[2] * m2[1],
            m1[1] * m2[0] + m1[3] * m2[1],
            m1[0] * m2[2] + m1[2] * m2[3],
            m1[1] * m2[2] + m1[3] * m2[3],
            m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
            m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
          ];

          const lines: Array<{
            id: string;
            text: string;
            left: number;
            right: number;
            top: number;
            height: number;
            fontSize: number;
          }> = [];

          items.forEach((item, index) => {
            const text = item.str ?? "";
            if (!text.trim() || !item.transform) {
              return;
            }

            const tx = multiply(viewport.transform, item.transform);
            const rawX = tx[4];
            const rawY = tx[5];
            let rawFontHeight = Math.hypot(tx[0], tx[1]);
            if (!rawFontHeight || rawFontHeight < 0.5) {
              rawFontHeight = item.height && item.height > 0 ? item.height : 12;
            }
            let rawWidth =
              item.width && item.width > 0 ? item.width : text.length * rawFontHeight * 0.55;
            let rawHeight = item.height && item.height > 0 ? item.height : rawFontHeight;

            const left = rawX * scaleFactor;
            const top = (rawY - rawHeight) * scaleFactor;
            let width = rawWidth * scaleFactor;
            let height = rawHeight * scaleFactor;

            if (width <= 1 && text.trim()) {
              width = text.length * Math.max(rawFontHeight, 10) * 0.5 * scaleFactor;
            }

            if (height <= 0.5) {
              return;
            }

            const tolerance = Math.max(3, height * 0.6);
            let line = lines.find((candidate) => Math.abs(candidate.top - top) < tolerance);
            if (!line) {
              line = {
                id: `line-${index}-${Math.round(top)}`,
                text: text.trim(),
                left,
                right: left + width,
                top,
                height,
                fontSize: rawFontHeight * scaleFactor,
              };
              lines.push(line);
              return;
            }

            line.text = `${line.text} ${text.trim()}`.trim();
            line.left = Math.min(line.left, left);
            line.right = Math.max(line.right, left + width);
            line.height = Math.max(line.height, height);
            line.fontSize = Math.max(line.fontSize, rawFontHeight * scaleFactor);
          });

          if (!lines.length && items.length) {
            lineBoxesRef.current = items
              .map((item, index) => {
                const text = item.str ?? "";
                if (!text.trim() || !item.transform) {
                  return null;
                }
                const tx = multiply(viewport.transform, item.transform);
                let rawFontHeight = Math.hypot(tx[0], tx[1]);
                if (!rawFontHeight || rawFontHeight < 0.5) {
                  rawFontHeight = item.height && item.height > 0 ? item.height : 12;
                }
                let rawWidth =
                  item.width && item.width > 0 ? item.width : text.length * rawFontHeight * 0.55;
                let rawHeight = item.height && item.height > 0 ? item.height : rawFontHeight;
                const left = tx[4] * scaleFactor;
                const top = (tx[5] - rawHeight) * scaleFactor;
                let width = rawWidth * scaleFactor;
                let height = rawHeight * scaleFactor;
                if (width <= 1 && text.trim()) {
                  width = text.length * Math.max(rawFontHeight, 10) * 0.5 * scaleFactor;
                }
                if (height <= 0.5) {
                  return null;
                }
                return {
                  id: `item-${index}-${Math.round(left)}-${Math.round(top)}`,
                  text: text.trim(),
                  left,
                  top,
                  width: Math.max(6, width),
                  height: Math.max(12, height),
                  fontSize: Math.max(10, rawFontHeight * scaleFactor),
                };
              })
              .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
          } else {
            lineBoxesRef.current = lines.map((line) => {
              const rectWidth = Math.max(6, line.right - line.left);
              const rectHeight = Math.max(12, line.height);
              const rectTop = line.top - (rectHeight - line.height) / 2;
              return {
                id: line.id,
                text: line.text,
                left: line.left,
                top: rectTop,
                width: rectWidth,
                height: rectHeight,
                fontSize: Math.max(10, line.fontSize),
              };
            });
          }

          lineBoxesRef.current.forEach((line) => {
            const rect = new Rect({
              left: line.left,
              top: line.top,
              width: line.width,
              height: line.height,
              fill: "rgba(244,63,94,0.14)",
              stroke: "rgba(225,29,72,0.9)",
              strokeWidth: 1.5,
              selectable: true,
              hasControls: false,
              hasBorders: false,
              lockMovementX: true,
              lockMovementY: true,
              evented: true,
              hoverCursor: "text",
            });
            (rect as unknown as { data?: Record<string, unknown> }).data = {
              kind: "pdf-line",
              id: line.id,
              text: line.text,
              left: line.left,
              top: line.top,
              width: line.width,
              height: line.height,
              fontSize: line.fontSize,
            };
            canvas.add(rect);
          });
          canvas.requestRenderAll();

          setLineCount(lines.length);
          setBoxesCount(lineBoxesRef.current.length);
          if (!lines.length && !lineBoxesRef.current.length) {
            setErrorMessage("No selectable text detected in this PDF.");
          }
        } catch (textDetectionError) {
          lineEditsRef.current.clear();
          lineBoxesRef.current = [];
          setLineCount(0);
          setTextItemCount(0);
          setBoxesCount(0);
          const message =
            textDetectionError instanceof Error
              ? textDetectionError.message
              : "Text detection failed";
          setErrorMessage(`${message}. Auto text detection is unavailable for this PDF.`);
        }

        setStatus("ready");
      } catch (error) {
        if (cancelled) {
          return;
        }

        const canvas = getOrCreateCanvas();
        const errorText =
          error instanceof Error
            ? error.message
            : "Unable to render PDF";

        // If the page image rendered, keep editable canvas mode and only disable
        // auto-detected text boxes instead of forcing native preview fallback.
        if (canvas && hasCanvasBackground) {
          canvas.getObjects().forEach((obj) => canvas.remove(obj));
          canvas.requestRenderAll();
          lineEditsRef.current.clear();
          lineBoxesRef.current = [];
          setLineCount(0);
          setTextItemCount(0);
          setBoxesCount(0);
          setStatus("ready");
          setUseNativePreview(false);
          setErrorMessage(`${errorText}. Auto text detection is unavailable for this PDF.`);
          return;
        }

        if (canvas) {
          canvas.clear();
          canvas.backgroundImage = undefined;
          canvas.backgroundColor = "transparent";
          canvas.requestRenderAll();
        }
        lineEditsRef.current.clear();
        lineBoxesRef.current = [];
        setLineCount(0);
        setTextItemCount(0);
        setBoxesCount(0);

        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? `${renderStage}: ${error.message}. Showing native PDF preview instead.`
            : `${renderStage}: Unable to render PDF. Showing native PDF preview instead.`
        );
        setUseNativePreview(true);
      }
    };

    loadPdfBackground();

    return () => {
      cancelled = true;
      renderTask?.cancel?.();
    };
  }, [bytes, getFittedCanvasSize, getOrCreateCanvas, scale, url]);

  const parseColor = (value?: string | null) => {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    if (trimmed.startsWith("#")) {
      const hex = trimmed.slice(1);
      const normalized =
        hex.length === 3
          ? hex
              .split("")
              .map((char) => `${char}${char}`)
              .join("")
          : hex;
      if (normalized.length !== 6) {
        return null;
      }
      const numeric = Number.parseInt(normalized, 16);
      const r = (numeric >> 16) & 255;
      const g = (numeric >> 8) & 255;
      const b = numeric & 255;
      return { r: r / 255, g: g / 255, b: b / 255, alpha: 1 };
    }

    const match = trimmed.match(/rgba?\(([^)]+)\)/i);
    if (!match) {
      return null;
    }

    const parts = match[1].split(",").map((part) => part.trim());
    if (parts.length < 3) {
      return null;
    }

    const r = Number.parseFloat(parts[0]);
    const g = Number.parseFloat(parts[1]);
    const b = Number.parseFloat(parts[2]);
    const alpha = parts.length >= 4 ? Number.parseFloat(parts[3]) : 1;

    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
      return null;
    }

    return {
      r: Math.min(1, Math.max(0, r / 255)),
      g: Math.min(1, Math.max(0, g / 255)),
      b: Math.min(1, Math.max(0, b / 255)),
      alpha: Number.isNaN(alpha) ? 1 : Math.min(1, Math.max(0, alpha)),
    };
  };

  const exportPdf = useCallback(async (): Promise<Uint8Array | null> => {
    if (!pdfBytesRef.current) {
      return null;
    }
    if (!fabricRef.current) {
      return new Uint8Array(pdfBytesRef.current);
    }

    const pdfDoc = await PDFDocument.load(pdfBytesRef.current);
    const page = pdfDoc.getPage(0);
    const { width: pdfWidth, height: pdfHeight } = page.getSize();

    const canvas = fabricRef.current;
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    const scaleX = pdfWidth / canvasWidth;
    const scaleY = pdfHeight / canvasHeight;

    const objects = canvas.getObjects().filter((obj) => obj.visible !== false);

    objects.forEach((obj) => {
      if (obj.type === "textbox" || obj.type === "text") {
        const textObj = obj as Textbox;
        const text = textObj.text ?? "";
        if (!text.trim()) {
          return;
        }

        const left = textObj.left ?? 0;
        const top = textObj.top ?? 0;
        const fontSizeCanvas = (textObj.fontSize ?? 16) * (textObj.scaleY ?? 1);
        const fontSizePdf = fontSizeCanvas * scaleY;
        const maxWidth =
          (textObj.width ?? 0) * (textObj.scaleX ?? 1) * scaleX || undefined;
        const lineHeight = (textObj.lineHeight ?? 1.2) * fontSizePdf;
        const color = parseColor(textObj.fill as string);

        const originalRect = (
          (textObj as unknown as { data?: { originalRect?: { left: number; top: number; width: number; height: number } } })
            .data
        )?.originalRect;
        if (originalRect) {
          const padding = Math.max(1, originalRect.height * 0.12);
          const maskLeft = Math.max(0, originalRect.left - padding);
          const maskTop = Math.max(0, originalRect.top - padding);
          const maskWidth = originalRect.width + padding * 2;
          const maskHeight = originalRect.height + padding * 2;
          page.drawRectangle({
            x: maskLeft * scaleX,
            y: pdfHeight - maskTop * scaleY - maskHeight * scaleY,
            width: maskWidth * scaleX,
            height: maskHeight * scaleY,
            color: rgb(1, 1, 1),
            opacity: 1,
          });
        }

        page.drawText(text, {
          x: left * scaleX,
          y: pdfHeight - top * scaleY - fontSizePdf,
          size: fontSizePdf,
          maxWidth,
          lineHeight,
          color: color ? rgb(color.r, color.g, color.b) : rgb(0, 0, 0),
          opacity: color?.alpha ?? 1,
        });
        return;
      }

      if (obj.type === "rect") {
        const rect = obj as Rect;
        if (((rect as unknown as { data?: { kind?: string } }).data)?.kind === "pdf-line") {
          return;
        }
        const width = (rect.width ?? 0) * (rect.scaleX ?? 1);
        const height = (rect.height ?? 0) * (rect.scaleY ?? 1);
        if (width <= 0 || height <= 0) {
          return;
        }

        const left = rect.left ?? 0;
        const top = rect.top ?? 0;
        const fillColor = parseColor(rect.fill as string);
        const strokeColor = parseColor(rect.stroke as string);
        const strokeWidth = (rect.strokeWidth ?? 0) * scaleX;

        page.drawRectangle({
          x: left * scaleX,
          y: pdfHeight - top * scaleY - height * scaleY,
          width: width * scaleX,
          height: height * scaleY,
          color: fillColor ? rgb(fillColor.r, fillColor.g, fillColor.b) : undefined,
          opacity: fillColor?.alpha ?? 1,
          borderColor: strokeColor ? rgb(strokeColor.r, strokeColor.g, strokeColor.b) : undefined,
          borderOpacity: strokeColor?.alpha ?? 1,
          borderWidth: strokeWidth,
        });
      }
    });

    return pdfDoc.save();
  }, []);

  useImperativeHandle(ref, () => ({ exportPdf, addTextBox, addRectangle }), [exportPdf, addTextBox, addRectangle]);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col bg-white">
      {/* Canvas container — fills all remaining height */}
      <div
        ref={scrollRef}
        onWheel={(event) => {
          if (!scrollRef.current) return;
          scrollRef.current.scrollTop += event.deltaY;
          scrollRef.current.scrollLeft += event.deltaX;
        }}
        className="relative flex min-h-0 flex-1 flex-col overflow-auto bg-white"
      >
        {/* Empty state */}
        {!url && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10">
            <svg viewBox="0 0 48 48" fill="none" className="h-14 w-14 text-gray-300">
              <rect x="8" y="6" width="32" height="36" rx="4" stroke="currentColor" strokeWidth="2" />
              <path d="M16 16h16M16 22h16M16 28h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400">No PDF loaded</p>
            <p className="text-xs text-gray-400">Upload a PDF to start editing</p>
            <label className="inline-flex cursor-pointer items-center rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(220,38,38,0.3)] transition hover:bg-red-700">
              Upload PDF
              <input type="file" accept="application/pdf,.pdf" onChange={onUploadPdf} className="hidden" />
            </label>
          </div>
        )}

        {/* Native PDF preview */}
        {useNativePreview && (
          <iframe
            src={previewUrl}
            title="PDF Preview"
            className="flex-1 border-0 bg-white"
            style={{ minHeight: "80vh" }}
          />
        )}

        {/* Loading overlay */}
        {status === "loading" && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Loading PDF</span>
            </div>
          </div>
        )}

        {/* Error */}
        {errorMessage && (
          <div className="absolute left-3 top-3 z-20 flex max-w-[280px] items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 shadow-sm">
            <svg viewBox="0 0 16 16" fill="none" className="mt-0.5 h-3.5 w-3.5 shrink-0">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {errorMessage}
          </div>
        )}

        {/* Editable badge */}
        {status === "ready" && !useNativePreview && textItemCount > 0 && (
          <div className="absolute right-3 top-3 z-20 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-red-600">
            {boxesCount} editable
          </div>
        )}

        {/* Fabric canvas host */}
        {!useNativePreview && (
          <div ref={canvasHostRef} className="relative z-10 w-full" />
        )}
      </div>
    </div>
  );
});

export default PdfCanvas;
