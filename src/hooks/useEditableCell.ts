
import { useState } from 'react';

type EditingCell = { id: string; field: string } | null;

export function useEditableCell() {
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [editValue, setEditValue] = useState('');

  const handleEditStart = (id: string, field: string, value: string) => {
    setEditingCell({ id, field });
    setEditValue(value || '');
  };

  const handleEditCancel = () => {
    setEditingCell(null);
  };

  return {
    editingCell,
    editValue,
    setEditValue,
    handleEditStart,
    handleEditCancel,
    setEditingCell
  };
}
