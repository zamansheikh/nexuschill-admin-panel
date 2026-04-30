'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

import type { CosmeticAssetType } from '@/types';

// lottie-react renders fine with SSR (uses lazy effects), but we lazy-load
// it to keep the Lottie runtime out of the initial admin bundle.
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface Props {
  assetUrl: string;
  assetType: CosmeticAssetType;
  /** Used for image fallback (PNG/JPG) when assetType is 'none' or 'image'. */
  previewUrl?: string;
  className?: string;
}

/**
 * Renders the animated cosmetic asset in the admin panel:
 *   • svga    → SVGAPlayer (dynamic import, dom-ref + canvas via div selector)
 *   • lottie  → lottie-react with auto-loaded JSON
 *   • mp4     → autoplay muted looping <video>
 *   • image   → <img>
 *   • none    → previewUrl fallback or empty state
 *
 * Sized by the parent — pass a className with width/height/aspect.
 */
export default function AssetPreview({
  assetUrl,
  assetType,
  previewUrl,
  className = 'h-48 w-48 rounded-lg bg-slate-100',
}: Props) {
  if (assetType === 'svga' && assetUrl) {
    return <SvgaPlayer url={assetUrl} className={className} />;
  }
  if (assetType === 'lottie' && assetUrl) {
    return <LottiePreview url={assetUrl} className={className} />;
  }
  if (assetType === 'mp4' && assetUrl) {
    return (
      <video
        src={assetUrl}
        autoPlay
        loop
        muted
        playsInline
        className={`object-contain ${className}`}
      />
    );
  }
  // image / none → static fallback
  const url = previewUrl || (assetType === 'image' ? assetUrl : '');
  if (url) {
    return <img src={url} alt="" className={`object-cover ${className}`} />;
  }
  return (
    <div
      className={`flex items-center justify-center text-xs text-slate-400 ${className}`}
    >
      No preview
    </div>
  );
}

function LottiePreview({ url, className }: { url: string; className: string }) {
  const [data, setData] = useState<unknown | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancel = false;
    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        if (!cancel) setData(j);
      })
      .catch((e) => {
        if (!cancel) setError(String(e));
      });
    return () => {
      cancel = true;
    };
  }, [url]);

  if (error) {
    return (
      <div className={`flex items-center justify-center text-xs text-red-500 ${className}`}>
        Lottie load failed
      </div>
    );
  }
  if (!data) {
    return (
      <div className={`flex items-center justify-center text-xs text-slate-400 ${className}`}>
        Loading…
      </div>
    );
  }
  return (
    <div className={className}>
      <Lottie animationData={data} loop autoplay />
    </div>
  );
}

/**
 * SVGA player — dynamically imports svgaplayerweb on the client so SSR
 * doesn't try to evaluate its `window`-touching code. The library expects
 * a CSS selector pointing at a div; it inserts its own <canvas> inside.
 */
function SvgaPlayer({ url, className }: { url: string; className: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let player: any = null;
    let cancelled = false;

    (async () => {
      const mod: any = await import('svgaplayerweb');
      if (cancelled || !ref.current) return;

      const SVGA = mod.default ?? mod;
      try {
        const PlayerCtor = SVGA.Player;
        const ParserCtor = SVGA.Parser;
        if (!PlayerCtor || !ParserCtor) {
          setError('svgaplayerweb missing Player/Parser exports');
          return;
        }
        player = new PlayerCtor(ref.current);
        const parser = new ParserCtor(ref.current);
        player.loops = 0; // infinite

        parser.load(
          url,
          (videoItem: unknown) => {
            if (cancelled || !player) return;
            player.setVideoItem(videoItem);
            player.startAnimation();
          },
          (err: unknown) => {
            if (!cancelled) setError(`SVGA load failed: ${String(err)}`);
          },
        );
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    })();

    return () => {
      cancelled = true;
      try {
        player?.stopAnimation?.();
        player?.clear?.();
      } catch {
        /* ignore */
      }
      // svgaplayerweb inserts a child canvas into our ref div — wipe it on
      // unmount so re-mounting doesn't end up with stacked canvases.
      const node = ref.current;
      if (node) {
        while (node.firstChild) node.removeChild(node.firstChild);
      }
    };
  }, [url]);

  if (error) {
    return (
      <div className={`flex items-center justify-center text-center text-xs text-red-500 ${className}`}>
        {error}
      </div>
    );
  }
  return <div ref={ref} className={className} />;
}
