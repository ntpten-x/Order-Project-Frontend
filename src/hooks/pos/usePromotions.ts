import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useContext, useEffect } from 'react';
import { SocketContext } from '../../contexts/SocketContext';
import { promotionsService } from '../../services/pos/promotions.service';
import { Promotions, ValidatePromotionDTO } from '../../types/api/pos/promotions';
import { message } from 'antd';

export function usePromotions() {
    const { socket } = useContext(SocketContext);
    const queryClient = useQueryClient();
    const queryKey = ['promotions', 'active'];

    const { data = [], isLoading, refetch } = useQuery<Promotions[]>({
        queryKey,
        queryFn: async () => {
            return await promotionsService.getActivePromotions();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Real-time updates
    useEffect(() => {
        if (!socket) return;

        const handlePromotionUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['promotions'] });
        };

        socket.on('promotions:updated', handlePromotionUpdate);

        return () => {
            socket.off('promotions:updated', handlePromotionUpdate);
        };
    }, [socket, queryClient]);

    const validatePromotionMutation = useMutation({
        mutationFn: (data: ValidatePromotionDTO) => promotionsService.validatePromotion(data),
    });

    const applyPromotionMutation = useMutation({
        mutationFn: (code: string) => promotionsService.applyPromotion(code),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['promotions'] });
            message.success('ใช้โปรโมชันสำเร็จ');
        },
        onError: (error: Error) => {
            message.error(error.message || 'ไม่สามารถใช้โปรโมชันได้');
        },
    });

    return {
        promotions: data,
        isLoading,
        refetch,
        validatePromotion: validatePromotionMutation.mutateAsync,
        applyPromotion: applyPromotionMutation.mutateAsync,
        isValidating: validatePromotionMutation.isPending,
        isApplying: applyPromotionMutation.isPending,
    };
}
