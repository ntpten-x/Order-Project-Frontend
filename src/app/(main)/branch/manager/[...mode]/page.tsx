'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { App, Button, Card, Col, Form, Input, Row, Spin, Switch, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { branchService } from '../../../../../services/branch.service';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useEffectivePermissions } from '../../../../../hooks/useEffectivePermissions';
import { getCsrfTokenCached } from '../../../../../utils/pos/csrf';
import PageContainer from '../../../../../components/ui/page/PageContainer';
import PageSection from '../../../../../components/ui/page/PageSection';
import UIPageHeader from '../../../../../components/ui/page/PageHeader';
import { AccessGuardFallback } from '../../../../../components/pos/AccessGuard';
import type { CreateBranchInput } from '../../../../../types/api/branch';
import { t } from '../../../../../utils/i18n';

const { TextArea } = Input;
const { Title, Text } = Typography;

type BranchFormValues = CreateBranchInput & { is_active: boolean };

function normalizeOptionalText(value: string | null | undefined): string | undefined {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized || undefined;
}

export default function BranchManagePage({ params }: { params: { mode: string[] } }) {
  const router = useRouter();
  const [form] = Form.useForm<BranchFormValues>();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
  const canCreateBranches = can('branches.page', 'create');
  const canUpdateBranches = can('branches.page', 'update');
  const canDeleteBranches = can('branches.page', 'delete');
  const { message: messageApi, modal } = App.useApp();
  const unauthorizedNotifiedRef = useRef(false);

  const mode = params.mode[0];
  const id = params.mode[1] || null;
  const isEdit = mode === 'edit' && !!id;
  const hasPageAccess = isEdit ? canUpdateBranches : canCreateBranches;

  const fetchBranch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await branchService.getById(id);
      form.setFieldsValue({
        branch_name: data.branch_name,
        branch_code: data.branch_code,
        address: data.address ?? undefined,
        phone: data.phone ?? undefined,
        tax_id: data.tax_id ?? undefined,
        is_active: data.is_active,
      });
    } catch (error) {
      console.error(error);
      messageApi.error(t('branch.form.loadError'));
      router.push('/branch');
    } finally {
      setLoading(false);
    }
  }, [id, form, router, messageApi]);

  useEffect(() => {
    if (!authLoading && !permissionLoading && user) {
      if (!hasPageAccess) {
        if (!unauthorizedNotifiedRef.current) {
          unauthorizedNotifiedRef.current = true;
          messageApi.error(t('branch.noPermission'));
        }
        return;
      }

      unauthorizedNotifiedRef.current = false;
      if (isEdit) {
        void fetchBranch();
      }
    }
  }, [authLoading, permissionLoading, user, hasPageAccess, isEdit, fetchBranch, messageApi]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/auth/active-branch', { credentials: 'include', cache: 'no-store' })
      .then((res) => res.json().catch(() => null))
      .then((data: { active_branch_id?: string | null } | null) => {
        setActiveBranchId(typeof data?.active_branch_id === 'string' ? data.active_branch_id : null);
      })
      .catch(() => {
        setActiveBranchId(null);
      });
  }, [user]);

  const onFinish = async (values: BranchFormValues) => {
    setSubmitting(true);
    try {
      const csrfToken = await getCsrfTokenCached();
      const payload: BranchFormValues = {
        ...values,
        address: normalizeOptionalText(values.address),
        phone: normalizeOptionalText(values.phone),
        tax_id: normalizeOptionalText(values.tax_id),
      };
      if (isEdit && id) {
        await branchService.update(id, payload, undefined, csrfToken);
        messageApi.success(t('branch.form.updateSuccess'));
      } else {
        await branchService.create(payload, undefined, csrfToken);
        messageApi.success(t('branch.form.createSuccess'));
      }
      router.push('/branch');
    } catch (error) {
      console.error(error);
      const err = error as Error;
      messageApi.error(err.message || t('branch.form.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!id || !canDeleteBranches) return;

    modal.confirm({
      title: t('branch.form.deleteTitle'),
      content: t('branch.form.deleteContent'),
      okText: t('branch.delete.ok'),
      okType: 'danger',
      cancelText: t('branch.delete.cancel'),
      centered: true,
      onOk: async () => {
        try {
          const csrfToken = await getCsrfTokenCached();
          await branchService.delete(id, undefined, csrfToken);
          if (activeBranchId === id) {
            await fetch('/api/auth/active-branch', { method: 'DELETE', credentials: 'include' });
            window.dispatchEvent(new CustomEvent('active-branch-changed', { detail: { activeBranchId: null } }));
          }
          messageApi.success(t('branch.form.deleteSuccess'));
          router.push('/branch');
        } catch {
          messageApi.error(t('branch.form.deleteError'));
        }
      },
    });
  };

  const handleBack = () => router.push('/branch');

  if (authLoading || permissionLoading || (isEdit && loading)) {
    return (
      <div
        style={{
          height: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F8FAFC',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!user || !hasPageAccess) {
    return <AccessGuardFallback message={t('branch.noPermission')} tone="danger" />;
  }

  return (
    <div data-testid="branch-manage-page">
      <UIPageHeader title={t('branch.page.title')} onBack={handleBack} />
      <PageContainer>
        <PageSection>
          <div className="p-6 md:p-10 min-h-[100dvh] bg-gray-50">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <div className="flex justify-between items-center gap-3">
                  <div>
                    <Title level={2} style={{ margin: 0 }}>
                      {isEdit ? t('branch.form.titleEdit') : t('branch.form.titleCreate')}
                    </Title>
                    <Text type="secondary">{t('branch.form.subtitle')}</Text>
                  </div>
                  {isEdit && canDeleteBranches ? (
                    <Button danger icon={<DeleteOutlined />} onClick={handleDelete} data-testid="branch-delete">
                      {t('branch.delete.ok')}
                    </Button>
                  ) : null}
                </div>
              </div>

              <Card className="shadow-sm rounded-2xl border-gray-100" style={{ overflow: 'visible' }}>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  requiredMark="optional"
                  autoComplete="off"
                  initialValues={{ is_active: true }}
                >
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="branch_name"
                        label={t('branch.form.fields.nameLabel')}
                        rules={[{ required: true, message: t('branch.form.fields.nameRequired') }]}
                      >
                        <Input size="large" placeholder={t('branch.form.fields.namePlaceholder')} maxLength={100} data-testid="branch-name-input" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="branch_code"
                        label={t('branch.form.fields.codeLabel')}
                        rules={[
                          { required: true, message: t('branch.form.fields.codeRequired') },
                          { pattern: /^[A-Za-z0-9]+$/, message: t('branch.form.fields.codePattern') },
                        ]}
                      >
                        <Input size="large" placeholder={t('branch.form.fields.codePlaceholder')} maxLength={20} data-testid="branch-code-input" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="address" label={t('branch.form.fields.addressLabel')}>
                    <TextArea rows={3} placeholder={t('branch.form.fields.addressPlaceholder')} style={{ borderRadius: 12 }} data-testid="branch-address-input" />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item name="phone" label={t('branch.form.fields.phoneLabel')}>
                        <Input size="large" placeholder={t('branch.form.fields.phonePlaceholder')} maxLength={20} data-testid="branch-phone-input" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="tax_id" label={t('branch.form.fields.taxIdLabel')}>
                        <Input size="large" placeholder={t('branch.form.fields.taxIdPlaceholder')} maxLength={50} data-testid="branch-tax-id-input" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="is_active" label={t('branch.form.fields.statusLabel')} valuePropName="checked">
                    <Switch checkedChildren={t('branch.stats.active')} unCheckedChildren={t('branch.stats.inactive')} />
                  </Form.Item>

                  <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <Button size="large" onClick={handleBack} style={{ borderRadius: 12, minWidth: 100 }}>
                      {t('branch.form.back')}
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={submitting}
                      size="large"
                      icon={<SaveOutlined />}
                      style={{ borderRadius: 12, minWidth: 140 }}
                      data-testid="branch-submit"
                    >
                      {isEdit ? t('branch.form.submitEdit') : t('branch.form.submitCreate')}
                    </Button>
                  </div>
                </Form>
              </Card>
            </div>
          </div>
        </PageSection>
      </PageContainer>
    </div>
  );
}
