'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button, Col, Form, Input, Row, Spin, Switch, App } from 'antd';
import { useRouter } from 'next/navigation';
import { 
    ManagePageStyles, 
    pageStyles, 
} from './style';
import { branchService } from "../../../../../services/branch.service";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../../hooks/useEffectivePermissions";
import { getCsrfTokenCached } from '../../../../../utils/pos/csrf';
import PageContainer from "../../../../../components/ui/page/PageContainer";
import PageSection from "../../../../../components/ui/page/PageSection";
import UIPageHeader from "../../../../../components/ui/page/PageHeader";
import { AccessGuardFallback } from "../../../../../components/pos/AccessGuard";
import type { CreateBranchInput } from "../../../../../types/api/branch";
import { t } from "../../../../../utils/i18n";

const { TextArea } = Input;

export default function BranchManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { user, loading: authLoading } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canManageBranches = can("branches.page", "update");
    const { message, modal } = App.useApp();
    const unauthorizedNotifiedRef = useRef(false);

    const mode = params.mode[0];
    const id = params.mode[1] || null;
    const isEdit = mode === 'edit' && !!id;

    // Fetch Branch Data if Edit
    const fetchBranch = useCallback(async () => {
        setLoading(true);
        try {
            const data = await branchService.getById(id!);
            form.setFieldsValue({
                branch_name: data.branch_name,
                branch_code: data.branch_code,
                address: data.address,
                phone: data.phone,
                tax_id: data.tax_id,
                is_active: data.is_active,
            });
        } catch (error) {
            console.error(error);
            message.error(t("branch.form.loadError"));
            router.push('/branch');
        } finally {
            setLoading(false);
        }
    }, [id, form, router, message]);

    useEffect(() => {
        if (!authLoading && !permissionLoading && user) {
            if (!canManageBranches) {
                if (!unauthorizedNotifiedRef.current) {
                    message.error(t("branch.noPermission"));
                    unauthorizedNotifiedRef.current = true;
                }
                return;
            }
            unauthorizedNotifiedRef.current = false;
            if (isEdit) {
                fetchBranch();
            }
        }
    }, [authLoading, permissionLoading, user, canManageBranches, isEdit, fetchBranch, message]);

    type BranchFormValues = CreateBranchInput & { is_active: boolean };

    const onFinish = async (values: BranchFormValues) => {
        setSubmitting(true);
        try {
            const csrfToken = await getCsrfTokenCached();
            if (isEdit) {
                await branchService.update(id!, values, undefined, csrfToken);
                message.success(t("branch.form.updateSuccess"));
            } else {
                await branchService.create(values, undefined, csrfToken);
                message.success(t("branch.form.createSuccess"));
            }
            router.push('/branch');
        } catch (error) {
            console.error(error);
            const err = error as Error;
            message.error(err.message || t("branch.form.saveError"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        modal.confirm({
            title: t("branch.form.deleteTitle"),
            content: t("branch.form.deleteContent"),
            okText: t("branch.delete.ok"),
            okType: 'danger',
            cancelText: t("branch.delete.cancel"),
            centered: true,
            onOk: async () => {
                try {
                    const csrfToken = await getCsrfTokenCached();
                    await branchService.delete(id, undefined, csrfToken);
                    message.success(t("branch.form.deleteSuccess"));
                    router.push('/branch');
                } catch {
                    message.error(t("branch.form.deleteError"));
                }
            },
        });
    };

    const handleBack = () => router.push('/branch');

    if (authLoading || (isEdit && loading)) {
         return (
             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8f9fc' }}>
                 <Spin size="large" />
             </div>
         );
    }

    if (!permissionLoading && user && !canManageBranches) {
        return <AccessGuardFallback message={t("branch.noPermission")} tone="danger" />;
    }

    return (
        <div style={pageStyles.container}>
            <ManagePageStyles />
            
            <UIPageHeader
                title={isEdit ? t("branch.form.titleEdit") : t("branch.form.titleCreate")}
                subtitle={t("branch.form.subtitle")}
                onBack={handleBack}
                actions={
                    isEdit ? (
                        <Button danger onClick={handleDelete}>
                            {t("branch.delete.ok")}
                        </Button>
                    ) : undefined
                }
            />
            
            {/* Form */}
            <PageContainer maxWidth={900}>
                <div className="manage-form-card">
                    <PageSection>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            requiredMark={false}
                            autoComplete="off"
                            initialValues={{ is_active: true }}
                        >
                            <Row gutter={24}>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        name="branch_name"
                                        label={t("branch.form.fields.nameLabel")}
                                        rules={[{ required: true, message: t("branch.form.fields.nameRequired") }]}
                                    >
                                        <Input size="large" placeholder={t("branch.form.fields.namePlaceholder")} maxLength={100} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        name="branch_code"
                                        label={t("branch.form.fields.codeLabel")}
                                        rules={[
                                            { required: true, message: t("branch.form.fields.codeRequired") },
                                            { pattern: /^[A-Za-z0-9]+$/, message: t("branch.form.fields.codePattern") }
                                        ]}
                                    >
                                        <Input size="large" placeholder={t("branch.form.fields.codePlaceholder")} maxLength={20} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item name="address" label={t("branch.form.fields.addressLabel")}>
                                <TextArea rows={3} placeholder={t("branch.form.fields.addressPlaceholder")} style={{ borderRadius: 12 }} />
                            </Form.Item>

                            <Row gutter={24}>
                                <Col xs={24} md={12}>
                                    <Form.Item name="phone" label={t("branch.form.fields.phoneLabel")}>
                                        <Input size="large" placeholder={t("branch.form.fields.phonePlaceholder")} maxLength={20} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="tax_id" label={t("branch.form.fields.taxIdLabel")}>
                                        <Input size="large" placeholder={t("branch.form.fields.taxIdPlaceholder")} maxLength={50} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item name="is_active" label={t("branch.form.fields.statusLabel")} valuePropName="checked">
                                <Switch checkedChildren={t("branch.stats.active")} unCheckedChildren={t("branch.stats.inactive")} />
                            </Form.Item>

                            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                <Button size="large" onClick={handleBack} style={{ borderRadius: 12, minWidth: 100 }}>
                                    {t("branch.form.back")}
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={submitting}
                                    size="large"
                                    style={{
                                        borderRadius: 12,
                                        minWidth: 120,
                                        background: '#7c3aed',
                                        border: 'none'
                                    }}
                                >
                                    {isEdit ? t("branch.form.submitEdit") : t("branch.form.submitCreate")}
                                </Button>
                            </div>
                        </Form>
                    </PageSection>
                </div>
            </PageContainer>
        </div>
    );
}
