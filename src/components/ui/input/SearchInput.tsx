"use client";

import React from "react";
import { Input, Button, theme } from "antd";
import { SearchOutlined, ClearOutlined } from "@ant-design/icons";

const { useToken } = theme;

export interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onClear?: () => void;
    placeholder?: string;
    style?: React.CSSProperties;
    size?: 'small' | 'middle' | 'large';
    allowClear?: boolean;
}

export const SearchInput = ({ 
    value, 
    onChange, 
    onClear, 
    placeholder = "ค้นหา...", 
    style,
    size = 'large',
    allowClear = true
}: SearchInputProps) => {
    const { token } = useToken();

    return (
        <Input
            size={size}
            placeholder={placeholder}
            prefix={<SearchOutlined style={{ color: token.colorTextSecondary }} />}
            suffix={
                allowClear && value ? (
                    <Button
                        type="text"
                        size="small"
                        icon={<ClearOutlined />}
                        onClick={() => {
                            onChange('');
                            onClear?.();
                        }}
                        style={{ 
                            color: token.colorTextSecondary,
                            padding: 0,
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    />
                ) : null
            }
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            style={{
                borderRadius: 12,
                fontSize: 15,
                ...style
            }}
        />
    );
};
