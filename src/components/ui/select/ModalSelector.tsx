"use client";

import React, { useMemo, useState } from "react";
import { Button, Grid, Input, Modal, Spin } from "antd";
import { CheckCircleOutlined, DownOutlined, SearchOutlined } from "@ant-design/icons";

export type ModalSelectorProps<T extends string | number = string | number> = {
    options: { label: React.ReactNode; value: T; searchLabel?: string }[];
    title: string;
    placeholder?: string;
    style?: React.CSSProperties;
    disabled?: boolean;
    showSearch?: boolean;
    loading?: boolean;
    trigger?: React.ReactNode;
} & (
    | {
        multiple: true;
        value?: T[];
        onChange: (value: T[]) => void;
        onConfirm?: (value: T[]) => void;
      }
    | {
        multiple?: false;
        value?: T;
        onChange: (value: T) => void;
        onConfirm?: never;
      }
);

export const ModalSelector = <T extends string | number,>({
    value,
    options,
    onChange,
    title,
    placeholder = "เลือกข้อมูล",
    style,
    disabled = false,
    showSearch = false,
    loading = false,
    multiple = false,
    trigger,
    onConfirm
}: ModalSelectorProps<T>) => {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.sm;
    const [open, setOpen] = useState(false);
    const [searchText, setSearchText] = useState("");

    const filteredOptions = useMemo(() => {
        if (!showSearch || !searchText) return options;
        const lowerSearch = searchText.toLowerCase();
        return options.filter(opt => {
            const searchTarget = opt.searchLabel || (typeof opt.label === 'string' ? opt.label : String(opt.value));
            return searchTarget.toLowerCase().includes(lowerSearch);
        });
    }, [options, searchText, showSearch]);

    const isSelected = (val: T) => {
        if (multiple && Array.isArray(value)) {
            return value.includes(val);
        }
        return value === val;
    };

    const selectedOptions = options.filter(o => isSelected(o.value));
    const selectedOption = selectedOptions[0];

    const handleSelect = (val: T) => {
        if (multiple) {
            const currentArray = Array.isArray(value) ? value : [];
            const nextArray = currentArray.includes(val)
                ? currentArray.filter(v => v !== val)
                : [...currentArray, val];
            (onChange as (value: T[]) => void)(nextArray);
        } else {
            (onChange as (value: T) => void)(val);
            setOpen(false);
            setSearchText("");
        }
    };

    return (
        <>
            {trigger ? (
                <div
                    onClick={() => !disabled && !loading && setOpen(true)}
                    style={{ 
                        cursor: disabled || loading ? 'not-allowed' : 'pointer',
                        display: 'inline-block'
                    }}
                >
                    {trigger}
                </div>
            ) : (
                <div
                    onClick={() => !disabled && !loading && setOpen(true)}
                    style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #d9d9d9',
                        cursor: disabled || loading ? 'not-allowed' : 'pointer',
                        background: disabled ? '#f5f5f5' : '#fff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        minHeight: 32,
                        transition: 'all 0.2s',
                        ...style
                    }}
                >
                    <div style={{ 
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap', 
                        color: (multiple ? (Array.isArray(value) && value.length > 0) : value) ? '#1f2937' : '#9ca3af',
                        marginRight: 8,
                        fontSize: 14
                    }}>
                        {loading ? <Spin size="small" /> : (
                            multiple && Array.isArray(value) && value.length > 0 
                                ? `เลือกแล้ว ${value.length} รายการ`
                                : (selectedOption?.label || placeholder)
                        )}
                    </div>
                    <DownOutlined style={{ fontSize: 12, color: '#9ca3af' }} />
                </div>
            )}
            
            <Modal
                title={title}
                open={open}
                onCancel={() => {
                    setOpen(false);
                    setSearchText("");
                }}
                footer={null}
                centered
                width={isMobile ? 'calc(100vw - 16px)' : 400}
                style={{ top: isMobile ? 8 : undefined }}
                styles={{ body: { padding: '12px 0' } }}
            >
                {showSearch && (
                    <div style={{ padding: '0 16px 12px' }}>
                        <Input 
                            placeholder="ค้นหา..." 
                            value={searchText} 
                            onChange={(e) => setSearchText(e.target.value)}
                            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                            allowClear
                            autoFocus
                        />
                    </div>
                )}
                <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    onClick={() => handleSelect(opt.value)}
                                    style={{
                                        padding: '12px 16px',
                                        borderRadius: 8,
                                        border: '1px solid',
                                        cursor: 'pointer',
                                        background: isSelected(opt.value) ? '#eff6ff' : '#fff',
                                        borderColor: isSelected(opt.value) ? '#3b82f6' : '#e5e7eb',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <span style={{ fontWeight: isSelected(opt.value) ? 500 : 400, color: '#374151', fontSize: 14 }}>
                                        {opt.label}
                                    </span>
                                    {isSelected(opt.value) && <CheckCircleOutlined style={{ color: '#3b82f6' }} />}
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af' }}>
                                ไม่พบข้อมูล
                            </div>
                        )}
                    </div>
                </div>
                {multiple && (
                    <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                            type="primary" 
                            onClick={() => {
                                setOpen(false);
                                if (Array.isArray(value)) {
                                    onConfirm?.(value as T[]);
                                }
                            }} 
                            style={{ borderRadius: 8, height: 40, minWidth: 100 }}
                        >
                            ตกลง
                        </Button>
                    </div>
                )}
            </Modal>
        </>
    );
};
