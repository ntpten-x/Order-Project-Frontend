
export enum ShiftStatus {
    OPEN = "OPEN",
    CLOSED = "CLOSED"
}

export interface Shift {
    id: string;
    user_id: string;
    start_amount: number;
    end_amount?: number;
    expected_amount?: number;
    diff_amount?: number;
    status: ShiftStatus;
    open_time: string;
    close_time?: string;
    create_date: string;
    update_date: string;
}
