"use client";

import React from "react";
import { Card, Flex, Grid, theme } from "antd";

const { useToken } = theme;
const { useBreakpoint } = Grid;

export interface SearchBarProps {
    children?: React.ReactNode;
    style?: React.CSSProperties;
    bodyStyle?: React.CSSProperties;
}

/**
 * A standardized search and filter container.
 * Recommended structure:
 * <SearchBar>
 *   <SearchInput ... />
 *   <Flex wrap="wrap" gap={12}>
 *     <ModalSelector ... />
 *     <span>Results: 10</span>
 *   </Flex>
 * </SearchBar>
 */
export const SearchBar = ({ children, style, bodyStyle }: SearchBarProps) => {
    const { token } = useToken();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    return (
        <Card
            size="small"
            style={{ 
                borderRadius: isMobile ? 14 : 16,
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorderSecondary}`,
                animation: 'slideDown 0.4s ease-out',
                marginTop: 0,
                ...style
            }}
            bodyStyle={{ 
                padding: isMobile ? 16 : 20,
                ...bodyStyle 
            }}
        >
            <Flex vertical gap={isMobile ? 12 : 16}>
                {children}
            </Flex>
        </Card>
    );
};
