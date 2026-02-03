import type { FC } from 'react';
import { useMemo, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, type Transition } from 'framer-motion';

/** Parallax source: src/assets/parallax-two. Layers: layer-0.png, layer-1.png, … (PNG/SVG). Attribution: html.attribution (required by license). */
const PARALLAX_LAYERS_GLOB = import.meta.glob<{ default: string }>(
  '../assets/parallax-two/*.{png,svg}',
  { eager: true, query: '?url', import: 'default' }
);

const ATTRIBUTION_RAW = import.meta.glob<{ default: string }>(
  '../assets/parallax-two/html.attribution',
  { eager: true, query: '?raw', import: 'default' }
);

const HERO_TEXT_ENTRY_DELAY_SECONDS = 1;
const PARALLAX_SCROLL_RANGE_PX = 400;
const MAX_LAYERS = 12;

/** Over-and-under parallax: 500px scroll range */
const PARALLAX_SCROLL_RANGE = 500;
const OPACITY_FADE_RANGE = 300;

const MOBILE_BREAKPOINT_PX = 768;

/** Entry animation config for the hero title and subtitle. */
interface HeroTextAnimationProps {
  initial: { opacity: number; y: number };
  animate: { opacity: number; y: number };
  transition: Transition;
}

function getAttributionHtml(): string {
  const key = Object.keys(ATTRIBUTION_RAW).find((k) => k.endsWith('html.attribution'));
  if (!key) return '';
  const value = ATTRIBUTION_RAW[key];
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'default' in value) return (value as { default: string }).default;
  return '';
}

function getSortedLayerUrls(): string[] {
  const entries = Object.entries(PARALLAX_LAYERS_GLOB);
  entries.sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
  return entries
    .map(([, url]) => (typeof url === 'string' ? url : (url as { default: string }).default))
    .filter(Boolean);
}

/**
 * Hero: parallax banner with title, subtitle, and optional layer images.
 * Parallax is disabled or simplified on mobile to avoid jitter.
 */
const Hero: FC = () => {
  const layerUrls = useMemo(getSortedLayerUrls, []);
  const attributionHtml = useMemo(getAttributionHtml, []);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT_PX);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`);
    const handleChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  /** Track entire window scroll (default: no container) */
  const { scrollY } = useScroll();

  const scrollProgress = useTransform(scrollY, [0, PARALLAX_SCROLL_RANGE_PX], [0, 1]);

  /** Aurora: moves slower than scroll. On mobile use reduced range to avoid jitter; set to 0 if lag occurs. */
  const yBackground = useTransform(scrollY, [0, PARALLAX_SCROLL_RANGE], [0, 150]);
  const yBackgroundMobile = useTransform(scrollY, [0, 200], [0, 20]);
  /** Title: moves downward slower for "overlap" effect — disabled on mobile */
  const yTitle = useTransform(scrollY, [0, PARALLAX_SCROLL_RANGE], [0, 150]);
  /** Subtitle: moves upward faster to go under title — disabled on mobile */
  const ySubtitle = useTransform(scrollY, [0, PARALLAX_SCROLL_RANGE], [0, -100]);
  /** Fade-out as elements exit Hero — disabled on mobile */
  const opacity = useTransform(scrollY, [0, OPACITY_FADE_RANGE], [1, 0]);

  const y0 = useTransform(scrollProgress, [0, 1], [0, 0]);
  const y1 = useTransform(scrollProgress, [0, 1], [0, -20]);
  const y2 = useTransform(scrollProgress, [0, 1], [0, -40]);
  const y3 = useTransform(scrollProgress, [0, 1], [0, -60]);
  const y4 = useTransform(scrollProgress, [0, 1], [0, -80]);
  const y5 = useTransform(scrollProgress, [0, 1], [0, -100]);
  const y6 = useTransform(scrollProgress, [0, 1], [0, -115]);
  const y7 = useTransform(scrollProgress, [0, 1], [0, -130]);
  const y8 = useTransform(scrollProgress, [0, 1], [0, -145]);
  const y9 = useTransform(scrollProgress, [0, 1], [0, -160]);
  const y10 = useTransform(scrollProgress, [0, 1], [0, -175]);
  const y11 = useTransform(scrollProgress, [0, 1], [0, -190]);
  const layerYTransforms = [y0, y1, y2, y3, y4, y5, y6, y7, y8, y9, y10, y11];

  const titleAnimation: HeroTextAnimationProps = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.7,
      delay: HERO_TEXT_ENTRY_DELAY_SECONDS,
      ease: 'easeOut',
    },
  };

  const subtitleAnimation: HeroTextAnimationProps = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.6,
      delay: HERO_TEXT_ENTRY_DELAY_SECONDS + 0.15,
      ease: 'easeOut',
    },
  };

  const layersToRender = layerUrls.slice(0, MAX_LAYERS);
  const hasLayers = layersToRender.length > 0;

  return (
    <section className="hero-parallax-section" aria-label="Hero">
      <div className="hero-parallax-layers">
        {hasLayers ? (
          layersToRender.map((src, index) => (
            <motion.img
              key={`layer-${index}-${src}`}
              src={src}
              alt=""
              className="hero-parallax-layer-image"
              loading="eager"
              decoding="async"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                zIndex: index,
                y: layerYTransforms[index],
                willChange: 'transform',
              }}
            />
          ))
        ) : (
          <div
            className="hero-parallax-placeholder"
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
              zIndex: 0,
            }}
          />
        )}
      </div>

      <motion.div
        className="hero-parallax-aurora"
        aria-hidden
        style={{
          y: isMobile ? yBackgroundMobile : yBackground,
        }}
      />

      <motion.div
        className="hero-decorative-graph"
        aria-hidden
        style={{
          y: isMobile ? 0 : yTitle,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: HERO_TEXT_ENTRY_DELAY_SECONDS + 0.3 }}
      >
        <motion.div
          className="hero-decorative-graph__float"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <svg
            className="hero-decorative-graph__svg"
            viewBox="0 0 120 60"
            preserveAspectRatio="none"
            fill="none"
          >
            <defs>
              <linearGradient
                id="hero-chart-area-gradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
            </defs>
            {/* Area fill – distinct unequal peaks/valleys */}
            <motion.path
              className="hero-decorative-graph__area"
              d="M 0 50 L 12 38 L 24 52 L 36 30 L 48 44 L 60 20 L 72 40 L 84 28 L 96 46 L 108 16 L 120 34 L 120 60 L 0 60 Z"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 1.2,
                delay: HERO_TEXT_ENTRY_DELAY_SECONDS + 0.8,
                ease: 'easeOut',
              }}
              style={{ fill: 'url(#hero-chart-area-gradient)' }}
            />
            {/* Sharp line chart – jagged L commands, unequal peaks/valleys */}
            <motion.path
              className="hero-decorative-graph__path"
              d="M 0 50 L 12 38 L 24 52 L 36 30 L 48 44 L 60 20 L 72 40 L 84 28 L 96 46 L 108 16 L 120 34"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 1.8,
                delay: HERO_TEXT_ENTRY_DELAY_SECONDS + 0.5,
                ease: 'easeOut',
              }}
            />
            {/* Peak highlight dots */}
            <motion.circle
              className="hero-decorative-graph__dot"
              cx={12}
              cy={38}
              r={2}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: HERO_TEXT_ENTRY_DELAY_SECONDS + 2,
                duration: 0.3,
              }}
            />
            <motion.circle
              className="hero-decorative-graph__dot"
              cx={36}
              cy={30}
              r={2}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: HERO_TEXT_ENTRY_DELAY_SECONDS + 2.2,
                duration: 0.3,
              }}
            />
            <motion.circle
              className="hero-decorative-graph__dot"
              cx={108}
              cy={16}
              r={2}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: HERO_TEXT_ENTRY_DELAY_SECONDS + 2.4,
                duration: 0.3,
              }}
            />
          </svg>
        </motion.div>
      </motion.div>

      <div className="hero-parallax-content">
        <motion.h1
          className="hero-parallax-title"
          initial={titleAnimation.initial}
          animate={titleAnimation.animate}
          transition={titleAnimation.transition}
          style={{
            y: isMobile ? 0 : yTitle,
            opacity: isMobile ? 1 : opacity,
          }}
        >
          Cryptonite
        </motion.h1>
        <motion.p
          className="hero-parallax-subtitle"
          initial={subtitleAnimation.initial}
          animate={subtitleAnimation.animate}
          transition={subtitleAnimation.transition}
          style={{
            y: isMobile ? 0 : ySubtitle,
            opacity: isMobile ? 1 : opacity,
          }}
        >
          Track your favorite cryptocurrencies in real-time
        </motion.p>
      </div>

      {attributionHtml && (
        <div
          className="hero-attribution"
          aria-label="Image attribution"
          dangerouslySetInnerHTML={{ __html: attributionHtml }}
        />
      )}
    </section>
  );
};

export default Hero;
