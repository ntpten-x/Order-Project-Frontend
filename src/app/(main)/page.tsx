"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { 
  Layout, 
  Typography, 
  Button, 
  Card, 
  List, 
  Tag, 
  Space, 
  Spin, 
  Result,
  Row,
  Col,
  Modal,
  message,
  Avatar,
  theme as antTheme
} from "antd";
import { 
  DeleteOutlined, 
  UserOutlined, 
  LockOutlined, 
  BarChartOutlined, 
  SafetyCertificateOutlined,
  LoginOutlined,
  RocketOutlined, 
  CheckCircleOutlined
} from "@ant-design/icons";
import { User } from "@/types/api/users";

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const { useToken } = antTheme;

export default function HomePage() {
  const { token } = useToken();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Delete User',
      content: 'Are you sure you want to delete this user? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await axios.delete(`/api/users/delete/${id}`);
          setUsers(prev => prev.filter((u) => u.id !== id));
          message.success('User deleted successfully');
        } catch (error: any) {
          console.error("Error deleting user:", error);
          message.error(error.response?.data?.error || "Failed to delete user");
        }
      }
    });
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/users/getAll");
        setUsers(response.data);
        setError(null);
      } catch (error: any) {
        console.error("Error fetching users:", error);
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Failed to load users.";
        setError(errorMessage);
        message.error("Could not load users list");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <Layout style={{ minHeight: "100vh", background: token.colorBgContainer }}>
      {/* Navigation Header */}
      <Header 
        style={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 100, 
          width: '100%', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          padding: '0 24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryActive})`,
            borderRadius: token.borderRadius,
            display: 'flex',
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 18
          }}>
            O
          </div>
          <Text strong style={{ fontSize: 20 }}>OrderSystem</Text>
        </div>
        
        <Space>
          <Link href="/login">
            <Button type="text" icon={<LoginOutlined />}>Sign In</Button>
          </Link>
          <Link href="/register">
            <Button type="primary" icon={<RocketOutlined />}>Get Started</Button>
          </Link>
        </Space>
      </Header>

      <Content style={{ padding: '0 24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        
        {/* Hero Section */}
        <div style={{ textAlign: 'center', padding: '80px 0 60px' }}>
          <Tag color="blue" style={{ padding: '6px 16px', borderRadius: 20, marginBottom: 24, fontSize: 14 }}>
            <SafetyCertificateOutlined style={{ marginRight: 6 }} /> 
            New: Role-based Access Control
          </Tag>
          
          <Title level={1} style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', marginBottom: 24, lineHeight: 1.1 }}>
             Manage Orders with <br />
            <span style={{ color: token.colorPrimary }}>Precision & Speed</span>
          </Title>
          
          <Paragraph type="secondary" style={{ fontSize: 18, maxWidth: 600, margin: '0 auto 40px' }}>
            A powerful, secure, and modern order management system built for high-performance teams. 
            Automate your workflow and focus on what matters most.
          </Paragraph>

          <Space size="large" wrap style={{ justifyContent: 'center' }}>
            <Link href="/register">
              <Button type="primary" size="large" style={{ minWidth: 180, height: 52, fontSize: 18 }}>
                Create Free Account
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="large" style={{ minWidth: 180, height: 52, fontSize: 18 }}>
                View Documentation
              </Button>
            </Link>
          </Space>
        </div>

        {/* Users Section */}
        <div style={{ marginTop: 60, marginBottom: 80 }}>
          <Title level={2} style={{ marginBottom: 32 }}>Active Users</Title>
          
          {loading ? (
             <div style={{ textAlign: 'center', padding: 80 }}>
               <Spin size="large" />
             </div>
          ) : error ? (
            <Result
              status="error"
              title="Failed to Load Users"
              subTitle={error}
            />
          ) : (
            <List
              grid={{ gutter: 24, xs: 1, sm: 2, md: 3, lg: 4 }}
              dataSource={users}
              renderItem={(user) => (
                <List.Item>
                  <Card 
                    hoverable
                    style={{ borderRadius: token.borderRadiusLG }}
                    bodyStyle={{ padding: 24 }}
                    actions={[
                      <Tag color="green" key="status" icon={<CheckCircleOutlined />}>Active</Tag>,
                      <Button 
                        key="delete" 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => handleDelete(user.id)}
                      />
                    ]}
                  >
                    <Card.Meta
                      avatar={
                        <Avatar 
                          size={56} 
                          style={{ backgroundColor: token.colorPrimary + '20', color: token.colorPrimary, fontWeight: 'bold' }}
                        >
                          {user.username?.charAt(0).toUpperCase()}
                        </Avatar>
                      }
                      title={user.username}
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary" style={{ fontSize: 13 }}>ID: {user.id}</Text>
                          <Text strong style={{ color: token.colorPrimary }}>
                            {user.roles?.display_name || "Member"}
                          </Text>
                        </Space>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          )}
          
          {!loading && !error && users.length === 0 && (
            <div style={{ textAlign: 'center', padding: 80, background: token.colorFillAlter, borderRadius: token.borderRadiusLG }}>
               <UserOutlined style={{ fontSize: 48, color: token.colorTextQuaternary, marginBottom: 16 }} />
               <Title level={4} type="secondary">No users found</Title>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <Row gutter={[32, 32]} style={{ marginBottom: 100 }}>
          {[
            {
              title: "Role Management",
              desc: "Granular access control for users and administrators.",
              icon: <LockOutlined style={{ fontSize: 32, color: token.colorPrimary }} />
            },
            {
              title: "Real-time Stats",
              desc: "Monitor your operations with live data visualization.",
              icon: <BarChartOutlined style={{ fontSize: 32, color: token.colorPrimary }} />
            },
            {
              title: "Secure API",
              desc: "Enterprise-grade security for all your data transactions.",
              icon: <SafetyCertificateOutlined style={{ fontSize: 32, color: token.colorPrimary }} />
            }
          ].map((feature, idx) => (
            <Col xs={24} md={8} key={idx}>
              <Card bordered={false} style={{ height: '100%', background: token.colorFillAlter, borderRadius: token.borderRadiusLG }}>
                <div style={{ marginBottom: 24 }}>{feature.icon}</div>
                <Title level={4}>{feature.title}</Title>
                <Paragraph type="secondary">{feature.desc}</Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </Content>

      <Footer style={{ textAlign: 'center', background: 'transparent' }}>
        <Space split={<div style={{ width: 1, height: 12, background: token.colorBorder }} />} size="large">
           <Text type="secondary">© 2025 OrderSystem. All rights reserved.</Text>
           <Link href="#"><Text type="secondary" className="hover:text-indigo-600 transition-colors">Privacy</Text></Link>
           <Link href="#"><Text type="secondary">Terms</Text></Link>
        </Space>
      </Footer>
    </Layout>
  );
}
