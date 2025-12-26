import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white/90 dark:bg-zinc-800/90 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 min-w-[200px] border border-white/20">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: '#FCD34D' }} spin />} />
                <span className="text-gray-700 dark:text-gray-200 font-medium text-lg animate-pulse">
                    กำลังโหลด...
                </span>
            </div>
        </div>
    );
}