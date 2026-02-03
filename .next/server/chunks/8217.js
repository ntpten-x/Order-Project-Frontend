exports.id=8217,exports.ids=[8217],exports.modules={2643:(t,e,r)=>{"use strict";r.d(e,{Z:()=>s});var a=r(17577);let o={icon:{tag:"svg",attrs:{viewBox:"64 64 896 896",focusable:"false"},children:[{tag:"path",attrs:{d:"M872 474H286.9l350.2-304c5.6-4.9 2.2-14-5.2-14h-88.5c-3.9 0-7.6 1.4-10.5 3.9L155 487.8a31.96 31.96 0 000 48.3L535.1 866c1.5 1.3 3.3 2 5.2 2h91.5c7.4 0 10.8-9.2 5.2-14L286.9 550H872c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z"}}]},name:"arrow-left",theme:"outlined"};var i=r(74082);function n(){return(n=Object.assign?Object.assign.bind():function(t){for(var e=1;e<arguments.length;e++){var r=arguments[e];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(t[a]=r[a])}return t}).apply(this,arguments)}let s=a.forwardRef((t,e)=>a.createElement(i.Z,n({},t,{ref:e,icon:o})))},63699:function(t,e,r){var a;a=function(t){"use strict";var e={name:"th",weekdays:"อาทิตย์_จันทร์_อังคาร_พุธ_พฤหัสบดี_ศุกร์_เสาร์".split("_"),weekdaysShort:"อาทิตย์_จันทร์_อังคาร_พุธ_พฤหัส_ศุกร์_เสาร์".split("_"),weekdaysMin:"อา._จ._อ._พ._พฤ._ศ._ส.".split("_"),months:"มกราคม_กุมภาพันธ์_มีนาคม_เมษายน_พฤษภาคม_มิถุนายน_กรกฎาคม_สิงหาคม_กันยายน_ตุลาคม_พฤศจิกายน_ธันวาคม".split("_"),monthsShort:"ม.ค._ก.พ._มี.ค._เม.ย._พ.ค._มิ.ย._ก.ค._ส.ค._ก.ย._ต.ค._พ.ย._ธ.ค.".split("_"),formats:{LT:"H:mm",LTS:"H:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY เวลา H:mm",LLLL:"วันddddที่ D MMMM YYYY เวลา H:mm"},relativeTime:{future:"อีก %s",past:"%sที่แล้ว",s:"ไม่กี่วินาที",m:"1 นาที",mm:"%d นาที",h:"1 ชั่วโมง",hh:"%d ชั่วโมง",d:"1 วัน",dd:"%d วัน",M:"1 เดือน",MM:"%d เดือน",y:"1 ปี",yy:"%d ปี"},ordinal:function(t){return t+"."}};return(t&&"object"==typeof t&&"default"in t?t:{default:t}).default.locale(e,null,!0),e},t.exports=a(r(88295))},4106:(t,e,r)=>{"use strict";r.d(e,{Z:()=>k});var a=r(10326),o=r(77626),i=r.n(o),n=r(17577),s=r(58184),d=r(54547),m=r(75958),l=r(71935),p=r(9136),c=r(38815),b=r(56811),f=r(7059);let x={icon:{tag:"svg",attrs:{viewBox:"64 64 896 896",focusable:"false"},children:[{tag:"path",attrs:{d:"M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 708c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40zm62.9-219.5a48.3 48.3 0 00-30.9 44.8V620c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8v-21.5c0-23.1 6.7-45.9 19.9-64.9 12.9-18.6 30.9-32.8 52.1-40.9 34-13.1 56-41.6 56-72.7 0-44.1-43.1-80-96-80s-96 35.9-96 80v7.6c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V420c0-39.3 17.2-76 48.4-103.3C430.4 290.4 470 276 512 276s81.6 14.5 111.6 40.7C654.8 344 672 380.7 672 420c0 57.8-38.1 109.8-97.1 132.5z"}}]},name:"question-circle",theme:"filled"};var h=r(74082);function g(){return(g=Object.assign?Object.assign.bind():function(t){for(var e=1;e<arguments.length;e++){var r=arguments[e];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(t[a]=r[a])}return t}).apply(this,arguments)}let u=n.forwardRef((t,e)=>n.createElement(h.Z,g({},t,{ref:e,icon:x}))),{Title:y,Text:w}=s.default,k=({open:t,type:e="confirm",title:r,content:o,okText:n="ยืนยัน",cancelText:s="ยกเลิก",onOk:x,onCancel:h,loading:g=!1,icon:k})=>{let S=()=>{switch(e){case"danger":return"#ff4d4f";case"warning":return"#faad14";case"success":return"#52c41a";default:return"#1890ff"}},v=S();return a.jsx(d.ZP,{theme:{components:{Modal:{contentBg:"#ffffff",headerBg:"#ffffff",borderRadiusLG:24},Button:{borderRadius:12,controlHeightLG:48,fontSizeLG:16,fontWeight:600}}},children:(0,a.jsxs)(m.Z,{open:t,onCancel:h,footer:null,centered:!0,width:360,closable:!1,styles:{mask:{backdropFilter:"blur(8px)",background:"rgba(0, 0, 0, 0.25)"}},className:"soft-confirm-modal",children:[(0,a.jsxs)("div",{style:{padding:"32px 24px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"},className:"jsx-14a62d28233e1b8c",children:[a.jsx("div",{style:{marginBottom:20,width:80,height:80,borderRadius:"40%",backgroundColor:`${v}15`,display:"flex",alignItems:"center",justifyContent:"center",animation:"float 3s ease-in-out infinite"},className:"jsx-14a62d28233e1b8c",children:(()=>{if(k)return k;let t={fontSize:48,color:S()};switch(e){case"danger":return a.jsx(p.Z,{style:t});case"warning":return a.jsx(c.Z,{style:t});case"success":return a.jsx(b.Z,{style:t});case"info":return a.jsx(f.Z,{style:t});default:return a.jsx(u,{style:t})}})()}),a.jsx(y,{level:4,style:{marginBottom:12,fontWeight:700,color:"#1f1f1f"},children:r}),a.jsx("div",{style:{marginBottom:32,width:"100%"},className:"jsx-14a62d28233e1b8c",children:"string"==typeof o?a.jsx(w,{type:"secondary",style:{fontSize:16,lineHeight:1.6},children:o}):o}),(0,a.jsxs)("div",{style:{width:"100%",display:"flex",gap:12,flexDirection:"row"},className:"jsx-14a62d28233e1b8c",children:[a.jsx(l.ZP,{block:!0,size:"large",onClick:h,disabled:g,style:{border:"none",background:"#f5f5f5",color:"#595959",boxShadow:"none"},className:"hover-scale",children:s}),a.jsx(l.ZP,{block:!0,type:"primary",size:"large",onClick:x,loading:g,style:{background:v,border:"none",boxShadow:`0 8px 20px ${v}40`},className:"hover-scale",children:n})]})]}),a.jsx(i(),{id:"14a62d28233e1b8c",children:"@-webkit-keyframes float{0%{-webkit-transform:translatey(0px);transform:translatey(0px)}50%{-webkit-transform:translatey(-5px);transform:translatey(-5px)}100%{-webkit-transform:translatey(0px);transform:translatey(0px)}}@-moz-keyframes float{0%{-moz-transform:translatey(0px);transform:translatey(0px)}50%{-moz-transform:translatey(-5px);transform:translatey(-5px)}100%{-moz-transform:translatey(0px);transform:translatey(0px)}}@-o-keyframes float{0%{-o-transform:translatey(0px);transform:translatey(0px)}50%{-o-transform:translatey(-5px);transform:translatey(-5px)}100%{-o-transform:translatey(0px);transform:translatey(0px)}}@keyframes float{0%{-webkit-transform:translatey(0px);-moz-transform:translatey(0px);-o-transform:translatey(0px);transform:translatey(0px)}50%{-webkit-transform:translatey(-5px);-moz-transform:translatey(-5px);-o-transform:translatey(-5px);transform:translatey(-5px)}100%{-webkit-transform:translatey(0px);-moz-transform:translatey(0px);-o-transform:translatey(0px);transform:translatey(0px)}}.hover-scale{-webkit-transition:-webkit-transform.2s cubic-bezier(.34,1.56,.64,1);-moz-transition:-moz-transform.2s cubic-bezier(.34,1.56,.64,1);-o-transition:-o-transform.2s cubic-bezier(.34,1.56,.64,1);transition:-webkit-transform.2s cubic-bezier(.34,1.56,.64,1);transition:-moz-transform.2s cubic-bezier(.34,1.56,.64,1);transition:-o-transform.2s cubic-bezier(.34,1.56,.64,1);transition:transform.2s cubic-bezier(.34,1.56,.64,1)}.hover-scale:active{-webkit-transform:scale(.96);-moz-transform:scale(.96);-ms-transform:scale(.96);-o-transform:scale(.96);transform:scale(.96)}@media(max-width:480px){.soft-confirm-modal .ant-modal-content{-webkit-border-radius:20px!important;-moz-border-radius:20px!important;border-radius:20px!important}}.soft-confirm-modal .ant-modal-content{-webkit-box-shadow:0 20px 50px rgba(0,0,0,.1)!important;-moz-box-shadow:0 20px 50px rgba(0,0,0,.1)!important;box-shadow:0 20px 50px rgba(0,0,0,.1)!important;padding:0!important}"})]})})}},80440:(t,e,r)=>{"use strict";r.d(e,{s:()=>i});var a=r(17577),o=r(19211);let i=()=>(0,a.useContext)(o.J)},24297:(t,e,r)=>{"use strict";r.d(e,{E:()=>n});var a=r(12529);let o=r(40820).q.POS.PAYMENT_METHODS,i=(t,e="application/json")=>{let r={};return e&&(r["Content-Type"]=e),t&&(r.Cookie=t),r},n={getAll:async(t,e)=>{let r=(0,a.b)("GET",o),n=new URLSearchParams(e||"");n.has("page")||n.set("page","1"),n.has("limit")||n.set("limit","200");let s=n.toString();s&&(r+=`?${s}`);let d=i(t,""),m=await fetch(r,{cache:"no-store",headers:d,credentials:"include"});if(!m.ok){let t=await m.json().catch(()=>({}));throw Error(t.error||t.message||"Failed to fetch payment methods")}return m.json()},getById:async(t,e)=>{let r=(0,a.b)("GET",`${o}/${t}`),n=i(e,""),s=await fetch(r,{cache:"no-store",headers:n,credentials:"include"});if(!s.ok){let t=await s.json().catch(()=>({}));throw Error(t.error||t.message||"Failed to fetch payment method")}return s.json()},getByName:async(t,e)=>{let r=(0,a.b)("GET",`${o}/getByName/${t}`),n=i(e,""),s=await fetch(r,{cache:"no-store",headers:n,credentials:"include"});if(!s.ok){let t=await s.json().catch(()=>({}));throw Error(t.error||t.message||"Failed to fetch payment method")}return s.json()},create:async(t,e,r)=>{let n=(0,a.b)("POST",`${o}`),s=i(e);r&&(s["X-CSRF-Token"]=r);let d=await fetch(n,{method:"POST",headers:s,credentials:"include",body:JSON.stringify(t)});if(!d.ok){let t=await d.json().catch(()=>({}));throw Error(t.error||t.message||"Failed to create payment method")}return d.json()},update:async(t,e,r,n)=>{let s=(0,a.b)("PUT",`${o}/${t}`),d=i(r);n&&(d["X-CSRF-Token"]=n);let m=await fetch(s,{method:"PUT",headers:d,credentials:"include",body:JSON.stringify(e)});if(!m.ok){let t=await m.json().catch(()=>({}));throw Error(t.error||t.message||"Failed to update payment method")}return m.json()},delete:async(t,e,r)=>{let n=(0,a.b)("DELETE",`${o}/${t}`),s=i(e,"");r&&(s["X-CSRF-Token"]=r);let d=await fetch(n,{method:"DELETE",headers:s,credentials:"include"});if(!d.ok){let t=await d.json().catch(()=>({}));throw Error(t.error||t.message||"Failed to delete payment method")}}}},83717:(t,e,r)=>{"use strict";r.d(e,{F4:()=>o,QF:()=>a,ZW:()=>n,um:()=>s,yn:()=>i});let a={...r(43401).mv,headerGradient:"linear-gradient(145deg, #3B82F6 0%, #60A5FA 50%, #93C5FD 100%)",headerShadow:"0 8px 24px rgba(59, 130, 246, 0.2)",paymentButton:"linear-gradient(135deg, #10B981 0%, #059669 100%)",paymentButtonShadow:"0 6px 16px rgba(16, 185, 129, 0.3)",cardHoverShadow:"0 8px 28px rgba(0, 0, 0, 0.1)",cardActiveShadow:"0 4px 12px rgba(0, 0, 0, 0.08)"},o={container:{minHeight:"100vh",background:a.background,fontFamily:"'Inter', 'Sarabun', sans-serif",paddingBottom:100},heroSection:{background:a.headerGradient,padding:"24px 16px 60px",borderBottomLeftRadius:24,borderBottomRightRadius:24,boxShadow:a.headerShadow,marginBottom:-32},contentWrapper:{maxWidth:1200,margin:"0 auto",padding:"48px 16px 80px",position:"relative"},pageTitle:{margin:0,color:"#fff",fontSize:22,fontWeight:700,marginBottom:4},pageSubtitle:{color:"rgba(255,255,255,0.9)",fontSize:13},card:{borderRadius:20,border:`1px solid ${a.border}`,boxShadow:a.cardShadow,marginBottom:16,background:a.white,transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",overflow:"hidden"},cardHeader:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:12},cardHeaderLeft:{flex:1,minWidth:200},cardTimeTag:{fontSize:12,padding:"4px 10px",marginBottom:8,borderRadius:8,fontWeight:500,background:a.primaryLight,color:a.primary,border:"none"},cardOrderInfo:{display:"flex",alignItems:"center",gap:10,marginBottom:6},cardOrderNo:{fontSize:12,color:a.textSecondary},cardTotal:{fontSize:22,fontWeight:700,color:a.primary,whiteSpace:"nowrap"},itemsList:{flex:1,marginBottom:12},itemRow:{display:"flex",justifyContent:"space-between",marginBottom:14,alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${a.borderLight}`},itemLeft:{display:"flex",gap:12,alignItems:"center",flex:1,minWidth:0},itemImage:{width:44,height:44,borderRadius:10,border:`1px solid ${a.borderLight}`,flexShrink:0,objectFit:"cover"},itemImagePlaceholder:{width:44,height:44,borderRadius:10,background:a.backgroundSecondary,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},itemInfo:{minWidth:0,flex:1},itemNameRow:{display:"flex",alignItems:"center",gap:8,marginBottom:4},itemQuantityTag:{margin:0,padding:"2px 6px",fontSize:11,fontWeight:600,borderRadius:6,background:a.primaryLight,color:a.primary,border:"none"},itemName:{fontSize:15,fontWeight:600,color:a.text},itemPrice:{fontSize:13,color:a.textSecondary,display:"block",marginTop:2},itemNotes:{fontSize:11,color:a.warning,fontStyle:"italic",display:"block",marginTop:3},itemTotal:{fontWeight:600,fontSize:15,color:a.text,marginLeft:8,whiteSpace:"nowrap"},paymentButton:{background:a.paymentButton,border:"none",borderRadius:14,height:48,fontWeight:600,fontSize:16,boxShadow:a.paymentButtonShadow,transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"},backButton:{height:44,width:44,borderRadius:14,background:"rgba(255, 255, 255, 0.2)",backdropFilter:"blur(10px)",border:"1px solid rgba(255, 255, 255, 0.3)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s ease"},summaryBox:{background:a.backgroundSecondary,padding:20,borderRadius:16,marginTop:"auto"},emptyCard:{borderRadius:20,border:"none",boxShadow:a.cardShadow,padding:40}},i={...o,methodCard:{borderWidth:2,borderStyle:"solid",borderColor:a.border,borderRadius:16,padding:18,textAlign:"center",cursor:"pointer",background:a.white,transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",minHeight:110},methodCardSelected:{borderColor:a.primary,background:a.primaryLight,transform:"translateY(-2px)",boxShadow:`0 6px 16px ${a.primary}25`},inputArea:{background:a.backgroundSecondary,padding:20,borderRadius:16,border:`1px solid ${a.borderLight}`},qrArea:{textAlign:"center",background:a.white,padding:28,borderRadius:20,border:`2px dashed ${a.primary}`,boxShadow:a.cardShadow},confirmButton:{height:56,borderRadius:16,fontWeight:700,fontSize:18,background:`linear-gradient(135deg, ${a.primary} 0%, ${a.primaryDark} 100%)`,border:"none",boxShadow:`0 8px 20px ${a.primary}30`}},n={...o,heroSection:{...o.heroSection,background:"linear-gradient(145deg, #EC4899 0%, #DB2777 50%, #BE185D 100%)",boxShadow:"0 8px 24px rgba(236, 72, 153, 0.25)"},handoverButton:{height:64,fontSize:18,borderRadius:18,background:"linear-gradient(135deg, #EC4899 0%, #DB2777 100%)",border:"none",fontWeight:700,boxShadow:"0 8px 16px rgba(236, 72, 153, 0.3)"},deliveryInfoCard:{background:a.backgroundSecondary,borderRadius:18,border:`1px dashed ${a.border}`,padding:18},statusIcon:{width:88,height:88,borderRadius:"50%",background:"linear-gradient(145deg, #FDF2F8 0%, #FCE7F3 100%)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",boxShadow:"0 4px 16px rgba(236, 72, 153, 0.15)"}},s=`
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
`},35905:(t,e,r)=>{"use strict";var a;r.d(e,{b:()=>a}),function(t){t.Pending="Pending",t.Success="Success",t.Failed="Failed"}(a||(a={}))},27851:(t,e,r)=>{"use strict";r.d(e,{Od:()=>i,T_:()=>m,VX:()=>n,cc:()=>o,hs:()=>a,si:()=>s,wv:()=>d});let a=(t,e=0)=>{if(!t)return{subtotal:0,discount:0,vat:0,total:0,change:0};let r=Number(t.sub_total||0),a=Number(t.discount_amount||0),o=Number(t.vat||0),i=Number(t.total_amount||0);return{subtotal:r,discount:a,vat:o,total:i,change:Math.max(0,e-i)}},o=(t="",e="")=>{let r=t.toLowerCase(),a=e.toLowerCase();return r.includes("cash")||a.includes("สด")},i=(t="",e="")=>{let r=t.toLowerCase(),a=e.toLowerCase();return r.includes("qr")||r.includes("prompt")||a.includes("qr")||a.includes("พร้อมเพย์")},n=(t="",e="",r=null)=>!i(t,e)||!!r?.promptpay_number,s=[20,50,100,500,1e3],d=()=>"/pos/channels",m=t=>`/pos/orders/${t}`}};