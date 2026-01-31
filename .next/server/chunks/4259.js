"use strict";exports.id=4259,exports.ids=[4259],exports.modules={80440:(e,t,r)=>{r.d(t,{s:()=>o});var a=r(17577),i=r(19211);let o=()=>(0,a.useContext)(i.J)},43401:(e,t,r)=>{r.d(t,{$k:()=>c,B9:()=>p,L2:()=>d,Qo:()=>n,_A:()=>i,il:()=>l,m4:()=>s,mv:()=>a});let a={primary:"#3b82f6",primaryLight:"#eff6ff",primaryDark:"#1d4ed8",primaryGradient:"linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",pending:"#f59e0b",pendingLight:"#fef3c7",cooking:"#3b82f6",cookingLight:"#dbeafe",served:"#10b981",servedLight:"#d1fae5",paid:"#13c2c2",paidLight:"#e6fffb",cancelled:"#ef4444",cancelledLight:"#fee2e2",success:"#10b981",danger:"#ef4444",dangerLight:"#fee2e2",warning:"#f59e0b",priceTotal:"#065f46",waitingForPayment:"#faad14",waitingForPaymentLight:"#fff7e6",dineIn:"#722ed1",takeAway:"#fa8c16",delivery:"#eb2f96",text:"#1f2937",textSecondary:"#6b7280",textLight:"#9ca3af",background:"#f8fafc",backgroundSecondary:"#f1f5f9",white:"#ffffff",border:"#e2e8f0",borderLight:"#f1f5f9",cardShadow:"0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",cardShadowHover:"0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05)"},i=a,o={pageTitle:{fontSize:28,fontWeight:700,lineHeight:1.2,margin:0,color:a.text},sectionTitle:{fontSize:20,fontWeight:600,lineHeight:1.4,color:a.text},cardTitle:{fontSize:16,fontWeight:600,lineHeight:1.3,color:a.text},cardRef:{fontSize:18,fontWeight:700,lineHeight:1.2,color:a.text},label:{fontSize:13,fontWeight:500,color:a.textSecondary}},n=o,d={container:{minHeight:"100vh",background:a.background,paddingBottom:40},header:{background:a.primaryGradient,padding:"32px 24px",marginBottom:32,boxShadow:"0 4px 12px rgba(0,0,0,0.08)"},headerContent:{maxWidth:1400,margin:"0 auto",display:"flex",alignItems:"center",gap:16,color:"#fff"},headerIcon:{fontSize:48,background:"rgba(255,255,255,0.15)",borderRadius:16,padding:16,display:"flex",alignItems:"center",justifyContent:"center"},headerTextContainer:{flex:1},headerTitle:{color:"#fff",fontSize:28,fontWeight:700,margin:0,lineHeight:1.2},headerSubtitle:{color:"rgba(255,255,255,0.9)",fontSize:14,marginTop:4,display:"block"},contentWrapper:{maxWidth:1400,margin:"0 auto",padding:"0 24px"},filterSection:{background:"#fff",borderRadius:16,padding:"12px 16px",marginBottom:24,boxShadow:"0 4px 12px rgba(0,0,0,0.05)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16,border:"1px solid #f0f2f5"},filterLeft:{display:"flex",alignItems:"center",gap:10,background:"#f8fafc",padding:"6px 12px",borderRadius:10},filterRight:{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"},statsText:{fontSize:13,color:a.textSecondary,fontWeight:500},orderCard:{borderRadius:12,overflow:"hidden",border:"none",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",height:"100%",cursor:"pointer"},orderCardHover:{transform:"translateY(-4px)",boxShadow:"0 8px 24px rgba(0,0,0,0.12)"},cardHeader:{padding:"14px 16px",borderBottom:`1px solid ${a.borderLight}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:"linear-gradient(to bottom, #fafafa 0%, #ffffff 100%)"},cardHeaderLeft:{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0},cardBody:{padding:"16px 18px"},refSection:{marginBottom:14,paddingBottom:12,borderBottom:`1px solid ${a.borderLight}`},refLabel:{...o.label,marginBottom:4,display:"block"},refValue:{...o.cardRef,color:a.text,display:"flex",alignItems:"center",gap:6},itemsSummary:{background:a.primaryLight,padding:12,borderRadius:8,marginBottom:14,border:`1px solid ${a.primaryDark}20`},summaryRow:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,fontSize:13},summaryRowBold:{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8,paddingTop:8,borderTop:`1px solid ${a.primary}30`,fontWeight:600,fontSize:14},totalSection:{background:"linear-gradient(135deg, #f6ffed 0%, #e6fffb 100%)",padding:"10px 14px",borderRadius:8,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center",border:`1px solid ${a.served}30`},totalLabel:{fontSize:14,fontWeight:500,color:a.textSecondary},totalAmount:{fontSize:20,fontWeight:700,color:"#52c41a"},metaSection:{display:"flex",alignItems:"center",gap:6,color:a.textSecondary,fontSize:12,marginBottom:14},actionButton:{borderRadius:8,fontWeight:600,height:40,fontSize:14,width:"100%"},emptyState:{background:"#fff",borderRadius:12,padding:60,textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"},loadingState:{background:"#fff",borderRadius:12,padding:60,textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}},p={container:{minHeight:"100vh",background:a.background,paddingBottom:100},header:{background:a.white,padding:"12px 16px",borderBottom:`1px solid ${a.border}`,position:"sticky",top:0,zIndex:100},headerContent:{maxWidth:1200,margin:"0 auto",display:"flex",alignItems:"center",gap:12},headerTitle:{fontSize:18,fontWeight:700,margin:0,color:a.text,flex:1},headerSubtitle:{fontSize:12,color:a.textSecondary},tableNameBadge:{background:"linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",color:"#ffffff",fontWeight:800,fontSize:16,padding:"4px 14px",borderRadius:"10px",boxShadow:"0 4px 10px rgba(124, 58, 237, 0.3)",border:"none",display:"inline-flex",alignItems:"center",margin:0,height:"fit-content",textShadow:"0 1px 2px rgba(0,0,0,0.1)"},channelBadge:{fontWeight:700,fontSize:12,borderRadius:8,padding:"2px 10px",display:"flex",alignItems:"center",gap:6,height:28,border:"none",boxShadow:"0 2px 5px rgba(0,0,0,0.05)",transition:"all 0.3s ease"},headerMetaRow:{display:"flex",alignItems:"center",gap:10,marginTop:6},headerMetaSeparator:{height:14,width:1,background:"#e2e8f0",margin:"0 2px"},contentWrapper:{maxWidth:1200,margin:"0 auto",padding:"16px"},card:{borderRadius:16,overflow:"hidden",boxShadow:a.cardShadow,border:"none",marginBottom:16,background:a.white},cardHeader:{background:a.white,padding:"14px 16px",borderBottom:`1px solid ${a.borderLight}`},summaryCard:{borderRadius:16,boxShadow:a.cardShadow,background:a.white,padding:16},summaryRow:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0"},summaryList:{background:"#f8fafc",padding:"12px",borderRadius:"12px",marginBottom:"16px",border:"1px solid #e2e8f0"},summaryMainRow:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",marginTop:"4px"},summaryItemRow:{display:"flex",flexDirection:"row",gap:12,padding:"12px 0",borderBottom:"1px dashed #e2e8f0"},summaryItemImage:{width:40,height:40,borderRadius:8,objectFit:"cover",flexShrink:0,border:"1px solid #f1f5f9"},summaryItemContent:{flex:1,minWidth:0},summaryDetailText:{fontSize:12,color:a.success,marginTop:2,paddingLeft:0},emptyState:{textAlign:"center",padding:"32px 20px",background:a.backgroundSecondary,borderRadius:12},loadingState:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"80vh",width:"100%"},completeCard:{background:`linear-gradient(135deg, ${a.servedLight} 0%, #ecfdf5 100%)`,padding:"20px",borderRadius:12,border:`1px solid ${a.served}20`,textAlign:"center"},itemCard:{background:a.white,borderRadius:12,padding:14,marginBottom:10,border:`1px solid ${a.border}`,transition:"all 0.2s ease"},itemCardActive:{borderLeft:`3px solid ${a.primary}`},itemCardServed:{background:a.backgroundSecondary,borderLeft:`3px solid ${a.served}`},floatingActions:{position:"fixed",bottom:120,left:"50%",transform:"translateX(-50%)",background:"rgba(255, 255, 255, 0.98)",backdropFilter:"blur(10px)",padding:"10px 16px",borderRadius:"50px",boxShadow:"0 12px 30px rgba(0,0,0,0.25)",zIndex:1e3,display:"flex",gap:8,alignItems:"center",minWidth:"max-content",border:`1px solid ${a.border}`,animation:"slideUp 0.3s ease-out"},floatingActionButton:{borderRadius:"40px",height:42,padding:"0 20px",fontSize:14,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"},bulkActionButtonDesktop:{padding:"0 12px",height:34,fontSize:13,borderRadius:8,fontWeight:600,display:"flex",alignItems:"center",gap:6,transition:"all 0.2s ease"},actionButtonSecondary:{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,border:`1px solid ${a.border}`,background:a.white,color:a.textSecondary,cursor:"pointer",transition:"all 0.2s ease",padding:0},unserveButton:{borderRadius:12,height:32,fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:6,border:`1px solid ${a.danger}`,color:a.danger,backgroundColor:"#fff",transition:"all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",boxShadow:"0 2px 4px rgba(255, 77, 79, 0.05)"},actionButtonPrimary:{height:34,padding:"0 12px",display:"flex",alignItems:"center",gap:6,borderRadius:8,background:a.primary,color:a.white,border:"none",fontWeight:600,fontSize:13,cursor:"pointer",transition:"all 0.2s ease"},productThumb:{width:48,height:48,borderRadius:8,objectFit:"cover",border:`1px solid ${a.borderLight}`},productThumbPlaceholder:{width:48,height:48,borderRadius:8,background:a.backgroundSecondary,display:"flex",alignItems:"center",justifyContent:"center",color:a.textSecondary,fontSize:20},categoryTag:{fontSize:10,borderRadius:4,padding:"0 6px",margin:"2px 0 0 0",fontWeight:500,textTransform:"uppercase"},priceTag:{fontSize:13,color:a.primary,fontWeight:600},masterCheckboxWrapper:{display:"inline-flex",padding:"6px",background:a.primaryLight,borderRadius:"8px",border:`1px solid ${a.primary}40`,boxShadow:"0 2px 4px rgba(59, 130, 246, 0.1)",transition:"all 0.2s ease"},masterCheckbox:{transform:"scale(1.2)"}},l={mobileModal:{top:0,margin:0,padding:0,maxWidth:"100vw"},modalHeader:{display:"flex",alignItems:"center",gap:12,padding:"16px",borderBottom:`1px solid ${a.border}`},quantityControl:{display:"flex",alignItems:"center",justifyContent:"center",gap:20,padding:"16px",background:a.primaryLight,borderRadius:16},quantityButton:{width:40,height:40,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16},quantityDisplay:{fontSize:24,fontWeight:700,color:a.primary,minWidth:40,textAlign:"center"},priceCard:{background:`linear-gradient(135deg, ${a.servedLight} 0%, #ecfdf5 100%)`,padding:"16px 20px",borderRadius:12,border:`1px solid ${a.served}30`,display:"flex",justifyContent:"space-between",alignItems:"center"},priceValue:{fontSize:18,fontWeight:700,color:a.success},actionButtons:{display:"flex",gap:12,padding:"16px",borderTop:`1px solid ${a.border}`,background:a.white},primaryButton:{flex:2,height:40,borderRadius:10,fontWeight:600,fontSize:14},secondaryButton:{flex:1,height:40,borderRadius:10,fontWeight:500,fontSize:14}},s={searchBar:{padding:"12px 16px",borderBottom:`1px solid ${a.border}`,position:"sticky",top:0,background:a.white,zIndex:10},searchInput:{borderRadius:12,height:44},productGrid:{display:"grid",gap:12,padding:16},productCard:{borderRadius:14,overflow:"hidden",transition:"all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",cursor:"pointer",border:`1px solid ${a.border}`,background:a.white},productCardHover:{transform:"translateY(-2px)",boxShadow:a.cardShadowHover,borderColor:a.primary},productImage:{width:"100%",height:100,objectFit:"cover"},productPlaceholder:{width:"100%",height:100,background:`linear-gradient(135deg, ${a.backgroundSecondary} 0%, ${a.border} 100%)`,display:"flex",alignItems:"center",justifyContent:"center",color:a.textLight,fontSize:12},productInfo:{padding:"10px 12px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center"},productName:{fontSize:13,fontWeight:600,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:a.text},productPrice:{fontSize:14,fontWeight:700,color:a.primary},detailSection:{padding:"16px"},detailImage:{width:"100%",maxHeight:200,objectFit:"cover",borderRadius:12,boxShadow:a.cardShadow},detailItemRow:{display:"flex",alignItems:"center",gap:8,marginBottom:10,padding:"8px 12px",background:a.backgroundSecondary,borderRadius:10}},c=`
  @media (max-width: 768px) {
    /* List Page Responsive */
    .orders-header {
      padding: 24px 16px !important;
    }

    .orders-header-icon {
      font-size: 36px !important;
      padding: 12px !important;
    }

    .orders-page-title {
      font-size: 22px !important;
    }

    .orders-page-subtitle {
      font-size: 13px !important;
    }

    .orders-content-wrapper {
      padding: 0 16px !important;
    }

    .orders-filter-section {
      padding: 12px 16px !important;
    }

    .orders-card-body {
      padding: 14px 16px !important;
    }

    .orders-ref-value {
      font-size: 16px !important;
    }

    .orders-total-amount {
      font-size: 18px !important;
    }

    /* Detail Page Responsive */
    .order-detail-header {
      padding: 12px 16px !important;
    }

    .order-detail-content {
      padding: 12px !important;
    }

    .order-detail-card {
      margin-bottom: 12px !important;
      border-radius: 16px !important;
    }

    .order-detail-card .ant-card-head {
      padding: 12px 14px !important;
      min-height: auto !important;
    }

    .order-detail-card .ant-card-body {
      padding: 12px 14px !important;
    }

    /* Product Grid - Mobile: 2 columns */
    .product-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 10px !important;
    }

    /* Item Cards */
    .order-item-card {
      border-radius: 12px !important;
      margin-bottom: 10px !important;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .order-item-card:active {
      transform: scale(0.98);
    }

    /* Action Buttons - Stack on mobile */
    .order-detail-actions {
      flex-direction: column !important;
      gap: 8px !important;
    }

    .order-detail-actions button {
      width: 100% !important;
      height: 44px !important;
      border-radius: 10px !important;
      font-size: 14px !important;
    }

    /* Table Hide on Mobile */
    .order-detail-table-desktop {
      display: none !important;
    }

    .order-detail-cards-mobile {
      display: block !important;
    }

    /* Floating Action Bar */
    .floating-action-bar {
      display: flex !important;
    }

    /* Modal - Fullscreen on mobile */
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
      max-height: calc(100vh - 55px) !important;
      overflow-y: auto !important;
    }
  }

  @media (max-width: 480px) {
    /* List Page Low Res */
    .orders-header {
      padding: 20px 12px !important;
    }

    .orders-content-wrapper {
      padding: 0 12px !important;
    }

    .orders-card-header {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 8px;
    }

    .orders-filter-section {
      flex-direction: column;
      align-items: stretch !important;
    }
  }

  /* ===== Tablet (768px+) ===== */
  @media (min-width: 768px) {
    .order-detail-header {
      padding: 16px 24px !important;
    }

    .order-detail-content {
      padding: 20px !important;
    }

    .order-detail-card .ant-card-head,
    .order-detail-card .ant-card-body {
      padding: 16px 20px !important;
    }

    .product-grid {
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 14px !important;
    }

    .order-detail-actions {
      flex-direction: row !important;
      flex-wrap: wrap !important;
      gap: 10px !important;
    }

    .order-detail-actions button {
      width: auto !important;
      flex: none !important;
    }

    .floating-action-bar {
      display: none !important;
    }

    /* Modal - Normal on tablet+ */
    .mobile-fullscreen-modal .ant-modal {
      max-width: 600px !important;
      margin: 24px auto !important;
      top: auto !important;
    }

    .mobile-fullscreen-modal .ant-modal-content {
      border-radius: 16px !important;
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
      padding: 24px !important;
    }

    .product-grid {
      grid-template-columns: repeat(4, 1fr) !important;
      gap: 16px !important;
    }

    .order-detail-table-desktop {
      display: block !important;
    }

    .order-detail-cards-mobile {
      display: none !important;
    }

    .mobile-fullscreen-modal .ant-modal {
      max-width: 700px !important;
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
    padding: 0 8px !important;
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
      padding: 0 12px !important;
      min-width: auto !important;
    }
  }

  /* ===== Animations ===== */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  .fade-in {
    animation: fadeIn 0.3s ease forwards;
  }
`},10985:(e,t,r)=>{var a;r.d(t,{c:()=>a}),function(e){e.Available="Available",e.Unavailable="Unavailable"}(a||(a={}))},95963:(e,t,r)=>{r.d(t,{EO:()=>w,Gs:()=>p,HL:()=>S,M9:()=>k,Nz:()=>x,OY:()=>n,Rr:()=>h,Wl:()=>o,d$:()=>v,d7:()=>d,iN:()=>c,jN:()=>f,ku:()=>b,mz:()=>l,qO:()=>s,xG:()=>m,yj:()=>y,zP:()=>g,zf:()=>I});var a=r(13976),i=r(10985);let o=e=>{if(e.status===i.c.Available)return`/pos/channels/dine-in/${e.id}`;let t=e.active_order_id||e.active_order?.id,r=e.active_order_status||e.active_order?.status;return t?r===a.i.WaitingForPayment?`/pos/items/payment/${t}`:`/pos/orders/${t}`:`/pos/channels/dine-in/${e.id}`},n=e=>{switch(e){case a.i.Pending:return"orange";case a.i.Cooking:return"blue";case a.i.Served:return"green";case a.i.Paid:return"cyan";case a.i.Cancelled:return"red";case a.i.WaitingForPayment:return"gold";default:return"default"}},d=(e,t)=>{switch(e){case a.i.Pending:return"กำลังดำเนินการ";case a.i.Cooking:return"กำลังปรุง";case a.i.Served:if("TakeAway"===t||"Delivery"===t)return"ทำแล้ว";return"เสิร์ฟแล้ว";case a.i.Paid:return"ชำระเงินแล้ว";case a.i.Completed:return"สำเร็จ";case a.i.Cancelled:return"ยกเลิก";case a.i.WaitingForPayment:return"รอชำระเงิน";default:return e}},p=e=>{switch(e){case"DineIn":return"#722ed1";case"TakeAway":return"#fa8c16";case"Delivery":return"#eb2f96";default:return"#1890ff"}},l=e=>{switch(e){case"DineIn":return"ทานที่ร้าน";case"TakeAway":return"สั่งกลับบ้าน";case"Delivery":return"เดลิเวอรี่";default:return e}},s=e=>"DineIn"===e?"เสิร์ฟ":"ทำแล้ว",c=e=>"Delivery"===e?"จัดออเดอร์เสร็จแล้วพร้อมส่งให้ไรเดอร์":"DineIn"===e?"ยืนยันเสิร์ฟพร้อมชำระเงิน":"ยืนยันทำแล้วพร้อมชำระเงิน",g=e=>"DineIn"===e?"เสิร์ฟอาหารแล้ว":"ปรุงเสร็จแล้ว",m=e=>{let t="string"==typeof e?parseFloat(e):e;return`฿${Number(t).toLocaleString("th-TH",{minimumFractionDigits:0,maximumFractionDigits:2})}`},f=e=>"DineIn"===e.order_type?e.table?.table_name||"ไม่ระบุโต๊ะ":"Delivery"===e.order_type?e.delivery_code||e.delivery?.delivery_name||"ไม่ระบุข้อมูล":"TakeAway"===e.order_type?e.order_no||"ไม่ระบุเลขที่":e.order_no||"N/A",x=e=>(e??[]).filter(e=>e.status!==a.i.Cancelled),u=e=>(e??[]).reduce((e,t)=>e+(Number(t.extra_price)||0),0),b=(e,t,r)=>((Number(e)||0)+u(r))*t,h=e=>x(e).reduce((e,t)=>{let r=t.product?.category?.display_name||"ไม่ระบุหมวด";return e[r]=(e[r]||0)+(t.quantity||0),e},{}),y=e=>x(e).reduce((e,t)=>e+Number(t.total_price||0),0),w=e=>"DineIn"===e.order_type?"/pos/channels/dine-in":"TakeAway"===e.order_type?"/pos/channels/takeaway":"Delivery"===e.order_type?"/pos/channels/delivery":"/pos/orders",S=e=>`/pos/orders/${e}`,k=e=>e.status===a.i.WaitingForPayment?e.order_type===a.m.Delivery?`/pos/items/delivery/${e.id}`:`/pos/items/payment/${e.id}`:`/pos/orders/${e.id}`,v=e=>e===a.m.Delivery?"/pos/channels/delivery":e===a.m.TakeAway?"/pos/channels/takeaway":e===a.m.DineIn?"/pos/channels/dine-in":"/pos/channels",I=(e,t,r,i)=>({order_no:i.orderNo||`ORD-${Date.now()}`,order_type:t,sub_total:r.subTotal,discount_amount:r.discountAmount,vat:0,total_amount:r.totalAmount,received_amount:0,change_amount:0,status:a.i.Pending,discount_id:i.discountId||null,payment_method_id:null,table_id:i.tableId||null,delivery_id:i.deliveryId||null,delivery_code:i.deliveryCode||null,items:e.map(e=>{let t=Number(e.product.price),r=(t+(e.details||[]).reduce((e,t)=>e+Number(t.extra_price),0))*e.quantity;return{product_id:e.product.id,quantity:e.quantity,price:t,total_price:r,discount_amount:0,notes:e.notes||"",status:a.i.Cooking,details:e.details||[]}})})},54354:(e,t,r)=>{function a(e,t,r,a=e=>e.id,i=()=>!0){}function i({socket:e,events:t=[],onRefresh:r,intervalMs:a,enabled:i=!0,debounceMs:o}){}r.d(t,{D:()=>i,v:()=>a}),r(17577)}};