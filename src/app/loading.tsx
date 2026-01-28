import { Spin } from "antd";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto">
            <Spin size="large" />
        </div>
    );
}