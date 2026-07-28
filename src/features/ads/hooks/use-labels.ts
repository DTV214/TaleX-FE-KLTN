import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adsApi, AdLabel } from '../api/ads-api';
import { toast } from 'sonner';

export const PREDEFINED_COLORS = [
  '#fadb14', // Yellow
  '#ff7a45', // Orange
  '#13c2c2', // Cyan
  '#722ed1', // Purple
  '#eb2f96', // Pink
  '#1890ff', // Blue
];

export const useLabels = () => {
  const queryClient = useQueryClient();

  const { data: labels = [], isLoading } = useQuery({
    queryKey: ['ad_labels'],
    queryFn: adsApi.getLabels,
  });

  const createMutation = useMutation({
    mutationFn: adsApi.createLabel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad_labels'] });
    },
    onError: () => {
      toast.error('Failed to create label');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: adsApi.deleteLabel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad_labels'] });
    },
    onError: () => {
      toast.error('Failed to delete label');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (params: { id: string, name: string, color: string }) => adsApi.updateLabel(params.id, { name: params.name, color: params.color }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad_labels'] });
    },
    onError: () => {
      toast.error('Failed to update label');
    }
  });

  return {
    labels,
    isLoading,
    addLabel: (name: string, color: string) => createMutation.mutateAsync({ name, color }),
    editLabel: (id: string, name: string, color: string) => updateMutation.mutateAsync({ id, name, color }),
    removeLabel: (id: string) => deleteMutation.mutateAsync(id),
  };
};

export type { AdLabel };
