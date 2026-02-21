"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Avatar } from "antd";
import SmartImage from "./SmartImage";
import { resolveImageSource } from "../../../utils/image/source";

interface SmartAvatarProps {
    src?: string | null;
    alt?: string;
    size?: number;
    shape?: "circle" | "square";
    icon?: React.ReactNode;
    borderRadius?: number;
    style?: React.CSSProperties;
    imageStyle?: React.CSSProperties;
}

export default function SmartAvatar({
    src,
    alt = "",
    size = 40,
    shape = "circle",
    icon,
    borderRadius,
    style,
    imageStyle,
}: SmartAvatarProps) {
    const [hasError, setHasError] = useState(false);
    const resolvedSource = useMemo(() => resolveImageSource(src), [src]);

    useEffect(() => {
        setHasError(false);
    }, [resolvedSource]);

    const imageNode =
        resolvedSource && !hasError ? (
            <SmartImage
                src={resolvedSource}
                alt={alt}
                width={size}
                height={size}
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius,
                    ...imageStyle,
                }}
                onError={() => setHasError(true)}
            />
        ) : null;

    return (
        <Avatar
            src={imageNode || undefined}
            shape={shape}
            size={size}
            icon={icon}
            style={{
                borderRadius,
                ...style,
            }}
        />
    );
}
