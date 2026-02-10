"use strict";exports.id=686,exports.ids=[686],exports.modules={12226:(t,e,r)=>{r.d(e,{Z:()=>d});var o=r(17577);let i={icon:{tag:"svg",attrs:{viewBox:"64 64 896 896",focusable:"false"},children:[{tag:"path",attrs:{d:"M699 353h-46.9c-10.2 0-19.9 4.9-25.9 13.3L469 584.3l-71.2-98.8c-6-8.3-15.6-13.3-25.9-13.3H325c-6.5 0-10.3 7.4-6.5 12.7l124.6 172.8a31.8 31.8 0 0051.7 0l210.6-292c3.9-5.3.1-12.7-6.4-12.7z"}},{tag:"path",attrs:{d:"M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"}}]},name:"check-circle",theme:"outlined"};var a=r(74082);function n(){return(n=Object.assign?Object.assign.bind():function(t){for(var e=1;e<arguments.length;e++){var r=arguments[e];for(var o in r)Object.prototype.hasOwnProperty.call(r,o)&&(t[o]=r[o])}return t}).apply(this,arguments)}let d=o.forwardRef((t,e)=>o.createElement(a.Z,n({},t,{ref:e,icon:i})))},80440:(t,e,r)=>{r.d(e,{s:()=>a});var o=r(17577),i=r(19211);let a=()=>(0,o.useContext)(i.J)},83717:(t,e,r)=>{r.d(e,{F4:()=>i,QF:()=>o,um:()=>a});let o={...r(43401).mv,headerGradient:"linear-gradient(145deg, #3B82F6 0%, #60A5FA 50%, #93C5FD 100%)",headerShadow:"0 8px 24px rgba(59, 130, 246, 0.2)",paymentButton:"linear-gradient(135deg, #10B981 0%, #059669 100%)",paymentButtonShadow:"0 6px 16px rgba(16, 185, 129, 0.3)",cardHoverShadow:"0 8px 28px rgba(0, 0, 0, 0.1)",cardActiveShadow:"0 4px 12px rgba(0, 0, 0, 0.08)"},i={container:{minHeight:"100vh",background:o.background,fontFamily:"var(--font-sans), 'Sarabun', sans-serif",paddingBottom:100},heroSection:{background:o.headerGradient,padding:"24px 16px 60px",borderBottomLeftRadius:24,borderBottomRightRadius:24,boxShadow:o.headerShadow,marginBottom:-32},contentWrapper:{maxWidth:1200,margin:"0 auto",padding:"48px 16px 80px",position:"relative"},pageTitle:{margin:0,color:"#fff",fontSize:22,fontWeight:700,marginBottom:4},pageSubtitle:{color:"rgba(255,255,255,0.9)",fontSize:13},card:{borderRadius:20,border:`1px solid ${o.border}`,boxShadow:o.cardShadow,marginBottom:16,background:o.white,transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",overflow:"hidden"},cardHeader:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:12},cardHeaderLeft:{flex:1,minWidth:200},cardTimeTag:{fontSize:12,padding:"4px 10px",marginBottom:8,borderRadius:8,fontWeight:500,background:o.primaryLight,color:o.primary,border:"none"},cardOrderInfo:{display:"flex",alignItems:"center",gap:10,marginBottom:6},cardOrderNo:{fontSize:12,color:o.textSecondary},cardTotal:{fontSize:22,fontWeight:700,color:o.primary,whiteSpace:"nowrap"},itemsList:{flex:1,marginBottom:12},itemRow:{display:"flex",justifyContent:"space-between",marginBottom:14,alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${o.borderLight}`},itemLeft:{display:"flex",gap:12,alignItems:"center",flex:1,minWidth:0},itemImage:{width:44,height:44,borderRadius:10,border:`1px solid ${o.borderLight}`,flexShrink:0,objectFit:"cover"},itemImagePlaceholder:{width:44,height:44,borderRadius:10,background:o.backgroundSecondary,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},itemInfo:{minWidth:0,flex:1},itemNameRow:{display:"flex",alignItems:"center",gap:8,marginBottom:4},itemQuantityTag:{margin:0,padding:"2px 6px",fontSize:11,fontWeight:600,borderRadius:6,background:o.primaryLight,color:o.primary,border:"none"},itemName:{fontSize:15,fontWeight:600,color:o.text},itemPrice:{fontSize:13,color:o.textSecondary,display:"block",marginTop:2},itemNotes:{fontSize:11,color:o.warning,fontStyle:"italic",display:"block",marginTop:3},itemTotal:{fontWeight:600,fontSize:15,color:o.text,marginLeft:8,whiteSpace:"nowrap"},paymentButton:{background:o.paymentButton,border:"none",borderRadius:14,height:48,fontWeight:600,fontSize:16,boxShadow:o.paymentButtonShadow,transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"},backButton:{height:44,width:44,borderRadius:14,background:"rgba(255, 255, 255, 0.2)",backdropFilter:"blur(10px)",border:"1px solid rgba(255, 255, 255, 0.3)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s ease"},summaryBox:{background:o.backgroundSecondary,padding:20,borderRadius:16,marginTop:"auto"},emptyCard:{borderRadius:20,border:"none",boxShadow:o.cardShadow,padding:40}};o.border,o.white,o.primary,o.primaryLight,o.primary,o.backgroundSecondary,o.borderLight,o.white,o.primary,o.cardShadow,o.primary,o.primaryDark,o.primary,i.heroSection,o.backgroundSecondary,o.border;let a=`
    /* Base Animations */
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(16px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes scaleIn {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    @keyframes shimmer {
        0% { background-position: -200px 0; }
        100% { background-position: 200px 0; }
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }

    .items-card-animate {
        animation: fadeInUp 0.4s ease forwards;
        opacity: 0;
    }

    .items-card-delay-1 { animation-delay: 0.1s; }
    .items-card-delay-2 { animation-delay: 0.2s; }
    .items-card-delay-3 { animation-delay: 0.3s; }

    .scale-hover {
        transition: transform 0.2s ease !important;
    }

    .scale-hover:hover {
        transform: scale(1.02) !important;
    }

    .scale-hover:active {
        transform: scale(0.98) !important;
    }

    /* =====================================================
       PAYMENT PAGE - MOBILE FIRST STYLES
       ===================================================== */
    
    /* Mobile Layout Container */
    .payment-page-container {
        min-height: 100vh;
        background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
        padding-bottom: 120px; /* Space for sticky footer */
    }

    /* Hero Header - Compact Mobile */
    .payment-hero-mobile {
        background: linear-gradient(145deg, #4F46E5 0%, #6366F1 50%, #818CF8 100%) !important;
        padding: 16px 16px 24px !important;
        border-radius: 0 0 24px 24px !important;
        box-shadow: 0 8px 32px rgba(79, 70, 229, 0.25) !important;
        position: relative;
        z-index: 10;
    }

    .payment-content-mobile {
        padding: 0 !important;
        max-width: 100% !important;
    }

    /* Collapsible Order Summary Card */
    .order-summary-collapsible {
        background: #fff;
        border-radius: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        overflow: hidden;
        margin-bottom: 16px;
        transition: all 0.3s ease;
    }

    .order-summary-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        cursor: pointer;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-bottom: 1px solid #e2e8f0;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
    }

    .order-summary-header:active {
        background: #e2e8f0;
    }

    .order-summary-content {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease-out;
    }

    .order-summary-content.expanded {
        max-height: 600px;
        overflow-y: auto;
    }

    .order-summary-items {
        padding: 16px 20px;
    }

    /* Payment Method Cards - Full Width on Mobile */
    .payment-method-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
        margin-bottom: 20px;
    }

    .payment-method-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 18px 20px;
        border-radius: 16px;
        border: 2px solid #e2e8f0;
        background: #fff;
        cursor: pointer;
        transition: all 0.2s ease;
        min-height: 72px;
        -webkit-tap-highlight-color: transparent;
    }

    .payment-method-card:active {
        transform: scale(0.98);
        background: #f8fafc;
    }

    .payment-method-card.selected {
        border-color: #4F46E5;
        background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
        box-shadow: 0 4px 16px rgba(79, 70, 229, 0.15);
    }

    .payment-method-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        background: #f1f5f9;
        color: #64748b;
        flex-shrink: 0;
    }

    .payment-method-card.selected .payment-method-icon {
        background: #4F46E5;
        color: #fff;
    }

    .payment-method-info {
        flex: 1;
        min-width: 0;
    }

    .payment-method-name {
        font-weight: 600;
        font-size: 16px;
        color: #1f2937;
        margin-bottom: 4px;
    }

    .payment-method-desc {
        font-size: 13px;
        color: #6b7280;
    }

    /* Quick Cash Buttons - Large Touch Targets */
    .quick-cash-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-bottom: 16px;
    }

    .quick-cash-btn {
        height: 52px !important;
        border-radius: 12px !important;
        font-size: 16px !important;
        font-weight: 600 !important;
        transition: all 0.2s ease !important;
    }

    .quick-cash-btn:active {
        transform: scale(0.95) !important;
    }

    .quick-cash-btn-exact {
        grid-column: span 3;
        background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%) !important;
        border: none !important;
        color: #fff !important;
    }

    /* Amount Input - Enhanced Mobile */
    .amount-input-wrapper {
        background: #f8fafc;
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 16px;
        border: 1px solid #e2e8f0;
    }

    .amount-input-wrapper .ant-input-number {
        font-size: 28px !important;
        height: 64px !important;
        border-radius: 12px !important;
    }

    .amount-input-wrapper .ant-input-number-input {
        font-size: 28px !important;
        text-align: center !important;
        font-weight: 700 !important;
        height: 62px !important;
    }

    /* Change Display - Prominent */
    .change-display {
        background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
        border: 2px solid #10b981;
        border-radius: 16px;
        padding: 20px;
        text-align: center;
        margin-bottom: 16px;
    }

    .change-display.insufficient {
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        border-color: #ef4444;
    }

    .change-label {
        font-size: 14px;
        color: #059669;
        margin-bottom: 8px;
        font-weight: 500;
    }

    .change-display.insufficient .change-label {
        color: #dc2626;
    }

    .change-amount {
        font-size: 32px;
        font-weight: 800;
        color: #059669;
    }

    .change-display.insufficient .change-amount {
        color: #dc2626;
    }

    /* QR Code Display - Centered Premium */
    .qr-display-wrapper {
        text-align: center;
        padding: 24px;
        background: #fff;
        border-radius: 20px;
        border: 2px dashed #4F46E5;
        margin-bottom: 16px;
    }

    .qr-display-wrapper svg {
        margin: 0 auto 16px;
        display: block;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .qr-amount {
        font-size: 28px;
        font-weight: 800;
        color: #4F46E5;
        margin-bottom: 12px;
    }

    .qr-account-info {
        font-size: 14px;
        color: #6b7280;
        line-height: 1.6;
    }

    /* Sticky Footer - Always Visible */
    .payment-sticky-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #fff;
        padding: 16px;
        padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        border-top: 1px solid #e2e8f0;
    }

    .payment-sticky-footer-content {
        max-width: 600px;
        margin: 0 auto;
    }

    .payment-total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }

    .payment-total-label {
        font-size: 16px;
        font-weight: 500;
        color: #374151;
    }

    .payment-total-amount {
        font-size: 24px;
        font-weight: 800;
        color: #4F46E5;
    }

    .payment-confirm-btn {
        width: 100%;
        height: 56px !important;
        border-radius: 14px !important;
        font-size: 18px !important;
        font-weight: 700 !important;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
        border: none !important;
        box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3) !important;
        transition: all 0.2s ease !important;
    }

    .payment-confirm-btn:hover:not(:disabled) {
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4) !important;
    }

    .payment-confirm-btn:active:not(:disabled) {
        transform: scale(0.98) !important;
    }

    .payment-confirm-btn:disabled {
        background: #d1d5db !important;
        box-shadow: none !important;
    }

    /* Discount Selector - Touch Friendly */
    .discount-selector {
        padding: 16px 20px;
        border-radius: 14px;
        border: 2px solid #e2e8f0;
        background: #fff;
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-height: 56px;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 16px;
    }

    .discount-selector:active {
        background: #f8fafc;
        transform: scale(0.99);
    }

    .discount-selector.has-discount {
        border-color: #4F46E5;
        background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
    }

    /* Action Buttons Row */
    .action-buttons-row {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
    }

    .action-btn {
        flex: 1;
        height: 48px !important;
        border-radius: 12px !important;
        font-weight: 600 !important;
        font-size: 14px !important;
    }

    /* =====================================================
       TABLET & DESKTOP OVERRIDES (768px+)
       ===================================================== */
    @media (min-width: 768px) {
        .payment-page-container {
            padding-bottom: 40px;
        }

        .payment-hero-mobile {
            padding: 24px 24px 32px !important;
            border-radius: 0 0 32px 32px !important;
        }

        .payment-method-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .quick-cash-grid {
            grid-template-columns: repeat(4, 1fr);
        }

        .quick-cash-btn-exact {
            grid-column: span 4;
        }

        .payment-sticky-footer {
            position: relative;
            box-shadow: none;
            background: transparent;
            padding: 0;
            border-top: none;
        }

        .order-summary-content {
            max-height: none !important;
            overflow: visible !important;
        }

        .order-summary-header {
            cursor: default;
            background: transparent;
            border-bottom: none;
        }
    }

    /* Desktop (1024px+) */
    @media (min-width: 1024px) {
        .payment-method-card:hover:not(.selected) {
            border-color: #a5b4fc;
            background: #fafafa;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
    }

    /* Mobile First - Base Styles (up to 480px) */
    .items-hero-mobile {
        padding: 20px 16px 50px !important;
        border-bottom-left-radius: 20px !important;
        border-bottom-right-radius: 20px !important;
    }

    .items-title-mobile {
        font-size: 20px !important;
        margin-bottom: 4px !important;
    }

    .items-subtitle-mobile {
        font-size: 12px !important;
    }

    .items-content-mobile {
        padding: 40px 12px 80px !important;
    }

    .items-card-mobile {
        margin-bottom: 14px !important;
        border-radius: 18px !important;
    }

    .items-card-header-mobile {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 10px !important;
    }

    .items-card-total-mobile {
        font-size: 20px !important;
        width: 100% !important;
        text-align: right !important;
    }

    .items-item-row-mobile {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 8px !important;
        padding: 12px 0 !important;
    }

    .items-item-left-mobile {
        width: 100% !important;
    }

    .items-item-total-mobile {
        width: 100% !important;
        text-align: right !important;
        margin-left: 0 !important;
        margin-top: 4px !important;
        font-size: 16px !important;
    }

    .items-payment-button-mobile {
        height: 52px !important;
        font-size: 17px !important;
        border-radius: 14px !important;
    }

    .items-back-button-mobile {
        height: 40px !important;
        width: 40px !important;
        border-radius: 12px !important;
    }

    /* Small Mobile (481px - 767px) */
    @media (min-width: 481px) {
        .items-hero-mobile {
            padding: 24px 20px 60px !important;
        }

        .items-title-mobile {
            font-size: 22px !important;
        }

        .items-content-mobile {
            padding: 48px 16px 80px !important;
        }

        .items-card-header-mobile {
            flex-direction: row !important;
            align-items: flex-start !important;
        }

        .items-card-total-mobile {
            width: auto !important;
        }

        .items-item-row-mobile {
            flex-direction: row !important;
            align-items: center !important;
        }

        .items-item-total-mobile {
            width: auto !important;
            margin-left: 8px !important;
            margin-top: 0 !important;
        }
    }

    /* Tablet (768px+) */
    @media (min-width: 768px) {
        .items-hero-mobile {
            padding: 32px 24px 70px !important;
            border-bottom-left-radius: 24px !important;
            border-bottom-right-radius: 24px !important;
        }

        .items-title-mobile {
            font-size: 28px !important;
        }

        .items-subtitle-mobile {
            font-size: 14px !important;
        }

        .items-content-mobile {
            padding: 48px 24px 80px !important;
        }

        .items-card-mobile {
            margin-bottom: 16px !important;
            border-radius: 20px !important;
        }

        .items-payment-button-mobile {
            height: 48px !important;
        }
    }

    /* Desktop (1024px+) */
    @media (min-width: 1024px) {
        .items-content-mobile {
            padding: 48px 32px 80px !important;
        }

        .items-card-mobile:hover {
            transform: translateY(-4px) !important;
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1) !important;
        }
    }

    /* Touch-friendly */
    @media (max-width: 768px) {
        .items-card-mobile {
            -webkit-tap-highlight-color: rgba(59, 130, 246, 0.1);
        }

        .items-card-mobile:active {
            transform: scale(0.98);
        }

        .items-method-card-mobile {
            min-height: 100px !important;
            padding: 16px !important;
        }

        .items-method-card-mobile:active {
            transform: scale(0.96) !important;
        }
    }

    /* Hide scrollbar but allow scrolling */
    .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }

    .hide-scrollbar::-webkit-scrollbar {
        display: none;
    }

    /* =====================================================
       DELIVERY PAGE - MOBILE FIRST STYLES
       ===================================================== */
    
    /* Mobile Layout Container */
    .delivery-page-container {
        min-height: 100vh;
        background: linear-gradient(180deg, #fdf2f8 0%, #fce7f3 100%);
        padding-bottom: 40px; /* Space for content */
    }

    /* Hero Header - Pink/Magenta Theme */
    .delivery-hero-mobile {
        background: linear-gradient(145deg, #EC4899 0%, #DB2777 50%, #BE185D 100%) !important;
        padding: 16px 16px 24px !important;
        border-radius: 0 0 28px 28px !important;
        box-shadow: 0 8px 32px rgba(236, 72, 153, 0.3) !important;
        position: relative;
        z-index: 10;
    }

    /* Order Summary Collapsible - Delivery */
    .delivery-order-summary {
        background: #fff;
        border-radius: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        overflow: hidden;
        margin-bottom: 16px;
        transition: all 0.3s ease;
    }

    .delivery-summary-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        cursor: pointer;
        background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
        border-bottom: 1px solid #fbcfe8;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
    }

    .delivery-summary-header:active {
        background: #fce7f3;
    }

    .delivery-summary-content {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease-out;
    }

    .delivery-summary-content.expanded {
        max-height: 600px;
        overflow-y: auto;
    }

    .delivery-summary-items {
        padding: 16px 20px;
    }

    /* Delivery Info Card */
    .delivery-info-card {
        background: linear-gradient(135deg, #fdf2f8 0%, #fff 100%);
        border: 2px dashed #f9a8d4;
        border-radius: 20px;
        padding: 24px;
        margin-bottom: 16px;
        transition: all 0.3s ease;
    }

    .delivery-info-card:active {
        transform: scale(0.99);
    }

    .delivery-info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #fce7f3;
    }

    .delivery-info-row:last-child {
        border-bottom: none;
    }

    .delivery-info-label {
        font-size: 14px;
        color: #6b7280;
        font-weight: 400;
    }

    .delivery-info-value {
        font-size: 15px;
        font-weight: 600;
        color: #1f2937;
    }

    /* Rider Section - Premium Card */
    .delivery-rider-section {
        background: #fff;
        border-radius: 24px;
        padding: 32px 24px;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        margin-bottom: 16px;
    }

    .delivery-rider-icon-wrapper {
        width: 96px;
        height: 96px;
        border-radius: 50%;
        background: linear-gradient(145deg, #fdf2f8 0%, #fce7f3 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        box-shadow: 0 8px 24px rgba(236, 72, 153, 0.15);
    }

    .delivery-rider-icon {
        font-size: 48px;
        color: #EC4899;
    }

    .delivery-rider-title {
        font-size: 20px;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 8px;
    }

    .delivery-rider-subtitle {
        font-size: 14px;
        color: #6b7280;
        line-height: 1.6;
        margin-bottom: 24px;
    }

    /* Delivery Provider Badge */
    .delivery-provider-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
        border: 1px solid #f9a8d4;
        border-radius: 12px;
        padding: 12px 20px;
        margin-bottom: 24px;
    }

    .delivery-provider-name {
        font-size: 16px;
        font-weight: 600;
        color: #be185d;
    }

    .delivery-code-badge {
        background: #db2777;
        color: #fff;
        font-size: 13px;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 8px;
    }

    /* Sticky Footer - Delivery */
    .delivery-sticky-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #fff;
        padding: 16px;
        padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
        box-shadow: 0 -6px 24px rgba(236, 72, 153, 0.15);
        z-index: 1000;
        border-top: 1px solid #fce7f3;
    }

    .delivery-sticky-footer-content {
        max-width: 600px;
        margin: 0 auto;
    }

    .delivery-total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }

    .delivery-total-label {
        font-size: 16px;
        font-weight: 500;
        color: #374151;
    }

    .delivery-total-amount {
        font-size: 26px;
        font-weight: 800;
        color: #EC4899;
    }

    .delivery-confirm-btn {
        width: 100%;
        height: 60px !important;
        border-radius: 16px !important;
        font-size: 18px !important;
        font-weight: 700 !important;
        background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%) !important;
        border: none !important;
        box-shadow: 0 6px 20px rgba(236, 72, 153, 0.35) !important;
        transition: all 0.2s ease !important;
    }

    .delivery-confirm-btn:hover:not(:disabled) {
        transform: translateY(-2px) !important;
        box-shadow: 0 10px 28px rgba(236, 72, 153, 0.45) !important;
    }

    .delivery-confirm-btn:active:not(:disabled) {
        transform: scale(0.98) !important;
    }

    .delivery-confirm-btn:disabled {
        background: #d1d5db !important;
        box-shadow: none !important;
    }

    /* Warning/Alert Card */
    .delivery-warning-card {
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        border: 2px solid #fca5a5;
        border-radius: 16px;
        padding: 16px 20px;
        margin-bottom: 20px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
    }

    .delivery-warning-icon {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #ef4444;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
    }

    .delivery-warning-text {
        flex: 1;
        font-size: 14px;
        color: #991b1b;
        line-height: 1.5;
    }

    /* Info Footer Note */
    .delivery-info-note {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 16px;
        padding: 12px;
        background: #f8fafc;
        border-radius: 12px;
    }

    .delivery-info-note-text {
        font-size: 13px;
        color: #6b7280;
    }

    /* Action Buttons Row - Delivery */
    .delivery-action-buttons {
        display: flex;
        gap: 10px;
    }

    .delivery-action-btn {
        flex: 1;
        height: 44px !important;
        border-radius: 12px !important;
        font-weight: 600 !important;
        font-size: 14px !important;
    }

    /* =====================================================
       DELIVERY PAGE - TABLET & DESKTOP OVERRIDES
       ===================================================== */
    @media (min-width: 768px) {
        .delivery-page-container {
            padding-bottom: 40px;
        }

        .delivery-hero-mobile {
            padding: 24px 24px 32px !important;
            border-radius: 0 0 36px 36px !important;
        }

        .delivery-sticky-footer {
            position: relative;
            box-shadow: none;
            background: transparent;
            padding: 0;
            border-top: none;
        }

        .delivery-summary-content {
            max-height: none !important;
            overflow: visible !important;
        }

        .delivery-summary-header {
            cursor: default;
            background: transparent;
            border-bottom: none;
        }

        .delivery-rider-section {
            padding: 40px 32px;
        }

        .delivery-rider-icon-wrapper {
            width: 112px;
            height: 112px;
        }

        .delivery-rider-icon {
            font-size: 56px;
        }
    }

    @media (min-width: 1024px) {
        .delivery-hero-mobile {
            padding: 28px 32px 40px !important;
        }

        .delivery-rider-section:hover {
            transform: translateY(-4px);
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
        }
    }
`},54354:(t,e,r)=>{function o(t,e,r,o=t=>t.id,i=()=>!0){}function i({socket:t,events:e=[],onRefresh:r,intervalMs:o,enabled:i=!0,debounceMs:a}){}r.d(e,{D:()=>i,v:()=>o}),r(17577)}};