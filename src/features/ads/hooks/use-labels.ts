import { useState, useEffect } from 'react';

export interface AdLabel {
  id: string;
  name: string;
  color: string;
}

export const PREDEFINED_COLORS = [
  '#fadb14', // Yellow
  '#ff7a45', // Orange
  '#13c2c2', // Cyan
  '#722ed1', // Purple
  '#eb2f96', // Pink
  '#1890ff', // Blue
];

export function useLabels() {
  const [labels, setLabels] = useState<AdLabel[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('ad_global_labels');
    if (stored) {
      try {
        setLabels(JSON.parse(stored));
      } catch (e) {
        setLabels([]);
      }
    }
  }, []);

  const addLabel = (name: string, color: string) => {
    const newLabel: AdLabel = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      color,
    };
    const updated = [...labels, newLabel];
    setLabels(updated);
    localStorage.setItem('ad_global_labels', JSON.stringify(updated));
    return newLabel;
  };

  const removeLabel = (id: string) => {
    const updated = labels.filter((l) => l.id !== id);
    setLabels(updated);
    localStorage.setItem('ad_global_labels', JSON.stringify(updated));
  };

  return { labels, addLabel, removeLabel };
}
