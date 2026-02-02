import React from 'react';
import { Modal, Typography, Button, ConfigProvider } from 'antd';
import { 
    QuestionCircleFilled, 
    ExclamationCircleFilled, 
    InfoCircleFilled, 
    CheckCircleFilled,
    WarningFilled
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
            case 'danger': return '#ff4d4f'; // Red
            case 'warning': return '#faad14'; // Gold
            case 'success': return '#52c41a'; // Green
            case 'info': return '#1890ff'; // Blue
            default: return '#1890ff'; // Blue
        }
    };

    const getIcon = () => {
        if (icon) return icon;
        const style = { fontSize: 48, color: getThemeColor() };
        switch (type) {
            case 'danger': return <ExclamationCircleFilled style={style} />;
            case 'warning': return <WarningFilled style={style} />;
            case 'success': return <CheckCircleFilled style={style} />;
            case 'info': return <InfoCircleFilled style={style} />;
            default: return <QuestionCircleFilled style={style} />;
        }
    };

    const themeColor = getThemeColor();

    return (
        <ConfigProvider
            theme={{
                components: {
                    Modal: {
                        contentBg: '#ffffff',
                        headerBg: '#ffffff',
                        borderRadiusLG: 24,
                    },
                    Button: {
                        borderRadius: 12,
                        controlHeightLG: 48,
                        fontSizeLG: 16,
                        fontWeight: 600,
                    }
                }
            }}
        >
            <Modal
                open={open}
                onCancel={onCancel}
                footer={null}
                centered
                width={360}
                closable={false}
                styles={{ 
                    mask: { 
                        backdropFilter: 'blur(8px)', 
                        background: 'rgba(0, 0, 0, 0.25)' 
                    }
                }}
                className="soft-confirm-modal"
            >
                <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    {/* Icon Container */}
                    <div style={{ 
                        marginBottom: 20, 
                        width: 80,
                        height: 80,
                        borderRadius: '40%',
                        backgroundColor: `${themeColor}15`, // 15% opacity
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'float 3s ease-in-out infinite'
                    }}>
                        {getIcon()}
                    </div>
                    
                    {/* Title */}
                    <Title level={4} style={{ marginBottom: 12, fontWeight: 700, color: '#1f1f1f' }}>
                        {title}
                    </Title>
                    
                    {/* Content */}
                    <div style={{ marginBottom: 32, width: '100%' }}>
                        {typeof content === 'string' ? (
                            <Text type="secondary" style={{ fontSize: 16, lineHeight: 1.6 }}>
                                {content}
                            </Text>
                        ) : (
                            content
                        )}
                    </div>

                    {/* Actions */}
                    <div style={{ width: '100%', display: 'flex', gap: 12, flexDirection: 'row' }}>
                        <Button 
                            block
                            size="large"
                            onClick={onCancel}
                            disabled={loading}
                            style={{ 
                                border: 'none',
                                background: '#f5f5f5',
                                color: '#595959',
                                boxShadow: 'none'
                            }}
                            className="hover-scale"
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
                                background: themeColor,
                                border: 'none',
                                boxShadow: `0 8px 20px ${themeColor}40`
                            }}
                            className="hover-scale"
                        >
                            {okText}
                        </Button>
                    </div>
                </div>

                <style jsx global>{`
                    @keyframes float {
                        0% { transform: translateY(0px); }
                        50% { transform: translateY(-5px); }
                        100% { transform: translateY(0px); }
                    }
                    .hover-scale {
                        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                    }
                    .hover-scale:active {
                        transform: scale(0.96);
                    }
                    /* Mobile Optimization */
                    @media (max-width: 480px) {
                        .soft-confirm-modal .ant-modal-content {
                            border-radius: 20px !important;
                        }
                    }
                    .soft-confirm-modal .ant-modal-content {
                        box-shadow: 0 20px 50px rgba(0,0,0,0.1) !important;
                        padding: 0 !important;
                    }
                `}</style>
            </Modal>
        </ConfigProvider>
    );
};

export default ConfirmationDialog;
