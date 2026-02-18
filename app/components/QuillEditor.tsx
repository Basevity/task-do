"use client";

import { useRef, useEffect } from "react";
import "quill/dist/quill.snow.css";

interface QuillEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function QuillEditor({ value, onChange, placeholder, className = "" }: QuillEditorProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<InstanceType<typeof import("quill").default> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const initialValueRef = useRef(value);

  useEffect(() => {
    if (!toolbarRef.current || !editorRef.current) return;
    const toolbarEl = toolbarRef.current;
    const editorEl = editorRef.current;
    editorEl.innerHTML = "";

    Promise.all([
      import("quill"),
      import("quill/formats/color.js"),
      import("quill/formats/background.js"),
      import("quill/formats/size.js"),
      import("quill/formats/header.js"),
      import("quill/formats/font.js"),
    ]).then(([QuillModule, colorMod, backgroundMod, sizeMod, headerMod, fontMod]) => {
      const Q = QuillModule.default;
      const Quill = Q as typeof Q & { register: (formats: Record<string, unknown>, overwrite?: boolean) => void };
      Quill.register(
        {
          "formats/color": (colorMod as { ColorStyle: unknown }).ColorStyle,
          "formats/background": (backgroundMod as { BackgroundStyle: unknown }).BackgroundStyle,
          "formats/size": (sizeMod as { SizeClass: unknown }).SizeClass,
          "formats/header": (headerMod as { default: unknown }).default,
          "formats/font": (fontMod as { FontClass: unknown }).FontClass,
        },
        true
      );
      const safeIndentHandler = function (this: { quill: InstanceType<typeof Q> }, value: string) {
        this.quill.focus();
        const range = this.quill.getSelection();
        if (range == null) return;
        const formats = this.quill.getFormat(range) as { indent?: number; direction?: string };
        const indent = parseInt(String(formats?.indent ?? 0), 10);
        if (value === "+1" || value === "-1") {
          let modifier = value === "+1" ? 1 : -1;
          if (formats?.direction === "rtl") modifier *= -1;
          this.quill.format("indent", indent + modifier, Q.sources.USER);
        }
      };
      const safeListHandler = function (
        this: { quill: InstanceType<typeof Q> },
        value: string
      ) {
        this.quill.focus();
        const range = this.quill.getSelection();
        if (range == null) return;
        const formats = this.quill.getFormat(range) as { list?: string };
        if (value === "check") {
          if (formats?.list === "checked" || formats?.list === "unchecked") {
            this.quill.format("list", false, Q.sources.USER);
          } else {
            this.quill.format("list", "unchecked", Q.sources.USER);
          }
        } else {
          this.quill.format("list", value, Q.sources.USER);
        }
      };
      const q = new Q(editorEl, {
        theme: "snow",
        placeholder: placeholder ?? "Add a description...",
        modules: {
          toolbar: {
            container: toolbarEl,
            handlers: {
              indent: safeIndentHandler,
              list: safeListHandler,
            },
          },
        },
      });
      quillRef.current = q;
      if (initialValueRef.current) {
        q.clipboard.dangerouslyPasteHTML(initialValueRef.current);
      }
      q.on("text-change", () => {
        const html = q.root.innerHTML;
        if (html !== "<p><br></p>") onChangeRef.current(html);
        else onChangeRef.current("");
      });
    });

    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
      editorEl.innerHTML = "";
    };
  }, []);

  return (
    <div className={`quill-custom ${className}`}>
      <div
        ref={toolbarRef}
        className="ql-toolbar ql-snow"
        aria-label="Formatting"
        onMouseDown={(e) => e.preventDefault()}
      >
        <span className="ql-formats">
          <select className="ql-header" aria-label="Heading" defaultValue="">
            <option value="">Normal</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
          </select>
        </span>
        <span className="ql-formats">
          <select className="ql-font" aria-label="Font">
            <option value="">Sans Serif</option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
          </select>
          <select className="ql-size" aria-label="Size">
            <option value="small">Small</option>
            <option value="">Normal</option>
            <option value="large">Large</option>
            <option value="huge">Huge</option>
          </select>
        </span>
        <span className="ql-formats">
          <button type="button" className="ql-bold" aria-label="Bold" />
          <button type="button" className="ql-italic" aria-label="Italic" />
          <button type="button" className="ql-underline" aria-label="Underline" />
          <button type="button" className="ql-strike" aria-label="Strikethrough" />
        </span>
        <span className="ql-formats">
          <select className="ql-color" aria-label="Text color" />
          <select className="ql-background" aria-label="Background color" />
        </span>
        <span className="ql-formats">
          <button type="button" className="ql-list" value="ordered" aria-label="Ordered list" />
          <button type="button" className="ql-list" value="bullet" aria-label="Bullet list" />
          <button type="button" className="ql-list" value="check" aria-label="Check list" />
        </span>
        <span className="ql-formats">
          <button type="button" className="ql-indent" value="-1" aria-label="Outdent" />
          <button type="button" className="ql-indent" value="+1" aria-label="Indent" />
        </span>
        <span className="ql-formats">
          <select className="ql-align" aria-label="Alignment" />
        </span>
        <span className="ql-formats">
          <button type="button" className="ql-link" aria-label="Link" />
          <button type="button" className="ql-image" aria-label="Image" />
          <button type="button" className="ql-video" aria-label="Video" />
        </span>
        <span className="ql-formats">
          <button type="button" className="ql-clean" aria-label="Clear formatting" />
        </span>
      </div>
      <div ref={editorRef} className="quill-editor-area" />
    </div>
  );
}
