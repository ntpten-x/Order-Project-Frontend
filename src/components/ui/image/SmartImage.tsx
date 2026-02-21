"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import NextImage, { ImageProps } from "next/image";
import { isGoogleDriveImageSource, isInlineImageSource, resolveImageSource } from "../../../utils/image/source";

type SmartImageProps = Omit<ImageProps, "src"> & {
    src?: string | null;
    fallbackSrc?: string;
};

export default function SmartImage({ src, fallbackSrc, alt, style, fill, ...rest }: SmartImageProps) {
    const [hasError, setHasError] = useState(false);
    const resolvedSource = useMemo(() => resolveImageSource(src, fallbackSrc), [src, fallbackSrc]);
    const { onError, ...imageProps } = rest;

    useEffect(() => {
        setHasError(false);
    }, [resolvedSource]);

    const handleError = useCallback(
        (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
            setHasError(true);
            onError?.(event);
        },
        [onError]
    );

    if (!resolvedSource || hasError) return null;

    // Bypass Next/Image optimization for inline images and Google Drive links.
    // Drive links can return non-image responses/redirects that Next's optimizer rejects,
    // while the browser <img> path is more tolerant.
    if (isInlineImageSource(resolvedSource) || isGoogleDriveImageSource(resolvedSource)) {
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
                onError={handleError}
                {...(imageProps as React.ImgHTMLAttributes<HTMLImageElement>)}
            />
        );
    }

    return (
        <NextImage
            src={resolvedSource}
            alt={alt || ""}
            fill={fill}
            style={style}
            onError={handleError}
            {...imageProps}
        />
    );
}
