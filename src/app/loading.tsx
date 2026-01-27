import { Spin } from "antd";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white/90 dark:bg-zinc-800/90 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 min-w-[200px] border border-white/20">
                <Spin size="large" />
            </div>
        </div>
    );
}