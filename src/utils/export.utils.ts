"use client";

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

dayjs.locale('th');

// Types
export interface SalesSummaryExport {
    date: string;
    total_orders: number;
    total_sales: number;
    cash_sales: number;
    qr_sales: number;
    total_discount: number;
}

export interface TopItemExport {
    product_name: string;
    total_quantity: number;
    total_revenue: number;
}

export interface ShiftSummaryExport {
    shift_id: string;
    user_name: string;
    open_time: string;
    close_time: string;
    start_amount: number;
    expected_amount: number;
    end_amount: number;
    diff_amount: number;
    total_sales: number;
    cash_sales: number;
    qr_sales: number;
    order_count: number;
}

// PDF Export for Sales Report
export const exportSalesReportPDF = (
    salesData: SalesSummaryExport[],
    topItems: TopItemExport[],
    dateRange: [string, string],
    shopName: string = 'ร้านค้า POS'
) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(18);
    doc.text(shopName, pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.text('รายงานยอดขาย', pageWidth / 2, 30, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`ช่วงวันที่: ${dateRange[0]} - ${dateRange[1]}`, pageWidth / 2, 38, { align: 'center' });
    doc.text(`พิมพ์เมื่อ: ${dayjs().format('DD/MM/YYYY HH:mm')}`, pageWidth / 2, 44, { align: 'center' });

    // Summary Stats
    const totalSales = salesData.reduce((acc, curr) => acc + Number(curr.total_sales), 0);
    const totalOrders = salesData.reduce((acc, curr) => acc + Number(curr.total_orders), 0);
    const totalDiscount = salesData.reduce((acc, curr) => acc + Number(curr.total_discount), 0);

    doc.setFontSize(12);
    doc.text('สรุปยอดรวม', 14, 55);

    doc.setFontSize(10);
    doc.text(`ยอดขายรวม: ${totalSales.toLocaleString()} บาท`, 14, 63);
    doc.text(`จำนวนออเดอร์: ${totalOrders.toLocaleString()} รายการ`, 14, 70);
    doc.text(`ส่วนลดรวม: ${totalDiscount.toLocaleString()} บาท`, 14, 77);

    // Sales Table
    autoTable(doc, {
        startY: 85,
        head: [['วันที่', 'ออเดอร์', 'ยอดขาย', 'เงินสด', 'QR', 'ส่วนลด']],
        body: salesData.map(row => [
            dayjs(row.date).format('DD/MM/YYYY'),
            row.total_orders.toString(),
            `${Number(row.total_sales).toLocaleString()}`,
            `${Number(row.cash_sales).toLocaleString()}`,
            `${Number(row.qr_sales).toLocaleString()}`,
            `${Number(row.total_discount).toLocaleString()}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [102, 126, 234] },
        styles: { fontSize: 9 }
    });

    // Top Items Section
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.text('สินค้าขายดี 5 อันดับ', 14, finalY);

    autoTable(doc, {
        startY: finalY + 5,
        head: [['อันดับ', 'สินค้า', 'จำนวน', 'ยอดขาย (บาท)']],
        body: topItems.map((item, index) => [
            (index + 1).toString(),
            item.product_name,
            item.total_quantity.toString(),
            Number(item.total_revenue).toLocaleString()
        ]),
        theme: 'grid',
        headStyles: { fillColor: [82, 196, 26] },
        styles: { fontSize: 9 }
    });

    // Save
    doc.save(`รายงานยอดขาย_${dateRange[0]}_${dateRange[1]}.pdf`);
};

// Excel Export for Sales Report
export const exportSalesReportExcel = (
    salesData: SalesSummaryExport[],
    topItems: TopItemExport[],
    dateRange: [string, string]
) => {
    const workbook = XLSX.utils.book_new();

    // Sales Summary Sheet
    const salesHeader = ['วันที่', 'จำนวนออเดอร์', 'ยอดขายรวม', 'เงินสด', 'QR', 'ส่วนลด'];
    const salesRows = salesData.map(row => [
        dayjs(row.date).format('DD/MM/YYYY'),
        row.total_orders,
        Number(row.total_sales),
        Number(row.cash_sales),
        Number(row.qr_sales),
        Number(row.total_discount)
    ]);

    const salesSheet = XLSX.utils.aoa_to_sheet([salesHeader, ...salesRows]);
    XLSX.utils.book_append_sheet(workbook, salesSheet, 'ยอดขายรายวัน');

    // Top Items Sheet
    const itemsHeader = ['อันดับ', 'สินค้า', 'จำนวนขาย', 'ยอดขาย (บาท)'];
    const itemsRows = topItems.map((item, index) => [
        index + 1,
        item.product_name,
        item.total_quantity,
        Number(item.total_revenue)
    ]);

    const itemsSheet = XLSX.utils.aoa_to_sheet([itemsHeader, ...itemsRows]);
    XLSX.utils.book_append_sheet(workbook, itemsSheet, 'สินค้าขายดี');

    // Summary Sheet
    const totalSales = salesData.reduce((acc, curr) => acc + Number(curr.total_sales), 0);
    const totalOrders = salesData.reduce((acc, curr) => acc + Number(curr.total_orders), 0);
    const totalDiscount = salesData.reduce((acc, curr) => acc + Number(curr.total_discount), 0);

    const summaryData = [
        ['รายงานยอดขาย'],
        [`ช่วงวันที่: ${dateRange[0]} - ${dateRange[1]}`],
        [],
        ['รายการ', 'ยอดรวม'],
        ['ยอดขายรวม', totalSales],
        ['จำนวนออเดอร์', totalOrders],
        ['ส่วนลดรวม', totalDiscount]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'สรุป');

    // Save
    XLSX.writeFile(workbook, `รายงานยอดขาย_${dateRange[0]}_${dateRange[1]}.xlsx`);
};

// Shift Summary PDF Export
export const exportShiftSummaryPDF = (
    shift: ShiftSummaryExport,
    orders: { order_no: string; total_amount: number; payment_method: string; create_date: string }[],
    shopName: string = 'ร้านค้า POS'
) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(18);
    doc.text(shopName, pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.text('รายงานสรุปกะ', pageWidth / 2, 30, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`พนักงาน: ${shift.user_name}`, 14, 45);
    doc.text(`เปิดกะ: ${shift.open_time}`, 14, 52);
    doc.text(`ปิดกะ: ${shift.close_time}`, 14, 59);

    // Cash Summary
    doc.setFontSize(12);
    doc.text('สรุปเงินสด', 14, 72);

    autoTable(doc, {
        startY: 77,
        body: [
            ['เงินสดเริ่มต้น', `${Number(shift.start_amount).toLocaleString()} บาท`],
            ['ยอดขายรวม', `${Number(shift.total_sales).toLocaleString()} บาท`],
            ['เงินสด', `${Number(shift.cash_sales).toLocaleString()} บาท`],
            ['QR', `${Number(shift.qr_sales).toLocaleString()} บาท`],
            ['ยอดที่ควรมี', `${Number(shift.expected_amount).toLocaleString()} บาท`],
            ['เงินสดจริง', `${Number(shift.end_amount).toLocaleString()} บาท`],
            ['ผลต่าง', `${Number(shift.diff_amount).toLocaleString()} บาท`]
        ],
        theme: 'plain',
        styles: { fontSize: 10 },
        columnStyles: { 0: { fontStyle: 'bold' } }
    });

    // Orders in this shift
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.text(`รายการออเดอร์ (${orders.length} รายการ)`, 14, finalY);

    autoTable(doc, {
        startY: finalY + 5,
        head: [['เลขที่', 'เวลา', 'วิธีชำระ', 'ยอดเงิน']],
        body: orders.map(order => [
            `#${order.order_no}`,
            dayjs(order.create_date).format('HH:mm'),
            order.payment_method,
            `${Number(order.total_amount).toLocaleString()} บาท`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [102, 126, 234] },
        styles: { fontSize: 9 }
    });

    // Footer
    const footerY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(9);
    doc.text(`พิมพ์เมื่อ: ${dayjs().format('DD/MM/YYYY HH:mm:ss')}`, pageWidth / 2, footerY, { align: 'center' });

    // Save
    doc.save(`สรุปกะ_${shift.user_name}_${dayjs(shift.close_time).format('YYYYMMDD_HHmm')}.pdf`);
};
