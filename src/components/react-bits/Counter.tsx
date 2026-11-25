"use client";

import React from "react";
import { motion, useSpring, useTransform, type MotionValue } from "motion/react";

/**
 * Animated odometer-style number (adapted from the react-bits Counter
 * used in SAT Nexus). Digits roll with a spring whenever the value changes.
 */

type PlaceValue = number | ".";

function Number({ mv, number, height }: { mv: MotionValue<number>; number: number; height: number }) {
  const y = useTransform(mv, (latest) => {
    const placeValue = latest % 10;
    const offset = (10 + number - placeValue) % 10;
    let memo = offset * height;
    if (offset > 5) memo -= 10 * height;
    return memo;
  });
  return (
    <motion.span className="counter-number" style={{ y }}>
      {number}
    </motion.span>
  );
}

function normalizeNearInteger(num: number): number {
  const nearest = Math.round(num);
  const tolerance = 1e-9 * Math.max(1, Math.abs(num));
  return Math.abs(num - nearest) < tolerance ? nearest : num;
}

function getValueRoundedToPlace(value: number, place: number): number {
  return Math.floor(normalizeNearInteger(value / place));
}

function derivePlaces(value: number): PlaceValue[] {
  return [...value.toString()].map((ch, i, chars) => {
    if (ch === ".") return ".";
    const dotIndex = chars.indexOf(".");
    const isInteger = dotIndex === -1;
    const exponent = isInteger
      ? chars.length - i - 1
      : i < dotIndex
        ? dotIndex - i - 1
        : -(i - dotIndex);
    return 10 ** exponent;
  });
}

function AnimatedDigit({
  place,
  value,
  height,
}: { place: number; value: number; height: number }) {
  const valueRoundedToPlace = getValueRoundedToPlace(value, place);
  const animatedValue = useSpring(valueRoundedToPlace, { stiffness: 190, damping: 24, mass: 0.7 });
  React.useEffect(() => {
    animatedValue.set(valueRoundedToPlace);
  }, [animatedValue, valueRoundedToPlace]);
  return (
    <span className="counter-digit" style={{ height }}>
      {Array.from({ length: 10 }, (_, i) => (
        <Number key={i} mv={animatedValue} number={i} height={height} />
      ))}
    </span>
  );
}

export function Counter({
  value,
  fontSize = 28,
  padding = 0,
  gap = 4,
  className,
}: {
  value: number;
  fontSize?: number;
  padding?: number;
  gap?: number;
  className?: string;
}) {
  const height = fontSize;
  const places = derivePlaces(value);

  return (
    <span
      className={`counter-root ${className ?? ""}`}
      style={{ fontSize, lineHeight: 1, display: "inline-flex", alignItems: "center", gap }}
    >
      {padding > 0 && <span style={{ width: padding }} />}
      {places.map((place, i) =>
        place === "." ? (
          <span key={i} className="counter-digit" style={{ height, width: "fit-content" }}>
            .
          </span>
        ) : (
          <AnimatedDigit key={`${place}-${i}`} place={place} value={value} height={height} />
        ),
      )}
    </span>
  );
}
