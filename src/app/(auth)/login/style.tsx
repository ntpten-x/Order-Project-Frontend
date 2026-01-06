import styled from '@emotion/styled';
import { Card, Button, Input } from 'antd';

// Main container with gradient background
export const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
  position: relative;
  overflow: hidden;
`;

// Styled card with clean white background
export const StyledCard = styled(Card)`
  width: 100%;
  max-width: 420px;
  background: #ffffff !important;
  border-radius: 16px !important;
  border: none !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
  padding: 3rem 2.5rem !important;
  position: relative;
  z-index: 10;

  .ant-card-body {
    padding: 0 !important;
  }

  @media (max-width: 576px) {
    padding: 2rem 1.5rem !important;
    max-width: 90%;
  }
`;

// Login title
export const LoginTitle = styled.h1`
  font-size: 36px;
  font-weight: 700;
  color: #2d3748;
  text-align: center;
  margin-bottom: 2.5rem;
  margin-top: 0;

  @media (max-width: 576px) {
    font-size: 28px;
    margin-bottom: 2rem;
  }
`;

// Form container
export const FormContainer = styled.div`
  width: 100%;
`;

// Styled Input with underline effect
export const StyledInput = styled(Input)`
  height: 48px;
  border: none !important;
  border-bottom: 2px solid #e2e8f0 !important;
  border-radius: 0 !important;
  padding: 12px 0 !important;
  font-size: 15px;
  background: transparent !important;
  box-shadow: none !important;
  transition: border-color 0.3s ease;

  &::placeholder {
    color: #a0aec0;
    font-size: 15px;
  }

  &:hover {
    border-bottom-color: #667eea !important;
  }

  &:focus,
  &.ant-input-focused {
    border-bottom-color: #667eea !important;
    box-shadow: none !important;
  }

  .ant-input-prefix {
    margin-right: 12px;
    color: #a0aec0;
  }
`;

// Styled Password Input with underline effect
export const StyledPasswordInput = styled(Input.Password)`
  height: 48px;
  border: none !important;
  border-bottom: 2px solid #e2e8f0 !important;
  border-radius: 0 !important;
  padding: 12px 0 !important;
  font-size: 15px;
  background: transparent !important;
  transition: border-color 0.3s ease;

  input {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }

  &::placeholder {
    color: #a0aec0;
    font-size: 15px;
  }

  &:hover {
    border-bottom-color: #667eea !important;
  }

  &:focus,
  &.ant-input-affix-wrapper-focused {
    border-bottom-color: #667eea !important;
    box-shadow: none !important;
  }

  .ant-input-prefix {
    margin-right: 12px;
    color: #a0aec0;
  }

  .ant-input-suffix {
    color: #a0aec0;
  }
`;

// Form item wrapper
export const FormItemWrapper = styled.div`
  margin-bottom: 1.75rem;

  .ant-form-item {
    margin-bottom: 0;
  }

  .ant-form-item-explain-error {
    font-size: 13px;
    margin-top: 6px;
    color: #e53e3e;
  }
`;

// Gradient Button
export const GradientButton = styled(Button)`
  height: 50px !important;
  border-radius: 8px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  color: white !important;
  margin-top: 1.5rem !important;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4) !important;
  transition: all 0.3s ease !important;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5) !important;
    opacity: 0.95;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    background: linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 100%) !important;
  }

  span {
    color: white !important;
  }
`;

// Footer links container
export const FooterLinks = styled.div`
  margin-top: 1.5rem;
  text-align: center;
`;

// Forgot password link
export const ForgotPasswordLink = styled.div`
  margin-bottom: 1rem;
  text-align: center;

  a {
    color: #718096;
    font-size: 14px;
    text-decoration: none;
    transition: color 0.3s ease;

    &:hover {
      color: #667eea;
    }
  }
`;

// Sign up text
export const SignUpText = styled.div`
  color: #718096;
  font-size: 14px;
  text-align: center;

  a {
    color: #667eea;
    font-weight: 600;
    text-decoration: none;
    margin-left: 4px;
    transition: color 0.3s ease;

    &:hover {
      color: #764ba2;
    }
  }
`;
