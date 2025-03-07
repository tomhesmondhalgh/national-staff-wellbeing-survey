
import React from 'react';
import StatusSelector from './StatusSelector';
import EditableCell from './EditableCell';
import NotesActions from './NotesActions';
import { ActionPlanDescriptor, DescriptorStatus } from '@/types/actionPlan';

interface DescriptorRowProps {
  descriptor: ActionPlanDescriptor;
  editingCell: { id: string; field: string } | null;
  editValue: string;
  onEditStart: (id: string, field: string, value: string) => void;
  onEditValueChange: (value: string) => void;
  onEditSave: () => void;
  onStatusChange: (id: string, status: DescriptorStatus) => void;
  onDateChange: (id: string, date: string) => void;
  onViewNotes: (id: string) => void;
  onAddNote: (id: string) => void;
}

const DescriptorRow: React.FC<DescriptorRowProps> = ({
  descriptor,
  editingCell,
  editValue,
  onEditStart,
  onEditValueChange,
  onEditSave,
  onStatusChange,
  onDateChange,
  onViewNotes,
  onAddNote
}) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="p-2 border border-gray-200 font-medium text-gray-700">
        {descriptor.index_number}
      </td>
      <td className="p-2 border border-gray-200 text-sm text-left">
        {descriptor.descriptor_text}
      </td>
      <td className="p-2 border border-gray-200">
        <StatusSelector
          status={descriptor.status}
          deadline={descriptor.deadline}
          onStatusChange={(status) => onStatusChange(descriptor.id, status)}
          onDateChange={(date) => onDateChange(descriptor.id, date)}
        />
      </td>
      <td className="p-2 border border-gray-200">
        <EditableCell
          id={descriptor.id}
          field="assigned_to"
          value={descriptor.assigned_to || ''}
          placeholder="Click to assign"
          isEditing={editingCell?.id === descriptor.id && editingCell?.field === 'assigned_to'}
          editValue={editValue}
          onEditStart={onEditStart}
          onEditChange={onEditValueChange}
          onEditSave={onEditSave}
          isMultiline={false}
        />
      </td>
      <td className="p-2 border border-gray-200">
        <EditableCell
          id={descriptor.id}
          field="key_actions"
          value={descriptor.key_actions || ''}
          placeholder="Click to add key actions"
          isEditing={editingCell?.id === descriptor.id && editingCell?.field === 'key_actions'}
          editValue={editValue}
          onEditStart={onEditStart}
          onEditChange={onEditValueChange}
          onEditSave={onEditSave}
          isMultiline={true}
        />
      </td>
      <td className="p-2 border border-gray-200">
        <NotesActions
          notesCount={descriptor.progress_notes_count}
          onViewNotes={() => onViewNotes(descriptor.id)}
          onAddNote={() => onAddNote(descriptor.id)}
        />
      </td>
    </tr>
  );
};

export default DescriptorRow;
