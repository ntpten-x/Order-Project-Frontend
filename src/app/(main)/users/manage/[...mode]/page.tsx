'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Form, Input, Button, Card, message, Typography, Spin, Popconfirm, Switch, Modal } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, DeleteOutlined, DownOutlined, CheckOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import UserManageStyle from './style';
import { Role } from '../../../../../types/api/roles';

const { Title } = Typography;



import { authService } from "../../../../../services/auth.service";
import { userService } from "../../../../../services/users.service";
import { branchService } from "../../../../../services/branch.service";
import { Branch } from '../../../../../types/api/branch';
import { useAuth } from "../../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../../hooks/useEffectivePermissions";
import PageContainer from "../../../../../components/ui/page/PageContainer";
import PageSection from "../../../../../components/ui/page/PageSection";
import UIPageHeader from "../../../../../components/ui/page/PageHeader";
import { t } from "../../../../../utils/i18n";
import { AccessGuardFallback } from "../../../../../components/pos/AccessGuard";

export default function UserManagePage({ params }: { params: { mode: string[] } }) {
  const router = useRouter();
  const [form] = Form.useForm();
  const { user } = useAuth();
  const { can, rows, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
  const canViewUsers = can("users.page", "view");
  const canCreateUsers = can("users.page", "create");
  const canUpdateUsers = can("users.page", "update");
  const canDeleteUsers = can("users.page", "delete");
  const canManageRoles = can("roles.page", "view") || can("roles.page", "update");
  const canManageBranches = can("branches.page", "view") || can("branches.page", "update");
  const userPermission = rows.find((row) => row.resourceKey === "users.page");
  const isBranchScopedUser = user?.role !== "Admin" && userPermission?.dataScope === "branch";
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [csrfToken, setCsrfToken] = useState<string>("");
  
  // Modal Visibility State
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [branchModalVisible, setBranchModalVisible] = useState(false);

  // Watch form values for display in custom Select
  const selectedRoleId = Form.useWatch('roles_id', form);
  const selectedBranchId = Form.useWatch('branch_id', form);

  const mode = params.mode[0];
  const userId = params.mode[1] || null;
  const isEdit = mode === 'edit' && !!userId;
  const isEditingSelf = isEdit && !!userId && userId === user?.id;
  const canSubmit = isEdit ? canUpdateUsers : canCreateUsers;

  useEffect(() => {
    if (permissionLoading) return;
    if (!canViewUsers || !canSubmit) {
      message.error("You do not have permission to manage users.");
      return;
    }
  }, [canSubmit, canViewUsers, permissionLoading]);

  useEffect(() => {
    const fetchCsrf = async () => {
        const token = await authService.getCsrfToken();
        setCsrfToken(token);
    };
    fetchCsrf();
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await fetch('/api/roles/getAll');
      if (!response.ok) throw new Error(t("users.manage.loadRolesError"));
      const data: Role[] = await response.json();
      setRoles(data);
    } catch (error) {
      console.error(error);
      message.error(t("users.manage.loadRolesError"));
    }
  }, []);

  const fetchBranches = useCallback(async () => {
    try {
      const data = await branchService.getAll();
      setBranches(data);
    } catch (error) {
      console.error(error);
      message.error(t("users.manage.loadBranchesError"));
    }
  }, []);

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const user = await userService.getUserById(userId);
      form.setFieldsValue({
        username: user.username,
        name: user.name,
        roles_id: user.roles?.id || user.roles_id,
        branch_id: user.branch?.id || user.branch_id,
        is_active: user.is_active,
        is_use: user.is_use
      });

    } catch (error) {
      console.error(error);
      message.error(t("users.manage.loadUserError"));
      router.push('/users');
    } finally {
      setLoading(false);
    }
  }, [userId, form, router]);

  const switchAdminBranch = useCallback(
    async (branchId: string | null) => {
      // Backend appears to scope some operations by active admin branch (httpOnly cookie).
      // Ensure it matches what admin selected in this form to avoid always-defaulting to main branch.
      if (user?.role !== "Admin") return;
      await authService.switchBranch(branchId, csrfToken);
      window.dispatchEvent(new CustomEvent("active-branch-changed", { detail: { activeBranchId: branchId } }));
    },
    [csrfToken, user?.role]
  );

  useEffect(() => {
    if (canManageRoles) {
      fetchRoles();
    }
    if (canManageBranches) {
      fetchBranches();
    }

    if (isBranchScopedUser && user?.branch_id) {
      form.setFieldValue('branch_id', user.branch_id);
    }

    if (isEdit) {
      fetchUser();
    }
  }, [
    isEdit,
    userId,
    fetchRoles,
    fetchBranches,
    fetchUser,
    isBranchScopedUser,
    user?.branch_id,
    form,
    canManageRoles,
    canManageBranches,
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFinish = async (values: any) => {
    if (isEdit && !canUpdateUsers) {
      message.error("You do not have permission to update users.");
      return;
    }
    if (!isEdit && !canCreateUsers) {
      message.error("You do not have permission to create users.");
      return;
    }
    setSubmitting(true);
    try {
      // Create: keep admin branch context aligned to selected branch so backend scoping is correct.
      // Edit: do NOT switch before update, otherwise backend may not be able to see the existing user row
      // (it is still in the old branch until the update completes).
      if (!isEdit && user?.role === "Admin") {
        const branchId = typeof values?.branch_id === "string" ? values.branch_id : null;
        if (branchId) await switchAdminBranch(branchId);
      }

      if (isEdit && userId) {
        // Edit Mode
        const payload = { ...values };
        if (!payload.password) delete payload.password;
        if (isBranchScopedUser) {
          delete payload.roles_id;
          delete payload.branch_id;
          if (isEditingSelf) {
            delete payload.is_use;
            delete payload.is_active;
          }
        }

        await userService.updateUser(userId, payload, undefined, csrfToken);
        message.success(t("users.manage.updateSuccess"));
      } else {
        // Create mode
        const payload = { ...values };
        if (isBranchScopedUser) {
          delete payload.roles_id;
          delete payload.branch_id;
        }
        await userService.createUser(payload, undefined, csrfToken);
        message.success(t("users.manage.createSuccess"));
      }
      router.push('/users');
    } catch (error: unknown) {
      console.error(error);
      message.error((error as { message: string }).message || (isEdit ? t("users.manage.saveErrorUpdate") : t("users.manage.saveErrorCreate")));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    if (!canDeleteUsers) {
      message.error("You do not have permission to delete users.");
      return;
    }
    try {
      await userService.deleteUser(userId, undefined, csrfToken);
      message.success(t("users.manage.deleteSuccess"));
      router.push('/users');
    } catch (error) {
        console.error(error);
        message.error(t("users.manage.deleteError"));
    }
  };

  const managerRoleLabel = "Employee";
  const managerBranchLabel =
    user?.branch ? `${user.branch.branch_name} (${user.branch.branch_code})` : (user?.branch_id || "-");

  if (permissionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spin size="large" />
      </div>
    );
  }

  if (!canViewUsers || !canSubmit) {
    return <AccessGuardFallback message="You do not have permission to manage users." tone="danger" />;
  }

  if (!canViewUsers || !canSubmit) {
    return null;
  }

  return (
      <>
      <UIPageHeader title={t("users.headerTitle")} />
      <PageContainer>
        <PageSection>
      <>
    <>
    <div className="p-6 md:p-10 min-h-screen bg-gray-50 user-manage-page">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.push('/users')}
            className="mb-2 pl-0 hover:bg-transparent hover:text-blue-600"
          >
            {t("users.manage.backToList")}
          </Button>
          <div className="flex justify-between items-center">
            <Title level={2} style={{ margin: 0 }}>
                {isEdit ? t("users.manage.headingEdit") : t("users.manage.headingCreate")}
            </Title>
            {isEdit && canDeleteUsers && (
                <Popconfirm
                    title={t("users.manage.deleteTitle")}
                    description={t("users.manage.deleteDescription")}
                    onConfirm={handleDelete}
                    okText={t("users.manage.deleteOk")}
                    cancelText={t("users.manage.deleteCancel")}
                    okButtonProps={{ danger: true }}
                >
                    <Button danger icon={<DeleteOutlined />}>{t("users.manage.deleteButton")}</Button>
                </Popconfirm>
            )}
          </div>
        </div>

        <Card className="shadow-sm rounded-2xl border-gray-100" style={{ overflow: 'visible' }}>
          {loading ? (
            <div className="flex justify-center py-10">
              <Spin size="large" />
            </div>
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark="optional"
              autoComplete="off"
            >
              <Form.Item
                name="username"
                label={t("users.manage.form.usernameLabel")}
                rules={[
                  { required: true, message: t("users.manage.form.usernameRequired") },
                  { pattern: /^[a-zA-Z0-9\-_@.]*$/, message: t("users.manage.form.usernamePattern") }
                ]}
              >
                <Input size="large" placeholder={t("users.manage.form.usernamePlaceholder")} autoComplete="off" />
              </Form.Item>

              <Form.Item
                name="name"
                label={t("users.manage.form.nameLabel")}
                rules={[{ required: true, message: t("users.manage.form.nameRequired") }]}
              >
                <Input size="large" placeholder={t("users.manage.form.namePlaceholder")} autoComplete="off" />
              </Form.Item>

              <Form.Item
                name="password"
                label={isEdit ? t("users.manage.form.passwordLabelEdit") : t("users.manage.form.passwordLabel")}
                rules={[
                  { required: !isEdit, message: t("users.manage.form.passwordRequired") },
                  { pattern: /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/, message: t("users.manage.form.passwordPattern") }
                ]}
              >
                <Input.Password size="large" placeholder={t("users.manage.form.passwordPlaceholder")} autoComplete="new-password" />
              </Form.Item>

              <Form.Item
                name="roles_id"
                label={t("users.manage.form.roleLabel")}
                rules={[{ required: canManageRoles, message: t("users.manage.form.roleRequired") }]}
                getValueProps={(value) => {
                  const role = roles.find((r) => r.id === value);
                  return {
                    value: role ? role.display_name : "",
                  };
                }}
                getValueFromEvent={() => form.getFieldValue("roles_id")}
              >
                <Input
                  size="large"
                  readOnly
                  placeholder={canManageRoles ? t("users.manage.form.rolePlaceholder") : managerRoleLabel}
                  disabled={!canManageRoles}
                  onClick={() => canManageRoles && setRoleModalVisible(true)}
                  suffix={<DownOutlined className="text-gray-400" />}
                />
              </Form.Item>

              <Form.Item
                name="branch_id"
                label={t("users.manage.form.branchLabel")}
                rules={[{ required: canManageBranches, message: t("users.manage.form.branchRequired") }]}
                getValueProps={(value) => {
                  const branch = branches.find((b) => b.id === value);
                  return {
                    value: branch ? `${branch.branch_name} (${branch.branch_code})` : "",
                  };
                }}
                getValueFromEvent={() => form.getFieldValue("branch_id")}
              >
                <Input
                  size="large"
                  readOnly
                  placeholder={canManageBranches ? t("users.manage.form.branchPlaceholder") : managerBranchLabel}
                  disabled={!canManageBranches}
                  onClick={() => canManageBranches && setBranchModalVisible(true)}
                  suffix={<DownOutlined className="text-gray-400" />}
                />
              </Form.Item>

              {/* Role Selection Modal */}
              {canManageRoles && (
              <Modal
                title={t("users.manage.form.roleModalTitle")}
                open={roleModalVisible}
                onCancel={() => setRoleModalVisible(false)}
                footer={null}
                centered
                zIndex={10001} // Ensure above everything
              >
                 <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto p-1">
                    {roles.map((role) => (
                        <div
                            key={role.id}
                            onClick={() => {
                                form.setFieldValue('roles_id', role.id);
                                setRoleModalVisible(false);
                            }}
                            className={`p-3 border rounded-lg cursor-pointer flex justify-between items-center hover:bg-gray-50 transition-colors ${selectedRoleId === role.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                        >
                            <span className={selectedRoleId === role.id ? 'font-medium text-blue-600' : 'text-gray-700'}>
                                {role.display_name}
                            </span>
                            {selectedRoleId === role.id && <CheckOutlined className="text-blue-600" />}
                        </div>
                    ))}
                 </div>
              </Modal>
              )}

              {/* Branch Selection Modal */}
              {canManageBranches && (
              <Modal
                title={t("users.manage.form.branchModalTitle")}
                open={branchModalVisible}
                onCancel={() => setBranchModalVisible(false)}
                footer={null}
                centered
                zIndex={10001} // Ensure above everything
              >
                  <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto p-1">
                    {branches.map((branch) => (
                        <div
                            key={branch.id}
                            onClick={() => {
                                form.setFieldValue('branch_id', branch.id);
                                setBranchModalVisible(false);
                                if (!isEdit) {
                                  void switchAdminBranch(branch.id).catch((err) => {
                                    console.error(err);
                                    message.error("Failed to switch branch");
                                  });
                                }
                            }}
                            className={`p-3 border rounded-lg cursor-pointer flex justify-between items-center hover:bg-gray-50 transition-colors ${selectedBranchId === branch.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                        >
                            <span className={selectedBranchId === branch.id ? 'font-medium text-blue-600' : 'text-gray-700'}>
                                {branch.branch_name} ({branch.branch_code})
                            </span>
                             {selectedBranchId === branch.id && <CheckOutlined className="text-blue-600" />}
                        </div>
                    ))}
                  </div>
              </Modal>
              )}

              {isEdit && canUpdateUsers && (!isBranchScopedUser || !isEditingSelf) && (
                <div className="flex gap-8 mb-4">
                  <Form.Item
                    name="is_active"
                    label={t("users.manage.form.activeLabel")}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>

                  <Form.Item
                    name="is_use"
                    label={t("users.manage.form.useLabel")}
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="ใช้งาน" unCheckedChildren="ออฟไลน์" />
                  </Form.Item>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-50 mt-6">
                <Button size="large" onClick={() => router.push('/users')}>
                  {t("users.manage.cancel")}
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large" 
                  disabled={permissionLoading || !canSubmit}
                  loading={submitting}
                  icon={<SaveOutlined />}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isEdit ? t("users.manage.updateSubmit") : t("users.manage.createSubmit")}
                </Button>
              </div>
            </Form>
          )}
        </Card>
      </div>
      <UserManageStyle />
    </div>
    </>
      </>
        </PageSection>
      </PageContainer>
      </>
  );
}
