import React from 'react';
import { Modal, Typography, Button, Space } from 'antd';
import { 
    QuestionCircleOutlined, 
    ExclamationCircleOutlined, 
    InfoCircleOutlined, 
    CheckCircleOutlined,
    WarningOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

export type DialogType = 'confirm' | 'danger' | 'info' | 'success' | 'warning';

interface ConfirmationDialogProps {
    open: boolean;
    type?: DialogType;
    title: string;
    content: string | React.ReactNode;
    okText?: string;
    cancelText?: string;
    onOk: () => void;
    onCancel: () => void;
    loading?: boolean;
    icon?: React.ReactNode;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    open,
    type = 'confirm',
    title,
    content,
    okText = 'ยืนยัน',
    cancelText = 'ยกเลิก',
    onOk,
    onCancel,
    loading = false,
    icon
}) => {
    // Get theme colors based on type
    const getThemeColor = () => {
        switch (type) {
            case 'danger': return '#ef4444';
            case 'warning': return '#f59e0b';
            case 'success': return '#10b981';
            case 'info': return '#3b82f6';
            default: return '#3b82f6';
        }
    };

    const getIcon = () => {
        if (icon) return icon;
        const style = { fontSize: 42, color: getThemeColor() };
        switch (type) {
            case 'danger': return <ExclamationCircleOutlined style={style} />;
            case 'warning': return <WarningOutlined style={style} />;
            case 'success': return <CheckCircleOutlined style={style} />;
            case 'info': return <InfoCircleOutlined style={style} />;
            default: return <QuestionCircleOutlined style={style} />;
        }
    };

    const themeColor = getThemeColor();

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            centered
            width={400}
            closable={false}
            styles={{ 
                body: { padding: '32px 24px' },
                mask: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.45)' }
            }}
            className="modern-confirm-modal"
        >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ 
                    marginBottom: 20, 
                    padding: 20, 
                    borderRadius: '50%', 
                    backgroundColor: `${themeColor}10`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {getIcon()}
                </div>
                
                <Title level={4} style={{ marginBottom: 12, fontWeight: 700 }}>
                    {title}
                </Title>
                
                <div style={{ marginBottom: 32 }}>
                    {typeof content === 'string' ? (
                        <Text type="secondary" style={{ fontSize: 15 }}>
                            {content}
                        </Text>
                    ) : (
                        content
                    )}
                </div>

                <div style={{ width: '100%', display: 'flex', gap: 12 }}>
                    <Button 
                        block
                        size="large"
                        onClick={onCancel}
                        disabled={loading}
                        style={{ 
                            borderRadius: 12, 
                            height: 48, 
                            fontWeight: 600,
                            border: '1px solid #e2e8f0'
                        }}
                    >
                        {cancelText}
                    </Button>
                    <Button 
                        block
                        type="primary"
                        size="large"
                        onClick={onOk}
                        loading={loading}
                        style={{ 
                            borderRadius: 12, 
                            height: 48, 
                            fontWeight: 600,
                            background: themeColor,
                            border: `1px solid ${themeColor}`,
                            boxShadow: `0 4px 12px ${themeColor}40`
                        }}
                    >
                        {okText}
                    </Button>
                </div>
            </div>

            <style jsx global>{`
                .modern-confirm-modal .ant-modal-content {
                    border-radius: 20px !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15) !important;
                    overflow: hidden;
                }
            `}</style>
        </Modal>
    );
};

export default ConfirmationDialog;
