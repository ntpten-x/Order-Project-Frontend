"use client";

import React, { useMemo, useState } from "react";
import { Input, Modal, Spin } from "antd";
import { CheckCircleOutlined, DownOutlined, SearchOutlined } from "@ant-design/icons";

export interface ModalSelectorProps<T extends string | number = string | number> {
    value?: T;
    options: { label: React.ReactNode; value: T }[];
    onChange: (value: T) => void;
    title: string;
    placeholder?: string;
    style?: React.CSSProperties;
    disabled?: boolean;
    showSearch?: boolean;
    loading?: boolean;
}

export const ModalSelector = <T extends string | number,>({
    value,
    options,
    onChange,
    title,
    placeholder = "เลือกข้อมูล",
    style,
    disabled = false,
    showSearch = false,
    loading = false
}: ModalSelectorProps<T>) => {
    const [open, setOpen] = useState(false);
    const [searchText, setSearchText] = useState("");

    const filteredOptions = useMemo(() => {
        if (!showSearch || !searchText) return options;
        const lowerSearch = searchText.toLowerCase();
        return options.filter(opt => {
            if (typeof opt.label === 'string') {
                return opt.label.toLowerCase().includes(lowerSearch);
            }
            return String(opt.value).toLowerCase().includes(lowerSearch);
        });
    }, [options, searchText, showSearch]);

    const selectedOption = options.find(o => o.value === value);

    return (
        <>
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
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap', 
                    color: value ? '#1f2937' : '#9ca3af',
                    marginRight: 8,
                    fontSize: 14
                }}>
                    {loading ? <Spin size="small" /> : (selectedOption?.label || placeholder)}
                </div>
                <DownOutlined style={{ fontSize: 12, color: '#9ca3af' }} />
            </div>
            
            <Modal
                title={title}
                open={open}
                onCancel={() => {
                    setOpen(false);
                    setSearchText("");
                }}
                footer={null}
                centered
                width={400}
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
                                    onClick={() => {
                                        onChange(opt.value);
                                        setOpen(false);
                                        setSearchText("");
                                    }}
                                    style={{
                                        padding: '12px 16px',
                                        borderRadius: 8,
                                        border: '1px solid',
                                        cursor: 'pointer',
                                        background: value === opt.value ? '#eff6ff' : '#fff',
                                        borderColor: value === opt.value ? '#3b82f6' : '#e5e7eb',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <span style={{ fontWeight: value === opt.value ? 500 : 400, color: '#374151', fontSize: 14 }}>
                                        {opt.label}
                                    </span>
                                    {value === opt.value && <CheckCircleOutlined style={{ color: '#3b82f6' }} />}
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af' }}>
                                ไม่พบข้อมูล
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    );
};
