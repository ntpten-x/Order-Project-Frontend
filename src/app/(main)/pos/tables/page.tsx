'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Spin, Typography } from 'antd';
import { TableOutlined } from '@ant-design/icons';
import { Tables, TableStatus } from "../../../../types/api/pos/tables";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { useAuth } from "../../../../contexts/AuthContext";
import {
    TablesPageStyles,
    pageStyles,
    PageHeader,
    StatsCard,
    TableCard,
    EmptyState
} from './style';

const { Text } = Typography;

import { authService } from "../../../../services/auth.service";

export default function TablesPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [tables, setTables] = useState<Tables[]>([]);
    const { execute } = useAsyncAction();
    const { showLoading, hideLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const [csrfToken, setCsrfToken] = useState<string>("");

    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        const fetchCsrf = async () => {
             const token = await authService.getCsrfToken();
             setCsrfToken(token);
        };
        fetchCsrf();
    }, []);

    const fetchTables = useCallback(async () => {
        execute(async () => {
            const response = await fetch('/api/pos/tables');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลโต๊ะได้');
            }
            const data = await response.json();
            setTables(data);
        }, 'กำลังโหลดข้อมูลโต๊ะ...');
    }, [execute]);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                setIsAuthorized(false);
                setTimeout(() => {
                    router.replace('/login');
                }, 1000); 
            } else if (user.role !== 'Admin') {
                setIsAuthorized(false);
                message.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
                setTimeout(() => {
                    router.replace('/pos');
                }, 1000); 
            } else {
                setIsAuthorized(true);
                fetchTables();
            }
        }
    }, [user, authLoading, router, fetchTables]);

    useEffect(() => {
        fetchTables();
    }, [fetchTables]);

    useEffect(() => {
        if (!socket) return;

        socket.on('tables:create', (newItem: Tables) => {
            setTables((prev) => [...prev, newItem]);
        });

        socket.on('tables:update', (updatedItem: Tables) => {
            setTables((prev) =>
                prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
            );
        });

        socket.on('tables:delete', ({ id }: { id: string }) => {
            setTables((prev) => prev.filter((item) => item.id !== id));
        });

        return () => {
            socket.off('tables:create');
            socket.off('tables:update');
            socket.off('tables:delete');
        };
    }, [socket]);

    const handleAdd = () => {
        showLoading();
        router.push('/pos/tables/manager/add');
        setTimeout(() => hideLoading(), 1000);
    };

    const handleEdit = (table: Tables) => {
        showLoading();
        router.push(`/pos/tables/manager/edit/${table.id}`);
        setTimeout(() => hideLoading(), 1000);
    };

    const handleDelete = (table: Tables) => {
        Modal.confirm({
            title: 'ยืนยันการลบโต๊ะ',
            content: `คุณต้องการลบโต๊ะ "${table.table_name}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            onOk: async () => {
                await execute(async () => {
                    const response = await fetch(`/api/pos/tables/delete/${table.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) {
                        throw new Error('ไม่สามารถลบโต๊ะได้');
                    }
                    message.success(`ลบโต๊ะ "${table.table_name}" สำเร็จ`);
                }, "กำลังลบโต๊ะ...");
            },
        });
    };

    if (authLoading || isAuthorized === null) {
        return (
            <div style={{ 
                display: 'flex', 
                height: '100vh', 
                justifyContent: 'center', 
                alignItems: 'center', 
                flexDirection: 'column', 
                gap: 16 
            }}>
                <Spin size="large" />
                <Text type="secondary">กำลังตรวจสอบสิทธิ์การใช้งาน...</Text>
            </div>
        );
    }

    if (isAuthorized === false) {
        return (
            <div style={{ 
                display: 'flex', 
                height: '100vh', 
                justifyContent: 'center', 
                alignItems: 'center', 
                flexDirection: 'column', 
                gap: 16 
            }}>
                <Spin size="large" />
                <Text type="danger">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กำลังพากลับ...</Text>
            </div>
        );
    }

    const activeTables = tables.filter(t => t.is_active);
    const inactiveTables = tables.filter(t => !t.is_active);
    const availableTables = tables.filter(t => t.status === TableStatus.Available);
    const unavailableTables = tables.filter(t => t.status === TableStatus.Unavailable);

    return (
        <div className="tables-page" style={pageStyles.container}>
            <TablesPageStyles />
            
            {/* Header */}
            <PageHeader 
                onRefresh={fetchTables}
                onAdd={handleAdd}
            />
            
            {/* Stats Card */}
            <StatsCard 
                totalTables={tables.length}
                availableTables={availableTables.length}
                unavailableTables={unavailableTables.length}
                activeTables={activeTables.length}
                inactiveTables={inactiveTables.length}
            />

            {/* Tables List */}
            <div style={pageStyles.listContainer}>
                {tables.length > 0 ? (
                    <>
                        <div style={pageStyles.sectionTitle}>
                            <TableOutlined style={{ fontSize: 18, color: '#722ed1' }} />
                            <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>
                                รายการโต๊ะ
                            </span>
                            <div style={{
                                background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 600
                            }}>
                                {tables.length} รายการ
                            </div>
                        </div>

                        {tables.map((table, index) => (
                            <TableCard
                                key={table.id}
                                table={table}
                                index={index}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </>
                ) : (
                    <EmptyState onAdd={handleAdd} />
                )}
            </div>
        </div>
    );
}
