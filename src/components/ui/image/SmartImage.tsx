"use client";

import React from "react";
import NextImage, { ImageProps } from "next/image";
import { isInlineImageSource, resolveImageSource } from "../../../utils/image/source";

type SmartImageProps = Omit<ImageProps, "src"> & {
    src?: string | null;
    fallbackSrc?: string;
};

export default function SmartImage({ src, fallbackSrc, alt, style, fill, ...rest }: SmartImageProps) {
    const resolvedSource = resolveImageSource(src, fallbackSrc);
    if (!resolvedSource) return null;

    if (isInlineImageSource(resolvedSource)) {
        const inlineStyle: React.CSSProperties = fill
            ? {
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                ...style,
            }
            : {
                ...style,
            };

        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={resolvedSource}
                alt={alt || ""}
                style={inlineStyle}
                {...(rest as React.ImgHTMLAttributes<HTMLImageElement>)}
            />
        );
    }

    return (
        <NextImage
            src={resolvedSource}
            alt={alt || ""}
            fill={fill}
            style={style}
            {...rest}
        />
    );
}
