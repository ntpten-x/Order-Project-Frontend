import { RealtimeEvents } from "../realtimeEvents";

const ORDER_EVENTS = [
    RealtimeEvents.orders.create,
    RealtimeEvents.orders.update,
    RealtimeEvents.orders.delete,
];

const PAYMENT_EVENTS = [
    RealtimeEvents.payments.create,
    RealtimeEvents.payments.update,
    RealtimeEvents.payments.delete,
];

const ORDER_ITEM_EVENTS = [
    RealtimeEvents.salesOrderItem.create,
    RealtimeEvents.salesOrderItem.update,
    RealtimeEvents.salesOrderItem.delete,
];

const ORDER_DETAIL_EVENTS = [
    RealtimeEvents.salesOrderDetail.create,
    RealtimeEvents.salesOrderDetail.update,
    RealtimeEvents.salesOrderDetail.delete,
];

const ORDER_QUEUE_EVENTS = [
    RealtimeEvents.orderQueue.added,
    RealtimeEvents.orderQueue.updated,
    RealtimeEvents.orderQueue.removed,
    RealtimeEvents.orderQueue.reordered,
];

const dedupe = (events: string[]): string[] => Array.from(new Set(events));

export const ORDER_REALTIME_EVENTS = dedupe([
    ...ORDER_EVENTS,
    ...PAYMENT_EVENTS,
    ...ORDER_ITEM_EVENTS,
    ...ORDER_DETAIL_EVENTS,
    ...ORDER_QUEUE_EVENTS,
]);
