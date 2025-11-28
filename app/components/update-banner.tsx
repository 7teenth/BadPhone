"use client";

import React, { useEffect, useState } from "react";

export default function UpdateBanner() {
  const [available, setAvailable] = useState<any | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const upd = (data: any) => {
      setAvailable(data || {});
      setVisible(true);
      setDownloaded(false);
      setProgress(null);
    };

    const onProgress = (p: any) => {
      const percent = Math.round(
        p.percent || (p.percent === 0 ? 0 : (p as any).percent || 0)
      );
      setProgress(percent);
    };

    const onDownloaded = (info: any) => {
      setDownloaded(true);
      setProgress(100);
    };

    const onError = (err: any) => {
      console.error("Updater error (renderer):", err);
    };

    if (typeof window !== "undefined" && (window as any).electronUpdater) {
      (window as any).electronUpdater.on("update-available", upd);
      (window as any).electronUpdater.on("download-progress", onProgress);
      (window as any).electronUpdater.on("update-downloaded", onDownloaded);
      (window as any).electronUpdater.on("update-error", onError);
    }

    return () => {
      // No easy way to remove listeners via our bridge currently
    };
  }, []);

  const checkNow = () => {
    (window as any).electronUpdater?.send("updater:check");
  };

  const downloadNow = () => {
    (window as any).electronUpdater?.send("updater:download");
  };

  const installNow = () => {
    (window as any).electronUpdater?.send("updater:install");
  };

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className="bg-white border shadow-md rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="text-sm font-medium">Нове оновлення доступне</div>
            <div className="text-xs text-gray-500 mt-1">
              Версія: {available?.version || available?.releaseName || "—"}
            </div>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-xs text-gray-500 hover:text-gray-700"
            aria-label="Закрити"
          >
            ✕
          </button>
        </div>

        {progress !== null ? (
          <div className="w-full">
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                style={{ width: `${progress}%` }}
                className="h-2 bg-green-500"
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Завантажено: {progress}%
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-700">
            Оновлення готове до завантаження.
          </div>
        )}

        <div className="flex items-center gap-2 justify-end">
          {!downloaded && (
            <>
              <button
                onClick={downloadNow}
                className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
              >
                Завантажити зараз
              </button>
              <button
                onClick={() => setVisible(false)}
                className="px-3 py-1 rounded border text-sm"
              >
                Пізніше
              </button>
            </>
          )}

          {downloaded && (
            <>
              <button
                onClick={installNow}
                className="px-3 py-1 rounded bg-green-600 text-white text-sm"
              >
                Встановити зараз
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
