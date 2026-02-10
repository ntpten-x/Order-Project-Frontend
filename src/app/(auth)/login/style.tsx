import styled from '@emotion/styled';
import { keyframes, css } from '@emotion/react';
import { Card, Button, Input } from 'antd';

// ===== ANIMATIONS =====
const float = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.05); }
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// ===== MAIN CONTAINER =====
export const LoginContainer = styled.div`
  min-height: 100vh;
  min-height: 100dvh; /* Dynamic viewport height for mobile */
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
  padding: 1rem;
  position: relative;
  overflow: hidden;

  /* Animated background orbs */
  &::before {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%);
    top: -100px;
    left: -100px;
    animation: ${float} 8s ease-in-out infinite;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    width: 350px;
    height: 350px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(34, 211, 238, 0.25) 0%, transparent 70%);
    bottom: -80px;
    right: -80px;
    animation: ${float} 10s ease-in-out infinite reverse;
    pointer-events: none;
  }

  @media (max-width: 480px) {
    padding: 1.5rem;
    align-items: center;
    
    &::before, &::after {
      width: 250px;
      height: 250px;
    }
  }
`;

// Secondary floating orb
export const FloatingOrb = styled.div`
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(167, 139, 250, 0.2) 0%, transparent 70%);
  top: 50%;
  right: 15%;
  animation: ${pulse} 6s ease-in-out infinite;
  pointer-events: none;
  z-index: 1;

  @media (max-width: 768px) {
    display: none;
  }
`;

// ===== GLASSMORPHISM CARD =====
export const StyledCard = styled(Card)`
  width: 100%;
  max-width: 440px;
  background: rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  box-shadow: 
    0 32px 64px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
    0 -20px 40px rgba(99, 102, 241, 0.1) inset !important;
  padding: 2.5rem 2rem !important;
  position: relative;
  z-index: 10;
  animation: ${fadeInUp} 0.6s ease-out;

  .ant-card-body {
    padding: 0 !important;
  }

  /* Gradient border glow effect */
  &::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: 25px;
    padding: 1px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.5), rgba(34, 211, 238, 0.3), rgba(167, 139, 250, 0.5));
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: xor;
    -webkit-mask-composite: xor;
    pointer-events: none;
    opacity: 0.6;
  }

  @media (max-width: 480px) {
    padding: 2rem 1.5rem !important;
  }
`;

// ===== LOGO/ICON AREA =====
export const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
`;

export const LogoIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
  
  svg {
    width: 32px;
    height: 32px;
    color: white;
  }

  @media (max-width: 480px) {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    
    svg {
      width: 28px;
      height: 28px;
    }
  }
`;

// ===== TYPOGRAPHY =====
export const LoginTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  text-align: center;
  margin-bottom: 0.5rem;
  margin-top: 0;
  letter-spacing: -0.02em;

  @media (max-width: 480px) {
    font-size: 24px;
  }
`;

export const LoginSubtitle = styled.p`
  font-size: 15px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  margin-bottom: 2rem;
  margin-top: 0;

  @media (max-width: 480px) {
    font-size: 14px;
    margin-bottom: 1.5rem;
  }
`;

// ===== FORM CONTAINER =====
export const FormContainer = styled.div`
  width: 100%;
`;

// ===== INPUT STYLES =====
const inputBaseStyles = css`
  height: 52px;
  border: 1.5px solid rgba(255, 255, 255, 0.15) !important;
  border-radius: 14px !important;
  padding: 0 16px !important;
  font-size: 15px;
  background: rgba(255, 255, 255, 0.06) !important;
  color: #ffffff !important;
  transition: all 0.2s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  &:hover {
    border-color: rgba(99, 102, 241, 0.5) !important;
    background: rgba(255, 255, 255, 0.08) !important;
  }

  &:focus,
  &.ant-input-focused,
  &.ant-input-affix-wrapper-focused {
    border-color: #6366f1 !important;
    background: rgba(255, 255, 255, 0.1) !important;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2) !important;
  }

  .ant-input-prefix {
    margin-right: 12px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 18px;
  }

  @media (max-width: 480px) {
    height: 56px;
    font-size: 16px; /* Prevent iOS zoom */
  }
`;

export const StyledInput = styled(Input)`
  ${inputBaseStyles}

  input {
    background: transparent !important;
    color: #ffffff !important;
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
  }
`;

export const StyledPasswordInput = styled(Input.Password)`
  ${inputBaseStyles}

  input {
    background: transparent !important;
    color: #ffffff !important;
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
  }

  .ant-input-suffix {
    color: rgba(255, 255, 255, 0.5);
    
    .anticon {
      font-size: 18px;
      cursor: pointer;
      transition: color 0.2s;
      
      &:hover {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }
`;

// ===== FORM ITEM WRAPPER =====
export const FormItemWrapper = styled.div`
  margin-bottom: 1.25rem;

  .ant-form-item {
    margin-bottom: 0;
  }

  .ant-form-item-explain-error {
    font-size: 13px;
    margin-top: 8px;
    color: #fca5a5;
    animation: ${fadeInUp} 0.2s ease-out;
  }
`;

// ===== GRADIENT BUTTON =====
export const GradientButton = styled(Button)`
  height: 52px !important;
  border-radius: 14px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #6366f1 100%) !important;
  background-size: 200% auto !important;
  border: none !important;
  color: white !important;
  margin-top: 0.75rem !important;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35) !important;
  transition: all 0.3s ease !important;
  cursor: pointer;

  &:hover:not(:disabled) {
    background-position: right center !important;
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(99, 102, 241, 0.5) !important;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Loading state */
  &.ant-btn-loading {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
    
    .ant-btn-loading-icon {
      color: white;
    }
  }

  span {
    color: white !important;
  }

  @media (max-width: 480px) {
    height: 56px !important;
    font-size: 17px !important;
  }
`;

// ===== FOOTER LINKS =====
export const FooterLinks = styled.div`
  margin-top: 2rem;
  text-align: center;
`;

export const ForgotPasswordLink = styled.div`
  margin-bottom: 1rem;
  text-align: center;

  a {
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: #a5b4fc;
    }
  }
`;

export const SignUpText = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  text-align: center;

  a {
    color: #a5b4fc;
    font-weight: 600;
    text-decoration: none;
    margin-left: 4px;
    transition: color 0.2s ease;

    &:hover {
      color: #c4b5fd;
    }
  }
`;

// ===== DIVIDER =====
export const StyledDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  gap: 1rem;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  }

  span {
    color: rgba(255, 255, 255, 0.4);
    font-size: 13px;
    white-space: nowrap;
  }
`;

// ===== SECURE BADGE =====
export const SecureBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  
  svg {
    width: 14px;
    height: 14px;
    color: rgba(255, 255, 255, 0.3);
  }
  
  span {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.3);
  }
`;
