"use strict";exports.id=8498,exports.ids=[8498],exports.modules={93922:(t,r,e)=>{e.d(r,{Np:()=>n,X1:()=>a,ax:()=>o,hS:()=>i});let a={primary:"#6366F1",primaryLight:"#EEF2FF",primaryDark:"#4F46E5",success:"#10B981",successLight:"#ECFDF5",warning:"#F59E0B",warningLight:"#FFFBEB",error:"#EF4444",errorLight:"#FEF2F2",info:"#3B82F6",infoLight:"#EFF6FF",background:"#F8FAFC",cardBg:"#FFFFFF",border:"#E2E8F0",borderLight:"#F1F5F9",text:"#1E293B",textSecondary:"#64748B",textMuted:"#94A3B8",textInverse:"#FFFFFF",dineIn:"#3B82F6",takeaway:"#10B981",delivery:"#8B5CF6",kitchen:"#F97316",shift:"#10B981",kitchenBg:"#0F172A",kitchenCard:"rgba(30, 41, 59, 0.8)",kitchenBorder:"rgba(255, 255, 255, 0.1)"},i={dineIn:{primary:"#3B82F6",light:"#EFF6FF",border:"#BFDBFE",gradient:"linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",iconBg:"rgba(59, 130, 246, 0.1)"},takeaway:{primary:"#10B981",light:"#ECFDF5",border:"#A7F3D0",gradient:"linear-gradient(135deg, #10B981 0%, #059669 100%)",iconBg:"rgba(16, 185, 129, 0.1)"},delivery:{primary:"#8B5CF6",light:"#F5F3FF",border:"#DDD6FE",gradient:"linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",iconBg:"rgba(139, 92, 246, 0.1)"}},o={available:{primary:"#10B981",light:"#ECFDF5",border:"#A7F3D0",gradient:"linear-gradient(135deg, #10B981 0%, #059669 100%)",text:"#065F46"},occupied:{primary:"#F59E0B",light:"#FFFBEB",border:"#FCD34D",gradient:"linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",text:"#92400E"},inactive:{primary:"#94A3B8",light:"#F8FAFC",border:"#CBD5E1",gradient:"linear-gradient(135deg, #94A3B8 0%, #64748B 100%)",text:"#475569"},waitingForPayment:{primary:"#3B82F6",light:"#EFF6FF",border:"#BFDBFE",gradient:"linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",text:"#1E40AF"}},n={container:{minHeight:"100vh",background:a.background,fontFamily:"var(--font-sans), 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",paddingBottom:100},header:{background:`linear-gradient(135deg, ${a.primary} 0%, ${a.primaryDark} 100%)`,padding:"16px 16px 48px",position:"relative",borderBottomLeftRadius:20,borderBottomRightRadius:20,overflow:"hidden"},heroHeader:{background:`linear-gradient(135deg, ${a.primary} 0%, ${a.primaryDark} 100%)`,padding:"24px 20px 56px",position:"relative",borderBottomLeftRadius:24,borderBottomRightRadius:24,boxShadow:"0 4px 20px rgba(99, 102, 241, 0.2)",marginBottom:-40,zIndex:1,overflow:"hidden"},contentWrapper:{maxWidth:1200,margin:"-32px auto 0",padding:"0 16px",position:"relative",zIndex:10},card:{borderRadius:16,boxShadow:"0 2px 8px rgba(0, 0, 0, 0.04)",border:`1px solid ${a.border}`,overflow:"hidden",background:a.cardBg},itemCard:{marginBottom:8,borderRadius:12,border:`1px solid ${a.borderLight}`,transition:"all 0.2s ease",background:a.cardBg},kitchenContainer:{minHeight:"100vh",background:a.kitchenBg,padding:"16px 16px 100px",color:"#F8FAFC",fontFamily:"var(--font-sans), 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"},kitchenGlassCard:{background:a.kitchenCard,backdropFilter:"blur(12px)",border:`1px solid ${a.kitchenBorder}`,borderRadius:16,boxShadow:"0 8px 32px rgba(0, 0, 0, 0.3)",overflow:"hidden"},kitchenHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12},sectionTitle:{display:"flex",alignItems:"center",gap:10,marginBottom:16,fontSize:16,fontWeight:600,color:a.text}}},43401:(t,r,e)=>{e.d(r,{$k:()=>l,B9:()=>p,Qo:()=>n,_A:()=>i,il:()=>d,m4:()=>m,mv:()=>a});let a={primary:"#3B82F6",primaryLight:"#EFF6FF",primaryDark:"#2563EB",primaryGradient:"linear-gradient(145deg, #3B82F6 0%, #60A5FA 50%, #93C5FD 100%)",pending:"#F59E0B",pendingLight:"#FFFBEB",cooking:"#3B82F6",cookingLight:"#EFF6FF",served:"#10B981",servedLight:"#ECFDF5",paid:"#06B6D4",paidLight:"#ECFEFF",cancelled:"#EF4444",cancelledLight:"#FEF2F2",success:"#10B981",danger:"#EF4444",dangerLight:"#FEF2F2",warning:"#F59E0B",priceTotal:"#059669",waitingForPayment:"#8B5CF6",waitingForPaymentLight:"#F5F3FF",dineIn:"#3B82F6",takeAway:"#F59E0B",delivery:"#8B5CF6",text:"#1E293B",textSecondary:"#64748B",textLight:"#94A3B8",textMuted:e(93922).X1.textMuted,background:"#F8FAFC",backgroundSecondary:"#F1F5F9",white:"#FFFFFF",border:"#E2E8F0",borderLight:"#F1F5F9",cardShadow:"0 4px 16px rgba(0, 0, 0, 0.04)",cardShadowHover:"0 12px 32px rgba(0, 0, 0, 0.08)"},i=a,o={pageTitle:{fontSize:28,fontWeight:700,lineHeight:1.2,margin:0,color:a.text},sectionTitle:{fontSize:20,fontWeight:600,lineHeight:1.4,color:a.text},cardTitle:{fontSize:17,fontWeight:600,lineHeight:1.3,color:a.text},cardRef:{fontSize:19,fontWeight:700,lineHeight:1.2,color:a.text},label:{fontSize:15,fontWeight:500,color:a.textSecondary}},n=o;a.background,a.primaryGradient,a.cardShadow,a.textSecondary,a.cardShadow,a.white,a.cardShadowHover,a.primary,a.borderLight,a.borderLight,o.label,o.cardRef,a.text,a.primaryLight,a.primaryDark,a.primary,a.servedLight,a.served,a.textSecondary,a.priceTotal,a.textSecondary,a.cardShadow,a.cardShadow;let p={container:{minHeight:"100vh",background:a.background,paddingBottom:100},header:{background:`linear-gradient(180deg, ${a.white} 0%, rgba(255, 255, 255, 0.98) 100%)`,backdropFilter:"blur(20px) saturate(180%)",padding:"14px 20px",borderBottom:`1px solid ${a.border}`,position:"sticky",top:0,zIndex:100,boxShadow:"0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.08)",transition:"all 0.3s ease"},headerContent:{maxWidth:1200,margin:"0 auto",display:"flex",alignItems:"center",gap:12},headerBackButton:{width:42,height:42,borderRadius:12,background:`linear-gradient(135deg, ${a.backgroundSecondary} 0%, ${a.white} 100%)`,border:`1px solid ${a.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:a.text,cursor:"pointer",transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",flexShrink:0,boxShadow:"0 2px 8px rgba(0, 0, 0, 0.04)"},headerTitle:{fontSize:18,fontWeight:700,margin:0,color:a.text,flex:1,lineHeight:1.3},headerSubtitle:{fontSize:12,color:a.textSecondary},tableNameBadge:{background:"linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)",color:"#ffffff",fontWeight:600,fontSize:13,padding:"5px 12px",borderRadius:8,boxShadow:"0 2px 8px rgba(139, 92, 246, 0.2)",border:"none",display:"inline-flex",alignItems:"center",margin:0,height:"fit-content",lineHeight:1.3},channelBadge:{fontWeight:500,fontSize:12,borderRadius:8,padding:"4px 12px",display:"flex",alignItems:"center",gap:4,height:26,border:"none",lineHeight:1.3},headerMetaRow:{display:"flex",alignItems:"center",gap:8,marginTop:4,flexWrap:"wrap"},headerMetaSeparator:{height:12,width:1,background:a.border,margin:"0 2px"},contentWrapper:{maxWidth:1200,margin:"0 auto",padding:"20px 16px"},card:{borderRadius:16,overflow:"hidden",boxShadow:"0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.08)",border:`1px solid ${a.border}`,marginBottom:16,background:a.white,transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",position:"relative"},cardHeader:{background:a.white,padding:"16px 20px",borderBottom:`1px solid ${a.borderLight}`},summaryCard:{borderRadius:16,boxShadow:"0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.08)",background:`linear-gradient(180deg, ${a.white} 0%, ${a.backgroundSecondary} 100%)`,padding:20,border:`1px solid ${a.border}`,position:"sticky",top:80,transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"},summaryRow:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0"},summaryList:{background:`linear-gradient(135deg, ${a.white} 0%, ${a.backgroundSecondary} 100%)`,padding:"16px 18px",borderRadius:12,marginBottom:"16px",border:`1px solid ${a.border}`,boxShadow:"0 2px 8px rgba(0, 0, 0, 0.04)",transition:"all 0.2s ease"},summaryMainRow:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",marginTop:"4px"},summaryItemRow:{display:"flex",flexDirection:"row",gap:14,padding:"14px 0",borderBottom:"1px solid rgba(226, 232, 240, 0.6)",transition:"all 0.2s ease"},summaryItemRowLast:{borderBottom:"none"},summaryItemImage:{width:48,height:48,borderRadius:12,objectFit:"cover",flexShrink:0,border:`2px solid ${a.borderLight}`,boxShadow:"0 2px 8px rgba(0, 0, 0, 0.06)",transition:"all 0.2s ease"},summaryItemContent:{flex:1,minWidth:0},summaryDetailText:{fontSize:12,color:a.success,marginTop:2,paddingLeft:0},emptyState:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"48px 24px",background:a.backgroundSecondary,borderRadius:16,gap:16},loadingState:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"80vh",width:"100%"},completeCard:{background:`linear-gradient(135deg, ${a.servedLight} 0%, #D1FAE5 100%)`,padding:"24px",borderRadius:16,border:`1px solid ${a.served}25`,textAlign:"center"},itemCard:{background:a.white,borderRadius:14,padding:16,marginBottom:12,border:`1px solid ${a.border}`,transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",boxShadow:"0 2px 12px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)",position:"relative"},itemCardActive:{borderLeft:`4px solid ${a.primary}`,background:`linear-gradient(90deg, ${a.primaryLight}05 0%, ${a.white} 8%)`,boxShadow:"0 4px 16px rgba(59, 130, 246, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)"},itemCardServed:{background:`linear-gradient(90deg, ${a.servedLight}08 0%, ${a.backgroundSecondary} 8%)`,borderLeft:`4px solid ${a.served}`,boxShadow:"0 2px 12px rgba(16, 185, 129, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)"},floatingActions:{position:"fixed",bottom:120,left:"50%",transform:"translateX(-50%)",background:"rgba(255, 255, 255, 0.98)",backdropFilter:"blur(12px)",padding:"12px 20px",borderRadius:20,boxShadow:"0 12px 40px rgba(0,0,0,0.2)",zIndex:1e3,display:"flex",gap:10,alignItems:"center",minWidth:"max-content",border:`1px solid ${a.border}`},floatingActionButton:{borderRadius:14,height:44,padding:"0 24px",fontSize:14,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 4px 12px rgba(0,0,0,0.08)"},bulkActionButtonDesktop:{padding:"0 12px",height:32,fontSize:12,borderRadius:8,fontWeight:500,display:"flex",alignItems:"center",gap:6,transition:"all 0.2s ease"},actionButtonSecondary:{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,border:`1px solid ${a.border}`,background:a.white,color:a.textSecondary,cursor:"pointer",transition:"all 0.2s ease",padding:0},unserveButton:{borderRadius:8,height:32,fontSize:12,fontWeight:500,display:"flex",alignItems:"center",gap:6,border:`1px solid ${a.danger}`,color:a.danger,backgroundColor:a.dangerLight,transition:"all 0.2s ease"},actionButtonPrimary:{height:36,padding:"0 12px",display:"flex",alignItems:"center",gap:6,borderRadius:8,background:`linear-gradient(135deg, ${a.primary} 0%, ${a.primaryDark} 100%)`,color:a.white,border:"none",fontWeight:500,fontSize:13,cursor:"pointer",transition:"all 0.2s ease",boxShadow:`0 2px 8px ${a.primary}25`},productThumb:{width:56,height:56,borderRadius:12,objectFit:"cover",border:`2px solid ${a.borderLight}`,boxShadow:"0 2px 8px rgba(0, 0, 0, 0.06)",transition:"all 0.2s ease"},productThumbPlaceholder:{width:56,height:56,borderRadius:12,background:`linear-gradient(135deg, ${a.backgroundSecondary} 0%, ${a.borderLight} 100%)`,display:"flex",alignItems:"center",justifyContent:"center",color:a.textLight,fontSize:20,opacity:.6,border:`2px solid ${a.borderLight}`,boxShadow:"0 2px 8px rgba(0, 0, 0, 0.04)"},categoryTag:{fontSize:11,borderRadius:6,padding:"3px 10px",margin:"2px 0 0 0",fontWeight:600,border:"none"},priceTag:{fontSize:16,color:a.primary,fontWeight:600},masterCheckboxWrapper:{display:"inline-flex",padding:"8px",background:a.primaryLight,borderRadius:"10px",border:`1px solid ${a.primary}30`,boxShadow:"0 2px 8px rgba(59, 130, 246, 0.1)",transition:"all 0.2s ease"},masterCheckbox:{transform:"scale(1.2)"}},d={mobileModal:{top:0,margin:0,padding:0,maxWidth:"100vw"},modalHeader:{display:"flex",alignItems:"center",gap:14,padding:"16px 20px",borderBottom:`1px solid ${a.borderLight}`,background:a.white,position:"sticky",top:0,zIndex:10},quantityControl:{display:"flex",alignItems:"center",justifyContent:"center",gap:20,padding:"20px",background:a.primaryLight,borderRadius:16,border:`1px solid ${a.primary}20`},quantityButton:{width:48,height:48,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:600,transition:"all 0.2s ease"},quantityDisplay:{fontSize:32,fontWeight:700,color:a.primary,minWidth:60,textAlign:"center",lineHeight:1},priceCard:{background:`linear-gradient(135deg, ${a.servedLight} 0%, #D1FAE5 100%)`,padding:"18px 22px",borderRadius:16,border:`1px solid ${a.served}25`,display:"flex",justifyContent:"space-between",alignItems:"center"},priceValue:{fontSize:20,fontWeight:700,color:a.priceTotal},actionButtons:{display:"flex",gap:12,padding:"16px 20px",borderTop:`1px solid ${a.borderLight}`,background:a.white,position:"sticky",bottom:0,zIndex:10},primaryButton:{flex:2,height:52,borderRadius:14,fontWeight:600,fontSize:16,background:`linear-gradient(135deg, ${a.primary} 0%, ${a.primaryDark} 100%)`,border:"none",boxShadow:`0 6px 16px ${a.primary}30`,transition:"all 0.2s ease"},secondaryButton:{flex:1,height:52,borderRadius:14,fontWeight:500,fontSize:15,border:`1px solid ${a.border}`,background:a.white,transition:"all 0.2s ease"}},m={searchBar:{padding:"14px 20px",borderBottom:`1px solid ${a.borderLight}`,position:"sticky",top:0,background:"rgba(255, 255, 255, 0.95)",backdropFilter:"blur(10px)",zIndex:10},searchInput:{borderRadius:14,height:48,border:`1px solid ${a.border}`},productGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))",gap:14,padding:20},productCard:{borderRadius:18,overflow:"hidden",transition:"all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",cursor:"pointer",border:`1px solid ${a.border}`,background:a.white,boxShadow:a.cardShadow},productCardHover:{transform:"translateY(-4px)",boxShadow:a.cardShadowHover,borderColor:a.primary},productImage:{width:"100%",height:110,objectFit:"cover"},productPlaceholder:{width:"100%",height:110,background:`linear-gradient(135deg, ${a.primaryLight} 0%, #DBEAFE 100%)`,display:"flex",alignItems:"center",justifyContent:"center",color:a.primary,fontSize:14,opacity:.5},productInfo:{padding:"14px 12px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:6,minHeight:70,justifyContent:"center"},productName:{fontSize:14,fontWeight:600,marginBottom:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:a.text,width:"100%",lineHeight:1.4},productPrice:{fontSize:16,fontWeight:700,color:a.primary,lineHeight:1.2},detailSection:{padding:"20px"},detailImage:{width:"100%",maxHeight:200,objectFit:"cover",borderRadius:16,boxShadow:a.cardShadow},detailItemRow:{display:"flex",alignItems:"center",gap:10,marginBottom:12,padding:"12px 14px",background:a.backgroundSecondary,borderRadius:12,border:`1px solid ${a.border}`,transition:"all 0.2s ease"},detailItemRowHover:{background:a.primaryLight,borderColor:a.primary}},l=`
  /* ===== Global Animations ===== */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
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

  .fade-in {
    animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .scale-in {
    animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .scale-hover {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .scale-hover:hover {
    transform: scale(1.05);
  }

  .scale-hover:active {
    transform: scale(0.98);
  }

  /* Enhanced card hover effects */
  .order-detail-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .order-detail-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.1) !important;
    transform: translateY(-2px);
  }

  /* Smooth transitions for item cards */
  .order-item-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .order-item-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.1) !important;
  }

  /* ===== Mobile (< 768px) ===== */
  @media (max-width: 768px) {
    /* List Page */
    .orders-header {
      padding: 20px 16px 44px !important;
      border-radius: 0 0 20px 20px !important;
    }

    .orders-header-icon {
      font-size: 32px !important;
      padding: 12px !important;
      border-radius: 14px !important;
    }

    .orders-page-title {
      font-size: 20px !important;
    }

    .orders-page-subtitle {
      font-size: 12px !important;
    }

    .orders-content-wrapper {
      padding: 0 16px !important;
      margin-top: -20px !important;
    }

    .orders-filter-section {
      padding: 12px 14px !important;
      border-radius: 16px !important;
    }

    .orders-card-body {
      padding: 16px !important;
    }

    .orders-ref-value {
      font-size: 15px !important;
    }

    .orders-total-amount {
      font-size: 20px !important;
    }

    /* Detail Page */
    .order-detail-header {
      padding: 10px 12px !important;
    }

    .order-detail-header .header-content {
      gap: 10px !important;
    }

    .order-detail-header .header-back-button {
      width: 36px !important;
      height: 36px !important;
    }

    .order-detail-header .header-title {
      font-size: 15px !important;
    }

    .order-detail-content {
      padding: 12px !important;
    }

    .order-detail-card {
      margin-bottom: 10px !important;
      border-radius: 12px !important;
    }

    .order-detail-card .ant-card-head {
      padding: 12px 14px !important;
      min-height: auto !important;
      border-bottom: 1px solid #E2E8F0 !important;
    }

    .order-detail-card .ant-card-head-title {
      font-size: 17px !important;
      font-weight: 600 !important;
      padding: 0 !important;
      width: 100% !important;
    }

    .order-detail-card .ant-card-body {
      padding: 12px 14px !important;
    }

    /* Card Header Layout */
    .card-header-wrapper {
      display: flex !important;
      flex-direction: column !important;
      gap: 10px !important;
      width: 100% !important;
    }

    .card-header-top-row {
      display: flex !important;
      flex-direction: row !important;
      justify-content: space-between !important;
      align-items: center !important;
      gap: 8px !important;
      width: 100% !important;
    }

    .card-header-left {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      flex: 1 !important;
      min-width: 0 !important;
      flex-wrap: nowrap !important;
    }

    .section-title-text {
      font-size: 17px !important;
      line-height: 1.4 !important;
      font-weight: 600 !important;
    }

    .card-header-right {
      display: flex !important;
      align-items: center !important;
      justify-content: flex-end !important;
      gap: 6px !important;
      flex-wrap: nowrap !important;
      flex-shrink: 0 !important;
    }

    /* Bulk Actions Container - อยู่ฝั่งซ้าย ข้างล่าง Title ใน mobile */
    .bulk-actions-container {
      display: flex !important;
      gap: 6px !important;
      align-items: center !important;
      flex-wrap: nowrap !important;
      width: 100% !important;
      margin-top: 8px !important;
      padding-left: 0 !important;
    }

    .bulk-action-btn {
      flex: 1 !important;
      min-width: 0 !important;
      height: 32px !important;
      font-size: 12px !important;
      padding: 0 10px !important;
    }

    .bulk-action-btn span {
      font-size: 12px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    /* Header Actions Container - แสดงเสมอ */
    .header-actions-container {
      display: flex !important;
      gap: 6px !important;
      align-items: center !important;
      flex-shrink: 0 !important;
    }

    .section-title-text {
      font-size: 17px !important;
      line-height: 1.4 !important;
      font-weight: 600 !important;
    }

    /* Bulk Actions */
    .bulk-action-btn {
      height: 34px !important;
      font-size: 13px !important;
      border-radius: 8px !important;
      padding: 0 12px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 5px !important;
      white-space: nowrap !important;
      min-width: fit-content !important;
      font-weight: 500 !important;
    }

    .bulk-action-btn .anticon {
      font-size: 13px !important;
      flex-shrink: 0 !important;
    }

    .bulk-action-btn span {
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .header-action-btn {
      height: 34px !important;
      min-width: 34px !important;
      border-radius: 8px !important;
      font-size: 13px !important;
      padding: 0 12px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
      transition: all 0.2s ease !important;
      font-weight: 500 !important;
    }

    .header-action-btn.ant-btn-icon-only {
      width: 34px !important;
      padding: 0 !important;
    }

    .header-action-btn:hover {
      transform: translateY(-1px) !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
    }

    .header-action-btn:active {
      transform: translateY(0) !important;
    }

    .header-action-btn span {
      white-space: nowrap !important;
    }

    .order-detail-card .ant-card-head-title {
      font-size: 16px !important;
      font-weight: 600 !important;
    }

    .summary-card {
      padding: 16px !important;
      border-radius: 16px !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.08) !important;
    }

    .summary-card .ant-card-body {
      padding: 16px !important;
    }

    .summary-card .ant-card-head {
      padding: 12px 14px !important;
      border-bottom: 1px solid #E2E8F0 !important;
    }

    .summary-card .ant-card-head-title {
      font-size: 15px !important;
      font-weight: 600 !important;
    }

    /* Better button spacing on mobile */
    .summary-card .ant-btn {
      margin-top: 12px !important;
      height: 44px !important;
      font-size: 14px !important;
      border-radius: 10px !important;
    }

    .summary-card .ant-btn-lg {
      height: 44px !important;
      font-size: 14px !important;
    }

    /* Better spacing in summary */
    .summary-list {
      padding: 10px 12px !important;
      margin-bottom: 10px !important;
    }

    .summary-item-row {
      padding: 10px 0 !important;
    }

    .summary-item-image {
      width: 40px !important;
      height: 40px !important;
    }

    /* Queue button on mobile */
    .queue-action-button {
      height: 36px !important;
      font-size: 13px !important;
      padding: 0 12px !important;
    }

    /* Product Grid - 2 columns */
    .product-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 12px !important;
      padding: 16px !important;
    }

    .product-card-hoverable {
      min-height: 180px !important;
    }

    .product-card-hoverable .product-info {
      padding: 12px 10px !important;
      min-height: 65px !important;
    }

    .product-card-hoverable .product-name {
      font-size: 13px !important;
    }

    .product-card-hoverable .product-price {
      font-size: 15px !important;
    }

    /* Item Cards */
    .order-item-card {
      border-radius: 14px !important;
      margin-bottom: 12px !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.08) !important;
      padding: 16px !important;
    }

    .order-item-card:active {
      transform: scale(0.98) !important;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08) !important;
    }

    .order-item-card:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.12) !important;
      transform: translateY(-2px) !important;
    }

    /* Better spacing for mobile cards */
    .order-item-card > div:first-child {
      margin-bottom: 10px !important;
    }

    .order-item-card .ant-checkbox-wrapper {
      padding: 4px !important;
    }

    .order-item-card .ant-checkbox-wrapper span:last-child {
      font-size: 16px !important;
      line-height: 1.5 !important;
      font-weight: 600 !important;
    }

    /* Better text sizing on mobile */
    .order-item-card .ant-typography {
      font-size: 14px !important;
      line-height: 1.5 !important;
    }

    .order-item-card .ant-typography strong {
      font-size: 16px !important;
    }

    .order-item-card .ant-tag {
      font-size: 10px !important;
      padding: 3px 8px !important;
      line-height: 1.3 !important;
    }

    /* Action Buttons - Stack */
    .order-detail-actions {
      flex-direction: column !important;
      gap: 10px !important;
    }

    .order-detail-actions button {
      width: 100% !important;
      height: 48px !important;
      border-radius: 12px !important;
      font-size: 15px !important;
    }

    /* Table Hide */
    .order-detail-table-desktop {
      display: none !important;
    }

    .order-detail-cards-mobile {
      display: block !important;
    }

    /* Floating Action Bar */
    .floating-action-bar {
      display: flex !important;
      bottom: 110px !important;
      padding: 14px 20px !important;
      border-radius: 18px !important;
    }

    /* Modal - Fullscreen */
    .mobile-fullscreen-modal .ant-modal {
      max-width: 100vw !important;
      margin: 0 !important;
      padding: 0 !important;
      top: 0 !important;
    }

    .mobile-fullscreen-modal .ant-modal-content {
      border-radius: 0 !important;
      min-height: 100vh !important;
    }

    .mobile-fullscreen-modal .ant-modal-body {
      padding: 0 !important;
      max-height: calc(100vh - 60px) !important;
      overflow-y: auto !important;
      -webkit-overflow-scrolling: touch !important;
    }

    /* Better spacing for mobile */
    .modal-header {
      padding: 14px 16px !important;
    }

    .detail-section {
      padding: 16px !important;
    }

    .detail-section > div {
      gap: 16px !important;
    }

    /* Product info on mobile */
    .product-info-section {
      gap: 12px !important;
    }

    .product-info-section img {
      width: 80px !important;
      height: 80px !important;
    }
  }

  @media (max-width: 480px) {
    /* List Page Low Res */
    .orders-header {
      padding: 16px 14px 40px !important;
    }

    /* Card Header on Small Screens */
    .card-header-wrapper {
      gap: 8px !important;
    }

    .card-header-left {
      gap: 8px !important;
    }

    .section-title-text {
      font-size: 16px !important;
      font-weight: 600 !important;
    }

    .bulk-actions-container {
      gap: 4px !important;
    }

    .bulk-action-btn {
      height: 32px !important;
      font-size: 12px !important;
      padding: 0 10px !important;
      gap: 4px !important;
    }

    .bulk-action-btn .anticon {
      font-size: 12px !important;
    }

    .header-actions-container {
      gap: 4px !important;
    }

    .header-action-btn {
      height: 32px !important;
      min-width: 32px !important;
      font-size: 12px !important;
      padding: 0 10px !important;
    }

    .header-action-btn.ant-btn-icon-only {
      width: 32px !important;
    }

    .header-action-btn {
      height: 30px !important;
      min-width: 30px !important;
      font-size: 11px !important;
      padding: 0 8px !important;
    }

    .header-action-btn.ant-btn-icon-only {
      width: 30px !important;
    }

    .orders-header-content-mobile {
      flex-wrap: wrap !important;
      gap: 12px !important;
    }

    .orders-back-button-mobile {
      order: 1 !important;
    }

    .orders-header-icon {
      order: 2 !important;
      width: 44px !important;
      height: 44px !important;
      padding: 10px !important;
      font-size: 20px !important;
    }

    .orders-header-text-mobile {
      order: 3 !important;
      flex: 1 1 100% !important;
    }

    .orders-header-actions-mobile {
      order: 4 !important;
      width: 100% !important;
      justify-content: space-between !important;
    }

    .orders-search-input-mobile {
      flex: 1 !important;
      min-width: 120px !important;
    }

    .orders-content-wrapper {
      padding: 0 12px !important;
    }

    .orders-card-header {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 10px;
    }

    .orders-filter-section {
      flex-direction: column;
      align-items: stretch !important;
    }

    /* Product Grid - smaller gap */
    .product-grid {
      gap: 10px !important;
      padding: 14px !important;
    }

    .product-card-hoverable {
      min-height: 170px !important;
    }

    .product-card-hoverable .product-info {
      padding: 10px 8px !important;
      min-height: 60px !important;
    }

    .product-card-hoverable .product-name {
      font-size: 12px !important;
    }

    .product-card-hoverable .product-price {
      font-size: 14px !important;
    }

    .modal-header {
      padding: 14px 16px !important;
    }

    .quantity-control {
      padding: 16px !important;
      gap: 16px !important;
    }

    .quantity-button {
      width: 44px !important;
      height: 44px !important;
      font-size: 18px !important;
    }

    .quantity-display {
      font-size: 28px !important;
      min-width: 50px !important;
    }

    .action-buttons {
      padding: 14px 16px !important;
      gap: 10px !important;
    }

    .primary-button,
    .secondary-button {
      height: 48px !important;
      font-size: 15px !important;
    }
  }

  /* ===== Tablet (768px+) ===== */
  @media (min-width: 768px) {
    /* Explicitly handle visibility on tablet range to prevent double rendering */
    .order-detail-table-desktop {
      display: block !important;
    }

    .order-detail-cards-mobile {
      display: none !important;
    }

    .order-detail-header {
      padding: 16px 24px !important;
    }

    .order-detail-content {
      padding: 24px !important;
    }

    .order-detail-card .ant-card-head,
    .order-detail-card .ant-card-body {
      padding: 18px 24px !important;
    }

    .product-grid {
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 16px !important;
    }

    .order-detail-actions {
      flex-direction: row !important;
      flex-wrap: wrap !important;
      gap: 12px !important;
    }

    .order-detail-actions button {
      width: auto !important;
      flex: none !important;
    }

    .floating-action-bar {
      display: none !important;
    }

    /* Card Header Desktop - ปุ่ม bulk actions อยู่ข้างล่าง */
    .card-header-wrapper {
      flex-direction: column !important;
      gap: 12px !important;
      align-items: stretch !important;
    }

    .card-header-top-row {
      display: flex !important;
      flex-direction: row !important;
      justify-content: space-between !important;
      align-items: center !important;
      gap: 12px !important;
      width: 100% !important;
    }

    .card-header-left {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      flex: 1 !important;
      min-width: 0 !important;
      flex-wrap: nowrap !important;
      overflow: hidden !important;
    }

    .card-header-right {
      flex-wrap: nowrap !important;
      gap: 10px !important;
      display: flex !important;
      align-items: center !important;
      flex-shrink: 0 !important;
    }

    /* Bulk Actions Container - อยู่ฝั่งซ้าย ข้างล่าง title ใน desktop */
    .bulk-actions-container {
      display: flex !important;
      gap: 8px !important;
      align-items: center !important;
      flex-wrap: nowrap !important;
      margin-left: 0 !important;
      width: auto !important;
      margin-top: 0 !important;
    }

    /* Header Actions - แสดงเสมอใน desktop อยู่ฝั่งขวา */
    .header-actions-container {
      display: flex !important;
      gap: 8px !important;
      align-items: center !important;
      flex-shrink: 0 !important;
    }

    .bulk-action-btn {
      height: 38px !important;
      font-size: 14px !important;
      padding: 0 16px !important;
      white-space: nowrap !important;
      font-weight: 500 !important;
    }

    .bulk-action-btn .anticon {
      font-size: 14px !important;
    }

    .header-actions-container {
      display: flex !important;
      gap: 8px !important;
      align-items: center !important;
      flex-shrink: 0 !important;
    }

    .header-action-btn {
      height: 38px !important;
      min-width: 38px !important;
      font-size: 14px !important;
      padding: 0 16px !important;
      font-weight: 500 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    .header-action-btn.ant-btn-icon-only {
      width: 38px !important;
      padding: 0 !important;
    }

    /* Modal - Normal */
    .mobile-fullscreen-modal .ant-modal {
      max-width: 600px !important;
      margin: 24px auto !important;
      top: auto !important;
    }

    .mobile-fullscreen-modal .ant-modal-content {
      border-radius: 20px !important;
      min-height: auto !important;
    }

    .mobile-fullscreen-modal .ant-modal-body {
      max-height: calc(100vh - 200px) !important;
      padding: 0 !important;
    }
  }

  /* ===== Desktop (1024px+) ===== */
  @media (min-width: 1024px) {
    .order-detail-content {
      padding: 28px !important;
    }

    .product-grid {
      grid-template-columns: repeat(4, 1fr) !important;
      gap: 18px !important;
    }

    .order-detail-table-desktop {
      display: block !important;
    }

    .order-detail-cards-mobile {
      display: none !important;
    }

    .mobile-fullscreen-modal .ant-modal {
      max-width: 720px !important;
    }

    /* Card Header Desktop - ปุ่ม bulk actions อยู่ข้างล่าง */
    .card-header-wrapper {
      flex-direction: column !important;
      gap: 14px !important;
      align-items: stretch !important;
    }

    .card-header-top-row {
      display: flex !important;
      flex-direction: row !important;
      justify-content: space-between !important;
      align-items: center !important;
      gap: 12px !important;
      width: 100% !important;
    }

    .card-header-right {
      display: flex !important;
      align-items: center !important;
      justify-content: flex-end !important;
      gap: 10px !important;
      flex-wrap: nowrap !important;
    }

    /* Bulk Actions Container - อยู่ข้างล่าง title ในหน้าจอใหญ่ */
    .bulk-actions-container {
      margin-left: 0 !important;
      gap: 10px !important;
    }

    .header-actions-container {
      display: flex !important;
      gap: 10px !important;
      align-items: center !important;
      flex-shrink: 0 !important;
    }

    .header-action-btn {
      height: 38px !important;
      min-width: 38px !important;
      font-size: 14px !important;
      padding: 0 16px !important;
      font-weight: 500 !important;
    }

    .header-action-btn.ant-btn-icon-only {
      width: 38px !important;
      padding: 0 !important;
    }
  }

  /* ===== Utilities ===== */
  .hide-on-mobile {
    display: none !important;
  }

  .show-on-mobile-inline {
    display: inline-block !important;
  }

  .bulk-action-btn {
    padding: 0 10px !important;
    min-width: 44px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  @media (min-width: 768px) {
    .hide-on-mobile {
      display: flex !important;
    }
    
    .show-only-mobile,
    .show-on-mobile-inline {
      display: none !important;
    }

    .bulk-action-btn {
      padding: 0 14px !important;
      min-width: auto !important;
    }
  }

  /* ===== Card Hover ===== */
  .orders-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
    border-color: #3B82F6;
  }

  .orders-card:active {
    transform: scale(0.99);
  }

  .product-card-hoverable:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
    border-color: #3B82F6;
  }

  .product-card-hoverable:active {
    transform: scale(0.98);
  }

  .detail-item-row:hover {
    background: #EFF6FF !important;
    border-color: #3B82F6 !important;
  }

  .primary-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4) !important;
  }

  .primary-button:active {
    transform: translateY(0);
  }

  .secondary-button:hover {
    background: #F8FAFC !important;
    border-color: #3B82F6 !important;
  }

  .quantity-button:hover {
    transform: scale(1.05);
  }

  .quantity-button:active {
    transform: scale(0.95);
  }

  /* ===== Animations ===== */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px) translateX(-50%); }
    to { opacity: 1; transform: translateY(0) translateX(-50%); }
  }

  .fade-in {
    animation: fadeIn 0.35s ease forwards;
  }

  .scale-in {
    animation: scaleIn 0.3s ease forwards;
  }

  /* ===== Button Effects ===== */
  .scale-hover {
    transition: transform 0.2s ease;
  }

  .scale-hover:hover {
    transform: scale(1.02);
  }

  .scale-hover:active {
    transform: scale(0.98);
  }

  /* ===== Unserve Button Hover ===== */
  .unserve-button:hover {
    background-color: #FEF2F2 !important;
    border-color: #EF4444 !important;
    transform: scale(1.02);
  }

  /* ===== Hide Scrollbar ===== */
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }

  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  /* ===== Touch-Friendly Interactions ===== */
  @media (hover: none) and (pointer: coarse) {
    .scale-hover:active {
      transform: scale(0.95);
      opacity: 0.8;
    }

    .product-card-hoverable:active {
      transform: scale(0.97);
    }

    .order-item-card:active {
      transform: scale(0.97);
    }

    button:active {
      transform: scale(0.96);
    }
  }

  /* ===== Improved Touch Targets ===== */
  @media (max-width: 768px) {
    button,
    .ant-btn {
      min-height: 44px !important;
      min-width: 44px !important;
    }

    .ant-input,
    .ant-input-number {
      min-height: 44px !important;
    }

    .ant-checkbox-wrapper {
      padding: 8px !important;
    }
  }

  /* ===== Smooth Scrolling ===== */
  .order-detail-content,
  .mobile-fullscreen-modal .ant-modal-body {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }

  /* ===== Better Focus States ===== */
  .ant-input:focus,
  .ant-input-number:focus,
  .ant-input-number-focused {
    border-color: #3B82F6 !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
  }

  /* ===== Loading States ===== */
  .ant-btn-loading {
    pointer-events: none;
    opacity: 0.7;
  }

  /* ===== Empty State Improvements ===== */
  .empty-state-icon {
    font-size: 56px !important;
    color: #94A3B8 !important;
    margin-bottom: 16px !important;
    display: block !important;
  }

  .empty-state-text {
    font-size: 15px !important;
    color: #64748B !important;
    margin: 0 !important;
    display: block !important;
  }
`},10985:(t,r,e)=>{var a;e.d(r,{c:()=>a}),function(t){t.Available="Available",t.Unavailable="Unavailable"}(a||(a={}))},95963:(t,r,e)=>{e.d(r,{EO:()=>F,Gs:()=>m,HL:()=>k,M9:()=>v,Nz:()=>b,OY:()=>n,Rr:()=>y,Wl:()=>o,d$:()=>B,d7:()=>d,iN:()=>c,jN:()=>h,ku:()=>f,mz:()=>l,qO:()=>s,s6:()=>p,xG:()=>x,yj:()=>w,zP:()=>g,zf:()=>S});var a=e(13976),i=e(10985);let o=t=>{if(t.status===i.c.Available)return`/pos/channels/dine-in/${t.id}`;let r=t.active_order_id||t.active_order?.id,e=t.active_order_status||t.active_order?.status;return r?e===a.i.WaitingForPayment?`/pos/items/payment/${r}`:`/pos/orders/${r}`:`/pos/channels/dine-in/${t.id}`},n=t=>{switch(t){case a.i.Pending:return"orange";case a.i.Cooking:return"blue";case a.i.Served:return"green";case a.i.Paid:return"cyan";case a.i.Cancelled:return"red";case a.i.WaitingForPayment:return"gold";default:if("cancelled"===String(t??"").trim().toLowerCase())return"red";return"default"}},p=t=>"cancelled"===String(t??"").trim().toLowerCase(),d=(t,r)=>{switch(t){case a.i.Pending:return"กำลังดำเนินการ";case a.i.Cooking:return"กำลังปรุง";case a.i.Served:if("TakeAway"===r||"Delivery"===r)return"ทำแล้ว";return"เสิร์ฟแล้ว";case a.i.Paid:return"ชำระเงินแล้ว";case a.i.Completed:return"สำเร็จ";case a.i.Cancelled:return"ยกเลิก";case a.i.WaitingForPayment:return"รอชำระเงิน";default:if(p(t))return"ยกเลิก";return t}},m=t=>{switch(t){case"DineIn":return"#722ed1";case"TakeAway":return"#fa8c16";case"Delivery":return"#eb2f96";default:return"#1890ff"}},l=t=>{switch(t){case"DineIn":return"ทานที่ร้าน";case"TakeAway":return"สั่งกลับบ้าน";case"Delivery":return"เดลิเวอรี่";default:return t}},s=t=>"DineIn"===t?"เสิร์ฟ":"ทำแล้ว",c=t=>"Delivery"===t?"จัดออเดอร์เสร็จแล้วพร้อมส่งให้ไรเดอร์":"DineIn"===t?"ยืนยันเสิร์ฟพร้อมชำระเงิน":"ยืนยันทำแล้วพร้อมชำระเงิน",g=t=>"DineIn"===t?"เสิร์ฟอาหารแล้ว":"ปรุงเสร็จแล้ว",x=t=>{let r="string"==typeof t?parseFloat(t):t;return`฿${Number(r).toLocaleString("th-TH",{minimumFractionDigits:0,maximumFractionDigits:2})}`},h=t=>"DineIn"===t.order_type?t.table?.table_name||"ไม่ระบุโต๊ะ":"Delivery"===t.order_type?t.delivery_code||t.delivery?.delivery_name||"ไม่ระบุข้อมูล":"TakeAway"===t.order_type?t.order_no||"ไม่ระบุเลขที่":t.order_no||"N/A",b=t=>(t??[]).filter(t=>!p(t.status)),u=t=>(t??[]).reduce((t,r)=>t+(Number(r.extra_price)||0),0),f=(t,r,e)=>((Number(t)||0)+u(e))*r,y=t=>b(t).reduce((t,r)=>{let e=r.product?.category?.display_name||"ไม่ระบุหมวด";return t[e]=(t[e]||0)+(r.quantity||0),t},{}),w=t=>b(t).reduce((t,r)=>t+Number(r.total_price||0),0),F=t=>"DineIn"===t.order_type?"/pos/channels/dine-in":"TakeAway"===t.order_type?"/pos/channels/takeaway":"Delivery"===t.order_type?"/pos/channels/delivery":"/pos/orders",k=t=>`/pos/orders/${t}`,v=t=>t.status===a.i.WaitingForPayment?t.order_type===a.m.Delivery?`/pos/items/delivery/${t.id}`:`/pos/items/payment/${t.id}`:`/pos/orders/${t.id}`,B=t=>t===a.m.Delivery?"/pos/channels/delivery":t===a.m.TakeAway?"/pos/channels/takeaway":t===a.m.DineIn?"/pos/channels/dine-in":"/pos/channels",S=(t,r,e,i)=>({order_no:i.orderNo||`ORD-${Date.now()}`,order_type:r,sub_total:e.subTotal,discount_amount:e.discountAmount,vat:0,total_amount:e.totalAmount,received_amount:0,change_amount:0,status:a.i.Pending,discount_id:i.discountId||null,payment_method_id:null,table_id:i.tableId||null,delivery_id:i.deliveryId||null,delivery_code:i.deliveryCode||null,items:t.map(t=>{let e=r===a.m.Delivery?Number(t.product.price_delivery??t.product.price):Number(t.product.price),i=(e+(t.details||[]).reduce((t,r)=>t+Number(r.extra_price),0))*t.quantity;return{product_id:t.product.id,quantity:t.quantity,price:e,total_price:i,discount_amount:0,notes:t.notes||"",status:a.i.Cooking,details:t.details||[]}})})}};